/* =========================================================================
   Standbilder aller Szenen der Funnel-Formate – zur Layoutpruefung, bevor
   etwas gerendert oder gepostet wird.

       node test/standbilder.js <zielordner> [region=ZH1] [kanton=BE]

   Schreibt je Szene ein PNG (verkleinert) und eine index.html als
   Kontaktbogen in den Zielordner.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, BROWSER } from "../funnel/rendern.js";
import { REGION } from "../funnel/daten.js";
import { franchise, modelle, alter, unfall, flexibel, regionen, kantone, mythos, countdown } from "../funnel/formate.js";

const ziel = path.resolve(process.argv[2] || "standbilder");
const region = REGION[(process.argv[3] || "ZH1").toUpperCase()] || REGION.ZH1;
const kanton = (process.argv[4] || "BE").toUpperCase();
fs.mkdirSync(ziel, { recursive: true });

const pakete = [
  franchise(region), modelle(region), alter(region), unfall(region), flexibel(region),
  regionen(kanton), kantone(region.kanton), mythos(0), countdown(new Date())
].filter(Boolean);

const serveUrl = await buendeln({ melden: console.log });
const bilder = [];
for (const p of pakete) {
  const inputProps = { reel: { ...p.reel, tonVorhanden: [] }, dauern: null };
  const komposition = await selectComposition({ serveUrl, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "error" });
  const dauern = komposition.props.dauern;
  let start = 0;
  for (let i = 0; i < p.reel.szenen.length; i++) {
    const s = p.reel.szenen[i];
    const frame = start + Math.floor(dauern[i].frames * 0.75);
    const datei = `${p.format}-${i + 1}-${s.art}.png`;
    await renderStill({ composition: komposition, serveUrl, frame, output: path.join(ziel, datei), inputProps, browserExecutable: BROWSER, logLevel: "error", imageFormat: "png", scale: 0.3 });
    bilder.push({ datei, titel: `${p.titel} · ${i + 1} ${s.art}` });
    start += dauern[i].frames;
    process.stdout.write(".");
  }
  console.log(" " + p.titel);
}
fs.writeFileSync(path.join(ziel, "index.html"), `<!doctype html><meta charset="utf-8"><title>Standbilder</title>
<style>body{margin:0;background:#ddd;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:6px;padding:6px}figure{margin:0;width:162px}img{width:162px;display:block}figcaption{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
${bilder.map((b) => `<figure><img src="${b.datei}"><figcaption>${b.titel}</figcaption></figure>`).join("\n")}`);
console.log(`\n${bilder.length} Standbilder in ${ziel}`);
