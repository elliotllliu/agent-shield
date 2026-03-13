import { readFileSync, statSync, readdirSync, mkdtempSync, rmSync, existsSync } from "fs";
import { join, relative, extname, basename, dirname } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";
import type { ScannedFile, FileContext } from "../types.js";

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

/** Extract .difypkg (zip) to a temp directory and return the path */
export function extractDifypkg(filePath: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), "agentshield-difypkg-"));
  try {
    execSync(`unzip -q -o "${filePath}" -d "${tmpDir}"`, { stdio: "pipe" });
  } catch {
    // If unzip not available, try python
    try {
      execSync(`python3 -c "import zipfile; zipfile.ZipFile('${filePath}').extractall('${tmpDir}')"`, { stdio: "pipe" });
    } catch {
      rmSync(tmpDir, { recursive: true, force: true });
      throw new Error(`Cannot extract ${filePath}: neither unzip nor python3 available`);
    }
  }
  return tmpDir;
}

/** Clean up a temp directory */
export function cleanupTemp(tmpDir: string): void {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

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
        const relPath = relative(root, fullPath);
        files.push({
          path: fullPath,
          relativePath: relPath,
          content,
          lines: content.split("\n"),
          ext,
          context: detectFileContext(relPath, name),
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

/** Detect file context for false positive reduction */
function detectFileContext(relativePath: string, fileName: string): FileContext {
  const lowerPath = relativePath.toLowerCase();
  const lowerName = fileName.toLowerCase();
  const dirName = dirname(lowerPath).toLowerCase();

  // Test files
  if (
    lowerName.includes(".test.") || lowerName.includes(".spec.") ||
    lowerName.includes("_test.") || lowerName.includes("_spec.") ||
    lowerPath.includes("__tests__") || lowerPath.includes("/tests/") ||
    lowerPath.startsWith("tests/") || lowerPath.startsWith("test/") ||
    lowerName === "jest.config.js" || lowerName === "vitest.config.ts"
  ) {
    return "test";
  }

  // Deploy / CI scripts
  if (
    lowerPath.includes("deploy") || lowerPath.includes("ci/") ||
    lowerPath.includes(".github/") || lowerPath.includes("scripts/") ||
    lowerPath.includes("infra/") || lowerPath.includes("ops/") ||
    lowerName.includes("deploy") || lowerName.includes("release") ||
    lowerName === "dockerfile" || lowerName === "makefile"
  ) {
    return "deploy";
  }

  // Config files
  if (
    [".json", ".yaml", ".yml", ".toml"].includes(extname(lowerName)) &&
    !lowerName.includes("skill")
  ) {
    return "config";
  }

  // Documentation
  if (extname(lowerName) === ".md") {
    return "docs";
  }

  // Shell scripts (standalone)
  if ([".sh", ".bash", ".zsh"].includes(extname(lowerName))) {
    return "script";
  }

  return "source";
}
