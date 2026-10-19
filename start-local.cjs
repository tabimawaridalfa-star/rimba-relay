// Server statis sederhana untuk pengujian LAN, tanpa npm install/build.
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const root = __dirname,
  port = Number(process.env.PORT) || 8080;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let file;
    try {
      file = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (file === root) file = path.join(root, "index.html");
    fs.readFile(file, (e, data) => {
      res.writeHead(e ? 404 : 200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(e ? "Tidak ditemukan" : data);
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Lokal: http://localhost:${port}/host.html`);
    for (const list of Object.values(os.networkInterfaces()))
      for (const address of list || [])
        if (address.family === "IPv4" && !address.internal)
          console.log(
            `Laptop + HP: http://${address.address}:${port}/host.html`,
          );
    console.log(
      "Buka alamat LAN di laptop agar QR bisa diakses HP. Ctrl+C untuk berhenti.",
    );
  })
  .on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? "Port digunakan. Hentikan server lama atau atur PORT."
        : e.message,
    );
    process.exitCode = 1;
  });
