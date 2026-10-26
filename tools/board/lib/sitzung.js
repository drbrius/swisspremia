/* =========================================================================
   Login und Sitzung

   Zugang aus den Umgebungsvariablen des Vercel-Projekts:
     BOARD_BENUTZER     Benutzername
     BOARD_PASSWORT     mindestens 12 Zeichen
     BOARD_SCHLUESSEL   derselbe Wert wie auf dem Rechner (entschluesselt
                        den Stand und signiert die Sitzung)
   Fehlt einer, bleibt das Board zu – es gibt keinen Ersatzzugang.

   Sitzung = Cookie "sp_board": Nutzlast (Benutzer, Ablauf) plus
   HMAC-Signatur. Der Signaturschluessel haengt am Passwort: ein neues
   Passwort meldet alle Geraete ab.
   ========================================================================= */
import crypto from "node:crypto";
import { cookiesLesen } from "./http.js";

const COOKIE = "sp_board";
const GUELTIG_TAGE = 30;
export const MINDESTLAENGE = 12;

export function einstellungen() {
  const benutzer = process.env.BOARD_BENUTZER || "";
  const passwort = process.env.BOARD_PASSWORT || "";
  const schluessel = process.env.BOARD_SCHLUESSEL || "";
  const fehlt = [];
  if (!benutzer) fehlt.push("BOARD_BENUTZER");
  if (passwort.length < MINDESTLAENGE) fehlt.push(`BOARD_PASSWORT (mindestens ${MINDESTLAENGE} Zeichen)`);
  if (!schluessel) fehlt.push("BOARD_SCHLUESSEL");
  return { benutzer, passwort, schluessel, fehlt };
}

const signieren = (e, text) =>
  crypto.createHmac("sha256", crypto.createHash("sha256").update(`sitzung|${e.schluessel}|${e.passwort}`).digest()).update(text).digest("base64url");

/* Vergleich in konstanter Zeit, auch bei unterschiedlicher Laenge. */
function gleich(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export function zugangPruefen(benutzer, passwort, e = einstellungen()) {
  const benutzerOk = gleich(benutzer, e.benutzer);
  const passwortOk = gleich(passwort, e.passwort);
  return !e.fehlt.length && benutzerOk && passwortOk;
}

/* Lokal (http://localhost) ohne Secure, sonst kaeme das Cookie nie an. */
function cookie(req, wert, sekunden) {
  const lokal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "");
  return `${COOKIE}=${wert}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sekunden}${lokal ? "" : "; Secure"}`;
}

export function sitzungAusstellen(req, res, e = einstellungen()) {
  const nutzlast = Buffer.from(JSON.stringify({ u: e.benutzer, bis: Date.now() + GUELTIG_TAGE * 86_400_000 })).toString("base64url");
  res.setHeader("Set-Cookie", cookie(req, `${nutzlast}.${signieren(e, nutzlast)}`, GUELTIG_TAGE * 86_400));
}

export function sitzungBeenden(req, res) {
  res.setHeader("Set-Cookie", cookie(req, "", 0));
}

export function sitzung(req, e = einstellungen()) {
  if (e.fehlt.length) return null;
  const [nutzlast, signatur] = String(cookiesLesen(req)[COOKIE] || "").split(".");
  if (!nutzlast || !signatur || !gleich(signatur, signieren(e, nutzlast))) return null;
  try {
    const d = JSON.parse(Buffer.from(nutzlast, "base64url").toString("utf8"));
    return d.bis > Date.now() && d.u === e.benutzer ? d : null;
  } catch (err) {
    return null;
  }
}
