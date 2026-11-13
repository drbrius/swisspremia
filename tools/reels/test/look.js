/* =========================================================================
   Look der Tagesreels pruefen: Standbilder je Szene oder ein ganzes Video,
   ohne den Tagesplan zu veraendern. (test/standbilder.js macht den
   Kontaktbogen der Formate; dieses Skript nimmt Reels aus einem Plan oder
   die Stamm-Reels und kennt den Look.)

       node test/look.js 2026-11-14            alle Reels dieses Tagesplans
       node test/look.js 2026-11-14 1,5,13     nur diese Nummern
       node test/look.js stamm                 die Stamm-Reels (src/reels.js)
       node test/look.js stamm umzug,sparglas   einzelne davon
       … --stil=klassisch                             im alten Look (Petrol und Gold)
       … --anteile=0.1,0.5,0.9                        Stellen je Szene (Standard 0.35,0.9)
       … --video                                      statt Standbildern das ganze Reel als MP4 (mit Ton, soweit Tonspuren da sind)

   Ausgabe: out/pruef/<reel>-<nr der Szene>-<art>-<stelle>.jpg
   Fehlt die Tonspur, gilt je Szene die Laenge aus dem Skript ("dauer").
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { buendeln, reelRendern, BROWSER, BROWSER_TIMEOUT } from "../funnel/rendern.js";
import { WURZEL, PLAN_ORDNER, KONFIG } from "../funnel/konfig.js";
import { szenenStarts } from "../src/takt.js";
import { REELS } from "../src/reels.js";

const arg = process.argv.slice(2);
const schalter = (name) => (arg.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || null;
const werte = arg.filter((a) => !a.startsWith("--"));
const stil = schalter("stil") || KONFIG.stil || "tisch";
const anteile = (schalter("anteile") || "0.35,0.9").split(",").map(Number);
const ziel = path.join(WURZEL, "out", "pruef");

let reels = [];
if (werte[0] === "stamm") reels = REELS.filter((r) => !werte[1] || werte[1].split(",").includes(r.id));
else if (/^\d{4}-\d{2}-\d{2}$/.test(werte[0] || "")) {
  const plan = JSON.parse(fs.readFileSync(path.join(PLAN_ORDNER, `${werte[0]}.json`), "utf8"));
  const nur = werte[1] ? werte[1].split(",").map(Number) : null;
  reels = plan.reels.filter((e) => e.reel && (!nur || nur.includes(e.nr))).map((e) => e.reel);
}
if (!reels.length) { console.error("Aufruf: node test/look.js <JJJJ-MM-TT> [nr,nr] | stamm [id]   [--stil=klassisch] [--anteile=0.35,0.9]"); process.exit(1); }

fs.mkdirSync(ziel, { recursive: true });
const serveUrl = await buendeln({ melden: console.log });
for (const roh of reels) {
  const reel = { ...roh, stil };
  if (arg.includes("--video")) {
    const mp4 = path.join(ziel, reel.id + ".mp4");
    const sek = await reelRendern(reel, mp4, { melden: console.log });
    console.log("  " + path.relative(WURZEL, mp4).split(path.sep).join("/") + "  " + sek.toFixed(1) + " s");
    continue;
  }
  const inputProps = { reel, dauern: null };
  const k = await selectComposition({ serveUrl, id: "tagesreel", inputProps, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
  const dauern = k.props.dauern || [];
  const starts = szenenStarts(dauern);
  for (let i = 0; i < reel.szenen.length; i++) {
    for (const a of anteile) {
      const frame = Math.min(k.durationInFrames - 1, starts[i] + Math.floor(dauern[i].frames * a));
      const datei = path.join(ziel, `${reel.id}-${i + 1}-${reel.szenen[i].art}-${String(Math.round(a * 100)).padStart(2, "0")}.jpg`);
      await renderStill({ composition: k, serveUrl, frame, output: datei, inputProps, imageFormat: "jpeg", jpegQuality: 86, browserExecutable: BROWSER, logLevel: "error", timeoutInMilliseconds: BROWSER_TIMEOUT });
      console.log("  " + path.relative(WURZEL, datei).split(path.sep).join("/"));
    }
  }
}
