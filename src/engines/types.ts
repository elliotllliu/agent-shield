/**
 * Unified scan engine interface for AgentShield aggregator.
 *
 * Each external scanner (Snyk, Cisco, Tencent) and our native rules
 * implement this interface. The orchestrator runs all available engines
 * and merges results into a unified report.
 */

import type { Severity } from "../types.js";

// ─── Engine Types ───

/** A finding from any scan engine, normalized to a common format */
export interface EngineFinding {
  /** Which engine produced this finding */
  engine: string;
  /** Rule or check identifier from the engine */
  ruleId: string;
  /** Human-readable finding title */
  title: string;
  /** Detailed description */
  description: string;
  /** Severity level (normalized to our scale) */
  severity: Severity;
  /** Affected file path (relative to scan root) */
  file: string;
  /** Line number, if available */
  line?: number;
  /** Evidence or code snippet */
  evidence?: string;
  /** Confidence: how sure the engine is (0-1) */
  confidence: number;
  /** Fix recommendation */
  recommendation?: string;
  /** References (OWASP, CWE, etc.) */
  references?: {
    owasp?: string;
    cwe?: string;
    atlas?: string;
  };
}

/** Result from a single engine's scan */
export interface EngineResult {
  /** Engine name */
  engine: string;
  /** Whether the scan succeeded */
  success: boolean;
  /** Findings from this engine */
  findings: EngineFinding[];
  /** Scan duration in milliseconds */
  duration: number;
  /** Error message if scan failed */
  error?: string;
  /** Engine version, if available */
  version?: string;
}

/** Options passed to engine scan */
export interface EngineScanOptions {
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Whether to include low-severity findings */
  includeLow?: boolean;
  /** Additional engine-specific options */
  extra?: Record<string, unknown>;
}

/** A merged finding that combines results from multiple engines */
export interface MergedFinding {
  /** Unique fingerprint for dedup */
  fingerprint: string;
  /** Normalized title */
  title: string;
  /** Normalized description */
  description: string;
  /** Highest severity reported by any engine */
  severity: Severity;
  /** Affected file */
  file: string;
  /** Line number */
  line?: number;
  /** Evidence from first engine that found it */
  evidence?: string;
  /** Best recommendation from any engine */
  recommendation?: string;
  /** References aggregated from all engines */
  references?: {
    owasp?: string;
    cwe?: string;
    atlas?: string;
  };
  /** Which engines flagged this */
  flaggedBy: string[];
  /** Total number of available engines that ran */
  totalEngines: number;
  /** Consensus confidence: higher when more engines agree */
  consensus: number;
  /** Individual engine findings for this issue */
  engineDetails: EngineFinding[];
}

/** Full aggregated scan result */
export interface AggregatedResult {
  /** Scan target directory */
  target: string;
  /** Total files scanned */
  filesScanned: number;
  /** Individual engine results */
  engineResults: EngineResult[];
  /** Merged and deduplicated findings */
  mergedFindings: MergedFinding[];
  /** Which engines were available */
  enginesAvailable: string[];
  /** Which engines actually ran */
  enginesRan: string[];
  /** Total scan duration */
  duration: number;
  /** Unified score (0-100) */
  score: number;
}

// ─── Engine Interface ───

/**
 * Interface that all scan engines must implement.
 */
export interface ScanEngine {
  /** Unique engine identifier */
  readonly name: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Check if this engine is installed and available */
  available(): Promise<boolean>;

  /** Run a scan on the target directory */
  scan(dir: string, options?: EngineScanOptions): Promise<EngineResult>;

  /** Return setup/install instructions for this engine */
  setup(): string;
}
