import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * Grype adapter — Dependency vulnerability scanner
 * https://github.com/anchore/grype (9k+ stars)
 */
export class GrypeAdapter implements EngineAdapter {
  id = "grype";
  displayName = "Grype";
  focus = "依赖项漏洞扫描";
  url = "https://github.com/anchore/grype";

  private getBin(): string {
    const localBin = join(homedir(), ".agentshield", "bin", "grype");
    if (existsSync(localBin)) return localBin;
    return "grype";
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync(`${this.getBin()} version 2>/dev/null`, { timeout: 10000, stdio: "pipe" });
      return true;
    } catch { return false; }
  }

  installInstructions(): string { return "curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ~/.agentshield/bin"; }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    if (!(await this.isAvailable())) {
      return { engine: this.id, displayName: this.displayName, available: false, findings: null, error: "Not installed", durationMs: Date.now() - start, focus: this.focus };
    }
    try {
      const bin = this.getBin();
      let raw = "";
      try {
        raw = execSync(`${bin} dir:"${targetDir}" -o json --quiet 2>/dev/null`, {
          timeout: 120000, maxBuffer: 20 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"]
        }).toString();
      } catch (e: any) { if (e.stdout) raw = e.stdout.toString(); }

      const findings: EngineFinding[] = [];
      if (raw.trim()) {
        try {
          const data = JSON.parse(raw);
          for (const match of (data.matches || [])) {
            const vuln = match.vulnerability || {};
            const artifact = match.artifact || {};
            findings.push({
              engine: this.id,
              severity: mapSev(vuln.severity),
              file: artifact.locations?.[0]?.path || "unknown",
              rule: "dependency-vulnerability",
              message: `${vuln.id}: ${(vuln.description || vuln.dataSource || "").slice(0, 100)}`,
              evidence: `${artifact.name}@${artifact.version} → fix: ${vuln.fix?.versions?.join(", ") || "none"}`,
              category: "supply-chain",
            });
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
  if (l === "CRITICAL" || l === "HIGH") return "high";
  if (l === "MEDIUM") return "medium";
  if (l === "LOW") return "low";
  return "info";
}
