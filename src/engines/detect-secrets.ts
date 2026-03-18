import { execSync } from "child_process";
import { homedir } from "os";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * detect-secrets adapter — Yelp's secret detection
 * https://github.com/Yelp/detect-secrets (3.7k+ stars)
 */
export class DetectSecretsAdapter implements EngineAdapter {
  id = "detect-secrets";
  displayName = "detect-secrets";
  focus = "密钥检测（Yelp 出品）";
  url = "https://github.com/Yelp/detect-secrets";

  async isAvailable(): Promise<boolean> {
    try {
      execSync("detect-secrets --version 2>/dev/null", {
        timeout: 10000, stdio: "pipe", shell: "/bin/bash",
        env: { ...process.env, PATH: `${homedir()}/.local/bin:${homedir()}/.agentshield/bin:${process.env.PATH}` },
      });
      return true;
    } catch { return false; }
  }

  installInstructions(): string { return "pipx install detect-secrets"; }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    if (!(await this.isAvailable())) {
      return { engine: this.id, displayName: this.displayName, available: false, findings: null, error: "Not installed", durationMs: Date.now() - start, focus: this.focus };
    }
    try {
      let raw = "";
      try {
        raw = execSync(`detect-secrets scan "${targetDir}" 2>/dev/null`, {
          timeout: 120000, maxBuffer: 10 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
          shell: "/bin/bash",
          env: { ...process.env, PATH: `${homedir()}/.local/bin:${homedir()}/.agentshield/bin:${process.env.PATH}` },
        }).toString();
      } catch (e: any) { if (e.stdout) raw = e.stdout.toString(); }

      const findings: EngineFinding[] = [];
      if (raw.trim()) {
        try {
          const data = JSON.parse(raw);
          const results = data.results || {};
          for (const [filePath, secrets] of Object.entries(results)) {
            if (!Array.isArray(secrets)) continue;
            for (const secret of secrets) {
              findings.push({
                engine: this.id,
                severity: "high",
                file: filePath,
                line: secret.line_number,
                rule: "secret-detected",
                message: `${secret.type}: potential secret detected`,
                evidence: secret.hashed_secret?.slice(0, 20) || "",
                category: "credentials",
              });
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
