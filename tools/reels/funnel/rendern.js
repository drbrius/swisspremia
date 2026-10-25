/* =========================================================================
   Rendern mit Remotion – programmatisch statt ueber die Kommandozeile:
   einmal buendeln, dann jeden Reel ueber die Komposition "tagesreel"
   mit dem Reel als Eingabe rendern. Spart je Reel das erneute Buendeln.

   Der von Remotion mitgelieferte Chrome Headless laesst sich auf diesem
   Rechner nicht starten (spawn EFTYPE – das Projekt liegt in OneDrive).
   Ein installierter Chrome oder Edge tut es genauso.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { WURZEL } from "./konfig.js";

export const BROWSER = [
  process.env.REMOTION_BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  (process.env.LOCALAPPDATA || "") + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
].find((p) => p && fs.existsSync(p)) || null;

let serveUrl = null;

export async function buendeln({ melden = () => {} } = {}) {
  if (serveUrl) return serveUrl;
  melden("Remotion buendelt …");
  serveUrl = await bundle({
    entryPoint: path.join(WURZEL, "src", "index.jsx"),
    publicDir: path.join(WURZEL, "public"),
    onProgress: () => {}
  });
  melden("Buendel bereit" + (BROWSER ? ", Browser: " + BROWSER : ", Browser: mitgelieferter Chrome Headless"));
  return serveUrl;
}

/* Rendert einen Reel (Objekt wie in src/reels.js) nach "ziel" (MP4).
   Liefert die Laenge in Sekunden. */
export async function reelRendern(reel, ziel, { melden = () => {}, fortschritt = null } = {}) {
  const url = await buendeln({ melden });
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  const inputProps = { reel, dauern: null };
  const komposition = await selectComposition({ serveUrl: url, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "warn" });
  let letzter = -1;
  await renderMedia({
    composition: komposition, serveUrl: url, codec: "h264", crf: 18, outputLocation: ziel + ".teil.mp4", inputProps,
    browserExecutable: BROWSER, logLevel: "warn",
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (fortschritt && p !== letzter) { letzter = p; fortschritt(p * 10); }
    }
  });
  fs.renameSync(ziel + ".teil.mp4", ziel);
  return komposition.durationInFrames / komposition.fps;
}

/* Titelbild als JPEG. Instagram nimmt ohne eigenes Titelbild den ersten
   Frame – und der ist leer, weil jede Szene erst einblendet (Probelauf
   vom 25.10.2026; thumb_offset wurde ignoriert). Deshalb ein eigenes Bild,
   das posten.js als cover_url mitschickt.

   "anteil" waehlt die Szene (die, in der dieser Anteil der Gesamtlaenge
   liegt); gerendert wird deren Frame bei 75 % – dann ist alles
   eingeblendet und die Ausblendung noch nicht begonnen.
   Liefert die Position in Millisekunden (Rueckfall fuer thumb_offset). */
export async function coverRendern(reel, ziel, anteil = 0.3, { melden = () => {} } = {}) {
  const url = await buendeln({ melden });
  const inputProps = { reel, dauern: null };
  const k = await selectComposition({ serveUrl: url, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "error" });
  const dauern = k.props.dauern || [];
  const gesucht = Math.floor(k.durationInFrames * anteil);
  let frame = Math.min(k.durationInFrames - 1, gesucht);
  let start = 0;
  for (const d of dauern) {
    if (gesucht < start + d.frames) { frame = start + Math.floor(d.frames * 0.75); break; }
    start += d.frames;
  }
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  await renderStill({
    composition: k, serveUrl: url, frame, output: ziel + ".teil.jpg", inputProps,
    imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error"
  });
  fs.renameSync(ziel + ".teil.jpg", ziel);
  return Math.round((frame / k.fps) * 1000);
}

/* Laenge einer MP4 in Millisekunden – aus dem mvhd-Atom, ohne ffmpeg. */
export function mp4DauerMs(datei) {
  const b = fs.readFileSync(datei);
  const i = b.indexOf("mvhd");
  if (i < 0) return null;
  const version = b[i + 4];
  if (version === 1) {
    const zeitbasis = b.readUInt32BE(i + 24);
    const dauer = Number(b.readBigUInt64BE(i + 28));
    return Math.round((dauer / zeitbasis) * 1000);
  }
  const zeitbasis = b.readUInt32BE(i + 16);
  const dauer = b.readUInt32BE(i + 20);
  return Math.round((dauer / zeitbasis) * 1000);
}
