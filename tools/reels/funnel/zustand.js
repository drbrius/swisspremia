/* =========================================================================
   Zustand auf der Platte: Tagesplan, Verlauf, Protokoll, Aufraeumen.

   plan/JJJJ-MM-TT.json   der Plan eines Tages – Reels, Zeiten, Status
   plan/verlauf.json      wann welches Thema zuletzt lief (gegen Dubletten)
   plan/protokoll.log     eine Zeile je Ereignis, fuer die Fehlersuche

   Status eines Reels im Plan:
     geplant -> gerendert -> hochgeladen -> veroeffentlicht
     dazu "fehler" (wird erneut versucht), "aufgegeben" (nach 3 Fehlern)
     und "verfallen" (zu spaet fuer den Tag, posten.js, verfallMinuten)
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { PLAN_ORDNER, AUSGABE_ORDNER } from "./konfig.js";
import { datumKurz } from "./sprache.js";

fs.mkdirSync(PLAN_ORDNER, { recursive: true });

export const planPfad = (datum) => path.join(PLAN_ORDNER, `${datum}.json`);

export function planLaden(datum) {
  const p = planPfad(datum);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/* Wie weit ist ein Reel? Damit entscheidet planZusammenfuehren, welche
   Fassung – Speicher oder Platte – die juengere ist. Ein Container ohne
   mediaId heisst: posten.js ist gerade dran. */
function fortschritt(r) {
  if (r.status === "veroeffentlicht" || r.mediaId) return 4;
  if (r.containerId) return 3;
  if (r.status === "hochgeladen" || r.url || (r.bildUrls && r.bildUrls.length)) return 2;
  if (r.status === "gerendert" || r.datei || (r.dateien && r.dateien.length)) return 1;
  return 0;
}

/* tag.js (rendert, laedt hoch) und posten.js (veroeffentlicht) halten den
   Plan beide im Speicher und schreiben ihn nach jedem Schritt. Ohne
   Abgleich ueberschreibt der eine den Stand des anderen: Am 8.11.2026 hatte
   posten.js den Countdown veroeffentlicht, tag.js speicherte danach seinen
   aelteren Stand "hochgeladen", und posten.js veroeffentlichte ihn ein
   zweites Mal. Darum vor jedem Schreiben die Fassung auf der Platte lesen
   und je Reel die weiter fortgeschrittene behalten – in das vorhandene
   Objekt hinein, damit die Referenzen des Aufrufers gueltig bleiben. */
const POSTEN_FELDER = ["status", "containerId", "mediaId", "veroeffentlicht", "permalink", "fehler", "versuche"];
export function planZusammenfuehren(plan, platte) {
  if (!platte || !Array.isArray(platte.reels)) return plan;
  const meine = new Map(plan.reels.map((r) => [r.nr, r]));
  for (const d of platte.reels) {
    const m = meine.get(d.nr);
    if (!m) { plan.reels.push(d); continue; }   // z. B. Nachschub aus einem anderen Lauf
    const fm = fortschritt(m), fd = fortschritt(d);
    if (fd > fm) {
      Object.assign(m, d);
    } else if (fd === fm) {
      /* Gleich weit: eigener Stand gilt, aber Fehlversuche von posten.js
         nicht vergessen – sonst zaehlt es bei jedem Lauf wieder von vorn. */
      if ((d.versuche || 0) > (m.versuche || 0)) m.versuche = d.versuche;
      if (m.status === "hochgeladen" && ["fehler", "aufgegeben", "verfallen"].includes(d.status)) for (const f of POSTEN_FELDER) if (d[f] !== undefined) m[f] = d[f];
    }
  }
  plan.reels.sort((a, b) => a.nr - b.nr);
  return plan;
}

/* Erst in eine Nebendatei schreiben, dann umbenennen – ein Absturz
   mitten im Schreiben laesst so nie einen halben Plan zurueck.
   ersetzen: true schreibt ohne Abgleich (neuer Plan, --neu). */
export function planSpeichern(plan, { ersetzen = false } = {}) {
  const p = planPfad(plan.datum);
  if (!ersetzen && fs.existsSync(p)) {
    try { planZusammenfuehren(plan, JSON.parse(fs.readFileSync(p, "utf8"))); }
    catch (e) { /* unlesbare Datei: eigener Stand gewinnt */ }
  }
  fs.writeFileSync(p + ".neu", JSON.stringify(plan, null, 2));
  fs.renameSync(p + ".neu", p);
}

const VERLAUF = path.join(PLAN_ORDNER, "verlauf.json");
export function verlaufLaden() {
  return fs.existsSync(VERLAUF) ? JSON.parse(fs.readFileSync(VERLAUF, "utf8")) : {};
}
export function verlaufMerken(eintraege, datum) {
  const v = verlaufLaden();
  for (const schluessel of eintraege) v[schluessel] = datum;
  fs.writeFileSync(VERLAUF, JSON.stringify(v, null, 2));
}
/* Ein Thema wieder freigeben (z. B. verfallener Beitrag): es gilt dann als
   noch nie gelaufen und kommt bald wieder dran. */
export function verlaufVergessen(eintraege) {
  const v = verlaufLaden();
  for (const schluessel of eintraege) delete v[schluessel];
  fs.writeFileSync(VERLAUF, JSON.stringify(v, null, 2));
}

const PROTOKOLL = path.join(PLAN_ORDNER, "protokoll.log");
export function protokoll(text, { stumm = false } = {}) {
  const zeile = `${new Date().toISOString().replace("T", " ").slice(0, 19)}  ${text}`;
  if (!stumm) console.log(text);
  try { fs.appendFileSync(PROTOKOLL, zeile + "\n"); } catch (e) { /* Protokoll ist Komfort, kein Muss */ }
}

/* Videos und Plaene, die aelter sind als die Aufbewahrungsfrist, loeschen.
   Tonspuren bleiben: sie sind klein und werden ueber Tage hinweg
   wiederverwendet. */
export function aufraeumen(tage) {
  const grenze = new Date(); grenze.setDate(grenze.getDate() - tage);
  const grenzeText = datumKurz(grenze);
  let geloescht = 0;
  if (fs.existsSync(AUSGABE_ORDNER)) {
    for (const name of fs.readdirSync(AUSGABE_ORDNER)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(name) && name < grenzeText) {
        fs.rmSync(path.join(AUSGABE_ORDNER, name), { recursive: true, force: true });
        geloescht++;
      }
    }
  }
  for (const name of fs.readdirSync(PLAN_ORDNER)) {
    const m = name.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
    if (m && m[1] < grenzeText) { fs.rmSync(path.join(PLAN_ORDNER, name), { force: true }); geloescht++; }
  }
  return geloescht;
}

/* Kleine Hilfe fuer die Kommandozeile: --name=wert und --schalter */
export function argumente(argv = process.argv.slice(2)) {
  const a = { _: [] };
  for (const t of argv) {
    const m = t.match(/^--([a-z-]+)(?:=(.*))?$/i);
    if (m) a[m[1]] = m[2] === undefined ? true : m[2];
    else a._.push(t);
  }
  return a;
}
