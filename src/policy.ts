import type { AgentPolicy, AgentShieldConfig, Grade, ScanResult } from "./types.js";
import { letterGrade } from "./score.js";

const GRADE_ORDER: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

/** Check if a grade meets the minimum */
function gradePasses(actual: Grade, minimum: Grade): boolean {
  return (GRADE_ORDER[actual] ?? 0) >= (GRADE_ORDER[minimum] ?? 0);
}

/** Evaluate scan result against an agent policy */
export function evaluatePolicy(
  result: ScanResult,
  policy: AgentPolicy,
): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const grade = result.scoreResult?.grade ?? letterGrade(result.score);

  // Check minimum grade
  if (!gradePasses(grade, policy.minGrade)) {
    reasons.push(`Grade ${grade} below minimum ${policy.minGrade}`);
  }

  // Check minimum score
  if (policy.minScore !== undefined && result.score < policy.minScore) {
    reasons.push(`Score ${result.score} below minimum ${policy.minScore}`);
  }

  // Check blocked rules
  if (policy.blockRules?.length) {
    const triggered = result.findings
      .filter((f) => policy.blockRules!.includes(f.rule))
      .map((f) => f.rule);
    const unique = [...new Set(triggered)];
    if (unique.length > 0) {
      reasons.push(`Blocked rules triggered: ${unique.join(", ")}`);
    }
  }

  // Check max severity
  if (policy.maxSeverity) {
    const sevOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const maxAllowed = sevOrder[policy.maxSeverity] ?? 3;
    const worst = result.findings.reduce(
      (max, f) => Math.max(max, sevOrder[f.severity] ?? 0),
      0,
    );
    if (worst > maxAllowed) {
      const worstLabel = Object.entries(sevOrder).find(([, v]) => v === worst)?.[0] ?? "unknown";
      reasons.push(`Severity ${worstLabel} exceeds max allowed ${policy.maxSeverity}`);
    }
  }

  return { pass: reasons.length === 0, reasons };
}

/** Get the policy for a specific agent from config */
export function getAgentPolicy(
  config: AgentShieldConfig,
  agentName: string,
): AgentPolicy | null {
  return config.agents?.[agentName] ?? config.defaultPolicy ?? null;
}

/** Default policy presets */
export const POLICY_PRESETS: Record<string, AgentPolicy> = {
  strict: {
    minGrade: "A",
    minScore: 90,
    blockRules: ["reverse-shell", "backdoor", "data-exfil", "crypto-mining"],
    maxSeverity: "low",
  },
  standard: {
    minGrade: "B",
    minScore: 75,
    blockRules: ["reverse-shell", "backdoor"],
  },
  permissive: {
    minGrade: "D",
    minScore: 40,
  },
};
