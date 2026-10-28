/* =========================================================================
   Instagram – Veroeffentlichen ueber die Graph API, plus Kommandozeile
   fuer Einrichtung und Pruefung.

   Veroeffentlichen eines Reels (drei Schritte, Meta-Dokumentation
   "Content Publishing"):
     1. POST /{ig-user-id}/media         media_type=REELS, video_url, caption
     2. GET  /{container-id}?fields=status_code   bis FINISHED
     3. POST /{ig-user-id}/media_publish  creation_id=<container-id>
   Grenze: 50 API-Veroeffentlichungen je 24 Stunden und Konto
   (GET /{ig-user-id}/content_publishing_limit).

   Zwei Anmeldewege, gesteuert ueber igHost:
     graph.facebook.com   Instagram-Profi-Konto, das mit einer
                          Facebook-Seite verbunden ist. Token = Seiten-
                          Token (laeuft nicht ab, wenn aus einem
                          langlebigen Nutzer-Token abgeleitet).
     graph.instagram.com  "Instagram API mit Instagram-Login", ohne
                          Facebook-Seite. Token 60 Tage gueltig, wird
                          hier automatisch aufgefrischt (setx).

   Kommandozeile:
     node funnel/instagram.js pruefen               Konto, Kontingent, Token
     node funnel/instagram.js verbinden <token>     kurzlebiges Token eintauschen,
                                                    IG_USER_ID/IG_ACCESS_TOKEN
                                                    als Nutzer-Umgebungsvariablen speichern
     node funnel/instagram.js kontingent
     node funnel/instagram.js auffrischen           nur graph.instagram.com
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { KONFIG, GEHEIM, WURZEL, maskiert } from "./konfig.js";

export class InstagramFehler extends Error {
  constructor(text, details = {}) { super(text); Object.assign(this, details); }
}

const basis = () => `${KONFIG.igProtokoll}://${KONFIG.igHost}/${KONFIG.igApiVersion}`;
/* Instagram-Login (graph.instagram.com) oder Facebook-Login (graph.facebook.com)?
   igLogin in funnel.json/IG_LOGIN entscheidet; leer = aus dem Host abgeleitet. */
export const istInstagramLogin = () => KONFIG.igLogin === "instagram" || (!KONFIG.igLogin && /graph\.instagram\.com/.test(KONFIG.igHost));

/* Token-Endpunkte von graph.instagram.com liegen ausserhalb der Version. */
const OHNE_VERSION = new Set(["/access_token", "/refresh_access_token"]);

export async function api(pfad, { methode = "GET", params = {}, token = GEHEIM.igToken } = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) p.set(k, String(v));
  if (token) p.set("access_token", token);
  const wurzel = istInstagramLogin() && OHNE_VERSION.has(pfad) ? `${KONFIG.igProtokoll}://${KONFIG.igHost}` : basis();
  const url = wurzel + pfad + (methode === "GET" ? "?" + p.toString() : "");
  const r = await fetch(url, methode === "GET" ? {} : { method: methode, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: p.toString() });
  let daten = null;
  const text = await r.text();
  try { daten = JSON.parse(text); } catch (e) { daten = { roh: text.slice(0, 300) }; }
  if (!r.ok || daten.error) {
    const f = daten.error || {};
    throw new InstagramFehler(
      `Instagram ${methode} ${pfad}: HTTP ${r.status}${f.message ? " – " + f.message : ""}${f.error_user_msg ? " – " + f.error_user_msg : ""}`,
      { status: r.status, code: f.code, subcode: f.error_subcode, typ: f.type, fbtrace: f.fbtrace_id }
    );
  }
  return daten;
}

export const verbunden = () => Boolean(GEHEIM.igUserId && GEHEIM.igToken);

export async function konto() {
  if (istInstagramLogin()) {
    const d = await api("/me", { params: { fields: "user_id,username,name,followers_count,media_count" } });
    return { ...d, id: d.user_id || d.id };
  }
  return api(`/${GEHEIM.igUserId}`, { params: { fields: "id,username,name,followers_count,media_count" } });
}

export async function kontingent() {
  const d = await api(`/${GEHEIM.igUserId}/content_publishing_limit`, { params: { fields: "quota_usage,config" } });
  const e = (d.data && d.data[0]) || {};
  return { genutzt: e.quota_usage ?? 0, gesamt: e.config?.quota_total ?? 50, sekunden: e.config?.quota_duration ?? 86400 };
}

