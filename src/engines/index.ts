/**
 * Engine registry — public API for the engines module.
 */

export type {
  ScanEngine,
  EngineFinding,
  EngineResult,
  EngineScanOptions,
  MergedFinding,
  AggregatedResult,
} from "./types.js";

export { NativeEngine } from "./native-adapter.js";
export { SnykEngine } from "./snyk-adapter.js";
export { CiscoEngine } from "./cisco-adapter.js";
export { TencentEngine } from "./tencent-adapter.js";

export {
  getAllEngines,
  getEnginesByName,
  runEngines,
  mergeFindings,
  computeUnifiedScore,
} from "./orchestrator.js";

export {
  renderTerminalReport,
  renderJsonReport,
  renderMarkdownReport,
} from "./reporter.js";
