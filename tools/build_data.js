/* =========================================================================
   Praemiendaten aus den BAG-Quellen zu kompakten JS-Dateien verdichten

       node tools/build_data.js <praemien_ch.csv>

   Quellen (jaehrlich Ende September neu):
     Praemien_CH.csv          opendata.swiss, Datensatz "Krankenversicherungs-
                              praemien" (health-insurance-premiums), Ressource
                              "Praemien_CH.csv" – das komplette Verzeichnis
     tools/regionen-2027.xlsx priminfo.admin.ch/downloads/praemienregionen-<Jahr>.xlsx
                              Blatt B_NPA: PLZ -> Ort, Kanton, Praemienregion
     tools/versicherer-*.xlsx priminfo.admin.ch, zugelassene Krankenversicherer
                              (Blatt "Index": Nummer -> Name); fehlt es, bleiben
                              die Namen aus data/praemien.js des Vorjahres

   Bis 2026 lag das Verzeichnis als Excel mit einem Blatt "Export" auf
   priminfo; seit 2027 gibt es dort nur noch PDF, die Daten kommen als CSV
   vom offenen Datenportal. Die Codes haben sich dabei geaendert – siehe
   die Tabellen unten.

   Braucht das npm-Paket xlsx fuer die beiden Excel-Dateien:
       npm i --no-save xlsx        (im Projektstamm, ohne package.json)
   ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");

const STAMM = path.join(__dirname, "..");
const AUSGABE = path.join(STAMM, "data");
const CSV = process.argv[2];
if (!CSV || !fs.existsSync(CSV)) {
  console.error("Aufruf: node tools/build_data.js <Pfad zu Praemien_CH.csv>");
  process.exit(1);
}

/* ------------------------------------------------------------ Codes */
const ALTER = { AKA_01_KIN: "K", AKA_02_JUG: "J", AKA_03_ERW: "E" };
const UNFALL = { MIT_UNF: "M", OHN_UNF: "O" };
/* Das BAG trennt seit 2027 nicht mehr Hausarzt und HMO; beides ist PRAXIS.
   Die vier Modelle der Website sind deshalb neu geschnitten. */
const MODELL = { BASE: 0, PRAXIS: 1, TEL_DIG: 2, FLEX: 3 };
const MODELLE = [
  "Standard (freie Arztwahl)",
  "Hausarzt- / HMO-Modell",
  "Telmed / digitales Modell",
  "Flexibles Modell"
];
/* Nur die Grundstufe je Altersklasse – K3 bis K5 sind Mehrkind-Rabatte. */
const GRUNDSTUFE = new Set(["E1", "J1", "K1"]);
const TOP_JE_MODELL = 8;

const clean = (s) => String(s || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------ CSV */
/* Kleiner Parser mit Anfuehrungszeichen – Tarifbezeichnungen enthalten
   Kommas und Zollzeichen. */
function zeileParsen(z) {
  const felder = []; let f = "", inAnf = false;
  for (let i = 0; i < z.length; i++) {
    const c = z[i];
    if (inAnf) {
      if (c === '"') { if (z[i + 1] === '"') { f += '"'; i++; } else inAnf = false; }
      else f += c;
    } else if (c === '"') inAnf = true;
    else if (c === ",") { felder.push(f); f = ""; }
    else f += c;
  }
  felder.push(f);
  return felder;
}

const zeilen = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "").split("\n");
const kopf = zeileParsen(zeilen[0].trim());
const sp = (n) => { const i = kopf.indexOf(n); if (i < 0) throw new Error("Spalte fehlt: " + n); return i; };
const S = {
  vers: sp("Versicherer"), kanton: sp("Kanton"), gebiet: sp("Hoheitsgebiet"), jahr: sp("Geschäftsjahr"),
  region: sp("Region"), alter: sp("Altersklasse"), unfall: sp("Unfalleinschluss"), typ: sp("Tariftyp"),
  unter: sp("Altersuntergruppe"), franchise: sp("Franchise"), praemie: sp("Prämie")
};

/* ------------------------------------------------- 1. Versichererna­men */
let namen = {};
try {
  const alt = fs.readFileSync(path.join(AUSGABE, "praemien.js"), "utf8");
  namen = JSON.parse(alt.slice(alt.indexOf("{"), alt.lastIndexOf("}") + 1)).versicherer || {};
  console.log("Namen aus dem Vorjahr:", Object.keys(namen).length);
} catch (e) { /* kein Vorjahr */ }

const versDatei = fs.readdirSync(__dirname).filter((f) => /^versicherer.*\.xlsx$/.test(f)).sort().pop();
if (versDatei) {
  try {
    const X = require("xlsx");
    const wb = X.readFile(path.join(__dirname, versDatei));
    const blatt = wb.SheetNames.find((s) => /index/i.test(s)) || wb.SheetNames[0];
    let n = 0;
    for (const r of X.utils.sheet_to_json(wb.Sheets[blatt], { header: 1 })) {
      if (typeof r[0] === "number" && r[2]) { namen[r[0]] = clean(r[2]); n++; }
    }
    console.log("Namen aus " + versDatei + " (" + blatt + "):", n);
  } catch (e) { console.log("Versicherer-Excel nicht lesbar, Vorjahresnamen bleiben:", e.message); }
}

