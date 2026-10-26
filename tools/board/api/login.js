/* POST /api/login  {benutzer, passwort}  ->  Sitzungs-Cookie */
import { json, koerper, eigeneHerkunft, warten } from "../lib/http.js";
import { einstellungen, zugangPruefen, sitzungAusstellen } from "../lib/sitzung.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { fehler: "nur POST" });
  if (!eigeneHerkunft(req)) return json(res, 403, { fehler: "herkunft" });
  const e = einstellungen();
  if (e.fehlt.length) return json(res, 503, { fehler: "einrichtung", fehlt: e.fehlt });
  const { benutzer = "", passwort = "" } = koerper(req);
  if (!zugangPruefen(String(benutzer), String(passwort), e)) {
    /* Bremse gegen Durchprobieren */
    await warten(1000 + Math.floor(Math.random() * 500));
    return json(res, 401, { fehler: "zugang" });
  }
  sitzungAusstellen(req, res, e);
  return json(res, 200, { ok: true });
}
