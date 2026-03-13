import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";
import type { ProvenanceManifest, Grade, ScannedFile } from "./types.js";

const MANIFEST_FILE = ".agent-shield-manifest.json";

/** Compute SHA-256 hash of a string */
function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/** Generate per-file hashes from scanned files */
export function hashFiles(files: ScannedFile[]): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const f of files) {
    hashes[f.relativePath] = sha256(f.content);
  }
  return hashes;
}

/** Compute overall content hash from file hashes */
export function contentHash(fileHashes: Record<string, string>): string {
  const sorted = Object.keys(fileHashes).sort();
  const combined = sorted.map((k) => `${k}:${fileHashes[k]}`).join("\n");
  return sha256(combined);
}

/** Generate a provenance manifest */
export function generateManifest(
  name: string,
  version: string,
  files: ScannedFile[],
  grade?: Grade,
  score?: number,
): ProvenanceManifest {
  const fileHashes = hashFiles(files);
  return {
    name,
    version,
    createdAt: new Date().toISOString(),
    contentHash: contentHash(fileHashes),
    files: fileHashes,
    grade,
    score,
  };
}

/** Save manifest to directory */
export function saveManifest(dir: string, manifest: ProvenanceManifest): string {
  const manifestDir = join(dir, ".agent-shield");
  if (!existsSync(manifestDir)) mkdirSync(manifestDir, { recursive: true });
  const path = join(manifestDir, MANIFEST_FILE);
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  return path;
}

/** Load existing manifest from directory */
export function loadManifest(dir: string): ProvenanceManifest | null {
  const path = join(dir, ".agent-shield", MANIFEST_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as ProvenanceManifest;
  } catch {
    return null;
  }
}

/** Verify current files against saved manifest */
export function verifyManifest(
  files: ScannedFile[],
  manifest: ProvenanceManifest,
): { valid: boolean; changed: string[]; added: string[]; removed: string[] } {
  const currentHashes = hashFiles(files);
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  // Check for changed and added files
  for (const [path, hash] of Object.entries(currentHashes)) {
    if (!(path in manifest.files)) {
      added.push(path);
    } else if (manifest.files[path] !== hash) {
      changed.push(path);
    }
  }

  // Check for removed files
  for (const path of Object.keys(manifest.files)) {
    if (!(path in currentHashes)) {
      removed.push(path);
    }
  }

  return {
    valid: changed.length === 0 && added.length === 0 && removed.length === 0,
    changed,
    added,
    removed,
  };
}