/* --------------------------------------------- 2. PLZ -> Region */
const regDatei = fs.readdirSync(__dirname).filter((f) => /^regionen.*\.xlsx$/.test(f)).sort().pop();
let plzMap = null;
if (regDatei) {
  const X = require("xlsx");
  const wb = X.readFile(path.join(__dirname, regDatei));
  plzMap = {};
  for (const r of X.utils.sheet_to_json(wb.Sheets["B_NPA"], { header: 1 })) {
    const plz = r[1], ort = r[2], kt = r[3], reg = r[4];
    if (typeof plz !== "number" || !kt || reg === undefined || reg === null) continue;
    const key = String(plz), e = [clean(ort), String(kt), Number(reg)];
    if (!plzMap[key]) plzMap[key] = [];
    if (!plzMap[key].some((x) => x[0] === e[0] && x[1] === e[1] && x[2] === e[2]) && plzMap[key].length < 15) plzMap[key].push(e);
  }
  console.log("PLZ aus " + regDatei + ":", Object.keys(plzMap).length);
} else {
  console.log("Keine regionen-*.xlsx in tools/ – data/plz.js bleibt unveraendert.");
}

/* ------------------------------------------------- 3. Praemien */
const gruppen = new Map();
const benutzt = new Set();
let jahr = null, n = 0, uebersprungen = 0;

for (let i = 1; i < zeilen.length; i++) {
  const z = zeilen[i]; if (!z.trim()) continue;
  const r = zeileParsen(z);
  if (r[S.gebiet] !== "P_OKPCH") { uebersprungen++; continue; }
  if (!GRUNDSTUFE.has(r[S.unter])) { uebersprungen++; continue; }
  const ak = ALTER[r[S.alter]], un = UNFALL[r[S.unfall]], mo = MODELL[r[S.typ]];
  if (ak === undefined || un === undefined || mo === undefined) { uebersprungen++; continue; }
  const reg = Number(r[S.region].replace("PR_REG_", ""));
  const fr = Number(r[S.franchise].slice(-4));
  const prem = Number(r[S.praemie]);
  if (!Number.isFinite(reg) || !Number.isFinite(fr) || !(prem > 0)) { uebersprungen++; continue; }
  jahr = jahr || Number(r[S.jahr]);

  const gkey = `${r[S.kanton]}${reg}|${ak}|${fr}|${un}`;
  const vkey = `${r[S.vers]}|${mo}`;
  let g = gruppen.get(gkey); if (!g) { g = new Map(); gruppen.set(gkey, g); }
  const cur = g.get(vkey);
  if (cur === undefined || prem < cur) g.set(vkey, prem);
  benutzt.add(Number(r[S.vers])); n++;
}
console.log("Zeilen verwendet:", n, "| uebersprungen:", uebersprungen, "| Jahr:", jahr, "| Gruppen:", gruppen.size);

const praemien = {};
for (const [gkey, g] of gruppen) {
  const jeModell = [[], [], [], []];
  for (const [vkey, prem] of g) {
    const [v, mo] = vkey.split("|").map(Number);
    jeModell[mo].push([v, mo, Math.round(prem * 100) / 100]);
  }
  const out = [];
  for (const arr of jeModell) { arr.sort((a, b) => a[2] - b[2]); out.push(...arr.slice(0, TOP_JE_MODELL)); }
  out.sort((a, b) => a[2] - b[2]);
  praemien[gkey] = out;
}

const versicherer = {};
const ohneName = [];
for (const v of [...benutzt].sort((a, b) => a - b)) {
  versicherer[v] = namen[v] || ("Versicherer Nr. " + v);
  if (!namen[v]) ohneName.push(v);
}
if (ohneName.length) console.log("ACHTUNG, ohne Namen:", ohneName.join(", "));

/* ------------------------------------------------- 4. Schreiben */
const daten = {
  jahr,
  quelle: `Bundesamt für Gesundheit (BAG), opendata.swiss / priminfo.admin.ch, Prämien ${jahr}`,
  modelle: MODELLE,
  versicherer,
  praemien
};
fs.writeFileSync(path.join(AUSGABE, "praemien.js"),
  `// Quelle: BAG priminfo.admin.ch – Prämien ${jahr} (automatisch generiert)\nwindow.KK_DATA = ` + JSON.stringify(daten) + ";\n");
if (plzMap) {
  fs.writeFileSync(path.join(AUSGABE, "plz.js"),
    `// Quelle: BAG priminfo.admin.ch – Prämienregionen ${jahr} (automatisch generiert)\nwindow.PLZ_DATA = ` + JSON.stringify(plzMap) + ";\n");
}

const kb = (f) => (fs.statSync(path.join(AUSGABE, f)).size / 1024).toFixed(0) + " KB";
console.log("praemien.js:", kb("praemien.js"), "| plz.js:", kb("plz.js"), "| Versicherer:", Object.keys(versicherer).length);
console.log("Stichprobe ZH1|E|300|M:", JSON.stringify((praemien["ZH1|E|300|M"] || []).slice(0, 4)));
if (plzMap) console.log("PLZ 8001:", JSON.stringify(plzMap["8001"]));
