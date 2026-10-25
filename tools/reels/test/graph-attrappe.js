/* =========================================================================
   Attrappe der Instagram Graph API – zum Testen von posten.js ohne
   echtes Konto. Spielt die drei Schritte (Container, Status, Publish)
   nach, zaehlt das Kontingent und liefert Videos aus einem Ordner aus.

       node test/graph-attrappe.js 8787 C:/pfad/zu/videos

   Dann in einem zweiten Fenster:
       $env:IG_HOST="localhost:8787"; $env:IG_PROTOKOLL="http"
       $env:IG_USER_ID="17841400000000000"; $env:IG_ACCESS_TOKEN="test"
       $env:ABLAGE="ordner"; $env:VIDEO_ORDNER="C:/pfad/zu/videos"
       $env:VIDEO_BASIS_URL="http://localhost:8787/video"
       node tag.js --anzahl=2 --ohne-stimme
       node posten.js --alle --jetzt=2099-01-01T00:00

   GET /_protokoll zeigt alle Aufrufe, POST /_zuruecksetzen leert sie.
   ========================================================================= */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.argv[2] || 8787);
const VIDEOS = process.argv[3] ? path.resolve(process.argv[3]) : null;

const zustand = { aufrufe: [], container: {}, medien: [], kommentare: [], laufnummer: 1 };
const fehler = (res, status, message, code = 100, subcode = undefined) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { message, type: "OAuthException", code, error_subcode: subcode, fbtrace_id: "attrappe" } }));
};
const json = (res, daten) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(daten)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  let body = "";
  for await (const teil of req) body += teil;
  const params = Object.fromEntries(new URLSearchParams(req.method === "GET" ? u.search : body));
  const pfad = u.pathname;
  zustand.aufrufe.push({ zeit: new Date().toISOString(), methode: req.method, pfad, params: { ...params, access_token: params.access_token ? "(verborgen)" : undefined } });

  if (pfad === "/_protokoll") return json(res, zustand);
  if (pfad === "/_zuruecksetzen") { zustand.aufrufe = []; zustand.container = {}; zustand.medien = []; zustand.kommentare = []; return json(res, { ok: true }); }

  /* Videos ausliefern – so, wie es ein Blob-Speicher taete. */
  if (pfad.startsWith("/video/")) {
    if (!VIDEOS) return fehler(res, 404, "kein Videoordner");
    const datei = path.join(VIDEOS, decodeURIComponent(pfad.slice("/video/".length)));
    if (!datei.startsWith(VIDEOS) || !fs.existsSync(datei)) { res.writeHead(404); return res.end("nicht gefunden"); }
    const groesse = fs.statSync(datei).size;
    res.writeHead(200, { "Content-Type": /\.jpe?g$/i.test(datei) ? "image/jpeg" : "video/mp4", "Content-Length": groesse });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(datei).pipe(res);
  }

  /* Token-Endpunkte ohne Version (graph.instagram.com) und mit Version. */
  const m = pfad.match(/^(?:\/v\d+\.\d+)?\/([^/]+)(?:\/([^/]+))?$/);
  if (!m) return fehler(res, 404, "Unbekannter Pfad " + pfad, 803);
  if (!params.access_token) return fehler(res, 400, "An access token is required to request this resource.", 104);
  const [, knoten, kante] = m;

  if (knoten === "refresh_access_token") return json(res, { access_token: "neu-" + Date.now(), token_type: "bearer", expires_in: 5_184_000 });
  if (knoten === "access_token") {
    /* Wie Instagram: ein bereits langlebiges Token laesst sich nicht nochmals tauschen. */
    if (/^lang/.test(params.access_token)) return fehler(res, 400, "Invalid platform app", 190);
    return json(res, { access_token: "lang-" + Date.now(), token_type: "bearer", expires_in: 5_184_000 });
  }
  if (knoten === "me" && !kante) return json(res, { user_id: "17841400000000000", username: "attrappe", name: "Attrappe", followers_count: 0, media_count: zustand.medien.length });
  if (knoten === "debug_token") return json(res, { data: { type: "PAGE", is_valid: true, expires_at: 0, scopes: ["instagram_basic", "instagram_content_publish"] } });

  if (kante === "media" && req.method === "POST") {
    if (params.media_type !== "REELS") return fehler(res, 400, "media_type muss REELS sein", 100);
    if (!params.video_url) return fehler(res, 400, "video_url fehlt", 100);
    /* Wie Instagram: das Video muss abrufbar sein. */
    try {
      const probe = await fetch(params.video_url, { method: "HEAD" });
      if (!probe.ok) return fehler(res, 400, `Video nicht ladbar: HTTP ${probe.status}`, 9004, 2207052);
    } catch (e) { return fehler(res, 400, "Video nicht ladbar: " + e.message, 9004, 2207052); }
    if (params.cover_url) {
      try {
        const probe = await fetch(params.cover_url, { method: "HEAD" });
        if (!probe.ok || !/image\/jpeg/.test(probe.headers.get("content-type") || "")) return fehler(res, 400, `Titelbild nicht ladbar oder kein JPEG: HTTP ${probe.status}`, 9004, 2207052);
      } catch (e) { return fehler(res, 400, "Titelbild nicht ladbar: " + e.message, 9004, 2207052); }
    }
    /* Ids bleiben unter 2^53, sonst rundet JavaScript. */
    const id = "1789" + String(100000 + zustand.laufnummer++);
    zustand.container[id] = { status: "IN_PROGRESS", abfragen: 0, caption: params.caption, video_url: params.video_url, cover_url: params.cover_url, thumb_offset: params.thumb_offset, share_to_feed: params.share_to_feed };
    return json(res, { id });
  }
  if (kante === "media_publish" && req.method === "POST") {
    const c = zustand.container[params.creation_id];
    if (!c) return fehler(res, 400, "Unbekannte creation_id", 100);
    if (c.status !== "FINISHED") return fehler(res, 400, "Media ID is not available", 9007, 2207027);
    const quota = zustand.medien.filter((x) => Date.now() - x.zeit < 86_400_000).length;
    if (quota >= 50) return fehler(res, 400, "Application request limit reached", 4, 2207051);
    const id = "1795" + String(100000 + zustand.laufnummer++);
    zustand.medien.push({ id, zeit: Date.now(), container: params.creation_id, caption: c.caption });
    return json(res, { id });
  }
  if (kante === "content_publishing_limit") {
    const quota = zustand.medien.filter((x) => Date.now() - x.zeit < 86_400_000).length;
    return json(res, { data: [{ quota_usage: quota, config: { quota_total: 50, quota_duration: 86400 } }] });
  }
  if (kante === "comments" && req.method === "POST") {
    zustand.kommentare.push({ medium: knoten, text: params.message });
    return json(res, { id: "1800" + String(100000 + zustand.laufnummer++) });
  }
  if (!kante && zustand.container[knoten]) {
    const c = zustand.container[knoten];
    c.abfragen++;
    if (c.abfragen >= 2) c.status = "FINISHED";   // beim zweiten Nachfragen fertig
    return json(res, { id: knoten, status_code: c.status, status: c.status === "FINISHED" ? "Finished: Media has been uploaded and it is ready to be published." : "In Progress" });
  }
  if (!kante && zustand.medien.some((x) => x.id === knoten)) return json(res, { id: knoten, permalink: `https://www.instagram.com/reel/attrappe-${knoten.slice(-5)}/` });
  if (!kante) return json(res, { id: knoten, username: "attrappe", name: "Attrappe", followers_count: 0, media_count: zustand.medien.length });

  return fehler(res, 404, "Unbekannte Kante " + kante, 803);
}).listen(PORT, () => console.log(`Graph-Attrappe auf http://localhost:${PORT}${VIDEOS ? ", Videos aus " + VIDEOS : ""}`));
