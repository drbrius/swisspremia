/* =========================================================================
   Storyboard aus dem Code erzeugen – damit Dokument und Reels nie
   auseinanderlaufen.

       node test/storyboard.js            schreibt marke/reels-storyboard.md

   Beispielregion ZH1 (Zuerich), Kanton BE, Datum 25.10.2026. Zahlen im
   Dokument sind die echten BAG-Werte dieser Beispiele.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { PROJEKT, KONFIG } from "../funnel/konfig.js";
import { REGION } from "../funnel/daten.js";
import * as F from "../funnel/formate.js";
import { RAHMEN, STAMM_RAHMEN, EINWAENDE, MYTHEN, STUFEN, FORMAT_STUFE, STAMM_STUFE } from "../funnel/themen.js";
import { REELS } from "../src/reels.js";
/* JSX laesst sich in Node nicht laden – Besetzung und Aktionen aus dem Quelltext lesen. */
const quelltext = (datei) => fs.readFileSync(new URL("../src/" + datei, import.meta.url), "utf8");
const block = (text, name) => text.slice(text.indexOf(name), text.indexOf("};", text.indexOf(name)));
const BESETZUNG = Object.fromEntries([...block(quelltext("Figur.jsx"), "export const BESETZUNG").matchAll(/\n  (\w+): \{([^\n]*)\}/g)].map(([, wer, rest]) => [wer, {
  frisur: (rest.match(/frisur: "(\w+)"/) || [])[1], bart: /bart: true/.test(rest), brille: /brille: true/.test(rest), kittel: /kittel: true/.test(rest),
  stethoskop: /stethoskop: true/.test(rest), kopfhoerer: /kopfhoerer: true/.test(rest), kind: /kind: true/.test(rest)
}]));
const AKTIONEN = Object.fromEntries([...block(quelltext("Szenenbild.jsx"), "export const AKTIONEN").matchAll(/(\w+): [A-Z]\w*/g)].map(([, a]) => [a, true]));

const ziel = path.join(PROJEKT, "marke", "reels-storyboard.md");
const sauber = (t) => String(t || "").replace(/\*\*/g, "").replace(/\|/g, "/");
const bild = (s) => {
  const teile = [s.art];
  if (s.figur) teile.push(`Figur: ${s.figur.wer || "–"} · ${s.figur.aktion}`);
  if (s.bild) teile.push(`Foto: ${s.bild}`);
  return teile.join("<br>");
};
const textImBild = (s) => {
  if (s.text) return s.text.map(sauber).join(" / ");
  if (s.zahl) return `${s.oben ? sauber(s.oben) + " / " : ""}${s.zahl} ${sauber(s.wort)}`;
  if (s.art === "zaehler") return `${sauber(s.oben)} CHF ${s.bis} ${sauber(s.unten)}`;
  if (s.art === "zwei") return `${sauber(s.oben)} CHF ${Math.round(s.links.bis)} vs. ${Math.round(s.rechts.bis)}`;
  if (s.punkte) return s.punkte.join(" / ");
  if (s.art === "abbinder") return "swisspremia.ch · In 1 Minute vergleichen · Link im Profil";
  return "";
};

function tabelle(p) {
  const zeilen = p.reel.szenen.map((s, i) => `| ${i + 1} | **${s.beat || "–"}** | ${bild(s)} | ${textImBild(s)} | ${sauber(s.stimme)} |`);
  return [
    `**Funnel-Stufe:** ${STUFEN[p.stufe] ? STUFEN[p.stufe].name : "–"} · **Aufforderung:** ${STUFEN[p.stufe] ? STUFEN[p.stufe].ctaVideo : "–"}`,
    "",
    `**Rahmen:** ${p.rahmen} (${(RAHMEN[p.rahmen] || []).join(" → ")})`,
    "",
    "| # | Schritt | Bild | Text im Bild | Stimme |",
    "|---|---|---|---|---|",
    ...zeilen,
    "",
    `**Bildtext, erste Zeile:** ${p.bildtext.aufhaenger}`,
    ""
  ].join("\n");
}

