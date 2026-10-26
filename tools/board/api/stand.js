/* GET /api/stand  ->  der entschluesselte Stand, nur mit gueltiger Sitzung */
import { json } from "../lib/http.js";
import { einstellungen, sitzung } from "../lib/sitzung.js";
import { standLaden } from "../lib/stand.js";

export default async function handler(req, res) {
  const e = einstellungen();
  if (e.fehlt.length) return json(res, 503, { fehler: "einrichtung", fehlt: e.fehlt });
  if (!sitzung(req, e)) return json(res, 401, { fehler: "anmelden" });
  try {
    const text = await standLaden(e.schluessel);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(text);
  } catch (err) {
    return json(res, 502, { fehler: "stand", text: err.message });
  }
}
