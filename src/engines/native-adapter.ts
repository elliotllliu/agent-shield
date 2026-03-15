/**
 * Native AgentShield engine adapter.
 * Wraps our existing rule-based scanner as a ScanEngine.
 */

import type { ScanEngine, EngineResult, EngineFinding, EngineScanOptions } from "./types.js";
import type { Finding, ScanResult } from "../types.js";
import { scan } from "../scanner/index.js";

export class NativeEngine implements ScanEngine {
  readonly name = "agentshield";
  readonly displayName = "AgentShield";

  async available(): Promise<boolean> {
    return true; // Always available — it's us
  }

  async scan(dir: string, options?: EngineScanOptions): Promise<EngineResult> {
    const start = Date.now();

    try {
      const result: ScanResult = scan(dir);

      const findings: EngineFinding[] = result.findings
        .filter((f) => options?.includeLow !== false || f.severity !== "low")
        .map((f) => this.convertFinding(f));

      return {
        engine: this.name,
        success: true,
        findings,
        duration: Date.now() - start,
        version: "native",
      };
    } catch (err) {
      return {
        engine: this.name,
        success: false,
        findings: [],
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  setup(): string {
    return "Built-in — no setup needed.";
  }

  private convertFinding(f: Finding): EngineFinding {
    return {
      engine: this.name,
      ruleId: f.rule,
      title: f.rule.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: f.message,
      severity: f.severity,
      file: f.file,
      line: f.line,
      evidence: f.evidence,
      confidence: f.confidence === "high" ? 0.9 : f.confidence === "medium" ? 0.7 : 0.5,
      recommendation: undefined,
    };
  }
}
