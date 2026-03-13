import express from "express";
import { execSync } from "child_process";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML
app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Badge endpoint: /badge/:owner/:repo.svg
app.get("/badge/:owner/:repo.svg", async (req, res) => {
  const { owner, repo } = req.params;
  const subpath = req.query.path || "";

  try {
    const result = await cloneAndScan(`https://github.com/${owner}/${repo}.git`, String(subpath));
    const score = result.score;
    const color = score >= 90 ? "4c1" : score >= 70 ? "dfb317" : score >= 40 ? "fe7d37" : "e05d44";

    res.redirect(`https://img.shields.io/badge/AgentShield-${score}%2F100-${color}?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAxTDMgNXY2YzAgNS41NSAzLjg0IDEwLjc0IDkgMTIgNS4xNi0xLjI2IDktNi40NSA5LTEyVjVsLTktNHoiLz48L3N2Zz4=`);
  } catch (err) {
    res.redirect(`https://img.shields.io/badge/AgentShield-error-lightgrey`);
  }
});

// API endpoint
app.post("/api/scan", async (req, res) => {
  const { url, path: subpath } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Validate it's a GitHub URL
  const ghMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!ghMatch) {
    return res.status(400).json({ error: "Only GitHub URLs are supported" });
  }

  try {
    const repoUrl = `https://github.com/${ghMatch[1]}.git`;
    const result = await cloneAndScan(repoUrl, subpath || "");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET scan for easy sharing: /scan/:owner/:repo
app.get("/scan/:owner/:repo", (_req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

async function cloneAndScan(repoUrl, subpath) {
  const tmpDir = mkdtempSync(join(tmpdir(), "agent-shield-"));

  try {
    // Clone with depth 1
    execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}/repo 2>/dev/null`, {
      timeout: 30000,
    });

    const scanDir = subpath ? join(tmpDir, "repo", subpath) : join(tmpDir, "repo");

    if (!existsSync(scanDir)) {
      throw new Error(`Path "${subpath}" not found in repository`);
    }

    // Run agent-shield scan
    const cliPath = join(__dirname, "..", "dist", "cli.js");
    const output = execSync(`node ${cliPath} scan "${scanDir}" --json`, {
      timeout: 60000,
      encoding: "utf-8",
    });

    return JSON.parse(output);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

app.listen(PORT, () => {
  console.log(`🛡️  AgentShield Web running at http://localhost:${PORT}`);
});
