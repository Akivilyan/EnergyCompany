import fs from "node:fs";
import path from "node:path";

const simDir = path.join(process.cwd(), "src", "sim");
const forbidden = ["from \"cc\"", "from 'cc'", "require(\"cc\")", "cocos"];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith(".ts")) files.push(p);
  }
  return files;
}

let failed = false;
for (const file of walk(simDir)) {
  const text = fs.readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) {
      console.error(`boundary violation: ${file} contains ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("sim boundary check passed");
