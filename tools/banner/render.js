#!/usr/bin/env node
// Rendert Banner (vorlage.html) und Profilbilder (logo.html) mit Chrome headless.
//
//   node tools/banner/render.js              alles: sechs Banner in zwei Varianten, drei Logos
//   node tools/banner/render.js youtube      nur ein Format (Banner oder Logo, siehe ids unten)
//   node tools/banner/render.js --logos      nur die Logos
//   node tools/banner/render.js --pruefen    zusaetzlich melden, ob Figtree geladen wurde
//
// Ausgabe: marke/<datei>.png (Banner mit Foto, Logos) und marke/ohne-foto/<datei>.png.
//
// Fotos liegen in tools/banner/cache/ (in .gitignore) und werden beim ersten
// Lauf geladen: der Alpensee von Unsplash ueber seine Adresse, Pixabay-Fotos
// ueber die Bildsuche der Reels (tools/reels/funnel/pixabay.js, Schluessel
// PIXABAY_API_KEY aus der Nutzer-Umgebung). Pixabay liefert ueber die API
// hoechstens 1280 px Kantenlaenge – hinter dem Schleier reicht das.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HIER = __dirname;
const VORLAGE = path.join(HIER, 'vorlage.html');
const LOGO = path.join(HIER, 'logo.html');
const CACHE = path.join(HIER, 'cache');
const AUSGABE = path.join(HIER, '..', '..', 'marke');
const PROFIL = path.join(os.tmpdir(), 'swisspremia-banner-chrome');

// Fotos. Ein neues Pixabay-Motiv: Nummer aus der Bildadresse eintragen
// (Suche: im Ordner tools/reels  npm run recherche -- "<begriff>" --lang=en --format=quer).
const FOTOS = {
  // alpensee: das Hero-Foto der Website (Unsplash) – seit 15.11.2026 von keinem Format genutzt.
  alpensee:   { datei: 'alpensee.jpg', url: 'https://images.unsplash.com/photo-1527095655060-4026c4af2b25?auto=format&fit=crop&crop=entropy&w=2560&h=1440&q=80' },
  bachalpsee: { datei: 'pixabay-7572681.jpg', pixabay: 7572681 },   // Bachalpsee bei Grindelwald, Himmelstraeume
};

// skala 2 = doppelte Pixeldichte; LinkedIn zeigt den Firmenbanner mit 1128 CSS-Pixeln
// Breite und rechnet die 2256 px selbst herunter – so bleibt die Schrift scharf.
const FORMATE = [
  { id: 'facebook',        datei: 'facebook-titelbild-1640x624.png',      breite: 1640, hoehe: 624,  skala: 1, foto: 'bachalpsee' },
  { id: 'linkedin-firma',  datei: 'linkedin-banner-2256x382.png',         breite: 1128, hoehe: 191,  skala: 2, foto: 'bachalpsee' },
  { id: 'linkedin-profil', datei: 'linkedin-profil-banner-1584x396.png',  breite: 1584, hoehe: 396,  skala: 1, foto: 'bachalpsee' },
  { id: 'x',               datei: 'x-header-1500x500.png',                breite: 1500, hoehe: 500,  skala: 1, foto: 'bachalpsee' },
  { id: 'youtube',         datei: 'youtube-banner-2560x1440.png',         breite: 2560, hoehe: 1440, skala: 1, foto: 'bachalpsee' },
  { id: 'og',              datei: 'og-bild-1200x630.png',                 breite: 1200, hoehe: 630,  skala: 1, foto: 'bachalpsee' },
];
const VARIANTEN = [
  { id: 'foto',   ordner: AUSGABE },
  { id: 'grafik', ordner: path.join(AUSGABE, 'ohne-foto') },
];
// YouTube empfiehlt 800x800 fuers Kanalbild und 150x150 (unter 1 MB) fuers Wasserzeichen.
const LOGOS = [
  { id: 'kanalbild',        form: 'ring',          datei: 'youtube-kanalbild-800.png',         groesse: 800 },
  { id: 'kanalbild-kachel', form: 'kachel',        datei: 'youtube-kanalbild-kachel-800.png',  groesse: 800 },
  { id: 'wasserzeichen',    form: 'wasserzeichen', datei: 'youtube-wasserzeichen-150.png',     groesse: 150, durchsichtig: true },
];

