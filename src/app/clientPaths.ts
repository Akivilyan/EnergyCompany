import path from "node:path";

export function resolveClientCocosRoot(repoRoot: string): string {
  return path.join(repoRoot, "client", "cocos");
}

export function resolveClientConfigDir(repoRoot: string): string {
  return path.join(resolveClientCocosRoot(repoRoot), "assets", "resources", "config", "v0");
}

export function resolveClientSharedDir(repoRoot: string): string {
  return path.join(resolveClientCocosRoot(repoRoot), "assets", "shared");
}
