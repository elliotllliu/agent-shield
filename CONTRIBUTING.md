# Contributing to AgentShield

Thanks for your interest in making AI agent security better! 🛡️

## Development Setup

```bash
git clone https://github.com/elliotllliu/agent-shield.git
cd agent-shield
npm install
npm run build
npm test
```

## Adding a New Rule

1. Create `src/rules/your-rule.ts` implementing the `Rule` interface:

```typescript
import type { Rule, Finding, ScannedFile } from "../types.js";

export const yourRule: Rule = {
  id: "your-rule",
  name: "Human Readable Name",
  description: "What this rule detects",

  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];
    // Your detection logic here
    return findings;
  },
};
```

2. Register it in `src/rules/index.ts`:

```typescript
import { yourRule } from "./your-rule.js";

export const rules: Rule[] = [
  // ... existing rules
  yourRule,
];
```

3. Add tests in `tests/rules/your-rule.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";
import { yourRule } from "../../src/rules/your-rule.js";
import { makeFile } from "../helpers.js";

describe("your-rule", () => {
  it("should detect the vulnerability", () => {
    const files = [makeFile("index.ts", `vulnerable code here`)];
    const findings = yourRule.run(files);
    assert.ok(findings.length > 0);
    assert.strictEqual(findings[0].severity, "critical");
  });

  it("should not flag safe code", () => {
    const files = [makeFile("index.ts", `safe code here`)];
    const findings = yourRule.run(files);
    assert.strictEqual(findings.length, 0);
  });
});
```

4. Add test fixtures if needed in `tests/fixtures/`

## Guidelines

- Each rule should have at least 2 tests: one detecting the issue, one verifying no false positive
- Use `warning` severity for patterns that might be legitimate; `critical` for almost-certainly malicious
- Keep false positive rates low — it's better to miss an edge case than to flood users with noise
- Add the rule to the README table

## Code Style

- TypeScript strict mode
- No `any` types
- Prefer `const` over `let`
- Functions should be small and focused

## Pull Requests

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `npm test` to ensure all tests pass
5. Run `npm run build` to ensure TypeScript compiles
6. Commit with a descriptive message
7. Open a PR

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
