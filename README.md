# 🛡️ Agent Shield

**轻量级开源 AI Agent 安全扫描工具 — 静态分析 + 运行时拦截**

[![npm](https://img.shields.io/npm/v/@elliotllliu/agent-shield)](https://www.npmjs.com/package/@elliotllliu/agent-shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-236%20passing-brightgreen)]()
[![Rules](https://img.shields.io/badge/rules-31-blue)]()

> 免费、离线、零配置的 AI Agent 安全扫描器。
> 一行命令快速检查你的 skill、MCP server 或插件是否存在安全隐患。

```bash
npx @elliotllliu/agent-shield scan ./my-skill/
```

⚠️ **项目状态**：早期阶段（Pre-alpha）。核心扫描功能可用，但尚未经过独立安全审计。适合快速自检，不应作为唯一的安全评估手段。

---

## 🏆 核心特点

### 1. 🔒 运行时 MCP 拦截

不只是静态扫代码 — 还能在运行中实时监控 MCP tool 调用行为。

```bash
# 插在 MCP client 和 server 之间
agent-shield proxy node my-mcp-server.js

# 强制模式：自动阻断高危操作
agent-shield proxy --enforce python mcp_server.py
```

检测：工具描述注入、返回结果注入、凭证泄露、敏感路径访问、行为异常（beacon/rug-pull）。

### 2. ⛓️ 跨文件攻击链检测

追踪完整攻击路径，不是逐文件扫描。

```
🔴 Kill Chain detected:
   config.py:4  → system info collection    [Reconnaissance]
   reader.py:8  → reads ~/.ssh/id_rsa       [Collection]
   sender.py:12 → POST to external server   [Exfiltration]
```

### 3. 🆓 免费离线

- 不用注册 · 不上传代码 · 不需要 API key · `npx` 一行跑完

---

## ⚡ 快速开始

```bash
# 扫描 skill / MCP server / 插件
npx @elliotllliu/agent-shield scan ./path/to/skill/

# 扫描 Dify 插件（.difypkg 自动解包）
npx @elliotllliu/agent-shield scan ./plugin.difypkg

# 运行时拦截
npx @elliotllliu/agent-shield proxy node my-mcp-server.js

# 检查已安装 agent
npx @elliotllliu/agent-shield install-check
```

---

## 📊 与其他工具的定位对比

Agent Shield 是**轻量级开源工具**，定位是快速自检和开发阶段的安全辅助，不是企业级安全平台的替代品。

| | Agent Shield | Snyk Agent Scan | Tencent AI-Infra-Guard |
|---|:---:|:---:|:---:|
| **定位** | 轻量级开源工具 | 商业安全服务 | 企业级红队平台 |
| 运行时拦截 | ✅ MCP Proxy | ❌ | ❌ |
| 跨文件攻击链 | ✅ | ❌ | 部分 |
| 静态规则 | 31 | 6 | 多（含 infra） |
| AST 污点追踪 | ✅ Python | ❌ | 未知 |
| 多语言注入检测 | ✅ 8 种语言 | ❌ 仅英文 | 未知 |
| 离线/免费 | ✅ | ❌ 需账号 | ✅ 开源 |
| 零配置 | ✅ `npx` 一行 | ❌ 需 Python+uv | ❌ 需 Docker |
| 专业安全团队 | ❌ 个人项目 | ✅ Snyk 安全团队 | ✅ 腾讯朱雀/Keen Lab |
| 漏洞库持续更新 | ❌ | ✅ | ✅ |
| 企业级支持 | ❌ | ✅ | ✅ Pro 版 |
| 生产验证 | ❌ 早期阶段 | ✅ | ✅ Black Hat 展示 |
| VS Code / Action | ✅ | ❌ | ❌ |
| 选择自己的 LLM | ✅ | ❌ | ❌ |

**适用场景：**
- ✅ 开发阶段快速自检 skill/MCP server 安全
- ✅ CI/CD 管道中的轻量级安全门控
- ✅ 运行时监控 MCP tool 调用（独有）
- ❌ 不适合作为企业合规/审计的唯一依据

---

## 🔍 31 条安全规则

### 🔴 高风险

| 规则 | 检测内容 |
|------|---------|
| `data-exfil` | 读取敏感数据 + HTTP 外发 |
| `backdoor` | `eval()`、`exec()`、`new Function()` 动态执行 |
| `reverse-shell` | 反向 shell 连接 |
| `crypto-mining` | 挖矿程序 |
| `credential-hardcode` | 硬编码密钥/token |
| `obfuscation` | 代码混淆执行 |

### 🟡 中风险

| 规则 | 检测内容 |
|------|---------|
| `prompt-injection` | 55+ 模式：指令覆盖、身份操纵、编码绕过 |
| `tool-shadowing` | 工具名冲突/覆盖攻击 |
| `env-leak` | 环境变量 + HTTP 外发 |
| `network-ssrf` | 用户控制 URL、AWS metadata |
| `phone-home` | C2 beacon 模式 |
| `toxic-flow` | 跨工具数据泄露 |
| `skill-risks` | 金融操作、外部依赖 |
| `python-security` | 35 模式（eval/pickle/SQL/SSTI 等） |
| `go-rust-security` | 22 模式（命令注入/unsafe 等） |

### 🟢 低风险

`privilege` · `supply-chain` · `sensitive-read` · `excessive-perms` · `mcp-manifest` · `typosquatting` · `hidden-files`

### 高级检测

`cross-file` · `attack-chain` · `multilang-injection` · `python-ast` · `description-integrity` · `mcp-runtime`

---

## 📦 使用方式

### CLI
```bash
agent-shield scan ./skill/                          # 基础扫描
agent-shield scan ./skill/ --ai --provider ollama    # AI 深度分析
agent-shield scan ./skill/ --sarif -o results.sarif  # SARIF 输出
agent-shield scan ./skill/ --html                    # HTML 报告
agent-shield scan ./skill/ --fail-under 70           # CI 门控
agent-shield proxy node server.js                    # 运行时拦截
agent-shield mcp-audit node server.js                # MCP 审计
agent-shield discover                                # 发现本机 agent
```

### GitHub Action
```yaml
- run: npx -y @elliotllliu/agent-shield scan . --fail-under 70
```

### [GitHub App](github-app/README.md) · [VS Code 扩展](vscode-extension/README.md)

---

## 📈 测试数据

### Benchmark
120 个自建样本（56 恶意 + 64 良性），Recall 100%, Precision 100%, FPR 0%。

⚠️ **局限性**：样本为项目自建，未经第三方验证。实际检测效果可能因代码模式差异而有所不同。欢迎提交误报/漏报反馈。

### Dify 插件扫描
扫描了 [langgenius/dify-plugins](https://github.com/langgenius/dify-plugins) 的 493 个插件，发现 6 个包含 `eval()`/`exec()` 的高危插件，高危级别零误报。

---

## ⚙️ 配置

`.agent-shield.yml`（或 `agent-shield init`）：
```yaml
rules:
  disable: [supply-chain, phone-home]
failUnder: 70
ignore: ["tests/**"]
```

| 严重度 | 扣分 | 分数 | 风险 |
|--------|------|------|------|
| 🔴 高 | -25 | 90-100 | ✅ 低风险 |
| 🟡 中 | -8 | 70-89 | 🟡 中等 |
| 🟢 低 | -2 | 0-69 | 🔴 高风险 |

---

## 🤝 Contributing

欢迎贡献！特别欢迎：
- 新的检测规则
- 误报/漏报反馈
- 第三方 benchmark 测试结果

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Links

📦 [npm](https://www.npmjs.com/package/@elliotllliu/agent-shield) · 📖 [规则文档](docs/rules.md) · 🤖 [GitHub App](github-app/README.md) · 💻 [VS Code](vscode-extension/README.md) · 🇺🇸 [English](README.en.md)

## License

MIT
