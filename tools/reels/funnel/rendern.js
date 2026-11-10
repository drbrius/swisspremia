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
import { renderMedia, renderStill, renderFrames, selectComposition } from "@remotion/renderer";
import { WURZEL } from "./konfig.js";
import { szenenStarts } from "../src/takt.js";
import { execFileSync, spawnSync } from "node:child_process";
import { ffmpegPfad } from "./musik-synth.js";
import { KONFIG } from "./konfig.js";


/* Browser-Zeitlimit (Remotion-Standard 30 s). Am 8.11.2026 scheiterten drei
   Renders an "Timed out after 30000 while setting up the headless browser"
   und "NetworkError" – eine Stoerung von 51 Sekunden. */
export const BROWSER_TIMEOUT = 120_000;

/* Voruebergehende Fehler (Browser-Start, Netz) ein- bis zweimal wiederholen,
   mit Pause; alles andere sofort weiterreichen. */
const VORUEBERGEHEND = /Timed out|NetworkError|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|Target closed|spawn/i;
export async function mitWiederholung(fn, { versuche = 3, pauseMs = 45_000, melden = () => {} } = {}) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (i >= versuche || !VORUEBERGEHEND.test(String(e && e.message))) throw e;
      melden(`voruebergehender Fehler (${String(e.message).split("\n")[0].slice(0, 120)}) – neuer Versuch ${i + 1}/${versuche} in ${Math.round(pauseMs / 1000)} s`);
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }
}
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
/* Zwei Durchgaenge: zuerst messen, dann mit den Messwerten linear
   angleichen (eine Verstaerkung fuer das ganze Reel). Einfaches loudnorm
   regelt laufend nach und hebt die Musik in jeder Sprechpause an. */
export function lautheitFilter(datei, ziel) {
  const basis = `loudnorm=I=${ziel}:TP=-1.5:LRA=11`;
  try {
    const r = spawnSync(ffmpegPfad(), ["-hide_banner", "-nostats", "-i", datei, "-vn", "-af", basis + ":print_format=json", "-f", "null", "-"], { encoding: "utf8" });
    const m = String(r.stderr || "").match(/\{[^{}]*"input_i"[^{}]*\}/);
    if (!m) return basis;
    const w = JSON.parse(m[0]);
    return `${basis}:measured_I=${w.input_i}:measured_TP=${w.input_tp}:measured_LRA=${w.input_lra}:measured_thresh=${w.input_thresh}:offset=${w.target_offset}:linear=true`;
  } catch (e) {
    return basis;
  }
}

export async function reelRendern(reel, ziel, { melden = () => {}, fortschritt = null } = {}) {
  const url = await buendeln({ melden });
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  const inputProps = { reel, dauern: null };
  const komposition = await selectComposition({ serveUrl: url, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "warn", timeoutInMilliseconds: BROWSER_TIMEOUT });
  let letzter = -1;
  await renderMedia({
    timeoutInMilliseconds: BROWSER_TIMEOUT,
    composition: komposition, serveUrl: url, codec: "h264", crf: 18, outputLocation: ziel + ".teil.mp4", inputProps,
    browserExecutable: BROWSER, logLevel: "warn",
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (fortschritt && p !== letzter) { letzter = p; fortschritt(p * 10); }
    }
  });
  /* Lautheit des fertigen Reels angleichen (Stimme und Musik zusammen):
     ElevenLabs liefert die Stimme bei etwa -23.5 LUFS, ueblich auf
     Instagram sind rund -14. Video wird nur kopiert, Ton neu kodiert. */
  const ziel_lufs = Number(KONFIG.lautheitZiel) || 0;
  if (ziel_lufs < 0) {
    try {
      execFileSync(ffmpegPfad(), ["-y", "-hide_banner", "-loglevel", "error", "-i", ziel + ".teil.mp4", "-c:v", "copy",
        "-af", lautheitFilter(ziel + ".teil.mp4", ziel_lufs), "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", ziel + ".laut.mp4"]);
      fs.rmSync(ziel + ".teil.mp4", { force: true });
      fs.renameSync(ziel + ".laut.mp4", ziel + ".teil.mp4");
    } catch (e) {
      fs.rmSync(ziel + ".laut.mp4", { force: true });
      melden("Lautheit nicht angeglichen (" + String(e.message).split("\n")[0].slice(0, 120) + ") – Reel bleibt, wie gerendert.");
    }
  }
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
  const k = await selectComposition({ serveUrl: url, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  const dauern = k.props.dauern || [];
  const starts = szenenStarts(dauern);   // Szenen ueberlappen sich um den Uebergang
  const gesucht = Math.floor(k.durationInFrames * anteil);
  let frame = Math.min(k.durationInFrames - 1, gesucht);
  for (let i = dauern.length - 1; i >= 0; i--) {
    if (gesucht >= starts[i]) { frame = Math.min(k.durationInFrames - 1, starts[i] + Math.floor(dauern[i].frames * 0.75)); break; }
  }
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  await renderStill({
    timeoutInMilliseconds: BROWSER_TIMEOUT,
    composition: k, serveUrl: url, frame, output: ziel + ".teil.jpg", inputProps,
    imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error"
  });
  fs.renameSync(ziel + ".teil.jpg", ziel);
  return Math.round((frame / k.fps) * 1000);
}

/* Karussell: jede Folie als JPEG (1080 x 1350) nach "ordner" – eine
   Browser-Sitzung fuer alle Folien (renderFrames). Dateien 01.jpg, 02.jpg …
   in Folienreihenfolge; liefert die Pfade. Instagram verlangt JPEG, 4:5 bis
   1.91:1, hoechstens 8 MB je Bild. */
export async function karussellRendern(karussell, ordner, { melden = () => {} } = {}) {
  const url = await buendeln({ melden });
  const inputProps = { karussell };
  const k = await selectComposition({ serveUrl: url, id: "karussell", inputProps, browserExecutable: BROWSER, logLevel: "warn", timeoutInMilliseconds: BROWSER_TIMEOUT });
  const teil = ordner + ".teil";
  fs.rmSync(teil, { recursive: true, force: true });
  fs.mkdirSync(teil, { recursive: true });
  await renderFrames({
    timeoutInMilliseconds: BROWSER_TIMEOUT,
    composition: k, serveUrl: url, inputProps, outputDir: teil, imageFormat: "jpeg", jpegQuality: 92,
    frameRange: [0, k.durationInFrames - 1], concurrency: 1, browserExecutable: BROWSER, logLevel: "warn",
    onStart: () => {}, onFrameUpdate: () => {}
  });
  const gerendert = fs.readdirSync(teil).filter((n) => /^element-\d+\.jpe?g$/i.test(n)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  if (gerendert.length !== k.durationInFrames) throw new Error(`Karussell ${karussell.id}: ${gerendert.length} von ${k.durationInFrames} Folien gerendert.`);
  fs.rmSync(ordner, { recursive: true, force: true });
  fs.mkdirSync(ordner, { recursive: true });
  const dateien = gerendert.map((n, i) => {
    const ziel = path.join(ordner, `${String(i + 1).padStart(2, "0")}.jpg`);
    fs.renameSync(path.join(teil, n), ziel);
    return ziel;
  });
  fs.rmSync(teil, { recursive: true, force: true });
  return dateien;
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
