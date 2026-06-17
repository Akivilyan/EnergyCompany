import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const checks = [
  { name: "node", command: "node", args: ["-v"] },
  { name: "npm", command: "cmd.exe", args: ["/c", "npm", "-v"] },
  {
    name: "python",
    command: "C:\\Users\\DCZX2\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
    args: ["--version"],
  },
  {
    name: "py",
    command: "C:\\Users\\DCZX2\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe",
    args: ["--version"],
  },
  { name: "git", command: "git", args: ["--version"] },
  { name: "rg", command: "rg", args: ["--version"] },
];

const requiredPaths = [
  {
    name: "Cocos Creator 3.8.8",
    path: "C:\\ProgramData\\cocos\\editors\\Creator\\3.8.8\\CocosCreator.exe",
  },
  {
    name: "微信开发者工具 CLI",
    path: "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat",
  },
  {
    name: "微信开发者工具 GUI",
    path: "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\wechatdevtools.exe",
  },
];

function runCheck({ name, command, args }) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
  });
  if (result.error) {
    return { name, ok: false, detail: result.error.message };
  }
  if (result.status === 0) {
    const output = `${result.stdout}${result.stderr}`.trim().split(/\r?\n/)[0] ?? "ok";
    return { name, ok: true, detail: output };
  }
  const detail = `${result.stdout}${result.stderr}`.trim() || "unavailable";
  return { name, ok: false, detail };
}

async function checkPath({ name, path: targetPath }) {
  try {
    await access(targetPath);
    return { name, ok: true, detail: targetPath };
  } catch {
    return { name, ok: false, detail: targetPath };
  }
}

function printResult({ name, ok, detail }) {
  const status = ok ? "OK" : "FAIL";
  console.log(`[${status}] ${name}: ${detail}`);
}

async function main() {
  console.log(`Workspace: ${path.resolve(process.cwd())}`);
  const commandResults = checks.map(runCheck);
  const pathResults = await Promise.all(requiredPaths.map(checkPath));
  [...commandResults, ...pathResults].forEach(printResult);
  const hasFailure = [...commandResults, ...pathResults].some((item) => !item.ok);
  process.exitCode = hasFailure ? 1 : 0;
}

await main();
