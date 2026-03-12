import type { Rule, Finding, ScannedFile } from "../types.js";

/**
 * Rule: data-exfil
 * Detects code that reads sensitive files AND sends HTTP requests — a classic exfiltration pattern.
 */

const SENSITIVE_READ_RE =
  /readFile|readFileSync|fs\.read|open\(|\.ssh|\.env|credentials|\.aws|\.kube|\.npmrc|\.gitconfig|\.openclaw/i;

const HTTP_SEND_RE =
  /fetch\s*\(|axios\.|http\.request|https\.request|XMLHttpRequest|\.post\s*\(|\.put\s*\(|urllib|requests\.(post|put|patch)|curl\s/i;

const DYNAMIC_URL_RE =
  /fetch\s*\(\s*`[^`]*\$\{|fetch\s*\(\s*[a-zA-Z_]\w*\s*[+,)]/;

export const dataExfilRule: Rule = {
  id: "data-exfil",
  name: "Data Exfiltration",
  description: "Detects patterns where sensitive data is read and sent over HTTP",

  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];

    for (const file of files) {
      if (file.ext === ".json" || file.ext === ".yaml" || file.ext === ".yml" || file.ext === ".toml" || file.ext === ".md") continue;

      const content = file.content;
      const hasSensitiveRead = SENSITIVE_READ_RE.test(content);
      const hasHttpSend = HTTP_SEND_RE.test(content);

      // Critical: same file reads sensitive data AND sends it out
      if (hasSensitiveRead && hasHttpSend) {
        // Find the specific lines
        const readLines: number[] = [];
        const sendLines: number[] = [];

        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i]!;
          if (SENSITIVE_READ_RE.test(line)) readLines.push(i + 1);
          if (HTTP_SEND_RE.test(line)) sendLines.push(i + 1);
        }

        if (readLines.length > 0 && sendLines.length > 0) {
          findings.push({
            rule: "data-exfil",
            severity: "critical",
            file: file.relativePath,
            line: sendLines[0],
            message: `Reads sensitive data (line ${readLines.join(",")}) and sends HTTP request (line ${sendLines.join(",")}) — possible exfiltration`,
            evidence: file.lines[sendLines[0]! - 1]?.trim().slice(0, 120),
          });
        }
      }

      // Warning: dynamic URL construction in fetch/request calls
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i]!;
        if (DYNAMIC_URL_RE.test(line)) {
          findings.push({
            rule: "data-exfil",
            severity: "warning",
            file: file.relativePath,
            line: i + 1,
            message: "Dynamic URL construction in HTTP request — potential SSRF",
            evidence: line.trim().slice(0, 120),
          });
        }
      }
    }

    return findings;
  },
};
