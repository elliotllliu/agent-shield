import type { ScanResult, Finding } from "../types.js";
import { riskLabel } from "../score.js";

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHtmlReport(result: ScanResult): string {
  const { target, filesScanned, linesScanned, findings, score, duration } = result;

  const high = findings.filter(f => f.severity === "high" && !f.possibleFalsePositive);
  const medium = findings.filter(f => f.severity === "medium" && !f.possibleFalsePositive);
  const low = findings.filter(f => f.severity === "low" && !f.possibleFalsePositive);

  const scoreColor = score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const riskText = riskLabel(score);

  const renderFinding = (f: Finding, i: number) => {
    const loc = f.line ? `${escHtml(f.file)}:${f.line}` : escHtml(f.file);
    const sevColor = f.severity === "high" ? "#ef4444" : f.severity === "medium" ? "#eab308" : "#22c55e";
    return `<tr>
      <td style="text-align:center"><span style="color:${sevColor};font-size:1.2em">${f.severity === "high" ? "🔴" : f.severity === "medium" ? "🟡" : "🟢"}</span></td>
      <td><code>${loc}</code></td>
      <td><code>${escHtml(f.rule)}</code></td>
      <td>${escHtml(f.message)}${f.evidence ? `<br><code style="color:#888;font-size:0.85em">${escHtml(f.evidence)}</code>` : ""}</td>
    </tr>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgentShield Report — ${escHtml(target)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { color: #f0f6fc; margin-bottom: 0.5rem; }
  .subtitle { color: #8b949e; margin-bottom: 2rem; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .score-section { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
  .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 6px solid ${scoreColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .score-num { font-size: 2.5rem; font-weight: bold; color: ${scoreColor}; }
  .score-label { font-size: 0.85rem; color: ${scoreColor}; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; flex: 1; }
  .stat { text-align: center; }
  .stat-value { font-size: 1.8rem; font-weight: bold; }
  .stat-label { color: #8b949e; font-size: 0.85rem; }
  .severity-bar { display: flex; gap: 1rem; margin: 1rem 0; flex-wrap: wrap; }
  .severity-badge { padding: 0.4rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem; }
  .badge-high { background: rgba(239,68,68,0.15); color: #ef4444; }
  .badge-medium { background: rgba(234,179,8,0.15); color: #eab308; }
  .badge-low { background: rgba(34,197,94,0.15); color: #22c55e; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #30363d; color: #8b949e; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 0.75rem; border-bottom: 1px solid #21262d; vertical-align: top; }
  code { background: #1c2128; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
  .footer { text-align: center; color: #484f58; margin-top: 2rem; font-size: 0.85rem; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
  <h1>🛡️ AgentShield Scan Report</h1>
  <p class="subtitle">Generated ${new Date().toISOString().split("T")[0]} · <a href="https://github.com/elliotllliu/agent-shield">github.com/elliotllliu/agent-shield</a></p>

  <div class="card">
    <div class="score-section">
      <div class="score-circle">
        <div class="score-num">${score}</div>
        <div class="score-label">${riskText}</div>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${filesScanned}</div>
          <div class="stat-label">Files Scanned</div>
        </div>
        <div class="stat">
          <div class="stat-value">${linesScanned >= 1000 ? (linesScanned / 1000).toFixed(1) + "K" : linesScanned}</div>
          <div class="stat-label">Lines of Code</div>
        </div>
        <div class="stat">
          <div class="stat-value">${duration}ms</div>
          <div class="stat-label">Scan Time</div>
        </div>
        <div class="stat">
          <div class="stat-value">${findings.filter(f => !f.possibleFalsePositive).length}</div>
          <div class="stat-label">Findings</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 style="margin-bottom:1rem">📊 Summary</h2>
    <p style="margin-bottom:0.5rem"><strong>Target:</strong> <code>${escHtml(target)}</code></p>
    <div class="severity-bar">
      ${high.length > 0 ? `<span class="severity-badge badge-high">🔴 ${high.length} High</span>` : ""}
      ${medium.length > 0 ? `<span class="severity-badge badge-medium">🟡 ${medium.length} Medium</span>` : ""}
      ${low.length > 0 ? `<span class="severity-badge badge-low">🟢 ${low.length} Low</span>` : ""}
      ${high.length === 0 && medium.length === 0 && low.length === 0 ? '<span style="color:#22c55e;font-weight:600">✅ No security issues found!</span>' : ""}
    </div>
  </div>

  ${[...high, ...medium, ...low].length > 0 ? `
  <div class="card">
    <h2 style="margin-bottom:1rem">🔍 Findings</h2>
    <table>
      <thead><tr><th>Sev</th><th>Location</th><th>Rule</th><th>Details</th></tr></thead>
      <tbody>
        ${[...high, ...medium, ...low].map((f, i) => renderFinding(f, i)).join("\n        ")}
      </tbody>
    </table>
  </div>` : ""}

  <p class="footer">Powered by <a href="https://github.com/elliotllliu/agent-shield">AgentShield</a> · 31 security rules · Open source (MIT)</p>
</div>
</body>
</html>`;
}
