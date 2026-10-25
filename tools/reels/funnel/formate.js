/* =========================================================================
   Formate: Aus Daten und Themen werden fertige Reels.

   Jedes Format liefert ein "Paket":
     { format, gruppe, schluessel, titel, sprache, cover, reel, bildtext }
   reel ist ein Objekt wie in src/reels.js (Szenen mit text/stimme/dauer),
   bildtext = { aufhaenger, absaetze, quelle, hashtags }.

   Gruppen:  daten   aus den BAG-Praemien, je Region oder Kanton
             wissen  Stamm-Reels aus src/reels.js und die Mythen-Reihe
             saison  Countdown zur laufenden Frist

   Regeln:   keine Kassennamen, nur "guenstigstes Angebot";
             jede Zahl stammt aus data/praemien.js und wird im Bildtext
             mit Region, Jahr und Annahmen belegt;
             Bildzeilen hoechstens rund 26 Zeichen, Stimme in ganzen
             Saetzen mit ausgeschriebenen Zahlen.
   ========================================================================= */
import { REGIONEN, KANTONE, KANTONE_MIT_REGIONEN, MODELLE, JAHR, angebote, guenstigstes, praemieVon, kantonsMinimum } from "./daten.js";
import { REELS } from "../src/reels.js";
import { STAMM, MYTHEN, kantonHashtag } from "./themen.js";
import { hashtagsSammeln } from "./bildtext.js";
import { zahlwort, franken, chf, tageBis, fingerabdruck, datumKurz } from "./sprache.js";
import { AUDIO_ORDNER } from "./konfig.js";
import { kantonBild } from "../src/bilder.js";

