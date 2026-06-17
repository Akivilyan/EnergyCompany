import { spawnSync } from "node:child_process";

const commands = [
  { name: "doctor", command: "cmd.exe", args: ["/c", "npm", "run", "doctor"] },
  { name: "build", command: "cmd.exe", args: ["/c", "npm", "run", "build"] },
  { name: "lint:boundaries", command: "cmd.exe", args: ["/c", "npm", "run", "lint:boundaries"] },
  { name: "test", command: "cmd.exe", args: ["/c", "npm", "test"] },
  { name: "verify:client", command: "cmd.exe", args: ["/c", "npm", "run", "verify:client"] },
];

let hasFailure = false;

for (const item of commands) {
  console.log(`\n=== ${item.name} ===`);
  const result = spawnSync(item.command, item.args, {
    encoding: "utf8",
    shell: false,
  });
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    hasFailure = true;
    console.log(`[FAIL] ${item.name} exited with code ${result.status ?? "unknown"}`);
  } else {
    console.log(`[OK] ${item.name}`);
  }
}

process.exitCode = hasFailure ? 1 : 0;
