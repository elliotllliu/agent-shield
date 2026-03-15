# AgentShield Methodology

## Philosophy

AgentShield is a **risk scanner**, not a judge. We detect code patterns and map them to established security standards. We do not claim that any specific finding means a project is "safe" or "unsafe" — that determination depends on context, intent, and risk tolerance.

> **We are an X-ray machine, not a doctor.** We show what patterns exist and cite established standards — you decide what they mean for your use case.

## How Detection Works

### 1. Static Pattern Matching

AgentShield scans source code files for patterns known to be associated with security risks. Each pattern is derived from:

- **Published vulnerability research** (CVEs, academic papers)
- **OWASP guidelines** for LLM application security
- **Real-world attack case studies** documented by security researchers

### 2. AST Analysis

For Python code, AgentShield uses Abstract Syntax Tree (AST) analysis to trace data flow from sources (user input, file reads) to sinks (eval, exec, HTTP requests). This dramatically reduces false positives compared to regex-only approaches.

### 3. Cross-File Correlation

AgentShield correlates findings across multiple files to detect multi-step attack patterns:
- File A reads credentials → File B sends HTTP requests
- File A runs system recon → File B establishes persistence

### 4. Context-Aware Classification

Each finding includes:
- **Severity**: Based on the potential impact of the detected pattern
- **Confidence**: Whether the pattern is a definitive match or needs review
- **References**: Links to the relevant OWASP/CWE/MITRE standard

## Standards Mapping

Every rule is mapped to one or more of these frameworks:

### OWASP Top 10 for Large Language Model Applications (2025)

The industry standard for LLM application security, maintained by the Open Worldwide Application Security Project.

| OWASP ID | Name | Our Rules |
|----------|------|-----------|
| LLM01 | Prompt Injection | `prompt-injection`, `prompt-injection-llm`, `multilang-injection` |
| LLM06 | Sensitive Information Disclosure | `data-exfil`, `env-leak`, `sensitive-read`, `credential-hardcode`, `phone-home` |
| LLM07 | Insecure Plugin Design | `tool-shadowing`, `description-integrity`, `mcp-manifest`, `mcp-runtime`, `network-ssrf`, `skill-risks`, `privilege` |
| LLM09 | Supply Chain Vulnerabilities | `skill-hijack`, `backdoor`, `reverse-shell`, `attack-chain`, `cross-file`, `supply-chain`, `typosquatting`, `obfuscation`, `crypto-mining` |

### MITRE ATLAS (Adversarial Threat Landscape for AI Systems)

A knowledge base of adversary tactics and techniques against AI/ML systems, maintained by MITRE Corporation.

| ATLAS ID | Name | Our Rules |
|----------|------|-----------|
| AML.T0048.004 | Exfiltration via ML Inference API | `data-exfil` |
| AML.T0049 | Supply Chain Compromise | `skill-hijack`, `attack-chain`, `supply-chain` |
| AML.T0051 | LLM Prompt Injection | `prompt-injection`, `multilang-injection` |
| AML.T0052 | Poisoned AI Supply Chain | `tool-shadowing` |

### CWE (Common Weakness Enumeration)

A community-developed list of software and hardware weakness types, maintained by MITRE and funded by CISA.

| CWE ID | Name | Our Rules |
|--------|------|-----------|
| CWE-77 | Command Injection | `prompt-injection`, `multilang-injection` |
| CWE-94 | Code Generation | `backdoor`, `python-security` |
| CWE-200 | Information Exposure | `data-exfil`, `phone-home` |
| CWE-250 | Unnecessary Privileges | `privilege`, `skill-risks` |
| CWE-400 | Resource Consumption | `crypto-mining` |
| CWE-502 | Deserialization | `toxic-flow` |
| CWE-506 | Embedded Malicious Code | `reverse-shell`, `attack-chain`, `cross-file`, `obfuscation` |
| CWE-526 | Env Variable Exposure | `env-leak` |
| CWE-538 | File Insertion | `sensitive-read`, `hidden-files` |
| CWE-676 | Dangerous Function | `go-rust-security` |
| CWE-798 | Hard-coded Credentials | `credential-hardcode` |
| CWE-829 | Untrusted Control Sphere | `skill-hijack`, `supply-chain`, `typosquatting` |
| CWE-862 | Missing Authorization | `mcp-runtime` |
| CWE-918 | SSRF | `network-ssrf` |

## Academic References

1. **Greshake, K. et al.** (2023). "Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection." *arXiv:2302.12173*. [Link](https://arxiv.org/abs/2302.12173)
   - Used for: prompt-injection rules, indirect injection detection

2. **Liu, Y. et al.** (2024). "Automatic and Universal Prompt Injection Attacks against Large Language Models." *arXiv:2403.04957*. [Link](https://arxiv.org/abs/2403.04957)
   - Used for: automated prompt injection pattern detection

3. **Invariant Labs** (2024). "Tool Poisoning Attacks on MCP Servers." [Link](https://invariantlabs.ai/research/mcp-security)
   - Used for: tool-shadowing, MCP-specific attack detection

4. **NIST AI 100-2** (2024). "Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations."
   - Used for: overall threat taxonomy alignment

## Reference Score (Optional)

When invoked with `--score`, AgentShield provides a reference risk density metric. This score is:

- **Density-based**: Reflects the number and severity of detected patterns, weighted by confidence
- **Opinionated**: The weights are our interpretation, not an industry standard
- **Contextual**: Adjusted for SDK awareness, auth flow recognition, and repair tool context
- **Supplementary**: Not shown by default — the risk inventory is the primary output

The score should not be treated as a definitive safety judgment. Different organizations have different risk tolerances, and a pattern that is acceptable in one context may be unacceptable in another.

## False Positive Handling

AgentShield employs multiple strategies to reduce false positives:

1. **AST analysis** for Python (not just regex)
2. **SDK awareness** for 25+ known SDKs (AWS, Feishu, OpenAI, etc.)
3. **Auth flow recognition** (OAuth2, JWT patterns)
4. **Repair tool context** (security-check.js, doctor.js)
5. **Help text exclusion** (console.log, comments, documentation)
6. **Confidence scoring** (high/medium/low per finding)
7. **Context-aware severity** (SKILL.md vs general .md)

If you encounter a false positive, please [open an issue](https://github.com/elliotllliu/agent-shield/issues) with the code snippet and expected behavior.
