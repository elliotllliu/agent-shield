import type { Rule, Finding, ScannedFile } from "../types.js";

/**
 * Rule: cross-file
 * Cross-file correlation analysis — detects attack patterns that span multiple files.
 * This is a capability that single-file scanners (like Snyk Agent Scan) cannot do.
 *
 * Checks:
 * 1. Data flow: File A reads secrets → File B sends HTTP (cross-file exfiltration)
 * 2. Code injection: File A receives input → File B passes to eval/exec
 * 3. Capability mismatch: manifest/config declares X, code does Y
 * 4. Import chain: suspicious module imports across the project
 */

// === Data sources (where sensitive data originates) ===
const SECRET_READ_PATTERNS = [
  /readFileSync\s*\([^)]*(?:\.ssh|\.env|\.aws|credentials|private.?key|secret)/i,
  /open\s*\([^)]*(?:\.ssh|\.env|\.aws|credentials|private.?key|secret)/i,
  /os\.environ\s*\[/,
  /os\.getenv\s*\(/,
  /process\.env\s*\./,
  /process\.env\s*\[/,
];

// === Data sinks (where data leaves the system) ===
const HTTP_SINK_PATTERNS = [
  /fetch\s*\(\s*["'`]https?:\/\/(?!localhost|127\.0\.0\.1)/,
  /requests\.(post|put|patch)\s*\(\s*["'`]https?:\/\//,
  /axios\.(post|put|patch)\s*\(/,
  /urllib\.request\.urlopen/,
  /http\.request\s*\(/,
  /\.post\s*\(\s*["'`]https?:\/\/(?!localhost|127\.0\.0\.1)/,
];

// === Code injection sinks ===
const EXEC_SINK_PATTERNS = [
  /\beval\s*\(\s*[a-zA-Z_]/,
  /\bexec\s*\(\s*[a-zA-Z_]/,
  /new\s+Function\s*\(/,
  /child_process\.\s*exec\s*\(/,
  /subprocess\.(?:call|run|Popen)\s*\(/,
  /os\.system\s*\(/,
];

// === User input sources ===
const INPUT_SOURCE_PATTERNS = [
  /req\.(?:body|query|params|headers)\s*[\[.]/,
  /request\.(?:form|args|json|data)\s*[\[.]/,
  /process\.argv/,
  /sys\.argv/,
  // Note: tool_parameters and self.runtime are SDK interfaces, not raw user input
  // They are handled by the framework and don't represent direct injection vectors
];

// === Capability patterns for manifest checking ===
const CAPABILITY_PATTERNS: Record<string, RegExp[]> = {
  network: [
    /fetch\s*\(/, /requests\.\w+\s*\(/, /axios/, /urllib/,
    /http\.request/, /https\.request/, /XMLHttpRequest/,
  ],
  filesystem: [
    /readFile|writeFile|readFileSync|writeFileSync/,
    /open\s*\(/, /os\.path/, /pathlib/,
    /fs\.read|fs\.write|fs\.unlink|fs\.mkdir/,
  ],
  exec: [
    /child_process/, /subprocess/, /os\.system/, /os\.popen/,
    /exec\s*\(/, /eval\s*\(/, /spawn\s*\(/,
  ],
  crypto: [
    /crypto\./, /hashlib\./, /hmac\./, /bcrypt/, /jwt\./,
  ],
};

interface FileSignature {
  file: ScannedFile;
  hasSecretRead: boolean;
  hasHttpSink: boolean;
  hasExecSink: boolean;
  hasInputSource: boolean;
  capabilities: Set<string>;
  exportsModules: string[];
  importsModules: string[];
}

function analyzeFile(file: ScannedFile): FileSignature {
  const content = file.content;
  
  const sig: FileSignature = {
    file,
    hasSecretRead: SECRET_READ_PATTERNS.some(p => p.test(content)),
    hasHttpSink: HTTP_SINK_PATTERNS.some(p => p.test(content)),
    hasExecSink: EXEC_SINK_PATTERNS.some(p => p.test(content)),
    hasInputSource: INPUT_SOURCE_PATTERNS.some(p => p.test(content)),
    capabilities: new Set(),
    exportsModules: [],
    importsModules: [],
  };

  // Detect capabilities
  for (const [cap, patterns] of Object.entries(CAPABILITY_PATTERNS)) {
    if (patterns.some(p => p.test(content))) {
      sig.capabilities.add(cap);
    }
  }

  // Detect imports (Python)
  const pyImports = content.matchAll(/^(?:from|import)\s+([\w.]+)/gm);
  for (const m of pyImports) {
    sig.importsModules.push(m[1]!);
  }

  // Detect imports (JS/TS)
  const jsImports = content.matchAll(/(?:import|require)\s*\(?["'`]([^"'`]+)["'`]\)?/g);
  for (const m of jsImports) {
    sig.importsModules.push(m[1]!);
  }

  return sig;
}

export const crossFileRule: Rule = {
  id: "cross-file",
  name: "Cross-File Correlation",
  description: "Detects attack patterns spanning multiple files (data flow, capability mismatch)",

  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];
    if (files.length < 2) return findings;

    const codeFiles = files.filter(f => 
      [".ts", ".js", ".py", ".sh"].includes(f.ext)
    );
    if (codeFiles.length === 0) return findings;

    // Analyze all code files
    const signatures = codeFiles.map(analyzeFile);

    // === Check 1: Cross-file data exfiltration (needs >= 2 code files) ===
    if (codeFiles.length >= 2) {
    // File A reads secrets, File B (different file) sends HTTP to external
    // Exclude test/debug files — they commonly mock secrets and HTTP
    const secretReaders = signatures.filter(s => s.hasSecretRead && s.file.context !== "test");
    const httpSenders = signatures.filter(s => s.hasHttpSink && s.file.context !== "test");

    for (const reader of secretReaders) {
      for (const sender of httpSenders) {
        if (reader.file.relativePath === sender.file.relativePath) continue;
        
        // Check if they're connected (same module/package or import relationship)
        const readerModule = reader.file.relativePath.replace(/\.[^.]+$/, "").replace(/\//g, ".");
        const connected = sender.importsModules.some(m => 
          readerModule.includes(m) || m.includes(readerModule.split("/").pop()!)
        );

        if (connected) {
          findings.push({
            rule: "cross-file",
            severity: "high",
            file: sender.file.relativePath,
            message: `Cross-file data flow: ${reader.file.relativePath} reads secrets → ${sender.file.relativePath} sends HTTP externally (connected via imports)`,
            confidence: "high",
          });
        } else {
          // Even without direct import, flag if in same directory
          const readerDir = reader.file.relativePath.split("/").slice(0, -1).join("/");
          const senderDir = sender.file.relativePath.split("/").slice(0, -1).join("/");
          if (readerDir === senderDir && readerDir !== "") {
            findings.push({
              rule: "cross-file",
              severity: "medium",
              file: sender.file.relativePath,
              message: `Cross-file data flow risk: ${reader.file.relativePath} reads secrets, ${sender.file.relativePath} sends HTTP (same directory: ${readerDir}/)`,
              confidence: "medium",
            });
          }
        }
      }
    }
    } // end check 1: codeFiles >= 2

    // === Check 2: Cross-file code injection ===
    // File A receives user input, File B passes to eval/exec
    // Exclude test/debug files as input sources — they simulate input, not receive real user data
    if (codeFiles.length >= 2) {
    const inputReceivers = signatures.filter(s => s.hasInputSource && s.file.context !== "test");
    const execSinks = signatures.filter(s => s.hasExecSink && s.file.context !== "test");

    for (const receiver of inputReceivers) {
      for (const executor of execSinks) {
        if (receiver.file.relativePath === executor.file.relativePath) continue;
        
        const receiverModule = receiver.file.relativePath.replace(/\.[^.]+$/, "");
        const connected = executor.importsModules.some(m => 
          receiverModule.includes(m) || m.includes(receiverModule.split("/").pop()!)
        );

        if (connected) {
          findings.push({
            rule: "cross-file",
            severity: "high",
            file: executor.file.relativePath,
            message: `Cross-file code injection risk: ${receiver.file.relativePath} receives input → ${executor.file.relativePath} passes to eval/exec (connected via imports)`,
            confidence: "high",
          });
        }
      }
    }
    } // end codeFiles >= 2

    // === Check 3: Capability mismatch ===
    // manifest.yaml declares limited capabilities, but code uses more
    const manifestFile = files.find(f => 
      f.relativePath === "manifest.yaml" || f.relativePath === "manifest.yml" ||
      f.relativePath === "manifest.json"
    );
    
    if (manifestFile) {
      const manifestCaps = new Set<string>();
      const manifestContent = manifestFile.content.toLowerCase();
      
      // Detect what the manifest claims
      if (/network|http|api|fetch|request/i.test(manifestContent)) manifestCaps.add("network");
      if (/file|read|write|path|directory/i.test(manifestContent)) manifestCaps.add("filesystem");
      if (/exec|command|shell|process/i.test(manifestContent)) manifestCaps.add("exec");
      
      // Check what code actually does (exclude test files)
      const allCodeCaps = new Set<string>();
      for (const sig of signatures) {
        if (sig.file.context === "test") continue;
        for (const cap of sig.capabilities) {
          allCodeCaps.add(cap);
        }
      }

      // Find undeclared capabilities
      for (const cap of allCodeCaps) {
        if (!manifestCaps.has(cap) && cap === "exec") {
          // Exec capability not mentioned in manifest — suspicious
          const execFiles = signatures
            .filter(s => s.capabilities.has("exec"))
            .map(s => s.file.relativePath);
          
          findings.push({
            rule: "cross-file",
            severity: "medium",
            file: manifestFile.relativePath,
            message: `Capability mismatch: manifest doesn't declare '${cap}' but code uses it in: ${execFiles.join(", ")}`,
            confidence: "medium",
          });
        }
      }
    }

    // === Check 4: Suspicious import chains ===
    // Detect files that import known-dangerous modules in unusual ways
    const dangerousModules = new Set([
      "pickle", "marshal", "shelve", "ctypes",
      "webbrowser", "ftplib", "telnetlib",
    ]);

    for (const sig of signatures) {
      const dangerousImports = sig.importsModules.filter(m => 
        dangerousModules.has(m) || dangerousModules.has(m.split(".")[0]!)
      );
      
      if (dangerousImports.length >= 2) {
        findings.push({
          rule: "cross-file",
          severity: "medium",
          file: sig.file.relativePath,
          message: `Multiple dangerous module imports: ${dangerousImports.join(", ")} — review usage carefully`,
          confidence: "medium",
        });
      }
    }

    return findings;
  },
};
