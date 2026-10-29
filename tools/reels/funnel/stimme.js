/* =========================================================================
   Stimme aus ElevenLabs – als Baustein fuer stimme.js (Stamm-Reels) und
   tag.js (Tagesreels), dazu eine Kommandozeile fuer die Stimmenwahl.

   Erzeugt fuer jede Szene mit "stimme" eine MP3 <ordner>/<reelId>-<szene>.mp3
   und ueberspringt, was schon da ist. Der Schluessel kommt NUR aus der
   Umgebung (ELEVENLABS_API_KEY), die Stimme aus ELEVENLABS_VOICE_ID.

   Welche Stimme in einem Audio-Ordner liegt, steht in <ordner>/stimme.json.
   Aendert sich ELEVENLABS_VOICE_ID, wandern die alten Tonspuren nach
   <ordner>-alt/<alte Stimme>/ und werden beim naechsten Lauf neu erzeugt –
   so mischen sich nie zwei Stimmen, und ein Wechsel ist ein Eintrag in der
   Umgebung (setx ELEVENLABS_VOICE_ID <id>).

   Kommandozeile (Schluessel braucht dafuer voices_read bzw. voices_write):
     node funnel/stimme.js suchen [de] [--weiblich|--maennlich] [--suche=Wort]
                                       deutsche Stimmen der Voice Library
     node funnel/stimme.js hinzufuegen <besitzer> <voice_id> [Name]
                                       eine Library-Stimme ins Konto uebernehmen
     node funnel/stimme.js probe <voice_id> "<Satz>"
                                       Hoerprobe nach out/stimme-probe-<id>.mp3
     node funnel/stimme.js stand       welche Stimme liegt in welchem Ordner
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { GEHEIM, WURZEL, AUDIO_ORDNER, maskiert } from "./konfig.js";

const API = "https://api.elevenlabs.io/v1";
const MARKER = "stimme.json";

export class StimmeFehler extends Error {}

async function anfrage(pfad, optionen = {}) {
  const r = await fetch(API + pfad, { ...optionen, headers: { "xi-api-key": GEHEIM.elevenlabsKey, ...(optionen.headers || {}) } });
  if (!r.ok) {
    const text = (await r.text()).slice(0, 400);
    const hinweis = r.status === 401 && /missing_permissions/.test(text)
      ? " – dem Schluessel fehlt eine Berechtigung (ElevenLabs ▸ API Keys ▸ Schluessel bearbeiten ▸ Voices lesen/schreiben)."
      : "";
    throw new StimmeFehler(`ElevenLabs antwortet mit HTTP ${r.status} fuer ${pfad}: ${text}${hinweis}`);
  }
  return r;
}

export async function stimmenAuflisten() {
  const { voices } = await (await anfrage("/voices")).json();
  return voices.map((v) => {
    const l = v.labels || {};
    return { id: v.voice_id, name: v.name, merkmale: [l.gender, l.age, l.accent, l.language, l.description].filter(Boolean).join(", ") };
  });
}

/* Voice Library (geteilte Stimmen) nach Sprache durchsuchen – die
   meistgenutzten zuerst. Diese Stimmen muessen vor dem Gebrauch mit
   stimmeHinzufuegen ins eigene Konto uebernommen werden. */
export async function stimmenSuchen({ sprache = "de", geschlecht = null, suche = null, anzahl = 20 } = {}) {
  const p = new URLSearchParams({ language: sprache, page_size: String(Math.min(100, anzahl * 2)) });
  if (geschlecht) p.set("gender", geschlecht);
  if (suche) p.set("search", suche);
  const { voices } = await (await anfrage("/shared-voices?" + p.toString())).json();
  return (voices || [])
    .map((v) => ({
      id: v.voice_id, besitzer: v.public_owner_id, name: v.name, geschlecht: v.gender, alter: v.age, akzent: v.accent,
      beschreibung: [v.descriptive, v.use_case].filter(Boolean).join(", "), kategorie: v.category, sprache: v.language, locale: v.locale,
      genutzt: v.cloned_by_count || 0, vorschau: v.preview_url || null, kuendigungsfrist: v.notice_period || 0
    }))
    .sort((a, b) => b.genutzt - a.genutzt)
    .slice(0, anzahl);
}

