/* =========================================================================
   Ablage: Instagram holt das Video von einer oeffentlichen URL. Zwei Wege:

     vercel-blob   (Standard) Upload in einen Vercel-Blob-Speicher, Token
                   BLOB_READ_WRITE_TOKEN aus der Umgebung. Oeffentliche
                   URL kommt zurueck.
     ordner        Die MP4 wird in "videoOrdner" kopiert, die URL ist
                   "videoBasisUrl" + Dateiname. Fuer einen eigenen Server,
                   ein NAS mit Webfreigabe oder den Test mit der Attrappe.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { KONFIG, GEHEIM } from "./konfig.js";

export class AblageFehler extends Error {}

export async function hochladen(datei, pfad) {
  if (!fs.existsSync(datei)) throw new AblageFehler("Datei fehlt: " + datei);
  if (KONFIG.ablage === "ordner") {
    if (!KONFIG.videoOrdner || !KONFIG.videoBasisUrl) throw new AblageFehler("ablage=ordner braucht videoOrdner und videoBasisUrl (funnel.json oder VIDEO_ORDNER / VIDEO_BASIS_URL).");
    const ziel = path.join(KONFIG.videoOrdner, pfad);
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.copyFileSync(datei, ziel);
    const basis = KONFIG.videoBasisUrl.endsWith("/") ? KONFIG.videoBasisUrl : KONFIG.videoBasisUrl + "/";
    return basis + pfad.split(path.sep).join("/").split("/").map(encodeURIComponent).join("/");
  }
  if (KONFIG.ablage === "vercel-blob") {
    if (!GEHEIM.blobToken) throw new AblageFehler("Kein BLOB_READ_WRITE_TOKEN in der Umgebung (Vercel ▸ Storage ▸ Blob ▸ Token). Alternative: ablage=ordner.");
    const { put } = await import("@vercel/blob");
    const istBild = /\.jpe?g$/i.test(datei);
    const ergebnis = await put(pfad.split(path.sep).join("/"), fs.readFileSync(datei), {
      access: "public", contentType: istBild ? "image/jpeg" : "video/mp4", addRandomSuffix: false, allowOverwrite: true,
      multipart: !istBild, token: GEHEIM.blobToken
    });
    return ergebnis.url;
  }
  throw new AblageFehler(`Unbekannte Ablage "${KONFIG.ablage}" – erlaubt: vercel-blob, ordner.`);
}

/* Prueft, ob die URL wirklich von aussen erreichbar ist – Instagram
   laedt das Video selbst, ein 403 oder 404 faellt sonst erst dort auf. */
export async function erreichbar(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (r.ok) return { ok: true, status: r.status, typ: r.headers.get("content-type") };
    const g = await fetch(url, { headers: { Range: "bytes=0-0" } });
    return { ok: g.ok, status: g.status, typ: g.headers.get("content-type") };
  } catch (e) {
    return { ok: false, status: 0, fehler: e.message };
  }
}
