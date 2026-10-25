/* =========================================================================
   Tagesproduktion – einmal am Morgen (Aufgabenplanung) oder von Hand:

       node tag.js                         heute: planen, vertonen, rendern, hochladen
       node tag.js --nur-plan              nur den Plan anzeigen und speichern
       node tag.js --datum=2026-11-03      fuer einen anderen Tag
       node tag.js --anzahl=12             feste Anzahl statt Spanne aus funnel.json
       node tag.js --neu                   bestehenden Plan des Tages verwerfen
       node tag.js --ohne-stimme           stumm rendern (keine ElevenLabs-Kosten)
       node tag.js --ohne-upload           lokal lassen (kein Blob-Token noetig)
       node tag.js --nur=3                 nur Reel Nr. 3 des Plans bearbeiten

   Jeder Schritt merkt sich seinen Stand im Plan (plan/<datum>.json); ein
   zweiter Lauf am selben Tag macht nur, was noch fehlt. Das Posten
   uebernimmt posten.js, das alle paar Minuten laeuft.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { KONFIG, WURZEL, AUSGABE_ORDNER, AUDIO_ORDNER, GEHEIM } from "./funnel/konfig.js";
import { planLaden, planSpeichern, verlaufLaden, verlaufMerken, protokoll, aufraeumen, argumente } from "./funnel/zustand.js";
import { planErstellen } from "./funnel/redaktion.js";
import { stimmenErzeugen, StimmeFehler } from "./funnel/stimme.js";
import { reelRendern, mp4DauerMs, BROWSER } from "./funnel/rendern.js";
import { hochladen, erreichbar } from "./funnel/ablage.js";
import { datumKurz } from "./funnel/sprache.js";
import { verbunden } from "./funnel/instagram.js";

const arg = argumente();
const datum = arg.datum || datumKurz();
const ohneStimme = Boolean(arg["ohne-stimme"]) || KONFIG.stimme === "aus";
const nurNr = arg.nur ? Number(arg.nur) : null;
const start = Date.now();

function abbruch(text) { protokoll("FEHLER " + text); process.exitCode = 1; }

/* ------------------------------------------------------------ 1 Plan */
let plan = arg.neu ? null : planLaden(datum);
if (!plan) {
  plan = planErstellen(datum, KONFIG, { anzahl: arg.anzahl ? Number(arg.anzahl) : null, verlauf: verlaufLaden() });
  planSpeichern(plan);
  verlaufMerken(plan.reels.map((r) => r.schluessel), datum);
  protokoll(`Plan ${datum} erstellt: ${plan.reels.length} Reels (gewuenscht ${plan.gewuenscht}), Fenster ${KONFIG.postVon}–${KONFIG.postBis}.`);
} else {
  protokoll(`Plan ${datum} vorhanden (${plan.reels.length} Reels) – setze fort.`);
}
for (const h of plan.hinweise || []) protokoll("Hinweis: " + h);

console.log("");
console.log(" Nr  Zeit   Status          Gruppe  Format     Titel");
for (const r of plan.reels) {
  console.log(` ${String(r.nr).padStart(2)}  ${r.zeit}  ${r.status.padEnd(15)} ${r.gruppe.padEnd(7)} ${r.format.padEnd(10)} ${r.titel}${r.warnungen ? "   ! " + r.warnungen.join(" ") : ""}`);
}
console.log("");
if (arg["nur-plan"]) {
  console.log(`Plan gespeichert: ${path.relative(WURZEL, path.join(WURZEL, "plan", datum + ".json"))}`);
  process.exit(0);
}

const auswahl = plan.reels.filter((r) => !nurNr || r.nr === nurNr);
const offen = auswahl.filter((r) => r.status === "geplant");

/* ---------------------------------------------------------- 2 Stimme */
if (offen.length && !ohneStimme) {
  const gruppen = new Map();   // Audio-Ordner -> Reels
  for (const r of offen) {
    const ordner = path.join(WURZEL, "public", r.reel.audioOrdner || "audio");
    if (!gruppen.has(ordner)) gruppen.set(ordner, []);
    gruppen.get(ordner).push(r.reel);
  }
  for (const [ordner, reels] of gruppen) {
    try {
      const e = await stimmenErzeugen(reels, { ordner, melden: (z) => console.log("  Stimme  " + z) });
      if (e.erzeugt) protokoll(`Stimme: ${e.erzeugt} Tonspuren erzeugt (${e.zeichen} Zeichen), ${e.uebersprungen} vorhanden.`);
    } catch (e) {
      if (!(e instanceof StimmeFehler)) throw e;
      protokoll("Stimme uebersprungen – es wird stumm gerendert. " + e.message.split("\n")[0]);
      break;
    }
  }
} else if (offen.length) {
  protokoll("Stimme: ausgeschaltet – es wird stumm gerendert.");
}

