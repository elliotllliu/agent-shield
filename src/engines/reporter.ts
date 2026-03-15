/**
 * Aggregated report renderer — terminal, JSON, and markdown output.
 */

import type { AggregatedResult, MergedFinding } from "./types.js";

// ─── Terminal Colors ───

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

function sevColor(sev: string): string {
  if (sev === "high") return RED;
  if (sev === "medium") return YELLOW;
  return DIM;
}

function sevEmoji(sev: string): string {
  if (sev === "high") return "🔴";
  if (sev === "medium") return "🟡";
  return "🟢";
}

// ─── Terminal Report ───

export function renderTerminalReport(result: AggregatedResult): string {
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(`${BOLD}🛡️  AgentShield Unified Security Report${RESET}`);
  lines.push("");

  // Target + engines
  lines.push(`${DIM}📁 Scanned:${RESET} ${result.target}`);

  const engineStatus = result.enginesAvailable.map((name) => {
    const ran = result.enginesRan.includes(name);
    const engineResult = result.engineResults.find((r) => r.engine === name);
    if (ran && engineResult?.success) return `${GREEN}${name} ✅${RESET}`;
    if (ran) return `${RED}${name} ❌${RESET}`;
    return `${DIM}${name} ⬜${RESET}`;
  });
  lines.push(`${DIM}🔧 Engines:${RESET} ${engineStatus.join(" | ")}`);
  lines.push("");

  // Summary
  const high = result.mergedFindings.filter((f) => f.severity === "high");
  const med = result.mergedFindings.filter((f) => f.severity === "medium");
  const low = result.mergedFindings.filter((f) => f.severity === "low");

  lines.push(`${BOLD}━━━ Findings Summary ━━━${RESET}`);
  if (high.length > 0)
    lines.push(`${RED}🔴 HIGH (${high.length})${RESET}`);
  if (med.length > 0)
    lines.push(`${YELLOW}🟡 MEDIUM (${med.length})${RESET}`);
  if (low.length > 0)
    lines.push(`${DIM}🟢 LOW (${low.length})${RESET}`);
  if (result.mergedFindings.length === 0)
    lines.push(`${GREEN}✅ No issues found${RESET}`);
  lines.push("");

  // Details
  if (result.mergedFindings.length > 0) {
    lines.push(`${BOLD}━━━ Details ━━━${RESET}`);
    lines.push("");

    result.mergedFindings.forEach((f, i) => {
      const sev = f.severity.toUpperCase();
      const color = sevColor(f.severity);
      const consensus = `${f.flaggedBy.length}/${f.totalEngines} engines`;

      lines.push(
        `${BOLD}#${i + 1}${RESET} ${color}[${sev}]${RESET} ${f.title}`
      );
      lines.push(`   ${DIM}File: ${f.file}${f.line ? `:${f.line}` : ""}${RESET}`);

      // Per-engine details
      for (const engineName of result.enginesRan) {
        const found = f.flaggedBy.includes(engineName);
        const detail = f.engineDetails.find((d) => d.engine === engineName);
        if (found && detail) {
          lines.push(
            `   ${GREEN}${engineName}:${RESET} ✅ detected${detail.ruleId ? ` (${detail.ruleId})` : ""}`
          );
        } else {
          lines.push(`   ${DIM}${engineName}: ⬜ not flagged${RESET}`);
        }
      }

      lines.push(`   ${CYAN}Consensus: ${consensus}${RESET}`);

      if (f.recommendation) {
        lines.push(`   ${DIM}Fix: ${f.recommendation}${RESET}`);
      }
      lines.push("");
    });
  }

  // Score
  lines.push(`${BOLD}━━━ Score ━━━${RESET}`);

  // Per-engine scores
  for (const er of result.engineResults) {
    const status = er.success ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`;
    const count = er.findings.length;
    lines.push(`${status} ${er.engine}: ${count} finding(s)`);
  }

  lines.push(
    `${BOLD}📊 Unified Score: ${result.score}/100${RESET}${result.score < 50 ? ` ${RED}(High Risk)${RESET}` : result.score < 80 ? ` ${YELLOW}(Medium Risk)${RESET}` : ` ${GREEN}(Low Risk)${RESET}`}`
  );
  lines.push("");

  return lines.join("\n");
}

// ─── JSON Report ───

export function renderJsonReport(result: AggregatedResult): string {
  return JSON.stringify(
    {
      target: result.target,
      score: result.score,
      engines: {
        available: result.enginesAvailable,
        ran: result.enginesRan,
      },
      summary: {
        high: result.mergedFindings.filter((f) => f.severity === "high").length,
        medium: result.mergedFindings.filter((f) => f.severity === "medium").length,
        low: result.mergedFindings.filter((f) => f.severity === "low").length,
        total: result.mergedFindings.length,
      },
      findings: result.mergedFindings.map((f) => ({
        title: f.title,
        severity: f.severity,
        file: f.file,
        line: f.line,
        flaggedBy: f.flaggedBy,
        consensus: `${f.flaggedBy.length}/${f.totalEngines}`,
        recommendation: f.recommendation,
        references: f.references,
      })),
      engineResults: result.engineResults.map((r) => ({
        engine: r.engine,
        success: r.success,
        findings: r.findings.length,
        duration: r.duration,
        error: r.error,
      })),
      duration: result.duration,
    },
    null,
    2
  );
}

// ─── Markdown Report ───

export function renderMarkdownReport(result: AggregatedResult): string {
  const lines: string[] = [];

  lines.push("# 🛡️ AgentShield Unified Security Report");
  lines.push("");
  lines.push(`**Target:** \`${result.target}\``);
  lines.push(
    `**Engines:** ${result.enginesRan.map((e) => `✅ ${e}`).join(" | ")}${result.enginesAvailable.filter((e) => !result.enginesRan.includes(e)).map((e) => ` | ⬜ ${e}`).join("")}`
  );
  lines.push(`**Score:** ${result.score}/100`);
  lines.push("");

  // Summary table
  const high = result.mergedFindings.filter((f) => f.severity === "high").length;
  const med = result.mergedFindings.filter((f) => f.severity === "medium").length;
  const low = result.mergedFindings.filter((f) => f.severity === "low").length;

  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("|----------|-------|");
  lines.push(`| 🔴 High | ${high} |`);
  lines.push(`| 🟡 Medium | ${med} |`);
  lines.push(`| 🟢 Low | ${low} |`);
  lines.push("");

  // Findings
  if (result.mergedFindings.length > 0) {
    lines.push("## Findings");
    lines.push("");

    result.mergedFindings.forEach((f, i) => {
      lines.push(
        `### #${i + 1} ${sevEmoji(f.severity)} [${f.severity.toUpperCase()}] ${f.title}`
      );
      lines.push("");
      lines.push(`**File:** \`${f.file}${f.line ? `:${f.line}` : ""}\``);
      lines.push(`**Consensus:** ${f.flaggedBy.length}/${f.totalEngines} engines (${f.flaggedBy.join(", ")})`);

      if (f.description) {
        lines.push("");
        lines.push(f.description);
      }

      if (f.recommendation) {
        lines.push("");
        lines.push(`**Fix:** ${f.recommendation}`);
      }

      lines.push("");
    });
  }

  return lines.join("\n");
}
