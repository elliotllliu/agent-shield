import { collectFiles, totalLines } from "./files.js";
import { rules } from "../rules/index.js";
import { computeScore } from "../score.js";
import { loadConfig, loadIgnorePatterns, isIgnored } from "../config.js";
import type { ScanResult, Finding, ScanConfig } from "../types.js";

/** Context types where findings are likely false positives */
const FP_CONTEXTS: Record<string, string> = {
  test: "Test file — assertions and mocks commonly trigger security patterns",
  deploy: "Deploy/CI script — HTTP requests and credential access are expected",
};

/** Rules most likely to false-positive in specific contexts */
const CONTEXT_FP_RULES: Record<string, Set<string>> = {
  test: new Set(["data-exfil", "env-leak", "backdoor", "network-ssrf", "sensitive-read", "phone-home"]),
  deploy: new Set(["data-exfil", "env-leak", "backdoor", "network-ssrf", "credential-hardcode"]),
};

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

  // Apply false positive detection based on file context
  for (const finding of findings) {
    // Find the file this finding is about
    const file = files.find(
      (f) => f.relativePath === finding.file || f.path === finding.file
    );
    if (file && FP_CONTEXTS[file.context]) {
      const fpRules = CONTEXT_FP_RULES[file.context];
      if (fpRules?.has(finding.rule)) {
        finding.possibleFalsePositive = true;
        finding.falsePositiveReason = FP_CONTEXTS[file.context]!;
        // Downgrade severity: critical → warning, warning → info
        if (finding.severity === "critical") {
          finding.severity = "warning";
        } else if (finding.severity === "warning") {
          finding.severity = "info";
        }
      }
    }
  }

  // Apply severity overrides from config (after FP detection, so user can override)
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
