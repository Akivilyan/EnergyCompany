import * as esbuild from "esbuild";
import path from "node:path";

const root = process.cwd();
const entry = path.join(root, "src", "app", "cocosClientExports.ts");
const outfile = path.join(root, "client", "cocos", "assets", "shared", "game-client.mjs");

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2018"],
  outfile,
  sourcemap: true,
  logLevel: "info"
});

console.log(`client bundle ok: ${path.relative(root, outfile)}`);
