import { readFileSync, statSync, readdirSync } from "fs";
import { join, relative, extname } from "path";
import type { ScannedFile } from "../types.js";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv",
]);

const CODE_EXTS = new Set([
  ".ts", ".js", ".mjs", ".cjs", ".tsx", ".jsx",
  ".py", ".sh", ".bash", ".zsh",
  ".json", ".yaml", ".yml", ".toml",
  ".md",
]);

const MAX_FILE_SIZE = 512 * 1024; // 512 KB

/** Recursively collect scannable files from a directory */
export function collectFiles(dir: string, base?: string): ScannedFile[] {
  const root = base ?? dir;
  const files: ScannedFile[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const name of entries) {
    if (name.startsWith(".") && name !== ".env") continue;
    if (SKIP_DIRS.has(name)) continue;

    const fullPath = join(dir, name);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, root));
    } else if (stat.isFile()) {
      const ext = extname(name).toLowerCase();
      if (!CODE_EXTS.has(ext) && name !== "SKILL.md") continue;
      if (stat.size > MAX_FILE_SIZE) continue;

      try {
        const content = readFileSync(fullPath, "utf-8");
        files.push({
          path: fullPath,
          relativePath: relative(root, fullPath),
          content,
          lines: content.split("\n"),
          ext,
        });
      } catch {
        // skip unreadable files
      }
    }
  }

  return files;
}

/** Count total lines across files */
export function totalLines(files: ScannedFile[]): number {
  return files.reduce((sum, f) => sum + f.lines.length, 0);
}
