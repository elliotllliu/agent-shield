/**
 * Cisco Skill-Scanner engine adapter.
 * Calls cisco-skill-scanner CLI and parses output.
 */

import { spawnSync } from "child_process";
import type { ScanEngine, EngineResult, EngineFinding, EngineScanOptions } from "./types.js";
import type { Severity } from "../types.js";

export class CiscoEngine implements ScanEngine {
  readonly name = "cisco";
  readonly displayName = "Cisco Skill-Scanner";

  async available(): Promise<boolean> {
    for (const cmd of ["skill-scanner", "npx @anthropic/skill-scanner"]) {
      try {
        const parts = cmd.split(" ");
        const result = spawnSync(parts[0]!, parts.slice(1).concat(["--version"]), {
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

    for (const cmd of ["skill-scanner", "npx @anthropic/skill-scanner"]) {
      try {
        const parts = cmd.split(" ");
        const result = spawnSync(parts[0]!, [...parts.slice(1), "scan", dir, "--format", "json"], {
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
      error: "skill-scanner not available. Run: npm install -g @anthropic/skill-scanner",
    };
  }

  setup(): string {
    return [
      "Install Cisco Skill-Scanner:",
      "  npm install -g @anthropic/skill-scanner",
      "  # or",
      "  npx @anthropic/skill-scanner --help",
    ].join("\n");
  }

  private parseOutput(stdout: string): EngineFinding[] {
    try {
      const data = JSON.parse(stdout);
      const findings: EngineFinding[] = [];

      const issues = data.issues || data.findings || data.results || [];

      for (const issue of Array.isArray(issues) ? issues : []) {
        findings.push({
          engine: this.name,
          ruleId: issue.code || issue.id || issue.rule || "cisco-unknown",
          title: issue.title || issue.message || "Cisco Finding",
          description: issue.description || issue.detail || "",
          severity: this.normalizeSeverity(issue.severity || issue.level),
          file: issue.file || issue.path || "unknown",
          line: issue.line || issue.lineNumber,
          evidence: issue.evidence || issue.context,
          confidence: 0.85,
          recommendation: issue.fix || issue.recommendation,
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
    if (lower === "critical" || lower === "high" || lower === "error") return "high";
    if (lower === "medium" || lower === "warning" || lower === "moderate") return "medium";
    return "low";
  }
}
