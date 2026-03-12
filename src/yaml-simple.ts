/**
 * Minimal YAML parser for simple config files.
 * Supports: scalars, lists, nested objects (2 levels deep).
 * For complex YAML, use the 'yaml' package.
 */
export function parse(input: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = input.split("\n");
  let currentKey = "";
  let currentSubKey = "";
  let currentList: string[] | null = null;

  for (const rawLine of lines) {
    // Skip comments and empty lines
    const line = rawLine.replace(/#.*$/, "");
    if (!line.trim()) continue;

    const indent = rawLine.search(/\S/);

    // List item
    if (line.trim().startsWith("- ")) {
      const value = line.trim().slice(2).trim().replace(/^["']|["']$/g, "");
      if (currentList) {
        currentList.push(value);
      }
      continue;
    }

    // Key: value
    const match = line.match(/^(\s*)(\w+)\s*:\s*(.*)/);
    if (!match) continue;

    const [, , key, rawValue] = match;
    const value = rawValue!.trim().replace(/^["']|["']$/g, "");

    if (indent === 0) {
      // Top-level key
      if (currentList && currentKey) {
        // Save previous list
        if (currentSubKey) {
          (result[currentKey] as Record<string, unknown>)[currentSubKey] = currentList;
        } else {
          result[currentKey] = currentList;
        }
        currentList = null;
        currentSubKey = "";
      }

      currentKey = key!;
      if (value) {
        // Scalar value
        result[currentKey] = parseScalar(value);
      } else {
        // Object or list follows
        if (!result[currentKey] || typeof result[currentKey] !== "object") {
          result[currentKey] = {};
        }
      }
    } else if (indent === 2 && currentKey) {
      // Sub-key
      if (currentList && currentSubKey) {
        (result[currentKey] as Record<string, unknown>)[currentSubKey] = currentList;
        currentList = null;
      }

      currentSubKey = key!;
      if (value) {
        if (typeof result[currentKey] !== "object") result[currentKey] = {};
        (result[currentKey] as Record<string, unknown>)[currentSubKey] = parseScalar(value);
      } else {
        // List follows
        currentList = [];
      }
    }
  }

  // Save trailing list
  if (currentList) {
    if (currentSubKey && currentKey) {
      if (typeof result[currentKey] !== "object") result[currentKey] = {};
      (result[currentKey] as Record<string, unknown>)[currentSubKey] = currentList;
    } else if (currentKey) {
      result[currentKey] = currentList;
    }
  }

  return result;
}

function parseScalar(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  const num = Number(value);
  if (!isNaN(num) && value !== "") return num;
  return value;
}
