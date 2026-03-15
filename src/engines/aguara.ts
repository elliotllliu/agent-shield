import { execSync } from "child_process";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

export class AguaraAdapter implements EngineAdapter {
  id = "aguara";
  displayName = "Aguara";
  focus = "Prompt injection, data exfiltration, supply-chain attacks (177 rules, NLP + taint tracking)";
  url = "https://github.com/garagon/aguara";

  async isAvailable(): Promise<boolean> {
    try {
      execSync("aguara --version 2>/dev/null", {
        timeout: 5000, stdio: "pipe",
        shell: "/bin/bash",
        env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
      });
      return true;
    } catch {
      return false;
    }
  }

  installInstructions(): string {
    return `curl -fsSL https://raw.githubusercontent.com/garagon/aguara/main/install.sh | bash`;
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
      let raw: string;
      try {
        raw = execSync(`aguara scan "${targetDir}" --format json --no-color 2>/dev/null`, {
          timeout: 120000, stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024,
          shell: "/bin/bash",
          env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
        }).toString();
      } catch (err: any) {
        raw = err.stdout?.toString() || "";
        if (!raw) throw err;
      }

      // Clean non-JSON lines (update notifications, etc.)
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in aguara output");
      const output = raw.slice(jsonStart, jsonEnd + 1);

      const data = JSON.parse(output);
      const findings: EngineFinding[] = (data.findings || []).map((f: any) => ({
        engine: this.id,
        severity: mapNumericSeverity(f.severity),
        file: f.file_path || f.file || "",
        line: f.line,
        rule: f.rule_id || f.rule || "",
        message: f.rule_name || f.description || "",
        evidence: f.matched_text || f.snippet || "",
        confidence: f.confidence ?? 0.7,
        category: f.category || f.rule_id || "",
      }));

      return {
        engine: this.id, displayName: this.displayName,
        version: data.version, available: true, findings,
        durationMs: Date.now() - start, focus: this.focus,
      };
    } catch (err) {
      return {
        engine: this.id, displayName: this.displayName, available: true, findings: null,
        error: (err as Error).message, durationMs: Date.now() - start, focus: this.focus,
      };
    }
  }
}

/** Aguara uses numeric severity: 1=critical, 2=high, 3=medium, 4=low, 5=info */
function mapNumericSeverity(s: number | string): "high" | "medium" | "low" | "info" {
  if (typeof s === "number") {
    if (s <= 2) return "high";
    if (s === 3) return "medium";
    if (s === 4) return "low";
    return "info";
  }
  const lower = (s || "").toLowerCase();
  if (lower === "critical" || lower === "high") return "high";
  if (lower === "medium" || lower === "warning") return "medium";
  if (lower === "low") return "low";
  return "info";
}
