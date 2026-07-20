import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const workspaceRoot = resolve(process.cwd());
const prototypePath = "/docs/design/prototypes/city-first-wind-v1/index.html";
const portArg = process.argv.find((argument) => argument.startsWith("--port="));
const port = Number(portArg?.slice("--port=".length) ?? process.env.CITY_PROTOTYPE_PORT ?? 4177);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

function resolveRequestPath(url) {
  const requestPath = decodeURIComponent(new URL(url, "http://127.0.0.1").pathname);
  const normalized = requestPath === "/" ? prototypePath : requestPath;
  const localPath = resolve(workspaceRoot, `.${normalized}`);
  const rootPrefix = `${workspaceRoot}${sep}`.toLowerCase();
  if (localPath.toLowerCase() !== workspaceRoot.toLowerCase() && !localPath.toLowerCase().startsWith(rootPrefix)) {
    return undefined;
  }
  return localPath;
}

const server = createServer((request, response) => {
  const localPath = resolveRequestPath(request.url ?? "/");
  if (!localPath || !existsSync(localPath) || !statSync(localPath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extname(localPath).toLowerCase()] ?? "application/octet-stream",
  });
  createReadStream(localPath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`EnergyCompany 城市原型已启动：`);
  console.log(`http://127.0.0.1:${port}${prototypePath}`);
  console.log("按 Ctrl+C 停止。");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