const datum = new Date(2026, 9, 25);
const formate = [
  ["Franchise", "Je Prämienregion. Lea steht zwischen zwei Türen – die Frage ist der Haken.", F.franchise(REGION.ZH1)],
  ["Modelle", "Je Prämienregion. Behauptung zuerst, dann der Grund, dann die Zahlen.", F.modelle(REGION.ZH1)],
  ["Altersklassen", "Je Prämienregion. Noah steigt die Treppe der Altersklassen hinauf.", F.alter(REGION.ZH1)],
  ["Unfalldeckung", "Je Prämienregion. Das Problem kennt jede angestellte Person.", F.unfall(REGION.ZH1)],
  ["Sparpotenzial", "Je Prämienregion. Vorher, Nachher – und die Brücke dazwischen.", F.flexibel(REGION.ZH1)],
  ["Prämienregionen", "Je Kanton mit mehreren Regionen.", F.regionen("BE")],
  ["Kantone", "Je Kanton.", F.kantone("ZH")],
  ["Geschichte (neu)", "Je Prämienregion. Lea ist eine Beispielfigur, die Zahlen sind echt.", F.geschichte(REGION.ZH1)],
  ["Countdown 30. November", "Täglich vom 1. Oktober bis 30. November, immer das erste Reel des Tages.", F.countdown(datum)],
  ["Mythos", `${MYTHEN.length} Folgen. Beispiel: Folge 4.`, F.mythos(3)],
  ["Einwand (neu)", `${EINWAENDE.length} Folgen. Beispiel: Folge 2 mit echten Zahlen.`, F.einwand(1)]
];

