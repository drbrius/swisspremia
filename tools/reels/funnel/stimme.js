/* =========================================================================
   Stimme aus ElevenLabs – als Baustein fuer stimme.js (Stamm-Reels) und
   tag.js (Tagesreels).

   Erzeugt fuer jede Szene mit "stimme" eine MP3 <ordner>/<reelId>-<szene>.mp3
   und ueberspringt, was schon da ist. Der Schluessel kommt NUR aus der
   Umgebung (ELEVENLABS_API_KEY), die Stimme aus ELEVENLABS_VOICE_ID.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { GEHEIM } from "./konfig.js";

const API = "https://api.elevenlabs.io/v1";

export class StimmeFehler extends Error {}

async function anfrage(pfad, optionen = {}) {
  const r = await fetch(API + pfad, { ...optionen, headers: { "xi-api-key": GEHEIM.elevenlabsKey, ...(optionen.headers || {}) } });
  if (!r.ok) throw new StimmeFehler(`ElevenLabs antwortet mit HTTP ${r.status} fuer ${pfad}: ${(await r.text()).slice(0, 400)}`);
  return r;
}

export async function stimmenAuflisten() {
  const { voices } = await (await anfrage("/voices")).json();
  return voices.map((v) => {
    const l = v.labels || {};
    return { id: v.voice_id, name: v.name, merkmale: [l.gender, l.age, l.accent, l.description].filter(Boolean).join(", ") };
  });
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
      "Keine ELEVENLABS_VOICE_ID gesetzt. Verfuegbare Stimmen:\n" +
      liste.map((v) => `  ${v.id}  ${v.name.padEnd(18)} ${v.merkmale}`).join("\n") +
      `\nEine davon waehlen:  $env:ELEVENLABS_VOICE_ID = "<voice_id>"  (Deutsch geht mit jeder Stimme und dem Modell ${modell}).`
    );
  }
  fs.mkdirSync(ordner, { recursive: true });

  let erzeugt = 0, uebersprungen = 0, zeichen = 0;
  for (const reel of reels) {
    if (nur && reel.id !== nur) continue;
    for (const szene of reel.szenen) {
      if (!szene.stimme) continue;
      const datei = path.join(ordner, `${reel.id}-${szene.id}.mp3`);
      if (fs.existsSync(datei)) { uebersprungen++; continue; }
      const r = await anfrage(`/text-to-speech/${stimme}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: szene.stimme,
          model_id: modell,
          /* Sprache erzwingen koennen nur die Turbo- und Flash-Modelle; das
             Mehrsprachen-Modell erkennt sie selbst und weist den Parameter ab. */
          ...(/turbo|flash/.test(modell) ? { language_code: reel.sprache === "en" ? "en" : "de" } : {}),
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }
        })
      });
      /* Erst vollstaendig lesen, dann schreiben – eine abgebrochene
         Verbindung darf keine halbe MP3 hinterlassen, die spaeter als
         "vorhanden" gilt. */
      const daten = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(datei + ".teil", daten);
      fs.renameSync(datei + ".teil", datei);
      erzeugt++;
      zeichen += szene.stimme.length;
      melden(`${path.basename(datei).padEnd(40)} ${szene.stimme.slice(0, 48)}${szene.stimme.length > 48 ? "…" : ""}`);
    }
  }
  return { erzeugt, uebersprungen, zeichen };
}
