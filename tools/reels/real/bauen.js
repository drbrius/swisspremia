/* =========================================================================
   Serie «Echt» – Reels zusammenbauen und rendern.

   Aus Skript (real/skripte.js), Sprechzeiten (real/zeiten/<id>.json) und
   Clip (real/clips.json) entsteht die Eingabe fuer die Komposition
   "echtreel" (src/EchtReel.jsx); gerendert wird nach out/real/<id>.mp4
   samt Titelbild <id>.jpg, die Lautheit danach auf -14 LUFS angeglichen.

       node real/bauen.js                 alle Reels, deren Clip vorliegt und die noch fehlen
       node real/bauen.js brief --neu     eines neu rendern
       node real/bauen.js brief --bild=30 nur ein Standbild (Frame) nach out/real/pruef/
       node real/bauen.js --ohne-clip     auch ohne Clip rendern (dunkler Grund, zum Pruefen der Texte)

   Musik: REAL_MUSIK (Standard real-1, Datei in public/musik/); Lautstaerke
   wie im Funnel (musikLautstaerke).
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, BROWSER, BROWSER_TIMEOUT, lautheitFilter } from "../funnel/rendern.js";
import { ffmpegPfad } from "../funnel/musik-synth.js";
import { KONFIG } from "../funnel/konfig.js";
import { REELS } from "./skripte.js";
import { clipsLesen, szenenZeiten } from "./clips.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const AUSGABE = path.join(WURZEL, "out", "real");
const FPS = 30;
const MUSIK = process.env.REAL_MUSIK || "real-1";

/* Einstellungen des Clips auf die Sprechzeit legen. Stimmen Anzahl
   Einstellungen und Szenen ueberein, bekommt jede Einstellung ihre Szene –
   aber nie langsamer als 0.68-fach oder schneller als 1.15-fach; was nicht
   passt, uebernimmt die naechste Einstellung. Sonst laeuft der ganze Clip
   gleichmaessig. Liefert [{ von, bis (Sekunden im Reel), clipVon, clipBis, tempo }]. */
export function zuordnen(grenzen, szenenDauer) {
  const RAND_VON = 0.06, RAND_BIS = 0.1, MIN = 0.68, MAX = 1.15;
  const L = grenzen.slice(1).map((g, i) => Math.max(0.3, g - grenzen[i] - RAND_VON - RAND_BIS));
  const gesamt = szenenDauer.reduce((a, b) => a + b, 0);
  const m = L.length;
  const wunsch = m === szenenDauer.length ? [...szenenDauer] : L.map((l) => (gesamt * l) / L.reduce((a, b) => a + b, 0));
  const liste = [];
  let t = 0, uebertrag = 0;
  for (let i = 0; i < m; i++) {
    const letzte = i === m - 1;
    const soll = letzte ? gesamt - t : Math.max(0.5, wunsch[i] + uebertrag);
    const tempo = Math.max(letzte ? 0.5 : MIN, Math.min(MAX, L[i] / soll));
    const zeit = letzte ? soll : L[i] / tempo;
    liste.push({ von: t, bis: t + zeit, clipVon: grenzen[i] + RAND_VON, clipBis: grenzen[i + 1] - RAND_BIS, tempo });
    uebertrag = soll - zeit;
    t += zeit;
  }
  return liste;
}

/* Eingabe fuer die Komposition. */
export function eingabe(reel, { ohneClip = false } = {}) {
  const z = JSON.parse(fs.readFileSync(path.join(HIER, "zeiten", `${reel.id}.json`), "utf8"));
  const clip = ohneClip ? null : clipsLesen()[reel.id] || null;
  const { start, ende } = szenenZeiten(reel, z);
  const n = reel.szenen.length;
  const f = (sek) => Math.max(0, Math.round(sek * FPS));
  const gesamt = f(ende);
  /* Bildfolge: Einstellungen des Clips ueber die Zeit bis zum Abbinder. */
  const dauerSzenen = reel.szenen.map((sz, i) => start[i + 1] - start[i]);
  const bilder = clip
    ? zuordnen(clip.grenzen, dauerSzenen).map((b) => ({ von: f(b.von), bis: f(b.bis), tempo: Math.round(b.tempo * 1000) / 1000, clip: { datei: clip.datei, von: b.clipVon, bis: b.clipBis } }))
    : [{ von: 0, bis: f(start[n]), tempo: 1, clip: null }];
  bilder[bilder.length - 1].bis = f(start[n]);
  const szenen = reel.szenen.map((sz, i) => ({ von: f(start[i]), bis: f(start[i + 1]) }));
  /* Untertitel: jeder Block bis zum Beginn des naechsten; der Abbinder
     zeigt seinen Text selbst. */
  const sichtbar = z.bloecke.filter((b) => b.szene < n);
  const bloecke = sichtbar.map((b, i) => ({
    von: i === 0 ? 0 : f(b.von - 0.08),
    bis: i + 1 < sichtbar.length ? f(sichtbar[i + 1].von - 0.08) : f(start[n]),
    t: b.t, szene: b.szene
  }));
  /* Zahlenkarte: ab dem Block, der die Zahl nennt (dem letzten der Szene), bis zum Szenenende. */
  const karten = reel.szenen.map((sz, i) => {
    if (!sz.zahl) return null;
    const eigene = bloecke.filter((b) => b.szene === i);
    const ab = eigene[eigene.length - 1];
    return { von: ab.von + 6, bis: szenen[i].bis, ...sz.zahl };
  }).filter(Boolean);
  const musikDatei = path.join(WURZEL, "public", "musik", `${MUSIK}.mp3`);
  return {
    id: reel.id, titel: reel.titel, gesamt,
    ton: `real/ton/${reel.id}.mp3`,
    musik: KONFIG.musik !== "aus" && fs.existsSync(musikDatei) ? { datei: `musik/${MUSIK}.mp3`, name: MUSIK, lautstaerke: Number(KONFIG.musikLautstaerke) || 0.13 } : null,
    bilder, szenen, bloecke, karten,
    abbinder: { von: f(start[n]), clip: clip ? { datei: clip.datei, zeit: Math.max(0, clip.grenzen[clip.grenzen.length - 1] - 0.4) } : null }
  };
}