const ABBINDER = { art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." };
const rund = (n) => Math.round(n);
const jahr = (monatlich) => rund(monatlich * 12);

function paket({ format, gruppe, param, titel, sprache = "de", szenen, cover = 0.3, bildtext, reelId = null, audioOrdner = AUDIO_ORDNER }) {
  const mitIds = szenen.map((s, i) => ({ id: "s" + (i + 1), ...s }));
  /* Die Id traegt einen Fingerabdruck der Sprechtexte: aendert sich ein
     Satz, entsteht eine neue Id und damit eine neue Tonspur – sonst wird
     die alte wiederverwendet (spart ElevenLabs-Zeichen). */
  const id = reelId || `${format}-${param.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${fingerabdruck(mitIds.map((s) => s.stimme || "").join("|"))}`;
  return {
    format, gruppe, param, schluessel: `${format}|${param}`, titel, sprache, cover, bildtext,
    reel: { id, titel, sprache, audioOrdner, szenen: mitIds }
  };
}

const quelle = (region, was) => `Zahlen: ${was}, ${region.beschreibung}, BAG-Prämien ${JAHR}, gerundet. Beispielrechnung, keine Beratung.`;
const tagsRegion = (region, ...saetze) => hashtagsSammeln(saetze, [kantonHashtag(region.kantonName)]);

/* ------------------------------------------------------------ 1 Franchise */
export function franchise(region) {
  /* Dasselbe Angebot (Kasse + Modell) bei Franchise 300 und 2500 – zuerst
     im Standardmodell gesucht, sonst im guenstigsten Modell, das in beiden
     Listen vorkommt. */
  const kandidaten = angebote(region.schluessel, "E", 300, "M");
  const passend = (a) => ({ ...a, hoch: praemieVon(a.versicherer, a.modell, region.schluessel, "E", 2500, "M") });
  const treffer = kandidaten.filter((a) => a.modell === 0).map(passend).find((a) => a.hoch) || kandidaten.map(passend).find((a) => a.hoch);
  if (!treffer || treffer.praemie - treffer.hoch < 20) return null;
  const p300 = treffer.praemie, p2500 = treffer.hoch, diff = p300 - p2500, ersparnis = jahr(diff);
  const modell = MODELLE[treffer.modell];
  /* Faustregel: Zwischen 300 und 2500 kostet jeder Franken Arztkosten mit
     der hohen Franchise 90 Rappen mehr (10 % Selbstbehalt zahlen Sie so
     oder so). Unter dieser Grenze gewinnt 2500. */
  const immer = ersparnis >= 2200;
  const grenze = immer ? null : Math.round((300 + ersparnis / 0.9) / 50) * 50;
  const name = region.name;
  return paket({
    format: "franchise", gruppe: "daten", param: region.schluessel, titel: `Franchise in ${name}`, cover: 0.28,
    szenen: [
      { art: "zwei", hintergrund: "creme", bild: kantonBild(region.kanton, "dorf"), oben: (name.length > 14 ? "" : name + ": ") + "Franchise 2'500 vs. 300", links: { praefix: "CHF", bis: p2500 }, rechts: { praefix: "CHF", bis: p300 }, dauer: 3.2,
        stimme: `${name}: Franchise zweitausendfünfhundert oder dreihundert? Gleiche Kasse, gleiches Modell.` },
      { art: "zaehler", hintergrund: "petrol", praefix: "CHF", von: 0, bis: ersparnis, oben: "Prämienersparnis im Jahr", unten: "mit Franchise 2'500", dauer: 3.2,
        stimme: `Mit der hohen Franchise sparen Sie ${franken(ersparnis)} Prämie im Jahr.` },
      { art: "titel", hintergrund: "slate", text: ["Dafür tragen Sie bis zu", "**CHF 2'200** mehr selbst."], klein: "Wenn Sie krank werden.", dauer: 3.0,
        stimme: "Dafür tragen Sie bis zu zweitausendzweihundert Franken mehr selbst – wenn Sie krank werden." },
      immer
        ? { art: "titel", hintergrund: "petrol", text: ["Ersparnis grösser", "als das Risiko.", "2'500 gewinnt immer."], dauer: 3.2,
            stimme: "Hier ist die Ersparnis grösser als das Risiko. Die hohe Franchise gewinnt in jedem Fall." }
        : { art: "titel", hintergrund: "petrol", text: ["Faustregel:", `Unter ${chf(grenze)}`, "Arztkosten im Jahr", "gewinnt 2'500."], dauer: 3.4,
            stimme: `Faustregel: Bleiben Ihre Arztkosten unter ${franken(grenze)} im Jahr, gewinnt die hohe Franchise.` },
      { art: "titel", hintergrund: "creme", text: ["Franchise ändern –", "bis 30. November,", "ohne Kassenwechsel."], dauer: 3.2,
        stimme: "Die Franchise ändern Sie bis Ende November – ohne die Kasse zu wechseln." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${name}: Franchise 2'500 statt 300 spart ${chf(ersparnis)} Prämie im Jahr. Ob sich das lohnt, entscheidet eine Zahl.`,
      absaetze: [
        `Gleiche Kasse, gleiches Modell: ${chf(p300)} im Monat mit Franchise 300, ${chf(p2500)} mit Franchise 2'500. Dafür tragen Sie im Krankheitsfall bis zu CHF 2'200 mehr selbst.`,
        immer
          ? "Hier ist die Prämienersparnis grösser als das zusätzliche Risiko – die hohe Franchise gewinnt rechnerisch in jedem Fall."
          : `Faustregel: Bleiben Ihre Arztkosten im Jahr unter ${chf(grenze)}, fahren Sie mit 2'500 besser. Darüber mit 300. Dazwischen liegende Franchisen sind selten die beste Wahl.`,
        "Die Franchise ändern Sie jedes Jahr bis 30. November, ohne die Kasse zu wechseln. Das Geld für den Ernstfall muss aber da sein."
      ],
      quelle: quelle(region, `günstigstes ${modell}-Angebot für Erwachsene mit Unfalldeckung`),
      hashtags: tagsRegion(region, "franchise")
    }
  });
}

/* -------------------------------------------------------------- 2 Modelle */
export function modelle(region) {
  const je = [0, 1, 2, 3].map((m) => guenstigstes(region.schluessel, "E", 300, "M", m));
  if (!je[0] || !je[1]) return null;
  const alternativen = [2, 3].filter((m) => je[m]).map((m) => ({ modell: m, praemie: je[m].praemie })).sort((a, b) => a.praemie - b.praemie);
  if (!alternativen.length) return null;
  const s0 = je[0].praemie, s1 = je[1].praemie, best = alternativen[0];
  const guenstigstesModell = s1 <= best.praemie ? { modell: 1, praemie: s1 } : best;
  const diff = jahr(s0 - guenstigstesModell.praemie);
  if (diff < 240) return null;
  const name = region.name, bestName = MODELLE[guenstigstesModell.modell];
  const balken = [
    { label: "Standard", hoehe: 1 },
    { label: "Hausarzt", hoehe: s1 / s0, gold: guenstigstesModell.modell === 1 },
    { label: MODELLE[best.modell], hoehe: best.praemie / s0, gold: guenstigstesModell.modell === best.modell }
  ];
  return paket({
    format: "modelle", gruppe: "daten", param: region.schluessel, titel: `Modelle in ${name}`, cover: 0.3,
    szenen: [
      { art: "modelle", hintergrund: "slate", text: [`${name}:`, "drei Alternativen", "zum Standard."], dauer: 4.2,
        stimme: `Hausarzt, HMO oder Telmed: In ${name} sind alle drei günstiger als das Standardmodell – bei gleichen Leistungen.` },
      { art: "balken", hintergrund: "petrol", balken, text: ["Günstigstes Angebot", "je Modell, pro Monat."], dauer: 4.2,
        stimme: `Standard ${franken(s0)}. Hausarzt ${franken(s1)}. ${MODELLE[best.modell]} ${franken(best.praemie)}.` },
      { art: "zaehler", hintergrund: "slate", praefix: "CHF", von: 0, bis: diff, oben: `Standard → ${bestName}:`, unten: "weniger im Jahr", dauer: 3.2,
        stimme: `Vom Standard zum ${bestName}-Modell: ${franken(diff)} weniger im Jahr.` },
      { art: "titel", hintergrund: "creme", bild: "arzt", text: ["Notfälle sind in jedem", "Modell gedeckt."], klein: "Sie binden sich nur bei der ersten Anlaufstelle.", dauer: 3.2,
        stimme: "Notfälle sind in jedem Modell gedeckt. Sie binden sich nur bei der ersten Anlaufstelle." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${name}: Vom Standardmodell zum ${bestName}-Modell sind es ${chf(diff)} im Jahr – bei identischen Leistungen.`,
      absaetze: [
        `Günstigstes Angebot pro Monat: Standard ${chf(s0)}, Hausarzt ${chf(s1)}, ${MODELLE[best.modell]} ${chf(best.praemie)}.`,
        "Sie tauschen ein Stück freie Arztwahl gegen eine tiefere Prämie. Wer ohnehin einen Hausarzt hat, verliert mit dem Hausarztmodell nichts. Notfälle sind in jedem Modell gedeckt.",
        "Das Modell wechseln Sie bei Ihrer Kasse auf das neue Jahr – oder gleich zusammen mit der Kasse."
      ],
      quelle: quelle(region, "günstigstes Angebot je Modell, Erwachsene, Franchise 300, mit Unfalldeckung"),
      hashtags: tagsRegion(region, "modelle")
    }
  });
}

/* ---------------------------------------------------------------- 3 Alter */
export function alter(region) {
  const k = guenstigstes(region.schluessel, "K", 0, "M"), j = guenstigstes(region.schluessel, "J", 300, "M"), e = guenstigstes(region.schluessel, "E", 300, "M");
  if (!k || !j || !e || e.praemie <= j.praemie) return null;
  const diff = e.praemie - j.praemie, name = region.name;
  return paket({
    format: "alter", gruppe: "daten", param: region.schluessel, titel: `Altersklassen in ${name}`, cover: 0.35,
    szenen: [
      { art: "treppe", hintergrund: "petrol", stufen: ["Kinder", "19–25", "ab 26"], text: [`${name}:`, "drei Altersklassen,", "drei Prämien."], dauer: 4.6,
        stimme: `${name}: Kinder, junge Erwachsene, Erwachsene. Drei Altersklassen, drei Prämien.` },
      { art: "zwei", hintergrund: "slate", oben: "19–25 vs. ab 26", links: { praefix: "CHF", bis: j.praemie }, rechts: { praefix: "CHF", bis: e.praemie }, dauer: 3.0,
        stimme: `Mit sechsundzwanzig steigt die Prämie um ${franken(diff)} im Monat. Automatisch.` },
      { art: "titel", hintergrund: "creme", bild: "jung", text: ["Der Sprung mit 26", "ist der Moment", "zum Vergleichen."], dauer: 3.0,
        stimme: "Der Sprung mit sechsundzwanzig ist der Moment zum Vergleichen." },
      { art: "titel", hintergrund: "petrol", text: ["Jede Altersklasse hat", "eine andere Rangfolge", "der Kassen."], dauer: 3.0,
        stimme: "Die Rangfolge der Kassen ist in jeder Altersklasse anders. Die Kasse der Eltern ist selten die günstigste für Sie." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${name}: Mit 26 steigt die günstigste Prämie um ${chf(diff)} im Monat. Automatisch – und meist unbemerkt.`,
      absaetze: [
        `Günstigstes Angebot pro Monat: Kinder ${chf(k.praemie)}, junge Erwachsene (19–25) ${chf(j.praemie)}, Erwachsene ab 26 ${chf(e.praemie)}.`,
        "Zwei Sprünge, mit 19 und mit 26. Beide sind ein guter Moment zum Vergleichen, denn die Rangfolge der Kassen ist in jeder Altersklasse anders – die Kasse der Eltern ist selten die günstigste.",
        "Kündigungsfrist für den Wechsel: 30. November, eingetroffen bei der Kasse."
      ],
      quelle: quelle(region, "günstigstes Angebot je Altersklasse, Franchise 300 (Kinder 0), mit Unfalldeckung"),
      hashtags: tagsRegion(region, "alter")
    }
  });
}

/* ------------------------------------------------------------- 4 Regionen */
export function regionen(kanton) {
  const liste = REGIONEN.filter((r) => r.kanton === kanton).map((r) => ({ region: r, g: guenstigstes(r.schluessel, "E", 300, "M") })).filter((x) => x.g);
  if (liste.length < 2) return null;
  liste.sort((a, b) => a.g.praemie - b.g.praemie);
  const billig = liste[0], teuer = liste[liste.length - 1];
  const diff = teuer.g.praemie - billig.g.praemie;
  if (diff < 10) return null;
  const kantonName = KANTONE[kanton];
  return paket({
    format: "regionen", gruppe: "daten", param: kanton, titel: `Prämienregionen ${kantonName}`, cover: 0.32,
    szenen: [
      { art: "karte", hintergrund: "slate", text: ["Gleicher Kanton.", "Andere Prämie."], dauer: 4.2,
        stimme: `Kanton ${kantonName}: ${zahlwort(liste.length)} Prämienregionen. Ihre Wohngemeinde entscheidet, in welcher Sie sind.` },
      { art: "zwei", hintergrund: "petrol", oben: `${billig.region.ort} vs. ${teuer.region.ort}`, links: { praefix: "CHF", bis: billig.g.praemie }, rechts: { praefix: "CHF", bis: teuer.g.praemie }, dauer: 3.2,
        stimme: `Günstigstes Angebot in ${billig.region.ort}: ${franken(billig.g.praemie)}. In ${teuer.region.ort}: ${franken(teuer.g.praemie)}.` },
      { art: "zaehler", hintergrund: "creme", praefix: "CHF", von: 0, bis: jahr(diff), oben: "Unterschied im Jahr", unten: "gleiche Leistung", dauer: 3.2,
        stimme: `${franken(jahr(diff))} Unterschied im Jahr – für dieselbe Grundversicherung.` },
      { art: "titel", hintergrund: "slate", bild: kantonBild(kanton, "dorf"), text: ["Die Region können Sie", "nicht wählen.", "Die Kasse schon."], dauer: 3.0,
        stimme: "Die Region können Sie nicht wählen. Die Kasse schon." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `Kanton ${kantonName}: ${chf(billig.g.praemie)} in ${billig.region.ort}, ${chf(teuer.g.praemie)} in ${teuer.region.ort} – gleiche Leistung, ${jahr(diff)} Franken Unterschied im Jahr.`,
      absaetze: [
        `Der Kanton ${kantonName} hat ${liste.length} Prämienregionen. Ihre Gemeinde legt fest, in welcher Sie sind – und damit, was dieselbe Grundversicherung kostet.`,
        "Die Region können Sie nicht wählen. Die Kasse schon, und die Rangfolge ist in jeder Region anders. Nach einem Umzug: Adresse der Kasse melden und neu vergleichen."
      ],
      quelle: `Zahlen: günstigstes Angebot für Erwachsene, Franchise 300, mit Unfalldeckung, ${billig.region.beschreibung} und ${teuer.region.beschreibung}, BAG-Prämien ${JAHR}, gerundet. Beispielrechnung, keine Beratung.`,
      hashtags: hashtagsSammeln(["regionen"], [kantonHashtag(kantonName)])
    }
  });
}

/* --------------------------------------------------------------- 5 Unfall */
export function unfall(region) {
  const mit = angebote(region.schluessel, "E", 300, "M");
  const treffer = mit.map((a) => ({ ...a, ohne: praemieVon(a.versicherer, a.modell, region.schluessel, "E", 300, "O") })).find((a) => a.ohne && a.praemie > a.ohne);
  if (!treffer) return null;
  const pM = treffer.praemie, pO = treffer.ohne, diff = jahr(pM - pO), name = region.name;
  if (diff < 100) return null;
  return paket({
    format: "unfall", gruppe: "daten", param: region.schluessel, titel: `Unfalldeckung in ${name}`, cover: 0.3,
    szenen: [
      { art: "titel", hintergrund: "slate", bild: "laptop", text: ["Angestellt,", "mindestens 8 Stunden", "pro Woche?"], dauer: 2.8,
        stimme: "Angestellt, mindestens acht Stunden pro Woche?" },
      { art: "schalter", hintergrund: "petrol", aus: "mit Unfall", an: "ohne Unfall", von: pM, bis: pO, text: ["Unfall läuft über", "den Arbeitgeber."], dauer: 4.6,
        stimme: "Dann läuft der Unfall über den Arbeitgeber. Die Unfalldeckung der Krankenkasse können Sie ausschliessen." },
      { art: "zaehler", hintergrund: "creme", praefix: "CHF", von: 0, bis: diff, oben: `In ${name}:`, unten: "weniger im Jahr", dauer: 3.0,
        stimme: `${franken(diff)} weniger im Jahr – für ein Häkchen.` },
      { art: "titel", hintergrund: "petrol", text: ["Stelle gekündigt oder", "selbstständig?", "Unfall wieder", "einschliessen."], klein: "Die Deckung des Arbeitgebers endet 31 Tage nach Austritt.", dauer: 3.6,
        stimme: "Stelle gekündigt oder selbstständig? Dann den Unfall wieder einschliessen." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${name}: Angestellte zahlen die Unfalldeckung oft doppelt. Ein Häkchen weniger spart ${chf(diff)} im Jahr.`,
      absaetze: [
        `Wer mindestens acht Stunden pro Woche angestellt ist, ist über den Arbeitgeber gegen Unfall versichert. Die Unfalldeckung in der Grundversicherung können Sie dann ausschliessen – im Beispiel sinkt die Prämie von ${chf(pM)} auf ${chf(pO)} im Monat.`,
        "Wichtig: Endet das Arbeitsverhältnis, läuft die Deckung des Arbeitgebers noch 31 Tage. Danach den Unfall bei der Kasse wieder einschliessen."
      ],
      quelle: quelle(region, "dasselbe günstigste Angebot für Erwachsene, Franchise 300, mit und ohne Unfalldeckung"),
      hashtags: tagsRegion(region, "unfall")
    }
  });
}

/* -------------------------------------------------------------- 6 Kantone */
export function kantone(kanton) {
  const alle = KANTONE_MIT_REGIONEN.map((kt) => ({ kanton: kt, g: kantonsMinimum(kt, 0) })).filter((x) => x.g).sort((a, b) => a.g.praemie - b.g.praemie);
  if (alle.length < 3) return null;
  const min = alle[0], max = alle[alle.length - 1];
  let mitte = alle.find((x) => x.kanton === kanton);
  if (!mitte || mitte === min || mitte === max) mitte = alle[Math.floor(alle.length / 2)];
  const reihe = [min, mitte, max];
  const heute = KANTONE[kanton];
  return paket({
    format: "kantone", gruppe: "daten", param: kanton, titel: `Kantone im Vergleich (${heute})`, cover: 0.3,
    szenen: [
      { art: "titel", hintergrund: "slate", bild: "flagge", text: ["Gleiche Leistung.", "26 Kantone.", "26 Preisniveaus."], dauer: 3.0,
        stimme: "Gleiche Grundversicherung, sechsundzwanzig Kantone, sechsundzwanzig Preisniveaus." },
      { art: "balken", hintergrund: "petrol", balken: reihe.map((x) => ({ label: x.kanton, hoehe: x.g.praemie / max.g.praemie, gold: x === min })), text: ["Günstigstes Angebot", "pro Monat, Erwachsene."], dauer: 4.4,
        stimme: `${KANTONE[min.kanton]}: ${franken(min.g.praemie)}. ${KANTONE[mitte.kanton]}: ${franken(mitte.g.praemie)}. ${KANTONE[max.kanton]}: ${franken(max.g.praemie)}.` },
      { art: "titel", hintergrund: "creme", text: ["Wegziehen? Nein.", "Vergleichen reicht –", heute.length > 14 ? "auch bei Ihnen." : `auch in ${heute}.`], dauer: 3.2,
        stimme: `Wegziehen müssen Sie deswegen nicht. Vergleichen reicht – auch in ${heute}.` },
      { art: "titel", hintergrund: "petrol", text: ["In Ihrem Kanton liegen", "die Kassen Hunderte", "Franken auseinander."], dauer: 3.2,
        stimme: "Denn innerhalb Ihres Kantons liegen die Kassen Hunderte Franken im Jahr auseinander." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${KANTONE[min.kanton]} ${chf(min.g.praemie)}, ${heute} ${chf(mitte.g.praemie)}, ${KANTONE[max.kanton]} ${chf(max.g.praemie)}: dieselbe Grundversicherung, pro Monat.`,
      absaetze: [
        "Die Prämien unterscheiden sich von Kanton zu Kanton deutlich – sie folgen den Gesundheitskosten der Region. Wegziehen müssen Sie deswegen nicht.",
        "Was Sie beeinflussen können: die Kasse, das Modell und die Franchise. Innerhalb eines Kantons liegen die Kassen Hunderte Franken im Jahr auseinander."
      ],
      quelle: `Zahlen: günstigstes Angebot für Erwachsene im Standardmodell, Franchise 300, mit Unfalldeckung, jeweils günstigste Prämienregion des Kantons, BAG-Prämien ${JAHR}, gerundet. Keine Beratung.`,
      hashtags: hashtagsSammeln(["regionen"], [kantonHashtag(heute)])
    }
  });
}

/* ------------------------------------------------------------- 7 Flexibel */
export function flexibel(region) {
  const standard = guenstigstes(region.schluessel, "E", 300, "M", 0);
  const sparsam = guenstigstes(region.schluessel, "E", 2500, "M");
  if (!standard || !sparsam || sparsam.modell === 0) return null;
  const ersparnis = jahr(standard.praemie - sparsam.praemie);
  if (ersparnis < 600) return null;
  const name = region.name, modell = MODELLE[sparsam.modell];
  return paket({
    format: "flexibel", gruppe: "daten", param: region.schluessel, titel: `Sparpotenzial in ${name}`, cover: 0.3,
    szenen: [
      { art: "titel", hintergrund: "slate", bild: "gipfel", text: ["Gesund, flexibel,", "selten beim Arzt?"], dauer: 2.6,
        stimme: "Gesund, flexibel, selten beim Arzt?" },
      { art: "muenzen", hintergrund: "petrol", bis: ersparnis, text: [`${name}:`, "so viel liegt drin.", "Pro Jahr."], dauer: 4.6,
        stimme: `In ${name} liegen bis zu ${franken(ersparnis)} im Jahr drin.` },
      { art: "titel", hintergrund: "creme", text: ["Standard mit 300:", `**${chf(standard.praemie)}** im Monat.`, `${modell} mit 2'500:`, `**${chf(sparsam.praemie)}** im Monat.`], dauer: 4.2,
        stimme: `Standard mit dreihundert Franchise – oder ${modell} mit zweitausendfünfhundert.` },
      { art: "titel", hintergrund: "slate", text: ["Der Haken:", "Krank? Dann zahlen Sie", "bis **CHF 2'200**", "mehr selbst."], dauer: 3.4,
        stimme: "Der Haken: Werden Sie krank, zahlen Sie bis zweitausendzweihundert Franken mehr selbst. Das Geld muss da sein." },
      ABBINDER
    ],
    bildtext: {
      aufhaenger: `${name}: Bis zu ${chf(ersparnis)} im Jahr zwischen Standard mit Franchise 300 und ${modell} mit Franchise 2'500.`,
      absaetze: [
        `Günstigstes Angebot pro Monat: Standardmodell mit Franchise 300 ${chf(standard.praemie)}, ${modell}-Modell mit Franchise 2'500 ${chf(sparsam.praemie)}. Gleiche Grundversicherung.`,
        "Das lohnt sich für Gesunde, die selten zum Arzt gehen und sich an eine erste Anlaufstelle binden können. Der Haken: Im Krankheitsfall tragen Sie bis zu CHF 2'200 mehr selbst – dieses Geld muss da sein.",
        "Franchise und Modell ändern Sie bis 30. November, mit oder ohne Kassenwechsel."
      ],
      quelle: quelle(region, "günstigste Angebote für Erwachsene mit Unfalldeckung in den genannten Kombinationen"),
      hashtags: tagsRegion(region, "franchise", "modelle")
    }
  });
}

/* ------------------------------------------------------- 8 Countdown (Saison) */
function zwischen(datum, vonMonat, vonTag, bisMonat, bisTag) {
  const m = datum.getMonth() + 1, t = datum.getDate();
  const nachVon = m > vonMonat || (m === vonMonat && t >= vonTag);
  const vorBis = m < bisMonat || (m === bisMonat && t <= bisTag);
  return nachVon && vorBis;
}

export function countdown(datum) {
  const param = datumKurz(datum);
  if (zwischen(datum, 10, 1, 11, 30)) {
    const tage = tageBis(datum, 11, 30);
    const knapp = tage <= 10;
    const szenen = [
      { art: "zahl", hintergrund: "creme", oben: "Kündigungsfrist 30. November", zahl: String(tage), wort: tage === 1 ? "Tag" : "Tage", dauer: 2.8,
        stimme: tage === 0 ? "Heute ist der dreissigste November. Letzter Tag." : `Noch ${zahlwort(tage)} ${tage === 1 ? "Tag" : "Tage"} bis zum dreissigsten November.` },
      { art: "titel", hintergrund: "petrol", bild: "brief", text: ["Bis dann muss die", "Kündigung **da sein** –", "nicht abgeschickt."], dauer: 3.2,
        stimme: "Bis dann muss die Kündigung bei der Kasse eingetroffen sein. Nicht abgeschickt – eingetroffen." },
      knapp
        ? { art: "titel", hintergrund: "slate", text: ["Jetzt eingeschrieben", "aufgeben.", "Nicht morgen."], dauer: 2.8, stimme: "Jetzt eingeschrieben aufgeben. Nicht morgen." }
        : { art: "zahl", hintergrund: "slate", zahl: "20.", wort: "November – spätestens aufgeben", dauer: 3.0, stimme: "Spätestens am zwanzigsten November aufgeben. Dann sind Sie sicher." },
      { art: "titel", hintergrund: "creme", text: ["Erst die Zusage", "der neuen Kasse.", "Dann kündigen."], dauer: 2.8,
        stimme: "Erst die schriftliche Zusage der neuen Kasse. Dann kündigen." },
      ABBINDER
    ];
    return paket({
      format: "countdown", gruppe: "saison", param, titel: `Countdown: ${tage} Tage`, cover: 0.05, szenen,
      bildtext: {
        aufhaenger: tage === 0 ? "Heute ist der 30. November. Was jetzt nicht bei der Kasse liegt, gilt erst nächstes Jahr." : `Noch ${tage} ${tage === 1 ? "Tag" : "Tage"}: Am 30. November muss die Kündigung bei der Krankenkasse liegen – nicht unterwegs sein.`,
        absaetze: [
          "Es zählt der Eingang, nicht der Poststempel. Eingeschrieben und ein paar Tage früher ist die sichere Variante.",
          "Vorher: schriftliche Zusage der neuen Kasse abwarten und offene Prämien bezahlen – sonst blockiert die alte Kasse den Wechsel.",
          "Vergleichen dauert eine Minute."
        ],
        quelle: "",
        hashtags: hashtagsSammeln(["wechsel"])
      }
    });
  }
  if (zwischen(datum, 2, 1, 3, 31)) {
    const tage = tageBis(datum, 3, 31);
    return paket({
      format: "countdown", gruppe: "saison", param, titel: `Countdown März: ${tage} Tage`, cover: 0.05,
      szenen: [
        { art: "zahl", hintergrund: "creme", oben: "Zweite Frist: 31. März", zahl: String(tage), wort: tage === 1 ? "Tag" : "Tage", dauer: 2.8,
          stimme: `Noch ${zahlwort(tage)} ${tage === 1 ? "Tag" : "Tage"} bis zum einunddreissigsten März.` },
        { art: "titel", hintergrund: "petrol", bild: "kalender", text: ["Kündigung bis", "31. März –", "Wechsel per 1. Juli."], dauer: 2.8,
          stimme: "Kündigung bis einunddreissigsten März, Wechsel per ersten Juli." },
        { art: "titel", hintergrund: "slate", text: ["Nur mit Franchise 300", "im Standardmodell."], klein: "Alle anderen warten bis November.", dauer: 3.2,
          stimme: "Das gilt nur mit Franchise dreihundert im Standardmodell. Alle anderen warten bis November." },
        { art: "titel", hintergrund: "creme", text: ["Eingang zählt.", "Eingeschrieben senden."], dauer: 2.6,
          stimme: "Auch hier zählt der Eingang. Eingeschrieben schicken." },
        ABBINDER
      ],
      bildtext: {
        aufhaenger: `Noch ${tage} ${tage === 1 ? "Tag" : "Tage"} bis zur zweiten Kündigungsfrist. Sie gilt nicht für alle – aber für mehr Leute, als denken.`,
        absaetze: [
          "Wer die tiefste Franchise (300) im Standardmodell hat, kann per 1. Juli wechseln. Kündigung bis 31. März bei der Kasse eingetroffen.",
          "Mit Hausarzt-, HMO- oder Telmed-Modell oder höherer Franchise bleibt nur der 30. November."
        ],
        quelle: "",
        hashtags: hashtagsSammeln(["wechsel", "franchise"])
      }
    });
  }
  return null;
}

/* ------------------------------------------------------------- 9 Mythen */
/* Foto je Mythos, gleiche Reihenfolge wie MYTHEN in themen.js. */
const MYTHOS_BILD = ["rechner", "muenzstapel", "stethoskop", "brief", "kalender", "laptop", "praxis", "muenzen", "kinder", "arzt", "eltern", "flagge"];

export function mythos(i) {
  const m = MYTHEN[i];
  if (!m) return null;
  return paket({
    format: "mythos", gruppe: "wissen", param: String(i + 1), titel: `Mythos ${i + 1}`, cover: 0.45,
    szenen: [
      { art: "titel", hintergrund: "slate", bild: MYTHOS_BILD[i] || "alpen", symbol: "✕", text: ["Mythos:", ...m.mythos], dauer: 3.2, stimme: `Mythos: ${m.mythosStimme}` },
      { art: "titel", hintergrund: "petrol", text: ["**Stimmt nicht.**", ...m.wahrheit], dauer: 3.6, stimme: m.wahrheitStimme },
      { art: "titel", hintergrund: "creme", text: m.detail, dauer: 3.2, stimme: m.detailStimme },
      ABBINDER
    ],
    bildtext: { aufhaenger: m.aufhaenger, absaetze: [m.wahrheitStimme, m.detailStimme], quelle: "", hashtags: hashtagsSammeln(m.hashtags) }
  });
}

/* ------------------------------------------------------- 10 Stamm-Reels */
/* Zeitfenster fuer Stamm-Reels, deren Aussage nicht das ganze Jahr gilt. */
const STAMM_GUELTIG = {
  "countdown-november": (d) => zwischen(d, 10, 1, 11, 20)
};

export function stamm(reel, datum) {
  if (STAMM_GUELTIG[reel.id] && !STAMM_GUELTIG[reel.id](datum)) return null;
  const t = STAMM[reel.id] || { aufhaenger: reel.titel, absaetze: [], hashtags: [] };
  const sprache = reel.sprache || t.sprache || "de";
  return paket({
    format: "stamm", gruppe: "wissen", param: reel.id, titel: reel.titel, sprache, cover: 0.3,
    reelId: reel.id, audioOrdner: "audio", szenen: reel.szenen.map(({ id, ...rest }) => rest),
    bildtext: { aufhaenger: t.aufhaenger, absaetze: t.absaetze, quelle: "", hashtags: hashtagsSammeln(t.hashtags || []) }
  });
}

/* ---------------------------------------------------------- Kandidaten */
/* Alles, was an einem Tag moeglich ist – ungebaut; "bauen" erzeugt das
   Paket erst bei Bedarf (und kann null liefern, wenn Daten fehlen). */
export const DATENFORMATE = { franchise, modelle, alter, unfall, flexibel };

export function kandidaten(datum) {
  const liste = [];
  for (const r of REGIONEN) {
    for (const [name, f] of Object.entries(DATENFORMATE)) liste.push({ gruppe: "daten", format: name, param: r.schluessel, region: r.kanton, bauen: () => f(r) });
  }
  for (const kt of KANTONE_MIT_REGIONEN) {
    liste.push({ gruppe: "daten", format: "kantone", param: kt, region: kt, bauen: () => kantone(kt) });
    if (REGIONEN.filter((r) => r.kanton === kt).length >= 2) liste.push({ gruppe: "daten", format: "regionen", param: kt, region: kt, bauen: () => regionen(kt) });
  }
  liste.push({ gruppe: "saison", format: "countdown", param: datumKurz(datum), bauen: () => countdown(datum) });
  MYTHEN.forEach((_, i) => liste.push({ gruppe: "wissen", format: "mythos", param: String(i + 1), bauen: () => mythos(i) }));
  for (const reel of REELS) liste.push({ gruppe: "wissen", format: "stamm", param: reel.id, bauen: () => stamm(reel, datum) });
  return liste.map((k) => ({ ...k, schluessel: `${k.format}|${k.param}` }));
}
