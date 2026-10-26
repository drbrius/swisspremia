/* POST /api/logout  ->  Cookie loeschen */
import { json, eigeneHerkunft } from "../lib/http.js";
import { sitzungBeenden } from "../lib/sitzung.js";

export default function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { fehler: "nur POST" });
  if (!eigeneHerkunft(req)) return json(res, 403, { fehler: "herkunft" });
  sitzungBeenden(req, res);
  return json(res, 200, { ok: true });
}
