/* =========================================================================
   Board – Stand fuer das Performance-Board (tools/board, eigene
   Vercel-Seite mit Login).

   Der Rechner ist die einzige Stelle mit dem Instagram-Token und den
   Tagesplaenen. Deshalb baut er den Stand – Plan, veroeffentlichte
   Beitraege mit ihren Zahlen, Kontozahlen – und legt ihn verschluesselt
   in den Vercel-Blob-Speicher (board/stand.json). Das Board entschluesselt
   ihn serverseitig, erst nach dem Login.

     plan/board-stand.json      letzter Stand im Klartext (zum Nachsehen)
     plan/board-archiv.json     Funnel-Angaben je veroeffentlichtem Reel –
                                ueberlebt das Aufraeumen der Tagesplaene
     plan/board-follower.json   Follower je Tag (Instagram liefert die
                                Tagesreihe erst ab 100 Followern)

   Schluessel: BOARD_SCHLUESSEL (Nutzer-Umgebungsvariable, derselbe Wert
   im Vercel-Projekt). AES-256-GCM, Inhalt vorher gzip-komprimiert.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { KONFIG, GEHEIM, PLAN_ORDNER } from "./konfig.js";
import { api, konto, kontingent, verbunden, istInstagramLogin } from "./instagram.js";

export const BOARD_PFAD = "board/stand.json";
export const STAND_DATEI = path.join(PLAN_ORDNER, "board-stand.json");
const ARCHIV = path.join(PLAN_ORDNER, "board-archiv.json");
const FOLLOWER = path.join(PLAN_ORDNER, "board-follower.json");
const KENNUNG = "swisspremia-board-v1";   // Zusatzdaten der Verschluesselung, muss im Board gleich sein

/* Reihenfolge = Rueckfall: geht die volle Liste nicht, die naechste. */
const MEDIEN_METRIKEN = [
  ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"],
  ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions"],
  null
];
const KONTO_METRIKEN = ["reach", "views", "accounts_engaged", "total_interactions", "profile_views", "website_clicks", "profile_links_taps"];
const MAX_SEITEN = 12;   // je 50 Beitraege

const lesen = (datei, ersatz) => { try { return JSON.parse(fs.readFileSync(datei, "utf8")); } catch (e) { return ersatz; } };
const schreiben = (datei, daten) => { fs.writeFileSync(datei + ".neu", JSON.stringify(daten, null, 2)); fs.renameSync(datei + ".neu", datei); };
const gekuerzt = (text, n) => (text && text.length > n ? text.slice(0, n - 1) + "…" : text || "");
const sekunden = (d) => Math.floor(d.getTime() / 1000);

/* ------------------------------------------------------------ Plaene */

/* Alle Tagesplaene, die noch auf der Platte liegen (Aufbewahrungsfrist). */
export function planReels() {
  const liste = [];
  for (const name of fs.readdirSync(PLAN_ORDNER).sort()) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(name)) continue;
    const plan = lesen(path.join(PLAN_ORDNER, name), null);
    if (!plan || !Array.isArray(plan.reels)) continue;
    for (const r of plan.reels) {
      liste.push({
        datum: plan.datum, nr: r.nr, zeit: r.zeit, titel: r.titel, format: r.format, gruppe: r.gruppe, sprache: r.sprache,
        status: r.status, fehler: r.fehler || null, versuche: r.versuche || 0,
        mediaId: r.mediaId || null, permalink: r.permalink || null, veroeffentlicht: r.veroeffentlicht || null,
        cover: r.coverUrl || null, video: r.url || null, dauer: r.dauerSekunden || null,
        text: gekuerzt(r.bildtext, 900)
      });
    }
  }
  return liste;
}

/* mediaId -> Funnel-Angaben. Waechst nur; alte Plaene duerfen verschwinden. */
function archivAktualisieren(reels) {
  const archiv = lesen(ARCHIV, {});
  for (const r of reels) {
    if (!r.mediaId) continue;
    archiv[r.mediaId] = { datum: r.datum, nr: r.nr, zeit: r.zeit, titel: r.titel, format: r.format, gruppe: r.gruppe, cover: r.cover, video: r.video, dauer: r.dauer };
  }
  schreiben(ARCHIV, archiv);
  return archiv;
}

