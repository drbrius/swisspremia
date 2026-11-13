/* =========================================================================
   Serie «Durchblick» – Reels zusammenbauen und rendern.

   Skript, Stimme und Sprechzeiten stammen aus der Serie «Echt»
   (real/skripte.js, public/real/ton, real/zeiten); die Bildregie steht in
   durchblick/motive.js. Daraus entsteht die Eingabe fuer die Komposition
   "durchblick" (src/Durchblick.jsx); gerendert wird nach
   out/durchblick/<id>.mp4 samt Titelbild <id>.jpg, die Lautheit danach
   auf -14 LUFS angeglichen. Kein KI-Video, keine neuen Sprachaufnahmen.

       node durchblick/bauen.js                      alle, die noch fehlen
       node durchblick/bauen.js franchise --neu      eines neu rendern
       node durchblick/bauen.js franchise --bild=30,200   Standbilder nach out/durchblick/pruef/
       node durchblick/bauen.js --bild=szenen        je Szene ein Standbild (Mitte) plus Abbinder

   Musik: DURCHBLICK_MUSIK (Standard eigen-warm, Datei in public/musik/).
   Fotos: durchblick/fotos.js (braucht PIXABAY_API_KEY, nur beim ersten Mal).
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
import { MOTIVE, ABBINDER_FOTO, FOTOS } from "./motive.js";
import { fotosSichern, ORDNER as FOTO_ORDNER } from "./fotos.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const AUSGABE = path.join(WURZEL, "out", "durchblick");
const FPS = 30;
const MUSIK = process.env.DURCHBLICK_MUSIK || "eigen-warm";

export const SERIE = REELS.filter((r) => MOTIVE[r.id]);

/* Eingabe fuer die Komposition. */
export function eingabe(reel) {
  const z = JSON.parse(fs.readFileSync(path.join(WURZEL, "real", "zeiten", `${reel.id}.json`), "utf8"));
  const motive = MOTIVE[reel.id];
  const n = reel.szenen.length;
  if (!motive || motive.length !== n) throw new Error(`${reel.id}: ${n} Szenen, aber ${motive ? motive.length : 0} Motive`);
  const { start, ende } = szenenZeiten(reel, z);
  const f = (sek) => Math.max(0, Math.round(sek * FPS));
  const szenen = reel.szenen.map((sz, i) => {
    const von = f(start[i]), bis = f(start[i + 1]);
    const eigene = z.bloecke.filter((b) => b.szene === i);
    const bloecke = eigene.map((b, k) => ({
      von: k === 0 ? 0 : f(b.von - 0.08) - von,
      bis: k + 1 < eigene.length ? f(eigene[k + 1].von - 0.08) - von : bis - von + 12,
      t: b.t
    }));
    const motiv = { ...motive[i] };
    if (motiv.art === "zahl") {
      if (!sz.zahl) throw new Error(`${reel.id}: Szene ${i + 1} hat keine Zahl im Skript`);
      Object.assign(motiv, sz.zahl, { ab: Math.max(8, Math.round((bis - von) * 0.3)) });
    }
    if (motiv.foto && !FOTOS[motiv.foto]) throw new Error(`${reel.id}: Foto «${motiv.foto}» ist in motive.js nicht eingetragen`);
    return { von, bis, motiv, bloecke };
  });
  const musikDatei = path.join(WURZEL, "public", "musik", `${MUSIK}.mp3`);
  return {
    id: reel.id, titel: reel.titel, gesamt: f(ende),
    ton: `real/ton/${reel.id}.mp3`,
    musik: KONFIG.musik !== "aus" && fs.existsSync(musikDatei) ? { datei: `musik/${MUSIK}.mp3`, name: MUSIK, lautstaerke: Number(KONFIG.musikLautstaerke) || 0.13 } : null,
    szenen,
    abbinder: { von: f(start[n]), foto: ABBINDER_FOTO }
  };
}

let fotosGeprueft = false;
async function komposition(reel) {
  if (!fotosGeprueft) {
    const fehlt = Object.keys(FOTOS).filter((name) => !fs.existsSync(path.join(FOTO_ORDNER, `${name}.jpg`)));
    if (fehlt.length || !fs.existsSync(path.join(FOTO_ORDNER, "korn.png"))) {
      const offen = await fotosSichern({ melden: (m) => console.log("  " + m) });
      if (offen.length) throw new Error(`Fotos fehlen: ${offen.join(", ")} (node durchblick/fotos.js, braucht PIXABAY_API_KEY)`);
    }
    fotosGeprueft = true;
  }
  const serveUrl = await buendeln();
  const inputProps = { reel: eingabe(reel) };
  const k = await selectComposition({ serveUrl, id: "durchblick", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
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
  /* Titelbild: der Hook nach einer Sekunde. */
  await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, 30), output: path.join(AUSGABE, `${reel.id}.jpg`), inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { ziel, sekunden: k.durationInFrames / FPS };
}

const alsSkript = process.argv[1] && /durchblick[\\/]bauen\.js$/.test(process.argv[1]);
if (alsSkript) {
  const arg = process.argv.slice(2);
  const nur = arg.find((x) => !x.startsWith("--")), neu = arg.includes("--neu");
  const bild = arg.find((x) => x.startsWith("--bild="));
  try {
    if (nur && !SERIE.some((r) => r.id === nur)) throw new Error(`Unbekannt: ${nur}. Es gibt: ${SERIE.map((r) => r.id).join(", ")}`);
    for (const reel of SERIE) {
      if (nur && reel.id !== nur) continue;
      if (bild) {
        const e = eingabe(reel);
        const frames = bild.slice(7) === "szenen"
          ? [...e.szenen.map((s) => Math.round(s.von + (s.bis - s.von) * 0.72)), Math.min(e.gesamt - 1, e.abbinder.von + 60)]
          : bild.slice(7).split(",").map(Number);
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
