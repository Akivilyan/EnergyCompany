import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.cwd());
const prototypeRoot = resolve(root, "docs/design/prototypes/city-first-wind-v1");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "model.mjs",
  "README.md",
].map((file) => resolve(prototypeRoot, file));

const requiredAssets = [
  "docs/design/ui/assets/buildings/representative-v1/master/building-wind-tier1-master-v1.png",
  "docs/design/ui/assets/buildings/representative-v1/master/building-solar-tier1-master-v1.png",
  "docs/design/ui/assets/buildings/representative-v1/master/building-thermal-tier1-master-v1.png",
  "docs/design/ui/assets/buildings/representative-v1/thumbnail/building-wind-tier1-thumbnail-v1.png",
  "docs/design/ui/assets/buildings/representative-v1/thumbnail/building-solar-tier1-thumbnail-v1.png",
  "docs/design/ui/assets/buildings/representative-v1/thumbnail/building-thermal-tier1-thumbnail-v1.png",
  "docs/design/ui/assets/icons/runtime/resources/icon-funds-v1.png",
  "docs/design/ui/assets/icons/runtime/resources/icon-energy-v1.png",
  "docs/design/ui/assets/icons/runtime/common/icon-calendar-v1.png",
  "docs/design/ui/assets/icons/runtime/common/icon-turn-income-v1.png",
  "docs/design/ui/assets/icons/runtime/action-state/icon-build-v1.png",
].map((file) => resolve(root, file));

const missing = [...requiredFiles, ...requiredAssets].filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error("城市原型缺少文件：");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const html = readFileSync(resolve(prototypeRoot, "index.html"), "utf8");
const app = readFileSync(resolve(prototypeRoot, "app.js"), "utf8");
const requiredHooks = [
  "prototype-phone",
  "funds-value",
  "month-value",
  "supply-value",
  "build-slot-primary",
  "candidate-wind",
  "continue-build",
  "confirm-build",
  "next-month",
  "month-receipt",
];

const source = `${html}\n${app}`;
const missingHooks = requiredHooks.filter((hook) => !source.includes(`data-testid=\"${hook}\"`));
if (missingHooks.length > 0) {
  console.error(`城市原型缺少自动化钩子：${missingHooks.join(", ")}`);
  process.exit(1);
}

const modelUrl = pathToFileURL(resolve(prototypeRoot, "model.mjs")).href;
const { createInitialState, transition } = await import(modelUrl);
let state = createInitialState();
state = transition(state, { type: "SELECT_SLOT" });
state = transition(state, { type: "CONTINUE" });
state = transition(state, { type: "CONFIRM_BUILD" });
state = transition(state, { type: "NEXT_MONTH" });
state = transition(state, { type: "NEXT_MONTH" });

const expected = {
  funds: 267,
  month: 3,
  projectStatus: "operational",
  supplyPercent: 3,
};

for (const [key, value] of Object.entries(expected)) {
  if (state[key] !== value) {
    console.error(`状态机检查失败：${key} 应为 ${value}，实际为 ${state[key]}`);
    process.exit(1);
  }
}

console.log("城市原型静态资源、自动化钩子与风电闭环状态检查通过。");
