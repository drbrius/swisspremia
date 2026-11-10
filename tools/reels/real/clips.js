/* =========================================================================
   Serie «Echt» – Clips: je Reel EIN zusammenhaengender 15-Sekunden-Clip mit
   vier Einstellungen (Higgsfield, Modell seedance_2_0, 720p, 9:16, ohne
   Ton). Dieselbe Person in allen Einstellungen; die Laenge jeder
   Einstellung folgt der Sprechdauer ihrer Szene.

       node real/clips.js plan [id]         Prompt und Einstellungen je Reel (JSON)
       node real/clips.js holen <id> <url>  Clip laden, Schnitte suchen, eintragen
       node real/clips.js stand             welche Clips liegen vor

   Erzeugt wird ueber die Higgsfield-Verbindung (nicht von hier aus); dieses
   Skript liefert den Prompt und nimmt das Ergebnis entgegen.
   Ablage: public/real/clips/<id>.mp4 (nicht im Repository), Schnitte und
   Herkunft in real/clips.json.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";
import { REELS, STIL } from "./skripte.js";
import { ffmpegPfad } from "../funnel/musik-synth.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
export const CLIP_ORDNER = path.join(WURZEL, "public", "real", "clips");
const VERZEICHNIS = path.join(HIER, "clips.json");
export const CLIP_SEKUNDEN = 15;

export const clipsLesen = () => { try { return JSON.parse(fs.readFileSync(VERZEICHNIS, "utf8")); } catch (e) { return {}; } };
const zeitenLesen = (id) => JSON.parse(fs.readFileSync(path.join(HIER, "zeiten", `${id}.json`), "utf8"));

/* Szenengrenzen in Sekunden aus den Sprechzeiten: Szene i beginnt mit
   ihrem ersten Block; der Abbinder ist die letzte «Szene». */
export function szenenZeiten(reel, z = zeitenLesen(reel.id)) {
  const n = reel.szenen.length;
  const start = [];
  for (let i = 0; i <= n; i++) start.push(i === 0 ? 0 : z.bloecke.find((b) => b.szene === i).von - 0.12);
  const ende = z.gesamt + 0.9;   // Ausklang
  return { start, ende, dauer: start.map((s, i) => (i < n ? start[i + 1] : ende) - s) };
}

/* Laenge je Einstellung in halben Sekunden, anteilig zur Sprechdauer ihrer
   Szene, mindestens 2.5 s, zusammen CLIP_SEKUNDEN. So laeuft jede
   Einstellung spaeter etwa gleich schnell (rund 0.8- bis 1-fach). */
export function einstellungen(reel) {
  const { dauer } = szenenZeiten(reel);
  const d = dauer.slice(0, reel.szenen.length);
  const summe = d.reduce((x, y) => x + y, 0);
  const SCHRITT = 0.5, MIN = 2.5;
  const ideal = d.map((x) => (x / summe) * CLIP_SEKUNDEN);
  const sek = ideal.map((x) => Math.max(MIN, Math.round(x / SCHRITT) * SCHRITT));
  const total = () => sek.reduce((x, y) => x + y, 0);
  for (let i = 0; Math.abs(total() - CLIP_SEKUNDEN) > 1e-9 && i < 100; i++) {
    const diff = CLIP_SEKUNDEN - total();
    const abw = sek.map((x, k) => ideal[k] - x);
    const kandidaten = sek.map((x, k) => k).filter((k) => diff > 0 || sek[k] - SCHRITT >= MIN);
    const k = kandidaten.sort((x, y) => (diff > 0 ? abw[y] - abw[x] : abw[x] - abw[y]))[0];
    sek[k] += Math.sign(diff) * SCHRITT;
  }
  const grenzen = [0];
  for (const x of sek) grenzen.push(Math.round((grenzen[grenzen.length - 1] + x) * 10) / 10);
  return { sekunden: sek, grenzen };
}

