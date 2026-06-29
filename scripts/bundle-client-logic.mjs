import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.join(root, "src", "app", "cocosClientExports.ts");
const sharedDir = path.join(root, "client", "cocos", "assets", "shared");
const outfile = path.join(sharedDir, "game-client.mjs");
const outfileMeta = `${outfile}.meta`;

/** Stable UUID so Cocos asset-db does not warn about missing meta on refresh. */
const GAME_CLIENT_MJS_META = {
  ver: "1.2.0",
  importer: "javascript",
  imported: true,
  uuid: "a8f4e2c1-9b3d-4f6a-b1c2-8e7d9a0b4c63",
  files: [],
  subMetas: {},
  userData: {}
};

fs.mkdirSync(sharedDir, { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2018"],
  outfile,
  // Source maps under assets/ need a .map.meta each; skip for generated bundle.
  sourcemap: false,
  logLevel: "info"
});

fs.writeFileSync(outfileMeta, `${JSON.stringify(GAME_CLIENT_MJS_META, null, 2)}\n`, "utf8");

for (const stale of ["game-client.mjs.map", "game-client.mjs.map.meta"]) {
  const stalePath = path.join(sharedDir, stale);
  if (fs.existsSync(stalePath)) fs.rmSync(stalePath);
}

console.log(`client bundle ok: ${path.relative(root, outfile)}`);
