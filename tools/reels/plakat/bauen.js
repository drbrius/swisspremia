/* =========================================================================
   Serie «Plakat» – Reels zusammenbauen und rendern.

   Skript, Stimme und Sprechzeiten: real/skripte.js, public/real/ton,
   real/zeiten. Regie: plakat/regie.js. Komposition "plakat"
   (src/Plakat.jsx). Ausgabe out/plakat/<id>.mp4 und <id>.jpg, Lautheit
   -14 LUFS. Alles ist gezeichnet – keine Fotos, kein KI-Video.

       node plakat/bauen.js                      alle, die noch fehlen
       node plakat/bauen.js franchise --neu      eines neu rendern
       node plakat/bauen.js franchise --bild=30,200   Standbilder nach out/plakat/pruef/
       node plakat/bauen.js --bild=szenen        je Szene ein Standbild plus Abbinder
       node plakat/bauen.js franchise --bild=wechsel  Bilder rund um den ersten Szenenwechsel

   Musik: PLAKAT_MUSIK (Standard eigen-warm, Datei in public/musik/).
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, BROWSER, BROWSER_TIMEOUT, lautheitFilter } from "../funnel/rendern.js";
import { ffmpegPfad } from "../funnel/musik-synth.js";
import { KONFIG } from "../funnel/konfig.js";
import { REELS } from "../real/skripte.js";
import { szenenZeiten } from "../real/clips.js";
import { kornSchreiben } from "../durchblick/fotos.js";
import { REGIE, ABBINDER } from "./regie.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const AUSGABE = path.join(WURZEL, "out", "plakat");
const FPS = 30;
const MUSIK = process.env.PLAKAT_MUSIK || "eigen-warm";

export const SERIE = REELS.filter((r) => REGIE[r.id]);

/* Unter einer hohen Karte bleibt wenig Platz fuer den Bildtext. */
function formatFuer(format, laenge) {
  if (format === "hoch" && laenge > 64) return "quadrat";
  if (format === "quadrat" && laenge > 100) return "quer";
  return format;
}

/* Eingabe fuer die Komposition. */
export function eingabe(reel) {
  const z = JSON.parse(fs.readFileSync(path.join(WURZEL, "real", "zeiten", `${reel.id}.json`), "utf8"));
  const regie = REGIE[reel.id];
  const n = reel.szenen.length;
  if (!regie || regie.length !== n) throw new Error(`${reel.id}: ${n} Szenen, aber ${regie ? regie.length : 0} Regie-Eintraege`);
  const { start, ende } = szenenZeiten(reel, z);
  const f = (sek) => Math.max(0, Math.round(sek * FPS));
  const teile = reel.szenen.map((sz, i) => {
    const von = f(start[i]), bis = f(start[i + 1]);
    const eigene = z.bloecke.filter((b) => b.szene === i);
    const bloecke = eigene.map((b, k) => ({ von: k === 0 ? 0 : f(b.von - 0.08) - von, bis: k + 1 < eigene.length ? f(eigene[k + 1].von - 0.08) - von : bis - von, t: b.t }));
    const laenge = Math.max(...bloecke.map((b) => b.t.replace(/\*\*/g, "").length));
    const teil = { von, bis, ...regie[i], bloecke };
    teil.format = formatFuer(teil.format, laenge + (sz.zahl ? 40 : 0));
    if (sz.zahl) teil.zahl = { wert: sz.zahl.wert, quelle: sz.zahl.quelle };
    else if (!teil.gross) throw new Error(`${reel.id}: Szene ${i + 1} hat weder Zahl noch Titel`);
    return teil;
  });
  teile.push({ von: f(start[n]), bis: f(ende), ...ABBINDER, abbinder: true, bloecke: [] });
  const musikDatei = path.join(WURZEL, "public", "musik", `${MUSIK}.mp3`);
  return {
    id: reel.id, titel: reel.titel, gesamt: f(ende),
    ton: `real/ton/${reel.id}.mp3`,
    musik: KONFIG.musik !== "aus" && fs.existsSync(musikDatei) ? { datei: `musik/${MUSIK}.mp3`, name: MUSIK, lautstaerke: Number(KONFIG.musikLautstaerke) || 0.13 } : null,
    teile
  };
}

async function komposition(reel) {
  const korn = path.join(WURZEL, "public", "plakat", "korn.png");
  if (!fs.existsSync(korn)) { fs.mkdirSync(path.dirname(korn), { recursive: true }); kornSchreiben(korn); }
  const serveUrl = await buendeln();
  const inputProps = { reel: eingabe(reel) };
  const k = await selectComposition({ serveUrl, id: "plakat", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { serveUrl, inputProps, k };
}

export async function standbilder(reel, frames, ordner) {
  const { serveUrl, inputProps, k } = await komposition(reel);
  fs.mkdirSync(ordner, { recursive: true });
  const ziele = [];
  for (const fr of frames) {
    const ziel = path.join(ordner, `${reel.id}-${String(fr).padStart(4, "0")}.jpg`);
    await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, Math.max(0, fr)), output: ziel, inputProps, imageFormat: "jpeg", jpegQuality: 88, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
    ziele.push(ziel);
  }
  return ziele;
}

export async function rendern(reel) {
  const { serveUrl, inputProps, k } = await komposition(reel);
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
  /* Titelbild: das erste Plakat, fertig aufgebaut. */
  await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, 45), output: path.join(AUSGABE, `${reel.id}.jpg`), inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { ziel, sekunden: k.durationInFrames / FPS };
}

const alsSkript = process.argv[1] && /plakat[\\/]bauen\.js$/.test(process.argv[1]);
if (alsSkript) {
  const arg = process.argv.slice(2);
  const nur = arg.find((x) => !x.startsWith("--")), neu = arg.includes("--neu");
  const bild = arg.find((x) => x.startsWith("--bild="));
  try {
    if (nur && !SERIE.some((r) => r.id === nur)) throw new Error(`Unbekannt: ${nur}. Es gibt: ${SERIE.map((r) => r.id).join(", ")}`);
    for (const reel of SERIE) {
      if (nur && reel.id !== nur) continue;
      if (bild) {
        const e = eingabe(reel), art = bild.slice(7), s = e.teile[1].von;
        const frames = art === "szenen" ? e.teile.map((t) => Math.round(t.von + Math.min(t.bis - t.von - 20, (t.bis - t.von) * 0.7)))
          : art === "wechsel" ? [0, 6, 14, 30, s - 14, s - 8, s - 3, s + 3, s + 9, s + 16, s + 26, s + 40]
            : art.split(",").map(Number);
        for (const z of await standbilder(reel, frames, path.join(AUSGABE, "pruef"))) console.log(`  ${z}`);
        continue;
      }
      const ziel = path.join(AUSGABE, `${reel.id}.mp4`);
      if (fs.existsSync(ziel) && !neu) { console.log(`  ${reel.id.padEnd(14)} vorhanden`); continue; }
      const t = Date.now();
      const e = await rendern(reel);
      console.log(`  ${reel.id.padEnd(14)} ${e.sekunden.toFixed(1)} s, gerendert in ${Math.round((Date.now() - t) / 1000)} s`);
    }
  } catch (e) { console.error("\n" + (e.stack || e.message) + "\n"); process.exitCode = 1; }
}
