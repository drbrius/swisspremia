/* =========================================================================
   Serien-Videos im Tagesplan.

   Eine Serie (z. B. «Plakat», plakat/bauen.js) liegt fertig gerendert in
   out/<serie>/<id>.mp4. Ist in funnel.json eine Serie eingestellt –

       "serie": { "name": "plakat", "proTag": 2 }

   – nimmt tag.js beim Erstellen des Tagesplans je Tag so viele noch nicht
   gesendete Videos und setzt sie AN DIE STELLE erzeugter Reels: Nummer und
   Sendezeit bleiben, die Tageszahl aendert sich nicht (Volumentest). Der
   Eintrag startet mit Status "gerendert"; tag.js laedt ihn hoch, posten.js
   veroeffentlicht ihn wie jedes andere Reel.

   Jedes Video laeuft einmal (Verlauf: <serie>|<id>). Wurde es an seinem Tag
   nicht veroeffentlicht, gibt verlaufBereinigen es wieder frei und es kommt
   an einem der naechsten Tage erneut in den Plan. Sind alle gesendet, bleibt
   der Plan, wie die Redaktion ihn erstellt hat.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { WURZEL, minuten } from "./konfig.js";
import { bildtextBauen, hashtagsSammeln } from "./bildtext.js";
import { mp4DauerMs } from "./rendern.js";
import { REELS } from "../real/skripte.js";

/* ordner: wo die fertigen Videos liegen; hinweis: Kennzeichnung im Bildtext;
   coverMs: Stelle des Titelbilds im Video (Rueckfall, falls Instagram das
   JPEG nicht nimmt); musik: Name des Stuecks, nur fuer die Auswertung. */
export const SERIEN = {
  plakat: { titel: "Plakat", ordner: "out/plakat", hinweis: "Die Stimme ist KI-generiert.", coverMs: 1500, musik: "eigen-warm" }
};

/* Videos der Serie, die fertig sind und noch nie liefen – in Skript-Reihenfolge. */
export function serieOffen(name, verlauf = {}) {
  const serie = SERIEN[name];
  if (!serie) return [];
  return REELS.filter((r) => !verlauf[`${name}|${r.id}`] && fs.existsSync(path.join(WURZEL, serie.ordner, `${r.id}.mp4`)));
}

function eintrag(name, reel, platz, konfig) {
  const serie = SERIEN[name];
  const datei = `${serie.ordner}/${reel.id}.mp4`, titelbild = `${serie.ordner}/${reel.id}.jpg`;
  const b = reel.bildtext;
  const { text, kommentar, warnungen } = bildtextBauen({
    aufhaenger: b.aufhaenger, absaetze: b.absaetze, quelle: [b.quelle || "Keine Beratung.", serie.hinweis].join(" "),
    hashtags: hashtagsSammeln(b.hashtags || []), sprache: "de", modus: konfig.hashtags, stufe: reel.stufe
  });
  return {
    nr: platz.nr, format: name, stufe: reel.stufe, rahmen: null, gruppe: "wissen", schluessel: `${name}|${reel.id}`, titel: `${serie.titel}: ${reel.titel}`, sprache: "de", cover: null,
    zeit: platz.zeit, status: "gerendert", reel: null, bildtext: text, kommentar,
    datei, url: null, coverDatei: fs.existsSync(path.join(WURZEL, titelbild)) ? titelbild : null, coverMs: serie.coverMs,
    containerId: null, mediaId: null, veroeffentlicht: null, fehler: null, versuche: 0,
    dauerSekunden: Math.round((mp4DauerMs(path.join(WURZEL, datei)) || 0) / 100) / 10, musik: serie.musik,
    warnungen: warnungen.length ? warnungen : undefined
  };
}

/* Setzt Serien-Videos in den frisch erstellten Plan (veraendert plan.reels)
   und liefert [{ neu, ersetzt }]. Ersetzt werden nur Reels, die noch nichts
   gekostet haben (Status "geplant") – nie der Countdown, nie ein Karussell.
   Die Plaetze verteilen sich ueber den Tag (bei zwei Videos um 1/3 und 2/3
   des Fensters); bevorzugt weicht ein Wissens-Reel derselben Funnel-Stufe,
   damit der Mix aus Daten und Wissen moeglichst bleibt. */
export function serieEinplanen(plan, konfig, { verlauf = {} } = {}) {
  const s = konfig.serie || {};
  const anzahl = Math.max(0, Math.floor(Number(s.proTag) || 0));
  if (!s.name || !anzahl) return [];
  if (!SERIEN[s.name]) throw new Error(`Serie "${s.name}" unbekannt (funnel.json: serie.name; bekannt: ${Object.keys(SERIEN).join(", ")}).`);
  const videos = serieOffen(s.name, verlauf).slice(0, anzahl);
  const frei = plan.reels.filter((r) => r.status === "geplant" && r.typ !== "karussell" && r.gruppe !== "saison");
  if (!videos.length || !frei.length) return [];
  const alle = plan.reels.map((r) => minuten(r.zeit));
  const von = Math.min(...alle), bis = Math.max(...alle);
  const wechsel = [];
  for (const [i, reel] of videos.entries()) {
    if (!frei.length) break;
    const ziel = von + ((bis - von) * (i + 1)) / (videos.length + 1);
    const kosten = (r) => Math.abs(minuten(r.zeit) - ziel) + (r.gruppe === "wissen" ? 0 : 120) + (r.stufe === reel.stufe ? 0 : 45);
    const platz = frei.reduce((a, b) => (kosten(b) < kosten(a) ? b : a));
    frei.splice(frei.indexOf(platz), 1);
    wechsel.push({ neu: eintrag(s.name, reel, platz, konfig), ersetzt: platz });
  }
  for (const w of wechsel) plan.reels[plan.reels.indexOf(w.ersetzt)] = w.neu;
  return wechsel;
}
