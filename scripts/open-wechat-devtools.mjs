import { spawn } from "node:child_process";

const cliPath = "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat";
const projectDir = "M:\\codex\\EnergyCompany\\client\\cocos\\build\\wechatgame";

spawn("cmd.exe", ["/c", cliPath, "open", "--project", projectDir], {
  detached: true,
  stdio: "ignore",
}).unref();

console.log(`Opened WeChat DevTools project: ${projectDir}`);
