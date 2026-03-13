# 🛡️ AgentShield — AI Agent 安全扫描器

[![npm](https://img.shields.io/npm/v/@elliotllliu/agent-shield)](https://www.npmjs.com/package/@elliotllliu/agent-shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-236%20passing-brightgreen)]()
[![F1 Score](https://img.shields.io/badge/F1-100%25-brightgreen)]()
[![Rules](https://img.shields.io/badge/rules-30-blue)]()

专为 AI Agent 技能、MCP Server、Dify 插件设计的安全扫描工具。检测数据窃取、后门、提示注入、工具投毒和供应链攻击。

**离线运行 · AST 级分析 · 开源免费 · 数据不出本机**

> 🆚 **对标 Snyk Agent Scan：** AgentShield 拥有 **30 条规则**（Snyk 仅 6 条），100% 本地运行，独家支持跨文件分析、杀伤链检测、AST 污点追踪、多语言注入检测。

## 为什么需要 AgentShield？

AI Agent 安装执行第三方技能和插件，安全审查几乎为零。一个恶意组件就能：

- 🔑 **偷凭证** — SSH 密钥、AWS Secret、API Token
- 📤 **外泄数据** — 读敏感文件发到外部服务器
- 💀 **植入后门** — `eval()`、反弹 Shell、动态代码执行
- 🧟 **投毒记忆** — 植入持久化指令，跨会话存活
- 🎭 **影子工具** — 用恶意版本覆盖合法工具
- ⛓️ **链式攻击** — 侦察 → 获取权限 → 收集数据 → 外泄 → 持久化

AgentShield 用 **30 条安全规则**、**Python AST 污点追踪**和**跨文件关联分析**检出这些威胁。

## 快速开始

```bash
# 扫描技能/插件（30 条规则，离线，<1s）
npx @elliotllliu/agent-shield scan ./my-skill/

# 扫描 Dify 插件（.difypkg 自动解压）
npx @elliotllliu/agent-shield scan ./plugin.difypkg

# AI 深度分析（用你自己的 API Key）
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider openai --model gpt-4o
npx @elliotllliu/agent-shield scan ./skill/ --ai --provider ollama --model llama3

# 发现本机已安装的 Agent
npx @elliotllliu/agent-shield discover

# CI/CD 集成
npx @elliotllliu/agent-shield scan ./skill/ --json --fail-under 70
```

## 30 条安全规则

### 🔴 高风险（-25 分/条）

| 规则 | 检测内容 |
|------|----------|
| `data-exfil` | 读敏感数据 + 发 HTTP 请求（外泄模式） |
| `backdoor` | `eval()`、`exec()`、`new Function()` + 动态输入 |
| `reverse-shell` | Socket 外连 + Shell 管道 |
| `crypto-mining` | 矿池连接、xmrig、coinhive |
| `credential-hardcode` | 硬编码 AWS Key (`AKIA...`)、GitHub PAT、Stripe Key |
| `obfuscation` | `eval(atob(...))`、十六进制混淆、`String.fromCharCode` |

### 🟡 中风险（-8 分/条）

| 规则 | 检测内容 |
|------|----------|
| `prompt-injection` | 55+ 模式：指令覆盖、身份操纵、TPA、编码绕过 |
| `multilang-injection` | **8 语言注入**：中/日/韩/俄/阿/西/法/德 🆕 |
| `tool-shadowing` | 跨服务器工具名冲突、工具覆盖攻击 |
| `env-leak` | 环境变量 + HTTP 外发（凭证窃取） |
| `network-ssrf` | 用户可控 URL、AWS 元数据端点 |
| `phone-home` | 定时器 + HTTP 心跳（信标/C2 模式） |
| `toxic-flow` | 跨工具数据泄露和破坏性流 |
| `skill-risks` | 金融操作、不可信内容、外部依赖 |
| `python-security` | 35 种模式：eval、pickle、subprocess、SQL 注入、SSTI |
| `cross-file` | **跨文件数据流**：A 读密钥 → B 发 HTTP 🆕 |
| `attack-chain` | **杀伤链检测**：侦察→获取→收集→外泄→持久化 🆕 |
| `description-integrity` | **描述-代码一致性**：声称只读但发网络请求 🆕 |
| `mcp-runtime` | **MCP 运行时**：debug inspector、非 HTTPS、工具爆炸 🆕 |
| `python-ast` | **AST 污点追踪**：`input()` → `eval()` 数据流 🆕 |

### 🟢 低风险（-2 分/条）

| 规则 | 检测内容 |
|------|----------|
| `privilege` | SKILL.md 声明 vs 代码实际行为不匹配 |
| `supply-chain` | npm 依赖已知 CVE |
| `sensitive-read` | 读取 `~/.ssh`、`~/.aws`、`~/.kube` |
| `excessive-perms` | 权限声明过多或过危险 |
| `mcp-manifest` | MCP 通配权限、未声明能力 |
| `typosquatting` | npm 包名仿冒：`1odash` → `lodash` |
| `hidden-files` | `.env` 明文密钥提交到仓库 |

## 🔬 独家能力

### 跨文件关联分析

不同于单文件扫描器，AgentShield 追踪整个代码库的数据流：

```
🔴 跨文件数据流：
   config_reader.py 读取密钥 → exfiltrator.py 发送 HTTP
   （通过 import 关联）
```

### 多步攻击链检测

5 阶段杀伤链模型：

```
侦察 → 获取权限 → 收集数据 → 外泄 → 持久化
🔴 完整杀伤链：apt.py:4 收集系统信息 → apt.py:8 读密钥 → apt.py:12 POST 到 C2
```

### Python AST 污点追踪

用 Python `ast` 模块精确分析，不是正则：

```python
user = input("cmd: ")
eval(user)          # → 🔴 HIGH：污染输入
eval("{'a': 1}")    # → ✅ 不标记（安全字面量）
```

### 多语言提示注入

8 种语言，大多数扫描器只查英文：

```
忽略上面的指令          → 🔴 中文注入
前の指示を無視          → 🔴 日文注入
이전의 지시를 무시       → 🔴 韩文注入
Игнорируй инструкции   → 🔴 俄文注入
```

## 真实验证：493 个 Dify 插件

我们扫描了完整的 [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) 仓库：

| 指标 | 数值 |
|------|------|
| 扫描插件数 | 493 |
| 分析文件数 | 9,862 |
| 代码行数 | 939,367 |
| 扫描耗时 | ~120s |
| 平均分 | **93/100** |

| 风险等级 | 数量 | 占比 |
|----------|------|------|
| 🔴 高风险（真实问题） | 6 | 1.2% |
| 🟡 中风险 | 73 | 14.8% |
| 🟢 安全 | 414 | 84.0% |

**6 个确认高风险插件**存在真实的 `eval()`/`exec()` 执行动态代码。高风险零误报。

## 对比：AgentShield vs Snyk Agent Scan

| 功能 | AgentShield | Snyk Agent Scan |
|------|------------|-----------------|
| 安全规则 | **30 条** | 6 条 |
| 跨文件分析 | ✅ import 图 + 数据流 | ❌ 单文件 |
| 杀伤链检测 | ✅ 5 阶段模型 | ❌ |
| AST 污点追踪 | ✅ Python ast 模块 | ❌ |
| 多语言注入 | ✅ 8 种语言 | ❌ 仅英文 |
| 描述-代码一致性 | ✅ 语义不匹配 | ❌ |
| MCP 运行时分析 | ✅ 配置 + schema | 部分 |
| Python 安全 | ✅ 35 模式 + AST | ❌ |
| Dify .difypkg | ✅ 自动解压 | ❌ |
| 提示注入 | ✅ 55+ 正则 + AI | ✅ LLM（云端） |
| 100% 离线 | ✅ | ❌ 需要云端 |
| 零安装 (`npx`) | ✅ | ❌ 需要 Python + uv |
| GitHub Action | ✅ | ❌ |
| 无需账号 | ✅ | ❌ 需要 Snyk Token |
| 自选 LLM | ✅ OpenAI/Anthropic/Ollama | ❌ |
| 开源透明 | ✅ | ❌ 黑盒 |

## CI 集成

### GitHub Action

```yaml
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

## Benchmark

| 指标 | 数值 |
|------|------|
| 样本数 | 57（33 恶意 + 24 良性） |
| 召回率 | 100% |
| 精确率 | 100% |
| F1 分数 | **100%** |
| 误报率 | 0% |

## 链接

- 📦 [npm](https://www.npmjs.com/package/@elliotllliu/agent-shield)
- 📖 [规则文档](docs/rules.md)
- 🇬🇧 [English README](README.md)

## 许可证

MIT