async function fotoBereitstellen(name) {
  const foto = FOTOS[name];
  if (!foto) throw new Error('Unbekanntes Foto: ' + name);
  const ziel = path.join(CACHE, foto.datei);
  if (fs.existsSync(ziel)) return;
  fs.mkdirSync(CACHE, { recursive: true });
  process.stdout.write(`Lade Foto ${name} ... `);
  if (foto.pixabay) {
    const modul = path.join(HIER, '..', 'reels', 'funnel', 'pixabay.js');
    const { nachId, herunterladen } = await import(pathToFileURL(modul).href);
    const treffer = await nachId(foto.pixabay);
    await herunterladen(treffer.gross, ziel);
    console.log(`ok (Pixabay ${treffer.id}, ${treffer.autor})`);
    return;
  }
  const antwort = await fetch(foto.url);
  if (!antwort.ok) throw new Error('Foto-Download fehlgeschlagen: HTTP ' + antwort.status);
  fs.writeFileSync(ziel, Buffer.from(await antwort.arrayBuffer()));
  console.log('ok');
}

const dateiAdresse = (datei, parameter) =>
  'file:///' + datei.replace(/\\/g, '/') + '?' + new URLSearchParams(parameter);

function chrome(args) {
  return execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    '--allow-file-access-from-files', '--user-data-dir=' + PROFIL, '--virtual-time-budget=4000',
    ...args,
  ], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
}

function melden(ziel, breite, hoehe) {
  const kb = Math.round(fs.statSync(ziel).size / 1024);
  console.log(`${path.relative(process.cwd(), ziel)}  ${breite}x${hoehe}  ${kb} KB`);
}

function bannerRendern(f, v) {
  fs.mkdirSync(v.ordner, { recursive: true });
  const ziel = path.join(v.ordner, f.datei);
  chrome([
    '--force-device-scale-factor=' + f.skala,
    '--window-size=' + f.breite + ',' + f.hoehe,
    '--screenshot=' + ziel,
    dateiAdresse(VORLAGE, { format: f.id, variante: v.id, foto: FOTOS[f.foto].datei }),
  ]);
  melden(ziel, f.breite * f.skala, f.hoehe * f.skala);
}

function logoRendern(l) {
  const ziel = path.join(AUSGABE, l.datei);
  chrome([
    '--force-device-scale-factor=1',
    '--window-size=' + l.groesse + ',' + l.groesse,
    ...(l.durchsichtig ? ['--default-background-color=00000000'] : []),
    '--screenshot=' + ziel,
    dateiAdresse(LOGO, { form: l.form, groesse: l.groesse }),
  ]);
  melden(ziel, l.groesse, l.groesse);
}

function schriftPruefen() {
  const dom = chrome(['--dump-dom', dateiAdresse(VORLAGE, { format: 'facebook', variante: 'grafik' })]);
  const treffer = dom.match(/data-schrift="([^"]+)"/);
  console.log('Schrift:', treffer ? treffer[1] : 'unbekannt');
  if (!treffer || treffer[1] !== 'figtree') throw new Error('Figtree wurde nicht geladen – figtree.css pruefen');
}

(async () => {
  const argumente = process.argv.slice(2);
  const nurLogos = argumente.includes('--logos');
  const nur = argumente.filter(a => !a.startsWith('--'));
  const formate = nurLogos ? [] : nur.length ? FORMATE.filter(f => nur.includes(f.id)) : FORMATE;
  const logos = nurLogos || !nur.length ? LOGOS : LOGOS.filter(l => nur.includes(l.id));
  if (nur.length && !formate.length && !logos.length) {
    throw new Error('Unbekannt. Banner: ' + FORMATE.map(f => f.id).join(', ') + ' · Logos: ' + LOGOS.map(l => l.id).join(', '));
  }

  for (const name of new Set(formate.map(f => f.foto))) await fotoBereitstellen(name);
  if (argumente.includes('--pruefen')) schriftPruefen();
  for (const v of VARIANTEN) for (const f of formate) bannerRendern(f, v);
  for (const l of logos) logoRendern(l);
})().catch(e => { console.error(e.message); process.exit(1); });