export function prompt(reel) {
  const { grenzen } = einstellungen(reel);
  const mehrere = /couple|family|partner/.test(reel.person);
  const wer = mehrere ? `the same people in all shots: ${reel.person}` : `the same person in all shots: ${reel.person}`;
  const shots = reel.szenen.map((sz, i) => `Shot ${i + 1} (${grenzen[i]}-${grenzen[i + 1]}s): ${sz.bild}`).join(" ");
  return `Photorealistic documentary footage, vertical, ${reel.szenen.length} shots with hard cuts, ${wer}, same clothes throughout. ${shots} ${STIL.replace(/^Photorealistic documentary footage, vertical\. /, "")}`;
}

/* Schnitte im fertigen Clip finden: kleine Graustufenbilder vergleichen,
   die groessten Spruenge nahe den geplanten Grenzen sind die Schnitte. */
/* Graustufen-PNG (8 Bit) aus einem Puffer lesen: IDAT entpacken, Zeilenfilter
   zurueckrechnen. Das mitgelieferte ffmpeg kann kein Rohvideo ausgeben,
   wohl aber eine Folge kleiner PNG. */
function pngGrau(buf, ab) {
  let pos = ab + 8, b = 0, h = 0;
  const idat = [];
  for (;;) {
    const laenge = buf.readUInt32BE(pos), typ = buf.toString("latin1", pos + 4, pos + 8), daten = buf.subarray(pos + 8, pos + 8 + laenge);
    if (typ === "IHDR") { b = daten.readUInt32BE(0); h = daten.readUInt32BE(4); }
    else if (typ === "IDAT") idat.push(daten);
    pos += 12 + laenge;
    if (typ === "IEND") break;
  }
  const roh = zlib.inflateSync(Buffer.concat(idat)), px = new Uint8Array(b * h);
  for (let y = 0; y < h; y++) {
    const f = roh[y * (b + 1)], z = y * (b + 1) + 1;
    for (let x = 0; x < b; x++) {
      const li = x ? px[y * b + x - 1] : 0, ob = y ? px[(y - 1) * b + x] : 0, lo = x && y ? px[(y - 1) * b + x - 1] : 0;
      let v = roh[z + x];
      if (f === 1) v += li; else if (f === 2) v += ob; else if (f === 3) v += (li + ob) >> 1;
      else if (f === 4) { const q = li + ob - lo, a = Math.abs(q - li), c = Math.abs(q - ob), d = Math.abs(q - lo); v += a <= c && a <= d ? li : c <= d ? ob : lo; }
      px[y * b + x] = v & 255;
    }
  }
  return { px, ende: pos };
}

export function schnitteFinden(datei, geplant) {
  const B = 36, H = 64, FPS = 24;
  const r = spawnSync(ffmpegPfad(), ["-hide_banner", "-loglevel", "error", "-i", datei, "-vf", `scale=${B}:${H},format=gray`, "-c:v", "png", "-f", "image2pipe", "-"], { maxBuffer: 1 << 28 });
  const buf = r.stdout, bilder = [];
  for (let pos = 0; pos + 8 < buf.length;) { const e = pngGrau(buf, pos); bilder.push(e.px); pos = e.ende; }
  const n = bilder.length;
  const diff = [0];
  for (let f = 1; f < n; f++) { let sum = 0; for (let i = 0; i < B * H; i++) sum += Math.abs(bilder[f][i] - bilder[f - 1][i]); diff.push(sum / (B * H)); }
  const sortiert = [...diff].sort((x, y) => x - y), median = sortiert[Math.floor(n / 2)] || 1;
  const gefunden = geplant.slice(1, -1).map((g) => {
    /* groesster Sprung im Fenster ±1.2 s um die geplante Grenze */
    let best = -1, wert = 0;
    for (let f = Math.max(1, Math.round((g - 1.2) * FPS)); f <= Math.min(n - 1, Math.round((g + 1.2) * FPS)); f++) if (diff[f] > wert) { wert = diff[f]; best = f; }
    const sicher = wert > Math.max(12, median * 6);
    return { geplant: g, zeit: sicher ? best / FPS : g, sicher, sprung: Math.round(wert * 10) / 10 };
  });
  /* Massgebend sind die tatsaechlichen Schnitte: alle deutlichen Spruenge,
     bei mehreren innerhalb von 0.8 s nur der groesste. Das Modell haelt die
     gewuenschten Laengen nur ungefaehr ein. */
  const kandidaten = diff.map((w, f) => ({ f, w })).filter((x) => x.w > Math.max(12, median * 6)).sort((x, y) => y.w - x.w);
  const gewaehlt = [];
  for (const k of kandidaten) if (k.f > 0.8 * FPS && k.f < n - 0.8 * FPS && gewaehlt.every((g) => Math.abs(g.f - k.f) > 0.8 * FPS)) gewaehlt.push(k);
  const alle = gewaehlt.sort((x, y) => x.f - y.f).map((x) => Math.round((x.f / FPS) * 1000) / 1000);
  return { frames: n, dauer: n / FPS, schnitte: gefunden, alle, grenzen: [0, ...alle, Math.round((n / FPS) * 1000) / 1000] };
}

