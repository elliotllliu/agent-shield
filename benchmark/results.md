# AgentShield Benchmark Results

Generated: 2026-03-13T03:58:07.431Z
Duration: 226ms

## Summary

| Metric | Value |
|--------|-------|
| Malicious samples | 30 |
| Benign samples | 23 |
| True Positives | 30/30 |
| False Negatives | 0 |
| True Negatives | 23/23 |
| False Positives | 0 |
| **Recall** | **100.0%** |
| **Precision** | **100.0%** |
| **F1 Score** | **100.0%** |
| **FPR** | **0.0%** |
| **Accuracy** | **100.0%** |

## Malicious Samples

| File | Detected | Critical | Warning | Score | Rules |
|------|----------|----------|---------|-------|-------|
| malicious/01-instruction-override.md | ✅ | 0 | 7 | 0 | prompt-injection |
| malicious/02-identity-manipulation.md | ✅ | 0 | 8 | 0 | prompt-injection |
| malicious/03-system-prompt-attacks.md | ✅ | 0 | 10 | 0 | prompt-injection |
| malicious/04-hidden-instructions.md | ✅ | 1 | 7 | 0 | prompt-injection, sensitive-read |
| malicious/05-behavioral-hijacking.md | ✅ | 1 | 6 | 0 | tool-shadowing, prompt-injection |
| malicious/06-tool-poisoning.md | ✅ | 0 | 5 | 0 | prompt-injection |
| malicious/07-data-exfiltration.md | ✅ | 0 | 5 | 0 | prompt-injection, sensitive-read |
| malicious/08-encoding-evasion.md | ✅ | 0 | 4 | 0 | prompt-injection |
| malicious/09-advanced-attacks.md | ✅ | 0 | 12 | 0 | prompt-injection, sensitive-read |
| malicious/10-backdoor-eval.py | ✅ | 3 | 0 | 0 | backdoor |
| malicious/10-mcp-config-attacks.md | ✅ | 3 | 2 | 0 | prompt-injection, tool-shadowing, sensitive-read |
| malicious/11-credential-leak.py | ✅ | 3 | 1 | 0 | credential-hardcode, sensitive-read |
| malicious/11-subtle-injection.md | ✅ | 0 | 1 | 0 | prompt-injection |
| malicious/12-crypto-miner.py | ✅ | 4 | 0 | 0 | crypto-mining |
| malicious/12-suspicious-urls.md | ✅ | 0 | 5 | 0 | prompt-injection |
| malicious/13-data-exfil.py | ✅ | 2 | 4 | 0 | data-exfil, env-leak, sensitive-read, skill-risks |
| malicious/13-skill-risks.md | ✅ | 0 | 0 | 0 | skill-risks |
| malicious/14-env-exfil.py | ✅ | 1 | 1 | 0 | data-exfil, sensitive-read |
| malicious/14-multilang-injection.md | ✅ | 0 | 4 | 0 | prompt-injection |
| malicious/15-reverse-shell.sh | ✅ | 2 | 0 | 0 | reverse-shell |
| malicious/15-toxic-flow-config.json | ✅ | 2 | 0 | 0 |  |
| malicious/16-phone-home.py | ✅ | 1 | 1 | 0 | backdoor, phone-home |
| malicious/17-obfuscated-payload.py | ✅ | 3 | 0 | 0 | backdoor |
| malicious/18-supply-chain.sh | ✅ | 3 | 0 | 0 | backdoor |
| malicious/19-ssrf.py | ✅ | 1 | 0 | 0 | network-ssrf |
| malicious/20-tool-shadow.md | ✅ | 0 | 2 | 0 | prompt-injection |
| malicious/21-toxic-flow.md | ✅ | 0 | 1 | 0 | prompt-injection |
| malicious/22-skill-risks.md | ✅ | 0 | 0 | 0 | skill-risks |
| malicious/23-sensitive-read.py | ✅ | 0 | 6 | 0 | sensitive-read, skill-risks |
| malicious/24-privilege-escalation.sh | ✅ | 1 | 1 | 0 | backdoor, sensitive-read, skill-risks |

## Benign Samples

| File | Clean | Critical | Warning | Score |
|------|-------|----------|---------|-------|
| benign/01-weather-tool.md | ✅ | 0 | 0 | 70 |
| benign/02-code-formatter.md | ✅ | 0 | 0 | 70 |
| benign/03-git-helper.md | ✅ | 0 | 0 | 70 |
| benign/04-database-query.md | ✅ | 0 | 0 | 70 |
| benign/05-translation.md | ✅ | 0 | 0 | 70 |
| benign/06-image-resizer.md | ✅ | 0 | 0 | 70 |
| benign/07-markdown-preview.md | ✅ | 0 | 0 | 70 |
| benign/08-calculator.md | ✅ | 0 | 0 | 70 |
| benign/09-spell-checker.md | ✅ | 0 | 0 | 70 |
| benign/10-file-search.md | ✅ | 0 | 0 | 70 |
| benign/11-json-validator.md | ✅ | 0 | 0 | 70 |
| benign/11-security-tutorial.md | ✅ | 0 | 2 | 70 |
| benign/12-deployment-script.sh | ✅ | 0 | 0 | 70 |
| benign/12-test-generator.md | ✅ | 0 | 0 | 70 |
| benign/13-docker-helper.md | ✅ | 0 | 0 | 70 |
| benign/13-env-config-example.md | ✅ | 0 | 0 | 70 |
| benign/14-changelog.md | ✅ | 0 | 0 | 70 |
| benign/15-api-client.md | ✅ | 0 | 0 | 70 |
| benign/16-log-analyzer.py | ✅ | 0 | 0 | 70 |
| benign/17-mcp-tool-legit.json | ✅ | 0 | 0 | 70 |
| benign/18-cron-healthcheck.py | ✅ | 0 | 1 | 70 |
| benign/19-base64-codec.py | ✅ | 0 | 0 | 70 |
| benign/20-subprocess-tool.py | ✅ | 0 | 0 | 70 |
