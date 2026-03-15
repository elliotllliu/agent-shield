/**
 * Engine orchestrator — runs all available engines and merges results.
 */

import type {
  ScanEngine,
  EngineResult,
  EngineFinding,
  EngineScanOptions,
  MergedFinding,
  AggregatedResult,
} from "./types.js";
import { NativeEngine } from "./native-adapter.js";
import { SnykEngine } from "./snyk-adapter.js";
import { CiscoEngine } from "./cisco-adapter.js";
import { TencentEngine } from "./tencent-adapter.js";

// ─── Registry ───

/** All registered engines in priority order */
export function getAllEngines(): ScanEngine[] {
  return [new NativeEngine(), new SnykEngine(), new CiscoEngine(), new TencentEngine()];
}

/** Get engines by name */
export function getEnginesByName(names: string[]): ScanEngine[] {
  const all = getAllEngines();
  if (names.includes("all")) return all;
  return all.filter((e) => names.includes(e.name));
}

// ─── Orchestrator ───

/**
 * Run selected engines in parallel and aggregate results.
 */
export async function runEngines(
  dir: string,
  engineNames: string[] = ["all"],
  options?: EngineScanOptions
): Promise<AggregatedResult> {
  const start = Date.now();
  const engines = getEnginesByName(engineNames);

  // Check availability
  const availability = await Promise.all(
    engines.map(async (e) => ({ engine: e, available: await e.available() }))
  );

  const available = availability.filter((a) => a.available).map((a) => a.engine);
  const enginesAvailable = available.map((e) => e.name);

  // Run all available engines in parallel
  const results = await Promise.all(available.map((e) => e.scan(dir, options)));

  const enginesRan = results.filter((r) => r.success).map((r) => r.engine);

  // Merge findings
  const allFindings = results.flatMap((r) => r.findings);
  const mergedFindings = mergeFindings(allFindings, enginesRan.length);

  // Count files (from native engine or estimate)
  const nativeResult = results.find((r) => r.engine === "agentshield");
  const filesScanned = 0; // Will be filled by caller if needed

  // Compute unified score
  const score = computeUnifiedScore(mergedFindings);

  return {
    target: dir,
    filesScanned,
    engineResults: results,
    mergedFindings,
    enginesAvailable,
    enginesRan,
    duration: Date.now() - start,
    score,
  };
}

// ─── Finding Merger ───

/**
 * Generate a fingerprint for dedup.
 * Findings about the same file+line+type should merge.
 */
function fingerprint(f: EngineFinding): string {
  const file = f.file.replace(/\\/g, "/").toLowerCase();
  const line = f.line ? `:${f.line}` : "";
  // Normalize rule IDs to catch cross-engine duplicates
  const category = categorize(f);
  return `${file}${line}:${category}`;
}

/**
 * Categorize a finding into a broad category for cross-engine dedup.
 */
function categorize(f: EngineFinding): string {
  const text = `${f.ruleId} ${f.title} ${f.description}`.toLowerCase();

  if (text.match(/prompt.?inject|hidden.?instruct|html.?comment/)) return "prompt-injection";
  if (text.match(/exfil|data.?leak|send.*secret|steal/)) return "data-exfiltration";
  if (text.match(/backdoor|eval|exec|child_process|shell/)) return "code-execution";
  if (text.match(/credential|password|api.?key|token|secret/)) return "credential-exposure";
  if (text.match(/\.ssh|\.aws|\.env\b|sensitive.?path/)) return "sensitive-file-access";
  if (text.match(/supply.?chain|depend|package/)) return "supply-chain";
  if (text.match(/overwrite|shadow|override|tool.?poison/)) return "tool-poisoning";

  return f.ruleId.toLowerCase();
}

/**
 * Merge findings from multiple engines, deduplicating by fingerprint.
 */
export function mergeFindings(findings: EngineFinding[], totalEngines: number): MergedFinding[] {
  const groups = new Map<string, EngineFinding[]>();

  for (const f of findings) {
    const fp = fingerprint(f);
    const existing = groups.get(fp) || [];
    existing.push(f);
    groups.set(fp, existing);
  }

  const merged: MergedFinding[] = [];

  for (const [fp, group] of groups) {
    // Pick highest severity
    const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const sorted = [...group].sort(
      (a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    );
    const primary = sorted[0]!;

    // Aggregate engines that flagged this
    const flaggedBy = [...new Set(group.map((f) => f.engine))];

    // Consensus: ratio of engines that found this × confidence boost
    const consensus = Math.min(1, (flaggedBy.length / totalEngines) * 1.2);

    // Best recommendation (longest one)
    const recommendations = group
      .map((f) => f.recommendation)
      .filter(Boolean)
      .sort((a, b) => (b?.length || 0) - (a?.length || 0));

    // Merge references
    const refs: MergedFinding["references"] = {};
    for (const f of group) {
      if (f.references?.owasp) refs.owasp = f.references.owasp;
      if (f.references?.cwe) refs.cwe = f.references.cwe;
      if (f.references?.atlas) refs.atlas = f.references.atlas;
    }

    merged.push({
      fingerprint: fp,
      title: primary.title,
      description: primary.description,
      severity: primary.severity,
      file: primary.file,
      line: primary.line,
      evidence: primary.evidence,
      recommendation: recommendations[0] || undefined,
      references: Object.keys(refs).length > 0 ? refs : undefined,
      flaggedBy,
      totalEngines,
      consensus,
      engineDetails: group,
    });
  }

  // Sort: high severity first, then by consensus
  merged.sort((a, b) => {
    const sevDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (sevDiff !== 0) return sevDiff;
    return b.consensus - a.consensus;
  });

  return merged;
}

const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ─── Unified Score ───

/**
 * Compute a unified score (0-100) based on merged findings.
 * Higher score = safer. Weighted by severity and consensus.
 */
export function computeUnifiedScore(findings: MergedFinding[]): number {
  let deductions = 0;

  for (const f of findings) {
    const sevWeight = f.severity === "high" ? 15 : f.severity === "medium" ? 5 : 1;
    // Higher consensus = more deduction (more engines agree = more certain)
    const consensusMultiplier = 0.5 + f.consensus * 0.5;
    deductions += sevWeight * consensusMultiplier;
  }

  return Math.max(0, Math.round(100 - deductions));
}