/* Eine Library-Stimme ins Konto uebernehmen; liefert die Voice-Id, die
   danach als ELEVENLABS_VOICE_ID gilt. */
export async function stimmeHinzufuegen(besitzer, voiceId, name) {
  const d = await (await anfrage(`/voices/add/${besitzer}/${voiceId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_name: name || "Reels Deutsch" })
  })).json();
  return d.voice_id || voiceId;
}

async function sprechen(stimme, text, modell, sprache = "de") {
  const r = await anfrage(`/text-to-speech/${stimme}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: modell,
      /* Sprache erzwingen koennen nur die Turbo- und Flash-Modelle; das
         Mehrsprachen-Modell erkennt sie selbst und weist den Parameter ab. */
      ...(/turbo|flash/.test(modell) ? { language_code: sprache } : {}),
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }
    })
  });
  return Buffer.from(await r.arrayBuffer());
}

/* Hoerprobe: ein Satz mit einer bestimmten Stimme, als MP3 auf die Platte. */
export async function stimmeProbe(stimme, text, datei) {
  const daten = await sprechen(stimme, text, GEHEIM.elevenlabsModel);
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, daten);
  return { datei, zeichen: text.length, bytes: daten.length };
}

/* ------------------------------------------------ Stimme je Audio-Ordner */

