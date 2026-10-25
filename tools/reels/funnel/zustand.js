/* =========================================================================
   Zustand auf der Platte: Tagesplan, Verlauf, Protokoll, Aufraeumen.

   plan/JJJJ-MM-TT.json   der Plan eines Tages – Reels, Zeiten, Status
   plan/verlauf.json      wann welches Thema zuletzt lief (gegen Dubletten)
   plan/protokoll.log     eine Zeile je Ereignis, fuer die Fehlersuche

   Status eines Reels im Plan:
     geplant -> gerendert -> hochgeladen -> veroeffentlicht
     dazu "fehler" (wird erneut versucht) und "aufgegeben" (nach 3 Fehlern)
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

/* Erst in eine Nebendatei schreiben, dann umbenennen – ein Absturz
   mitten im Schreiben laesst so nie einen halben Plan zurueck. */
export function planSpeichern(plan) {
  const p = planPfad(plan.datum);
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
