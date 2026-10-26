/* Kleine HTTP-Helfer, die auf Vercel und im lokalen dev.js gleich laufen –
   bewusst ohne die Vercel-Zusaetze (res.status, res.json). */

export function json(res, status, daten) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(daten));
}

/* Vercel liefert req.body schon gelesen; dev.js setzt es genauso. */
export function koerper(req) {
  try {
    const b = req.body;
    if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
    return JSON.parse(String(b || "{}"));
  } catch (e) {
    return {};
  }
}

export function cookiesLesen(req) {
  const liste = {};
  for (const teil of String(req.headers.cookie || "").split(";")) {
    const i = teil.indexOf("=");
    if (i > 0) liste[teil.slice(0, i).trim()] = decodeURIComponent(teil.slice(i + 1).trim());
  }
  return liste;
}

/* Formular-POST nur von der eigenen Seite: Origin muss zum Host passen
   (Browser senden Origin bei jedem POST mit). */
export function eigeneHerkunft(req) {
  const herkunft = req.headers.origin;
  if (!herkunft) return true;
  try { return new URL(herkunft).host === req.headers.host; } catch (e) { return false; }
}

export const warten = (ms) => new Promise((r) => setTimeout(r, ms));
