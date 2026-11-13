/* =========================================================================
   Serie «Küchentisch» – Ton erzeugen, Reels zusammenbauen und rendern.

   Skript und Regie: tisch/skripte.js. Stimme und Sprechzeiten wie bei den
   anderen Serien ueber real/stimme.js (public/real/ton, real/zeiten).
   Komposition "tisch" (src/Tisch.jsx). Ausgabe out/tisch/<id>.mp4 und
   <id>.jpg, Lautheit -14 LUFS. Alles ist gezeichnet – keine Fotos, kein
   KI-Video.

       node tisch/bauen.js ton                  Tonspuren erzeugen (ElevenLabs; aus PowerShell mit Nutzer-Umgebung)
       node tisch/bauen.js                      alle Videos, die noch fehlen
       node tisch/bauen.js belege --neu         eines neu rendern
       node tisch/bauen.js --bild=szenen        je Szene zwei Standbilder nach out/tisch/pruef/
       node tisch/bauen.js belege --bild=30,200 bestimmte Bilder

   Musik: TISCH_MUSIK (Standard eigen-ruhig, Datei in public/musik/).
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, BROWSER, BROWSER_TIMEOUT, lautheitFilter } from "../funnel/rendern.js";
import { ffmpegPfad } from "../funnel/musik-synth.js";
import { KONFIG } from "../funnel/konfig.js";
import { szenenZeiten } from "../real/clips.js";
import { tonErzeugen } from "../real/stimme.js";
import { bloecke as sprechBloecke } from "../real/skripte.js";
import { kornSchreiben } from "../durchblick/fotos.js";
import { REELS } from "./skripte.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const AUSGABE = path.join(WURZEL, "out", "tisch");
const FPS = 30;
const MUSIK = process.env.TISCH_MUSIK || "eigen-ruhig";
export const SERIE = REELS;

/* Eingabe fuer die Komposition: je Szene Bildangaben, Grenzen und Untertitel-Bloecke in Frames. */
/* Fehlt die Tonspur (z. B. ElevenLabs-Guthaben leer), entsteht eine Vorschau
   ohne Stimme: Sprechzeiten geschaetzt aus der Textlaenge (rund 14 Zeichen je
   Sekunde, wie Marcus bei Tempo 1.1). Sie heisst <id>-vorschau.mp4 und ist
   nicht zum Veroeffentlichen gedacht. */
export const hatTon = (reel) => fs.existsSync(path.join(WURZEL, "real", "zeiten", `${reel.id}.json`)) && fs.existsSync(path.join(WURZEL, "public", "real", "ton", `${reel.id}.mp3`));
function geschaetzt(reel) {
  let pos = 0;
  const liste = sprechBloecke(reel).map((b) => { const von = pos, bis = von + Math.max(1.3, b.s.length / 14); pos = bis + 0.3; return { szene: b.szene, t: b.t, von, bis }; });
  return { gesamt: pos - 0.3, bloecke: liste };
}

export function eingabe(reel) {
  const ton = hatTon(reel);
  const z = ton ? JSON.parse(fs.readFileSync(path.join(WURZEL, "real", "zeiten", `${reel.id}.json`), "utf8")) : geschaetzt(reel);
  const n = reel.szenen.length;
  const { start, ende } = szenenZeiten(reel, z);
  const f = (sek) => Math.max(0, Math.round(sek * FPS));
  const teile = reel.szenen.map((sz, i) => {
    const von = f(start[i]), bis = f(start[i + 1]);
    const eigene = z.bloecke.filter((b) => b.szene === i);
    const bloecke = eigene.map((b, k) => ({ von: k === 0 ? 0 : f(b.von - 0.08) - von, bis: k + 1 < eigene.length ? f(eigene[k + 1].von - 0.08) - von : bis - von, t: b.t }));
    return { von, bis, ...sz.bild, bloecke };
  });
  teile.push({ von: f(start[n]), bis: f(ende), art: "schluss", hinweis: reel.schluss || "Stimme KI-generiert · keine Beratung", bloecke: [] });
  const musikDatei = path.join(WURZEL, "public", "musik", `${MUSIK}.mp3`);
  return {
    id: reel.id, titel: reel.titel, gesamt: f(ende),
    ton: ton ? `real/ton/${reel.id}.mp3` : null, vorschau: !ton,
    musik: KONFIG.musik !== "aus" && fs.existsSync(musikDatei) ? { datei: `musik/${MUSIK}.mp3`, name: MUSIK, lautstaerke: Number(KONFIG.musikLautstaerke) || 0.13 } : null,
    teile
  };
}

async function komposition(reel) {
  const korn = path.join(WURZEL, "public", "plakat", "korn.png");
  if (!fs.existsSync(korn)) { fs.mkdirSync(path.dirname(korn), { recursive: true }); kornSchreiben(korn); }
  const serveUrl = await buendeln();
  const inputProps = { reel: eingabe(reel) };
  const k = await selectComposition({ serveUrl, id: "tisch", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
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
  const name = hatTon(reel) ? reel.id : `${reel.id}-vorschau`;
  const ziel = path.join(AUSGABE, `${name}.mp4`), teil = ziel + ".teil.mp4";
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
  /* Titelbild: die erste Szene mit stehendem Untertitel. */
  await renderStill({ composition: k, serveUrl, frame: Math.min(k.durationInFrames - 1, 40), output: path.join(AUSGABE, `${name}.jpg`), inputProps, imageFormat: "jpeg", jpegQuality: 90, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  return { ziel, sekunden: k.durationInFrames / FPS, vorschau: !hatTon(reel) };
}

const alsSkript = process.argv[1] && /tisch[\\/]bauen\.js$/.test(process.argv[1]);
if (alsSkript) {
  const arg = process.argv.slice(2);
  const ton = arg[0] === "ton";
  const nur = arg.find((x, i) => !x.startsWith("--") && !(ton && i === 0)), neu = arg.includes("--neu");
  const bild = arg.find((x) => x.startsWith("--bild="));
  try {
    if (nur && !SERIE.some((r) => r.id === nur)) throw new Error(`Unbekannt: ${nur}. Es gibt: ${SERIE.map((r) => r.id).join(", ")}`);
    for (const reel of SERIE) {
      if (nur && reel.id !== nur) continue;
      if (ton) { await tonErzeugen(reel, { neu }); continue; }
      if (bild) {
        const e = eingabe(reel), art = bild.slice(7);
        const frames = art === "szenen" ? e.teile.flatMap((t) => [Math.round(t.von + (t.bis - t.von) * 0.3), Math.round(t.von + (t.bis - t.von) * 0.85)]) : art.split(",").map(Number);
        for (const z of await standbilder(reel, frames, path.join(AUSGABE, "pruef"))) console.log(`  ${z}`);
        continue;
      }
      const ziel = path.join(AUSGABE, `${hatTon(reel) ? reel.id : reel.id + "-vorschau"}.mp4`);
      if (fs.existsSync(ziel) && !neu) { console.log(`  ${reel.id.padEnd(14)} vorhanden`); continue; }
      const t = Date.now();
      const e = await rendern(reel);
      console.log(`  ${reel.id.padEnd(14)} ${e.sekunden.toFixed(1)} s, gerendert in ${Math.round((Date.now() - t) / 1000)} s${e.vorschau ? " – VORSCHAU ohne Stimme (Tonspur fehlt)" : ""}`);
    }
  } catch (e) { console.error("\n" + (e.stack || e.message) + "\n"); process.exitCode = 1; }
}
