/* =========================================================================
   Hintergrundmusik fuer die Reels – mit der Musik-Schnittstelle von
   ElevenLabs erzeugt (POST /v1/music, instrumental), einmalig, danach
   wiederverwendet. Ueber die Instagram-Schnittstelle laesst sich keine
   Musik aus der Instagram-Bibliothek anhaengen; die Musik liegt darum im
   Video selbst, leise unter der Stimme (src/Reel.jsx, Hintergrundmusik).

   Rechte: Auf bezahlten ElevenLabs-Plaenen sind erzeugte Stuecke fuer
   Social Media kommerziell nutzbar; auf dem Gratisplan nicht. Die Dateien
   liegen in public/musik/ und sind vom Repository ausgenommen (wie die
   Fotos), damit sie nicht oeffentlich weiterverteilt werden.

       node funnel/musik.js erzeugen          fehlende ElevenLabs-Stuecke erzeugen
       node funnel/musik.js erzeugen ruhig-1  nur dieses (neu, falls vorhanden: --neu)
       node funnel/musik.js eigene            Ersatzstuecke im Code erzeugen (ohne ElevenLabs)
       node funnel/musik.js liste             Stuecke, Stimmung, vorhanden?

   Der ElevenLabs-Schluessel braucht dafuer die Berechtigung "Music"
   (music_generation); ohne sie antwortet die Schnittstelle mit 401.

   Kosten: rund 900 Credits je Minute; alle Stuecke zusammen rund
   4 Minuten, also einmalig rund 3'600 Credits.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { GEHEIM, WURZEL } from "./konfig.js";
import { eigenesStueck } from "./musik-synth.js";

export const MUSIK_ORDNER = path.join(WURZEL, "public", "musik");

/* Gemeinsame Vorgaben: Bett unter einer Sprechstimme – keine Vocals, keine
   Drops, gleichmaessige Lautstaerke, wenig Mitten, damit die Stimme klar
   bleibt. Laenge 50 s: laenger als jedes Reel (Ziel 15–35 s). */
const BETT = "Instrumental background music bed for a spoken voice-over on a Swiss health insurance explainer video. No vocals, no choir, no spoken words. Steady energy from start to end, no build-ups, no drops, no sudden changes, soft dynamics, uncluttered midrange so a voice stays clear on top. Clean, modern, trustworthy.";

export const STUECKE = [
  { name: "ruhig-1", stimmung: "ruhig", prompt: `${BETT} Calm, warm, slightly optimistic: soft felt piano, gentle plucked synth, light shaker, around 90 BPM.` },
  { name: "ruhig-2", stimmung: "ruhig", prompt: `${BETT} Calm and curious: mellow electric piano chords, soft marimba accents, subtle warm pad, around 95 BPM.` },
  { name: "hell-1", stimmung: "hell", prompt: `${BETT} Light, upbeat and friendly, like a modern fintech app: bright plucks, muted guitar, soft claps on 2 and 4, gentle sub bass, around 110 BPM.` },
  { name: "hell-2", stimmung: "hell", prompt: `${BETT} Positive and clear, light lo-fi house feel: warm keys, soft four-on-the-floor kick at low volume, airy pad, around 115 BPM.` },
  { name: "puls-1", stimmung: "puls", prompt: `${BETT} Focused and slightly urgent, like a ticking deadline but not stressful: muted pulsing synth arpeggio, soft clock-like percussion, low warm bass, minor-to-major feel, around 105 BPM.` },
  { name: "warm-1", stimmung: "warm", prompt: `${BETT} Warm and hopeful storytelling mood: acoustic guitar fingerpicking, soft piano, light strings pad, around 85 BPM.` }
];
const LAENGE_MS = 50_000;

/* Ersatz ohne ElevenLabs: im Code erzeugte Stuecke (funnel/musik-synth.js),
   je Stimmung eines. musikFuer nimmt sie nur, wenn fuer die Stimmung kein
   ElevenLabs-Stueck vorliegt. */
export const EIGENE = ["ruhig", "hell", "puls", "warm"].map((stimmung) => ({ name: `eigen-${stimmung}`, stimmung, eigen: true }));

/* Welches Format welche Stimmung bekommt. */
const STIMMUNG_JE_FORMAT = {
  countdown: "puls", einwand: "puls",
  geschichte: "warm",
  alter: "hell", franchise: "hell", unfall: "hell", flexibel: "hell", regionen: "hell", modelle: "hell", kantone: "hell",
  stamm: "ruhig", mythos: "ruhig"
};

export const musikDatei = (name) => path.join(MUSIK_ORDNER, `${name}.mp3`);
export const musikVorhanden = (name) => fs.existsSync(musikDatei(name));

/* Fester Streuwert aus einem Text (gleiches Reel, gleiches Stueck). */
const streu = (text) => [...String(text)].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381);

/* Stueck fuer ein Reel: Stimmung nach Format, innerhalb der Stimmung fest
   nach Reel-Id. Nur Stuecke, die auf der Platte liegen; sonst eines aus
   einer anderen Stimmung, sonst null (dann ohne Musik). */
