import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";
import { scan } from "../scanner/index.js";
import type { Finding } from "../types.js";

export class AgentShieldAdapter implements EngineAdapter {
  id = "agentshield";
  displayName = "AgentShield";
  focus = "AI Agent risks: skill hijack, prompt injection, MCP runtime, cross-file attack chains";
  url = "https://github.com/elliotllliu/agent-shield";

  async isAvailable(): Promise<boolean> {
    return true; // Always available — we ARE AgentShield
  }

  installInstructions(): string {
    return "Built-in — always available.";
  }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    try {
      const result = scan(targetDir);
      const findings: EngineFinding[] = result.findings.map((f: Finding) => ({
        engine: this.id,
        severity: f.severity as "high" | "medium" | "low",
        file: f.file,
        line: f.line,
        rule: f.rule,
        message: f.message,
        evidence: f.evidence,
        confidence: f.confidence === "high" ? 0.9 : f.confidence === "medium" ? 0.6 : 0.3,
        category: f.rule,
      }));

      return {
        engine: this.id,
        displayName: this.displayName,
        available: true,
        findings,
        durationMs: Date.now() - start,
        focus: this.focus,
      };
    } catch (err) {
      return {
        engine: this.id,
        displayName: this.displayName,
        available: true,
        findings: null,
        error: (err as Error).message,
        durationMs: Date.now() - start,
        focus: this.focus,
      };
    }
  }
}
