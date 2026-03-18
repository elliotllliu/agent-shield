import { execSync } from "child_process";
import { homedir } from "os";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * njsscan adapter — Node.js security scanner
 * https://github.com/ajinabraham/njsscan (500+ stars)
 */
export class NjsscanAdapter implements EngineAdapter {
  id = "njsscan";
  displayName = "njsscan";
  focus = "Node.js / JavaScript 专项安全检测";
  url = "https://github.com/ajinabraham/njsscan";

  async isAvailable(): Promise<boolean> {
    try {
      execSync("njsscan --version 2>/dev/null", {
        timeout: 10000, stdio: "pipe", shell: "/bin/bash",
        env: { ...process.env, PATH: `${homedir()}/.local/bin:${homedir()}/.agentshield/bin:${process.env.PATH}` },
      });
      return true;
    } catch { return false; }
  }

  installInstructions(): string { return "pipx install njsscan"; }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    if (!(await this.isAvailable())) {
      return { engine: this.id, displayName: this.displayName, available: false, findings: null, error: "Not installed", durationMs: Date.now() - start, focus: this.focus };
    }
    try {
      let raw = "";
      try {
        raw = execSync(`njsscan --json "${targetDir}" 2>/dev/null`, {
          timeout: 120000, maxBuffer: 10 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
          shell: "/bin/bash",
          env: { ...process.env, PATH: `${homedir()}/.local/bin:${homedir()}/.agentshield/bin:${process.env.PATH}` },
        }).toString();
      } catch (e: any) { if (e.stdout) raw = e.stdout.toString(); }

      const findings: EngineFinding[] = [];
      if (raw.trim()) {
        try {
          const data = JSON.parse(raw);
          // njsscan outputs { "rule_id": { "metadata": {...}, "files": [...] } }
          for (const [ruleId, ruleData] of Object.entries(data)) {
            if (ruleId.startsWith("_")) continue;
            const rd = ruleData as any;
            const meta = rd.metadata || {};
            const files = rd.files || [];
            for (const f of files) {
              findings.push({
                engine: this.id,
                severity: mapSev(meta.severity),
                file: f.file_path || "unknown",
                line: f.match_lines?.[0],
                rule: ruleId,
                message: (meta.description || ruleId).slice(0, 150),
                evidence: (f.match_string || "").slice(0, 80),
                category: mapCategory(meta.cwe || ""),
              });
            }
          }
        } catch { /* parse failed */ }
      }
      return { engine: this.id, displayName: this.displayName, available: true, findings, durationMs: Date.now() - start, focus: this.focus };
    } catch (err) {
      return { engine: this.id, displayName: this.displayName, available: true, findings: null, error: (err as Error).message?.slice(0, 200), durationMs: Date.now() - start, focus: this.focus };
    }
  }
}

function mapSev(s: string): "high" | "medium" | "low" | "info" {
  const l = (s || "").toUpperCase();
  if (l === "ERROR" || l === "HIGH") return "high";
  if (l === "WARNING" || l === "MEDIUM") return "medium";
  if (l === "INFO" || l === "LOW") return "low";
  return "info";
}

function mapCategory(cwe: string): string {
  if (!cwe) return "general";
  if (cwe.includes("78") || cwe.includes("94")) return "code-execution";
  if (cwe.includes("79")) return "xss";
  if (cwe.includes("89")) return "injection";
  return "general";
}
