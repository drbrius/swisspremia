/* =========================================================================
   Posten – laeuft alle paar Minuten (Aufgabenplanung) und veroeffentlicht,
   was im Tagesplan faellig ist:

       node posten.js                      faellige Reels von heute (hoechstens proTick)
       node posten.js --alle               alle faelligen auf einmal
       node posten.js --datum=2026-11-03   anderer Plan
       node posten.js --jetzt=2026-11-03T18:00   Zeitpunkt vorgeben (Test)
       node posten.js --ausfuehrlich       auch melden, wenn nichts zu tun ist

   Je Reel: Container anlegen (Instagram laedt das Video von der URL),
   warten bis FINISHED, veroeffentlichen, Hashtags ggf. als ersten
   Kommentar. Fehler werden bis zu dreimal wiederholt, dann aufgegeben.
   Das Kontingent (50 je 24 h) wird vor jedem Lauf gelesen.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { KONFIG, PLAN_ORDNER } from "./funnel/konfig.js";
import { planLaden, planSpeichern, protokoll, argumente } from "./funnel/zustand.js";
import { datumKurz, datumLesen } from "./funnel/sprache.js";
import { verbunden, kontingent, containerErstellen, fertigWarten, veroeffentlichen, kommentieren, permalink, tokenAuffrischen, istInstagramLogin, InstagramFehler } from "./funnel/instagram.js";

const arg = argumente();
const jetzt = arg.jetzt ? new Date(arg.jetzt) : new Date();
if (Number.isNaN(jetzt.getTime())) { console.error("--jetzt nicht lesbar"); process.exit(1); }
const datum = arg.datum || datumKurz(jetzt);
const laut = Boolean(arg.ausfuehrlich);

const zeitpunkt = (tag, hhmm) => { const d = datumLesen(tag); const [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); return d; };

const plan = planLaden(datum);
if (!plan) { if (laut) console.log(`Kein Plan fuer ${datum} – tag.js ist noch nicht gelaufen.`); process.exit(0); }

const faellig = plan.reels
  .filter((r) => (r.status === "hochgeladen" || r.status === "fehler") && r.url && zeitpunkt(datum, r.zeit) <= jetzt)
  .sort((a, b) => a.zeit.localeCompare(b.zeit));
if (!faellig.length) { if (laut) console.log(`Nichts faellig (${datum}, ${jetzt.toTimeString().slice(0, 5)}).`); process.exit(0); }

if (!verbunden()) { protokoll(`${faellig.length} Reels faellig, aber Instagram ist nicht verbunden (IG_USER_ID / IG_ACCESS_TOKEN). Siehe FUNNEL.md.`); process.exit(2); }

/* Instagram-Login: Token alle 20 Tage verlaengern (gilt 60). */
if (istInstagramLogin()) {
  const stand = path.join(PLAN_ORDNER, "token-stand.json");
  const letzte = fs.existsSync(stand) ? JSON.parse(fs.readFileSync(stand, "utf8")).aufgefrischt : null;
  if (!letzte || (jetzt - new Date(letzte)) / 86_400_000 > 20) {
    try { const r = await tokenAuffrischen(); fs.writeFileSync(stand, JSON.stringify({ aufgefrischt: jetzt.toISOString(), tage: r.tage })); protokoll(`Token aufgefrischt (${r.tage} Tage).`); }
    catch (e) { protokoll("Token-Auffrischung fehlgeschlagen: " + e.message); }
  }
}

if (!arg["ohne-kontingent"]) {
  try {
    const q = await kontingent();
    if (q.genutzt >= q.gesamt) { protokoll(`Kontingent erschoepft (${q.genutzt}/${q.gesamt} in 24 h) – naechster Versuch beim naechsten Lauf.`); process.exit(0); }
    if (laut) console.log(`Kontingent ${q.genutzt}/${q.gesamt}`);
  } catch (e) {
    protokoll("Kontingent nicht lesbar: " + e.message);
  }
}

const anzahl = arg.alle ? faellig.length : Math.max(1, Number(KONFIG.proTick) || 1);
for (const r of faellig.slice(0, anzahl)) {
  const kennung = `#${r.nr} ${r.titel} (${r.zeit})`;
  try {
    if (!r.containerId) {
      r.containerId = await containerErstellen({ videoUrl: r.url, bildtext: r.bildtext, coverUrl: r.coverUrl || null, coverMs: r.coverMs ?? null });
      planSpeichern(plan);
      protokoll(`Container fuer ${kennung}: ${r.containerId}`, { stumm: !laut });
    }
    await fertigWarten(r.containerId, { melden: (z) => laut && console.log("  " + z) });
    r.mediaId = await veroeffentlichen(r.containerId);
    r.status = "veroeffentlicht";
    r.veroeffentlicht = new Date().toISOString();
    r.fehler = null;
    planSpeichern(plan);
    protokoll(`Veroeffentlicht ${kennung} -> ${r.mediaId}`);
    try { r.permalink = await permalink(r.mediaId); planSpeichern(plan); if (laut) console.log("  " + r.permalink); } catch (e) { /* Komfort */ }
    if (r.kommentar) {
      try { await kommentieren(r.mediaId, r.kommentar); protokoll(`Hashtags als Kommentar unter ${r.mediaId}`, { stumm: !laut }); }
      catch (e) { protokoll(`Kommentar nicht moeglich (${e.message}) – Hashtags fehlen bei ${kennung}.`); }
    }
  } catch (e) {
    r.versuche = (r.versuche || 0) + 1;
    r.fehler = (e.message || String(e)).split("\n")[0];
    /* Ein verunglueckter Container ist verbraucht – beim naechsten Mal
       einen neuen anlegen. Laeuft die Verarbeitung nur noch, bleibt er. */
    if (e instanceof InstagramFehler && (e.statusCode === "ERROR" || e.statusCode === "EXPIRED" || e.status === 400)) r.containerId = null;
    r.status = r.versuche >= 3 ? "aufgegeben" : "fehler";
    planSpeichern(plan);
    protokoll(`FEHLER ${kennung}, Versuch ${r.versuche}: ${r.fehler}${r.status === "aufgegeben" ? " – aufgegeben." : ""}`);
    if (e.code === 190) { protokoll("Token ungueltig oder abgelaufen – neu verbinden: node funnel/instagram.js verbinden <token>"); break; }
  }
}
