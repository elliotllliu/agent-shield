import type { Rule } from "../types.js";
import { sensitiveReadRule } from "./sensitive-read.js";
import { backdoorRule } from "./backdoor.js";
import { dataExfilRule } from "./data-exfil.js";
import { privilegeRule } from "./privilege.js";
import { supplyChainRule } from "./supply-chain.js";

/** All registered rules */
export const rules: Rule[] = [
  dataExfilRule,
  backdoorRule,
  privilegeRule,
  supplyChainRule,
  sensitiveReadRule,
];

/** Get a rule by ID */
export function getRule(id: string): Rule | undefined {
  return rules.find((r) => r.id === id);
}