export function stimmeImOrdner(ordner) {
  try { return JSON.parse(fs.readFileSync(path.join(ordner, MARKER), "utf8")); } catch (e) { return null; }
}
function markerSchreiben(ordner, stimme, modell) {
  fs.mkdirSync(ordner, { recursive: true });
  fs.writeFileSync(path.join(ordner, MARKER), JSON.stringify({ stimme, modell, seit: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
}
const mp3Dateien = (ordner) => (fs.existsSync(ordner) ? fs.readdirSync(ordner).filter((n) => n.endsWith(".mp3")) : []);

/* Hat sich die Stimme gegenueber dem Ordner geaendert? Dann die alten
   Tonspuren ins Archiv verschieben (<ordner>-alt/<alte Stimme>/), damit sie
   nie mehr in ein Video geraten; neue entstehen beim naechsten
   stimmenErzeugen. Ohne Marker gilt der Bestand als von der konfigurierten
   Stimme (Bestand vor dem 29.10.2026: Matilda) und bekommt den Marker. */
export function stimmenwechselPruefen(ordner, { melden = () => {} } = {}) {
  const stimme = GEHEIM.elevenlabsVoice;
  if (!stimme) return { gewechselt: false };
  const vorhanden = mp3Dateien(ordner);
  const m = stimmeImOrdner(ordner);
  if (!m) {
    if (vorhanden.length) markerSchreiben(ordner, stimme, GEHEIM.elevenlabsModel);
    return { gewechselt: false, bestand: vorhanden.length };
  }
  if (m.stimme === stimme) return { gewechselt: false, bestand: vorhanden.length };
  const ziel = path.join(path.dirname(ordner), path.basename(ordner) + "-alt", m.stimme);
  fs.mkdirSync(ziel, { recursive: true });
  for (const n of vorhanden) fs.renameSync(path.join(ordner, n), path.join(ziel, n));
  markerSchreiben(ordner, stimme, GEHEIM.elevenlabsModel);
  melden(`Stimme gewechselt (${m.stimme} -> ${stimme}): ${vorhanden.length} Tonspuren nach ${path.relative(WURZEL, ziel).split(path.sep).join("/")} verschoben – sie werden mit der neuen Stimme neu erzeugt.`);
  return { gewechselt: true, verschoben: vorhanden.length, von: m.stimme };
}

/* Fehlende Tonspuren zaehlen – um vorab zu wissen, ob ein Schluessel
   ueberhaupt gebraucht wird. */
export function fehlendeTonspuren(reels, ordner) {
  let n = 0;
  for (const reel of reels) for (const s of reel.szenen) if (s.stimme && !fs.existsSync(path.join(ordner, `${reel.id}-${s.id}.mp3`))) n++;
  return n;
}

/* reels: Objekte wie in src/reels.js; ordner: absoluter Zielordner.
   Liefert { erzeugt, uebersprungen, zeichen }. Wirft StimmeFehler, wenn
   der Schluessel fehlt und etwas zu erzeugen waere. */
export async function stimmenErzeugen(reels, { ordner, nur = null, melden = () => {} }) {
  const schluessel = GEHEIM.elevenlabsKey, stimme = GEHEIM.elevenlabsVoice, modell = GEHEIM.elevenlabsModel;
  stimmenwechselPruefen(ordner, { melden });
  if (fehlendeTonspuren(reels, ordner) === 0) return { erzeugt: 0, uebersprungen: reels.reduce((n, r) => n + r.szenen.filter((s) => s.stimme).length, 0), zeichen: 0 };
  if (!schluessel) throw new StimmeFehler(
    "Kein ELEVENLABS_API_KEY in der Umgebung.\n" +
    "PowerShell:   $env:ELEVENLABS_API_KEY = \"...\"   (nur fuer dieses Fenster)\n" +
    "Dauerhaft fuer die Aufgabenplanung: zeitplan-einrichten.ps1 fragt danach.\n" +
    "Den Schluessel bitte nicht in den Chat und nicht in eine Datei im Repository."
  );
  if (!stimme) {
    const liste = await stimmenAuflisten();
    throw new StimmeFehler(
      "Keine ELEVENLABS_VOICE_ID gesetzt. Stimmen im Konto:\n" +
      liste.map((v) => `  ${v.id}  ${v.name.padEnd(18)} ${v.merkmale}`).join("\n") +
      "\nEine deutsche waehlen (node funnel/stimme.js suchen de) und setzen:  setx ELEVENLABS_VOICE_ID <voice_id>"
    );
  }
  fs.mkdirSync(ordner, { recursive: true });
  if (!stimmeImOrdner(ordner)) markerSchreiben(ordner, stimme, modell);

  let erzeugt = 0, uebersprungen = 0, zeichen = 0;
  for (const reel of reels) {
    if (nur && reel.id !== nur) continue;
    for (const szene of reel.szenen) {
      if (!szene.stimme) continue;
      const datei = path.join(ordner, `${reel.id}-${szene.id}.mp3`);
      if (fs.existsSync(datei)) { uebersprungen++; continue; }
      const daten = await sprechen(stimme, szene.stimme, modell, reel.sprache === "en" ? "en" : "de");
      /* Erst vollstaendig lesen, dann schreiben – eine abgebrochene
         Verbindung darf keine halbe MP3 hinterlassen, die spaeter als
         "vorhanden" gilt. */
      fs.writeFileSync(datei + ".teil", daten);
      fs.renameSync(datei + ".teil", datei);
      erzeugt++;
      zeichen += szene.stimme.length;
      melden(`${path.basename(datei).padEnd(40)} ${szene.stimme.slice(0, 48)}${szene.stimme.length > 48 ? "…" : ""}`);
    }
  }
  return { erzeugt, uebersprungen, zeichen };
}

/* ----------------------------------------------------- Kommandozeile */
/* Nur, wenn diese Datei selbst gestartet wird – stimme.js im Stamm und
   tag.js laden sie als Modul. */
const alsSkript = process.argv[1] && /funnel[\\/]stimme\.js$/.test(process.argv[1]);
if (alsSkript) {
  const [befehl, ...rest] = process.argv.slice(2);
  const schalter = rest.filter((t) => t.startsWith("--"));
  const werte = rest.filter((t) => !t.startsWith("--"));
  const wert = (name) => (schalter.find((t) => t.startsWith(`--${name}=`)) || "").split("=").slice(1).join("=") || null;
  try {
    if (befehl === "suchen") {
      if (!GEHEIM.elevenlabsKey) throw new StimmeFehler("Kein ELEVENLABS_API_KEY in der Umgebung.");
      const geschlecht = schalter.includes("--weiblich") ? "female" : schalter.includes("--maennlich") ? "male" : null;
      const liste = await stimmenSuchen({ sprache: werte[0] || "de", geschlecht, suche: wert("suche"), anzahl: Number(wert("anzahl")) || 20 });
      if (!liste.length) console.log("Keine Stimmen gefunden.");
      for (const v of liste) {
        console.log(`${v.id}  ${v.name.padEnd(22)} ${(v.geschlecht || "").padEnd(7)} ${(v.alter || "").padEnd(12)} ${(v.akzent || v.locale || "").padEnd(14)} ${String(v.genutzt).padStart(6)}x  ${v.beschreibung}`);
        console.log(`    Besitzer ${v.besitzer}${v.vorschau ? "  Hoerprobe " + v.vorschau : ""}`);
      }
      console.log("\nUebernehmen:  node funnel/stimme.js hinzufuegen <Besitzer> <voice_id> \"Name\"   – danach: setx ELEVENLABS_VOICE_ID <voice_id>");
    } else if (befehl === "hinzufuegen") {
      const [besitzer, id, name] = werte;
      if (!besitzer || !id) throw new StimmeFehler("Aufruf: node funnel/stimme.js hinzufuegen <besitzer> <voice_id> [Name]");
      const neu = await stimmeHinzufuegen(besitzer, id, name);
      console.log(`Stimme im Konto: ${neu}\nJetzt setzen (neues Fenster danach):  setx ELEVENLABS_VOICE_ID ${neu}`);
    } else if (befehl === "probe") {
      const [id, ...text] = werte;
      if (!id || !text.length) throw new StimmeFehler("Aufruf: node funnel/stimme.js probe <voice_id> \"<Satz>\"");
      const datei = path.join(WURZEL, "out", `stimme-probe-${id}.mp3`);
      const e = await stimmeProbe(id, text.join(" "), datei);
      console.log(`Hoerprobe (${e.zeichen} Zeichen): ${path.relative(process.cwd(), e.datei)}`);
    } else if (befehl === "stand") {
      console.log(`Konfiguriert: ELEVENLABS_VOICE_ID ${GEHEIM.elevenlabsVoice || "(leer)"}, Modell ${GEHEIM.elevenlabsModel}, Schluessel ${maskiert(GEHEIM.elevenlabsKey)}`);
      for (const ordner of [path.join(WURZEL, "public", "audio"), path.join(WURZEL, "public", AUDIO_ORDNER)]) {
        const w = stimmenwechselPruefen(ordner, { melden: console.log });
        const m = stimmeImOrdner(ordner);
        console.log(`${path.relative(WURZEL, ordner).split(path.sep).join("/").padEnd(18)} ${mp3Dateien(ordner).length} Tonspuren, Stimme ${m ? m.stimme + " (seit " + m.seit + ")" : "unbekannt"}${w.gewechselt ? " – soeben gewechselt" : ""}`);
      }
    } else {
      console.log("Befehle: suchen [de] [--weiblich|--maennlich] [--suche=Wort] | hinzufuegen <besitzer> <voice_id> [Name] | probe <voice_id> \"<Satz>\" | stand");
    }
  } catch (e) {
    console.error("\n" + (e instanceof StimmeFehler ? e.message : e.stack) + "\n");
    process.exitCode = 1;
  }
}
