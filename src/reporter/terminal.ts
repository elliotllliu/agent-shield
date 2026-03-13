import chalk from "chalk";
import type { ScanResult, Finding } from "../types.js";
import { riskLabel } from "../score.js";

const SEVERITY_ICON: Record<string, string> = {
  high: chalk.red("🔴 High Risk"),
  medium: chalk.yellow("🟡 Medium Risk"),
  low: chalk.green("🟢 Low Risk"),
};

const SEVERITY_LINE: Record<string, (s: string) => string> = {
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.green,
};

export function printReport(result: ScanResult): void {
  const { target, filesScanned, linesScanned, findings, score, duration } = result;

  console.log();
  console.log(chalk.bold("🛡️  AgentShield Scan Report"));
  console.log(
    chalk.dim(`📁 Scanned: ${target} (${filesScanned} files, ${formatLines(linesScanned)})`),
  );
  console.log();

  // Summary line first
  const high = findings.filter(f => f.severity === "high" && !f.possibleFalsePositive).length;
  const medium = findings.filter(f => f.severity === "medium" && !f.possibleFalsePositive).length;
  const low = findings.filter(f => f.severity === "low" && !f.possibleFalsePositive).length;

  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : score >= 40 ? chalk.hex("#FF8800") : chalk.red;
  console.log(scoreColor(`Score: ${score}/100 (${riskLabel(score)})`));
  console.log();

  if (high > 0) console.log(chalk.red(`🔴 High Risk: ${high} finding${high > 1 ? "s" : ""}`));
  if (medium > 0) console.log(chalk.yellow(`🟡 Medium Risk: ${medium} finding${medium > 1 ? "s" : ""}`));
  if (low > 0) console.log(chalk.green(`🟢 Low Risk: ${low} finding${low > 1 ? "s" : ""}`));
  console.log();

  // Group by severity, ordered high → medium → low
  const bySeverity = groupBy(findings.filter(f => !f.possibleFalsePositive), (f) => f.severity);

  for (const severity of ["high", "medium", "low"] as const) {
    const group = bySeverity[severity];
    if (!group || group.length === 0) continue;

    console.log(`${SEVERITY_ICON[severity]} (${group.length})`);
    for (let i = 0; i < group.length; i++) {
      const f = group[i]!;
      const prefix = i < group.length - 1 ? "  ├─" : "  └─";
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      const colorize = SEVERITY_LINE[f.severity] || chalk.white;
      const confLabel = f.confidence === "high" ? "" : f.confidence === "medium" ? " [medium confidence]" : f.confidence === "low" ? " [needs review]" : "";
      console.log(colorize(`${prefix} ${loc} — [${f.rule}] ${f.message}${confLabel}`));
      if (f.evidence) {
        const ePrefix = i < group.length - 1 ? "  │  " : "     ";
        console.log(chalk.dim(`${ePrefix}${f.evidence}`));
      }
    }
    console.log();
  }

  // FP section (collapsed)
  const fpFindings = findings.filter(f => f.possibleFalsePositive);
  if (fpFindings.length > 0) {
    console.log(chalk.dim(`ℹ️  ${fpFindings.length} possible false positive${fpFindings.length > 1 ? "s" : ""} suppressed (use --show-fp to display)`));
    console.log();
  }

  console.log(chalk.dim(`⏱  ${duration}ms`));
  console.log();
}

function formatLines(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K lines`;
  return `${n} lines`;
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = fn(item);
    if (!result[key]) result[key] = [];
    result[key]!.push(item);
  }
  return result;
}
