import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "docs", "design", "data", "vertical-slice-v0");
const outputDir = path.join(root, "playtest-lab", "output");
const overlays = [
  { name: "baseline", files: [] },
  { name: "batch-1", files: ["batch-1-overlay.json"] },
  { name: "batch-2", files: ["batch-2-overlay.json"] },
  { name: "batch-3", files: ["batch-3-overlay.json"] },
  { name: "batch-4", files: ["batch-4-overlay.json"] },
  {
    name: "combined-b1-b2-b3-b4",
    files: [
      "batch-1-overlay.json",
      "batch-2-overlay.json",
      "batch-3-overlay.json",
      "batch-4-overlay.json"
    ]
  }
];

const target = {
  passRateA: [0.6, 0.7],
  passRateB: [0.8, 0.9],
  passRateC: [0.9, 1.0],
  adsAvg: [3.0, 5.0],
  durationAvg: [60, 90]
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function mergeById(baseList, patchList, idKey) {
  const index = new Map(baseList.map((item, i) => [item[idKey], i]));
  for (const patchItem of patchList) {
    const idx = index.get(patchItem[idKey]);
    if (idx === undefined) continue;
    baseList[idx] = { ...baseList[idx], ...patchItem };
  }
}

function applyOverlay(baseConfig, overlayConfig) {
  const config = clone(baseConfig);
  if (!overlayConfig) return config;

  if (overlayConfig.run_config) {
    config.run_config = { ...config.run_config, ...overlayConfig.run_config };
  }
  if (overlayConfig.campaign_disasters) {
    mergeById(config.campaign_disasters, overlayConfig.campaign_disasters, "seq");
  }
  if (overlayConfig.ad_rewards) {
    mergeById(config.ad_rewards, overlayConfig.ad_rewards, "company_level");
  }
  if (overlayConfig.cities) {
    mergeById(config.cities, overlayConfig.cities, "city_id");
  }
  return config;
}

function applyOverlays(baseConfig, overlayFiles) {
  let current = clone(baseConfig);
  for (const file of overlayFiles) {
    const overlayData = readJson(path.join(dataDir, "experiments", file));
    current = applyOverlay(current, overlayData);
  }
  return current;
}

function metricVector(config) {
  const d1 = config.campaign_disasters.find((d) => d.seq === 1);
  const d2 = config.campaign_disasters.find((d) => d.seq === 2);
  const d3 = config.campaign_disasters.find((d) => d.seq === 3);
  const ads = config.ad_rewards.reduce((acc, x) => acc + x.reward_cash, 0) / config.ad_rewards.length;
  const cStart = config.cities.find((c) => c.city_id === "CITY-START")?.base_demand_mw ?? 1200;
  const cMap0103 = config.cities.find((c) => c.city_id === "CITY-MAP01-03")?.base_demand_mw ?? 100;
  const cMap0202 = config.cities.find((c) => c.city_id === "CITY-MAP02-02")?.base_demand_mw ?? 480;
  const cMap0203 = config.cities.find((c) => c.city_id === "CITY-MAP02-03")?.base_demand_mw ?? 90;

  const earlyPressure = (d1.immediate_cash_penalty + 2 * d1.debuff_duration_months + 0.7 * d2.immediate_cash_penalty) / 40;
  const midPressure = (d2.immediate_cash_penalty + 2 * d2.debuff_duration_months + d3.immediate_cash_penalty + 2 * d3.debuff_duration_months) / 80;
  const econBuffer = config.run_config.starting_cash_base / 100 + (ads / 40) * 0.2;
  const adPower = (0.25 * config.ad_rewards[0].reward_cash + 0.35 * config.ad_rewards[2].reward_cash + 0.4 * config.ad_rewards[4].reward_cash) / 35;
  const mapExportScore = cStart / Math.max(1, cMap0103 + cMap0202 + cMap0203);

  return { earlyPressure, midPressure, econBuffer, adPower, mapExportScore };
}

function simulateStrategy(vector, strategy, iterations, seedOffset) {
  const rng = mulberry32(20260528 + seedOffset);
  let passCount = 0;
  let adsSum = 0;
  let durationSum = 0;

  let passBase = 0.68 + 0.18 * (vector.econBuffer - 1.0) - 0.22 * vector.earlyPressure - 0.12 * vector.midPressure + 0.05 * (vector.mapExportScore - 1.8);
  if (strategy === "B") passBase += 0.22 + 0.12 * vector.adPower;
  if (strategy === "C") passBase += 0.30 + 0.2 * vector.adPower;
  passBase = clamp(passBase, 0.1, 0.98);

  let adsBase = 1.2 + 3.2 * vector.earlyPressure + 1.3 * vector.midPressure - 1.2 * vector.econBuffer;
  if (strategy === "B") adsBase += 1.3 - 1.5 * vector.adPower;
  if (strategy === "C") adsBase += 3.4 - 2.1 * vector.adPower;
  adsBase = clamp(adsBase, 0.3, 9.5);

  let durationBase = 76 + 9 * vector.midPressure + 6 * vector.earlyPressure - 4 * vector.adPower;
  if (strategy === "B") durationBase -= 3;
  if (strategy === "C") durationBase -= 10;
  durationBase = clamp(durationBase, 45, 110);

  for (let i = 0; i < iterations; i++) {
    const passProb = clamp(passBase + (rng() - 0.5) * 0.08, 0.05, 0.99);
    if (rng() < passProb) passCount++;
    adsSum += clamp(adsBase + (rng() - 0.5) * 1.4, 0, 12);
    durationSum += clamp(durationBase + (rng() - 0.5) * 14, 35, 130);
  }

  return {
    passRate: passCount / iterations,
    adsAvg: adsSum / iterations,
    durationAvg: durationSum / iterations
  };
}

function inRange(value, [min, max]) {
  return value >= min && value <= max;
}

function evaluate(batchName, result) {
  const overallAds = (result.A.adsAvg + result.B.adsAvg + result.C.adsAvg) / 3;
  const overallDuration = (result.A.durationAvg + result.B.durationAvg + result.C.durationAvg) / 3;
  return {
    batchName,
    targetCheck: {
      A: inRange(result.A.passRate, target.passRateA),
      B: inRange(result.B.passRate, target.passRateB),
      C: inRange(result.C.passRate, target.passRateC),
      ads: inRange(overallAds, target.adsAvg),
      duration: inRange(overallDuration, target.durationAvg)
    },
    overallAds,
    overallDuration
  };
}

function percent(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function run() {
  const baseConfig = {
    run_config: readJson(path.join(dataDir, "run_config.json")),
    campaign_disasters: readJson(path.join(dataDir, "campaign_disasters.json")),
    ad_rewards: readJson(path.join(dataDir, "ad_rewards.json")),
    cities: readJson(path.join(dataDir, "cities.json"))
  };

  const records = [];

  for (let i = 0; i < overlays.length; i++) {
    const scenario = overlays[i];
    const cfg = applyOverlays(baseConfig, scenario.files);
    const vec = metricVector(cfg);
    const result = {
      A: simulateStrategy(vec, "A", 600, i * 3 + 1),
      B: simulateStrategy(vec, "B", 600, i * 3 + 2),
      C: simulateStrategy(vec, "C", 600, i * 3 + 3)
    };
    const evalResult = evaluate(scenario.name, result);
    records.push({ batch: scenario.name, vector: vec, result, eval: evalResult });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outJson = path.join(outputDir, "first-round-results.json");
  fs.writeFileSync(outJson, JSON.stringify(records, null, 2), "utf8");

  const lines = [];
  lines.push("# First-Round Batch Simulation Report");
  lines.push("");
  lines.push("Method: heuristic proxy simulation (not runtime game engine).");
  lines.push("");
  lines.push("> 中文注释：`batch` 表示调参批次（每批只改 3~4 个参数）。");
  lines.push("> 中文注释：`A/B/C` 是三种策略：A=不看广告，B=保守救急广告，C=激进加速广告。");
  lines.push("> 中文注释：本报告用于比较调参方向，不替代引擎实跑验收。");
  lines.push("");
  for (const row of records) {
    const check = row.eval.targetCheck;
    lines.push(`## ${row.batch}`);
    lines.push(`- passRate(A/B/C): ${percent(row.result.A.passRate)} / ${percent(row.result.B.passRate)} / ${percent(row.result.C.passRate)}`);
    lines.push(`- avgAds(A/B/C): ${row.result.A.adsAvg.toFixed(2)} / ${row.result.B.adsAvg.toFixed(2)} / ${row.result.C.adsAvg.toFixed(2)} (overall ${row.eval.overallAds.toFixed(2)})`);
    lines.push(`- avgDuration(A/B/C): ${row.result.A.durationAvg.toFixed(1)} / ${row.result.B.durationAvg.toFixed(1)} / ${row.result.C.durationAvg.toFixed(1)} (overall ${row.eval.overallDuration.toFixed(1)})`);
    lines.push(`- targetCheck: A=${check.A}, B=${check.B}, C=${check.C}, ads=${check.ads}, duration=${check.duration}`);
    lines.push("");
  }

  const outMd = path.join(outputDir, "first-round-results.md");
  fs.writeFileSync(outMd, lines.join("\n"), "utf8");

  console.log(`WROTE: ${outJson}`);
  console.log(`WROTE: ${outMd}`);
  for (const row of records) {
    console.log(
      `${row.batch}: A=${percent(row.result.A.passRate)} B=${percent(row.result.B.passRate)} C=${percent(row.result.C.passRate)} | ads=${row.eval.overallAds.toFixed(2)} | duration=${row.eval.overallDuration.toFixed(1)}`
    );
  }
}

run();
