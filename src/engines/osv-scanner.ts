import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * OSV-Scanner adapter — Google's vulnerability scanner
 * https://github.com/google/osv-scanner (6.5k+ stars)
 */
export class OsvScannerAdapter implements EngineAdapter {
  id = "osv-scanner";
  displayName = "OSV-Scanner";
  focus = "依赖漏洞扫描（Google OSV 数据库）";
  url = "https://github.com/google/osv-scanner";

  private getBin(): string {
    const localBin = join(homedir(), ".agentshield", "bin", "osv-scanner");
    if (existsSync(localBin)) return localBin;
    return "osv-scanner";
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync(`${this.getBin()} --version 2>/dev/null`, { timeout: 10000, stdio: "pipe" });
      return true;
    } catch { return false; }
  }

  installInstructions(): string { return "https://github.com/google/osv-scanner/releases"; }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    if (!(await this.isAvailable())) {
      return { engine: this.id, displayName: this.displayName, available: false, findings: null, error: "Not installed", durationMs: Date.now() - start, focus: this.focus };
    }
    try {
      const bin = this.getBin();
      let raw = "";
      try {
        raw = execSync(`${bin} scan --format json --recursive "${targetDir}" 2>/dev/null`, {
          timeout: 120000, maxBuffer: 20 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"]
        }).toString();
      } catch (e: any) { if (e.stdout) raw = e.stdout.toString(); }

      const findings: EngineFinding[] = [];
      if (raw.trim()) {
        try {
          const data = JSON.parse(raw);
          const results = data.results || [];
          for (const result of results) {
            for (const pkg of (result.packages || [])) {
              for (const vuln of (pkg.vulnerabilities || [])) {
                findings.push({
                  engine: this.id,
                  severity: mapSev(vuln.database_specific?.severity || "MEDIUM"),
                  file: result.source?.path || "unknown",
                  rule: "dependency-vulnerability",
                  message: `${vuln.id}: ${(vuln.summary || "").slice(0, 100)}`,
                  evidence: `${pkg.package?.name}@${pkg.package?.version}`,
                  category: "supply-chain",
                });
              }
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
  if (l === "CRITICAL" || l === "HIGH") return "high";
  if (l === "MEDIUM") return "medium";
  if (l === "LOW") return "low";
  return "info";
}
