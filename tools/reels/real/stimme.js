/* =========================================================================
   Serie «Echt» – Stimme: je Reel EINE Tonspur fuer den ganzen Text, mit
   Zeitstempeln (ElevenLabs /with-timestamps).

   Warum anders als im Funnel: Dort entsteht je Szene ein kurzer Schnipsel,
   bei dem das Modell die Sprache selbst erraet – bei kurzen Saetzen und
   Woertern wie «Franchise» oder «Swisspremia» rutscht es ins Englische.
   Hier: ganzer Text in einem Zug, Zahlen ausgeschrieben, Sprechfassung in
   deutscher Schreibweise (real/skripte.js: sprich).

   Seit 13.11.2026 spricht Marcus, ein deutscher Radio- und Werbesprecher
   (Stimmklon eines Muttersprachlers), mit eleven_multilingual_v2 – dem
   Modell, das die Aussprache des Sprechers am treuesten wiedergibt. Davor:
   Mila mit eleven_v3 (dCnu06FiOZma2KVNUoPZ); der Nutzer hoerte dort keine
   deutsche Aussprache. language_code "de" geht nur an Modelle, die ihn
   annehmen (v3, Turbo/Flash 2.5); Multilingual v2 weist ihn ab.

       node real/stimme.js                 alle fehlenden Tonspuren
       node real/stimme.js brief --neu     eine neu erzeugen
       node real/stimme.js --probe=<voice_id>:<name> [id]   Hoerprobe (Reel 1 oder <id>) nach out/real/proben/

   Stimme: REAL_VOICE_ID (Standard Marcus), Modell: REAL_MODEL_ID.
   Schluessel nur aus ELEVENLABS_API_KEY. Achtung: ohne <id> erzeugt der
   Aufruf alle Reels neu, deren Tonspur von einer anderen Stimme stammt.
   Ausgabe: public/real/ton/<id>.mp3 und real/zeiten/<id>.json
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REELS, bloecke, sprechtext } from "./skripte.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const TON_ORDNER = path.join(WURZEL, "public", "real", "ton");
export const ZEITEN_ORDNER = path.join(HIER, "zeiten");
export const STIMME = process.env.REAL_VOICE_ID || "vGWWh1bodhwwi4yHd6qZ";   // Marcus – deutscher Radio- und Werbesprecher
export const MODELL = process.env.REAL_MODEL_ID || "eleven_multilingual_v2";
const MIT_SPRACHCODE = /v3|turbo_v2_5|flash_v2_5/.test(MODELL);
/* Sprechtempo (0.7 bis 1.2): Marcus spricht ruhig, mit 1.1 bleibt ein Reel bei rund 25 Sekunden. */
const TEMPO = Number(process.env.REAL_TEMPO) || (MIT_SPRACHCODE ? 1 : 1.1);

async function sprechen(text, stimme = STIMME) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Kein ELEVENLABS_API_KEY in der Umgebung.");
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${stimme}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODELL, ...(MIT_SPRACHCODE ? { language_code: "de" } : {}), voice_settings: { stability: 0.5, similarity_boost: 0.8, style: MIT_SPRACHCODE ? 0.15 : 0, use_speaker_boost: true, ...(TEMPO !== 1 ? { speed: TEMPO } : {}) } })
  });
  if (!r.ok) throw new Error(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { audio: Buffer.from(j.audio_base64, "base64"), a: j.alignment };
}

/* Zeiten je Untertitel-Block aus den Zeichen-Zeitstempeln. Der Text ist
   die Bloecke, mit Leerzeichen verbunden – jeder Block hat also einen
   festen Zeichenbereich. */
export function zeitenAus(reel, a) {
  const bl = bloecke(reel);
  const text = bl.map((b) => b.s).join(" ");
  const n = a.characters.length;
  const start = a.character_start_times_seconds, ende = a.character_end_times_seconds;
  const gesamt = ende[n - 1];
  const genau = a.characters.join("") === text;
  let pos = 0;
  const liste = bl.map((b) => {
    const von = pos, bis = pos + b.s.length - 1;
    pos += b.s.length + 1;
    /* Stimmt die Zeichenfolge nicht exakt (Normalisierung), anteilig umrechnen. */
    const i0 = genau ? von : Math.min(n - 1, Math.round((von / text.length) * n));
    const i1 = genau ? bis : Math.min(n - 1, Math.round((bis / text.length) * n));
    return { szene: b.szene, t: b.t, von: start[i0], bis: ende[i1] };
  });
  return { gesamt, genau, bloecke: liste };
}

export async function tonErzeugen(reel, { neu = false, melden = console.log } = {}) {
  fs.mkdirSync(TON_ORDNER, { recursive: true });
  fs.mkdirSync(ZEITEN_ORDNER, { recursive: true });
  const mp3 = path.join(TON_ORDNER, `${reel.id}.mp3`), json = path.join(ZEITEN_ORDNER, `${reel.id}.json`);
  if (!neu && fs.existsSync(mp3) && fs.existsSync(json)) { const z = JSON.parse(fs.readFileSync(json, "utf8")); if (z.text === sprechtext(reel) && z.stimme === STIMME && z.modell === MODELL) return z; }
  const text = sprechtext(reel);
  const { audio, a } = await sprechen(text);
  const z = { id: reel.id, stimme: STIMME, modell: MODELL, tempo: TEMPO, text, zeichen: text.length, ...zeitenAus(reel, a) };
  fs.writeFileSync(mp3, audio);
  fs.writeFileSync(json, JSON.stringify(z, null, 1));
  melden(`  ${reel.id.padEnd(16)} ${z.gesamt.toFixed(1)} s, ${text.length} Zeichen${z.genau ? "" : " (Zeiten anteilig)"}`);
  return z;
}

const alsSkript = process.argv[1] && /real[\\/]stimme\.js$/.test(process.argv[1]);
if (alsSkript) {
  const arg = process.argv.slice(2);
  const probe = arg.find((x) => x.startsWith("--probe="));
  try {
    if (probe) {
      const [id, name] = probe.slice(8).split(":");
      const welches = arg.find((x) => !x.startsWith("--"));
      const reel = REELS.find((r) => r.id === welches) || REELS[0];
      const { audio } = await sprechen(sprechtext(reel), id);
      const ziel = path.join(WURZEL, "out", "real", "proben");
      fs.mkdirSync(ziel, { recursive: true });
      const datei = `stimme-${name || id}${welches ? "-" + reel.id : ""}.mp3`;
      fs.writeFileSync(path.join(ziel, datei), audio);
      console.log(`Probe: out/real/proben/${datei} (${sprechtext(reel).length} Zeichen)`);
    } else {
      const nur = arg.find((x) => !x.startsWith("--")), neu = arg.includes("--neu");
      let zeichen = 0;
      for (const reel of REELS) { if (nur && reel.id !== nur) continue; const z = await tonErzeugen(reel, { neu }); zeichen += z.zeichen; }
      console.log(`\nFertig, ${zeichen} Zeichen Sprechtext insgesamt.`);
    }
  } catch (e) { console.error("\n" + e.message + "\n"); process.exitCode = 1; }
}
