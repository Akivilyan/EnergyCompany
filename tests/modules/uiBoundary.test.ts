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

function collectViolations(dir: string, patterns: RegExp[]): string[] {
  const violations: string[] = [];
  for (const file of walkTsFiles(dir)) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        violations.push(path.relative(repoRoot, file));
      }
    }
  }
  return violations;
}

describe("modules boundary", () => {
  it("does not import sim/core internals directly", () => {
    const modulesDir = path.join(repoRoot, "src", "modules");
    const violations = collectViolations(modulesDir, [/from ["']\.\.\/sim\/core\//]);
    expect(violations).toEqual([]);
  });
});

describe("ui boundary", () => {
  it("does not import sim or app layers directly", () => {
    const uiDir = path.join(repoRoot, "src", "ui");
    const violations = collectViolations(uiDir, [
      /from ["']\.\.\/sim\//,
      /from ["']\.\.\/app\//
    ]);
    expect(violations).toEqual([]);
  });
});
