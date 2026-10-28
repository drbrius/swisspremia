/* =========================================================================
   Unsplash-Fotos nach public/bilder/ laden – einmalig, dann aus dem Ordner.

       npm run bilder           fehlende laden
       npm run bilder -- --neu  alle neu laden

   Hochformat 1296 x 2304 (20 % mehr als das Video, Reserve fuer die
   Ken-Burns-Bewegung), JPEG. bilderSichern() liefert die Namen, die
   bereit liegen; fehlt eines (kein Netz), rendert der Funnel die Szene
   ohne Foto statt abzubrechen.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { WURZEL } from "./konfig.js";
import { BILDER, bildDatei, bildDateiKarussell } from "../src/bilder.js";

const ORDNER = path.join(WURZEL, "public");

/* Zwei Zuschnitte je Motiv: Hochformat 9:16 fuer die Reels (mit Reserve
   fuer die Ken-Burns-Bewegung) und 4:5 fuer die Karussell-Folien. */
const VARIANTEN = [[bildDatei, "w=1296&h=2304"], [bildDateiKarussell, "w=1080&h=1350"]];

export async function bilderSichern({ neu = false, melden = () => {} } = {}) {
  const bereit = new Set();
  fs.mkdirSync(path.join(ORDNER, "bilder"), { recursive: true });
  for (const [name, id] of Object.entries(BILDER)) {
    for (const [dateiVon, masse] of VARIANTEN) {
      const ziel = path.join(ORDNER, dateiVon(name));
      const fuerReel = dateiVon === bildDatei;
      if (!neu && fs.existsSync(ziel) && fs.statSync(ziel).size > 10_000) { if (fuerReel) bereit.add(name); continue; }
      try {
        const r = await fetch(`https://images.unsplash.com/${id}?${masse}&fit=crop&crop=entropy&q=80&fm=jpg`);
        if (!r.ok) throw new Error("HTTP " + r.status);
        if (!/image\/jpe?g/.test(r.headers.get("content-type") || "")) throw new Error("kein JPEG: " + r.headers.get("content-type"));
        const daten = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(ziel + ".teil", daten);
        fs.renameSync(ziel + ".teil", ziel);
        if (fuerReel) bereit.add(name);
        melden(`Bild ${path.basename(ziel).padEnd(16)} ${(daten.length / 1024).toFixed(0)} KB`);
      } catch (e) {
        melden(`Bild ${path.basename(ziel)} nicht geladen: ${e.message}`);
      }
    }
  }
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
if (process.argv[1] && path.basename(process.argv[1]) === "bilder.js") {
  const bereit = await bilderSichern({ neu: process.argv.includes("--neu"), melden: console.log });
  console.log(`\n${bereit.size} von ${Object.keys(BILDER).length} Bildern bereit in public/bilder/.`);
}
