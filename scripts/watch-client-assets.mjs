import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const syncScript = path.join(root, "scripts", "sync-client-assets.mjs");
const watchTargets = [
  path.join(root, "src"),
  path.join(root, "docs", "design", "data", "vertical-slice-v0")
];

let running = false;
let rerun = false;
let timer = null;

function schedule(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => runSync(reason), 100);
}

function runSync(reason) {
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  rerun = false;
  console.log(`[watch] sync start: ${reason}`);
  const child = spawn(process.execPath, [syncScript], {
    cwd: root,
    stdio: "inherit"
  });
  child.on("exit", (code) => {
    running = false;
    if (code !== 0) {
      console.log(`[watch] sync failed: exit ${code}`);
    }
    if (rerun) {
      runSync("queued changes");
    }
  });
}

for (const target of watchTargets) {
  if (!fs.existsSync(target)) continue;
  watchRecursive(target);
}

runSync("initial");
console.log("[watch] watching src and vertical-slice-v0 config; press Ctrl+C to stop");

function watchRecursive(target) {
  try {
    fs.watch(target, { recursive: true }, (_event, fileName) => {
      schedule(fileName ? path.join(path.relative(root, target), fileName.toString()) : path.relative(root, target));
    });
    return;
  } catch {
    watchDirectoryTree(target);
  }
}

function watchDirectoryTree(target) {
  for (const dir of listDirectories(target)) {
    fs.watch(dir, (_event, fileName) => {
      schedule(fileName ? path.relative(root, path.join(dir, fileName.toString())) : path.relative(root, dir));
    });
  }
}

function listDirectories(target) {
  const dirs = [target];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      dirs.push(...listDirectories(path.join(target, entry.name)));
    }
  }
  return dirs;
}
