/* =========================================================================
   Stimme aus ElevenLabs

       ELEVENLABS_API_KEY=...  ELEVENLABS_VOICE_ID=...  npm run stimme
       npm run stimme -- zwei-termine        nur ein Reel

   Erzeugt fuer jede Szene mit "stimme" eine MP3 unter public/audio/
   und ueberspringt, was schon da ist. Der Schluessel kommt NUR aus der
   Umgebung – nie aus einer Datei im Repository, nie aus dem Chat.

   Ohne ELEVENLABS_VOICE_ID listet das Skript die verfuegbaren Stimmen
   des Kontos und bricht ab, damit bewusst eine gewaehlt wird.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REELS } from "./src/reels.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ZIEL = path.join(HIER, "public", "audio");
const API = "https://api.elevenlabs.io/v1";
const SCHLUESSEL = process.env.ELEVENLABS_API_KEY;
const STIMME = process.env.ELEVENLABS_VOICE_ID;
const MODELL = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const NUR = process.argv[2];

/* Kein process.exit() mitten in einer laufenden Anfrage – das laesst Node
   unter Windows beim Beenden mit einer libuv-Assertion abstuerzen. */
function abbruch(text) { console.error("\n" + text + "\n"); process.exitCode = 1; throw new Error(text.split("\n")[0]); }

if (!SCHLUESSEL) abbruch(
  "Kein ELEVENLABS_API_KEY in der Umgebung.\n" +
  "PowerShell:   $env:ELEVENLABS_API_KEY = \"...\"   (nur fuer dieses Fenster)\n" +
  "Den Schluessel bitte nicht in den Chat und nicht in eine Datei im Repository."
);

async function anfrage(pfad, optionen = {}) {
  const r = await fetch(API + pfad, { ...optionen, headers: { "xi-api-key": SCHLUESSEL, ...(optionen.headers || {}) } });
  if (!r.ok) abbruch("ElevenLabs antwortet mit HTTP " + r.status + " fuer " + pfad + ":\n" + (await r.text()).slice(0, 400));
  return r;
}

if (!STIMME) {
  const { voices } = await (await anfrage("/voices")).json();
  console.log("\nKeine ELEVENLABS_VOICE_ID gesetzt. Verfuegbare Stimmen:\n");
  voices.forEach((v) => {
    const l = v.labels || {};
    console.log("  " + v.voice_id + "  " + v.name.padEnd(18) + [l.gender, l.age, l.accent, l.description].filter(Boolean).join(", "));
  });
  abbruch("Eine davon waehlen:  $env:ELEVENLABS_VOICE_ID = \"<voice_id>\"\nFuer Deutsch eignet sich jede Stimme mit dem Modell " + MODELL + ".");
}

fs.mkdirSync(ZIEL, { recursive: true });

let erzeugt = 0, uebersprungen = 0;
for (const reel of REELS) {
  if (NUR && reel.id !== NUR) continue;
  for (const szene of reel.szenen) {
    if (!szene.stimme) continue;
    const datei = path.join(ZIEL, `${reel.id}-${szene.id}.mp3`);
    if (fs.existsSync(datei)) { uebersprungen++; continue; }

    const r = await anfrage(`/text-to-speech/${STIMME}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: szene.stimme,
        model_id: MODELL,
        /* Sprache erzwingen koennen nur die Turbo- und Flash-Modelle; das
           Mehrsprachen-Modell erkennt sie selbst und weist den Parameter ab. */
        ...(/turbo|flash/.test(MODELL) ? { language_code: reel.sprache === "en" ? "en" : "de" } : {}),
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }
      })
    });
    fs.writeFileSync(datei, Buffer.from(await r.arrayBuffer()));
    erzeugt++;
    console.log("  " + path.basename(datei).padEnd(34) + " " + szene.stimme.slice(0, 48) + (szene.stimme.length > 48 ? "…" : ""));
  }
}
console.log(`\n${erzeugt} Tonspuren erzeugt, ${uebersprungen} bereits vorhanden.\n`);
