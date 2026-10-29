/* =========================================================================
   Karussells: Bild-Beitraege mit mehreren Folien (1080 x 1350), die der
   Funnel zusaetzlich zu den Reels postet – Standard zwei je Tag
   (karussellsProTag in funnel.json).

   Vier Formate, je zwei je Gruppe, im Tageswechsel:
     wissen  fakt        "Fakt des Tages"   – FAKTEN unten, ruhig, redaktionell
             check       "Mythos-Check"     – Mythen aus themen.js mit Stempel
     daten   zahl        "Zahl des Tages"   – eine Zahl aus den BAG-Praemien
                                              je Praemienregion (vier Varianten)
             steckbrief  "Kanton-Steckbrief" – Tabelle je Kanton

   Jedes Format liefert ein Paket { typ: "karussell", format, gruppe, param,
   schluessel, titel, stufe, karussell, bildtext, altTexte }. "karussell"
   ist die Eingabe der Komposition in src/Karussell.jsx (stil, datum,
   folien). Regeln wie bei den Reels: keine Kassennamen, nur guenstigste
   Angebote vergleichen, jede Zahl mit Region, Jahr und Annahmen belegt.
   ========================================================================= */
import { REGIONEN, KANTONE, KANTONE_MIT_REGIONEN, MODELLE, JAHR, angebote, guenstigstes, praemieVon } from "./daten.js";
import { MYTHEN, kantonHashtag } from "./themen.js";
import { hashtagsSammeln, bildtextBauen } from "./bildtext.js";
import { chf, zufall, mischen, datumLesen, MONATE } from "./sprache.js";
import { minuten } from "./konfig.js";
import { kantonBild } from "../src/bilder.js";

const KARUSSELL_STUFE = { fakt: "tofu", check: "tofu", zahl: "mofu", steckbrief: "mofu" };
export const KARUSSELL_FORMATE = ["fakt", "check", "zahl", "steckbrief"];
const ETIKETT = { fakt: "Fakt des Tages", check: "Mythos-Check", zahl: "Zahl des Tages", steckbrief: "Kanton-Steckbrief" };
/* Beschriftung der Modelle in Tabellen und Balken (daten.js: 0 Standard,
   1 Hausarzt/HMO, 2 Telmed, 3 Flex – Einteilung der BAG-Daten seit 2027). */
const MODELL_KURZ = ["Standard", "Hausarzt / HMO", "Telmed", "Flex"];

const rund = (n) => Math.round(n);
/* "in Zürich" bzw. "im Kanton Solothurn" – mit oder ohne Hervorhebung. */
const im = (r, fett = true) => (r.mehrere ? "in " : "im ") + (fett ? `**${r.name}**` : r.name);
const jahr = (monatlich) => rund(monatlich * 12);
const quelle = (region, was) => `Zahlen: ${was}, ${region.beschreibung}, BAG-Prämien ${JAHR}, gerundet. Beispielrechnung, keine Beratung.`;
const QUELLE_GESETZ = "Grundlage: Krankenversicherungsgesetz (KVG) und Verordnung (KVV). Allgemeine Information, keine Beratung.";
const ohneFett = (t) => String(t).replace(/\*\*/g, "");
const zeilen = (t) => (Array.isArray(t) ? t : t ? [t] : []);