/* ---------------------------------------------------------- 3 Rendern */
if (offen.length && !BROWSER) protokoll("Hinweis: kein installierter Chrome/Edge gefunden – Remotion versucht den mitgelieferten Browser.");
const tagesOrdner = path.join(AUSGABE_ORDNER, datum);
for (const r of offen) {
  const name = `${String(r.nr).padStart(2, "0")}-${r.reel.id}.mp4`;
  const ziel = path.join(tagesOrdner, name);
  try {
    let sekunden;
    if (fs.existsSync(ziel)) {
      sekunden = (mp4DauerMs(ziel) || 0) / 1000;
      console.log(`  Video   ${name} bereits vorhanden`);
    } else {
      process.stdout.write(`  Video   ${name} `);
      /* Welche Tonspuren liegen vor? Das erspart dem Browser die Suche
         nach fehlenden Dateien (und die 404-Meldungen im Protokoll). */
      const audioOrdner = path.join(WURZEL, "public", r.reel.audioOrdner || "audio");
      const tonVorhanden = r.reel.szenen.filter((s) => fs.existsSync(path.join(audioOrdner, `${r.reel.id}-${s.id}.mp3`))).map((s) => s.id);
      sekunden = await reelRendern({ ...r.reel, tonVorhanden }, ziel, { melden: (z) => console.log("          " + z), fortschritt: (p) => process.stdout.write(p + "% ") });
      console.log(`fertig${tonVorhanden.length ? "" : " (stumm)"}`);
    }
    r.datei = path.relative(WURZEL, ziel).split(path.sep).join("/");
    r.dauerSekunden = Math.round(sekunden * 10) / 10;
    r.coverMs = Math.round((mp4DauerMs(ziel) || sekunden * 1000) * (r.cover || 0.3));
    r.status = "gerendert";
    r.fehler = null;
    planSpeichern(plan);
    protokoll(`Gerendert #${r.nr} ${r.titel} (${r.dauerSekunden} s)`, { stumm: true });
  } catch (e) {
    r.fehler = "Render: " + (e.message || String(e)).split("\n")[0];
    planSpeichern(plan);
    protokoll(`FEHLER Render #${r.nr} ${r.titel}: ${r.fehler}`);
  }
}

/* -------------------------------------------------------- 4 Hochladen */
if (!arg["ohne-upload"]) {
  for (const r of auswahl.filter((x) => x.status === "gerendert")) {
    try {
      const quelle = path.join(WURZEL, r.datei);
      const url = await hochladen(quelle, path.join("reels", datum, path.basename(r.datei)));
      const probe = await erreichbar(url);
      if (!probe.ok) throw new Error(`URL nicht erreichbar (HTTP ${probe.status}${probe.fehler ? ", " + probe.fehler : ""}): ${url}`);
      r.url = url;
      r.status = "hochgeladen";
      r.fehler = null;
      planSpeichern(plan);
      console.log(`  Ablage  #${r.nr} ${url}`);
    } catch (e) {
      r.fehler = "Ablage: " + (e.message || String(e)).split("\n")[0];
      planSpeichern(plan);
      protokoll(`FEHLER Ablage #${r.nr} ${r.titel}: ${r.fehler}`);
    }
  }
} else {
  protokoll("Upload uebersprungen (--ohne-upload).");
}

/* -------------------------------------------------------- 5 Aufraeumen */
const geloescht = aufraeumen(KONFIG.aufbewahrungTage);
if (geloescht) protokoll(`Aufgeraeumt: ${geloescht} alte Ordner/Plaene (aelter als ${KONFIG.aufbewahrungTage} Tage).`);

/* ----------------------------------------------------------- Bilanz */
const bilanz = {};
for (const r of plan.reels) bilanz[r.status] = (bilanz[r.status] || 0) + 1;
const minuten = Math.round((Date.now() - start) / 6000) / 10;
protokoll(`Tag ${datum} nach ${minuten} Min.: ` + Object.entries(bilanz).map(([s, n]) => `${n} ${s}`).join(", "));
if (!verbunden()) protokoll("Instagram ist noch nicht verbunden (IG_USER_ID / IG_ACCESS_TOKEN fehlen) – posten.js kann nichts veroeffentlichen. Siehe FUNNEL.md.");
if (!GEHEIM.blobToken && KONFIG.ablage === "vercel-blob" && !arg["ohne-upload"]) protokoll("Kein BLOB_READ_WRITE_TOKEN – ohne Ablage kann Instagram die Videos nicht laden.");
if (plan.reels.some((r) => r.fehler)) process.exitCode = 1;