async function komposition(echt) {
  const serveUrl = await buendeln();
  const inputProps = { echt };
  const k = await selectComposition({ serveUrl, id: "echtreel", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { serveUrl, inputProps, k };
}

export async function standbild(reel, frame, ziel, opt = {}) {
  const echt = eingabe(reel, opt);
  const { serveUrl, inputProps, k } = await komposition(echt);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, frame), output: ziel, inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return ziel;
}

export async function rendern(reel, opt = {}) {
  const echt = eingabe(reel, opt);
  const { serveUrl, inputProps, k } = await komposition(echt);
  fs.mkdirSync(AUSGABE, { recursive: true });
  const ziel = path.join(AUSGABE, `${reel.id}.mp4`), teil = ziel + ".teil.mp4";
  await renderMedia({ composition: k, serveUrl, codec: "h264", crf: 18, outputLocation: teil, inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  /* Lautheit wie im Funnel: zwei Durchgaenge, linear, Video nur kopiert. */
  const lufs = Number(KONFIG.lautheitZiel) || 0;
  if (lufs < 0) {
    try {
      execFileSync(ffmpegPfad(), ["-y", "-hide_banner", "-loglevel", "error", "-i", teil, "-c:v", "copy", "-af", lautheitFilter(teil, lufs), "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", ziel + ".laut.mp4"]);
      fs.rmSync(teil, { force: true });
      fs.renameSync(ziel + ".laut.mp4", teil);
    } catch (e) { fs.rmSync(ziel + ".laut.mp4", { force: true }); }
  }
  fs.renameSync(teil, ziel);
  /* Titelbild: der Hook nach einer Sekunde. */
  await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, 30), output: path.join(AUSGABE, `${reel.id}.jpg`), inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { ziel, sekunden: k.durationInFrames / FPS };
}

const alsSkript = process.argv[1] && /real[\\/]bauen\.js$/.test(process.argv[1]);
if (alsSkript) {
  const arg = process.argv.slice(2);
  const nur = arg.find((x) => !x.startsWith("--")), neu = arg.includes("--neu"), ohneClip = arg.includes("--ohne-clip");
  const bild = arg.find((x) => x.startsWith("--bild="));
  const clips = clipsLesen();
  try {
    for (const reel of REELS) {
      if (nur && reel.id !== nur) continue;
      if (!ohneClip && !clips[reel.id]) { console.log(`  ${reel.id.padEnd(16)} Clip fehlt – uebersprungen`); continue; }
      if (bild) {
        for (const fr of bild.slice(7).split(",").map(Number)) {
          const ziel = path.join(AUSGABE, "pruef", `${reel.id}-${String(fr).padStart(4, "0")}.jpg`);
          await standbild(reel, fr, ziel, { ohneClip });
          console.log(`  ${ziel}`);
        }
        continue;
      }
      const ziel = path.join(AUSGABE, `${reel.id}.mp4`);
      if (fs.existsSync(ziel) && !neu) { console.log(`  ${reel.id.padEnd(16)} vorhanden`); continue; }
      const t = Date.now();
      const e = await rendern(reel, { ohneClip });
      console.log(`  ${reel.id.padEnd(16)} ${e.sekunden.toFixed(1)} s, gerendert in ${Math.round((Date.now() - t) / 1000)} s`);
    }
  } catch (e) { console.error("\n" + (e.stack || e.message) + "\n"); process.exitCode = 1; }
}
