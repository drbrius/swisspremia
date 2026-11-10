/* =========================================================================
   Serie «Echt» – fertige Videos in den Tagesplan des Funnels aufnehmen.

       node real/einplanen.js                      alle fertigen, noch nicht eingeplanten Videos, ab jetzt im 40-Minuten-Abstand
       node real/einplanen.js brief umzug          nur diese
       node real/einplanen.js --zeiten=13:30,14:10 feste Sendezeiten (in Reihenfolge der Videos)
       node real/einplanen.js --datum=2026-11-11   in einen anderen Tagesplan

   Laedt Video und Titelbild in die Ablage (Vercel Blob) und haengt einen
   Eintrag mit Status "hochgeladen" an den Plan – posten.js veroeffentlicht
   ihn wie jedes andere Reel (Mindestabstand, Sendefenster, Nachholen).
   Jedes Video wird nur einmal eingeplant (Verlauf: echt|<id>).
   Braucht BLOB_READ_WRITE_TOKEN – aus PowerShell mit Nutzer-Umgebung starten.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KONFIG, minuten } from "../funnel/konfig.js";
import { planLaden, planSpeichern, verlaufLaden, verlaufMerken, protokoll, argumente } from "../funnel/zustand.js";
import { hochladen, erreichbar } from "../funnel/ablage.js";
import { datumKurz } from "../funnel/sprache.js";
import { REELS } from "./skripte.js";
import { bildtext } from "./bildtexte.js";
import { eingabe } from "./bauen.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const AUS = path.join(HIER, "..", "out", "real");
const arg = argumente();
const datum = arg.datum || datumKurz();
const verlauf = verlaufLaden();
const uhr = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const plan = planLaden(datum);
if (!plan) { console.error(`Kein Plan fuer ${datum} – zuerst node tag.js --nur-plan --datum=${datum}`); process.exit(1); }

const kandidaten = REELS.filter((r) => (arg._.length ? arg._.includes(r.id) : true))
  .filter((r) => fs.existsSync(path.join(AUS, `${r.id}.mp4`)))
  .filter((r) => !verlauf[`echt|${r.id}`] || arg.nochmals);
if (!kandidaten.length) { console.log("Nichts einzuplanen (alle fertigen Videos sind schon im Plan)."); process.exit(0); }

/* Sendezeiten: vorgegeben oder ab jetzt + 5 Minuten im 40-Minuten-Abstand. */
const jetzt = new Date();
const start = datum === datumKurz(jetzt) ? Math.ceil((jetzt.getHours() * 60 + jetzt.getMinutes() + 5) / 5) * 5 : minuten(KONFIG.postVon);
const zeiten = arg.zeiten ? String(arg.zeiten).split(",") : kandidaten.map((_, i) => uhr(start + i * 40));

let nr = Math.max(0, ...plan.reels.map((r) => r.nr));
for (const [i, reel] of kandidaten.entries()) {
  const video = path.join(AUS, `${reel.id}.mp4`), titelbild = path.join(AUS, `${reel.id}.jpg`);
  const kennung = Math.round(fs.statSync(video).mtimeMs).toString(36).slice(-6);
  const url = await hochladen(video, path.join("reels", datum, `echt-${reel.id}-${kennung}.mp4`));
  const probe = await erreichbar(url);
  if (!probe.ok) throw new Error(`Video nicht erreichbar (HTTP ${probe.status}): ${url}`);
  let coverUrl = null;
  if (fs.existsSync(titelbild)) coverUrl = await hochladen(titelbild, path.join("reels", datum, `echt-${reel.id}-${kennung}.jpg`));
  const { text, warnungen } = bildtext(reel);
  const eintrag = {
    nr: ++nr, format: "echt", stufe: reel.stufe, rahmen: null, gruppe: "wissen", schluessel: `echt|${reel.id}`, titel: `Echt: ${reel.titel}`, sprache: "de", cover: null,
    zeit: zeiten[i] || uhr(start + i * 40), status: "hochgeladen", reel: null, bildtext: text, kommentar: null,
    datei: `out/real/${reel.id}.mp4`, url, coverDatei: `out/real/${reel.id}.jpg`, coverUrl, coverMs: 1000,
    containerId: null, mediaId: null, veroeffentlicht: null, fehler: null, versuche: 0,
    dauerSekunden: Math.round((eingabe(reel).gesamt / 30) * 10) / 10, musik: "real-1",
    warnungen: warnungen.length ? warnungen : undefined
  };
  plan.reels.push(eintrag);
  planSpeichern(plan);
  verlaufMerken([eintrag.schluessel], datum);
  protokoll(`Echt-Serie eingeplant: #${eintrag.nr} ${reel.titel} um ${eintrag.zeit} (${datum})`);
}
