import { collectFiles, totalLines } from "./files.js";
import { rules } from "../rules/index.js";
import { computeScore } from "../score.js";
import { loadConfig, loadIgnorePatterns, isIgnored } from "../config.js";
import type { ScanResult, Finding, ScanConfig } from "../types.js";

/** Run all rules against a target directory */
export function scan(targetDir: string, configOverride?: Partial<ScanConfig>): ScanResult {
  const start = Date.now();

  // Load config
  const fileConfig = loadConfig(targetDir);
  const config: ScanConfig = { ...fileConfig, ...configOverride };

  // Load ignore patterns
  const ignorePatterns = loadIgnorePatterns(targetDir);
  if (config.ignore) {
    ignorePatterns.push(...config.ignore);
  }

  // Collect and filter files
  let files = collectFiles(targetDir);
  if (ignorePatterns.length > 0) {
    files = files.filter((f) => !isIgnored(f.relativePath, ignorePatterns));
  }

  // Filter rules based on config
  let activeRules = [...rules];
  if (config.rules?.enable) {
    activeRules = activeRules.filter((r) => config.rules!.enable!.includes(r.id));
  }
  if (config.rules?.disable) {
    activeRules = activeRules.filter((r) => !config.rules!.disable!.includes(r.id));
  }

  // Run rules
  const findings: Finding[] = [];
  for (const rule of activeRules) {
    findings.push(...rule.run(files));
  }

  // Apply severity overrides
  if (config.severity) {
    for (const finding of findings) {
      if (config.severity[finding.rule]) {
        finding.severity = config.severity[finding.rule]!;
      }
    }
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
