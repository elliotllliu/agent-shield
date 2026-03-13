import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import chalk from "chalk";

interface AgentConfig {
  name: string;
  configPaths: string[];
  skillsDirs: string[];
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "Claude Code",
    configPaths: ["~/.claude.json"],
    skillsDirs: ["~/.claude/skills"],
  },
  {
    name: "Claude Desktop",
    configPaths: [
      "~/Library/Application Support/Claude/claude_desktop_config.json",
      "~/.config/Claude/claude_desktop_config.json",
    ],
    skillsDirs: [],
  },
  {
    name: "Cursor",
    configPaths: ["~/.cursor/mcp.json"],
    skillsDirs: ["~/.cursor/skills"],
  },
  {
    name: "VS Code (Copilot)",
    configPaths: [
      "~/.vscode/mcp.json",
      "~/Library/Application Support/Code/User/settings.json",
      "~/.config/Code/User/settings.json",
    ],
    skillsDirs: ["~/.copilot/skills"],
  },
  {
    name: "Windsurf",
    configPaths: ["~/.codeium/windsurf/mcp_config.json"],
    skillsDirs: ["~/.codeium/windsurf/skills"],
  },
  {
    name: "Gemini CLI",
    configPaths: ["~/.gemini/settings.json"],
    skillsDirs: ["~/.gemini/skills"],
  },
  {
    name: "Codex",
    configPaths: ["~/.codex/config.json"],
    skillsDirs: [],
  },
  {
    name: "Kiro",
    configPaths: ["~/.kiro/settings/mcp.json"],
    skillsDirs: [],
  },
  {
    name: "OpenCode",
    configPaths: ["~/.config/opencode/config.json"],
    skillsDirs: [],
  },
  {
    name: "OpenClaw",
    configPaths: ["~/.openclaw/config.yaml", "~/.openclaw/config.yml"],
    skillsDirs: ["~/.openclaw/skills"],
  },
];

function expandHome(p: string): string {
  if (p.startsWith("~/")) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

export interface DiscoveredAgent {
  name: string;
  configPath: string | null;
  skillsDir: string | null;
  mcpServerCount?: number;
  skillCount?: number;
}

export function discoverAgents(): DiscoveredAgent[] {
  const found: DiscoveredAgent[] = [];

  for (const agent of AGENT_CONFIGS) {
    let foundConfig: string | null = null;
    let foundSkillsDir: string | null = null;

    for (const configPath of agent.configPaths) {
      const expanded = expandHome(configPath);
      if (existsSync(expanded)) {
        foundConfig = expanded;
        break;
      }
    }

    for (const skillsDir of agent.skillsDirs) {
      const expanded = expandHome(skillsDir);
      if (existsSync(expanded)) {
        foundSkillsDir = expanded;
        break;
      }
    }

    if (foundConfig || foundSkillsDir) {
      let mcpServerCount = 0;
      if (foundConfig) {
        try {
          const content = readFileSync(foundConfig, "utf-8");
          const parsed = JSON.parse(content);
          // Try common MCP keys
          const servers = parsed.mcpServers || parsed["mcp.servers"] || parsed.context_servers || {};
          if (typeof servers === "object" && servers !== null) {
            mcpServerCount = Object.keys(servers).length;
          }
        } catch {
          // Can't parse — still report agent
        }
      }
      found.push({
        name: agent.name,
        configPath: foundConfig,
        skillsDir: foundSkillsDir,
        mcpServerCount,
      });
    }
  }

  return found;
}

export function printDiscovery(agents: DiscoveredAgent[]): void {
  console.log();
  console.log(chalk.bold("🛡️  AgentShield Discovery"));
  console.log(chalk.dim(`Scanning for installed AI agents on this machine...`));
  console.log();

  if (agents.length === 0) {
    console.log(chalk.yellow("No AI agent installations detected."));
    console.log(chalk.dim("Supported: Claude Code, Cursor, VS Code, Windsurf, Gemini CLI, Codex, Kiro, OpenClaw"));
    return;
  }

  console.log(chalk.green(`Found ${agents.length} agent installation${agents.length > 1 ? "s" : ""}:`));
  console.log();

  for (const agent of agents) {
    console.log(chalk.bold(`  ${agent.name}`));
    if (agent.configPath) {
      console.log(chalk.dim(`    Config: ${agent.configPath}`));
      if (agent.mcpServerCount && agent.mcpServerCount > 0) {
        console.log(`    MCP Servers: ${agent.mcpServerCount}`);
      }
    }
    if (agent.skillsDir) {
      console.log(chalk.dim(`    Skills: ${agent.skillsDir}`));
    }
    console.log();
  }

  console.log(chalk.dim("Run `agent-shield scan <path>` on any config or skills directory above."));
  console.log();
}
