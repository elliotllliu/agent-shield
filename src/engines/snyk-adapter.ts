/**
 * Snyk Agent Scan engine adapter.
 * Calls `uvx snyk-agent-scan` or `npx snyk-agent-scan` and parses output.
 */

import { spawnSync } from "child_process";
import type { ScanEngine, EngineResult, EngineFinding, EngineScanOptions } from "./types.js";
import type { Severity } from "../types.js";

export class SnykEngine implements ScanEngine {
  readonly name = "snyk";
  readonly displayName = "Snyk Agent Scan";

  async available(): Promise<boolean> {
    // Check uvx first, then npx
    for (const cmd of ["uvx", "npx"]) {
      try {
        const result = spawnSync(cmd, ["snyk-agent-scan", "--version"], {
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

    // Try uvx first (faster), then npx
    for (const cmd of ["uvx", "npx"]) {
      try {
        const result = spawnSync(cmd, ["snyk-agent-scan", "scan", dir, "--json"], {
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
            version: this.getVersion(cmd),
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
      error: "snyk-agent-scan not available. Run: pip install snyk-agent-scan",
    };
  }

  setup(): string {
    return [
      "Install snyk-agent-scan:",
      "  pip install snyk-agent-scan",
      "  # or",
      "  uvx snyk-agent-scan --help",
      "",
      "Optional: Set SNYK_TOKEN for enhanced scanning.",
    ].join("\n");
  }

  private parseOutput(stdout: string): EngineFinding[] {
    try {
      const data = JSON.parse(stdout);
      const findings: EngineFinding[] = [];

      // Handle various Snyk output formats
      const issues = data.issues || data.findings || data.results || [];

      for (const issue of Array.isArray(issues) ? issues : []) {
        findings.push({
          engine: this.name,
          ruleId: issue.id || issue.rule || "snyk-unknown",
          title: issue.title || issue.name || "Snyk Finding",
          description: issue.description || issue.message || "",
          severity: this.normalizeSeverity(issue.severity),
          file: issue.file || issue.path || "unknown",
          line: issue.line || issue.lineNumber,
          evidence: issue.evidence || issue.snippet,
          confidence: issue.confidence || 0.8,
          recommendation: issue.fix || issue.recommendation || issue.remediation,
        });
      }

      return findings;
    } catch {
      // Non-JSON output — try line parsing
      return this.parseTextOutput(stdout);
    }
  }

  private parseTextOutput(text: string): EngineFinding[] {
    const findings: EngineFinding[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      // Match common patterns like "[HIGH] Some finding in file.ts:10"
      const match = line.match(
        /\[(HIGH|MEDIUM|LOW|CRITICAL)\]\s+(.+?)\s+(?:in\s+)?(\S+?)(?::(\d+))?$/i
      );
      if (match) {
        findings.push({
          engine: this.name,
          ruleId: "snyk-text",
          title: match[2]!.trim(),
          description: line.trim(),
          severity: this.normalizeSeverity(match[1]!),
          file: match[3]!,
          line: match[4] ? parseInt(match[4], 10) : undefined,
          confidence: 0.7,
        });
      }
    }

    return findings;
  }

  private normalizeSeverity(sev: string | undefined): Severity {
    if (!sev) return "medium";
    const lower = sev.toLowerCase();
    if (lower === "critical" || lower === "high") return "high";
    if (lower === "medium" || lower === "moderate") return "medium";
    return "low";
  }

  private getVersion(cmd: string): string | undefined {
    try {
      const result = spawnSync(cmd, ["snyk-agent-scan", "--version"], {
        timeout: 5_000,
        stdio: "pipe",
        shell: true,
      });
      return result.stdout?.toString("utf-8").trim() || undefined;
    } catch {
      return undefined;
    }
  }
}
