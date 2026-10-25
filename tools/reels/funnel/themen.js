/* =========================================================================
   Themenbank: Bildtexte der 21 Stamm-Reels, die Mythen-Reihe und die
   Hashtag-Saetze. Regeln wie in marke/instagram/beitraege.md:
   erste Zeile unter 125 Zeichen und allein, keine Links im Text, kein
   "wir beraten", Schweizer Schreibweise.
   ========================================================================= */

export const HASHTAGS = {
  basis: ["#krankenkasse", "#krankenkassenvergleich", "#grundversicherung", "#prämien", "#schweiz", "#sparen"],
  franchise: ["#franchise", "#selbstbehalt"],
  wechsel: ["#kassenwechsel", "#kündigung", "#30november"],
  modelle: ["#hausarztmodell", "#hmo", "#telmed"],
  regionen: ["#prämienregion", "#umzug"],
  alter: ["#jungeerwachsene", "#19jahre", "#studenten"],
  unfall: ["#unfalldeckung", "#unfallversicherung"],
  familie: ["#familie", "#baby", "#neugeborene"],
  verbilligung: ["#prämienverbilligung"],
  zusatz: ["#zusatzversicherung"],
  en: ["#healthinsurance", "#switzerland", "#expatsinswitzerland", "#newinswitzerland", "#movingtoswitzerland", "#swisslife"]
};

/* Kantons-Hashtag fuer regionale Reels: "#zürich", "#bern" ... */
export const kantonHashtag = (kantonName) => "#" + kantonName.toLowerCase().replace(/[^a-zäöüéè]/g, "");

export const AUFRUF_DE = "Alle Kassen mit den offiziellen Prämiendaten des Bundes vergleichen – kostenlos und ohne Anmeldung. Link im Profil.";
export const AUFRUF_EN = "Compare every insurer with the official federal premium data – free, no sign-up. Link in bio.";

