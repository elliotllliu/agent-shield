/** Severity levels for findings */
export type Severity = "critical" | "warning" | "info";

/** File context hints for reducing false positives */
export type FileContext = "test" | "deploy" | "config" | "docs" | "script" | "source";

/** A single security finding */
export interface Finding {
  rule: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
  evidence?: string;
  /** If true, the finding is likely a false positive due to file context */
  possibleFalsePositive?: boolean;
  /** Why it might be a false positive */
  falsePositiveReason?: string;
}

/** Scan result for a directory */
export interface ScanResult {
  target: string;
  filesScanned: number;
  linesScanned: number;
  findings: Finding[];
  score: number;
  duration: number;
}

/** A scanner rule */
export interface Rule {
  id: string;
  name: string;
  description: string;
  run(files: ScannedFile[]): Finding[];
}

/** A file loaded for scanning */
export interface ScannedFile {
  path: string;
  relativePath: string;
  content: string;
  lines: string[];
  ext: string;
  /** Detected file context for false positive reduction */
  context: FileContext;
}

/** Parsed SKILL.md metadata */
export interface SkillMetadata {
  name?: string;
  description?: string;
  permissions?: string[];
  [key: string]: unknown;
}

/** Scan configuration from .agentshield.yml */
export interface ScanConfig {
  rules?: {
    enable?: string[];
    disable?: string[];
  };
  severity?: Record<string, "critical" | "warning" | "info">;
  failUnder?: number;
  ignore?: string[];
}
