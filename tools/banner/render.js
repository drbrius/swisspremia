#!/usr/bin/env node
// Rendert die Social-Media-Banner aus vorlage.html mit Chrome headless.
//
//   node tools/banner/render.js            alle Formate, beide Varianten
//   node tools/banner/render.js facebook   nur ein Format
//   node tools/banner/render.js --pruefen  zusaetzlich melden, ob Figtree geladen wurde
//
// Ausgabe: marke/<datei>.png (mit Foto) und marke/ohne-foto/<datei>.png.
// Das Foto (Alpensee, Unsplash, kommerziell frei) wird einmal nach
// cache/alpensee.jpg geladen; der Ordner ist in .gitignore.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HIER = __dirname;
const VORLAGE = path.join(HIER, 'vorlage.html');
const FOTO = path.join(HIER, 'cache', 'alpensee.jpg');
const FOTO_URL = 'https://images.unsplash.com/photo-1527095655060-4026c4af2b25?auto=format&fit=crop&crop=entropy&w=2560&h=1440&q=80';
const AUSGABE = path.join(HIER, '..', '..', 'marke');
const PROFIL = path.join(os.tmpdir(), 'swisspremia-banner-chrome');

// skala 2 = doppelte Pixeldichte; LinkedIn zeigt den Firmenbanner mit 1128 CSS-Pixeln
// Breite und rechnet die 2256 px selbst herunter – so bleibt die Schrift scharf.
const FORMATE = [
  { id: 'facebook',        datei: 'facebook-titelbild-1640x624.png',      breite: 1640, hoehe: 624,  skala: 1 },
  { id: 'linkedin-firma',  datei: 'linkedin-banner-2256x382.png',         breite: 1128, hoehe: 191,  skala: 2 },
  { id: 'linkedin-profil', datei: 'linkedin-profil-banner-1584x396.png',  breite: 1584, hoehe: 396,  skala: 1 },
  { id: 'x',               datei: 'x-header-1500x500.png',                breite: 1500, hoehe: 500,  skala: 1 },
  { id: 'youtube',         datei: 'youtube-banner-2560x1440.png',         breite: 2560, hoehe: 1440, skala: 1 },
  { id: 'og',              datei: 'og-bild-1200x630.png',                 breite: 1200, hoehe: 630,  skala: 1 },
];
const VARIANTEN = [
  { id: 'foto',   ordner: AUSGABE },
  { id: 'grafik', ordner: path.join(AUSGABE, 'ohne-foto') },
];

async function fotoBereitstellen() {
  if (fs.existsSync(FOTO)) return;
  fs.mkdirSync(path.dirname(FOTO), { recursive: true });
  process.stdout.write('Lade Foto ... ');
  const antwort = await fetch(FOTO_URL);
  if (!antwort.ok) throw new Error('Foto-Download fehlgeschlagen: HTTP ' + antwort.status);
  fs.writeFileSync(FOTO, Buffer.from(await antwort.arrayBuffer()));
  console.log('ok');
}

function adresse(format, variante) {
  return 'file:///' + VORLAGE.replace(/\\/g, '/') + '?format=' + format + '&variante=' + variante;
}

function chrome(args) {
  return execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    '--allow-file-access-from-files', '--user-data-dir=' + PROFIL, '--virtual-time-budget=4000',
    ...args,
  ], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
}

function rendern(f, v) {
  fs.mkdirSync(v.ordner, { recursive: true });
  const ziel = path.join(v.ordner, f.datei);
  chrome([
    '--force-device-scale-factor=' + f.skala,
    '--window-size=' + f.breite + ',' + f.hoehe,
    '--screenshot=' + ziel,
    adresse(f.id, v.id),
  ]);
  const kb = Math.round(fs.statSync(ziel).size / 1024);
  console.log(`${path.relative(process.cwd(), ziel)}  ${f.breite * f.skala}x${f.hoehe * f.skala}  ${kb} KB`);
}

function schriftPruefen() {
  const dom = chrome(['--dump-dom', adresse('facebook', 'grafik')]);
  const treffer = dom.match(/data-schrift="([^"]+)"/);
  console.log('Schrift:', treffer ? treffer[1] : 'unbekannt');
  if (!treffer || treffer[1] !== 'figtree') throw new Error('Figtree wurde nicht geladen – figtree.css pruefen');
}

(async () => {
  const argumente = process.argv.slice(2);
  const pruefen = argumente.includes('--pruefen');
  const nur = argumente.filter(a => !a.startsWith('--'));
  const formate = nur.length ? FORMATE.filter(f => nur.includes(f.id)) : FORMATE;
  if (!formate.length) throw new Error('Unbekanntes Format. Bekannt: ' + FORMATE.map(f => f.id).join(', '));

  await fotoBereitstellen();
  if (pruefen) schriftPruefen();
  for (const v of VARIANTEN) for (const f of formate) rendern(f, v);
})().catch(e => { console.error(e.message); process.exit(1); });
