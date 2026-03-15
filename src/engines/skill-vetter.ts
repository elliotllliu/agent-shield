import { execSync } from "child_process";
import type { EngineAdapter, EngineResult, EngineFinding } from "./types.js";

/**
 * Skill Vetter adapter — runs the vett.sh multi-scanner script.
 * https://github.com/app-incubator-xyz/skill-vetter
 */
export class SkillVetterAdapter implements EngineAdapter {
  id = "skill-vetter";
  displayName = "Skill Vetter";
  focus = "Multi-scanner gate: aguara + Cisco skill-scanner + secrets grep + structure check";
  url = "https://github.com/app-incubator-xyz/skill-vetter";

  private scriptPath: string | null = null;

  async isAvailable(): Promise<boolean> {
    // Check if skill-vetter is cloned locally
    const paths = [
      "/tmp/skill-vetter/scripts/vett.sh",
      `${process.env.HOME}/.local/share/skill-vetter/scripts/vett.sh`,
      `${process.env.HOME}/skill-vetter/scripts/vett.sh`,
    ];
    for (const p of paths) {
      try {
        execSync(`test -f "${p}"`, { stdio: "pipe" });
        this.scriptPath = p;
        return true;
      } catch { /* continue */ }
    }
    return false;
  }

  installInstructions(): string {
    return `git clone https://github.com/app-incubator-xyz/skill-vetter /tmp/skill-vetter`;
  }

  async scan(targetDir: string): Promise<EngineResult> {
    const start = Date.now();
    const available = await this.isAvailable();
    if (!available || !this.scriptPath) {
      return {
        engine: this.id, displayName: this.displayName, available: false, findings: null,
        error: `Not installed. Run: ${this.installInstructions()}`,
        durationMs: Date.now() - start, focus: this.focus,
      };
    }

    try {
      let output: string;
      try {
        output = execSync(`bash "${this.scriptPath}" "${targetDir}" 2>&1`, {
          timeout: 120000, maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, PATH: `${process.env.HOME}/go/bin:${process.env.HOME}/.local/bin:${process.env.PATH}` },
        }).toString();
      } catch (err: any) {
        // vett.sh exits 1 when BLOCKED
        output = err.stdout?.toString() || err.message || "";
      }

      const findings = parseVettOutput(output);

      return {
        engine: this.id, displayName: this.displayName,
        available: true, findings,
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

/**
 * Parse vett.sh text output into normalized findings.
 */
function parseVettOutput(output: string): EngineFinding[] {
  const findings: EngineFinding[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Match failure lines: ❌ scanner-name: description
    const failMatch = line.match(/❌\s+([\w-]+):\s+(.+)/);
    if (failMatch) {
      findings.push({
        engine: "skill-vetter",
        severity: "high",
        file: "",
        rule: failMatch[1]!,
        message: failMatch[2]!.trim(),
        category: failMatch[1],
      });
    }

    // Match warning lines: ⚠️ scanner-name: description
    const warnMatch = line.match(/⚠️?\s+([\w-]+):\s+(.+)/);
    if (warnMatch) {
      findings.push({
        engine: "skill-vetter",
        severity: "medium",
        file: "",
        rule: warnMatch[1]!,
        message: warnMatch[2]!.trim(),
        category: warnMatch[1],
      });
    }

    // Match aguara detail lines: → rule_id: description (file:line)
    const detailMatch = line.match(/→\s+([\w.-]+):\s+(.+)\s+\((.+):(\d+)\)/);
    if (detailMatch) {
      findings.push({
        engine: "skill-vetter",
        severity: "high",
        file: detailMatch[3]!,
        line: parseInt(detailMatch[4]!, 10),
        rule: detailMatch[1]!,
        message: detailMatch[2]!.trim(),
        category: "aguara",
      });
    }
  }

  return findings;
}
