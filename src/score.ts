import type { Finding } from "./types.js";

/**
 * Compute a security score from 0-100.
 *
 * Starts at 100, deducts points per finding:
 *   critical: -25
 *   warning:  -10
 *   info:      -0
 *
 * Minimum score is 0.
 */
export function computeScore(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) {
    switch (f.severity) {
      case "critical":
        score -= 25;
        break;
      case "warning":
        score -= 10;
        break;
    }
  }
  return Math.max(0, score);
}

/** Human-readable risk label */
export function riskLabel(score: number): string {
  if (score >= 90) return "Low Risk";
  if (score >= 70) return "Moderate Risk";
  if (score >= 40) return "High Risk";
  return "Critical Risk";
}
