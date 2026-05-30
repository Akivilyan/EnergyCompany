import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function walkTsFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    if (fs.statSync(fullPath).isDirectory()) {
      walkTsFiles(fullPath, files);
    } else if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("modules boundary", () => {
  it("does not import sim/core internals directly", () => {
    const modulesDir = path.join(repoRoot, "src", "modules");
    const files = walkTsFiles(modulesDir);
    const violations: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      if (/from ["']\.\.\/sim\/core\//.test(text)) {
        violations.push(path.relative(repoRoot, file));
      }
    }
    expect(violations).toEqual([]);
  });
});
