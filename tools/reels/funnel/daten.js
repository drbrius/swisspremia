/* =========================================================================
   Zugriff auf die BAG-Praemiendaten der Website (data/praemien.js und
   data/plz.js, erzeugt von tools/build_data.js).

   Aufbau von praemien[schluessel]: schluessel = "ZH1|E|300|M"
     Region   Kanton + Praemienregion (ZH1, BE2, AG0 ...)
     Alter    E Erwachsene (ab 26), J junge Erwachsene (19–25), K Kinder
     Franchise 300 ... 2500 (Erwachsene), 0 ... 600 (Kinder)
     Unfall   M mit, O ohne Unfalldeckung
   Jeder Eintrag: [versichererNr, modell, praemieProMonat], aufsteigend.
   Modell (Einteilung der BAG-Daten seit 2027, tools/build_data.js):
     0 Standard, 1 Hausarzt/HMO (BAG "PRAXIS"), 2 Telmed/digital, 3 Flex.

   WICHTIG: Die Datei enthaelt je Modell nur die acht guenstigsten Angebote.
   Aussagen ueber "die teuerste Kasse" sind daraus NICHT ableitbar – alle
   Formate vergleichen deshalb guenstigste Angebote miteinander.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { PROJEKT } from "./konfig.js";

/* Kurznamen fuer Bild und Stimme; Index = Modell in den Daten (s. oben). */
export const MODELLE = ["Standard", "Hausarzt", "Telmed", "Flex"];
export const KANTONE = {
  AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern", BL: "Basel-Landschaft", BS: "Basel-Stadt",
  FR: "Freiburg", GE: "Genf", GL: "Glarus", GR: "Graubünden", JU: "Jura", LU: "Luzern", NE: "Neuenburg", NW: "Nidwalden",
  OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", TI: "Tessin", UR: "Uri",
  VD: "Waadt", VS: "Wallis", ZG: "Zug", ZH: "Zürich"
};
/* Ortsnamen, die auf Deutsch anders heissen oder in den BAG-Daten
   Zusaetze tragen. */
const ORTSNAMEN = { "Genève": "Genf", "Neuchâtel": "Neuenburg", "Fribourg": "Freiburg", "Fribourg/Freiburg": "Freiburg", "Sion": "Sitten", "Sierre": "Siders",
  "Biel/Bienne": "Biel", "Delémont": "Delsberg", "Lenzerheide/Lai": "Lenzerheide" };
/* Bevorzugte, bekannte Orte je Praemienregion – der erste, der in den
   Daten tatsaechlich in dieser Region liegt, gewinnt. Ohne Treffer gilt
   der Ort mit den meisten Postleitzahlen. */
const BEVORZUGT = {
  BE1: ["Bern"], BE2: ["Thun", "Biel"], BE3: ["Burgdorf", "Langenthal", "Herzogenbuchsee"],
  BL1: ["Allschwil", "Binningen", "Reinach"], BL2: ["Laufen", "Liestal", "Sissach", "Zwingen"],
  FR1: ["Freiburg"], FR2: ["Bulle", "Murten", "Estavayer-le-Lac"],
  GR1: ["Chur", "Davos", "Roveredo"], GR2: ["Chur", "Domat/Ems", "Landquart"], GR3: ["Davos", "Arosa", "Lenzerheide", "Laax"],
  LU1: ["Luzern"], LU2: ["Emmen", "Ebikon", "Kriens", "Rothenburg"], LU3: ["Sursee", "Willisau", "Hochdorf"],
  SG1: ["St. Gallen"], SG2: ["Rapperswil-Jona", "Rapperswil", "Wil", "Buchs", "Sargans", "Bad Ragaz"], SG3: ["Wattwil", "Uzwil", "Altstätten", "Degersheim"],
  SH1: ["Schaffhausen"], SH2: ["Stein am Rhein", "Thayngen", "Hallau", "Neunkirch"],
  TI1: ["Lugano", "Bellinzona", "Locarno"], TI2: ["Mendrisio", "Chiasso", "Biasca", "Gordola"],
  VD1: ["Lausanne"], VD2: ["Yverdon-les-Bains", "Montreux", "Vevey", "Nyon", "Morges", "Echallens"],
  VS1: ["Sitten", "Monthey", "Martigny", "Brig", "Visp"], VS2: ["Zermatt", "Visp", "Brig", "Siders", "Vex"],
  ZH1: ["Zürich"], ZH2: ["Winterthur"], ZH3: ["Uster", "Wetzikon", "Bülach", "Dietikon"]
};
/* "Wetzikon ZH" -> "Wetzikon", "Lausanne 25" -> "Lausanne" */
const ortBereinigen = (ort) => (ORTSNAMEN[ort] || ort).replace(/\s+\d+$/, "").replace(/\s+(AG|AI|AR|BE|BL|BS|FR|GE|GL|GR|JU|LU|NE|NW|OW|SG|SH|SO|SZ|TG|TI|UR|VD|VS|ZG|ZH)$/, "").trim();