export function musikFuer(format, reelId) {
  const stimmung = STIMMUNG_JE_FORMAT[format] || "ruhig";
  const eleven = STUECKE.filter((s) => musikVorhanden(s.name));
  const eigene = EIGENE.filter((s) => musikVorhanden(s.name));
  const auswahl = [eleven.filter((s) => s.stimmung === stimmung), eigene.filter((s) => s.stimmung === stimmung), eleven, eigene].find((l) => l.length);
  if (!auswahl) return null;
  return auswahl[streu(reelId) % auswahl.length].name;
}

/* Eigene Stuecke erzeugen (ohne ElevenLabs, wenige Sekunden). */
export function eigeneErzeugen({ neu = false, melden = console.log } = {}) {
  fs.mkdirSync(MUSIK_ORDNER, { recursive: true });
  let n = 0;
  for (const s of EIGENE) {
    if (musikVorhanden(s.name) && !neu) { melden(`  ${s.name.padEnd(12)} vorhanden`); continue; }
    eigenesStueck(s.stimmung, musikDatei(s.name));
    verzeichnisSchreiben({ name: s.name, stimmung: s.stimmung, erzeugt: new Date().toISOString(), quelle: "funnel/musik-synth.js (eigene Komposition, keine fremden Rechte)" });
    melden(`  ${s.name.padEnd(12)} erzeugt`);
    n++;
  }
  return n;
}

/* Reel fuer den Render vorbereiten: Musik (Datei relativ zu public/) und
   Lautstaerke setzen – oder weglassen, wenn ausgeschaltet. */
export function musikSetzen(reel, format, { an = true, lautstaerke = 0.12 } = {}) {
  if (!an) return { ...reel, musik: null };
  const name = musikFuer(format, reel.id);
  return name ? { ...reel, musik: { datei: `musik/${name}.mp3`, name, lautstaerke } } : { ...reel, musik: null };
}

async function stueckErzeugen(stueck) {
  if (!GEHEIM.elevenlabsKey) throw new Error("Kein ELEVENLABS_API_KEY in der Umgebung.");
  const r = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": GEHEIM.elevenlabsKey, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ prompt: stueck.prompt, music_length_ms: LAENGE_MS, force_instrumental: true, model_id: "music_v1" })
  });
  if (!r.ok) {
    const text = (await r.text()).slice(0, 400);
    const hinweis = r.status === 401 && /permission/i.test(text) ? " – dem Schluessel fehlt die Berechtigung fuer Musik (ElevenLabs ▸ API-Schluessel ▸ Music)." : "";
    throw new Error(`ElevenLabs Musik: HTTP ${r.status}: ${text}${hinweis}`);
  }
  const daten = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(MUSIK_ORDNER, { recursive: true });
  const datei = musikDatei(stueck.name);
  fs.writeFileSync(datei + ".teil", daten);
  fs.renameSync(datei + ".teil", datei);
  return { bytes: daten.length, songId: r.headers.get("song-id") || r.headers.get("x-song-id") || null };
}

/* Verzeichnis der Stuecke mit Prompt und Herkunft – fuer spaeter, falls
   jemand wissen will, woher ein Stueck stammt. */
function verzeichnisSchreiben(eintrag) {
  const datei = path.join(MUSIK_ORDNER, "musik.json");
  let v = {};
  try { v = JSON.parse(fs.readFileSync(datei, "utf8")); } catch (e) { /* neu */ }
  v[eintrag.name] = eintrag;
  fs.writeFileSync(datei, JSON.stringify(v, null, 2) + "\n");
}

export async function musikErzeugen({ nur = null, neu = false, melden = console.log } = {}) {
  let n = 0;
  for (const s of STUECKE) {
    if (nur && s.name !== nur) continue;
    if (musikVorhanden(s.name) && !neu) { melden(`  ${s.name.padEnd(8)} vorhanden`); continue; }
    const e = await stueckErzeugen(s);
    verzeichnisSchreiben({ name: s.name, stimmung: s.stimmung, prompt: s.prompt, laengeMs: LAENGE_MS, modell: "music_v1", songId: e.songId, erzeugt: new Date().toISOString(), quelle: "ElevenLabs Music API" });
    melden(`  ${s.name.padEnd(8)} erzeugt (${Math.round(e.bytes / 1024)} KB)`);
    n++;
  }
  return n;
}

/* ----------------------------------------------------- Kommandozeile */
const alsSkript = process.argv[1] && /funnel[\\/]musik\.js$/.test(process.argv[1]);
if (alsSkript) {
  const [befehl, name] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const neu = process.argv.includes("--neu");
  try {
    if (befehl === "erzeugen") {
      const n = await musikErzeugen({ nur: name || null, neu });
      console.log(`\n${n} Stuecke erzeugt.`);
    } else if (befehl === "eigene") {
      const n = eigeneErzeugen({ neu });
      console.log(`\n${n} eigene Stuecke erzeugt.`);
    } else if (befehl === "liste") {
      for (const s of [...STUECKE, ...EIGENE]) console.log(`  ${s.name.padEnd(12)} ${s.stimmung.padEnd(6)} ${s.eigen ? "eigen     " : "ElevenLabs"} ${musikVorhanden(s.name) ? "vorhanden" : "fehlt"}`);
    } else {
      console.log("Befehle: erzeugen [name] [--neu] (ElevenLabs) | eigene [--neu] | liste");
    }
  } catch (e) {
    console.error("\n" + e.message + "\n");
    process.exitCode = 1;
  }
}