/* ---------------------------------------------------------- Instagram */

const medienPfad = () => (istInstagramLogin() ? "/me/media" : `/${GEHEIM.igUserId}/media`);

async function medienSeite(after, metriken) {
  const felder = "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count"
    + (metriken ? `,insights.metric(${metriken.join(",")})` : "");
  return api(medienPfad(), { params: { fields: felder, limit: 50, after } });
}

/* Alle Beitraege mit ihren Zahlen, neueste zuerst. Ein einziger Aufruf je
   50 Beitraege – die Zahlen kommen ueber die Feld-Erweiterung mit. */
export async function medienLaden(hinweise) {
  const medien = [];
  let after, stufe = 0;
  for (let seite = 0; seite < MAX_SEITEN; seite++) {
    let d;
    for (;;) {
      try { d = await medienSeite(after, MEDIEN_METRIKEN[stufe]); break; }
      catch (e) {
        if (stufe >= MEDIEN_METRIKEN.length - 1) throw e;
        hinweise.push(`Beitragszahlen mit weniger Kennzahlen gelesen (${e.message.slice(0, 120)}).`);
        stufe++;
      }
    }
    for (const m of d.data || []) {
      const zahlen = {};
      for (const i of m.insights?.data || []) zahlen[i.name] = i.values?.[0]?.value ?? i.total_value?.value ?? null;
      medien.push({
        id: m.id, typ: m.media_product_type || null, art: m.media_type || null, zeit: m.timestamp, permalink: m.permalink || null,
        bild: m.thumbnail_url || (m.media_type !== "VIDEO" ? m.media_url : null) || null,
        text: gekuerzt(m.caption, 900), likes: m.like_count ?? null, kommentare: m.comments_count ?? null,
        zahlen: m.insights ? zahlen : null
      });
    }
    after = d.paging?.cursors?.after;
    if (!d.paging?.next || !after) break;
  }
  return medien;
}

/* Kontozahlen ueber einen Zeitraum (Summe; Reichweite = einzelne Konten). */
async function kontoWerte(von, bis) {
  const params = { period: "day", metric_type: "total_value", since: sekunden(von), until: sekunden(bis) };
  const auswerten = (d, w) => { for (const x of d.data || []) w[x.name] = x.total_value?.value ?? null; return w; };
  try {
    return auswerten(await api(`/${GEHEIM.igUserId}/insights`, { params: { ...params, metric: KONTO_METRIKEN.join(",") } }), {});
  } catch (e) {
    const w = {};
    for (const m of KONTO_METRIKEN) {
      try { auswerten(await api(`/${GEHEIM.igUserId}/insights`, { params: { ...params, metric: m } }), w); } catch (e2) { /* Kennzahl fehlt fuer dieses Konto */ }
    }
    return w;
  }
}

export async function kontoZahlen(jetzt = new Date()) {
  const mitternacht = new Date(jetzt); mitternacht.setHours(0, 0, 0, 0);
  const vor = (tage) => new Date(jetzt.getTime() - tage * 86_400_000);
  return { heute: await kontoWerte(mitternacht, jetzt), 7: await kontoWerte(vor(7), jetzt), 28: await kontoWerte(vor(28), jetzt) };
}

/* Erreichte Konten je Tag, 28 Tage. Instagram schliesst den Tag um
   Mitternacht Pazifikzeit ab; end_time minus ein Tag ist der Tag selbst. */
export async function reichweiteTage(jetzt = new Date()) {
  const d = await api(`/${GEHEIM.igUserId}/insights`, { params: { metric: "reach", period: "day", since: sekunden(new Date(jetzt.getTime() - 28 * 86_400_000)), until: sekunden(jetzt) } });
  const werte = d.data?.[0]?.values || [];
  return werte.map((v) => ({ datum: new Date(new Date(v.end_time).getTime() - 86_400_000).toISOString().slice(0, 10), wert: v.value ?? 0 }));
}

function followerMerken(anzahl, datum) {
  const f = lesen(FOLLOWER, {});
  if (Number.isFinite(anzahl)) f[datum] = anzahl;
  const tage = Object.keys(f).sort().slice(-400);
  const kurz = Object.fromEntries(tage.map((t) => [t, f[t]]));
  schreiben(FOLLOWER, kurz);
  return tage.map((t) => ({ datum: t, wert: kurz[t] }));
}

