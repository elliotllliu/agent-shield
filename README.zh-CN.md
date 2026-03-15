# 🛡️ AgentShield

**AI Agent 风险扫描器 — 基于 OWASP/MITRE/CWE 标准检测安全风险**

[![npm](https://img.shields.io/npm/v/@elliotllliu/agent-shield)](https://www.npmjs.com/package/@elliotllliu/agent-shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-297%20passing-brightgreen)]()
[![Rules](https://img.shields.io/badge/rules-29-blue)]()
[![Standards](https://img.shields.io/badge/OWASP%20LLM-mapped-orange)]()

扫描 AI Agent 的 Skill、MCP Server、插件，检测数据泄露、后门、Prompt 注入、工具投毒和供应链风险。每条检测结果都映射到 **OWASP Top 10 for LLM**、**MITRE ATLAS** 和 **CWE** 标准。

**我们是 X 光机，不是医生。我们照出里面有什么——你来决定它意味着什么。**

```bash
npx @elliotllliu/agent-shield scan ./my-skill/
```

---

## 💡 输出示例

```
🛡️  AgentShield Risk Report
────────────────────────────────────────────────────
📁 Target:  ./my-plugin
📄 Files:   8 files, 262 lines
⏱  Time:    245ms
────────────────────────────────────────────────────

📊 Risk Summary

  🔴 LLM09: Supply Chain Vulnerabilities (3 high, 2 medium)
     https://genai.owasp.org/llmrisk/llm09-supply-chain-vulnerabilities/
  🟡 LLM06: Sensitive Information Disclosure (1 medium)
     https://genai.owasp.org/llmrisk/llm06-sensitive-information-disclosure/
  🟢 LLM01: Prompt Injection (2 low)
     https://genai.owasp.org/llmrisk/llm01-prompt-injection/

📋 Detailed Findings

  [LLM09: Supply Chain Vulnerabilities]
  Skill/plugin 行为劫持 — 修改 Agent 配置、注入 Prompt 或覆盖其他 Skill
  Standards: OWASP LLM09 · CWE-829 · ATLAS AML.T0049
  Research: Greshake et al. (2023) "Not what you've signed up for"

    ├─ plugin.ts:15 — 插件通过 before_prompt_build 注入内容
    ├─ install.sh:8 — 配置篡改：修改 Agent 配置
    └─ SKILL.md:5  — 行为覆写：强制使用指令
```

---

## 🏆 特色

### 1. 📚 基于权威标准的检测

每条 finding 都映射到权威安全框架，不是我们自己定义的标准：

| 标准 | 覆盖规则数 | 用途 |
|------|-----------|------|
| [OWASP Top 10 for LLM](https://genai.owasp.org/) | 26/29 | LLM 应用安全行业标准 |
| [CWE](https://cwe.mitre.org/) | 24/29 | 通用弱点枚举（MITRE） |
| [MITRE ATLAS](https://atlas.mitre.org/) | 7/29 | AI 系统对抗性威胁 |
| 学术论文 | 4 条 | Prompt 注入和工具投毒的同行评审研究 |

### 2. 🔒 运行时 MCP 拦截

不仅扫描源代码，还能在 MCP 客户端和服务端之间**实时拦截**每条 JSON-RPC 消息：

```bash
agent-shield proxy node my-mcp-server.js
agent-shield proxy --enforce python mcp_server.py
```

### 3. ⛓️ 跨文件攻击链检测

大多数扫描器逐文件检查。AgentShield 追踪整个代码库的数据流：

```
🔴 跨文件数据流 (OWASP LLM09 · CWE-506):
   config_reader.py 读取 ~/.ssh/id_rsa → exfiltrator.py 发送 HTTP

🔴 杀伤链检测 (ATLAS AML.T0049):
   侦察 → 访问 → 收集 → 外渗 → 持久化
```

### 4. 🧠 AST 污点追踪

Python AST 精确分析，大幅减少误报：

```python
eval(user_input)    # → 🔴 受污染输入流入 eval (CWE-94)
eval("{'a': 1}")    # → ✅ 不标记（安全字符串）
```

### 5. 🕵️ Skill 劫持检测

检测针对 AI Agent 生态的多层供应链攻击：插件 Prompt 注入、配置篡改、静默 OTA 更新、非标准安装源。

---

## ⚡ 快速开始

```bash
# 扫描（29 条规则，离线运行，<1 秒）
npx @elliotllliu/agent-shield scan ./my-skill/

# 多引擎聚合扫描 — 多个扫描器同时运行，交叉验证
npx @elliotllliu/agent-shield scan ./my-skill/ --engines all

# 附带参考分数（可选）
npx @elliotllliu/agent-shield scan ./my-skill/ --score

# 扫描 Dify 插件
npx @elliotllliu/agent-shield scan ./plugin.difypkg

# 运行时拦截
npx @elliotllliu/agent-shield proxy node my-mcp-server.js

# AI 深度分析
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider openai --model gpt-4o

# JSON 输出（含 OWASP/CWE 引用）
npx @elliotllliu/agent-shield scan ./skill/ --json

# SARIF 输出（GitHub Code Scanning）
npx @elliotllliu/agent-shield scan ./skill/ --sarif -o results.sarif
```

---

## 🔗 多引擎聚合扫描

同时运行多个安全扫描器，生成统一报告。**交叉验证** — 多个引擎同时标记的问题可信度更高。

```bash
# 运行所有可用引擎
agent-shield scan ./my-skill/ --engines all

# 指定引擎
agent-shield scan ./my-skill/ --engines agentshield,aguara

# 列出可用引擎
agent-shield scan ./my-skill/ --engines list
```

### 已集成引擎

| 引擎 | 专注领域 | 安装方式 |
|------|---------|---------|
| **AgentShield**（内置） | AI Agent 专项：Skill 劫持、Prompt 注入、MCP 运行时 | 无需安装 |
| **[Aguara](https://github.com/garagon/aguara)** | 177 规则：Prompt 注入、数据外渗、NLP + 污点追踪 | ✅ 自动安装 |
| **[Semgrep](https://github.com/semgrep/semgrep)** | 通用 SAST：注入、XSS、SSRF、硬编码凭证（2000+ 规则） | ✅ 自动安装 |
| **[Invariant mcp-scan](https://github.com/invariantlabs-ai/mcp-scan)** | MCP 专项：Tool Poisoning、跨域提权、Rug Pull 检测 | ✅ 自动安装 |

### 共识判断

多引擎扫描的核心价值 — 不取最差结果，看多引擎共识：

| 情况 | 综合结论 |
|------|---------|
| 2+ 引擎标高风险 | 🔴 确实需要关注 |
| 1 引擎标高风险，其余干净 | ⚠️ 可能误报，建议确认 |
| 2+ 引擎标中等风险 | ⚠️ 建议检查 |
| 1 引擎标中等，其余干净 | ✅ 整体安全 |
| 只有低风险 | ✅ 安全，常规行为 |
| 全部干净 | ✅ 所有引擎均未检出 |

```
📊 综合结论

⚠️ 单个引擎标记高风险，其余未发现问题
   3/5 个引擎未检出风险，高风险标记可能为误报
   建议人工确认标记项是否为正常功能

  ✅ 后门/远程控制  — 5 个引擎均未检出
  ✅ 数据窃取外渗   — 5 个引擎均未检出
  ✅ Prompt 指令注入 — 5 个引擎均未检出
```

> 我们聚合，不竞争。每个引擎都有独特优势——组合起来覆盖更全、可信度更高。

---

## 🔍 29 条安全规则（映射到标准）

### 代码执行 (OWASP LLM09 · CWE-94)

| 规则 | 检测内容 | CWE |
|------|---------|-----|
| `backdoor` | eval/exec/new Function 动态执行 | CWE-94 |
| `reverse-shell` | 出站 socket 连接管道到 shell | CWE-506 |
| `crypto-mining` | 矿池连接、xmrig | CWE-400 |
| `python-security` | 35 种模式：eval、pickle、subprocess | CWE-94 |

### 数据安全 (OWASP LLM06 · CWE-200)

| 规则 | 检测内容 | CWE |
|------|---------|-----|
| `data-exfil` | 读取敏感数据 + 发送 HTTP | CWE-200 |
| `env-leak` | 环境变量 + 出站 HTTP | CWE-526 |
| `credential-hardcode` | 硬编码 AWS 密钥、GitHub PAT | CWE-798 |

### 工具完整性 (OWASP LLM07)

| 规则 | 检测内容 | 标准 |
|------|---------|------|
| `tool-shadowing` | 跨服务器工具名冲突 | ATLAS AML.T0052 |
| `prompt-injection` | 55+ 模式：指令覆写、身份操纵 | CWE-77 |
| `multilang-injection` | 8 语言注入：中日韩俄阿西法德 | CWE-77 |

### 供应链 (OWASP LLM09 · ATLAS AML.T0049)

| 规则 | 检测内容 | CWE |
|------|---------|-----|
| `skill-hijack` | 插件 Prompt 注入、配置篡改、静默 OTA | CWE-829 |
| `attack-chain` | 多阶段杀伤链（侦察→外渗） | CWE-506 |
| `cross-file` | 跨文件协同攻击 | CWE-506 |

---

## 📚 方法论与参考文献

- **OWASP Top 10 for LLM Applications (2025)** — [genai.owasp.org](https://genai.owasp.org/)
- **MITRE ATLAS** — [atlas.mitre.org](https://atlas.mitre.org/)
- **CWE** — [cwe.mitre.org](https://cwe.mitre.org/)
- Greshake et al. (2023) — *"Not what you've signed up for"* — [arXiv:2302.12173](https://arxiv.org/abs/2302.12173)
- Liu et al. (2024) — *"Automatic and Universal Prompt Injection"* — [arXiv:2403.04957](https://arxiv.org/abs/2403.04957)
- Invariant Labs (2024) — *"Tool Poisoning Attacks on MCP Servers"* — [invariantlabs.ai](https://invariantlabs.ai/research/mcp-security)

---

## 🤝 贡献

欢迎贡献：
- 新检测规则（附 CWE/OWASP 映射）
- 误报/漏报反馈
- 第三方基准测试结果

📦 [npm](https://www.npmjs.com/package/@elliotllliu/agent-shield) · 📖 [规则文档](docs/rules.md) · 🤖 [GitHub App](github-app/README.md) · 💻 [VS Code 扩展](vscode-extension/README.md) · 🔌 [集成指南](docs/integration-guide.md) · 🇬🇧 [English README](README.md)

## License

MIT
