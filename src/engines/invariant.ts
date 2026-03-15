import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * Invariant Labs mcp-scan adapter.
 * Scans MCP server tool descriptions for:
 * - Tool poisoning (hidden instructions in descriptions)
 * - Cross-origin escalation
 * - Rug pull potential
 * https://github.com/invariantlabs-ai/mcp-scan
 */
export class InvariantAdapter implements EngineAdapter {
  id = "invariant";
  displayName = "Invariant mcp-scan";
  focus = "MCP 专项：Tool poisoning、跨域提权、Rug pull 检测";
  url = "https://github.com/invariantlabs-ai/mcp-scan";

  async isAvailable(): Promise<boolean> {
    try {
      execSync("mcp-scan --help 2>/dev/null", {
        timeout: 10000, stdio: "pipe", shell: "/bin/bash",
        env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
      });
      return true;
    } catch {
      return false;
    }
  }

  installInstructions(): string {
    return `pipx install mcp-scan`;
  }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    const available = await this.isAvailable();
    if (!available) {
      return {
        engine: this.id, displayName: this.displayName, available: false, findings: null,
        error: `Not installed. Run: ${this.installInstructions()}`,
        durationMs: Date.now() - start, focus: this.focus,
      };
    }

    try {
      // mcp-scan works on config files. Look for MCP-related configs and source files
      // in the target directory and analyze tool descriptions for poisoning.
      const findings: EngineFinding[] = [];

      // Strategy 1: Check for MCP config files
      const configFiles = findMcpConfigs(targetDir);

      if (configFiles.length > 0) {
        for (const configFile of configFiles) {
          try {
            const raw = execSync(
              `mcp-scan scan --json "${configFile}" 2>/dev/null`,
              {
                timeout: 120000, stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024,
                shell: "/bin/bash",
                env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
              },
            ).toString();

            const jsonStart = raw.indexOf("{");
            if (jsonStart >= 0) {
              const data = JSON.parse(raw.slice(jsonStart));
              if (data.results) {
                for (const r of data.results) {
                  if (r.issues) {
                    for (const issue of r.issues) {
                      findings.push({
                        engine: this.id,
                        severity: mapSeverity(issue.severity || "medium"),
                        file: configFile,
                        rule: issue.type || "tool-poisoning",
                        message: issue.description || issue.message || "MCP tool poisoning detected",
                        evidence: issue.evidence || "",
                        category: "mcp-security",
                      });
                    }
                  }
                }
              }
            }
          } catch { /* config scan failed, continue */ }
        }
      }

      // Strategy 2: Scan source code for suspicious tool description patterns
      const sourceFindings = scanToolDescriptions(targetDir);
      findings.push(...sourceFindings);

      return {
        engine: this.id, displayName: this.displayName,
        available: true, findings,
        durationMs: Date.now() - start, focus: this.focus,
      };
    } catch (err) {
      return {
        engine: this.id, displayName: this.displayName, available: true, findings: null,
        error: (err as Error).message?.slice(0, 200),
        durationMs: Date.now() - start, focus: this.focus,
      };
    }
  }
}

/**
 * Find MCP config files in directory tree.
 */
function findMcpConfigs(dir: string): string[] {
  const configs: string[] = [];
  const configNames = [
    "claude_desktop_config.json", "mcp.json", ".mcp.json",
    "mcp_config.json", "claude_config.json",
  ];

  try {
    const search = (d: string, depth: number) => {
      if (depth > 3) return;
      try {
        for (const entry of readdirSync(d, { withFileTypes: true })) {
          if (entry.isFile() && configNames.includes(entry.name)) {
            configs.push(join(d, entry.name));
          } else if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            search(join(d, entry.name), depth + 1);
          }
        }
      } catch { /* permission denied etc */ }
    };
    search(dir, 0);
  } catch { /* */ }
  return configs;
}

/**
 * Static scan for suspicious tool description patterns.
 * Detects tool poisoning indicators without running mcp-scan against live servers.
 */
function scanToolDescriptions(dir: string): EngineFinding[] {
  const findings: EngineFinding[] = [];
  const poisonPatterns = [
    { pattern: /\<IMPORTANT\>/i, msg: "Tool description contains <IMPORTANT> tag — common tool poisoning indicator" },
    { pattern: /ignore\s+(?:all\s+)?(?:previous|above)\s+instructions/i, msg: "Tool description attempts to override agent instructions" },
    { pattern: /do\s+not\s+(?:tell|inform|mention|reveal)/i, msg: "Tool description contains concealment instruction" },
    { pattern: /\u200b|\u200c|\u200d|\ufeff/g, msg: "Tool description contains invisible Unicode characters" },
    { pattern: /when\s+(?:called|invoked|used),?\s+(?:first|also|always)\s+(?:call|invoke|use|run)/i, msg: "Tool description chains to other tools — possible cross-origin escalation" },
  ];

  try {
    const scanFile = (filePath: string) => {
      try {
        const content = readFileSync(filePath, "utf-8");
        // Look for tool/function definitions with descriptions
        const descRegex = /(?:description|desc|help|summary)\s*[:=]\s*["`']([^"`']{20,})["`']/gi;
        let match;
        while ((match = descRegex.exec(content)) !== null) {
          const desc = match[1]!;
          for (const pp of poisonPatterns) {
            if (pp.pattern.test(desc)) {
              const line = content.slice(0, match.index).split("\n").length;
              findings.push({
                engine: "invariant",
                severity: "high",
                file: filePath,
                line,
                rule: "tool-poisoning",
                message: pp.msg,
                evidence: desc.slice(0, 100),
                category: "mcp-security",
              });
            }
          }
        }
      } catch { /* */ }
    };

    const walk = (d: string, depth: number) => {
      if (depth > 5) return;
      try {
        for (const entry of readdirSync(d, { withFileTypes: true })) {
          const full = join(d, entry.name);
          if (entry.isFile() && /\.(ts|js|py|json|yaml|yml)$/.test(entry.name)) {
            scanFile(full);
          } else if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            walk(full, depth + 1);
          }
        }
      } catch { /* */ }
    };
    walk(dir, 0);
  } catch { /* */ }

  return findings;
}

function mapSeverity(s: string): "high" | "medium" | "low" | "info" {
  const lower = (s || "").toLowerCase();
  if (lower === "critical" || lower === "high") return "high";
  if (lower === "medium" || lower === "warning") return "medium";
  if (lower === "low") return "low";
  return "info";
}
