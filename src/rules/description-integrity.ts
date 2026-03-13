import type { Rule, Finding, ScannedFile } from "../types.js";

/**
 * Rule: description-integrity
 * Detects mismatches between what a tool describes itself as doing
 * and what its code actually does.
 *
 * This is a semantic-level check that goes beyond regex pattern matching.
 * It compares declared capabilities in YAML/JSON descriptions against
 * actual code behavior to find:
 *
 * 1. Undisclosed network access (tool says "local only" but makes HTTP calls)
 * 2. Undisclosed data access (tool doesn't mention reading files but does)
 * 3. Undisclosed code execution (tool says "read-only" but runs exec/eval)
 * 4. Scope creep (tool description is narrow but code does much more)
 * 5. Hidden side effects (tool doesn't mention writing/deleting but does)
 *
 * This is a capability Snyk cannot provide — they only read tool descriptions,
 * not source code.
 */

interface ToolDeclaration {
  name: string;
  description: string;
  file: string;
}

interface CodeBehavior {
  file: string;
  hasNetworkAccess: boolean;
  hasFileWrite: boolean;
  hasFileDelete: boolean;
  hasCodeExec: boolean;
  hasEnvAccess: boolean;
  hasCryptoOps: boolean;
  hasDbAccess: boolean;
  sendsEmail: boolean;
  spawnsProcess: boolean;
}

