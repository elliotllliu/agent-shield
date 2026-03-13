import type { Rule, Finding, ScannedFile } from "../types.js";

/**
 * Rule: backdoor
 * Detects eval(), new Function(), child_process.exec() with dynamic strings
 */

const BACKDOOR_PATTERNS: Array<{
  pattern: RegExp;
  desc: string;
  severity: "critical" | "warning";
}> = [
  // JavaScript/TypeScript
  { pattern: /\beval\s*\(/, desc: "eval() with dynamic input", severity: "critical" },
  { pattern: /new\s+Function\s*\(/, desc: "new Function() constructor", severity: "critical" },
  { pattern: /child_process\s*\.\s*exec\s*\(/, desc: "child_process.exec() — use execFile instead", severity: "critical" },
  { pattern: /child_process\s*\.\s*spawn\s*\(.*\bshell\s*:\s*true/, desc: "spawn() with shell: true", severity: "critical" },
  { pattern: /execSync\s*\(\s*`/, desc: "execSync() with template literal", severity: "critical" },
  { pattern: /execSync\s*\(\s*[^"']/, desc: "execSync() with dynamic string", severity: "warning" },
  { pattern: /require\s*\(\s*[^"'`]/, desc: "dynamic require()", severity: "warning" },
  { pattern: /import\s*\(\s*[^"'`]/, desc: "dynamic import()", severity: "warning" },

  // Python
  { pattern: /\bexec\s*\(\s*[^"']/, desc: "Python exec() with dynamic input", severity: "critical" },
  { pattern: /\bos\.system\s*\(/, desc: "os.system() — use subprocess.run instead", severity: "critical" },
  { pattern: /subprocess\.call\s*\(\s*[^[\]].*shell\s*=\s*True/, desc: "subprocess with shell=True", severity: "critical" },
  { pattern: /\b__import__\s*\(/, desc: "dynamic __import__()", severity: "warning" },

  // Shell
  { pattern: /\$\(curl\s/, desc: "command substitution with curl", severity: "critical" },
  { pattern: /\beval\s+\$/, desc: "shell eval with variable", severity: "critical" },
  { pattern: /bash\s+-c\s+\$/, desc: "bash -c with variable", severity: "critical" },
  { pattern: /(?:curl|wget)\s+[^|]*\|\s*(?:bash|sh|zsh|python|node|perl)/, desc: "pipe-to-shell: downloads and executes remote code", severity: "critical" },
  { pattern: /(?:curl|wget)\s+.*-o\s+\S+\s*&&\s*chmod\s+\+x/, desc: "download, chmod +x, execute pattern", severity: "critical" },
];

export const backdoorRule: Rule = {
  id: "backdoor",
  name: "Dynamic Code Execution",
  description: "Detects eval(), exec(), and other dynamic code execution patterns",

  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];

    for (const file of files) {
      if (file.ext === ".json" || file.ext === ".yaml" || file.ext === ".yml" || file.ext === ".toml" || file.ext === ".md") continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i]!;
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

        for (const { pattern, desc, severity } of BACKDOOR_PATTERNS) {
          if (pattern.test(line)) {
            findings.push({
              rule: "backdoor",
              severity,
              file: file.relativePath,
              line: i + 1,
              message: desc,
              evidence: line.trim().slice(0, 120),
            });
            break; // one finding per line
          }
        }
      }
    }

    return findings;
  },
};
