/* =========================================================================
   Karussell-Probe: alle vier Formate einmal rendern (JPEG in Originalgroesse)
   und als Kontaktbogen ablegen – zur Sichtpruefung, bevor etwas gepostet wird.

       node test/karussell-probe.js <zielordner> [fakt=0] [check=0] [region=ZH1] [kanton=BE]
       npm run karussell                      (schreibt nach out/karussell-probe)

   Schreibt je Karussell einen Ordner mit 01.jpg, 02.jpg ... und index.html.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { karussellRendern } from "../funnel/rendern.js";
import { bilderSichern, karussellBilderFiltern } from "../funnel/bilder.js";
import { REGION } from "../funnel/daten.js";
import { fakt, check, zahl, steckbrief, FAKTEN } from "../funnel/karussell.js";
import { datumKurz } from "../funnel/sprache.js";

const ziel = path.resolve(process.argv[2] || "out/karussell-probe");
const wahl = Object.fromEntries(process.argv.slice(3).map((t) => t.split("=")));
const datum = datumKurz();
const region = REGION[(wahl.region || "ZH1").toUpperCase()] || REGION.ZH1;
const kanton = (wahl.kanton || "BE").toUpperCase();
fs.mkdirSync(ziel, { recursive: true });

const pakete = [
  fakt(Number(wahl.fakt || 0), datum),
  check(Number(wahl.check || 0), datum),
  zahl(region, datum, wahl.variante !== undefined ? Number(wahl.variante) : null),
  steckbrief(kanton, datum)
].filter(Boolean);
if (wahl.nur) { const n = wahl.nur.split(","); pakete.splice(0, pakete.length, ...pakete.filter((p) => n.includes(p.format))); }

await bilderSichern({ melden: console.log });
const bogen = [];
for (const p of pakete) {
  const k = karussellBilderFiltern(p.karussell);
  process.stdout.write(`${p.titel} (${k.folien.length} Folien) `);
  const dateien = await karussellRendern(k, path.join(ziel, k.id), { melden: (z) => console.log("  " + z) });
  console.log("fertig");
  bogen.push({ titel: p.titel, dateien: dateien.map((d) => path.relative(ziel, d).split(path.sep).join("/")), bildtext: p.bildtext, alt: p.altTexte });
}
fs.writeFileSync(path.join(ziel, "index.html"), `<!doctype html><meta charset="utf-8"><title>Karussell-Probe</title>
<style>body{margin:0;background:#ddd;font:13px/1.4 sans-serif;padding:12px}h2{margin:18px 0 6px}.reihe{display:flex;gap:8px;overflow-x:auto}img{width:216px;display:block;box-shadow:0 2px 6px rgba(0,0,0,.3)}pre{white-space:pre-wrap;background:#fff;padding:8px;font:12px/1.4 sans-serif}</style>
${bogen.map((b) => `<h2>${b.titel}</h2><div class="reihe">${b.dateien.map((d) => `<img src="${d}">`).join("")}</div><pre>${b.bildtext.aufhaenger}\n\n${b.bildtext.absaetze.join("\n\n")}\n\n${b.bildtext.quelle}\n${b.bildtext.hashtags.join(" ")}</pre>`).join("\n")}`);
console.log(`\n${bogen.length} Karussells in ${ziel} (index.html)`);
console.log(`FAKTEN: ${FAKTEN.length}`);
