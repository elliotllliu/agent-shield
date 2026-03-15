/**
 * Tencent AI-Infra-Guard engine adapter.
 * Calls ai-infra-guard CLI and parses output.
 */

import { spawnSync } from "child_process";
import type { ScanEngine, EngineResult, EngineFinding, EngineScanOptions } from "./types.js";
import type { Severity } from "../types.js";

export class TencentEngine implements ScanEngine {
  readonly name = "tencent";
  readonly displayName = "Tencent AI-Infra-Guard";

  async available(): Promise<boolean> {
    for (const cmd of ["ai-infra-guard", "aig"]) {
      try {
        const result = spawnSync(cmd, ["--version"], {
          timeout: 10_000,
          stdio: "pipe",
          shell: true,
        });
        if (result.status === 0) return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  async scan(dir: string, options?: EngineScanOptions): Promise<EngineResult> {
    const start = Date.now();
    const timeout = options?.timeout ?? 60_000;

    for (const cmd of ["ai-infra-guard", "aig"]) {
      try {
        const result = spawnSync(cmd, ["scan", dir, "--output", "json"], {
          timeout,
          stdio: "pipe",
          shell: true,
          cwd: dir,
        });

        if (result.status !== null) {
          const stdout = result.stdout?.toString("utf-8") || "";
          const findings = this.parseOutput(stdout);

          return {
            engine: this.name,
            success: true,
            findings,
            duration: Date.now() - start,
          };
        }
      } catch {
        continue;
      }
    }

    return {
      engine: this.name,
      success: false,
      findings: [],
      duration: Date.now() - start,
      error: "ai-infra-guard not available. Run: pip install ai-infra-guard",
    };
  }

  setup(): string {
    return [
      "Install Tencent AI-Infra-Guard:",
      "  pip install ai-infra-guard",
      "  # or",
      "  pip install aig",
      "",
      "GitHub: https://github.com/Tencent/AI-Infra-Guard",
    ].join("\n");
  }

  private parseOutput(stdout: string): EngineFinding[] {
    try {
      const data = JSON.parse(stdout);
      const findings: EngineFinding[] = [];

      const issues = data.vulnerabilities || data.issues || data.findings || data.results || [];

      for (const issue of Array.isArray(issues) ? issues : []) {
        findings.push({
          engine: this.name,
          ruleId: issue.id || issue.vuln_id || issue.rule || "tencent-unknown",
          title: issue.title || issue.name || issue.summary || "Tencent Finding",
          description: issue.description || issue.detail || issue.message || "",
          severity: this.normalizeSeverity(issue.severity || issue.risk_level),
          file: issue.file || issue.path || issue.location || "unknown",
          line: issue.line || issue.line_number,
          evidence: issue.evidence || issue.code_snippet,
          confidence: issue.confidence || 0.8,
          recommendation: issue.fix || issue.remediation || issue.recommendation,
          references: {
            cwe: issue.cwe_id || issue.cwe,
          },
        });
      }

      return findings;
    } catch {
      return [];
    }
  }

  private normalizeSeverity(sev: string | undefined): Severity {
    if (!sev) return "medium";
    const lower = sev.toLowerCase();
    if (lower === "critical" || lower === "high") return "high";
    if (lower === "medium" || lower === "moderate") return "medium";
    return "low";
  }
}
