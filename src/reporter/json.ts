import type { ScanResult } from "../types.js";

/** Output scan result as JSON */
export function printJsonReport(result: ScanResult): void {
  console.log(JSON.stringify(result, null, 2));
}
