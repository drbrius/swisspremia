/* =========================================================================
   Bildrecherche fuer die Reels ueber Pixabay (funnel/pixabay.js).

   Suchen – Kontaktbogen mit Nummern nach out/recherche/<begriff>/:
       npm run recherche -- "Hausarzt Sprechstunde"
       npm run recherche -- "family doctor" --lang=en --anzahl=24 --seite=2
       npm run recherche -- "Arzt" --format=quer|alle --kategorie=health --neueste --ki
       npm run recherche -- "walking street autumn" --lang=en --video

   Uebernehmen – Treffer als Motiv in src/bilder.js eintragen und laden:
       npm run recherche -- --nimm=1234567 --name=hausarzt --notiz="Aerztin am Schreibtisch"
       … --fokus=0.5,0.2     Ausschnitt verschieben (0 = links/oben, 1 = rechts/unten)
       … --ersetzen          ein bestehendes Motiv gleichen Namens austauschen
   Danach in einer Szene:  { art: "titel", bild: "hausarzt", … }

   Video holen (fuer Schnittversuche, nicht im Repository):
       npm run recherche -- --video --lade=1234567 [--groesse=mittel]

   Fotos kommen ueber die API bis 1280 px Kantenlaenge; fuer das Reel werden
   sie auf 1296 x 2304 hochgerechnet. Hinter der dunklen Farbschicht reicht
   das – fuer ein Foto ohne Schicht waere es zu weich.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { WURZEL } from "./konfig.js";
import { argumente } from "./zustand.js";
import { suchen, nachId, herunterladen, PixabayFehler } from "./pixabay.js";
import { bildSichern, pixabayEintrag } from "./bilder.js";
import { BILDER, bildDatei, bildDateiKarussell } from "../src/bilder.js";

const AUS = path.join(WURZEL, "out", "recherche");
const TABELLE = path.join(WURZEL, "src", "bilder.js");
const arg = argumente();
const kurz = (text) => String(text).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "suche";
const html = (text) => String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ---- Suchen --------------------------------------------------------- */
async function recherche(begriff) {
  const video = Boolean(arg.video);
  const { gesamt, treffer } = await suchen(begriff, {
    art: video ? "video" : "foto", lang: arg.lang || "de", format: arg.format || "hoch", anzahl: Number(arg.anzahl) || 12,
    seite: Number(arg.seite) || 1, kategorie: arg.kategorie, reihenfolge: arg.neueste ? "latest" : "popular", ki: Boolean(arg.ki), frisch: Boolean(arg.frisch)
  });
  if (!treffer.length) { console.log(`Keine passenden Treffer fuer «${begriff}» (${gesamt} insgesamt, vor dem Filter auf Format und KI). Englisch versuchen: --lang=en`); return; }
  const ordner = path.join(AUS, kurz(begriff) + (video ? "-video" : ""));
  fs.rmSync(ordner, { recursive: true, force: true });
  fs.mkdirSync(ordner, { recursive: true });
  for (const t of treffer) {
    try { await herunterladen(t.vorschau, path.join(ordner, `${t.id}.jpg`)); } catch (e) { console.log(`  Vorschau ${t.id} fehlt: ${e.message}`); }
  }
  fs.writeFileSync(path.join(ordner, "treffer.json"), JSON.stringify({ begriff, gesamt, treffer }, null, 2));

  const befehl = (t) => (video ? `npm run recherche -- --video --lade=${t.id}` : `npm run recherche -- --nimm=${t.id} --name=…`);
  const karte = (t) => `<figure><img src="${t.id}.jpg" alt=""><figcaption><b>${t.id}</b> · ${t.breite}×${t.hoehe}${video ? ` · ${t.dauer} s` : ""}${t.ki ? " · KI" : ""}<br>
    <span>${html(t.tags)}</span><br><span>${html(t.autor)} · <a href="${html(t.seite)}">Pixabay</a></span><code>${befehl(t)}</code></figcaption></figure>`;
  fs.writeFileSync(path.join(ordner, "index.html"), `<!doctype html><html lang="de"><meta charset="utf-8"><title>Recherche: ${html(begriff)}</title>
<style>body{margin:24px;font:14px/1.4 system-ui,sans-serif;background:#141c24;color:#e8eef2}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;color:#9fb2c0}
main{display:grid;grid-template-columns:repeat(${video ? 4 : 6},1fr);gap:14px}figure{margin:0;background:#212d39;border-radius:8px;overflow:hidden}
img{display:block;width:100%;aspect-ratio:${video ? "16/9" : "9/16"};object-fit:cover}figcaption{padding:8px 10px;font-size:12px}b{font-size:15px;color:#f2d998}
span{color:#9fb2c0}a{color:#8fd0e8}code{display:block;margin-top:6px;font-size:10px;color:#6f8493;word-break:break-all}</style>
<h1>${video ? "Videos" : "Fotos"} zu «${html(begriff)}»</h1><p>${treffer.length} von ${gesamt} Treffern · Quelle: Pixabay (Pixabay-Inhaltslizenz) · Vorschau im Reel-Zuschnitt, das Original kann breiter sein</p>
<main>${treffer.map(karte).join("\n")}</main></html>`);

  bogen(ordner, treffer.length, video);
  console.log(`«${begriff}»: ${treffer.length} von ${gesamt} Treffern\n`);
  for (const t of treffer) console.log(`  ${String(t.id).padEnd(9)} ${`${t.breite}x${t.hoehe}`.padEnd(10)} ${video ? String(t.dauer + " s").padEnd(6) : ""}${t.tags.slice(0, 70)}`);
  console.log(`\nKontaktbogen: ${path.relative(WURZEL, path.join(ordner, "index.html"))}${fs.existsSync(path.join(ordner, "bogen.png")) ? " (Bild: bogen.png)" : ""}`);
  console.log(video ? "Holen:        npm run recherche -- --video --lade=<Nummer>" : "Uebernehmen:  npm run recherche -- --nimm=<Nummer> --name=<motiv>");
}

