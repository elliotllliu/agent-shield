import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pythonSecurityRule } from "../src/rules/python-security.js";
import type { ScannedFile } from "../src/types.js";

function pyFile(name: string, content: string): ScannedFile {
  return {
    path: `/fake/${name}`,
    relativePath: name,
    content,
    lines: content.split("\n"),
    ext: ".py",
    context: "source",
  };
}

// ============================================================
// Code execution
// ============================================================
describe("python-security: code execution", () => {
  it("detects eval() with variable", () => {
    const f = pyFile("bad.py", `result = eval(user_input)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("eval()")));
  });

  it("does NOT flag eval('True')", () => {
    const f = pyFile("ok.py", `result = eval('True')`);
    const findings = pythonSecurityRule.run([f]);
    assert.equal(findings.filter(f => f.message.includes("eval()")).length, 0);
  });

  it("detects exec() with variable", () => {
    const f = pyFile("bad.py", `exec(code_string)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("exec()")));
  });

  it("detects __import__()", () => {
    const f = pyFile("bad.py", `mod = __import__(module_name)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("__import__")));
  });
});

// ============================================================
// Command injection
// ============================================================
describe("python-security: command injection", () => {
  it("detects os.system()", () => {
    const f = pyFile("bad.py", `os.system(f"rm -rf {path}")`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("os.system")));
  });

  it("detects subprocess with shell=True", () => {
    const f = pyFile("bad.py", `subprocess.run(cmd, shell=True)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("shell=True")));
  });

  it("detects os.popen()", () => {
    const f = pyFile("bad.py", `os.popen("ls " + user_input)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("os.popen")));
  });
});

// ============================================================
// Unsafe deserialization
// ============================================================
describe("python-security: deserialization", () => {
  it("detects pickle.load", () => {
    const f = pyFile("bad.py", `data = pickle.load(open("data.pkl", "rb"))`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("pickle")));
  });

  it("detects yaml.load without Loader", () => {
    const f = pyFile("bad.py", `config = yaml.load(open("config.yml"))`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("yaml.load")));
  });

  it("detects marshal.load", () => {
    const f = pyFile("bad.py", `obj = marshal.load(f)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("marshal")));
  });
});

// ============================================================
// SQL injection
// ============================================================
describe("python-security: SQL injection", () => {
  it("detects f-string in execute()", () => {
    const f = pyFile("bad.py", `cursor.execute(f"SELECT * FROM users WHERE id={uid}")`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("SQL")));
  });

  it("detects % formatting in execute()", () => {
    const f = pyFile("bad.py", `cursor.execute("SELECT * FROM users WHERE id=%s" % uid)`);
    const findings = pythonSecurityRule.run([f]);
    assert.ok(findings.some(f => f.message.includes("SQL")));
  });
});

// ============================================================
// Safe code
// ============================================================
describe("python-security: safe patterns", () => {
  it("does NOT flag comments", () => {
    const f = pyFile("safe.py", `# eval(user_input) is dangerous`);
    const findings = pythonSecurityRule.run([f]);
    assert.equal(findings.length, 0);
  });

  it("does NOT flag non-python files", () => {
    const f: ScannedFile = {
      path: "/fake/safe.ts",
      relativePath: "safe.ts",
      content: `eval(user_input)`,
      lines: [`eval(user_input)`],
      ext: ".ts",
      context: "source",
    };
    const findings = pythonSecurityRule.run([f]);
    assert.equal(findings.length, 0);
  });

  it("does NOT flag safe subprocess usage", () => {
    const f = pyFile("safe.py", `subprocess.run(["ls", "-la"], check=True)`);
    const findings = pythonSecurityRule.run([f]);
    assert.equal(findings.filter(f => f.severity === "high").length, 0);
  });
});
