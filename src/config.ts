import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "./yaml-simple.js";
import type { AgentShieldConfig } from "./types.js";

/** Re-export for backward compat */
export type { AgentShieldConfig as ScanConfig } from "./types.js";

const CONFIG_NAMES = [".agent-shield.yml", ".agent-shield.yaml", "agent-shield.config.yml"];

/** Load config from target directory or parents */
export function loadConfig(dir: string): AgentShieldConfig {
  for (const name of CONFIG_NAMES) {
    const configPath = join(dir, name);
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        return parseYaml(content) as AgentShieldConfig;
      } catch {
        // invalid config, use defaults
      }
    }
  }
  return {};
}

/** Load .agent-shieldignore patterns */
export function loadIgnorePatterns(dir: string): string[] {
  const ignorePath = join(dir, ".agent-shieldignore");
  if (!existsSync(ignorePath)) return [];

  try {
    return readFileSync(ignorePath, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

/** Check if a file path matches any ignore pattern */
export function isIgnored(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple glob matching: support * and **
    if (pattern.endsWith("/")) {
      // Directory pattern
      if (filePath.startsWith(pattern) || filePath.includes("/" + pattern)) return true;
    } else if (pattern.includes("*")) {
      const regex = new RegExp(
        "^" + pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$",
      );
      if (regex.test(filePath)) return true;
    } else {
      // Exact match or suffix match
      if (filePath === pattern || filePath.endsWith("/" + pattern) || filePath.endsWith(pattern)) return true;
    }
  }
  return false;
}

/** Default config content for `agent-shield init` */
export const DEFAULT_CONFIG = `# AgentShield Configuration
# https://github.com/elliotllliu/agent-shield

rules:
  # disable:
  #   - supply-chain    # skip npm audit
  #   - phone-home      # allow periodic HTTP

# severity:
#   sensitive-read: info   # downgrade to info

# failUnder: 70   # CI threshold

# ignore:
#   - "tests/**"
#   - "*.test.ts"

# Per-agent security policies
# agents:
#   email-agent:
#     minGrade: A
#     minScore: 90
#     blockRules:
#       - reverse-shell
#       - backdoor
#       - data-exfil
#     maxSeverity: low
#   dev-tools:
#     minGrade: C
#     minScore: 50

# Default policy for agents not listed above
# defaultPolicy:
#   minGrade: B
#   minScore: 75

# Provenance tracking
# provenance:
#   autoVerify: true
`;

/** Default ignore content */
export const DEFAULT_IGNORE = `# AgentShield Ignore
# Patterns here will be excluded from scanning

node_modules/
dist/
build/
.git/
*.test.ts
*.test.js
*.spec.ts
*.spec.js
__tests__/
coverage/
`;
