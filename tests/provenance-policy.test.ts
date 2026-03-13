import { test } from "node:test";
import assert from "node:assert";
import { generateManifest, saveManifest, loadManifest, verifyManifest, hashFiles, contentHash } from "../src/provenance.js";
import { evaluatePolicy, getAgentPolicy, POLICY_PRESETS } from "../src/policy.js";
import type { ScannedFile, ScanResult, AgentShieldConfig } from "../src/types.js";

// ─── Provenance tests ───

const mockFiles: ScannedFile[] = [
  { path: "/a/b.ts", relativePath: "b.ts", content: "const x = 1;", lines: ["const x = 1;"], ext: ".ts", context: "source" },
  { path: "/a/c.py", relativePath: "c.py", content: "x = 1", lines: ["x = 1"], ext: ".py", context: "source" },
];

test("hashFiles returns per-file SHA-256 hashes", () => {
  const hashes = hashFiles(mockFiles);
  assert.ok(hashes["b.ts"]);
  assert.ok(hashes["c.py"]);
  assert.strictEqual(typeof hashes["b.ts"], "string");
  assert.strictEqual(hashes["b.ts"]!.length, 64); // SHA-256 hex
});

test("contentHash is deterministic", () => {
  const h1 = contentHash(hashFiles(mockFiles));
  const h2 = contentHash(hashFiles(mockFiles));
  assert.strictEqual(h1, h2);
});

test("contentHash changes when file content changes", () => {
  const h1 = contentHash(hashFiles(mockFiles));
  const modified = [...mockFiles];
  modified[0] = { ...modified[0]!, content: "const x = 2;" };
  const h2 = contentHash(hashFiles(modified));
  assert.notStrictEqual(h1, h2);
});

test("generateManifest produces valid manifest", () => {
  const m = generateManifest("test-skill", "1.0.0", mockFiles, "A", 95);
  assert.strictEqual(m.name, "test-skill");
  assert.strictEqual(m.version, "1.0.0");
  assert.strictEqual(m.grade, "A");
  assert.strictEqual(m.score, 95);
  assert.ok(m.contentHash);
  assert.ok(m.createdAt);
  assert.strictEqual(Object.keys(m.files).length, 2);
});

test("verifyManifest detects no changes", () => {
  const m = generateManifest("test", "1.0.0", mockFiles);
  const result = verifyManifest(mockFiles, m);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.changed.length, 0);
  assert.strictEqual(result.added.length, 0);
  assert.strictEqual(result.removed.length, 0);
});

test("verifyManifest detects modified files", () => {
  const m = generateManifest("test", "1.0.0", mockFiles);
  const modified: ScannedFile[] = [
    { ...mockFiles[0]!, content: "CHANGED" },
    mockFiles[1]!,
  ];
  const result = verifyManifest(modified, m);
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.changed, ["b.ts"]);
});

test("verifyManifest detects added files", () => {
  const m = generateManifest("test", "1.0.0", mockFiles);
  const added: ScannedFile[] = [
    ...mockFiles,
    { path: "/a/d.js", relativePath: "d.js", content: "new", lines: ["new"], ext: ".js", context: "source" },
  ];
  const result = verifyManifest(added, m);
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.added, ["d.js"]);
});

test("verifyManifest detects removed files", () => {
  const m = generateManifest("test", "1.0.0", mockFiles);
  const result = verifyManifest([mockFiles[0]!], m);
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.removed, ["c.py"]);
});

// ─── Policy tests ───

const makeScanResult = (score: number, findings: { rule: string; severity: string }[] = []): ScanResult => ({
  target: "/test",
  filesScanned: 1,
  linesScanned: 100,
  findings: findings.map((f) => ({
    rule: f.rule,
    severity: f.severity as "high" | "medium" | "low",
    file: "test.ts",
    message: "test",
  })),
  score,
  duration: 100,
});

test("evaluatePolicy passes when all criteria met", () => {
  const result = makeScanResult(95);
  const policy = { minGrade: "A" as const, minScore: 90 };
  const evaluation = evaluatePolicy(result, policy);
  assert.strictEqual(evaluation.pass, true);
  assert.strictEqual(evaluation.reasons.length, 0);
});

test("evaluatePolicy fails on low grade", () => {
  const result = makeScanResult(50);
  const policy = { minGrade: "A" as const };
  const evaluation = evaluatePolicy(result, policy);
  assert.strictEqual(evaluation.pass, false);
  assert.ok(evaluation.reasons.some((r) => r.includes("Grade")));
});

test("evaluatePolicy fails on low score", () => {
  const result = makeScanResult(70);
  const policy = { minGrade: "C" as const, minScore: 80 };
  const evaluation = evaluatePolicy(result, policy);
  assert.strictEqual(evaluation.pass, false);
  assert.ok(evaluation.reasons.some((r) => r.includes("Score")));
});

test("evaluatePolicy fails on blocked rules", () => {
  const result = makeScanResult(95, [{ rule: "backdoor", severity: "high" }]);
  const policy = { minGrade: "A" as const, blockRules: ["backdoor"] };
  const evaluation = evaluatePolicy(result, policy);
  assert.strictEqual(evaluation.pass, false);
  assert.ok(evaluation.reasons.some((r) => r.includes("backdoor")));
});

test("evaluatePolicy fails on severity exceeding max", () => {
  const result = makeScanResult(80, [{ rule: "data-exfil", severity: "high" }]);
  const policy = { minGrade: "B" as const, maxSeverity: "medium" as const };
  const evaluation = evaluatePolicy(result, policy);
  assert.strictEqual(evaluation.pass, false);
  assert.ok(evaluation.reasons.some((r) => r.includes("Severity")));
});

test("getAgentPolicy returns agent-specific policy", () => {
  const config: AgentShieldConfig = {
    agents: {
      "email-agent": { minGrade: "A", minScore: 90 },
      "dev-tools": { minGrade: "C" },
    },
  };
  const policy = getAgentPolicy(config, "email-agent");
  assert.ok(policy);
  assert.strictEqual(policy.minGrade, "A");
  assert.strictEqual(policy.minScore, 90);
});

test("getAgentPolicy falls back to defaultPolicy", () => {
  const config: AgentShieldConfig = {
    defaultPolicy: { minGrade: "B" },
  };
  const policy = getAgentPolicy(config, "unknown-agent");
  assert.ok(policy);
  assert.strictEqual(policy.minGrade, "B");
});

test("getAgentPolicy returns null when no policy found", () => {
  const policy = getAgentPolicy({}, "unknown");
  assert.strictEqual(policy, null);
});

test("POLICY_PRESETS has strict/standard/permissive", () => {
  assert.ok(POLICY_PRESETS.strict);
  assert.ok(POLICY_PRESETS.standard);
  assert.ok(POLICY_PRESETS.permissive);
  assert.strictEqual(POLICY_PRESETS.strict!.minGrade, "A");
  assert.strictEqual(POLICY_PRESETS.standard!.minGrade, "B");
  assert.strictEqual(POLICY_PRESETS.permissive!.minGrade, "D");
});