/* ------------------------------------------------ Bildtexte Stamm-Reels */
/* Schluessel = id in src/reels.js. "aufhaenger" ist die erste Zeile. */
export const STAMM = {
  "zwei-termine": {
    aufhaenger: "Es gibt einen zweiten Termin, um die Krankenkasse zu wechseln. Ihre Kasse wird ihn Ihnen nicht nennen.",
    absaetze: [
      "Den ersten kennen alle: Die Kündigung muss bis 30. November bei der Kasse sein. Nicht abgeschickt – eingetroffen.",
      "Den zweiten kennt fast niemand: Wechsel auf den 1. Juli, Kündigung bis 31. März. Er gilt nur mit der tiefsten Franchise im Standardmodell.",
      "Zwei Chancen im Jahr. Die meisten nutzen keine."
    ],
    hashtags: ["wechsel", "franchise"]
  },
  "gleiche-leistung": {
    aufhaenger: "CHF 400 oder CHF 620 im Monat – für exakt dieselbe Leistung.",
    absaetze: [
      "Der Leistungskatalog der Grundversicherung steht im Krankenversicherungsgesetz. Er ist bei jeder Kasse identisch. Nicht ähnlich – identisch.",
      "Wer mehr zahlt, bekommt dafür nichts. Je nach Region, Alter und Modell liegen über CHF 2000 im Jahr dazwischen.",
      "Beispielwerte aus einer Prämienregion; Ihre Zahlen zeigt der Rechner für Ihre Postleitzahl."
    ],
    hashtags: []
  },
  "mit-19": {
    aufhaenger: "Mit 19 steigt Ihre Krankenkassenprämie. Automatisch – und meist ohne dass jemand nachrechnet.",
    absaetze: [
      "Drei Altersklassen, zwei Sprünge: mit 19 und mit 26. Beim ersten fällt oft der Familienrabatt weg – die Kasse der Eltern ist dann nicht mehr die günstige.",
      "Wer mit 19 vergleicht, spart im Verhältnis am meisten. Erste eigene Kasse? Erst vergleichen, dann unterschreiben."
    ],
    hashtags: ["alter"]
  },
  "franchise": {
    aufhaenger: "Franchise 300 oder 2500? Die Mitte ist oft die schlechteste Wahl.",
    absaetze: [
      "Hohe Franchise, tiefere Prämie – dafür tragen Sie bis zu CHF 2200 mehr selbst, wenn Sie krank werden.",
      "Drei Zahlen entscheiden: Prämienersparnis im Jahr, Franchisedifferenz, und ehrlich geschätzt: Was gaben Sie letztes Jahr beim Arzt aus?",
      "Die Franchise ändern Sie bis Ende November, ohne die Kasse zu wechseln."
    ],
    hashtags: ["franchise"]
  },
  "new-in-switzerland": {
    sprache: "en",
    aufhaenger: "New in Switzerland? Your 90 days started the day you arrived.",
    absaetze: [
      "Health insurance is mandatory. You have three months to sign up – and if you do it in time, you're covered retroactively from day one.",
      "No health check, no rejection: every insurer must take you for basic insurance. The coverage is identical everywhere. Only the price differs – by a lot.",
      "Compare all insurers in English, in one minute."
    ],
    hashtags: ["en"]
  },
  "umzug": {
    aufhaenger: "Umgezogen? Gleiche Kasse, gleiches Modell – und trotzdem eine andere Prämie.",
    absaetze: [
      "Bis zu drei Prämienregionen pro Kanton. Ihre Gemeinde entscheidet, in welcher Sie sind.",
      "Melden Sie den Umzug Ihrer Kasse, sonst zahlen Sie den falschen Betrag. Und nutzen Sie den Moment zum Vergleichen – Frist ist der 30. November."
    ],
    hashtags: ["regionen"]
  },
  "countdown-november": {
    aufhaenger: "Am 29. November abgeschickt heisst: ein Jahr länger bei der alten Kasse. Es zählt der Eingang.",
    absaetze: [
      "Die Kündigung muss am 30. November bei der Kasse liegen. Nicht unterwegs sein – dort liegen. Die Post braucht Tage, eingeschrieben etwas mehr.",
      "Wer spätestens am 20. November aufgibt, ist auf der sicheren Seite. Vorher: Zusage der neuen Kasse abwarten und offene Prämien bezahlen."
    ],
    hashtags: ["wechsel"]
  },
  "eingeschrieben": {
    aufhaenger: "Der Poststempel hilft Ihnen nicht. Nur der eingeschriebene Brief beweist, wann die Kündigung bei der Kasse lag.",
    absaetze: [
      "Ins Schreiben gehören: Name und Versichertennummer, das Wort «Grundversicherung», alle Personen, Datum und Unterschrift.",
      "Bietet Ihre Kasse Portal oder E-Mail an, Bestätigung aufbewahren. Im Streitfall zählt, was Sie belegen können."
    ],
    hashtags: ["wechsel"]
  },
  "selbstbehalt": {
    aufhaenger: "Mit der Franchise ist es nicht getan: Darüber zahlen Sie 10 Prozent Selbstbehalt – bis CHF 700 im Jahr.",
    absaetze: [
      "Bei Franchise 2500 sind das im schlechtesten Fall CHF 3200 aus der eigenen Tasche, bevor die Kasse alles übernimmt.",
      "Die hohe Franchise lohnt sich nur, wenn dieses Geld da ist, wenn die Rechnung kommt."
    ],
    hashtags: ["franchise"]
  },
  "drei-modelle": {
    aufhaenger: "Hausarzt, HMO oder Telmed: alle drei günstiger als das Standardmodell – bei gleichen Leistungen.",
    absaetze: [
      "Sie tauschen ein Stück freie Arztwahl gegen eine tiefere Prämie. Wer ohnehin einen Hausarzt hat, verliert mit dem Hausarztmodell nichts.",
      "Notfälle sind in jedem Modell gedeckt."
    ],
    hashtags: ["modelle"]
  },
  "praemienregionen": {
    aufhaenger: "Gleiche Kasse, gleiches Modell, andere Gemeinde: Die Prämie ist eine andere.",
    absaetze: [
      "Bis zu drei Prämienregionen pro Kanton. Region 1 ist meist die Stadt und die teuerste.",
      "Die Region können Sie nicht wählen. Die Kasse schon – und die Rangfolge ist in jeder Region anders."
    ],
    hashtags: ["regionen"]
  },
  "familienrabatt": {
    aufhaenger: "Ab dem zweiten oder dritten Kind gibt es bei vielen Kassen Rabatt. Wie viel, legt jede selbst fest.",
    absaetze: [
      "Darum lohnt es sich bei Familien doppelt nachzurechnen: Alle bei derselben Kasse ist bequem, aber nicht automatisch günstig.",
      "Kinder dürfen bei einer anderen Kasse versichert sein als die Eltern."
    ],
    hashtags: ["familie"]
  },
  "neugeborene": {
    aufhaenger: "Ihr Kind muss innert drei Monaten versichert sein. Rechtzeitig angemeldet, gilt die Deckung ab dem ersten Tag.",
    absaetze: [
      "In der Grundversicherung wird niemand abgelehnt – auch kein Säugling.",
      "Anders die Zusatzversicherung: Die schliessen Sie am besten vor der Geburt ab, danach ist eine Gesundheitsprüfung möglich."
    ],
    hashtags: ["familie", "zusatz"]
  },
  "unfalldeckung": {
    aufhaenger: "Angestellt, mindestens 8 Stunden pro Woche? Dann zahlen Sie die Unfalldeckung vielleicht doppelt.",
    absaetze: [
      "Unfall läuft dann über den Arbeitgeber. Die Unfalldeckung in der Grundversicherung können Sie ausschliessen – ein Häkchen weniger, jeden Monat weniger Prämie.",
      "Endet das Arbeitsverhältnis, die Deckung wieder einschliessen."
    ],
    hashtags: ["unfall"]
  },
  "praemienverbilligung": {
    aufhaenger: "Prämienverbilligung: der Beitrag, den viele nicht abholen.",
    absaetze: [
      "Der Anspruch hängt vom steuerbaren Einkommen ab und ist in jedem Kanton anders geregelt.",
      "In vielen Kantonen müssen Sie den Antrag selbst stellen. Wer nichts tut, bekommt nichts."
    ],
    hashtags: ["verbilligung"]
  },
  "zusatz-reihenfolge": {
    aufhaenger: "Zusatzversicherung wechseln? Die Reihenfolge entscheidet.",
    absaetze: [
      "Erst die schriftliche Zusage der neuen Kasse, dann die Kündigung der alten. Nie umgekehrt.",
      "Eine Zusatzversicherung darf Sie ablehnen. Die Grundversicherung nicht."
    ],
    hashtags: ["zusatz"]
  },
  "sparglas": {
    aufhaenger: "Hundert Franken im Monat weniger sind zwölfhundert im Jahr. Für dieselbe Leistung.",
    absaetze: [
      "Einmal im Jahr vergleichen – im Oktober oder November, wenn die neuen Prämien bekannt sind. Das Geld bleibt bei Ihnen."
    ],
    hashtags: []
  },
  "checkliste-wechsel": {
    aufhaenger: "Krankenkasse wechseln in fünf Schritten – und kein Tag ohne Deckung.",
    absaetze: [
      "Vergleichen. Neue Kasse anfragen. Zusage abwarten. Eingeschrieben kündigen. Beide Bestätigungen prüfen.",
      "Alt bis 31. Dezember, neu ab 1. Januar."
    ],
    hashtags: ["wechsel"]
  },
  "treppe-26": {
    aufhaenger: "Mit 26 steigt die Prämie ein zweites Mal – und bleibt dann oben.",
    absaetze: [
      "Seit 19 nie verglichen? Dann zahlen Sie sehr wahrscheinlich zu viel. Die Rangfolge der Kassen ändert sich jedes Jahr."
    ],
    hashtags: ["alter"]
  },
  "leistungen-gleich": {
    aufhaenger: "Eine teurere Kasse zahlt nicht mehr. Sie kostet nur mehr.",
    absaetze: [
      "Arzt, Spital, Medikamente, Notfall: Was die Grundversicherung zahlt, steht im Gesetz. Bei jeder Kasse gleich.",
      "Unterschiedlich ist nur der Preis."
    ],
    hashtags: []
  },
  "zwei-fenster": {
    aufhaenger: "Zwei Fenster im Jahr für den Kassenwechsel. Das erste kennt kaum jemand.",
    absaetze: [
      "Bis 30. November für den Januar – und bis 31. März für den Juli. Das Juni-Fenster gilt nur mit tiefster Franchise im Standardmodell.",
      "Wer beide verpasst, wartet ein Jahr."
    ],
    hashtags: ["wechsel"]
  }
};

