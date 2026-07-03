// Aggregiert die BAG-Prämiendaten (priminfo.admin.ch) zu kompakten JS-Dateien für die Website.
const X = require('xlsx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:/Users/info/OneDrive/Dokumente/leads/data';
fs.mkdirSync(OUT_DIR, { recursive: true });

const clean = s => String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- 1. Versicherer-Namen (Index-Sheet) ----------
const wbV = X.readFile(path.join(__dirname, 'versicherer.xlsx'));
const idxRows = X.utils.sheet_to_json(wbV.Sheets['Index '], { header: 1 });
const insurerNames = {};
for (const r of idxRows) {
  if (typeof r[0] === 'number' && r[2]) insurerNames[r[0]] = clean(r[2]);
}
console.log('Versicherer im Index:', Object.keys(insurerNames).length);

// ---------- 2. PLZ -> Region (B_NPA-Sheet) ----------
const wbR = X.readFile(path.join(__dirname, 'regionen.xlsx'));
const npaRows = X.utils.sheet_to_json(wbR.Sheets['B_NPA'], { header: 1 });
const plzMap = {}; // plz -> [[ort, kanton, region], ...]
for (const r of npaRows) {
  const plz = r[1], ort = r[2], kt = r[3], reg = r[4];
  if (typeof plz !== 'number' || !kt || reg === undefined || reg === null) continue;
  const key = String(plz);
  const entry = [clean(ort), String(kt), Number(reg)];
  if (!plzMap[key]) plzMap[key] = [];
  // Duplikate (gleicher Ort/Kanton/Region) überspringen
  if (!plzMap[key].some(e => e[0] === entry[0] && e[1] === entry[1] && e[2] === entry[2])) {
    if (plzMap[key].length < 15) plzMap[key].push(entry);
  }
}
console.log('PLZ erfasst:', Object.keys(plzMap).length);

// ---------- 3. Prämien aggregieren ----------
const wbP = X.readFile(path.join(__dirname, 'gesamtbericht_ch.xlsx'), { dense: true });
const rows = X.utils.sheet_to_json(wbP.Sheets['Export'], { header: 1 });
console.log('Prämienzeilen:', rows.length - 1);

const AK = { 'AKL-ERW': 'E', 'AKL-JUG': 'J', 'AKL-KIN': 'K' };
const UN = { 'MIT-UNF': 'M', 'OHN-UNF': 'O' };
const TT = { 'TAR-BASE': 0, 'TAR-HAM': 1, 'TAR-HMO': 2, 'TAR-DIV': 3 };

// key -> Map("vNum|tt" -> minPrämie)
const groups = new Map();
const usedInsurers = new Set();

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const [vNum, kanton, gebiet, jahr, , region, akl, unf, , tariftyp, subgrp, , franchise, praemie, , , , befristet] = r;
  if (gebiet !== 'CH' || jahr !== 2026) continue;
  if (befristet) continue; // auslaufende Tarife weglassen
  // Nur Basis-Altersuntergruppe (kein Mehrkind-Rabatt): '' oder K1
  if (subgrp && subgrp !== 'K1') continue;
  const ak = AK[akl], un = UN[unf], tt = TT[tariftyp];
  if (ak === undefined || un === undefined || tt === undefined) continue;
  const reg = Number(String(region).replace('PR-REG CH', ''));
  const fr = Number(String(franchise).replace('FRA-', ''));
  const prem = Number(praemie);
  if (!isFinite(prem) || prem <= 0) continue;

  const gkey = `${kanton}${reg}|${ak}|${fr}|${un}`;
  const vkey = `${vNum}|${tt}`;
  let g = groups.get(gkey);
  if (!g) { g = new Map(); groups.set(gkey, g); }
  const cur = g.get(vkey);
  if (cur === undefined || prem < cur) g.set(vkey, prem);
  usedInsurers.add(vNum);
}
console.log('Gruppen (Region×Alter×Franchise×Unfall):', groups.size);

// Pro Gruppe und Tarifmodell nur die günstigsten 8 Angebote behalten
const TOP_N = 8;
const praemien = {};
for (const [gkey, g] of groups) {
  const byTT = [[], [], [], []];
  for (const [vkey, prem] of g) {
    const [vNum, tt] = vkey.split('|').map(Number);
    byTT[tt].push([vNum, tt, Math.round(prem * 100) / 100]);
  }
  const out = [];
  for (const arr of byTT) {
    arr.sort((a, b) => a[2] - b[2]);
    out.push(...arr.slice(0, TOP_N));
  }
  out.sort((a, b) => a[2] - b[2]);
  praemien[gkey] = out;
}

const versicherer = {};
for (const v of usedInsurers) versicherer[v] = insurerNames[v] || ('Versicherer Nr. ' + v);

// ---------- 4. Schreiben ----------
const kkData = {
  jahr: 2026,
  quelle: 'Bundesamt für Gesundheit (BAG), priminfo.admin.ch, Prämien 2026',
  modelle: ['Standard (freie Arztwahl)', 'Hausarzt-Modell', 'HMO-Modell', 'Telmed / weitere Modelle'],
  versicherer,
  praemien
};
fs.writeFileSync(path.join(OUT_DIR, 'praemien.js'),
  '// Quelle: BAG priminfo.admin.ch – Prämien 2026 (automatisch generiert)\nwindow.KK_DATA = ' + JSON.stringify(kkData) + ';\n');
fs.writeFileSync(path.join(OUT_DIR, 'plz.js'),
  '// Quelle: BAG priminfo.admin.ch – Prämienregionen 2026 (automatisch generiert)\nwindow.PLZ_DATA = ' + JSON.stringify(plzMap) + ';\n');

const s1 = fs.statSync(path.join(OUT_DIR, 'praemien.js')).size;
const s2 = fs.statSync(path.join(OUT_DIR, 'plz.js')).size;
console.log('praemien.js:', (s1 / 1024).toFixed(0), 'KB |', 'plz.js:', (s2 / 1024).toFixed(0), 'KB');

// Stichprobe: Zürich Stadt (Region 1), Erwachsene, Franchise 300, mit Unfall
console.log('Beispiel ZH1|E|300|M:', JSON.stringify((praemien['ZH1|E|300|M'] || []).slice(0, 5)));
console.log('PLZ 8001:', JSON.stringify(plzMap['8001']));
