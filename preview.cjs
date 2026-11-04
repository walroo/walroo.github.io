const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const statsWorker = import("./ccu-worker.mjs");
const clients = new Set();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const reload =
  '<script>new EventSource("/__reload").onmessage=()=>location.reload();</script>';
http
  .createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/ccu") {
      try {
        const { default: worker } = await statsWorker;
        const result = await worker.fetch(new Request("http://localhost:4173/api/ccu", {
          method: request.method,
          headers: request.headers.origin ? { Origin: request.headers.origin } : {},
        }));
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      } catch {
        response.writeHead(503, { "Content-Type": "application/json" });
        response.end('{"error":"Player counts unavailable"}');
      }
      return;
    }
    if (pathname === "/__reload") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      response.write(": connected\n\n");
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    const filename = path.resolve(
      root,
      "." + (decoded === "/" ? "/index.html" : decoded),
    );
    if (
      !filename.startsWith(root + path.sep) ||
      !types[path.extname(filename)]
    ) {
      response.writeHead(404).end();
      return;
    }
    fs.readFile(filename, (error, data) => {
      if (error) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": types[path.extname(filename)],
        "Cache-Control": "no-store",
      });
      response.end(
        path.extname(filename) === ".html"
          ? data.toString().replace("</body>", reload + "</body>")
          : data,
      );
    });
  })
  .listen(4173, "127.0.0.1", () => console.log("Local: http://127.0.0.1:4173"));
let timer;
fs.watch(root, { recursive: true }, (_, filename) => {
  if (!filename || !/\.(html|css|js|mjs|png|svg)$/.test(filename)) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const client of clients) client.write("data: reload\n\n");
  }, 150);
});