/* Kontaktbogen als ein Bild – mit dem installierten Chrome abfotografiert. */
function bogen(ordner, anzahl, video) {
  const chrome = [process.env.BROWSER, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((p) => p && fs.existsSync(p));
  if (!chrome) return;
  const spalten = video ? 4 : 6, breite = 1500, kachel = (breite - 48 - (spalten - 1) * 14) / spalten;
  const hoehe = Math.round(110 + Math.ceil(anzahl / spalten) * (kachel * (video ? 9 / 16 : 16 / 9) + 200));
  spawnSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${breite},${hoehe}`,
    `--screenshot=${path.join(ordner, "bogen.png")}`, pathToFileURL(path.join(ordner, "index.html")).href], { stdio: "ignore", timeout: 60_000 });
}

/* ---- Uebernehmen ---------------------------------------------------- */
async function uebernehmen(id, name) {
  if (!/^\d+$/.test(String(id))) throw new PixabayFehler("--nimm braucht die Nummer des Treffers.");
  if (!name || !/^[a-z][a-z0-9]{1,24}$/.test(name)) throw new PixabayFehler("--name=<motiv> fehlt oder passt nicht (nur Kleinbuchstaben und Ziffern, z. B. hausarzt).");
  if (BILDER[name] && !arg.ersetzen) throw new PixabayFehler(`Das Motiv «${name}» gibt es schon (${BILDER[name]}). Anderer Name oder --ersetzen.`);
  const wert = `pixabay:${id}${arg.fokus ? "@" + arg.fokus : ""}`;
  if (!pixabayEintrag(wert)) throw new PixabayFehler("--fokus braucht zwei Zahlen zwischen 0 und 1, z. B. --fokus=0.5,0.2");
  const t = await nachId(id);
  if (t.ki && !arg.ki) throw new PixabayFehler(`Bild ${id} ist als KI-erzeugt markiert. Mit --ki trotzdem uebernehmen.`);

  /* Erst laden, dann eintragen: ein Motiv ohne Datei soll nicht in der Tabelle stehen. */
  const meldungen = [];
  if (!(await bildSichern(name, wert, { neu: true, melden: (m) => meldungen.push(m) }))) throw new PixabayFehler(meldungen.join("; ") || "Bild nicht geladen.");
  const notiz = String(arg.notiz || t.tags.split(",").slice(0, 3).map((s) => s.trim()).join(", ")).replace(/\*\//g, "").replace(/[\r\n]+/g, " ");
  eintragen(name, wert, `${notiz} (Pixabay, ${t.autor})`);
  for (const m of meldungen) console.log(m);
  console.log(`\nMotiv «${name}» eingetragen: ${wert} – ${t.seite}`);
  console.log(`Dateien: public/${bildDatei(name)} (Reel), public/${bildDateiKarussell(name)} (Karussell)`);
  console.log(`Verwenden: { art: "titel", bild: "${name}", … }   Ausschnitt aendern: --ersetzen --fokus=x,y`);
}

/* Zeile in die Tabelle BILDER von src/bilder.js schreiben (oder ersetzen). */
function eintragen(name, wert, kommentar) {
  const zeilen = fs.readFileSync(TABELLE, "utf8").split("\n");
  const neu = (komma) => `  ${name}: "${wert}"${komma ? "," : ""}  // ${kommentar}`;
  const start = zeilen.findIndex((z) => z.startsWith("export const BILDER = {"));
  const ende = zeilen.findIndex((z, i) => i > start && z.trim() === "};");
  if (start < 0 || ende < 0) throw new PixabayFehler("Tabelle BILDER in src/bilder.js nicht gefunden.");
  const eintrag = /^(\s*[a-z][a-z0-9]*:\s*"[^"]+")(,?)(.*)$/;
  const da = zeilen.findIndex((z, i) => i > start && i < ende && new RegExp(`^\\s*${name}:\\s*"`).test(z));
  if (da >= 0) {
    zeilen[da] = neu(eintrag.exec(zeilen[da])?.[2] === ",");
  } else {
    let letzter = ende - 1;
    while (letzter > start && !eintrag.test(zeilen[letzter])) letzter--;
    if (letzter > start) zeilen[letzter] = zeilen[letzter].replace(eintrag, (_, a, __, rest) => `${a},${rest}`);
    const block = zeilen.some((z) => z.includes("/* Pixabay")) ? [] : ["  /* Pixabay (Pixabay-Inhaltslizenz) – gesucht und eingetragen mit funnel/recherche.js. */"];
    zeilen.splice(ende, 0, ...block, neu(false));
  }
  fs.writeFileSync(TABELLE, zeilen.join("\n"));
}

/* ---- Video holen ---------------------------------------------------- */
async function videoHolen(id) {
  const t = await nachId(id, { art: "video" });
  const datei = t.dateien[{ gross: "gross", mittel: "mittel", klein: "klein" }[arg.groesse] || "gross"] || t.dateien.mittel || t.dateien.klein;
  if (!datei) throw new PixabayFehler(`Video ${id} hat keine ladbare Datei.`);
  const ziel = path.join(AUS, "videos", `${id}.mp4`);
  const bytes = await herunterladen(datei.url, ziel);
  fs.writeFileSync(ziel.replace(/\.mp4$/, ".json"), JSON.stringify({ id: t.id, seite: t.seite, autor: t.autor, tags: t.tags, dauer: t.dauer, breite: datei.breite, hoehe: datei.hoehe }, null, 2));
  console.log(`Video ${id}: ${datei.breite}x${datei.hoehe}, ${t.dauer} s, ${(bytes / 1e6).toFixed(1)} MB -> ${path.relative(WURZEL, ziel)}\n${t.seite} (${t.autor})`);
}

try {
  if (arg.nimm) await uebernehmen(arg.nimm, arg.name);
  else if (arg.lade) await videoHolen(arg.lade);
  else if (arg._.length) await recherche(arg._.join(" "));
  else console.log('Aufruf: npm run recherche -- "<Suchbegriff>" [--lang=en] [--anzahl=24] [--video]   |   --nimm=<Nummer> --name=<motiv>');
} catch (e) {
  if (!(e instanceof PixabayFehler)) throw e;
  console.error(e.message);
  process.exitCode = 1;
}
