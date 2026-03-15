import { execSync } from "child_process";
import { existsSync, mkdirSync, chmodSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir, platform, arch } from "os";

const AGENTSHIELD_HOME = join(homedir(), ".agentshield");
const BIN_DIR = join(AGENTSHIELD_HOME, "bin");

export function getEngineBinDir(): string {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  return BIN_DIR;
}

export function getEnginePath(): string {
  return `${BIN_DIR}:${homedir()}/.local/bin:${process.env.PATH}`;
}

/**
 * Auto-install Aguara — download binary from GitHub Releases
 */
export async function installAguara(): Promise<boolean> {
  try {
    const binDir = getEngineBinDir();
    const binPath = join(binDir, "aguara");

    if (existsSync(binPath)) return true;

    const os = platform() === "darwin" ? "darwin" : "linux";
    const cpu = arch() === "arm64" ? "arm64" : "amd64";

    // Try to get latest release URL
    const releaseUrl = `https://github.com/garagon/aguara/releases/latest/download/aguara-${os}-${cpu}`;

    console.log("  📦 Aguara — 正在下载...");
    execSync(`curl -fsSL "${releaseUrl}" -o "${binPath}" 2>/dev/null`, {
      timeout: 60000, stdio: ["pipe", "pipe", "pipe"],
    });
    chmodSync(binPath, 0o755);
    console.log("  ✅ Aguara — 安装完成");
    return true;
  } catch {
    // Fallback: try install script
    try {
      console.log("  📦 Aguara — 尝试备用安装方式...");
      execSync("curl -fsSL https://raw.githubusercontent.com/garagon/aguara/main/install.sh | bash", {
        timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
        shell: "/bin/bash",
      });
      console.log("  ✅ Aguara — 安装完成");
      return true;
    } catch {
      console.log("  ❌ Aguara — 安装失败，跳过");
      return false;
    }
  }
}

/**
 * Auto-install a Python package via pipx or pip
 */
function installPythonPackage(name: string, displayName: string): boolean {
  console.log(`  📦 ${displayName} — 正在安装...`);

  // Try pipx first (isolated)
  try {
    execSync(`pipx install ${name} 2>/dev/null`, {
      timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
      shell: "/bin/bash",
      env: { ...process.env, PATH: getEnginePath() },
    });
    console.log(`  ✅ ${displayName} — 安装完成`);
    return true;
  } catch { /* pipx failed, try pip */ }

  // Try pip with --user
  try {
    execSync(`pip3 install ${name} --user --break-system-packages --quiet 2>/dev/null`, {
      timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
      shell: "/bin/bash",
    });
    console.log(`  ✅ ${displayName} — 安装完成`);
    return true;
  } catch { /* pip failed too */ }

  // Try pip without --break-system-packages
  try {
    execSync(`pip3 install ${name} --user --quiet 2>/dev/null`, {
      timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
      shell: "/bin/bash",
    });
    console.log(`  ✅ ${displayName} — 安装完成`);
    return true;
  } catch {
    console.log(`  ❌ ${displayName} — 安装失败，跳过`);
    return false;
  }
}

/**
 * Auto-install Semgrep
 */
export async function installSemgrep(): Promise<boolean> {
  return installPythonPackage("semgrep", "Semgrep");
}

/**
 * Auto-install Invariant mcp-scan
 */
export async function installInvariant(): Promise<boolean> {
  return installPythonPackage("mcp-scan", "Invariant mcp-scan");
}

/**
 * Check and auto-install all missing engines.
 * Returns list of engine IDs that are now available.
 */
export async function ensureEngines(
  engines: Array<{ id: string; isAvailable: () => Promise<boolean> }>
): Promise<Set<string>> {
  console.log("\n🔧 检查引擎...");

  const available = new Set<string>();
  const installers: Record<string, () => Promise<boolean>> = {
    aguara: installAguara,
    semgrep: installSemgrep,
    invariant: installInvariant,
  };

  for (const engine of engines) {
    const isReady = await engine.isAvailable();
    if (isReady) {
      console.log(`  ✅ ${engine.id} — 已就绪`);
      available.add(engine.id);
    } else if (engine.id === "agentshield") {
      // Built-in, always available
      console.log(`  ✅ ${engine.id} — 已就绪`);
      available.add(engine.id);
    } else if (installers[engine.id]) {
      const success = await installers[engine.id]!();
      if (success) available.add(engine.id);
    } else {
      console.log(`  ⬚ ${engine.id} — 未安装，无自动安装方式`);
    }
  }

  console.log();
  return available;
}
