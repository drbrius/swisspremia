/* =========================================================================
   Lokaler Testserver fuer das Board – dieselben api/-Dateien wie auf
   Vercel, dazu public/ und die Header aus vercel.json.

       node dev.js                  echter Stand: ../reels/plan/board-stand.enc.json
                                    (vorher: cd ../reels && node board.js --trocken)
       node dev.js --beispiel       erfundener Stand mit vollem Tagesplan
       node dev.js --port=4180

   Zugang lokal, wenn nicht in der Umgebung gesetzt: Benutzer "test",
   Passwort "test-passwort-lokal". Gilt nur hier, nie auf Vercel.
   ========================================================================= */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const arg = Object.fromEntries(process.argv.slice(2).map((t) => { const m = t.match(/^--([a-z-]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [t, true]; }));
const PORT = Number(arg.port || 4180);

/* setx-Variablen sieht ein schon laufender Prozess nicht – unter Windows
   direkt aus der Registry lesen. */
function nutzerVariable(name) {
  if (process.env[name]) return process.env[name];
  if (process.platform !== "win32") return "";
  try {
    const aus = execFileSync("reg", ["query", "HKCU\\Environment", "/v", name], { encoding: "utf8", windowsHide: true });
    return aus.match(new RegExp(`${name}\\s+REG_\\w+\\s+(.+)`))?.[1]?.trim() || "";
  } catch (e) { return ""; }
}

process.env.BOARD_BENUTZER ||= "test";
process.env.BOARD_PASSWORT ||= "test-passwort-lokal";
if (arg.beispiel) {
  process.env.BOARD_SCHLUESSEL = "beispiel-schluessel-nur-lokal";
  const datei = path.join(os.tmpdir(), "swisspremia-board-beispiel.enc.json");
  const { beispielStand } = await import(pathToFileURL(path.join(WURZEL, "test", "beispiel.js")).href);
  const { verschluesseln } = await import(pathToFileURL(path.join(WURZEL, "..", "reels", "funnel", "board.js")).href);
  fs.writeFileSync(datei, verschluesseln(beispielStand(), process.env.BOARD_SCHLUESSEL));
  process.env.BOARD_DATEN_DATEI = datei;
} else {
  process.env.BOARD_SCHLUESSEL ||= nutzerVariable("BOARD_SCHLUESSEL");
  process.env.BOARD_DATEN_DATEI ||= path.join(WURZEL, "..", "reels", "plan", "board-stand.enc.json");
}

const vercel = JSON.parse(fs.readFileSync(path.join(WURZEL, "vercel.json"), "utf8"));
const TYPEN = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8" };

function headerSetzen(res, pfad) {
  for (const regel of vercel.headers || []) {
    if (new RegExp(`^${regel.source}$`).test(pfad)) for (const h of regel.headers) res.setHeader(h.key, h.value);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  headerSetzen(res, url.pathname);
  const api = url.pathname.match(/^\/api\/([a-z]+)$/);
  if (api) {
    const datei = path.join(WURZEL, "api", api[1] + ".js");
    if (!fs.existsSync(datei)) { res.statusCode = 404; return res.end(); }
    let roh = "";
    for await (const teil of req) roh += teil;
    req.body = roh;
    const { default: handler } = await import(pathToFileURL(datei).href);
    try { await handler(req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end(); }
    return;
  }
  const relativ = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const datei = path.join(WURZEL, "public", relativ);
  if (!datei.startsWith(path.join(WURZEL, "public")) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.statusCode = 404; return res.end("Nicht gefunden"); }
  res.setHeader("Content-Type", TYPEN[path.extname(datei)] || "application/octet-stream");
  fs.createReadStream(datei).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Board lokal: http://localhost:${PORT}  (${arg.beispiel ? "Beispieldaten" : process.env.BOARD_DATEN_DATEI})`);
  if (!process.env.BOARD_SCHLUESSEL) console.log("Achtung: BOARD_SCHLUESSEL fehlt – zuerst in tools/reels: node board.js schluessel");
});