function laden() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const name of ["praemien.js", "plz.js"]) {
    const datei = path.join(PROJEKT, "data", name);
    if (!fs.existsSync(datei)) throw new Error(`Praemiendaten fehlen: ${datei} – siehe README (tools/build_data.js).`);
    vm.runInContext(fs.readFileSync(datei, "utf8"), ctx, { filename: name });
  }
  return { kk: ctx.window.KK_DATA, plz: ctx.window.PLZ_DATA };
}

const { kk, plz } = laden();
export const JAHR = kk.jahr;
export const QUELLE = kk.quelle;

/* Welcher Ort steht fuer eine Praemienregion? Je Region der Ortsname mit
   den meisten Postleitzahlen; hat ein Kanton mehrere Regionen, bekommt
   jede einen anderen Namen (Zuerich 1 = Zürich, Zuerich 2 nicht nochmals
   Zürich, sondern der naechsthaeufigste Ort). */
function regionenBestimmen() {
  const zaehler = {};   // "ZH1" -> { Ort: Anzahl }
  for (const eintraege of Object.values(plz)) {
    for (const [ort, kt, reg] of eintraege) {
      const schluessel = kt + reg;
      const name = ortBereinigen(ort);
      (zaehler[schluessel] ??= {})[name] = ((zaehler[schluessel] ??= {})[name] || 0) + 1;
    }
  }
  const vorhanden = new Set(Object.keys(kk.praemien).map((k) => k.split("|")[0]));
  const proKanton = {};
  for (const s of Object.keys(zaehler)) {
    if (!vorhanden.has(s)) continue;
    const kt = s.slice(0, 2);
    if (!KANTONE[kt]) continue;
    (proKanton[kt] ??= []).push(s);
  }
  const regionen = [];
  for (const [kt, liste] of Object.entries(proKanton)) {
    liste.sort();
    const vergeben = new Set();
    for (const s of liste) {
      const reihenfolge = Object.entries(zaehler[s]).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
      const bevorzugt = (BEVORZUGT[s] || []).find((o) => zaehler[s][o] && !vergeben.has(o));
      const ort = bevorzugt || reihenfolge.find((o) => !vergeben.has(o)) || reihenfolge[0];
      vergeben.add(ort);
      regionen.push({
        schluessel: s, kanton: kt, kantonName: KANTONE[kt], nummer: Number(s.slice(2)),
        ort, mehrere: liste.length > 1,
        /* Anzeige: "Zürich" bzw. bei Einregionenkantonen "Kanton Aargau" */
        name: liste.length > 1 ? ort : "Kanton " + KANTONE[kt],
        /* Fuer die Quellenangabe im Bildtext */
        beschreibung: liste.length > 1 ? `Prämienregion ${kt} ${s.slice(2)} (z. B. ${ort})` : `Kanton ${KANTONE[kt]}`
      });
    }
  }
  return regionen.sort((a, b) => a.schluessel.localeCompare(b.schluessel));
}

export const REGIONEN = regionenBestimmen();
export const REGION = Object.fromEntries(REGIONEN.map((r) => [r.schluessel, r]));
export const KANTONE_MIT_REGIONEN = [...new Set(REGIONEN.map((r) => r.kanton))].sort();

/* Alle Angebote einer Gruppe als Objekte. */
export function angebote(region, alter = "E", franchise = 300, unfall = "M") {
  const liste = kk.praemien[`${region}|${alter}|${franchise}|${unfall}`] || [];
  return liste.map(([v, m, p]) => ({ versicherer: v, modell: m, praemie: p }));
}

/* Guenstigstes Angebot, optional auf ein Modell beschraenkt. */
export function guenstigstes(region, alter = "E", franchise = 300, unfall = "M", modell = null) {
  const liste = angebote(region, alter, franchise, unfall).filter((a) => modell === null || a.modell === modell);
  return liste.length ? liste[0] : null;
}

/* Praemie eines bestimmten Versicherers in einer anderen Gruppe – oder
   null, wenn er dort nicht unter den acht guenstigsten ist. */
export function praemieVon(versicherer, modell, region, alter, franchise, unfall) {
  const t = angebote(region, alter, franchise, unfall).find((a) => a.versicherer === versicherer && a.modell === modell);
  return t ? t.praemie : null;
}

/* Guenstigste Erwachsenenpraemie (Standard, 300, mit Unfall) je Kanton:
   Minimum ueber die Regionen des Kantons. */
export function kantonsMinimum(kanton, modell = 0) {
  let bestes = null;
  for (const r of REGIONEN.filter((x) => x.kanton === kanton)) {
    const g = guenstigstes(r.schluessel, "E", 300, "M", modell);
    if (g && (!bestes || g.praemie < bestes.praemie)) bestes = { ...g, region: r };
  }
  return bestes;
}