/* coverUrl: eigenes Titelbild (JPEG, oeffentlich). Hat Vorrang vor
   thumb_offset, das Instagram beim Probelauf ignoriert hat. */
export async function containerErstellen({ videoUrl, bildtext, coverUrl = null, coverMs = null, teilen = true }) {
  const d = await api(`/${GEHEIM.igUserId}/media`, {
    methode: "POST",
    params: {
      media_type: "REELS", video_url: videoUrl, caption: bildtext, share_to_feed: teilen ? "true" : "false",
      cover_url: coverUrl || undefined, thumb_offset: coverUrl ? undefined : coverMs
    }
  });
  return d.id;
}

/* Karussell (2–10 Bilder, JPEG, 4:5 bis 1.91:1): je Bild ein Container mit
   is_carousel_item, dann ein CAROUSEL-Container mit den Kindern – der wird
   wie ein Reel veroeffentlicht (fertigWarten, veroeffentlichen). alt_text
   ist der Bildbeschrieb fuer Screenreader; lehnt die API den Parameter ab,
   wird das Bild ohne ihn angelegt. */
export async function karussellContainerErstellen({ bildUrls, bildtext, altTexte = [], melden = () => {} }) {
  if (!bildUrls || bildUrls.length < 2 || bildUrls.length > 10) throw new InstagramFehler(`Ein Karussell braucht 2 bis 10 Bilder (${bildUrls ? bildUrls.length : 0}).`);
  const kinder = [];
  for (const [i, url] of bildUrls.entries()) {
    const params = { image_url: url, is_carousel_item: "true" };
    const alt = altTexte[i] ? String(altTexte[i]).slice(0, 1000) : null;
    let d;
    try { d = await api(`/${GEHEIM.igUserId}/media`, { methode: "POST", params: alt ? { ...params, alt_text: alt } : params }); }
    catch (e) {
      if (!alt || !/alt_text/i.test(e.message)) throw e;
      d = await api(`/${GEHEIM.igUserId}/media`, { methode: "POST", params });
    }
    kinder.push(d.id);
    melden(`Folie ${i + 1}/${bildUrls.length}: Container ${d.id}`);
  }
  for (const id of kinder) await fertigWarten(id, { maxSekunden: 240, intervallSekunden: 5, melden });
  const d = await api(`/${GEHEIM.igUserId}/media`, { methode: "POST", params: { media_type: "CAROUSEL", children: kinder.join(","), caption: bildtext } });
  return d.id;
}

export async function containerStatus(containerId) {
  return api(`/${containerId}`, { params: { fields: "status_code,status" } });
}

/* Wartet, bis Instagram das Video verarbeitet hat. */
export async function fertigWarten(containerId, { maxSekunden = 600, intervallSekunden = 10, melden = () => {} } = {}) {
  const start = Date.now();
  for (;;) {
    const s = await containerStatus(containerId);
    if (s.status_code === "FINISHED") return s;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new InstagramFehler(`Container ${containerId}: ${s.status_code} – ${s.status || "ohne Begruendung"}`, { statusCode: s.status_code });
    if ((Date.now() - start) / 1000 > maxSekunden) throw new InstagramFehler(`Container ${containerId} nach ${maxSekunden} s noch ${s.status_code}.`, { statusCode: s.status_code });
    melden(`Container ${containerId}: ${s.status_code} – warte ${intervallSekunden} s`);
    await new Promise((r) => setTimeout(r, intervallSekunden * 1000));
  }
}

export async function veroeffentlichen(containerId) {
  const d = await api(`/${GEHEIM.igUserId}/media_publish`, { methode: "POST", params: { creation_id: containerId } });
  return d.id;
}

export async function kommentieren(mediaId, text) {
  const d = await api(`/${mediaId}/comments`, { methode: "POST", params: { message: text } });
  return d.id;
}

export async function permalink(mediaId) {
  const d = await api(`/${mediaId}`, { params: { fields: "permalink" } });
  return d.permalink;
}

/* ---------------------------------------------------------- Token */

