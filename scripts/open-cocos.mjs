import { spawn } from "node:child_process";

const cocosExe = "C:\\ProgramData\\cocos\\editors\\Creator\\3.8.8\\CocosCreator.exe";
const projectDir = "M:\\codex\\EnergyCompany\\client\\cocos";

spawn(cocosExe, ["--path", projectDir], {
  detached: true,
  stdio: "ignore",
}).unref();

console.log(`Opened Cocos Creator with project: ${projectDir}`);