function protokollEnde(zeilen = 40) {
  try { return fs.readFileSync(path.join(PLAN_ORDNER, "protokoll.log"), "utf8").trimEnd().split("\n").slice(-zeilen); }
  catch (e) { return []; }
}

/* ------------------------------------------------------------- Stand */

export async function standBauen({ jetzt = new Date(), melden = () => {} } = {}) {
  const hinweise = [];
  const reels = planReels();
  const archiv = archivAktualisieren(reels);
  const stand = {
    version: 1,
    stand: jetzt.toISOString(),
    zeitzone: "Europe/Zurich",
    einstellungen: { reelsProTag: KONFIG.reelsProTag, postVon: KONFIG.postVon, postBis: KONFIG.postBis, mindestabstandMinuten: KONFIG.mindestabstandMinuten },
    konto: null, kontingent: null, token: lesen(path.join(PLAN_ORDNER, "token-stand.json"), null),
    kontoZahlen: null, reichweiteTage: [], followerTage: [],
    medien: [], plan: reels, protokoll: protokollEnde(), hinweise
  };

  if (!verbunden()) {
    hinweise.push("Instagram ist auf diesem Rechner nicht verbunden (IG_USER_ID / IG_ACCESS_TOKEN) – nur der Plan ist aktuell.");
    stand.followerTage = followerMerken(NaN, jetzt.toISOString().slice(0, 10));
    return stand;
  }

  const schritt = async (name, fn) => {
    try { return await fn(); }
    catch (e) { hinweise.push(`${name} nicht lesbar: ${e.message.slice(0, 200)}`); return null; }
  };
  const k = await schritt("Konto", konto);
  if (k) stand.konto = { username: k.username, name: k.name || null, follower: k.followers_count ?? null, folgt: k.follows_count ?? null, beitraege: k.media_count ?? null };
  melden("Konto gelesen");
  stand.kontingent = await schritt("Kontingent", kontingent);
  const medien = await schritt("Beitraege", () => medienLaden(hinweise));
  if (medien) {
    for (const m of medien) {
      const f = archiv[m.id];
      m.funnel = f ? { datum: f.datum, nr: f.nr, zeit: f.zeit, titel: f.titel, format: f.format, gruppe: f.gruppe, video: f.video || null, dauer: f.dauer || null } : null;
      if (f && !m.bild) m.bild = f.cover || null;
    }
    stand.medien = medien;
  }
  melden(`${stand.medien.length} Beitraege gelesen`);
  stand.kontoZahlen = await schritt("Kontozahlen", () => kontoZahlen(jetzt));
  stand.reichweiteTage = (await schritt("Reichweite je Tag", () => reichweiteTage(jetzt))) || [];
  const datum = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(jetzt);
  stand.followerTage = followerMerken(stand.konto?.follower ?? NaN, datum);
  return stand;
}

/* --------------------------------------------------- Verschluesselung */

export const schluesselErzeugen = () => crypto.randomBytes(32).toString("base64url");

export function verschluesseln(daten, schluessel) {
  if (!schluessel) throw new Error("BOARD_SCHLUESSEL fehlt in der Umgebung. Einmalig: node board.js schluessel");
  const key = crypto.createHash("sha256").update(schluessel).digest();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(KENNUNG));
  const inhalt = Buffer.concat([c.update(zlib.gzipSync(JSON.stringify(daten))), c.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), daten: inhalt.toString("base64") });
}

/* Fester Pfad, ueberschreiben, kurze CDN-Zeit: das Board kennt die URL
   (BOARD_DATEN_URL), und neue Staende sind nach spaetestens einer Minute
   sichtbar. Der Inhalt ist verschluesselt – die URL selbst ist kein
   Geheimnis. */
export async function standHochladen(text) {
  if (!GEHEIM.blobToken) throw new Error("Kein BLOB_READ_WRITE_TOKEN in der Umgebung.");
  const { put } = await import("@vercel/blob");
  const r = await put(BOARD_PFAD, text, {
    access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true,
    cacheControlMaxAge: 60, token: GEHEIM.blobToken
  });
  return r.url;
}

export function standSpeichern(stand) {
  schreiben(STAND_DATEI, stand);
}