const md = [];
md.push("# Reels – Storyboards mit Figuren und Copywriting-Rahmen");
md.push("");
md.push(`Erzeugt mit \`node test/storyboard.js\` am ${new Date().toISOString().slice(0, 10)} – aus demselben Code, der die Reels baut. Nicht von Hand ändern; Änderungen gehören in \`tools/reels/funnel/formate.js\`, \`funnel/themen.js\` und \`src/reels.js\`.`);
md.push("");
md.push("## Regie-Regeln");
md.push("");
md.push("- **Haken in den ersten 3 Sekunden** – eine Figur, eine Frage oder eine Zahl, nie ein Logo.");
md.push("- **Ein Gedanke je Reel**, gebaut nach einem Copywriting-Rahmen; jede Szene ist ein Schritt.");
md.push("- **Figuren:** Der Körper bleibt ruhig, Hände und Gesicht spielen. Jede Pose mit Ausholen, Aktion, Nachschwingen. Requisiten zwischen den Händen. Die Figur nimmt mindestens ein Drittel der Bildhöhe ein und steht nie auf ihrer eigenen Farbe (helle Bühnenscheibe auf dunklem Grund).");
md.push("- **Abwechslung:** Figurenszene, Datengrafik und Foto wechseln sich ab; nie zwei gleiche Szenenarten hintereinander, wo es sich vermeiden lässt.");
md.push("- **Text im Bild** höchstens rund 22 Zeichen je Zeile; Wörter erscheinen im Sprechtempo. Zahlen, die im Bild stehen, werden nicht vorgelesen.");
md.push("- **Abschluss = Aufforderung:** Marke, Adresse, «In 1 Minute vergleichen · Link im Profil».");
md.push("- **Ehrlichkeit:** Keine Kassennamen, nur günstigste Angebote; jede Zahl mit Quellenzeile im Bildtext; Beispielfiguren als solche bezeichnet.");
md.push("- Die Grammatik (geometrische Figuren, ruhiger Körper, runde Lupe, Stempel, Strahlenkranz) ist von der Mid-Century-Animation und dem Regiebuch von lemo-opuscar (MIT) gelernt – keine Figuren, Zeichnungen oder Musik übernommen.");
md.push("");
md.push("## Copywriting-Rahmen");
md.push("");
md.push("| Rahmen | Schritte | Formate |");
md.push("|---|---|---|");
const nutzung = {};
for (const [name, , p] of formate) if (p) (nutzung[p.rahmen] ??= []).push(name);
for (const [id, r] of Object.entries(STAMM_RAHMEN)) (nutzung[r] ??= []).push(`Stamm: ${id}`);
for (const [name, schritte] of Object.entries(RAHMEN)) md.push(`| ${name} | ${schritte.join(" → ")} | ${(nutzung[name] || ["–"]).join(", ")} |`);
md.push("");
md.push("## Funnel-Stufen");
md.push("");
md.push("Jedes Reel dient einer Stufe und führt mit seiner Aufforderung in die nächste. Die Redaktion stellt den Tag nach diesen Anteilen zusammen; BOFU-Reels liegen eher am Abend, der Countdown eröffnet den Tag.");
md.push("");
md.push("| Stufe | Ziel | Aufforderung im Video | Anteil normal | Anteil in der Frist | Formate |");
md.push("|---|---|---|---|---|---|");
for (const [id, s] of Object.entries(STUFEN)) {
  const formateDerStufe = [...Object.entries(FORMAT_STUFE).filter(([, st]) => st === id).map(([f]) => f), ...Object.entries(STAMM_STUFE).filter(([, st]) => st === id).map(([r]) => "Stamm: " + r)];
  md.push(`| ${s.name} | ${s.ziel} | ${s.ctaVideo} | ${Math.round(KONFIG.stufen[id] * 100)} % | ${Math.round(KONFIG.stufenSaison[id] * 100)} % | ${formateDerStufe.join(", ")} |`);
}
md.push("");
md.push("## Besetzung");
md.push("");
md.push("| Figur | Rolle | Merkmale |");
md.push("|---|---|---|");
const ROLLE = { lea: "Hauptfigur, vergleicht und handelt", marco: "Skeptiker: Mythen, Einwände, Wandern", noah: "Junger Erwachsener, Altersklassen, Telmed", keller: "Ärztin: Notfall, Grundversorgung", mia: "Kind in der Familie", brunner: "Senior: Prämienverbilligung" };
for (const [wer, b] of Object.entries(BESETZUNG)) {
  const merkmale = [b.frisur, b.bart && "Bart", b.brille && "Brille", b.kittel && "Kittel", b.stethoskop && "Stethoskop", b.kopfhoerer && "Kopfhörer", b.kind && "Kind"].filter(Boolean).join(", ");
  md.push(`| ${wer} | ${ROLLE[wer] || ""} | ${merkmale} |`);
}
md.push("");
md.push(`**Spielszenen (${Object.keys(AKTIONEN).length}):** ${Object.keys(AKTIONEN).join(", ")}. Verwendung: \`figur: { aktion, wer, … }\` an einer Titelszene.`);
md.push("");
md.push("## Formate");
md.push("");
for (const [name, beschreibung, p] of formate) {
  if (!p) continue;
  md.push(`### ${name}`);
  md.push("");
  md.push(beschreibung);
  md.push("");
  md.push(tabelle(p));
}
md.push("## Stamm-Reels");
md.push("");
md.push("Fertig vertont; Figuren und Fotos ergänzen einzelne Szenen, die Sprechtexte sind unverändert.");
md.push("");
md.push("| Reel | Stufe | Rahmen | Figurenszenen | Fotoszenen |");
md.push("|---|---|---|---|---|");
for (const r of REELS) {
  const fig = r.szenen.filter((s) => s.figur).map((s) => `${s.id}: ${s.figur.aktion}`).join(", ");
  const foto = r.szenen.filter((s) => s.bild).map((s) => `${s.id}: ${s.bild}`).join(", ");
  md.push(`| ${r.titel} | ${(STAMM_STUFE[r.id] || "–").toUpperCase()} | ${STAMM_RAHMEN[r.id] || "–"} | ${fig || "–"} | ${foto || "–"} |`);
}
md.push("");
fs.writeFileSync(ziel, md.join("\n"));
console.log("Geschrieben:", path.relative(PROJEKT, ziel), `(${md.length} Zeilen)`);
