import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const pythonCandidates = [
  "C:\\Users\\DCZX2\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
  "C:\\Users\\DCZX2\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
  "python",
];

const pyLauncherCandidates = [
  "C:\\Users\\DCZX2\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe",
  "py",
];

function pickCommand(candidates) {
  return candidates.find((candidate) => candidate.includes("\\") ? existsSync(candidate) : true);
}

const pythonCommand = pickCommand(pythonCandidates);
const pyCommand = pickCommand(pyLauncherCandidates);

const checks = [
  { name: "node", command: "node", args: ["-v"] },
  { name: "npm", command: "cmd.exe", args: ["/c", "npm", "-v"] },
  { name: "python", command: pythonCommand, args: ["--version"] },
  { name: "py", command: pyCommand, args: ["--version"] },
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
  if (!command) {
    return { name, ok: false, detail: "not configured" };
  }
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
  console.log(`Python command: ${pythonCommand ?? "missing"}`);
  console.log(`Py launcher: ${pyCommand ?? "missing"}`);
  const commandResults = checks.map(runCheck);
  const pathResults = await Promise.all(requiredPaths.map(checkPath));
  [...commandResults, ...pathResults].forEach(printResult);
  const softFailures = new Set(["python", "py"]);
  const hasFailure = [...commandResults, ...pathResults].some((item) => !item.ok && !softFailures.has(item.name));
  if (commandResults.some((item) => !item.ok && softFailures.has(item.name))) {
    console.log("[WARN] python/py 在当前 Codex 会话里不可直接调用；当前项目主链路不依赖它们，可暂不阻塞。");
  }
  process.exitCode = hasFailure ? 1 : 0;
}

await main();
