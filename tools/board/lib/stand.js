/* =========================================================================
   Stand laden: der Rechner (tools/reels/board.js) legt ihn alle 30 Minuten
   verschluesselt unter BOARD_DATEN_URL ab. Hier wird er geholt,
   entschluesselt und kurz im Speicher gehalten.

   BOARD_DATEN_DATEI (nur lokal, dev.js): Datei statt URL.
   ========================================================================= */
import crypto from "node:crypto";
import zlib from "node:zlib";
import fs from "node:fs";

const KENNUNG = "swisspremia-board-v1";   // wie in tools/reels/funnel/board.js
const HALTEN_MS = 30_000;
let zwischenspeicher = null;

export class StandFehler extends Error {}

export function entschluesseln(text, schluessel) {
  let huelle;
  try { huelle = JSON.parse(text); } catch (e) { throw new StandFehler("Der abgelegte Stand ist kein JSON."); }
  if (huelle.v !== 1 || !huelle.iv || !huelle.tag || !huelle.daten) throw new StandFehler("Unbekanntes Format des Stands.");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", crypto.createHash("sha256").update(schluessel).digest(), Buffer.from(huelle.iv, "base64"));
    d.setAAD(Buffer.from(KENNUNG));
    d.setAuthTag(Buffer.from(huelle.tag, "base64"));
    const roh = Buffer.concat([d.update(Buffer.from(huelle.daten, "base64")), d.final()]);
    return zlib.gunzipSync(roh).toString("utf8");
  } catch (e) {
    throw new StandFehler("Stand laesst sich nicht entschluesseln – BOARD_SCHLUESSEL in Vercel und auf dem Rechner muessen gleich sein.");
  }
}

/* Liefert den Stand als JSON-Text (wird unveraendert weitergereicht). */
export async function standLaden(schluessel) {
  if (zwischenspeicher && Date.now() - zwischenspeicher.zeit < HALTEN_MS) return zwischenspeicher.text;
  let roh;
  if (process.env.BOARD_DATEN_DATEI) {
    roh = fs.readFileSync(process.env.BOARD_DATEN_DATEI, "utf8");
  } else {
    const url = process.env.BOARD_DATEN_URL;
    if (!url) throw new StandFehler("BOARD_DATEN_URL fehlt im Vercel-Projekt.");
    const r = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (r.status === 404) throw new StandFehler("Noch kein Stand abgelegt – auf dem Rechner einmal node board.js ausfuehren.");
    if (!r.ok) throw new StandFehler(`Stand nicht abrufbar (HTTP ${r.status}).`);
    roh = await r.text();
  }
  const text = entschluesseln(roh, schluessel);
  zwischenspeicher = { zeit: Date.now(), text };
  return text;
}