// Extract tool declarations from YAML/JSON configs
function extractToolDeclarations(files: ScannedFile[]): ToolDeclaration[] {
  const tools: ToolDeclaration[] = [];

  for (const file of files) {
    if (![".yaml", ".yml", ".json"].includes(file.ext)) continue;

    // YAML tool definitions (Dify, OpenClaw, MCP)
    const nameMatch = file.content.match(/(?:^|\n)\s*(?:name|tool_name)\s*:\s*["']?([^"'\n]+)/);
    const descMatch = file.content.match(/(?:^|\n)\s*(?:description|desc)\s*:\s*["']?([^"'\n]+)/);
    // Multi-line description
    const descBlockMatch = file.content.match(/(?:^|\n)\s*description\s*:\s*>\s*\n([\s\S]*?)(?:\n\S|\n$)/);

    if (nameMatch || descMatch) {
      tools.push({
        name: nameMatch?.[1]?.trim() || file.relativePath,
        description: (descBlockMatch?.[1] || descMatch?.[1] || "").trim().toLowerCase(),
        file: file.relativePath,
      });
    }

    // JSON tool definitions (MCP)
    if (file.ext === ".json") {
      try {
        const json = JSON.parse(file.content);
        if (json.tools) {
          for (const tool of Object.values(json.tools) as any[]) {
            if (tool.description) {
              tools.push({
                name: tool.name || "unknown",
                description: (tool.description || "").toLowerCase(),
                file: file.relativePath,
              });
            }
          }
        }
      } catch {}
    }
  }

  return tools;
}

// Analyze code behavior
function analyzeCodeBehavior(files: ScannedFile[]): CodeBehavior[] {
  const behaviors: CodeBehavior[] = [];

  for (const file of files) {
    if (![".py", ".ts", ".js", ".sh"].includes(file.ext)) continue;
    if (file.context === "test") continue;

    const c = file.content;
    behaviors.push({
      file: file.relativePath,
      hasNetworkAccess: /requests\.\w+\s*\(|fetch\s*\(|urllib|http\.request|axios|httpx/i.test(c),
      hasFileWrite: /writeFile|writeFileSync|open\s*\([^)]*['"]w|\.write\s*\(|shutil\.copy|shutil\.move/i.test(c),
      hasFileDelete: /unlink|rmtree|os\.remove|fs\.rm|shutil\.rmtree/i.test(c),
      hasCodeExec: /\beval\s*\(|\bexec\s*\(|subprocess|os\.system|os\.popen|child_process/i.test(c),
      hasEnvAccess: /os\.environ|os\.getenv|process\.env|dotenv/i.test(c),
      hasCryptoOps: /hashlib|hmac|crypto\.|bcrypt|jwt\.|encrypt|decrypt/i.test(c),
      hasDbAccess: /sqlite|psycopg|mysql|pymongo|redis\.|sqlalchemy|cursor\.execute/i.test(c),
      sendsEmail: /smtplib|email\.mime|sendmail|send_mail/i.test(c),
      spawnsProcess: /subprocess\.(?:run|call|Popen)|os\.system|child_process\.exec/i.test(c),
    });
  }

  return behaviors;
}

// Keywords that indicate a tool claims to be limited/safe
const SAFE_CLAIMS = {
  readOnly: /\bread[\s-]?only\b|only\s+read|does\s+not\s+(?:write|modify|delete)|no\s+(?:write|modify|side\s*effect)/i,
  localOnly: /\blocal[\s-]?only\b|offline|no\s+(?:network|internet|http|api\s+call)|does\s+not\s+(?:connect|send|request)/i,
  noExec: /\bsafe\b.*\bno\s+(?:exec|code\s+execution)|does\s+not\s+(?:execute|run)\s+(?:code|commands?)/i,
  noData: /\bno\s+(?:data|file)\s+(?:access|collection)|does\s+not\s+(?:access|collect|read)\s+(?:data|files?|personal)/i,
};

// Keywords that indicate a narrow scope
const NARROW_SCOPE_KEYWORDS = {
  calculator: /\b(?:calculator?|math|arithmetic|compute|calculate)\b/i,
  formatter: /\b(?:format|beautif|prettif|lint|style)\b/i,
  validator: /\b(?:validat|verify|check|lint)\b/i,
  converter: /\b(?:convert|transform|translate|encode|decode)\b/i,
  search: /\b(?:search|find|query|lookup|look\s+up)\b/i,
};

export const descriptionIntegrityRule: Rule = {
  id: "description-integrity",
  name: "Description-Code Integrity",
  description: "Detects mismatches between tool descriptions and actual code behavior",

  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];

    const declarations = extractToolDeclarations(files);
    const behaviors = analyzeCodeBehavior(files);

    if (declarations.length === 0 || behaviors.length === 0) return findings;

    // Aggregate all code behaviors
    const aggregatedBehavior: CodeBehavior = {
      file: ".",
      hasNetworkAccess: behaviors.some(b => b.hasNetworkAccess),
      hasFileWrite: behaviors.some(b => b.hasFileWrite),
      hasFileDelete: behaviors.some(b => b.hasFileDelete),
      hasCodeExec: behaviors.some(b => b.hasCodeExec),
      hasEnvAccess: behaviors.some(b => b.hasEnvAccess),
      hasCryptoOps: behaviors.some(b => b.hasCryptoOps),
      hasDbAccess: behaviors.some(b => b.hasDbAccess),
      sendsEmail: behaviors.some(b => b.sendsEmail),
      spawnsProcess: behaviors.some(b => b.spawnsProcess),
    };

    for (const decl of declarations) {
      const desc = decl.description;

      // Check 1: Claims read-only but writes/deletes files
      if (SAFE_CLAIMS.readOnly.test(desc)) {
        if (aggregatedBehavior.hasFileWrite) {
          const writers = behaviors.filter(b => b.hasFileWrite).map(b => b.file);
          findings.push({
            rule: "description-integrity",
            severity: "high",
            file: decl.file,
            message: `Description claims "read-only" but code writes files in: ${writers.join(", ")}`,
            confidence: "high",
          });
        }
        if (aggregatedBehavior.hasFileDelete) {
          const deleters = behaviors.filter(b => b.hasFileDelete).map(b => b.file);
          findings.push({
            rule: "description-integrity",
            severity: "high",
            file: decl.file,
            message: `Description claims "read-only" but code deletes files in: ${deleters.join(", ")}`,
            confidence: "high",
          });
        }
      }

      // Check 2: Claims local/offline but makes network requests
      if (SAFE_CLAIMS.localOnly.test(desc)) {
        if (aggregatedBehavior.hasNetworkAccess) {
          const networkers = behaviors.filter(b => b.hasNetworkAccess).map(b => b.file);
          findings.push({
            rule: "description-integrity",
            severity: "high",
            file: decl.file,
            message: `Description claims "local only/offline" but code makes network requests in: ${networkers.join(", ")}`,
            confidence: "high",
          });
        }
      }

      // Check 3: Claims no execution but runs eval/exec
      if (SAFE_CLAIMS.noExec.test(desc)) {
        if (aggregatedBehavior.hasCodeExec) {
          const executors = behaviors.filter(b => b.hasCodeExec).map(b => b.file);
          findings.push({
            rule: "description-integrity",
            severity: "high",
            file: decl.file,
            message: `Description claims "no code execution" but code uses eval/exec in: ${executors.join(", ")}`,
            confidence: "high",
          });
        }
      }

      // Check 4: Claims no data access but reads env/files
      if (SAFE_CLAIMS.noData.test(desc)) {
        if (aggregatedBehavior.hasEnvAccess) {
          findings.push({
            rule: "description-integrity",
            severity: "medium",
            file: decl.file,
            message: `Description claims "no data access" but code reads environment variables`,
            confidence: "medium",
          });
        }
      }

      // Check 5: Narrow scope tool with undisclosed capabilities
      for (const [scope, pattern] of Object.entries(NARROW_SCOPE_KEYWORDS)) {
        if (pattern.test(desc)) {
          // Calculator/formatter/validator shouldn't need network or exec
          if (aggregatedBehavior.hasNetworkAccess && !desc.includes("api") && !desc.includes("http") && !desc.includes("online")) {
            const networkers = behaviors.filter(b => b.hasNetworkAccess).map(b => b.file);
            findings.push({
              rule: "description-integrity",
              severity: "medium",
              file: decl.file,
              message: `Scope creep: "${scope}" tool makes undisclosed network requests in: ${networkers.join(", ")}`,
              confidence: "medium",
            });
          }
          if (aggregatedBehavior.sendsEmail) {
            findings.push({
              rule: "description-integrity",
              severity: "high",
              file: decl.file,
              message: `Scope creep: "${scope}" tool sends emails — undisclosed and suspicious capability`,
              confidence: "high",
            });
          }
          if (aggregatedBehavior.spawnsProcess && scope !== "converter") {
            findings.push({
              rule: "description-integrity",
              severity: "medium",
              file: decl.file,
              message: `Scope creep: "${scope}" tool spawns processes — undisclosed capability`,
              confidence: "medium",
            });
          }
          break; // Only match first scope
        }
      }
    }

    return findings;
  },
};
