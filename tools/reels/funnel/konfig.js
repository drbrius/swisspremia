/* =========================================================================
   Konfiguration des Funnels

   Zwei Quellen, klar getrennt:
     funnel.json   alles, was kein Geheimnis ist (Anzahl, Zeitfenster, Mix)
     Umgebung      alle Schluessel und Tokens – NIE in einer Datei im
                   Repository, auch nicht in einer ignorierten: der Ordner
                   liegt in OneDrive und das Repository ist oeffentlich.

   Umgebungsvariablen:
     ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID
     BLOB_READ_WRITE_TOKEN                   Vercel Blob (Ablage der Videos)
     IG_USER_ID, IG_ACCESS_TOKEN             Instagram-Konto
     IG_HOST (graph.facebook.com | graph.instagram.com), IG_API_VERSION
     META_APP_ID, META_APP_SECRET            nur fuer "instagram.js verbinden"
   Jede Einstellung aus funnel.json laesst sich mit einer gleichnamigen
   Umgebungsvariable in GROSSBUCHSTABEN uebersteuern (REELS_PRO_TAG, ...).
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");   // tools/reels
export const PROJEKT = path.resolve(WURZEL, "..", "..");                                  // Projektstamm
export const PLAN_ORDNER = path.join(WURZEL, "plan");
export const AUSGABE_ORDNER = path.join(WURZEL, "out", "tag");
export const AUDIO_ORDNER = "audio/tag";                                                  // relativ zu public/

const STANDARD = {
  reelsProTag: "10-20",            // feste Zahl ("12") oder Spanne ("10-20"), je Tag ausgewuerfelt
  postVon: "07:00",                // erstes Reel des Tages
  postBis: "21:30",                // letztes Reel des Tages
  mindestabstandMinuten: 30,       // nie zwei Reels naeher beieinander
  proTick: 1,                      // wie viele faellige Reels ein Lauf von posten.js hoechstens veroeffentlicht
  mix: { daten: 0.5, wissen: 0.35, saison: 0.15 },   // innerhalb einer Funnel-Stufe: Verhaeltnis daten/wissen (saison wird nicht mehr genutzt)
  stufen: { tofu: 0.45, mofu: 0.35, bofu: 0.2 },     // Funnel-Mix im Normalbetrieb
  stufenSaison: { tofu: 0.35, mofu: 0.35, bofu: 0.3 }, // waehrend einer Kuendigungsfrist (Countdown laeuft)
  wiederholungStammTage: 14,       // ein Stamm-Reel fruehestens nach so vielen Tagen erneut
  karussellsProTag: 2,             // Bild-Karussells je Tag, zusaetzlich zu den Reels (0 = keine)
  karussellAbstandMinuten: 20,     // Mindestabstand eines Karussells zu jedem anderen Beitrag
  hashtags: "bildtext",            // bildtext | kommentar | keine
  stimme: "auto",                  // auto (wenn Schluessel da) | aus
  ablage: "vercel-blob",           // vercel-blob | ordner
  videoOrdner: "",                 // bei ablage=ordner: wohin die MP4 kopiert werden
  videoBasisUrl: "",               // bei ablage=ordner: oeffentliche Basis-URL dieses Ordners
  aufbewahrungTage: 14,            // gerenderte Videos und Plaene aelter als das werden geloescht
  igHost: "graph.facebook.com",    // oder graph.instagram.com (Instagram-Login ohne Facebook-Seite)
  igLogin: "",                     // "facebook" | "instagram"; leer = aus igHost abgeleitet
  igApiVersion: "v26.0",
  igProtokoll: "https"
};

function ausDatei() {
  const datei = path.join(WURZEL, "funnel.json");
  if (!fs.existsSync(datei)) return {};
  try { return JSON.parse(fs.readFileSync(datei, "utf8")); }
  catch (e) { throw new Error("funnel.json ist kein gueltiges JSON: " + e.message); }
}

const UMGEBUNG = {
  reelsProTag: "REELS_PRO_TAG", postVon: "POST_VON", postBis: "POST_BIS", mindestabstandMinuten: "MINDESTABSTAND_MINUTEN",
  proTick: "PRO_TICK", hashtags: "HASHTAGS", stimme: "STIMME", ablage: "ABLAGE", videoOrdner: "VIDEO_ORDNER",
  videoBasisUrl: "VIDEO_BASIS_URL", aufbewahrungTage: "AUFBEWAHRUNG_TAGE", igHost: "IG_HOST", igApiVersion: "IG_API_VERSION",
  igProtokoll: "IG_PROTOKOLL", igLogin: "IG_LOGIN", wiederholungStammTage: "WIEDERHOLUNG_STAMM_TAGE",
  karussellsProTag: "KARUSSELLS_PRO_TAG", karussellAbstandMinuten: "KARUSSELL_ABSTAND_MINUTEN"
};

function zusammenfuehren() {
  const k = { ...STANDARD, ...ausDatei() };
  for (const [name, variable] of Object.entries(UMGEBUNG)) {
    if (process.env[variable] !== undefined && process.env[variable] !== "") {
      const roh = process.env[variable];
      k[name] = typeof STANDARD[name] === "number" ? Number(roh) : roh;
    }
  }
  k.mix = { ...STANDARD.mix, ...(k.mix || {}) };
  k.stufen = { ...STANDARD.stufen, ...(k.stufen || {}) };
  k.stufenSaison = { ...STANDARD.stufenSaison, ...(k.stufenSaison || {}) };
  return k;
}

export const KONFIG = zusammenfuehren();

/* Geheimnisse werden bewusst erst beim Zugriff gelesen, damit ein Skript,
   das sie nicht braucht (z. B. --nur-plan), ohne sie laeuft. */
export const GEHEIM = {
  get elevenlabsKey() { return process.env.ELEVENLABS_API_KEY || ""; },
  get elevenlabsVoice() { return process.env.ELEVENLABS_VOICE_ID || ""; },
  get elevenlabsModel() { return process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"; },
  get blobToken() { return process.env.BLOB_READ_WRITE_TOKEN || ""; },
  get igUserId() { return process.env.IG_USER_ID || ""; },
  get igToken() { return process.env.IG_ACCESS_TOKEN || ""; },
  get metaAppId() { return process.env.META_APP_ID || ""; },
  get metaAppSecret() { return process.env.META_APP_SECRET || ""; }
};

/* "10-20" -> [10, 20]; "12" -> [12, 12] */
export function spanne(text) {
  const t = String(text).trim();
  const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return [Number(m[1]), Number(m[2])].sort((a, b) => a - b);
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1) throw new Error(`reelsProTag "${text}" ist weder Zahl noch Spanne wie "10-20".`);
  return [n, n];
}

/* "07:00" -> 420 (Minuten seit Mitternacht) */
export function minuten(uhrzeit) {
  const m = String(uhrzeit).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Uhrzeit "${uhrzeit}" nicht lesbar – erwartet HH:MM.`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/* Maskiert ein Geheimnis fuer Protokoll und Konsole. */
export const maskiert = (s) => (s ? s.slice(0, 4) + "…" + s.slice(-4) + ` (${s.length} Zeichen)` : "(leer)");
