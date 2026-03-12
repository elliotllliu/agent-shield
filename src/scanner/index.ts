import { collectFiles, totalLines } from "./files.js";
import { rules } from "../rules/index.js";
import { computeScore } from "../score.js";
import type { ScanResult, Finding } from "../types.js";

/** Run all rules against a target directory */
export function scan(targetDir: string): ScanResult {
  const start = Date.now();
  const files = collectFiles(targetDir);
  const findings: Finding[] = [];

  for (const rule of rules) {
    findings.push(...rule.run(files));
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    target: targetDir,
    filesScanned: files.length,
    linesScanned: totalLines(files),
    findings,
    score: computeScore(findings),
    duration: Date.now() - start,
  };
}