async function holen(id, url, jobId = null) {
  const reel = REELS.find((r) => r.id === id);
  if (!reel) throw new Error(`Unbekanntes Reel "${id}"`);
  fs.mkdirSync(CLIP_ORDNER, { recursive: true });
  const ziel = path.join(CLIP_ORDNER, `${id}.mp4`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download HTTP ${r.status}`);
  fs.writeFileSync(ziel, Buffer.from(await r.arrayBuffer()));
  const plan = einstellungen(reel);
  const s = schnitteFinden(ziel, plan.grenzen);
  const v = clipsLesen();
  v[id] = { datei: `real/clips/${id}.mp4`, modell: "seedance_2_0", aufloesung: "720p", jobId, geladen: new Date().toISOString(), dauer: Math.round(s.dauer * 100) / 100, geplant: plan.grenzen, grenzen: s.grenzen, einstellungen: s.grenzen.length - 1, prompt: prompt(reel) };
  fs.writeFileSync(VERZEICHNIS, JSON.stringify(v, null, 1));
  console.log(`${id}: ${s.dauer.toFixed(2)} s, ${s.grenzen.length - 1} Einstellungen, Schnitte bei ${s.alle.join(" / ")} (geplant ${plan.grenzen.slice(1, -1).join(" / ")})`);
}

const alsSkript = process.argv[1] && /real[\\/]clips\.js$/.test(process.argv[1]);
if (alsSkript) {
  const [befehl, a, b, c] = process.argv.slice(2);
  try {
    if (befehl === "plan") {
      const liste = REELS.filter((r) => !a || r.id === a).map((r) => ({ id: r.id, ...einstellungen(r), szenen: szenenZeiten(r).dauer.map((x) => Math.round(x * 10) / 10), prompt: prompt(r) }));
      console.log(JSON.stringify(a ? liste[0] : liste, null, 1));
    } else if (befehl === "naechster") {
      /* erstes Reel ohne Clip (optional ab einer Id): Id und Prompt */
      const v = clipsLesen();
      const offen = REELS.filter((r) => !v[r.id] && !(process.argv.slice(3) || []).includes(r.id));
      if (!offen.length) console.log("ALLE CLIPS VORHANDEN");
      else console.log([offen[0].id, prompt(offen[0]), `(noch offen: ${offen.map((r) => r.id).join(", ")})`].join("\n"));
    } else if (befehl === "holen") {
      await holen(a, b, c || null);
    } else if (befehl === "stand") {
      const v = clipsLesen();
      for (const r of REELS) console.log(`  ${r.id.padEnd(16)} ${v[r.id] && fs.existsSync(path.join(WURZEL, "public", v[r.id].datei)) ? `vorhanden, ${v[r.id].grenzen.length - 1} Einstellungen, Grenzen ${v[r.id].grenzen.join(" / ")}` : "fehlt"}`);
    } else console.log("Befehle: plan [id] | holen <id> <url> [jobId] | stand");
  } catch (e) { console.error("\n" + e.message + "\n"); process.exitCode = 1; }
}
