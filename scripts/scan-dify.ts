#!/usr/bin/env tsx
/**
 * Batch scan all Dify .difypkg plugins and generate security report
 */
import { readdirSync, statSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from "fs";
import { join, basename } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { scan } from "../src/scanner/index.js";

const PLUGINS_DIR = "/tmp/dify-plugins";
const OUTPUT = "/tmp/agent-shield/reports/dify-plugins-report.md";

interface PluginResult {
  name: string;
  score: number;
  high: number;
  medium: number;
  low: number;
  files: number;
  lines: number;
  topFindings: { rule: string; severity: string; message: string; file: string; line?: number }[];
}

// Collect all .difypkg files recursively
function collectDifypkgs(): { name: string; path: string }[] {
  const results: { name: string; path: string }[] = [];

  function walk(dir: string, prefix: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".")) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full, prefix ? `${prefix}/${entry}` : entry);
      } else if (entry.endsWith(".difypkg")) {
        // Use parent dir + pkg name as label
        const label = prefix ? `${prefix}/${entry.replace(".difypkg", "")}` : entry.replace(".difypkg", "");
        results.push({ name: label, path: full });
      }
    }
  }

  walk(PLUGINS_DIR, "");
  return results;
}

// Extract .difypkg using python3 (unzip not available)
function extractPkg(pkgPath: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), "dify-scan-"));
  try {
    execSync(`python3 -c "import zipfile; zipfile.ZipFile('${pkgPath}').extractall('${tmpDir}')"`, { stdio: "pipe" });
  } catch {
    rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Failed to extract ${pkgPath}`);
  }
  return tmpDir;
}

// Main
const startTime = Date.now();
const pkgs = collectDifypkgs();

// De-duplicate: keep only latest version per plugin (by parent dir)
const byParent = new Map<string, typeof pkgs[0]>();
for (const pkg of pkgs) {
  const parent = pkg.name.split("/").slice(0, -1).join("/") || pkg.name;
  const existing = byParent.get(parent);
  if (!existing || pkg.path > existing.path) {
    byParent.set(parent, pkg);
  }
}
const uniquePkgs = Array.from(byParent.values());
console.log(`Found ${pkgs.length} .difypkg files (${uniquePkgs.length} unique plugins)`);

const results: PluginResult[] = [];
let scanned = 0;
let errors = 0;

for (const pkg of uniquePkgs) {
  let tmpDir: string | null = null;
  try {
    tmpDir = extractPkg(pkg.path);
    const result = scan(tmpDir);
    const realFindings = result.findings.filter(f => !f.possibleFalsePositive);

    results.push({
      name: pkg.name,
      score: result.score,
      high: realFindings.filter(f => f.severity === "high").length,
      medium: realFindings.filter(f => f.severity === "medium").length,
      low: realFindings.filter(f => f.severity === "low").length,
      files: result.filesScanned,
      lines: result.linesScanned,
      topFindings: realFindings.slice(0, 5).map(f => ({
        rule: f.rule,
        severity: f.severity,
        message: f.message,
        file: f.file,
        line: f.line,
      })),
    });
    scanned++;
    if (scanned % 50 === 0) {
      console.log(`  Scanned ${scanned}/${uniquePkgs.length}...`);
    }
  } catch (e) {
    errors++;
  } finally {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`Scanned ${scanned} plugins in ${elapsed}s (${errors} errors)`);

// Sort by score (worst first)
results.sort((a, b) => a.score - b.score);

const highRisk = results.filter(r => r.high > 0);
const mediumRisk = results.filter(r => r.high === 0 && r.medium > 0);
const clean = results.filter(r => r.high === 0 && r.medium === 0);
const totalFindings = results.reduce((s, r) => s + r.high + r.medium + r.low, 0);
const totalHigh = results.reduce((s, r) => s + r.high, 0);
const totalMedium = results.reduce((s, r) => s + r.medium, 0);
const totalLow = results.reduce((s, r) => s + r.low, 0);
const totalFiles = results.reduce((s, r) => s + r.files, 0);
const totalLines = results.reduce((s, r) => s + r.lines, 0);
const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 100;

let md = `# 🛡️ AgentShield — Dify Plugins Security Report

> Automated security scan of the [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) repository.

**Scanned**: ${scanned} plugins | ${totalFiles} files | ${totalLines.toLocaleString()} lines
**Duration**: ${elapsed}s
**Average Score**: ${avgScore}/100
**Scanner**: [AgentShield](https://github.com/elliotllliu/agent-shield) v0.3.0
**Date**: ${new Date().toISOString().split("T")[0]}

## Summary

| Category | Count | % |
|----------|-------|---|
| 🔴 Plugins with High Risk findings | ${highRisk.length} | ${((highRisk.length / scanned) * 100).toFixed(1)}% |
| 🟡 Plugins with Medium Risk only | ${mediumRisk.length} | ${((mediumRisk.length / scanned) * 100).toFixed(1)}% |
| 🟢 Clean plugins (Low/None) | ${clean.length} | ${((clean.length / scanned) * 100).toFixed(1)}% |

**Total findings**: ${totalFindings} (🔴 ${totalHigh} high, 🟡 ${totalMedium} medium, 🟢 ${totalLow} low)

## Score Distribution

| Score Range | Count |
|-------------|-------|
| 90-100 (Low Risk) | ${results.filter(r => r.score >= 90).length} |
| 70-89 (Moderate Risk) | ${results.filter(r => r.score >= 70 && r.score < 90).length} |
| 40-69 (High Risk) | ${results.filter(r => r.score >= 40 && r.score < 70).length} |
| 0-39 (Critical Risk) | ${results.filter(r => r.score < 40).length} |

`;

if (highRisk.length > 0) {
  md += `## 🔴 High Risk Plugins\n\n`;
  md += `| Plugin | Score | 🔴 High | 🟡 Med | 🟢 Low | Top Finding |\n`;
  md += `|--------|-------|---------|--------|--------|-------------|\n`;
  for (const r of highRisk) {
    const topMsg = r.topFindings[0]?.message.slice(0, 60).replace(/\|/g, "\\|") || "-";
    md += `| ${r.name} | ${r.score} | ${r.high} | ${r.medium} | ${r.low} | ${topMsg} |\n`;
  }
  md += "\n";

  // Detail section for high-risk
  md += `### High Risk Details\n\n`;
  for (const r of highRisk) {
    md += `#### ${r.name} (Score: ${r.score})\n\n`;
    for (const f of r.topFindings.filter(f => f.severity === "high" || f.severity === "medium")) {
      md += `- **${f.severity.toUpperCase()}** \`${f.file}${f.line ? `:${f.line}` : ""}\`: ${f.message}\n`;
    }
    md += "\n";
  }
}

if (mediumRisk.length > 0) {
  md += `## 🟡 Medium Risk Plugins\n\n`;
  md += `| Plugin | Score | 🟡 Med | 🟢 Low | Top Finding |\n`;
  md += `|--------|-------|--------|--------|-------------|\n`;
  for (const r of mediumRisk) {
    const topMsg = r.topFindings[0]?.message.slice(0, 60).replace(/\|/g, "\\|") || "-";
    md += `| ${r.name} | ${r.score} | ${r.medium} | ${r.low} | ${topMsg} |\n`;
  }
  md += "\n";
}

// Most common findings
const findingCounts: Record<string, number> = {};
for (const r of results) {
  for (const f of r.topFindings) {
    const key = `[${f.rule}] ${f.message.slice(0, 80)}`;
    findingCounts[key] = (findingCounts[key] || 0) + 1;
  }
}
const topFindings = Object.entries(findingCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);

md += `## Most Common Findings\n\n`;
md += `| # | Finding | Occurrences |\n`;
md += `|---|---------|-------------|\n`;
for (let i = 0; i < topFindings.length; i++) {
  md += `| ${i + 1} | ${topFindings[i]![0].replace(/\|/g, "\\|")} | ${topFindings[i]![1]} |\n`;
}

md += `\n## Recommendations\n\n`;
md += `1. Plugins with 🔴 High Risk findings should be reviewed immediately before deployment\n`;
md += `2. Consider integrating AgentShield into the dify-plugins CI pipeline\n`;
md += `3. Add \`.agent-shield.yml\` config to customize severity thresholds per plugin\n`;
md += `\n---\n\n*Generated by [AgentShield](https://github.com/elliotllliu/agent-shield) v0.3.0*\n`;

mkdirSync(join("/tmp/agent-shield/reports"), { recursive: true });
writeFileSync(OUTPUT, md);
console.log(`\nReport: ${OUTPUT}`);
console.log(`  🔴 High risk: ${highRisk.length}`);
console.log(`  🟡 Medium risk: ${mediumRisk.length}`);
console.log(`  🟢 Clean: ${clean.length}`);
console.log(`  Avg score: ${avgScore}/100`);
