/* =========================================================================
   Serie «Echt» – Bildtexte (Captions) fuer Instagram, je Reel einer.

       node real/bildtexte.js        schreibt out/real/bildtexte.md

   Aufbau wie im Funnel (funnel/bildtext.js): Aufhaenger, Aufruf je Stufe,
   Absaetze, Quelle, Hashtags. Dazu der Hinweis, dass Szenen und Stimme
   KI-generiert sind – Instagram verlangt bei realistisch wirkenden
   KI-Videos eine Kennzeichnung.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bildtextBauen, hashtagsSammeln } from "../funnel/bildtext.js";
import { KONFIG } from "../funnel/konfig.js";
import { REELS } from "./skripte.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const KI_HINWEIS = "Szenen und Stimme sind KI-generiert.";

export function bildtext(reel) {
  const b = reel.bildtext;
  const quelle = [b.quelle || "Keine Beratung.", KI_HINWEIS].join(" ");
  return bildtextBauen({ aufhaenger: b.aufhaenger, absaetze: b.absaetze, quelle, hashtags: hashtagsSammeln(b.hashtags || []), sprache: "de", modus: KONFIG.hashtags, stufe: reel.stufe });
}

const alsSkript = process.argv[1] && /real[\\/]bildtexte\.js$/.test(process.argv[1]);
if (alsSkript) {
  const teile = ["# Serie «Echt» – Bildtexte\n", "Je Reel der fertige Text zum Kopieren. Videos: `out/real/<id>.mp4`, Titelbilder: `out/real/<id>.jpg`.\n"];
  for (const [i, reel] of REELS.entries()) {
    const { text, warnungen } = bildtext(reel);
    teile.push(`## ${i + 1} · ${reel.titel} (\`${reel.id}\`, ${reel.stufe.toUpperCase()})\n`);
    teile.push("```\n" + text + "\n```\n");
    if (warnungen.length) teile.push("> " + warnungen.join(" ") + "\n");
  }
  const ziel = path.join(HIER, "..", "out", "real", "bildtexte.md");
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, teile.join("\n"));
  console.log(`${REELS.length} Bildtexte -> out/real/bildtexte.md`);
}