/* Nutzer-Umgebungsvariable dauerhaft setzen (Windows: setx, ohne Shell –
   kein Einschleusen moeglich). Andere Systeme: Hinweis statt Datei. */
export function umgebungSetzen(name, wert) {
  if (process.platform !== "win32") return { ok: false, hinweis: `Bitte selbst setzen: export ${name}=…` };
  const r = spawnSync("setx", [name, wert], { encoding: "utf8", windowsHide: true });
  process.env[name] = wert;
  return { ok: r.status === 0, hinweis: r.status === 0 ? `${name} als Nutzer-Umgebungsvariable gespeichert (gilt fuer neue Fenster und die Aufgabenplanung).` : (r.stderr || r.stdout || "setx fehlgeschlagen") };
}

/* Nur Instagram-Login: Token verlaengern (muss aelter als 24 h und juenger
   als 60 Tage sein). Liefert die neue Gueltigkeit in Tagen. */
export async function tokenAuffrischen() {
  if (!istInstagramLogin()) throw new InstagramFehler("Auffrischen gibt es nur fuer graph.instagram.com; ein Seiten-Token von graph.facebook.com laeuft nicht ab.");
  const d = await api("/refresh_access_token", { params: { grant_type: "ig_refresh_token" } });
  const gespeichert = umgebungSetzen("IG_ACCESS_TOKEN", d.access_token);
  return { tage: Math.round((d.expires_in || 0) / 86400), gespeichert };
}

/* Token in ein langlebiges tauschen und das Konto bestimmen.
   Facebook-Login (graph.facebook.com): kurzlebiges Nutzer-Token aus dem
     Graph API Explorer -> langlebig -> Seite -> Instagram-Konto -> Seiten-Token.
   Instagram-Login (graph.instagram.com): Token aus dem App-Dashboard
     ("Zugriffstoken generieren") ist bereits langlebig (60 Tage) und wird
     direkt verwendet; ein kurzlebiges aus dem Login-Ablauf wird mit dem
     App-Geheimcode getauscht, wenn META_APP_SECRET gesetzt ist. */
export async function verbinden(kurzToken) {
  const appId = GEHEIM.metaAppId, appSecret = GEHEIM.metaAppSecret;
  if (istInstagramLogin()) {
    let token = kurzToken, tage = null;
    if (appSecret) {
      try {
        const lang = await api("/access_token", { params: { grant_type: "ig_exchange_token", client_secret: appSecret }, token: kurzToken });
        token = lang.access_token;
        tage = Math.round((lang.expires_in || 0) / 86400);
      } catch (e) { /* schon langlebig – direkt verwenden */ }
    }
    const ich = await api("/me", { params: { fields: "user_id,username" }, token });
    return [{ art: "instagram-login", userId: ich.user_id || ich.id, username: ich.username, token, tage }];
  }
  if (!appId || !appSecret) throw new InstagramFehler("META_APP_ID und META_APP_SECRET werden zum Eintauschen gebraucht (Meta for Developers ▸ App ▸ Einstellungen ▸ Allgemein).");
  const lang = await api("/oauth/access_token", { params: { grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: kurzToken }, token: null });
  const seiten = await api("/me/accounts", { params: { fields: "id,name,access_token,instagram_business_account{id,username}" }, token: lang.access_token });
  return (seiten.data || []).filter((s) => s.instagram_business_account).map((s) => ({
    art: "facebook-login", seite: s.name, seiteId: s.id, userId: s.instagram_business_account.id, username: s.instagram_business_account.username, token: s.access_token, tage: null
  }));
}

