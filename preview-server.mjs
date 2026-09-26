import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const root = import.meta.dirname;
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript" };
createServer(async (request, response) => {
  const path = (request.url ?? "/").split("?")[0];
  if (!/^\/(?:[a-zA-Z0-9._/-]*)$/.test(path) || path.includes("..")) { response.writeHead(400); response.end(); return; }
  const filename = join(root, path === "/" ? "index.html" : path.slice(1));
  try { const body = await readFile(filename); response.writeHead(200, { "content-type": mime[extname(filename)] ?? "application/octet-stream" }); response.end(body); }
  catch { response.writeHead(404); response.end("Not found"); }
}).listen(8765, "127.0.0.1", () => process.stdout.write("Preview on http://127.0.0.1:8765\n"));
