#!/usr/bin/env node
/**
 * 探测 Cocos 内置浏览器预览是否在跑（默认 http://127.0.0.1:7456/）。
 * 需在编辑器中点击「播放」后执行。
 *
 * 用法：
 *   npm run check:cocos-preview
 */
import { previewUrlFromEnv, probeCocosPreview } from "./previewProbe.js";

const url = previewUrlFromEnv();
const result = await probeCocosPreview(url);

if (!result.ok) {
  console.error(`preview-probe FAIL: ${result.url}`);
  console.error(`  reason: ${result.reason}`);
  console.error("  hint: open client/cocos in Cocos Creator 3.8.8, wait for Quick Compile, then click Play");
  console.error("  hint: run npm run verify:client for logic without the editor");
  process.exit(1);
}

console.log(`preview-probe OK: ${result.url} (HTTP ${result.status})`);
console.log("  hint: game logs appear in editor Console or browser F12 (Info For Web Page)");
