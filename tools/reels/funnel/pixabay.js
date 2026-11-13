/* =========================================================================
   Pixabay – Bild- und Videosuche fuer die Reels (https://pixabay.com/api/docs/).

   Schluessel: PIXABAY_API_KEY aus der Nutzer-Umgebung (schluessel-setzen.ps1),
   nie in einer Datei des Repositorys.

   Regeln des Dienstes, die dieser Baustein einhaelt:
     - hoechstens 100 Abfragen je Minute -> jede Antwort wird 24 Stunden in
       plan/pixabay/ aufbewahrt (das verlangt Pixabay ohnehin);
     - keine Direktverlinkung -> Dateien werden heruntergeladen und liegen
       danach lokal (herunterladen);
     - Bild-URLs gelten nur 24 Stunden -> schlaegt ein Download fehl, wird
       die Abfrage einmal frisch wiederholt (frisch: true).

   Ueber die API gibt es Fotos bis 1280 px Kantenlaenge (largeImageURL);
   volle Aufloesung schaltet Pixabay nur auf Antrag frei. Videos kommen
   bis Full HD.

   Lizenz: Pixabay-Inhaltslizenz – kostenlos, auch kommerziell, ohne
   Namensnennung. Nicht erlaubt: erkennbare Personen in ein schlechtes
   Licht ruecken oder so zeigen, als wuerden sie fuer ein Angebot werben.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PLAN_ORDNER, GEHEIM } from "./konfig.js";

export class PixabayFehler extends Error {}

const CACHE = path.join(PLAN_ORDNER, "pixabay");
const TAG_MS = 24 * 3600 * 1000;

export const pixabayBereit = () => Boolean(GEHEIM.pixabayKey);

async function abfrage(pfad, parameter, { frisch = false } = {}) {
  if (!GEHEIM.pixabayKey) throw new PixabayFehler("Kein PIXABAY_API_KEY in der Umgebung – powershell -ExecutionPolicy Bypass -File .\\schluessel-setzen.ps1");
  const p = new URLSearchParams(Object.entries(parameter).filter(([, w]) => w !== undefined && w !== "").sort(([a], [b]) => a.localeCompare(b)));
  const datei = path.join(CACHE, crypto.createHash("sha1").update(pfad + "?" + p).digest("hex").slice(0, 16) + ".json");
  if (!frisch && fs.existsSync(datei) && Date.now() - fs.statSync(datei).mtimeMs < TAG_MS) return JSON.parse(fs.readFileSync(datei, "utf8"));
  let r;
  try {
    r = await fetch(`https://pixabay.com/api/${pfad}?key=${encodeURIComponent(GEHEIM.pixabayKey)}&${p}`);
  } catch {
    throw new PixabayFehler("Pixabay nicht erreichbar (Netz?).");   // Fehlertext der Laufzeit nicht durchreichen: er kann die Adresse mit Schluessel enthalten
  }
  if (r.status === 429) throw new PixabayFehler(`Pixabay-Limit erreicht (100 Abfragen je Minute) – in ${r.headers.get("x-ratelimit-reset") || 60} s erneut.`);
  if (!r.ok) throw new PixabayFehler(`Pixabay HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const antwort = await r.json();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(datei, JSON.stringify(antwort));
  aufraeumen();
  return antwort;
}

/* Antworten, die aelter als zwei Tage sind, wegraeumen. */
function aufraeumen() {
  for (const n of fs.readdirSync(CACHE)) {
    const d = path.join(CACHE, n);
    if (Date.now() - fs.statSync(d).mtimeMs > 2 * TAG_MS) fs.rmSync(d, { force: true });
  }
}

const gemeinsam = (h) => ({
  id: h.id, seite: h.pageURL, tags: h.tags, autor: h.user,
  ki: Boolean(h.isAiGenerated), schwach: Boolean(h.isLowQuality), likes: h.likes, downloads: h.downloads
});
const alsFoto = (h) => ({ ...gemeinsam(h), art: "foto", breite: h.imageWidth, hoehe: h.imageHeight, vorschau: h.webformatURL, gross: h.largeImageURL });
const alsVideo = (h) => {
  const v = h.videos || {};
  const datei = (d) => (d && d.url ? { url: d.url, breite: d.width, hoehe: d.height, mb: Math.round(d.size / 1e5) / 10, bild: d.thumbnail } : null);
  const dateien = { gross: datei(v.large), mittel: datei(v.medium), klein: datei(v.small), winzig: datei(v.tiny) };
  const beste = dateien.gross || dateien.mittel || dateien.klein || dateien.winzig || {};
  return { ...gemeinsam(h), art: "video", dauer: h.duration, breite: beste.breite, hoehe: beste.hoehe, vorschau: (dateien.mittel || beste).bild, dateien };
};

/* Suche. format: "hoch" (Standard, fuer Reels), "quer" oder "alle".
   KI-erzeugte und als schwach markierte Treffer fallen weg (ki: true laesst
   KI-Bilder zu). Liefert { gesamt, treffer }. */
export async function suchen(q, { art = "foto", lang = "de", format = "hoch", anzahl = 12, seite = 1, kategorie, reihenfolge = "popular", ki = false, frisch = false } = {}) {
  if (String(q).length > 100) throw new PixabayFehler("Suchbegriff laenger als 100 Zeichen.");
  const video = art === "video";
  const antwort = await abfrage(video ? "videos/" : "", {
    q, lang, safesearch: "true", order: reihenfolge, category: kategorie, page: seite,
    per_page: video && format === "hoch" ? 200 : Math.min(200, Math.max(20, anzahl * 3)),   // Hochformat-Videos sind selten
    ...(video ? { video_type: "film" } : { image_type: "photo", orientation: { hoch: "vertical", quer: "horizontal" }[format] || "all" })
  }, { frisch });
  const passt = (t) => (ki || !t.ki) && !t.schwach && (format === "alle" || (format === "hoch" ? t.hoehe > t.breite : t.breite > t.hoehe));
  const treffer = antwort.hits.map(video ? alsVideo : alsFoto).filter(passt).slice(0, anzahl);
  return { gesamt: antwort.totalHits, treffer };
}

/* Ein Treffer ueber seine Nummer (die Zahl am Ende der Pixabay-Adresse). */
export async function nachId(id, { art = "foto", frisch = false } = {}) {
  const antwort = await abfrage(art === "video" ? "videos/" : "", { id: String(id) }, { frisch });
  if (!antwort.hits.length) throw new PixabayFehler(`Pixabay kennt ${art === "video" ? "das Video" : "das Bild"} ${id} nicht.`);
  return (art === "video" ? alsVideo : alsFoto)(antwort.hits[0]);
}

/* Datei laden und erst nach vollstaendigem Empfang an ihren Platz legen. */
export async function herunterladen(url, ziel) {
  const r = await fetch(url);
  if (!r.ok) throw new PixabayFehler("Download HTTP " + r.status);
  const daten = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel + ".teil", daten);
  fs.renameSync(ziel + ".teil", ziel);
  return daten.length;
}
