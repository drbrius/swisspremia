/* =========================================================================
   Serie «Durchblick» – Fotos und Papierkorn bereitstellen.

       node durchblick/fotos.js          fehlende laden
       node durchblick/fotos.js --neu    alle neu laden

   Laedt die in durchblick/motive.js genannten Pixabay-Fotos (bis 1280 px)
   nach public/durchblick/<name>.jpg, schreibt quellen.json (Nummer, Seite,
   Urheber) und erzeugt korn.png – das Papierkorn, das ueber jedem Bild
   liegt. Braucht PIXABAY_API_KEY in der Umgebung.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { WURZEL } from "../funnel/konfig.js";
import { nachId, herunterladen } from "../funnel/pixabay.js";
import { FOTOS } from "./motive.js";

export const ORDNER = path.join(WURZEL, "public", "durchblick");

/* Graues Rauschen als PNG (8 Bit Graustufen), fest vorgegebene Zufallsfolge. */
export function kornSchreiben(ziel, breite = 540, hoehe = 960) {
  let z = 20261113;
  const zufall = () => ((z = (z * 1664525 + 1013904223) >>> 0) / 4294967296);
  const roh = Buffer.alloc((breite + 1) * hoehe);
  for (let y = 0; y < hoehe; y++) {
    roh[y * (breite + 1)] = 0;
    for (let x = 0; x < breite; x++) roh[y * (breite + 1) + 1 + x] = Math.round(128 + (zufall() + zufall() - 1) * 78);
  }
  const stueck = (typ, daten) => {
    const kopf = Buffer.concat([Buffer.from(typ, "ascii"), daten]);
    const laenge = Buffer.alloc(4); laenge.writeUInt32BE(daten.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(kopf) >>> 0);
    return Buffer.concat([laenge, kopf, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0); ihdr.writeUInt32BE(hoehe, 4); ihdr[8] = 8; ihdr[9] = 0;
  fs.writeFileSync(ziel, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), stueck("IHDR", ihdr), stueck("IDAT", zlib.deflateSync(roh, { level: 6 })), stueck("IEND", Buffer.alloc(0))]));
}

export async function fotosSichern({ neu = false, melden = () => {} } = {}) {
  fs.mkdirSync(ORDNER, { recursive: true });
  const quellenDatei = path.join(ORDNER, "quellen.json");
  const quellen = fs.existsSync(quellenDatei) ? JSON.parse(fs.readFileSync(quellenDatei, "utf8")) : {};
  const fehlen = [];
  for (const [name, id] of Object.entries(FOTOS)) {
    const ziel = path.join(ORDNER, `${name}.jpg`);
    if (!neu && fs.existsSync(ziel) && fs.statSync(ziel).size > 10_000 && quellen[name]?.id === id) continue;
    try {
      let t = await nachId(id);
      let bytes;
      try { bytes = await herunterladen(t.gross, ziel); }
      catch { t = await nachId(id, { frisch: true }); bytes = await herunterladen(t.gross, ziel); }
      quellen[name] = { id, seite: t.seite, autor: t.autor };
      melden(`Foto ${name.padEnd(13)} ${String(id).padEnd(9)} ${(bytes / 1024).toFixed(0)} KB  ${t.autor}`);
    } catch (e) {
      fehlen.push(name);
      melden(`Foto ${name} nicht geladen: ${e.message}`);
    }
  }
  fs.writeFileSync(quellenDatei, JSON.stringify(quellen, null, 2));
  const korn = path.join(ORDNER, "korn.png");
  if (neu || !fs.existsSync(korn)) { kornSchreiben(korn); melden("Papierkorn korn.png erzeugt"); }
  return fehlen;
}

if (process.argv[1] && /durchblick[\\/]fotos\.js$/.test(process.argv[1])) {
  const fehlen = await fotosSichern({ neu: process.argv.includes("--neu"), melden: console.log });
  console.log(fehlen.length ? `\nEs fehlen: ${fehlen.join(", ")}` : `\nAlle ${Object.keys(FOTOS).length} Fotos bereit in public/durchblick/.`);
  if (fehlen.length) process.exitCode = 1;
}