/* "2026-10-28" -> "28. Oktober 2026" */
export function datumAnzeige(datumText) {
  const d = datumLesen(datumText);
  return `${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

/* ------------------------------------------------------- Fakten-Bank */
/* Jeder Fakt: Titelfolie (cover, Zeilen hoechstens ~26 Zeichen), optional
   eine Zahl, zwei Textfolien (die zweite mit "merke"), Bildtext. Alles
   allgemeines KVG-Wissen ohne Zahlen aus den Praemiendaten. */
export const FAKTEN = [
  {
    id: "leistung", titel: "Gleiche Leistung", bild: "praxis", bild2: "sprechstunde", hashtags: [],
    cover: ["Die Grundversicherung", "leistet bei **jeder Kasse**", "exakt dasselbe."], unten: "Unterschiedlich ist nur der Preis.",
    zahl: { ueber: "Ein Katalog für alle", zahl: "1", einheit: "Leistungskatalog – für jede Kasse derselbe", text: "Was die Grundversicherung bezahlt, steht im Krankenversicherungsgesetz. Keine Kasse darf mehr leisten, keine weniger." },
    folien: [
      { ueber: "Warum", titel: "Der Katalog steht im Gesetz.", text: "Arzt, Spital, Medikamente, Notfall: Der Umfang ist bei allen Versicherern gleich. Eine teurere Kasse zahlt nicht mehr – sie kostet nur mehr." },
      { ueber: "Was das heisst", titel: "Wer mehr zahlt, bekommt dafür nichts.", text: "Je nach Region, Alter und Modell liegen zwischen den Kassen mehrere hundert bis über tausend Franken im Jahr.", merke: "Vergleichen ist die einzige Stellschraube – und sie dauert eine Minute." }
    ],
    aufhaenger: "Fakt: Die Grundversicherung leistet bei jeder Krankenkasse exakt dasselbe. Unterschiedlich ist nur der Preis."
  },
  {
    id: "eingang", titel: "Es zählt der Eingang", bild: "brief", bild2: "kalender", hashtags: ["wechsel"],
    cover: ["Am 30. November muss", "die Kündigung **bei der**", "**Kasse liegen** – nicht", "auf der Post."],
    zahl: { ueber: "Kündigungsfrist", zahl: "30. Nov.", einheit: "Eingang bei der Kasse", text: "Massgebend ist der Tag, an dem der Brief bei der Kasse eintrifft – nicht der Poststempel und nicht der Tag, an dem Sie ihn aufgeben." },
    folien: [
      { ueber: "Der Irrtum", titel: "Der Poststempel zählt nicht.", text: "Wer am 29. November abschickt, ist in der Regel zu spät. Die Post braucht Tage, eingeschrieben etwas mehr. Einen Tag zu spät heisst: ein Jahr länger bei der alten Kasse." },
      { ueber: "Die sichere Variante", titel: "Eingeschrieben. Und früher.", text: "Ein eingeschriebener Brief beweist, wann die Kündigung bei der Kasse lag. Bietet die Kasse Portal oder E-Mail an: Bestätigung aufbewahren.", merke: "Wer spätestens am 20. November aufgibt, ist auf der sicheren Seite." }
    ],
    aufhaenger: "Fakt: Am 30. November muss die Kündigung bei der Krankenkasse liegen – der Poststempel zählt nicht."
  },
  {
    id: "zweiter-termin", titel: "Der zweite Termin", bild: "kalender", bild2: "buero", hashtags: ["wechsel", "franchise"],
    cover: ["Es gibt einen **zweiten**", "**Termin** zum Wechseln.", "Fast niemand kennt ihn."],
    zahl: { ueber: "Zweite Frist", zahl: "31. März", einheit: "Kündigung für den Wechsel per 1. Juli", text: "Wer die tiefste Franchise im Standardmodell hat, kann auch auf Mitte Jahr wechseln. Die Kündigung muss bis Ende März bei der Kasse liegen." },
    folien: [
      { ueber: "Die Bedingung", titel: "Nur mit Franchise 300 im Standardmodell.", text: "Mit Hausarzt-, HMO- oder Telmed-Modell oder einer höheren Franchise gibt es diesen Termin nicht. Dann bleibt nur der 30. November." },
      { ueber: "Was das heisst", titel: "Zwei Chancen im Jahr.", text: "Die meisten nutzen keine davon. Dabei verschiebt sich die Rangfolge der Kassen jedes Jahr – und die Leistungen bleiben überall gleich.", merke: "Auch im März zählt der Eingang bei der Kasse, nicht der Poststempel." }
    ],
    aufhaenger: "Zweiter Wechseltermin: Kündigung bis 31. März, Wechsel per 1. Juli – nur mit Franchise 300 im Standardmodell."
  },
  {
    id: "franchise-stufen", titel: "Sechs Franchisen", bild: "rechner", bild2: "muenzstapel", hashtags: ["franchise"],
    cover: ["Sechs Franchisen für", "Erwachsene: von **300**", "bis **2'500** Franken."],
    zahl: { ueber: "Wahlfranchisen", zahl: "6", einheit: "Stufen: 300, 500, 1'000, 1'500, 2'000, 2'500", text: "Die Franchise ist der Betrag, den Sie pro Jahr zuerst selbst zahlen. Je höher sie ist, desto tiefer die Prämie." },
    folien: [
      { ueber: "Der Mechanismus", titel: "Höhere Franchise, tiefere Prämie.", text: "Für jede Stufe gibt die Kasse einen Rabatt. Die mittleren Stufen sind oft die schlechteste Wahl: wenig Rabatt, aber deutlich mehr Risiko." },
      { ueber: "Die Faustregel", titel: "300 oder 2'500 – selten etwas dazwischen.", text: "Wer im Jahr kaum zum Arzt geht, fährt mit 2'500 meist besser. Wer regelmässig Kosten hat, mit 300. Entscheidend ist, was Sie letztes Jahr tatsächlich ausgegeben haben.", merke: "Die Franchise ändern Sie bis 30. November – ohne die Kasse zu wechseln." }
    ],
    aufhaenger: "Fakt: Erwachsene wählen zwischen sechs Franchisen, von 300 bis 2'500 Franken. Die Mitte ist oft die schlechteste Wahl."
  },
  {
    id: "selbstbehalt", titel: "Der Selbstbehalt", bild: "medikamente", bild2: "apotheke", hashtags: ["franchise"],
    cover: ["Über der Franchise", "zahlen Sie **10 Prozent**", "selbst – bis 700 Franken", "im Jahr."],
    zahl: { ueber: "Selbstbehalt", zahl: "CHF 700", einheit: "höchstens pro Jahr (Kinder: 350)", text: "Erst die Franchise, dann 10 Prozent der weiteren Kosten – bis zu dieser Grenze. Dazu kommen 15 Franken pro Spitaltag." },
    folien: [
      { ueber: "Im schlechtesten Fall", titel: "Mit Franchise 2'500 bis CHF 3'200 selbst.", text: "2'500 Franken Franchise plus 700 Franken Selbstbehalt, bevor die Kasse alles übernimmt. Mit Franchise 300 sind es höchstens 1'000 Franken." },
      { ueber: "Was das heisst", titel: "Die hohe Franchise ist ein Risiko mit Preis.", text: "Die Prämienersparnis ist sicher, die Arztkosten sind es nicht. Rechnen Sie beides gegeneinander – ehrlich.", merke: "Die hohe Franchise lohnt sich nur, wenn dieses Geld da ist, wenn die Rechnung kommt." }
    ],
    aufhaenger: "Fakt: Mit der Franchise ist es nicht getan. Darüber zahlen Sie 10 Prozent Selbstbehalt – bis 700 Franken im Jahr."
  },
  {
    id: "altersklassen", titel: "Drei Altersklassen", bild: "jung", bild2: "studium", hashtags: ["alter"],
    cover: ["Drei Altersklassen,", "zwei Sprünge:", "mit **19** und mit **26**."],
    zahl: { ueber: "Altersklassen", zahl: "3", einheit: "Kinder bis 18 · junge Erwachsene 19–25 · ab 26", text: "Für jede Klasse gilt eine eigene Prämie. Der Wechsel passiert automatisch – und meist, ohne dass jemand nachrechnet." },
    folien: [
      { ueber: "Mit 19", titel: "Oft fällt der Familienrabatt weg.", text: "Kinder sind günstig, junge Erwachsene bekommen einen Rabatt, ab 26 gilt die volle Prämie. Die Kasse der Eltern ist dann selten noch die günstigste." },
      { ueber: "Was das heisst", titel: "Jede Altersklasse hat ihre eigene Rangfolge.", text: "Die günstigste Kasse für ein Kind ist nicht die günstigste für eine 24-Jährige – und die wieder nicht für einen 30-Jährigen.", merke: "Mit 19 und mit 26 neu vergleichen." }
    ],
    aufhaenger: "Fakt: Es gibt drei Altersklassen – und zwei Prämiensprünge, mit 19 und mit 26. Beide passieren automatisch."
  },
  {
    id: "aufnahmepflicht", titel: "Aufnahmepflicht", bild: "sprechstunde", bild2: "arzt", hashtags: ["wechsel", "zusatz"],
    cover: ["In der Grundversicherung", "muss **jede Kasse**", "Sie nehmen."],
    zahl: { ueber: "Aufnahmepflicht", zahl: "0", einheit: "Gesundheitsfragen", text: "Alter, Vorerkrankung, Schwangerschaft: Nichts davon darf eine Kasse abfragen oder berücksichtigen. Das gilt für jede Kasse und jedes Modell." },
    folien: [
      { ueber: "Die Ausnahme", titel: "Ablehnen darf nur die Zusatzversicherung.", text: "Dort gibt es Gesundheitsfragen und Vorbehalte. Deshalb: Grundversicherung wechseln, Zusatzversicherung behalten – das geht, es sind zwei Verträge." },
      { ueber: "Was das heisst", titel: "Niemand bleibt wegen seiner Gesundheit hängen.", text: "Auch wer in Behandlung ist, kann die Grundversicherung wechseln. Ohne Wartefrist, ohne Vorbehalt, ab dem 1. Januar.", merke: "Die Gesundheit spielt bei der Prämie keine Rolle – bei keiner Kasse." }
    ],
    aufhaenger: "Fakt: In der Grundversicherung muss jede Kasse jeden aufnehmen – ohne Gesundheitsfragen, ohne Vorbehalt."
  },
  {
    id: "neugeborene", titel: "Neugeborene", bild: "baby", bild2: "eltern", hashtags: ["familie"],
    cover: ["Jedes Kind braucht", "eine **eigene**", "Grundversicherung –", "innert drei Monaten."],
    zahl: { ueber: "Anmeldefrist", zahl: "3 Monate", einheit: "nach der Geburt", text: "Rechtzeitig angemeldet, gilt die Versicherung rückwirkend ab Geburt. Viele Eltern melden das Kind schon vor der Geburt an." },
    folien: [
      { ueber: "Der Irrtum", titel: "Kinder sind nicht automatisch mitversichert.", text: "Jedes Kind hat seinen eigenen Vertrag und seine eigene Prämie. Mit Franchise 0 zahlt die Kasse ab der ersten Rechnung." },
      { ueber: "Was das heisst", titel: "Das Kind darf bei einer anderen Kasse sein.", text: "Kinderprämien unterscheiden sich stark. Die Kasse der Eltern ist nicht automatisch die günstigste für das Kind.", merke: "Jedes Familienmitglied einzeln vergleichen." }
    ],
    aufhaenger: "Fakt: Jedes Kind braucht eine eigene Grundversicherung – innert drei Monaten angemeldet, gilt sie rückwirkend ab Geburt."
  },
  {
    id: "zuzug", titel: "Neu in der Schweiz", bild: "flagge", bild2: "umzug", hashtags: [],
    cover: ["Neu in der Schweiz?", "Ihre **90 Tage** laufen", "seit der Einreise."],
    zahl: { ueber: "Anmeldefrist", zahl: "3 Monate", einheit: "ab Zuzug", text: "Wer sich innert drei Monaten anmeldet, ist ab dem Einreisetag versichert. Jede Kasse muss Sie nehmen – ohne Gesundheitsfragen." },
    folien: [
      { ueber: "Wer wartet", titel: "Nach der Frist weist der Kanton zu.", text: "Dann bestimmt der Kanton die Kasse – und ein Prämienzuschlag ist möglich. Die Prämien für die Zeit seit der Einreise sind trotzdem fällig." },
      { ueber: "Was das heisst", titel: "Erst vergleichen, dann anmelden.", text: "Die Leistungen sind überall gleich, die Prämie nicht. Wer in der Frist vergleicht, startet von Anfang an mit der richtigen Kasse.", merke: "Der Vergleich dauert eine Minute – die Entscheidung gilt ein Jahr." }
    ],
    aufhaenger: "Fakt: Neu in der Schweiz? Drei Monate Zeit für die Krankenkasse – rechtzeitig angemeldet, gilt die Deckung ab Tag eins."
  },
  {
    id: "unfall", titel: "Unfalldeckung", bild: "buero", bild2: "gipfel", hashtags: ["unfall"],
    cover: ["Angestellt ab", "**8 Stunden** pro Woche?", "Dann zahlen Sie den", "Unfall vielleicht doppelt."],
    zahl: { ueber: "Unfallversicherung", zahl: "8 Std.", einheit: "pro Woche – ab dann versichert der Arbeitgeber", text: "Berufs- und Nichtberufsunfälle laufen dann über die Unfallversicherung des Arbeitgebers. Die Unfalldeckung der Krankenkasse brauchen Sie nicht mehr." },
    folien: [
      { ueber: "So geht's", titel: "Unfall bei der Kasse ausschliessen.", text: "Eine Meldung an die Kasse genügt. Die Prämie sinkt – bei gleicher Leistung, denn der Unfall ist ja anderswo versichert." },
      { ueber: "Nicht vergessen", titel: "Nach dem Austritt wieder einschliessen.", text: "Die Deckung des Arbeitgebers endet 31 Tage nach dem letzten Arbeitstag. Wer dann ohne Stelle oder selbstständig ist, schliesst den Unfall wieder ein.", merke: "Ein Häkchen – aber eines, das Sie selbst setzen müssen." }
    ],
    aufhaenger: "Fakt: Angestellt ab 8 Stunden pro Woche? Dann versichert der Arbeitgeber den Unfall – und die Kasse muss es nicht mehr."
  },
  {
    id: "regionen", titel: "Prämienregionen", bild: "dorf", bild2: "luzern", hashtags: ["regionen"],
    cover: ["Bis zu **drei**", "**Prämienregionen**", "pro Kanton. Ihre", "Gemeinde entscheidet."],
    zahl: { ueber: "Prämienregionen", zahl: "3", einheit: "höchstens pro Kanton", text: "Gleiche Kasse, gleiches Modell, andere Gemeinde: andere Prämie. Region 1 ist meist die Stadt und die teuerste." },
    folien: [
      { ueber: "Warum", titel: "Die Prämie folgt den Gesundheitskosten.", text: "Wo Ärzte, Spitäler und Behandlungen mehr kosten, sind die Prämien höher. Die Region können Sie nicht wählen – die Kasse schon." },
      { ueber: "Nach dem Umzug", titel: "Adresse melden, neu vergleichen.", text: "Ohne Meldung stimmt die Prämie nicht. Und die Rangfolge der Kassen ist in jeder Region anders – was am alten Ort günstig war, ist es am neuen nicht unbedingt.", merke: "Ein Umzug ist ein guter Moment zum Vergleichen." }
    ],
    aufhaenger: "Fakt: Ein Kanton hat bis zu drei Prämienregionen. Gleiche Kasse, gleiches Modell – andere Gemeinde, andere Prämie."
  },
  {
    id: "verbilligung", titel: "Prämienverbilligung", bild: "muenzen", bild2: "unterschrift", hashtags: ["verbilligung"],
    cover: ["Prämienverbilligung", "gibt es in vielen", "Kantonen **nur auf**", "**Antrag**."],
    folien: [
      { ueber: "Der Kanton zahlt mit", titel: "Ein Anspruch, kein Geschenk.", text: "Wer in bescheidenen wirtschaftlichen Verhältnissen lebt, hat Anspruch auf eine Verbilligung. Die Regeln, Grenzen und Fristen legt jeder Kanton selbst fest." },
      { ueber: "Was das heisst", titel: "Wer nichts tut, bekommt nichts.", text: "In einigen Kantonen kommt die Verbilligung automatisch, in vielen braucht es ein Gesuch. Nachfragen beim Kanton oder bei der Ausgleichskasse lohnt sich.", merke: "Die Verbilligung ändert nichts daran: Die günstigste Kasse bleibt die günstigste." }
    ],
    aufhaenger: "Fakt: Prämienverbilligung gibt es in vielen Kantonen nur auf Antrag. Wer nichts tut, bekommt nichts."
  },
  {
    id: "zwei-vertraege", titel: "Zwei Verträge", bild: "unterschrift", bild2: "praxis", hashtags: ["zusatz"],
    cover: ["Grund- und Zusatz-", "versicherung sind", "**zwei Verträge**.", "Sie lassen sich trennen."],
    zahl: { ueber: "Zwei Verträge", zahl: "2", einheit: "Verträge, zwei Kündigungen, zwei Fristen", text: "Die Grundversicherung ist gesetzlich geregelt, die Zusatzversicherung ein privater Vertrag. Beide dürfen bei verschiedenen Kassen sein." },
    folien: [
      { ueber: "So geht's", titel: "Grundversicherung wechseln, Zusatz behalten.", text: "Die Zusatzversicherung bleibt bei der alten Kasse, die Grundversicherung geht zur günstigeren. Das ist der sichere Weg, wenn Sie die Zusatz nicht verlieren wollen." },
      { ueber: "Vorsicht", titel: "Bei der Zusatz zuerst die Zusage.", text: "Eine neue Zusatzversicherung darf Sie ablehnen. Deshalb erst die schriftliche Zusage der neuen, dann die alte kündigen – mit ihrer eigenen Frist.", merke: "Zuerst die Zusage, dann die Kündigung. Immer in dieser Reihenfolge." }
    ],
    aufhaenger: "Fakt: Grund- und Zusatzversicherung sind zwei Verträge. Sie müssen nicht bei derselben Kasse sein."
  },
  {
    id: "offene-praemien", titel: "Offene Prämien", bild: "rechner", bild2: "brief", hashtags: ["wechsel"],
    cover: ["Offene Prämien", "**blockieren**", "den Wechsel."],
    folien: [
      { ueber: "Die Regel", titel: "Die alte Kasse lässt Sie nicht gehen.", text: "Solange Prämien, Franchisen oder Selbstbehalte offen sind, darf die alte Kasse den Wechsel verweigern – auch wenn die Kündigung rechtzeitig und korrekt war." },
      { ueber: "So geht's", titel: "Erst bezahlen, dann kündigen.", text: "Alle Rechnungen begleichen, die Zusage der neuen Kasse abwarten, dann eingeschrieben kündigen. Die alte Kasse bestätigt den Austritt.", merke: "Ein offener Betrag von wenigen Franken reicht, um ein Jahr zu verlieren." }
    ],
    aufhaenger: "Fakt: Offene Prämien, Franchisen oder Selbstbehalte blockieren den Kassenwechsel. Erst bezahlen, dann kündigen."
  },
  {
    id: "modelle", titel: "Drei Modelle", bild: "praxis", bild2: "arzt", hashtags: ["modelle"],
    cover: ["Hausarzt, HMO oder", "Telmed: alle **günstiger**", "als das Standardmodell."],
    zahl: { ueber: "Alternative Modelle", zahl: "3", einheit: "Modelle mit Rabatt – gleiche Leistungen", text: "Sie verzichten auf die freie Arztwahl beim ersten Schritt und bekommen dafür eine tiefere Prämie. Der Leistungskatalog bleibt derselbe." },
    folien: [
      { ueber: "Der Unterschied", titel: "Sie binden sich an eine erste Anlaufstelle.", text: "Hausarzt, Gruppenpraxis oder Telefon: Dort beginnt jede Behandlung. Überweisungen zum Spezialisten und ins Spital bleiben gedeckt." },
      { ueber: "Was das heisst", titel: "Notfälle sind immer gedeckt.", text: "In jedem Modell. Wer ohnehin einen Hausarzt hat, verliert mit dem Hausarztmodell nichts – und spart jeden Monat.", merke: "Das Modell wechseln Sie bei Ihrer Kasse bis 30. November." }
    ],
    aufhaenger: "Fakt: Hausarzt, HMO und Telmed sind günstiger als das Standardmodell – bei identischen Leistungen."
  },
  {
    id: "spitaltag", titel: "Der Spitalbeitrag", bild: "spital", bild2: "senioren", hashtags: ["franchise"],
    cover: ["Im Spital zahlen Sie", "**15 Franken** pro Tag", "dazu – neben Franchise", "und Selbstbehalt."],
    zahl: { ueber: "Spitalbeitrag", zahl: "CHF 15", einheit: "pro Spitaltag, Erwachsene", text: "Der dritte Teil der Kostenbeteiligung. Er ist nicht begrenzt – er fällt für jeden Tag im Spital an." },
    folien: [
      { ueber: "Die drei Posten", titel: "Franchise, Selbstbehalt, Spitalbeitrag.", text: "Das sind die Kosten, die Sie selbst tragen. Sie sind bei jeder Kasse gleich hoch – der Unterschied zwischen den Kassen liegt allein in der Prämie." },
      { ueber: "Ausgenommen", titel: "Kinder und junge Erwachsene in Ausbildung.", text: "Sie zahlen keinen Spitalbeitrag. Für alle anderen gilt: Wer mit einem Spitalaufenthalt rechnet, plant diesen Betrag ein.", merke: "Auch hier gilt: gleiche Regeln bei jeder Kasse, andere Prämie." }
    ],
    aufhaenger: "Fakt: Im Spital zahlen Erwachsene 15 Franken pro Tag selbst – zusätzlich zu Franchise und Selbstbehalt, bei jeder Kasse."
  },
  {
    id: "franchise-aendern", titel: "Franchise ändern", bild: "kalender", bild2: "buero", hashtags: ["franchise", "modelle"],
    cover: ["Die Franchise ändern Sie", "**ohne Kassenwechsel** –", "jedes Jahr."],
    folien: [
      { ueber: "Die Frist", titel: "Meldung bis 30. November.", text: "Die neue Franchise gilt ab 1. Januar – nach oben wie nach unten. Eine Meldung an die Kasse bis Ende November reicht." },
      { ueber: "Und das Modell", titel: "Gleich mit anpassen.", text: "Hausarzt, HMO oder Telmed wählen Sie ebenfalls bei Ihrer Kasse. Beides zusammen macht oft mehrere hundert Franken im Jahr aus – ohne die Kasse zu wechseln.", merke: "Kasse, Modell, Franchise: drei Hebel, ein Termin." }
    ],
    aufhaenger: "Fakt: Um die Franchise zu ändern, müssen Sie die Kasse nicht wechseln. Das geht jedes Jahr – Meldung bis 30. November."
  },
  {
    id: "faktoren", titel: "Fünf Faktoren", bild: "familie", bild2: "laptop", hashtags: [],
    cover: ["Fünf Dinge bestimmen", "Ihre Prämie. Ihre", "**Gesundheit** ist", "keines davon."],
    zahl: { ueber: "Was die Prämie bestimmt", zahl: "5", einheit: "Wohnort · Alter · Franchise · Modell · Unfalldeckung", text: "Mehr nicht. Drei der fünf wählen Sie selbst: Franchise, Modell und ob die Unfalldeckung dabei ist." },
    folien: [
      { ueber: "Was nicht zählt", titel: "Einkommen, Geschlecht, Vorerkrankungen.", text: "In der Grundversicherung spielt das keine Rolle – bei keiner Kasse. Auch der Lebensstil nicht. Die Prämie ist für alle in derselben Gruppe gleich." },
      { ueber: "Was das heisst", titel: "Drei Hebel liegen in Ihrer Hand.", text: "Franchise, Modell und Unfalldeckung stellen Sie selbst ein. Den vierten Hebel – die Kasse – auch. Nur Wohnort und Alter sind gegeben.", merke: "Wer die drei Hebel nie angefasst hat, zahlt mit grosser Wahrscheinlichkeit zu viel." }
    ],
    aufhaenger: "Fakt: Fünf Faktoren bestimmen Ihre Prämie – Wohnort, Alter, Franchise, Modell, Unfalldeckung. Ihre Gesundheit nicht."
  },
  {
    id: "kostenlos", titel: "Der Wechsel kostet nichts", bild: "muenzstapel", bild2: "brief", hashtags: ["wechsel"],
    cover: ["Der Wechsel kostet", "**nichts**. Die alte Kasse", "darf keine Gebühr", "verlangen."],
    folien: [
      { ueber: "Die Regel", titel: "Keine Gebühr, keine Nachzahlung.", text: "Für die Kündigung der Grundversicherung darf die Kasse nichts verrechnen. Die Franchise des alten Jahres bleibt beim alten Jahr – sie wird nicht nachgefordert." },
      { ueber: "Was der Wechsel kostet", titel: "Eine Minute und einen Brief.", text: "Vergleichen, Antrag bei der neuen Kasse, schriftliche Zusage abwarten, eingeschrieben kündigen. Das ist alles.", merke: "Wer nicht wechselt, zahlt den Unterschied – jedes Jahr." }
    ],
    aufhaenger: "Fakt: Der Kassenwechsel kostet nichts. Die alte Kasse darf weder eine Gebühr verlangen noch die Franchise nachfordern."
  },
  {
    id: "kinder-kasse", titel: "Kinder und Kasse", bild: "kinder", bild2: "mutter", hashtags: ["familie"],
    cover: ["Kinder dürfen bei einer", "**anderen Kasse** sein", "als die Eltern."],
    folien: [
      { ueber: "Eigene Tarife", titel: "Kinderprämien sind eigene Tarife.", text: "Die Rangfolge der Kassen ist bei Kindern anders als bei Erwachsenen. Mehrere Kinder bei einer günstigen Kasse: Das summiert sich im Jahr." },
      { ueber: "Franchise", titel: "Franchise 0 ist möglich.", text: "Bei Kindern reicht die Spanne von 0 bis 600 Franken. Mit Franchise 0 zahlt die Kasse ab der ersten Rechnung – bei Kindern meist die sinnvolle Wahl.", merke: "Jedes Familienmitglied einzeln vergleichen." }
    ],
    aufhaenger: "Fakt: Kinder dürfen bei einer anderen Krankenkasse sein als die Eltern. Kinderprämien haben ihre eigene Rangfolge."
  }
];

/* Foto je Mythos (Reihenfolge wie MYTHEN in themen.js), eines fuer den
   Titel und ein zweites fuer die Folie danach. */
const CHECK_BILD = ["rechner", "muenzstapel", "stethoskop", "brief", "kalender", "laptop", "praxis", "muenzen", "kinder", "arzt", "eltern", "flagge"];
const CHECK_BILD2 = ["buero", "praxis", "sprechstunde", "kalender", "umzug", "rechner", "stethoskop", "brief", "familie", "senioren", "mutter", "luzern"];

/* ---------------------------------------------------------- Paket bauen */

/* Alt-Text je Folie (Screenreader, max. 1000 Zeichen). */
function altText(f, etikett) {
  const t = (x) => zeilen(x).map(ohneFett).join(" ");
  const s = {
    cover: () => `${etikett}: ${t(f.titel)}${f.unten ? " " + f.unten : ""}${f.zahl ? " – " + f.zahl : ""}`,
    text: () => `${t(f.titel)} ${t(f.text)}${f.merke ? " " + ohneFett(f.merke) : ""}`,
    zahl: () => `${f.zahl} ${f.einheit || ""}. ${t(f.text)}`,
    balken: () => `${t(f.titel)} ${f.balken.map((b) => `${b.label}: ${b.text}`).join(", ")}. ${f.fuss || ""}`,
    liste: () => `${t(f.titel)} ${f.punkte.map((p, i) => `${i + 1}. ${typeof p === "string" ? p : p.titel}`).join(" ")}`,
    tabelle: () => `${t(f.titel)} ${f.zeilen.map((z) => z.join(" ")).join("; ")}. ${f.fuss || ""}`,
    stempel: () => `Mythos: ${t(f.zitat)} Stimmt nicht: ${t(f.wahrheit)} ${t(f.text)}`,
    cta: () => "SwissPremia – alle Krankenkassen in einer Minute vergleichen, kostenlos, mit den offiziellen BAG-Daten. Link im Profil."
  }[f.art];
  return (s ? s() : "").replace(/\s+/g, " ").trim().slice(0, 600);
}

/* Absaetze des Bildtexts aus den Folien (ohne Titel und Abbinder). */
function absaetzeAus(folien) {
  const a = [];
  for (const f of folien) {
    if (f.art === "zahl") a.push(`${f.zahl} ${f.einheit ? f.einheit + ". " : ""}${zeilen(f.text).map(ohneFett).join(" ")}`);
    if (f.art === "text") a.push(`${ohneFett(zeilen(f.titel).join(" "))} ${zeilen(f.text).map(ohneFett).join(" ")}${f.merke ? " " + ohneFett(f.merke) : ""}`);
    if (f.art === "balken") a.push(`${ohneFett(zeilen(f.titel).join(" "))} ${f.balken.map((b) => `${b.label} ${b.text}`).join(", ")}.`);
    if (f.art === "tabelle") a.push(`${ohneFett(zeilen(f.titel).join(" "))} ${f.zeilen.map((z) => z[0] + ": " + z.slice(1).join(" / ")).join("; ")}.`);
    if (f.art === "stempel") a.push(`Stimmt nicht: ${zeilen(f.wahrheit).map(ohneFett).join(" ")} ${zeilen(f.text).map(ohneFett).join(" ")}`);
  }
  return a.map((t) => t.replace(/\s+/g, " ").trim());
}

function paket({ format, gruppe, param, titel, datumText, folien, aufhaenger, absaetze = null, quelle: q = "", hashtags = [], region = null }) {
  const stufe = KARUSSELL_STUFE[format];
  const stil = format;
  const alle = [...folien, { art: "cta", stufe }];
  const id = `${format}-${param.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const karussell = { id, stil, datum: datumAnzeige(datumText), titel, folien: alle };
  return {
    typ: "karussell", format, gruppe, param, schluessel: `${format}|${param}`, titel: `${ETIKETT[format]}: ${titel}`, stufe, region,
    karussell,
    bildtext: { aufhaenger, absaetze: absaetze || absaetzeAus(alle), quelle: q, hashtags },
    altTexte: alle.map((f) => altText(f, ETIKETT[format]))
  };
}

/* ---------------------------------------------------- 1 Fakt des Tages */
export function fakt(i, datumText) {
  const f = FAKTEN[i];
  if (!f) return null;
  const folien = [
    { art: "cover", bild: f.bild, titel: f.cover, unten: f.unten },
    ...(f.zahl ? [{ art: "zahl", hintergrund: "petrol", ...f.zahl }] : []),
    { art: "text", hintergrund: "creme", bild: f.bild2, ...f.folien[0] },
    { art: "text", hintergrund: "slate", ...f.folien[1] }
  ];
  return paket({ format: "fakt", gruppe: "wissen", param: f.id, titel: f.titel, datumText, folien, aufhaenger: f.aufhaenger, quelle: QUELLE_GESETZ, hashtags: hashtagsSammeln(f.hashtags) });
}

/* ------------------------------------------------------ 2 Mythos-Check */
export function check(i, datumText) {
  const m = MYTHEN[i];
  if (!m) return null;
  const folien = [
    { art: "cover", bild: CHECK_BILD[i] || "alpen", titel: m.mythos, unten: "Das sagen viele. Die Antwort auf der nächsten Folie." },
    { art: "stempel", hintergrund: "creme", zitat: m.mythos, wahrheit: m.wahrheit, text: m.detail.join(" ") },
    { art: "text", hintergrund: "slate", bild: CHECK_BILD2[i] || "dorf", ueber: "Und jetzt?", titel: "Vergleichen dauert eine Minute.",
      text: "Alle Kassen, die offiziellen Prämiendaten des Bundes, ohne Anmeldung. Die Rangfolge der Kassen ändert sich jedes Jahr – einmal im Jahr nachsehen lohnt sich.",
      merke: "Gleiche Leistung bei jeder Kasse. Nur der Preis ist anders." }
  ];
  return paket({
    format: "check", gruppe: "wissen", param: String(i + 1), titel: `Mythos ${i + 1}`, datumText, folien,
    aufhaenger: m.aufhaenger, absaetze: [m.wahrheitStimme, m.detailStimme], quelle: "", hashtags: hashtagsSammeln(m.hashtags)
  });
}

/* ----------------------------------------------------- 3 Zahl des Tages */
/* Vier Varianten je Praemienregion; welche laeuft, wechselt mit dem Tag.
   Jede liefert { titel, cover, folien, aufhaenger, quelle, hashtags } oder null. */

function zahlFlexibel(r) {
  const standard = guenstigstes(r.schluessel, "E", 300, "M", 0);
  const sparsam = guenstigstes(r.schluessel, "E", 2500, "M");
  if (!standard || !sparsam || sparsam.modell === 0) return null;
  const ersparnis = jahr(standard.praemie - sparsam.praemie);
  if (ersparnis < 600) return null;
  const modell = MODELLE[sparsam.modell], name = r.name;
  const immer = ersparnis >= 2200;
  const grenze = immer ? null : Math.round((300 + ersparnis / 0.9) / 50) * 50;
  return {
    titel: `Sparpotenzial ${im(r, false)}`,
    cover: { zahl: chf(ersparnis), bild: kantonBild(r.kanton, "gipfel"), titel: [`liegen ${im(r)} im Jahr zwischen`, "Standard mit Franchise 300 und", `${modell} mit Franchise 2'500.`] },
    folien: [
      { art: "balken", hintergrund: "slate", ueber: "Günstigstes Angebot · pro Monat", titel: ["Gleiche Grundversicherung,", "andere Einstellung."],
        balken: [{ label: "Standard · Franchise 300", wert: standard.praemie, text: chf(standard.praemie) }, { label: `${modell} · Franchise 2'500`, wert: sparsam.praemie, text: chf(sparsam.praemie), gold: true }],
        fuss: `× 12 Monate = ${chf(ersparnis)} im Jahr. Erwachsene, mit Unfalldeckung, BAG-Prämien ${JAHR}.` },
      { art: "text", hintergrund: "creme", ueber: "Der Haken", titel: "Krank? Dann bis **CHF 2'200** mehr selbst zahlen.",
        text: "Die hohe Franchise lohnt sich für Gesunde, die selten zum Arzt gehen – und nur, wenn dieses Geld da ist, wenn die Rechnung kommt.",
        merke: immer ? "Die Prämienersparnis ist hier höher als die Franchisedifferenz – 2'500 gewinnt in jedem Fall." : `Faustregel: Wer unter rund ${chf(grenze)} Arztkosten im Jahr bleibt, fährt mit 2'500 besser.` },
      { art: "text", hintergrund: "slate", bild: "laptop", ueber: "So geht's", titel: "Modell und Franchise ändern Sie bis 30. November.", text: "Bei Ihrer Kasse oder zusammen mit dem Wechsel. Die neue Einstellung gilt ab 1. Januar – und die Leistungen bleiben dieselben." }
    ],
    aufhaenger: `${name}: bis zu ${chf(ersparnis)} im Jahr zwischen Standard/300 und ${modell}/2'500 – gleiche Grundversicherung.`,
    quelle: quelle(r, "günstigste Angebote für Erwachsene mit Unfalldeckung in den genannten Kombinationen"),
    hashtags: hashtagsSammeln(["franchise", "modelle"], [kantonHashtag(r.kantonName)])
  };
}

function zahlModelle(r) {
  const je = [0, 1, 2, 3].map((m) => guenstigstes(r.schluessel, "E", 300, "M", m));
  if (!je[0]) return null;
  const alternativen = [1, 2, 3].filter((m) => je[m]).map((m) => ({ modell: m, praemie: je[m].praemie })).sort((a, b) => a.praemie - b.praemie);
  if (!alternativen.length) return null;
  const best = alternativen[0], diff = jahr(je[0].praemie - best.praemie), name = r.name;
  if (diff < 240) return null;
  return {
    titel: `Modelle ${im(r, false)}`,
    cover: { zahl: chf(diff), bild: "praxis", titel: ["weniger im Jahr – vom Standard-", `zum ${MODELLE[best.modell]}-Modell ${im(r)}.`, "Gleiche Leistungen."] },
    folien: [
      { art: "balken", hintergrund: "slate", ueber: "Günstigstes Angebot je Modell · pro Monat", titel: [`${name}:`, "Alternativen zum Standard."],
        balken: [0, 1, 2, 3].filter((m) => je[m]).map((m) => ({ label: MODELL_KURZ[m], wert: je[m].praemie, text: chf(je[m].praemie), gold: m === best.modell })),
        fuss: `Erwachsene, Franchise 300, mit Unfalldeckung. BAG-Prämien ${JAHR}, gerundet.` },
      { art: "text", hintergrund: "creme", ueber: "Der Unterschied", titel: "Sie binden sich an eine erste Anlaufstelle.",
        text: "Hausarzt, Gruppenpraxis oder Telefon: Dort beginnt jede Behandlung. Spezialist und Spital bleiben gedeckt – Sie gehen nur zuerst dorthin. Notfälle sind in jedem Modell gedeckt.",
        merke: "Wer ohnehin einen Hausarzt hat, verliert mit dem Hausarztmodell nichts." },
      { art: "text", hintergrund: "slate", bild: kantonBild(r.kanton, "arzt"), ueber: "So geht's", titel: "Das Modell wechseln Sie bei Ihrer Kasse.", text: "Auf das neue Jahr, Meldung bis 30. November – oder gleich zusammen mit dem Kassenwechsel." }
    ],
    aufhaenger: `${name}: Vom Standard- zum ${MODELLE[best.modell]}-Modell sind es ${chf(diff)} im Jahr – identische Leistungen.`,
    quelle: quelle(r, "günstigstes Angebot je Modell, Erwachsene, Franchise 300, mit Unfalldeckung"),
    hashtags: hashtagsSammeln(["modelle"], [kantonHashtag(r.kantonName)])
  };
}

function zahlAlter(r) {
  const k = guenstigstes(r.schluessel, "K", 0, "M"), j = guenstigstes(r.schluessel, "J", 300, "M"), e = guenstigstes(r.schluessel, "E", 300, "M");
  if (!k || !j || !e || e.praemie <= j.praemie) return null;
  const diff = e.praemie - j.praemie, name = r.name;
  return {
    titel: `Altersklassen ${im(r, false)}`,
    cover: { zahl: `+ ${chf(diff)}`, bild: "jung", titel: ["im Monat: So viel steigt die", `günstigste Prämie ${im(r)}`, "mit 26. Automatisch."] },
    folien: [
      { art: "balken", hintergrund: "slate", ueber: "Günstigstes Angebot · pro Monat", titel: ["Drei Altersklassen,", "drei Prämien."],
        balken: [{ label: "Kinder (bis 18) · Franchise 0", wert: k.praemie, text: chf(k.praemie) }, { label: "19–25 · Franchise 300", wert: j.praemie, text: chf(j.praemie) }, { label: "ab 26 · Franchise 300", wert: e.praemie, text: chf(e.praemie), gold: true }],
        fuss: `Mit Unfalldeckung, ${r.beschreibung}. BAG-Prämien ${JAHR}, gerundet.` },
      { art: "text", hintergrund: "creme", ueber: "Warum", titel: "Zwei Sprünge: mit 19 und mit 26.",
        text: "Mit 19 fällt oft der Familienrabatt weg, mit 26 gilt die volle Prämie. Beides passiert automatisch – und meist, ohne dass jemand nachrechnet.",
        merke: "Die Rangfolge der Kassen ist in jeder Altersklasse anders." },
      { art: "text", hintergrund: "slate", bild: "laptop", ueber: "So geht's", titel: "Mit 26 neu vergleichen.", text: `Das sind ${chf(jahr(diff))} im Jahr – bei gleichen Leistungen. Kündigung bis 30. November, eingetroffen bei der Kasse.` }
    ],
    aufhaenger: `${name}: Mit 26 steigt die günstigste Prämie um ${chf(diff)} im Monat – automatisch und meist unbemerkt.`,
    quelle: quelle(r, "günstigstes Angebot je Altersklasse, Franchise 300 (Kinder 0), mit Unfalldeckung"),
    hashtags: hashtagsSammeln(["alter"], [kantonHashtag(r.kantonName)])
  };
}

function zahlFranchise(r) {
  const kandidaten = angebote(r.schluessel, "E", 300, "M");
  const passend = (a) => ({ ...a, hoch: praemieVon(a.versicherer, a.modell, r.schluessel, "E", 2500, "M") });
  const treffer = kandidaten.filter((a) => a.modell === 0).map(passend).find((a) => a.hoch) || kandidaten.map(passend).find((a) => a.hoch);
  if (!treffer || treffer.praemie - treffer.hoch < 20) return null;
  const p300 = treffer.praemie, p2500 = treffer.hoch, ersparnis = jahr(p300 - p2500), name = r.name;
  const immer = ersparnis >= 2200;
  const grenze = immer ? null : Math.round((300 + ersparnis / 0.9) / 50) * 50;
  return {
    titel: `Franchise ${im(r, false)}`,
    cover: { zahl: chf(ersparnis), bild: "rechner", titel: ["Prämie gespart im Jahr – mit", "Franchise 2'500 statt 300, gleiche", `Kasse, gleiches Modell, **${name}**.`] },
    folien: [
      { art: "balken", hintergrund: "slate", ueber: "Dasselbe Angebot · pro Monat", titel: ["Franchise 300", "oder 2'500?"],
        balken: [{ label: "Franchise 300", wert: p300, text: chf(p300) }, { label: "Franchise 2'500", wert: p2500, text: chf(p2500), gold: true }],
        fuss: `${MODELLE[treffer.modell]}-Modell, Erwachsene, mit Unfalldeckung. × 12 Monate = ${chf(ersparnis)}. BAG-Prämien ${JAHR}, gerundet.` },
      { art: "text", hintergrund: "creme", ueber: "Der Haken", titel: "Bis **CHF 2'200** mehr selbst tragen.",
        text: "Die Differenz der Franchisen tragen Sie im Krankheitsfall selbst – dazu der Selbstbehalt. Die Prämienersparnis ist sicher, die Arztkosten sind es nicht.",
        merke: immer ? "Hier ist die Ersparnis höher als die Franchisedifferenz: 2'500 gewinnt in jedem Fall." : `Faustregel: Wer unter rund ${chf(grenze)} Arztkosten im Jahr bleibt, fährt mit 2'500 besser.` },
      { art: "text", hintergrund: "slate", bild: "kalender", ueber: "So geht's", titel: "Die Franchise ändern Sie bis 30. November.", text: "Bei Ihrer Kasse, ohne Wechsel. Die neue Franchise gilt ab 1. Januar – nach oben wie nach unten." }
    ],
    aufhaenger: `${name}: Franchise 2'500 statt 300 spart ${chf(ersparnis)} Prämie im Jahr – gleiche Kasse, gleiches Modell.`,
    quelle: quelle(r, "dasselbe Angebot mit Franchise 300 und 2'500, Erwachsene, mit Unfalldeckung"),
    hashtags: hashtagsSammeln(["franchise"], [kantonHashtag(r.kantonName)])
  };
}

const ZAHL_VARIANTEN = [zahlFlexibel, zahlModelle, zahlAlter, zahlFranchise];

export function zahl(r, datumText, variante = null) {
  const tag = Math.round(datumLesen(datumText).getTime() / 86_400_000);
  const start = variante ?? (tag + REGIONEN.indexOf(r)) % ZAHL_VARIANTEN.length;
  for (let i = 0; i < ZAHL_VARIANTEN.length; i++) {
    const v = ZAHL_VARIANTEN[(start + i) % ZAHL_VARIANTEN.length](r);
    if (!v) continue;
    return paket({
      format: "zahl", gruppe: "daten", param: r.schluessel, titel: v.titel, datumText, region: r.kanton,
      folien: [{ art: "cover", ...v.cover }, ...v.folien],
      aufhaenger: v.aufhaenger, quelle: v.quelle, hashtags: v.hashtags
    });
  }
  return null;
}

/* --------------------------------------------------- 4 Kanton-Steckbrief */
export function steckbrief(kt, datumText) {
  const name = KANTONE[kt];
  if (!name) return null;
  const regs = REGIONEN.filter((r) => r.kanton === kt);
  const reihen = regs.map((r) => ({
    r, s: guenstigstes(r.schluessel, "E", 300, "M", 0), h: guenstigstes(r.schluessel, "E", 300, "M", 1), t: guenstigstes(r.schluessel, "E", 300, "M", 2),
    irgend: guenstigstes(r.schluessel, "E", 300, "M")
  })).filter((z) => z.s && z.irgend);
  if (!reihen.length) return null;
  const billigst = reihen.reduce((a, b) => (b.s.praemie < a.s.praemie ? b : a));
  const bestes = reihen.reduce((a, b) => (b.irgend.praemie < a.irgend.praemie ? b : a));
  const k = guenstigstes(billigst.r.schluessel, "K", 0, "M"), j = guenstigstes(billigst.r.schluessel, "J", 300, "M");
  /* Sparpotenzial in der guenstigsten Region: Standard/300 gegen das
     guenstigste Modell mit 2'500 – sonst gegen das guenstigste Modell. */
  const sparsam = guenstigstes(billigst.r.schluessel, "E", 2500, "M");
  const spar = sparsam && sparsam.modell !== 0 ? { diff: jahr(billigst.s.praemie - sparsam.praemie), text: `${MODELLE[sparsam.modell]} mit Franchise 2'500` } : { diff: jahr(billigst.s.praemie - billigst.irgend.praemie), text: `${MODELLE[billigst.irgend.modell]}-Modell` };
  const mehrere = regs.length > 1;
  const wo = (z) => (mehrere ? `${z.r.nummer} · ${z.r.ort}` : name);
  const folien = [
    { art: "cover", bild: kantonBild(kt, "alpen"), ueber: "Kanton", titel: name, unten: `Prämien-Steckbrief ${JAHR} · Erwachsene, Franchise 300, pro Monat`, werte: [
      { wert: String(regs.length), text: mehrere ? "Prämienregionen" : "Prämienregion" },
      { wert: chf(billigst.s.praemie), text: "ab · Standardmodell" },
      { wert: chf(bestes.irgend.praemie), text: `ab · ${MODELL_KURZ[bestes.irgend.modell]}` }
    ] },
    { art: "tabelle", hintergrund: "creme", ueber: "Günstigstes Angebot · pro Monat · Erwachsene", titel: mehrere ? "Je Prämienregion." : "Die Prämien im Überblick.",
      spalten: ["Region", "Standard", "Hausarzt", "Telmed"],
      zeilen: reihen.map((z) => [wo(z), chf(z.s.praemie), z.h ? chf(z.h.praemie) : "–", z.t ? chf(z.t.praemie) : "–"]),
      fuss: `Franchise 300, mit Unfalldeckung. Hausarzt = Hausarzt-/HMO-Modell, Telmed = Telmed-/digitales Modell. BAG-Prämien ${JAHR}, gerundet.`,
      merke: mehrere ? `Günstigste Region: ${billigst.r.ort}. Innerhalb jeder Region liegen die Kassen Hunderte Franken im Jahr auseinander.` : "Innerhalb des Kantons liegen die Kassen Hunderte Franken im Jahr auseinander – bei gleichen Leistungen." },
    ...(k && j ? [{ art: "zahl", hintergrund: "petrol", ueber: "Kinder und junge Erwachsene", zahl: chf(k.praemie), einheit: "Kinder · pro Monat · Franchise 0",
      text: `Junge Erwachsene (19–25) ab ${chf(j.praemie)}, Erwachsene ab ${chf(billigst.s.praemie)} – günstigstes Angebot im Standardmodell, ${billigst.r.beschreibung}.`,
      quelle: `Mit Unfalldeckung, BAG-Prämien ${JAHR}, gerundet.` }] : []),
    { art: "text", hintergrund: "slate", bild: kantonBild(kt, "dorf"), ueber: "Sparpotenzial", titel: `Bis zu **${chf(spar.diff)}** im Jahr.`,
      text: `Zwischen dem Standardmodell mit Franchise 300 und ${spar.text}, ${mehrere ? `Prämienregion ${billigst.r.nummer} (z. B. ${billigst.r.ort})` : `Kanton ${name}`}. Gleiche Grundversicherung, gleiche Leistungen.`,
      merke: "Die Region können Sie nicht wählen. Kasse, Modell und Franchise schon." }
  ];
  return paket({
    format: "steckbrief", gruppe: "daten", param: kt, titel: name, datumText, region: kt, folien,
    aufhaenger: `Kanton ${name}: Grundversicherung ${JAHR} ab ${chf(billigst.s.praemie)} im Monat – Standard, Erwachsene, Franchise 300${mehrere ? `, Region ${billigst.r.nummer}` : ""}.`,
    quelle: `Zahlen: günstigste Angebote je Prämienregion und Modell, Erwachsene, Franchise 300 (Kinder 0), mit Unfalldeckung, BAG-Prämien ${JAHR}, gerundet. Beispielrechnung, keine Beratung.`,
    hashtags: hashtagsSammeln(["regionen"], [kantonHashtag(name)])
  });
}

/* ------------------------------------------------------------ Auswahl */

export function karussellKandidaten() {
  const liste = [];
  FAKTEN.forEach((f, i) => liste.push({ gruppe: "wissen", format: "fakt", param: f.id, bauen: (d) => fakt(i, d) }));
  MYTHEN.forEach((_, i) => liste.push({ gruppe: "wissen", format: "check", param: String(i + 1), bauen: (d) => check(i, d) }));
  for (const r of REGIONEN) liste.push({ gruppe: "daten", format: "zahl", param: r.schluessel, region: r.kanton, bauen: (d) => zahl(r, d) });
  for (const kt of KANTONE_MIT_REGIONEN) liste.push({ gruppe: "daten", format: "steckbrief", param: kt, region: kt, bauen: (d) => steckbrief(kt, d) });
  return liste.map((k) => ({ ...k, schluessel: `${k.format}|${k.param}` }));
}

/* Welche Karussells heute: abwechselnd ein Wissens- und ein Daten-Karussell;
   innerhalb der Gruppe wechselt das Format mit dem Tag (fakt/check,
   zahl/steckbrief). Am laengsten nicht gelaufene Themen zuerst (Verlauf),
   Kantone, die heute schon ein Reel haben, moeglichst meiden. */
export function karussellsAuswaehlen(datumText, anzahl, verlauf = {}, { kantoneHeute = new Set() } = {}) {
  const datum = datumLesen(datumText);
  const rnd = zufall("karussell|" + datumText);
  const tag = Math.round(datum.getTime() / 86_400_000);
  const alle = karussellKandidaten();
  const tageSeit = (k) => (verlauf[k.schluessel] ? Math.round((datum - datumLesen(verlauf[k.schluessel])) / 86_400_000) : Infinity);
  const laengstHer = (liste) => mischen(liste, rnd).sort((x, y) => tageSeit(y) - tageSeit(x));
  const reihen = [["fakt", "check"], ["zahl", "steckbrief"]];
  const gewaehlt = [];
  for (let i = 0; i < anzahl; i++) {
    const familie = reihen[i % 2];
    const formate = [familie[(tag + Math.floor(i / 2)) % 2], familie[(tag + Math.floor(i / 2) + 1) % 2]];
    let treffer = null;
    for (const format of formate) {
      const pool = laengstHer(alle.filter((k) => k.format === format && !gewaehlt.includes(k)));
      for (const streng of [true, false]) {
        for (const k of pool) {
          if (streng && k.region && kantoneHeute.has(k.region)) continue;
          const p = k.bauen(datumText);
          if (p) { treffer = { k, p }; break; }
        }
        if (treffer) break;
      }
      if (treffer) break;
    }
    if (!treffer) break;
    gewaehlt.push(treffer.k);
    treffer.k.paket = treffer.p;
    if (treffer.k.region) kantoneHeute.add(treffer.k.region);
  }
  return gewaehlt.map((k) => k.paket);
}

/* Sendezeiten: gleichmaessig ueber das Fenster verteilt (ein Drittel, zwei
   Drittel ...), auf 5 Minuten gerundet und so verschoben, dass zu jedem
   anderen Beitrag mindestens "karussellAbstandMinuten" liegen. */
export function karussellZeiten(datumText, n, konfig, belegt = []) {
  const von = minuten(konfig.postVon), bis = minuten(konfig.postBis);
  const abstand = Math.max(5, Number(konfig.karussellAbstandMinuten) || 20);
  const rnd = zufall("karussellzeiten|" + datumText);
  const text = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const frei = (m) => m >= von && m <= bis && belegt.every((b) => Math.abs(b - m) >= abstand);
  const zeiten = [];
  for (let i = 0; i < n; i++) {
    const ziel = Math.round((von + ((i + 1) / (n + 1)) * (bis - von) + (rnd() * 2 - 1) * 20) / 5) * 5;
    let m = ziel;
    for (let k = 1; !frei(m) && k < 80; k++) m = ziel + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 5;
    if (!frei(m)) m = Math.max(von, Math.min(bis, ziel));
    belegt.push(m);
    zeiten.push(text(m));
  }
  return zeiten;
}

/* Ein Planeintrag aus einem Paket – gleiche Felder wie bei den Reels,
   dazu typ, karussell, altTexte, dateien und bildUrls. */
export function karussellEintrag(p, nr, zeit, konfig) {
  const { text, kommentar, warnungen } = bildtextBauen({ ...p.bildtext, sprache: "de", modus: konfig.hashtags, stufe: p.stufe });
  return {
    nr, typ: "karussell", format: p.format, stufe: p.stufe, rahmen: null, gruppe: p.gruppe, schluessel: p.schluessel, titel: p.titel, sprache: "de", cover: null,
    zeit, status: "geplant", karussell: p.karussell, altTexte: p.altTexte, bildtext: text, kommentar,
    dateien: null, bildUrls: null, url: null, coverUrl: null, containerId: null, mediaId: null, veroeffentlicht: null, fehler: null, versuche: 0,
    warnungen: warnungen.length ? warnungen : undefined
  };
}

/* Kanton eines Planeintrags (aus dem Schluessel "format|ZH1" bzw. "format|BE"). */
const kantonVon = (r) => { const p = (r.schluessel || "").split("|")[1] || ""; const kt = p.slice(0, 2); return KANTONE[kt] && /^[A-Z]{2}\d?$/.test(p) ? kt : (r.region || null); };

/* Dem Tagesplan die Karussells hinzufuegen, falls noch keine darin sind.
   Liefert die neuen Eintraege (noch nicht gespeichert). */
export function karussellsPlanen(plan, konfig, { verlauf = {}, anzahl = null } = {}) {
  const n = anzahl ?? (Number(konfig.karussellsProTag) || 0);
  if (!n || plan.reels.some((r) => r.typ === "karussell")) return [];
  const kantoneHeute = new Set(plan.reels.map(kantonVon).filter(Boolean));
  const pakete = karussellsAuswaehlen(plan.datum, n, verlauf, { kantoneHeute });
  const belegt = plan.reels.map((r) => minuten(r.zeit));
  const zeiten = karussellZeiten(plan.datum, pakete.length, konfig, belegt);
  const erste = plan.reels.length;
  return pakete.map((p, i) => karussellEintrag(p, erste + i + 1, zeiten[i], konfig));
}
