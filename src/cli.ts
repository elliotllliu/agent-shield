#!/usr/bin/env node

import { Command } from "commander";
import { resolve } from "path";
import { existsSync, statSync } from "fs";
import { scan } from "./scanner/index.js";
import { printReport } from "./reporter/terminal.js";
import { printJsonReport } from "./reporter/json.js";

const program = new Command();

program
  .name("agentshield")
  .description("Security scanner for AI agent skills, MCP servers, and plugins")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a skill/plugin directory for security issues")
  .argument("<directory>", "Target directory to scan")
  .option("--json", "Output results as JSON")
  .option("--fail-under <score>", "Exit with code 1 if score is below threshold", parseInt)
  .action((directory: string, options: { json?: boolean; failUnder?: number }) => {
    const target = resolve(directory);

    if (!existsSync(target) || !statSync(target).isDirectory()) {
      console.error(`Error: "${directory}" is not a valid directory`);
      process.exit(1);
    }

    const result = scan(target);

    if (options.json) {
      printJsonReport(result);
    } else {
      printReport(result);
    }

    if (options.failUnder !== undefined && result.score < options.failUnder) {
      process.exit(1);
    }
  });

// Default: if first arg looks like a directory, treat as scan
const args = process.argv.slice(2);
if (args.length > 0 && !args[0]!.startsWith("-") && args[0] !== "scan" && args[0] !== "help") {
  // Rewrite: `agentshield ./dir` → `agentshield scan ./dir`
  process.argv.splice(2, 0, "scan");
}

program.parse();