/* ------------------------------------------------------ Mythen-Reihe */
/* Jede Zeile im Bild hoechstens rund 26 Zeichen; die Stimme spricht
   ganze Saetze. */
export const MYTHEN = [
  {
    mythos: ["Wechseln lohnt sich nicht,", "die Prämien steigen überall."],
    mythosStimme: "Wechseln lohnt sich nicht, die Prämien steigen ja überall.",
    wahrheit: ["Gestiegen ja –", "aber nicht gleich stark."],
    wahrheitStimme: "Stimmt nicht. Gestiegen ja, aber nicht überall gleich stark. Die Rangfolge der Kassen verschiebt sich jedes Jahr.",
    detail: ["Seit Jahren nicht verglichen?", "Dann zahlen Sie", "sehr wahrscheinlich zu viel."],
    detailStimme: "Wer seit Jahren nicht verglichen hat, zahlt sehr wahrscheinlich zu viel.",
    aufhaenger: "«Wechseln bringt nichts, die Prämien steigen überall.» Stimmt nicht – und der Grund kostet Sie jedes Jahr Geld.",
    hashtags: ["wechsel"]
  },
  {
    mythos: ["Eine teurere Kasse", "zahlt mehr."],
    mythosStimme: "Eine teurere Kasse zahlt mehr.",
    wahrheit: ["Der Leistungskatalog", "steht im Gesetz.", "Bei jeder Kasse gleich."],
    wahrheitStimme: "Stimmt nicht. Was die Grundversicherung zahlt, steht im Gesetz. Bei jeder Kasse gleich.",
    detail: ["Unterschiedlich ist", "nur der Preis."],
    detailStimme: "Unterschiedlich ist nur der Preis.",
    aufhaenger: "«Eine teurere Kasse zahlt mehr.» Nein. Der Leistungskatalog der Grundversicherung steht im Gesetz.",
    hashtags: []
  },
  {
    mythos: ["Mit einer Krankheit", "nimmt mich keine Kasse."],
    mythosStimme: "Mit einer Krankheit nimmt mich keine Kasse.",
    wahrheit: ["Jede Kasse muss Sie nehmen.", "Ohne Gesundheitsfragen."],
    wahrheitStimme: "Stimmt nicht. In der Grundversicherung muss jede Kasse jeden aufnehmen. Ohne Gesundheitsfragen, ohne Vorbehalt.",
    detail: ["Ablehnen darf nur", "die Zusatzversicherung."],
    detailStimme: "Ablehnen darf nur die Zusatzversicherung.",
    aufhaenger: "«Mit meiner Krankheit nimmt mich keine andere Kasse.» In der Grundversicherung muss jede Kasse Sie nehmen.",
    hashtags: ["wechsel", "zusatz"]
  },
  {
    mythos: ["Der Poststempel", "vom 30. November reicht."],
    mythosStimme: "Der Poststempel vom dreissigsten November reicht.",
    wahrheit: ["Es zählt der Eingang", "bei der Kasse."],
    wahrheitStimme: "Stimmt nicht. Es zählt der Tag, an dem die Kündigung bei der Kasse liegt – nicht der Tag, an dem Sie sie aufgeben.",
    detail: ["Eingeschrieben.", "Ein paar Tage früher."],
    detailStimme: "Eingeschrieben, und ein paar Tage früher. Dann sind Sie sicher.",
    aufhaenger: "«Der Poststempel vom 30. November reicht.» Nein. Es zählt, wann der Brief bei der Kasse liegt.",
    hashtags: ["wechsel"]
  },
  {
    mythos: ["Die Kasse wechseln", "geht nur im November."],
    mythosStimme: "Die Kasse wechseln geht nur im November.",
    wahrheit: ["Auch per 1. Juli –", "Kündigung bis 31. März."],
    wahrheitStimme: "Nicht ganz. Mit der tiefsten Franchise im Standardmodell können Sie auch per ersten Juli wechseln. Kündigung bis einunddreissigsten März.",
    detail: ["Gilt nur mit Franchise 300", "im Standardmodell."],
    detailStimme: "Das gilt nur mit Franchise dreihundert im Standardmodell. Für alle anderen bleibt der November.",
    aufhaenger: "«Wechseln geht nur im November.» Für die meisten ja. Für einige gibt es einen zweiten Termin.",
    hashtags: ["wechsel", "franchise"]
  },
  {
    mythos: ["Die Franchise ändern", "heisst Kasse wechseln."],
    mythosStimme: "Wer die Franchise ändern will, muss die Kasse wechseln.",
    wahrheit: ["Die Franchise ändern Sie", "bei Ihrer Kasse.", "Jedes Jahr."],
    wahrheitStimme: "Stimmt nicht. Die Franchise ändern Sie jedes Jahr bei Ihrer Kasse, auf das neue Jahr. Meldung bis dreissigsten November.",
    detail: ["Und das Modell auch.", "Hausarzt, HMO, Telmed."],
    detailStimme: "Und das Modell gleich mit: Hausarzt, HMO oder Telmed.",
    aufhaenger: "«Um die Franchise zu ändern, muss ich die Kasse wechseln.» Nein. Das geht bei Ihrer Kasse, jedes Jahr.",
    hashtags: ["franchise", "modelle"]
  },
  {
    mythos: ["Grund- und Zusatzversicherung", "gehören zusammen."],
    mythosStimme: "Grund- und Zusatzversicherung müssen bei derselben Kasse sein.",
    wahrheit: ["Nein. Beide lassen", "sich trennen."],
    wahrheitStimme: "Stimmt nicht. Beide lassen sich trennen. Grundversicherung wechseln, Zusatzversicherung behalten – das geht.",
    detail: ["Die Zusatzversicherung", "zu kündigen, ist das Risiko.", "Nicht die Grundversicherung."],
    detailStimme: "Das Risiko liegt bei der Zusatzversicherung: Die darf eine neue Kasse ablehnen. Die Grundversicherung nicht.",
    aufhaenger: "«Grund- und Zusatzversicherung müssen bei derselben Kasse sein.» Müssen sie nicht.",
    hashtags: ["zusatz"]
  },
  {
    mythos: ["Offene Prämien?", "Wechseln geht trotzdem."],
    mythosStimme: "Offene Prämien? Wechseln geht trotzdem.",
    wahrheit: ["Offene Prämien", "blockieren den Wechsel."],
    wahrheitStimme: "Stimmt nicht. Offene Prämien, Franchisen oder Selbstbehalte blockieren den Wechsel. Die alte Kasse lässt Sie nicht gehen.",
    detail: ["Erst bezahlen.", "Dann kündigen."],
    detailStimme: "Erst bezahlen. Dann kündigen.",
    aufhaenger: "«Ich wechsle einfach, die offenen Rechnungen zahle ich später.» So geht es nicht.",
    hashtags: ["wechsel"]
  },
  {
    mythos: ["Kinder sind bei den Eltern", "automatisch mitversichert."],
    mythosStimme: "Kinder sind bei den Eltern automatisch mitversichert.",
    wahrheit: ["Jedes Kind braucht", "eine eigene Grundversicherung."],
    wahrheitStimme: "Stimmt nicht. Jedes Kind braucht eine eigene Grundversicherung – innert drei Monaten nach der Geburt.",
    detail: ["Und darf bei einer anderen", "Kasse sein als die Eltern."],
    detailStimme: "Und es darf bei einer anderen Kasse sein als die Eltern. Nachrechnen lohnt sich.",
    aufhaenger: "«Unser Kind ist bei uns mitversichert.» Nein. Jedes Kind braucht eine eigene Grundversicherung.",
    hashtags: ["familie"]
  },
  {
    mythos: ["Hausarztmodell heisst:", "kein Spezialist mehr."],
    mythosStimme: "Hausarztmodell heisst: kein Spezialist mehr.",
    wahrheit: ["Der Hausarzt überweist.", "Spezialist und Spital", "bleiben gedeckt."],
    wahrheitStimme: "Stimmt nicht. Der Hausarzt überweist Sie. Spezialist und Spital bleiben gedeckt – Sie gehen nur zuerst zu ihm.",
    detail: ["Notfälle sowieso.", "In jedem Modell."],
    detailStimme: "Notfälle sind sowieso gedeckt. In jedem Modell.",
    aufhaenger: "«Im Hausarztmodell komme ich nicht mehr zum Spezialisten.» Doch – über den Hausarzt.",
    hashtags: ["modelle"]
  },
  {
    mythos: ["Prämienverbilligung", "kommt automatisch."],
    mythosStimme: "Prämienverbilligung bekommt man automatisch.",
    wahrheit: ["In vielen Kantonen", "nur auf Antrag."],
    wahrheitStimme: "Nicht überall. In vielen Kantonen gibt es die Prämienverbilligung nur auf Antrag.",
    detail: ["Wer nichts tut,", "bekommt nichts."],
    detailStimme: "Wer nichts tut, bekommt nichts. Fragen Sie bei Ihrem Kanton nach.",
    aufhaenger: "«Wenn mir Prämienverbilligung zusteht, bekomme ich sie automatisch.» In vielen Kantonen nicht.",
    hashtags: ["verbilligung"]
  },
  {
    mythos: ["Neu in der Schweiz?", "Zeit lassen mit der Kasse."],
    mythosStimme: "Neu in der Schweiz? Mit der Krankenkasse kann man sich Zeit lassen.",
    wahrheit: ["Drei Monate.", "Dann weist der Kanton zu –", "mit Zuschlag."],
    wahrheitStimme: "Stimmt nicht. Sie haben drei Monate. Danach weist der Kanton Ihnen eine Kasse zu – und ein Prämienzuschlag ist möglich.",
    detail: ["Rechtzeitig angemeldet:", "Deckung ab Tag eins."],
    detailStimme: "Rechtzeitig angemeldet, gilt die Deckung rückwirkend ab dem ersten Tag.",
    aufhaenger: "«Neu in der Schweiz – mit der Krankenkasse hat es Zeit.» Hat es nicht: drei Monate, dann wird zugewiesen.",
    hashtags: ["en"]
  }
];
