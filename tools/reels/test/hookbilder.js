/* =========================================================================
   Hookbilder: das erste Bild (Frame 0) und das Bild nach einer Sekunde
   jedes Funnel-Formats – so sieht der Reel im Feed aus, bevor jemand
   weiterwischt. Zur Pruefung des Hook-Schnellstarts (Bausteine.jsx useHook).

       node test/hookbilder.js <zielordner> [region=ZH1] [kanton=BE]
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, BROWSER } from "../funnel/rendern.js";
import { bilderSichern } from "../funnel/bilder.js";
import { REGION } from "../funnel/daten.js";
import { franchise, modelle, alter, unfall, flexibel, regionen, kantone, geschichte, mythos, countdown } from "../funnel/formate.js";

const ziel = path.resolve(process.argv[2] || "hookbilder");
const region = REGION[(process.argv[3] || "ZH1").toUpperCase()] || REGION.ZH1;
const kanton = (process.argv[4] || "BE").toUpperCase();
fs.mkdirSync(ziel, { recursive: true });

const pakete = [
  alter(region), franchise(region), modelle(region), geschichte(region), unfall(region), flexibel(region),
  regionen(kanton), kantone(region.kanton), mythos(0), countdown(new Date())
].filter(Boolean);

await bilderSichern();
const serveUrl = await buendeln({ melden: () => {} });
const bilder = [];
for (const p of pakete) {
  const inputProps = { reel: { ...p.reel, tonVorhanden: [] }, dauern: null };
  const komposition = await selectComposition({ serveUrl, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "error" });
  for (const [frame, wann] of [[0, "0 s"], [30, "1 s"]]) {
    const datei = `${p.format}-${frame}.png`;
    await renderStill({ composition: komposition, serveUrl, frame, output: path.join(ziel, datei), inputProps, browserExecutable: BROWSER, logLevel: "error", imageFormat: "png", scale: 0.3 });
    bilder.push({ datei, titel: `${p.titel} · ${wann}` });
  }
  process.stdout.write(".");
}
fs.writeFileSync(path.join(ziel, "index.html"), `<!doctype html><meta charset="utf-8"><title>Hookbilder</title>
<style>body{margin:0;background:#ddd;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:6px;padding:6px;width:1060px}figure{margin:0;width:162px}img{width:162px;display:block}figcaption{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
${bilder.map((b) => `<figure><img src="${b.datei}"><figcaption>${b.titel}</figcaption></figure>`).join("\n")}`);
console.log(`\n${bilder.length} Hookbilder in ${ziel}`);
