import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * TruffleHog adapter — Secret detection + verification
 * https://github.com/trufflesecurity/trufflehog (17k+ stars)
 */
export class TruffleHogAdapter implements EngineAdapter {
  id = "trufflehog";
  displayName = "TruffleHog";
  focus = "密钥检测 + 验证密钥有效性";
  url = "https://github.com/trufflesecurity/trufflehog";

  private getBin(): string {
    const localBin = join(homedir(), ".agentshield", "bin", "trufflehog");
    if (existsSync(localBin)) return localBin;
    return "trufflehog";
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync(`${this.getBin()} --version 2>/dev/null`, { timeout: 10000, stdio: "pipe" });
      return true;
    } catch { return false; }
  }

  installInstructions(): string { return "curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b ~/.agentshield/bin"; }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    if (!(await this.isAvailable())) {
      return { engine: this.id, displayName: this.displayName, available: false, findings: null, error: "Not installed", durationMs: Date.now() - start, focus: this.focus };
    }
    try {
      const bin = this.getBin();
      let raw = "";
      try {
        raw = execSync(`${bin} filesystem --json --no-update "${targetDir}" 2>/dev/null`, {
          timeout: 120000, maxBuffer: 20 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"]
        }).toString();
      } catch (e: any) { if (e.stdout) raw = e.stdout.toString(); }

      const findings: EngineFinding[] = [];
      if (raw.trim()) {
        for (const line of raw.trim().split("\n")) {
          try {
            const r = JSON.parse(line);
            if (r.SourceMetadata) {
              const file = r.SourceMetadata?.Data?.Filesystem?.file || "unknown";
              findings.push({
                engine: this.id, severity: r.Verified ? "high" : "medium",
                file, line: r.SourceMetadata?.Data?.Filesystem?.line,
                rule: "secret-detected",
                message: `${r.DetectorName || "Secret"}: ${r.Verified ? "VERIFIED active secret" : "potential secret"}`,
                evidence: r.Raw?.slice(0, 60) || "", category: "credentials",
              });
            }
          } catch { /* skip non-json lines */ }
        }
      }
      return { engine: this.id, displayName: this.displayName, available: true, findings, durationMs: Date.now() - start, focus: this.focus };
    } catch (err) {
      return { engine: this.id, displayName: this.displayName, available: true, findings: null, error: (err as Error).message?.slice(0, 200), durationMs: Date.now() - start, focus: this.focus };
    }
  }
}
