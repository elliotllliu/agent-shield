import { execSync } from "child_process";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

export class TencentGuardAdapter implements EngineAdapter {
  id = "tencent";
  displayName = "Tencent AI-Infra-Guard";
  focus = "LLM-powered code audit: multi-stage agent scanning (requires API key)";
  url = "https://github.com/Tencent/AI-Infra-Guard";

  async isAvailable(): Promise<boolean> {
    try {
      // Tencent Guard is a Go/Docker project — check if compiled binary exists
      execSync("ai-infra-guard version 2>/dev/null || test -f /tmp/AI-Infra-Guard/mcp-scan/main.py", {
        timeout: 5000, stdio: "pipe", shell: "/bin/bash",
      });
      return true;
    } catch {
      return false;
    }
  }

  installInstructions(): string {
    return `git clone https://github.com/Tencent/AI-Infra-Guard && cd AI-Infra-Guard/mcp-scan && pip install -r requirements.txt (requires LLM API key)`;
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
      let output: string;
      try {
        output = execSync(
          `ai-infra-guard scan "${targetDir}" --format json 2>/dev/null || python3 -m ai_infra_guard scan "${targetDir}" --format json 2>/dev/null`,
          { timeout: 120000, stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024, shell: "/bin/bash" },
        ).toString();
      } catch (err: any) {
        output = err.stdout?.toString() || "";
        if (!output) throw err;
      }

      const data = JSON.parse(output);
      const findings: EngineFinding[] = (data.findings || data.results || data.vulnerabilities || []).map((f: any) => ({
        engine: this.id,
        severity: mapSeverity(f.severity || f.level || f.risk),
        file: f.file || f.path || f.location || "",
        line: f.line || f.line_number,
        rule: f.rule || f.rule_id || f.check_id || "",
        message: f.message || f.description || f.title || "",
        evidence: f.evidence || f.snippet || "",
        confidence: f.confidence ?? 0.7,
        category: f.category || f.rule,
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

function mapSeverity(s: string): "high" | "medium" | "low" | "info" {
  const lower = (s || "").toLowerCase();
  if (lower === "critical" || lower === "high") return "high";
  if (lower === "medium" || lower === "warning") return "medium";
  if (lower === "low") return "low";
  return "info";
}