/* ----------------------------------------------------- Kommandozeile */
const alsSkript = process.argv[1] && /instagram\.js$/.test(process.argv[1]);
if (alsSkript) {
  const [befehl, ...rest] = process.argv.slice(2);
  try {
    if (befehl === "pruefen") {
      if (!verbunden()) throw new InstagramFehler("IG_USER_ID oder IG_ACCESS_TOKEN fehlen in der Umgebung. Zuerst: node funnel/instagram.js verbinden <kurzlebiges-token>");
      console.log(`Host ${KONFIG.igHost} ${KONFIG.igApiVersion}, Konto ${GEHEIM.igUserId}, Token ${maskiert(GEHEIM.igToken)}`);
      const k = await konto();
      console.log(`Konto: @${k.username}${k.name ? " (" + k.name + ")" : ""}, ${k.followers_count ?? "?"} Follower, ${k.media_count ?? "?"} Beitraege`);
      const q = await kontingent();
      console.log(`Kontingent: ${q.genutzt} von ${q.gesamt} Veroeffentlichungen in den letzten ${Math.round(q.sekunden / 3600)} h genutzt`);
      if (!istInstagramLogin() && GEHEIM.metaAppId && GEHEIM.metaAppSecret) {
        const d = await api("/debug_token", { params: { input_token: GEHEIM.igToken }, token: `${GEHEIM.metaAppId}|${GEHEIM.metaAppSecret}` });
        const t = d.data || {};
        console.log(`Token: ${t.type || "?"}, gueltig: ${t.is_valid}, laeuft ab: ${t.expires_at ? new Date(t.expires_at * 1000).toISOString().slice(0, 10) : "nie"}, Rechte: ${(t.scopes || []).join(", ")}`);
      }
      console.log("Verbindung in Ordnung.");
    } else if (befehl === "kontingent") {
      const q = await kontingent();
      console.log(`${q.genutzt} von ${q.gesamt} genutzt`);
    } else if (befehl === "auffrischen") {
      const r = await tokenAuffrischen();
      console.log(`Token aufgefrischt, gueltig ${r.tage} Tage. ${r.gespeichert.hinweis}`);
    } else if (befehl === "verbinden") {
      const kurz = rest.find((t) => !t.startsWith("--"));
      if (!kurz) throw new InstagramFehler("Aufruf: node funnel/instagram.js verbinden <token> [--instagram] [--konto=N] [--nicht-speichern]");
      /* --instagram: Token stammt aus "API-Einrichtung mit Instagram-Login";
         dann laeuft alles ueber graph.instagram.com, und funnel.json
         merkt sich das. */
      if (rest.includes("--instagram")) {
        KONFIG.igLogin = "instagram";
        if (KONFIG.igHost === "graph.facebook.com") {
          KONFIG.igHost = "graph.instagram.com";
          const datei = path.join(WURZEL, "funnel.json");
          const f = fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, "utf8")) : {};
          f.igHost = "graph.instagram.com";
          f.igLogin = "instagram";
          fs.writeFileSync(datei, JSON.stringify(f, null, 2) + "\n");
          console.log("funnel.json: igHost auf graph.instagram.com gestellt.");
        }
      }
      const konten = await verbinden(kurz);
      if (!konten.length) throw new InstagramFehler("Keine Facebook-Seite mit verbundenem Instagram-Profi-Konto gefunden. Instagram-Konto in ein Business-/Creator-Konto umwandeln und mit der Seite verknuepfen.");
      konten.forEach((k, i) => console.log(`${i + 1}. @${k.username}  (Konto-Id ${k.userId}${k.seite ? ", Seite " + k.seite : ""}${k.tage ? ", Token " + k.tage + " Tage gueltig" : k.art === "instagram-login" ? ", Token 60 Tage gueltig, wird automatisch verlaengert" : ", Seiten-Token ohne Ablauf"})`));
      const wahl = konten[Number(rest.find((t) => /^--konto=\d+$/.test(t))?.split("=")[1] || 1) - 1] || konten[0];
      if (rest.includes("--nicht-speichern")) {
        console.log(`\nGewaehlt: @${wahl.username}. Token ${maskiert(wahl.token)} – nicht gespeichert (--nicht-speichern).`);
      } else {
        console.log(`\nGewaehlt: @${wahl.username}`);
        console.log(umgebungSetzen("IG_USER_ID", String(wahl.userId)).hinweis);
        console.log(umgebungSetzen("IG_ACCESS_TOKEN", wahl.token).hinweis);
        console.log("Dann in einem NEUEN Fenster pruefen:  node funnel/instagram.js pruefen");
      }
    } else {
      console.log("Befehle: pruefen | verbinden <kurzlebiges-token> [--konto=N] [--nicht-speichern] | kontingent | auffrischen");
    }
  } catch (e) {
    console.error("\n" + e.message + (e.code ? `  (code ${e.code}${e.subcode ? "/" + e.subcode : ""})` : "") + "\n");
    process.exitCode = 1;
  }
}
