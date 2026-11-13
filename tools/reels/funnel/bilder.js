/* =========================================================================
   Fotos nach public/bilder/ laden – einmalig, dann aus dem Ordner.

       npm run bilder           fehlende laden
       npm run bilder -- --neu  alle neu laden

   Zwei Quellen, je nach Eintrag in src/bilder.js:
     "photo-…"              Unsplash – der Dienst schneidet selbst zu
     "pixabay:<id>"         Pixabay – Original (bis 1280 px) ueber die API
                            holen, hier zuschneiden. Mit "@x,y" laesst sich
                            der Ausschnitt verschieben (0 = links/oben,
                            1 = rechts/unten), z. B. "pixabay:123@0.5,0.2".

   Hochformat 1296 x 2304 (20 % mehr als das Video, Reserve fuer die
   Ken-Burns-Bewegung), JPEG. bilderSichern() liefert die Namen, die
   bereit liegen; fehlt eines (kein Netz), rendert der Funnel die Szene
   ohne Foto statt abzubrechen.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { WURZEL } from "./konfig.js";
import { ffmpegPfad } from "./musik-synth.js";
import { nachId, herunterladen } from "./pixabay.js";
import { BILDER, bildDatei, bildDateiKarussell } from "../src/bilder.js";

const ORDNER = path.join(WURZEL, "public");

/* Zwei Zuschnitte je Motiv: Hochformat 9:16 fuer die Reels (mit Reserve
   fuer die Ken-Burns-Bewegung) und 4:5 fuer die Karussell-Folien. */
const VARIANTEN = [[bildDatei, 1296, 2304], [bildDateiKarussell, 1080, 1350]];

const vorhanden = (datei) => fs.existsSync(datei) && fs.statSync(datei).size > 10_000;

async function unsplashLaden(id, breite, hoehe, ziel) {
  const r = await fetch(`https://images.unsplash.com/${id}?w=${breite}&h=${hoehe}&fit=crop&crop=entropy&q=80&fm=jpg`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  if (!/image\/jpe?g/.test(r.headers.get("content-type") || "")) throw new Error("kein JPEG: " + r.headers.get("content-type"));
  const daten = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(ziel + ".teil", daten);
  fs.renameSync(ziel + ".teil", ziel);
}

/* "pixabay:123@0.5,0.2" -> { id: "123", x: 0.5, y: 0.2 }. Ohne Angabe sitzt
   der Ausschnitt waagrecht in der Mitte und senkrecht etwas ueber der Mitte
   (Gesichter liegen meist im oberen Drittel). */
export function pixabayEintrag(wert) {
  const m = String(wert).match(/^pixabay:(\d+)(?:@([\d.]+),([\d.]+))?$/);
  if (!m) return null;
  const zwischen = (z, ersatz) => (z === undefined ? ersatz : Math.min(1, Math.max(0, Number(z))));
  return { id: m[1], x: zwischen(m[2], 0.5), y: zwischen(m[3], 0.38) };
}

/* Original einmal holen, dann beide Zuschnitte mit ffmpeg daraus schneiden. */
async function pixabayLaden(name, eintrag, fehlend) {
  const quelle = path.join(ORDNER, "bilder", `.quelle-${name}.jpg`);
  try {
    let treffer = await nachId(eintrag.id);
    try { await herunterladen(treffer.gross, quelle); }
    catch { treffer = await nachId(eintrag.id, { frisch: true }); await herunterladen(treffer.gross, quelle); }   // Bild-URL abgelaufen
    for (const [ziel, breite, hoehe] of fehlend) {
      const teil = ziel + ".teil.jpg";
      execFileSync(ffmpegPfad(), ["-y", "-hide_banner", "-loglevel", "error", "-i", quelle, "-frames:v", "1",
        "-vf", `scale=${breite}:${hoehe}:force_original_aspect_ratio=increase:flags=lanczos,crop=${breite}:${hoehe}:(iw-${breite})*${eintrag.x}:(ih-${hoehe})*${eintrag.y}`,
        "-q:v", "3", teil]);
      fs.renameSync(teil, ziel);
    }
  } finally {
    fs.rmSync(quelle, { force: true });
  }
}

/* Ein Motiv in beiden Zuschnitten bereitstellen. true, wenn das Reel-Format liegt. */
export async function bildSichern(name, id, { neu = false, melden = () => {} } = {}) {
  fs.mkdirSync(path.join(ORDNER, "bilder"), { recursive: true });
  const ziele = VARIANTEN.map(([dateiVon, breite, hoehe]) => [path.join(ORDNER, dateiVon(name)), breite, hoehe]);
  const fehlend = ziele.filter(([ziel]) => neu || !vorhanden(ziel));
  if (fehlend.length) {
    try {
      const pixabay = pixabayEintrag(id);
      if (pixabay) await pixabayLaden(name, pixabay, fehlend);
      else for (const [ziel, breite, hoehe] of fehlend) await unsplashLaden(id, breite, hoehe, ziel);
      for (const [ziel] of fehlend) melden(`Bild ${path.basename(ziel).padEnd(16)} ${(fs.statSync(ziel).size / 1024).toFixed(0)} KB`);
    } catch (e) {
      melden(`Bild ${name} nicht geladen: ${e.message}`);
    }
  }
  return vorhanden(ziele[0][0]);
}

export async function bilderSichern({ neu = false, melden = () => {} } = {}) {
  const bereit = new Set();
  for (const [name, id] of Object.entries(BILDER)) if (await bildSichern(name, id, { neu, melden })) bereit.add(name);
  return bereit;
}

/* Karussell: liegt der 4:5-Zuschnitt vor? Folien ohne Foto rendern, wenn nicht. */
export const karussellBildBereit = (name) => fs.existsSync(path.join(ORDNER, bildDateiKarussell(name)));
export const karussellBilderFiltern = (k) => ({
  ...k,
  folien: k.folien.map((f) => (f.bild && !karussellBildBereit(f.bild) ? { ...f, bild: undefined } : f))
});

/* Szenen, deren Foto fehlt, ohne Foto rendern. */
export const bilderFiltern = (reel, bereit) => ({
  ...reel,
  szenen: reel.szenen.map((s) => (s.bild && !bereit.has(s.bild) ? { ...s, bild: undefined } : s))
});

/* Nur als eigenes Skript ausfuehren – nicht, wenn z. B. test/standbilder.js
   diese Datei laedt (dessen Name endet ebenfalls auf "bilder.js"). */
if (process.argv[1] && path.basename(process.argv[1]) === "bilder.js" && path.basename(path.dirname(process.argv[1])) === "funnel") {
  const bereit = await bilderSichern({ neu: process.argv.includes("--neu"), melden: console.log });
  console.log(`\n${bereit.size} von ${Object.keys(BILDER).length} Bildern bereit in public/bilder/.`);
}
