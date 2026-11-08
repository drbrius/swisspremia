/* =========================================================================
   Bildtext (Caption) zusammensetzen.

   Aufbau: Aufhaenger allein in der ersten Zeile (Instagram zeigt vor dem
   "… mehr" rund 125 Zeichen), direkt darunter der Aufruf je Funnel-Stufe
   (TOFU teilen/speichern, MOFU vergleichen, BOFU anfragen), dann die
   Absaetze, Quellenzeile, zuletzt Hashtags – oder die Hashtags als erster
   Kommentar. Der Aufruf stand bis 8.11.2026 hinter allen Absaetzen, im
   Mittel bei Zeichen 455: aufgeklappt sah ihn kaum jemand.
   ========================================================================= */
import { HASHTAGS, AUFRUF_DE, AUFRUF_EN, STUFEN } from "./themen.js";
import { KONFIG } from "./konfig.js";

const HOECHSTLAENGE = 2200;   // Instagram-Limit fuer Bildtexte

/* Reihenfolge: Basis, Kanton (regional am treffsichersten), dann Thema.
   Englische Beitraege ("en" in saetze) bekommen nur die englischen Tags. */
export function hashtagsSammeln(saetze = [], extra = []) {
  const max = Math.max(0, Number(KONFIG.hashtagsMax) || 5);
  const englisch = saetze.includes("en");
  const alle = englisch ? [...HASHTAGS.en] : [...HASHTAGS.basis, ...extra];
  for (const s of saetze) if (s !== "en") for (const h of HASHTAGS[s] || []) alle.push(h);
  if (englisch) alle.push(...extra);
  return [...new Set(alle)].slice(0, max);
}

export function bildtextBauen({ aufhaenger, absaetze = [], quelle = "", hashtags = [], sprache = "de", modus = "bildtext", stufe = null }) {
  const warnungen = [];
  if (aufhaenger.length > 125) warnungen.push(`Aufhaenger hat ${aufhaenger.length} Zeichen (Ziel: unter 125).`);
  const s = STUFEN[stufe];
  const aufruf = s ? (sprache === "en" ? s.ctaBildtextEn : s.ctaBildtext) : (sprache === "en" ? AUFRUF_EN : AUFRUF_DE);
  const teile = [aufhaenger, aufruf, ...absaetze];
  if (quelle) teile.push(quelle);
  const tags = hashtags.join(" ");
  if (modus === "bildtext" && tags) teile.push(tags);
  let text = teile.join("\n\n");
  if (text.length > HOECHSTLAENGE) { warnungen.push(`Bildtext mit ${text.length} Zeichen gekuerzt.`); text = text.slice(0, HOECHSTLAENGE - 1); }
  return { text, kommentar: modus === "kommentar" && tags ? tags : null, warnungen };
}
