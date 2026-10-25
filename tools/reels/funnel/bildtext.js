/* =========================================================================
   Bildtext (Caption) zusammensetzen.

   Aufbau: Aufhaenger allein in der ersten Zeile (Instagram zeigt vor dem
   "… mehr" rund 125 Zeichen), dann Absaetze, Aufruf mit "Link im Profil",
   Quellenzeile, zuletzt Hashtags – oder die Hashtags als erster Kommentar.
   ========================================================================= */
import { HASHTAGS, AUFRUF_DE, AUFRUF_EN } from "./themen.js";

const HOECHSTLAENGE = 2200;   // Instagram-Limit fuer Bildtexte

export function hashtagsSammeln(saetze = [], extra = []) {
  const alle = [...HASHTAGS.basis];
  for (const s of saetze) for (const h of HASHTAGS[s] || []) alle.push(h);
  for (const h of extra) alle.push(h);
  return [...new Set(alle)].slice(0, 12);
}

export function bildtextBauen({ aufhaenger, absaetze = [], quelle = "", hashtags = [], sprache = "de", modus = "bildtext" }) {
  const warnungen = [];
  if (aufhaenger.length > 125) warnungen.push(`Aufhaenger hat ${aufhaenger.length} Zeichen (Ziel: unter 125).`);
  const teile = [aufhaenger, ...absaetze, sprache === "en" ? AUFRUF_EN : AUFRUF_DE];
  if (quelle) teile.push(quelle);
  const tags = hashtags.join(" ");
  if (modus === "bildtext" && tags) teile.push(tags);
  let text = teile.join("\n\n");
  if (text.length > HOECHSTLAENGE) { warnungen.push(`Bildtext mit ${text.length} Zeichen gekuerzt.`); text = text.slice(0, HOECHSTLAENGE - 1); }
  return { text, kommentar: modus === "kommentar" && tags ? tags : null, warnungen };
}
