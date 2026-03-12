import chalk from "chalk";
import type { ScanResult, Finding } from "../types.js";
import { riskLabel } from "../score.js";

const SEVERITY_ICON: Record<string, string> = {
  critical: chalk.red("🔴 CRITICAL"),
  warning: chalk.yellow("🟡 WARNING"),
  info: chalk.blue("🟢 INFO"),
};

const SEVERITY_LINE: Record<string, (s: string) => string> = {
  critical: chalk.red,
  warning: chalk.yellow,
  info: chalk.dim,
};

export function printReport(result: ScanResult): void {
  const { target, filesScanned, linesScanned, findings, score, duration } = result;

  console.log();
  console.log(chalk.bold("🛡️  AgentShield Security Report"));
  console.log(
    chalk.dim(`📁 Scanned: ${target} (${filesScanned} files, ${formatLines(linesScanned)})`),
  );
  console.log();

  // Group by severity
  const bySeverity = groupBy(findings, (f) => f.severity);

  for (const severity of ["critical", "warning", "info"] as const) {
    const group = bySeverity[severity];
    if (!group || group.length === 0) continue;

    console.log(`${SEVERITY_ICON[severity]} (${group.length})`);
    for (let i = 0; i < group.length; i++) {
      const f = group[i]!;
      const prefix = i < group.length - 1 ? "  ├─" : "  └─";
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      const colorize = SEVERITY_LINE[f.severity] || chalk.white;
      console.log(colorize(`${prefix} ${loc} — [${f.rule}] ${f.message}`));
      if (f.evidence) {
        const ePrefix = i < group.length - 1 ? "  │  " : "     ";
        console.log(chalk.dim(`${ePrefix}${f.evidence}`));
      }
    }
    console.log();
  }

  // Score
  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : score >= 40 ? chalk.hex("#FF8800") : chalk.red;
  console.log(scoreColor(`✅ Score: ${score}/100 (${riskLabel(score)})`));
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
