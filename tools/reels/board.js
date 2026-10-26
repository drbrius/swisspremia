/* =========================================================================
   Board-Abgleich – laeuft alle 30 Minuten (Aufgabenplanung) und legt den
   Stand fuer das Performance-Board in den Blob-Speicher:

       node board.js                   Stand bauen, verschluesseln, hochladen
       node board.js --trocken         nur lokal: plan/board-stand.json und
                                       plan/board-stand.enc.json
       node board.js --ausfuehrlich    Zwischenschritte melden
       node board.js schluessel        BOARD_SCHLUESSEL einmalig erzeugen und
                                       als Nutzer-Umgebungsvariable speichern

   Liest nur – Instagram wird nichts veroeffentlicht. Siehe funnel/board.js
   und tools/board/README.md.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { PLAN_ORDNER } from "./funnel/konfig.js";
import { protokoll, argumente } from "./funnel/zustand.js";
import { umgebungSetzen } from "./funnel/instagram.js";
import { standBauen, standSpeichern, verschluesseln, standHochladen, schluesselErzeugen, STAND_DATEI } from "./funnel/board.js";

const arg = argumente();
const laut = Boolean(arg.ausfuehrlich);

if (arg._[0] === "schluessel") {
  if (process.env.BOARD_SCHLUESSEL && !arg.neu) {
    console.log("BOARD_SCHLUESSEL ist schon gesetzt. Neu erzeugen nur mit --neu (danach auch in Vercel ersetzen).");
  } else {
    console.log(umgebungSetzen("BOARD_SCHLUESSEL", schluesselErzeugen()).hinweis);
    console.log("Derselbe Wert gehoert ins Vercel-Projekt des Boards (siehe tools/board/README.md).");
  }
  process.exit(0);
}

const start = Date.now();
const stand = await standBauen({ melden: (z) => laut && console.log("  " + z) });
standSpeichern(stand);
const text = verschluesseln(stand, process.env.BOARD_SCHLUESSEL);
const umfang = `${stand.medien.length} Beitraege, ${stand.plan.length} Reels im Plan, ${Math.round(text.length / 1024)} KB`;
/* Hinweise stehen im Board selbst; ins Protokoll kaemen sie alle 30 Minuten. */
if (laut) for (const h of stand.hinweise) console.log("Hinweis: " + h);

if (arg.trocken) {
  fs.writeFileSync(path.join(PLAN_ORDNER, "board-stand.enc.json"), text);
  console.log(`Board-Stand lokal geschrieben (${umfang}): ${path.relative(process.cwd(), STAND_DATEI)}`);
} else {
  try {
    const url = await standHochladen(text);
    if (laut) console.log(`Hochgeladen: ${url}`);
    console.log(`Board-Stand hochgeladen (${umfang}, ${((Date.now() - start) / 1000).toFixed(1)} s).`);
  } catch (e) {
    protokoll("FEHLER Board-Stand nicht hochgeladen: " + e.message);
    process.exitCode = 1;
  }
}
