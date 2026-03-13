# AgentShield 竞品调研与研究方向

> 调研时间: 2026-03-12
> 来源: GitHub, YouTube, 技术博客

## 一、竞品分析

### 🏆 snyk/agent-scan（最大竞品）
- **Stars**: 1,849 ⭐
- **语言**: Python（`uvx snyk-agent-scan@latest`）
- **特点**:
  - 被 Snyk 收购（原 Invariant Labs 的 mcp-scan）
  - 自动发现机器上所有 agent 配置（Claude, Cursor, Windsurf, Gemini CLI）
  - 15+ issue codes
  - **核心优势 1**: Prompt Injection 检测（用 LLM 检测工具描述中的注入攻击）
  - **核心优势 2**: Tool Poisoning / Tool Shadowing 检测（一个 MCP 工具覆盖另一个的行为）
  - **核心优势 3**: Toxic Flows 检测（跨工具的数据流分析）
  - **核心优势 4**: Background Mode + Snyk Evo 企业级监控
  - 刚发布 v0.4 增加了 agent skill 扫描 + 安全报告 PDF
  - **弱点**: 需要 Snyk API token（不是纯离线/免费工具），Python 不如 npm 在前端/agent 生态方便
  - **弱点**: 他们的 skills 报告是 PDF 不是公开博客

### 其他竞品（小型）
| 名称 | Stars | 特点 |
|------|-------|------|
| sidhpurwala-huzaifa/mcp-security-scanner | 20 | 扫运行中的 MCP server |
| DMontgomery40/mcp-security-scanner | 12 | MCP 插件架构 |
| aws-samples/sample-mcp-security-scanner | 10 | Checkov + Semgrep + Bandit 集成 |
| alexandriashai/mcp-guardian | 3 | prompt injection in tool descriptions |
| Helixar-AI/sentinel | 4 | MCP scanner |

### AgentShield vs snyk/agent-scan 对比

| 维度 | AgentShield | snyk/agent-scan |
|------|-------------|-----------------|
| 语言 | TypeScript/Node.js | Python |
| 安装 | `npx` 零安装 | 需 `uv` + Snyk token |
| 规则数 | 16 | 15+ |
| 离线/免费 | ✅ 完全离线 | ❌ 需要 Snyk API |
| Prompt Injection 检测 | ❌ **没有** | ✅ LLM-based |
| Tool Poisoning/Shadowing | ❌ **没有** | ✅ 有 |
| Toxic Flows（跨工具数据流） | ❌ **没有** | ✅ 有 |
| 自动发现 agent 配置 | ❌ **没有** | ✅ Claude/Cursor/Windsurf |
| Skill 扫描 | ✅ 强 | ✅ 有（v0.4 新增）|
| MCP Server 扫描 | ✅ 静态分析 | ✅ 运行时 + 静态 |
| 企业级监控 | ❌ | ✅ Background Mode |
| Web UI | ✅ 有 | ❌ |
| GitHub Action | ✅ 有 | ❌ |
| 配置系统 | ✅ .agent-shield.yml | ❌ |
| FP 检测 | ✅ 上下文感知 | 不明确 |

## 二、行业趋势（YouTube/博客）

### 关键话题
1. **MCP Security Best Practices** (10K+ views) — 强调 RBAC、审计日志
2. **Identity & RBAC for MCP** (19K views) — MCP 缺乏身份认证层
3. **AWS re:Invent 2025** — MCP Server & Agent Security（官方关注）
4. **Prompt Injection in Tool Descriptions** — 工具描述本身可以包含注入指令

### 行业共识
- AI Agent 安全是 2025-2026 最热的安全子领域
- MCP 生态急需安全标准化
- Snyk 通过收购 Invariant Labs 押注这个方向
- 当前缺乏：标准化的权限声明、运行时沙箱、审计追踪

## 三、AgentShield 差距与研究方向

### 🔴 必做（与 snyk/agent-scan 的关键差距）

#### 1. Prompt Injection 检测
**优先级: P0**
- snyk 用 LLM 检测工具描述中的注入（如"ignore previous instructions"）
- 我们可以先用 regex pattern matching，再考虑 LLM
- 目标: 检测 SKILL.md 和 MCP tool description 中的指令注入
- 示例模式:
  ```
  "ignore previous", "disregard", "new instructions",
  "you are now", "forget everything", "override",
  "system prompt", "act as", "pretend to be"
  ```

#### 2. Tool Poisoning / Shadowing 检测
**优先级: P0**
- 一个 MCP server 的工具名与另一个重名，覆盖其行为
- 检测同名工具、同描述但不同实现
- 需要支持扫描多个 MCP config 文件

#### 3. 自动发现 Agent 配置
**优先级: P1**
- 扫描 `~/.claude/`, `~/.cursor/`, `~/.vscode/mcp.json`
- 列出所有已安装的 MCP server 和 skills
- `agent-shield discover` 命令

#### 4. Toxic Flow 分析（跨工具数据流）
**优先级: P1**
- 工具 A 读取敏感数据 → 传给工具 B → 工具 B 发送到外部
- 需要建模工具间的数据流图
- 先做简化版：扫描 MCP config 中多个 server 的权限组合

### 🟡 差异化优势（snyk 没有的）

#### 5. Web 在线扫描
**状态: ✅ 已有基础版**
- 部署到公网，任何人贴 URL 即可扫描
- Badge API
- 这是 snyk 没有的（他们只有 CLI + 企业 SaaS）

#### 6. GitHub Action 原生支持
**状态: ✅ 已有**
- snyk 没有公开的 GitHub Action
- 我们可以做得更好：PR comment、check annotation

#### 7. 完全离线 / 免费
**状态: ✅ 已有**
- snyk 需要 API token + 账号
- 我们是纯本地扫描，隐私友好

#### 8. ClawHub 生态报告
**状态: ✅ 已有**
- 定期扫描 ClawHub 所有 skill 并公开报告
- snyk 有类似的 PDF 报告但不公开

### 🟢 长期方向

#### 9. 运行时监控（sandbox mode）
- 用 seccomp/landlock 限制 skill 的系统调用
- 实时监控文件读写、网络请求

#### 10. 权限声明标准
- 提出一个 SKILL.md 权限声明标准
- 与 MCP spec 的 capabilities 对齐
- 写 RFC/proposal 提交给 MCP 社区

#### 11. 社区规则市场
- 用户可以发布和安装自定义规则
- `agent-shield install-rule @someone/custom-rule`

## 四、执行计划

| 序号 | 任务 | 优先级 | 预估时间 |
|------|------|--------|---------|
| 1 | Prompt Injection 检测（SKILL.md + MCP description） | P0 | 2-3h |
| 2 | Tool Poisoning/Shadowing 检测 | P0 | 2-3h |
| 3 | `agent-shield discover` 自动发现 agent 配置 | P1 | 2h |
| 4 | Toxic Flow 简化版 | P1 | 3h |
| 5 | 部署 Web 版到公网 | P1 | 1h |
| 6 | GitHub Action 增强（PR comment） | P2 | 2h |
| 7 | 运行时沙箱 | P3 | 1-2 天 |
| 8 | 权限声明标准 RFC | P3 | 1 天 |
