/* =========================================================================
   Reels – Inhalt

   Jede Szene hat drei Ebenen:
     text      was im Bild steht (Zeilen)
     stimme    was gesprochen wird – ganze Saetze, Zahlen ausgeschrieben,
               damit die Stimme sie richtig liest
     dauer     Mindestdauer in Sekunden; liegt eine Tonspur vor, wird die
               Szene so lang wie der Ton plus Nachhall

   Szenenarten: titel, zahl, zaehler, zwei, balken, schritte, abbinder.
   Hintergruende: petrol, creme, slate.

   Zahlen in "stimme" sind Beispielwerte und vor der Veroeffentlichung
   mit dem Rechner fuer die Zielregion zu belegen.
   ========================================================================= */

export const MARKE = {
  name: "SwissPremia",
  url: "swisspremia.ch",
  petrol: "#005786",
  petrolDunkel: "#00446a",
  gold: "#ccba89",
  goldText: "#7d6839",
  creme: "#f4eee4",
  slate: "#212d39",
  weiss: "#ffffff"
};

export const REELS = [
  {
    id: "zwei-termine",
    titel: "Zwei Termine",
    szenen: [
      { id: "s1", art: "zahl", hintergrund: "creme", zahl: "30.", wort: "November", dauer: 2.4,
        stimme: "Dreissigster November." },
      { id: "s2", art: "titel", hintergrund: "creme", text: ["Bis dann muss Ihre Kündigung", "bei der Kasse **sein** –", "nicht abgeschickt."], dauer: 3.4,
        stimme: "Bis dann muss Ihre Kündigung bei der Krankenkasse eingetroffen sein. Nicht abgeschickt – eingetroffen." },
      { id: "s3", art: "zahl", hintergrund: "petrol", zahl: "30.", wort: "Juni", dauer: 2.4,
        stimme: "Und: Dreissigster Juni." },
      { id: "s4", art: "titel", hintergrund: "petrol", text: ["Den zweiten Termin", "kennt fast niemand."], klein: "Nur mit tiefster Franchise im Standardmodell.", dauer: 3.6,
        stimme: "Den zweiten Termin kennt fast niemand. Er gilt nur mit der tiefsten Franchise im Standardmodell." },
      { id: "s5", art: "titel", hintergrund: "slate", text: ["Zwei Chancen im Jahr.", "Die meisten nutzen keine."], dauer: 3.2,
        stimme: "Zwei Chancen im Jahr. Die meisten nutzen keine davon." },
      { id: "s6", art: "titel", hintergrund: "creme", text: ["Gleiche Leistung.", "Anderer Preis.", "Vergleichen dauert eine Minute."], dauer: 3.4,
        stimme: "Gleiche Leistung, anderer Preis. Vergleichen dauert eine Minute." },
      { id: "s7", art: "abbinder", hintergrund: "petrol", dauer: 2.6,
        stimme: "Swisspremia Punkt C H. Kostenlos, mit den offiziellen Daten des Bundes." }
    ]
  },

  {
    id: "gleiche-leistung",
    titel: "Gleiche Leistung, anderer Preis",
    szenen: [
      { id: "s1", art: "zwei", hintergrund: "slate", links: { praefix: "CHF", bis: 400 }, rechts: { praefix: "CHF", bis: 620 }, dauer: 2.8,
        stimme: "Vierhundert Franken. Sechshundertzwanzig Franken." },
      { id: "s2", art: "titel", hintergrund: "slate", text: ["Pro Monat.", "Für exakt dieselbe", "Grundversicherung."], dauer: 3.2,
        stimme: "Pro Monat. Für exakt dieselbe Grundversicherung." },
      { id: "s3", art: "titel", hintergrund: "petrol", text: ["Was die Kasse zahlt,", "steht im Gesetz.", "Bei jeder gleich."], symbol: "§", dauer: 3.4,
        stimme: "Was die Kasse bezahlt, steht im Gesetz. Bei jeder Kasse gleich." },
      { id: "s4", art: "zaehler", hintergrund: "petrol", praefix: "CHF", von: 0, bis: 2640, oben: "220 × 12 =", unten: "im Jahr", dauer: 3.4,
        stimme: "Zweihundertzwanzig mal zwölf: zweitausendsechshundertvierzig Franken im Jahr." },
      { id: "s5", art: "titel", hintergrund: "slate", text: ["Für nichts.", "Keine Leistung mehr,", "keine weniger."], dauer: 3.0,
        stimme: "Für nichts. Keine Leistung mehr, keine weniger." },
      { id: "s6", art: "titel", hintergrund: "creme", text: ["Ihre Region, Ihre Franchise,", "Ihr Modell –", "in einer Minute verglichen."], dauer: 3.4,
        stimme: "Ihre Region, Ihre Franchise, Ihr Modell. In einer Minute verglichen." },
      { id: "s7", art: "abbinder", hintergrund: "petrol", dauer: 2.6,
        stimme: "Swisspremia Punkt C H." }
    ]
  },

  {
    id: "mit-19",
    titel: "Mit 19 passiert etwas",
    szenen: [
      { id: "s1", art: "zahl", hintergrund: "slate", zahl: "19", wort: "Alles Gute zum Geburtstag", dauer: 2.6,
        stimme: "Alles Gute zum neunzehnten Geburtstag." },
      { id: "s2", art: "titel", hintergrund: "petrol", text: ["Ihre Prämie steigt.", "Automatisch."], dauer: 2.8,
        stimme: "Ihre Krankenkassenprämie steigt. Automatisch." },
      { id: "s3", art: "balken", hintergrund: "petrol", balken: [{ label: "Kinder", hoehe: 0.3 }, { label: "19–25", hoehe: 0.62, gold: true }, { label: "ab 26", hoehe: 1 }], text: ["Drei Altersklassen.", "Zwei Sprünge."], dauer: 4.0,
        stimme: "Drei Altersklassen, zwei Sprünge. Der erste mit neunzehn, der zweite mit sechsundzwanzig." },
      { id: "s4", art: "titel", hintergrund: "slate", text: ["Wer mit 19 wechselt,", "spart im Verhältnis", "am meisten."], dauer: 3.4,
        stimme: "Wer mit neunzehn wechselt, spart im Verhältnis am meisten." },
      { id: "s5", art: "titel", hintergrund: "slate", text: ["Der Familienrabatt", "fällt oft weg.", "Die alte Kasse ist dann", "nicht mehr die günstige."], dauer: 4.2,
        stimme: "Der Familienrabatt fällt beim Übertritt oft weg. Die Kasse der Eltern ist dann nicht mehr die günstige." },
      { id: "s6", art: "titel", hintergrund: "creme", text: ["Erste eigene Krankenkasse?", "Erst vergleichen,", "dann unterschreiben."], dauer: 3.4,
        stimme: "Erste eigene Krankenkasse? Erst vergleichen, dann unterschreiben." },
      { id: "s7", art: "abbinder", hintergrund: "petrol", dauer: 2.6,
        stimme: "Swisspremia Punkt C H." }
    ]
  },

  {
    id: "franchise",
    titel: "Franchise in 10 Sekunden",
    szenen: [
      { id: "s1", art: "zwei", hintergrund: "creme", links: { praefix: "", bis: 300 }, rechts: { praefix: "", bis: 2500 }, oben: "Franchise", dauer: 2.8,
        stimme: "Franchise: dreihundert oder zweitausendfünfhundert?" },
      { id: "s2", art: "titel", hintergrund: "creme", text: ["Hohe Franchise", "= tiefere Prämie."], dauer: 2.6,
        stimme: "Hohe Franchise, tiefere Prämie." },
      { id: "s3", art: "zaehler", hintergrund: "petrol", praefix: "CHF", von: 0, bis: 2200, oben: "Dafür tragen Sie bis zu", unten: "mehr selbst", dauer: 3.2,
        stimme: "Dafür tragen Sie bis zu zweitausendzweihundert Franken mehr selbst." },
      { id: "s4", art: "schritte", hintergrund: "slate", schritte: ["Prämienersparnis im Jahr", "Franchisedifferenz", "Ehrlich schätzen: Was gaben Sie letztes Jahr beim Arzt aus?"], dauer: 5.0,
        stimme: "Eins: Prämienersparnis im Jahr. Zwei: Franchisedifferenz. Drei: Was gaben Sie letztes Jahr beim Arzt aus? Ehrlich geschätzt." },
      { id: "s6", art: "titel", hintergrund: "petrol", text: ["Die Mitte ist oft", "die schlechteste Wahl."], dauer: 2.8,
        stimme: "Die Mitte ist oft die schlechteste Wahl." },
      { id: "s7", art: "titel", hintergrund: "creme", text: ["Die Franchise ändern Sie,", "ohne die Kasse zu wechseln.", "Bis Ende November."], dauer: 3.6,
        stimme: "Die Franchise können Sie ändern, ohne die Kasse zu wechseln. Bis Ende November." },
      { id: "s8", art: "abbinder", hintergrund: "petrol", dauer: 2.6,
        stimme: "Swisspremia Punkt C H." }
    ]
  },

  {
    id: "new-in-switzerland",
    titel: "New in Switzerland",
    sprache: "en",
    szenen: [
      { id: "s1", art: "zahl", hintergrund: "slate", zahl: "90", wort: "days", oben: "Welcome to Switzerland.", dauer: 2.8,
        stimme: "Welcome to Switzerland. Your ninety days start now." },
      { id: "s2", art: "titel", hintergrund: "slate", text: ["You have 3 months", "to get health insurance.", "It's the law."], dauer: 3.4,
        stimme: "You have three months to get health insurance. It's the law." },
      { id: "s3", art: "titel", hintergrund: "petrol", text: ["Sign up in time –", "and you're covered", "from day one."], klein: "Retroactively, from the day you arrived.", dauer: 3.6,
        stimme: "Sign up in time, and you're covered from day one – retroactively, from the day you arrived." },
      { id: "s4", art: "titel", hintergrund: "petrol", text: ["No health check.", "No rejection.", "Every insurer must take you."], dauer: 3.6,
        stimme: "No health check. No rejection. Every insurer must take you." },
      { id: "s5", art: "zwei", hintergrund: "slate", links: { praefix: "CHF", bis: 400 }, rechts: { praefix: "CHF", bis: 620 }, oben: "Same coverage", dauer: 3.0,
        stimme: "Same coverage everywhere. Very different prices." },
      { id: "s6", art: "titel", hintergrund: "creme", text: ["Compare all insurers.", "In English.", "In one minute."], dauer: 3.2,
        stimme: "Compare all insurers. In English. In one minute." },
      { id: "s7", art: "abbinder", hintergrund: "petrol", urlZusatz: "/en", dauer: 2.6,
        stimme: "Swisspremia dot C H." }
    ]
  },

  {
    id: "umzug",
    titel: "Der Umzug",
    szenen: [
      { id: "s1", art: "titel", hintergrund: "slate", text: ["Gleiche Kasse.", "Gleiches Modell."], symbol: "📍", dauer: 2.6,
        stimme: "Gleiche Kasse. Gleiches Modell." },
      { id: "s2", art: "zaehler", hintergrund: "slate", praefix: "CHF", von: 0, bis: 60, oben: "Umgezogen. Prämie:", unten: "weniger im Monat", dauer: 3.0,
        stimme: "Umgezogen. Prämie: sechzig Franken weniger im Monat." },
      { id: "s3", art: "balken", hintergrund: "petrol", balken: [{ label: "Region 1", hoehe: 1 }, { label: "Region 2", hoehe: 0.8 }, { label: "Region 3", hoehe: 0.62, gold: true }], text: ["Bis zu drei Prämienregionen", "pro Kanton."], dauer: 4.0,
        stimme: "Bis zu drei Prämienregionen pro Kanton. Ihre Gemeinde entscheidet." },
      { id: "s4", art: "titel", hintergrund: "petrol", text: ["Umzug der Kasse melden –", "sonst zahlen Sie", "den falschen Betrag."], dauer: 3.4,
        stimme: "Melden Sie den Umzug Ihrer Kasse. Sonst zahlen Sie den falschen Betrag." },
      { id: "s5", art: "titel", hintergrund: "creme", text: ["Neue Adresse?", "Guter Moment zum Vergleichen.", "Frist: 30. November."], dauer: 3.6,
        stimme: "Neue Adresse? Ein guter Moment zum Vergleichen. Frist: dreissigster November." },
      { id: "s6", art: "abbinder", hintergrund: "petrol", dauer: 2.6,
        stimme: "Swisspremia Punkt C H." }
    ]
  },

  /* ============================ Mit Grafik (15) ============================ */

  { id: "countdown-november", titel: "Countdown zum 30. November", szenen: [
    { id: "s1", art: "kalender", hintergrund: "creme", monat: "November", text: ["Eingang zählt.", "Nicht der Poststempel."], dauer: 4.4,
      stimme: "Der dreissigste November. Bis dann muss Ihre Kündigung bei der Kasse eingetroffen sein." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Rechnen Sie zurück:", "Post braucht Tage.", "Eingeschrieben noch mehr."], dauer: 3.4,
      stimme: "Rechnen Sie zurück: Die Post braucht Tage, eingeschrieben noch etwas mehr." },
    { id: "s3", art: "zahl", hintergrund: "slate", zahl: "20.", wort: "November – spätestens aufgeben", dauer: 3.0,
      stimme: "Spätestens am zwanzigsten November aufgeben. Dann sind Sie sicher." },
    { id: "s4", art: "titel", hintergrund: "creme", text: ["Vergleichen dauert", "eine Minute."], dauer: 2.4,
      stimme: "Vergleichen dauert eine Minute." },
    { id: "s5", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "eingeschrieben", titel: "Eingeschrieben", szenen: [
    { id: "s1", art: "brief", hintergrund: "creme", text: ["Eingeschrieben.", "Der einzige Beweis, der zählt."], dauer: 4.2,
      stimme: "Schicken Sie die Kündigung eingeschrieben. Das ist der einzige Beweis, der im Streitfall zählt." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Der Poststempel", "hilft Ihnen nicht."], dauer: 3.0,
      stimme: "Der Poststempel hilft Ihnen nicht. Es zählt der Tag, an dem der Brief bei der Kasse liegt." },
    { id: "s3", art: "checkliste", hintergrund: "slate", punkte: ["Name und Versichertennummer", "«Grundversicherung» ausdrücklich", "Alle Personen nennen", "Datum und Unterschrift"], dauer: 4.6,
      stimme: "Ins Schreiben gehören: Name und Versichertennummer, das Wort Grundversicherung, alle Personen, Datum und Unterschrift." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "selbstbehalt", titel: "Der Selbstbehalt", szenen: [
    { id: "s1", art: "titel", hintergrund: "creme", text: ["Mit der Franchise", "ist es nicht getan."], dauer: 2.6,
      stimme: "Mit der Franchise ist es nicht getan." },
    { id: "s2", art: "selbstbehalt", hintergrund: "petrol", text: ["10 % Selbstbehalt.", "Höchstens 700 im Jahr."], dauer: 4.2,
      stimme: "Über der Franchise zahlen Sie zehn Prozent Selbstbehalt. Höchstens siebenhundert Franken im Jahr." },
    { id: "s3", art: "zaehler", hintergrund: "slate", praefix: "CHF", von: 0, bis: 3200, oben: "Franchise 2'500 + Selbstbehalt", unten: "im schlechtesten Fall", dauer: 3.4,
      stimme: "Bei Franchise zweitausendfünfhundert sind das im schlechtesten Fall dreitausendzweihundert Franken." },
    { id: "s4", art: "titel", hintergrund: "creme", text: ["Das Geld muss da sein,", "wenn die Rechnung kommt."], dauer: 2.8,
      stimme: "Das Geld muss da sein, wenn die Rechnung kommt." },
    { id: "s5", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "drei-modelle", titel: "Drei Modelle", szenen: [
    { id: "s1", art: "modelle", hintergrund: "slate", text: ["Drei Modelle.", "Alle günstiger als Standard."], dauer: 4.2,
      stimme: "Hausarzt, HMO oder Telmed. Alle drei sind günstiger als das Standardmodell." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Sie tauschen freie Arztwahl", "gegen eine tiefere Prämie."], dauer: 3.0,
      stimme: "Sie tauschen ein Stück freie Arztwahl gegen eine tiefere Prämie." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Sie haben ohnehin", "einen Hausarzt?", "Dann kostet Sie das nichts."], dauer: 3.2,
      stimme: "Sie haben ohnehin einen Hausarzt? Dann kostet Sie das Hausarztmodell gar nichts." },
    { id: "s4", art: "titel", hintergrund: "slate", text: ["Notfälle sind", "in jedem Modell gedeckt."], dauer: 2.6,
      stimme: "Notfälle sind in jedem Modell gedeckt." },
    { id: "s5", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "praemienregionen", titel: "Prämienregionen", szenen: [
    { id: "s1", art: "karte", hintergrund: "slate", text: ["Ihre Gemeinde", "bestimmt die Region."], dauer: 4.4,
      stimme: "Ihre Wohngemeinde bestimmt die Prämienregion. Bis zu drei pro Kanton." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Gleiche Kasse, gleiches Modell –", "in Region 1 teurer", "als in Region 3."], dauer: 3.4,
      stimme: "Gleiche Kasse, gleiches Modell – in Region eins teurer als in Region drei." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Die Region können Sie", "nicht wählen.", "Die Kasse schon."], dauer: 3.0,
      stimme: "Die Region können Sie nicht wählen. Die Kasse schon." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "familienrabatt", titel: "Familienrabatt", szenen: [
    { id: "s1", art: "familie", hintergrund: "petrol", etikett: "Rabatt", text: ["Ab dem zweiten Kind", "gibt es oft Rabatt."], dauer: 4.4,
      stimme: "Ab dem zweiten oder dritten Kind gewähren viele Kassen einen Rabatt auf die Kinderprämie." },
    { id: "s2", art: "titel", hintergrund: "slate", text: ["Wie hoch? Ab welchem Kind?", "Legt jede Kasse selbst fest."], dauer: 3.0,
      stimme: "Wie hoch und ab welchem Kind – das legt jede Kasse selbst fest." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Alle bei derselben Kasse?", "Nachrechnen schlägt Annehmen."], dauer: 3.0,
      stimme: "Alle bei derselben Kasse? Nachrechnen schlägt Annehmen." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "neugeborene", titel: "Neugeborene", szenen: [
    { id: "s1", art: "zeitstrahl", hintergrund: "creme", links: "Geburt", rechts: "3 Monate", bogen: "rückwirkend ab Tag 1", text: ["Rechtzeitig angemeldet:", "Deckung ab dem ersten Tag."], dauer: 4.6,
      stimme: "Ihr Kind muss innert drei Monaten versichert sein. Rechtzeitig angemeldet, gilt die Deckung rückwirkend ab dem ersten Tag." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Grundversicherung:", "niemand wird abgelehnt.", "Auch kein Säugling."], dauer: 3.2,
      stimme: "In der Grundversicherung wird niemand abgelehnt. Auch kein Säugling." },
    { id: "s3", art: "titel", hintergrund: "slate", text: ["Zusatzversicherung:", "vor der Geburt abschliessen."], klein: "Danach ist eine Gesundheitsprüfung möglich.", dauer: 3.6,
      stimme: "Die Zusatzversicherung schliessen Sie am besten vor der Geburt ab. Danach ist eine Gesundheitsprüfung möglich." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "unfalldeckung", titel: "Unfalldeckung", szenen: [
    { id: "s1", art: "titel", hintergrund: "slate", text: ["Angestellt,", "mindestens 8 Stunden", "pro Woche?"], dauer: 2.8,
      stimme: "Angestellt, mindestens acht Stunden pro Woche?" },
    { id: "s2", art: "schalter", hintergrund: "petrol", aus: "mit Unfall", an: "ohne Unfall", von: 420, bis: 395, text: ["Unfall läuft über", "den Arbeitgeber."], dauer: 4.6,
      stimme: "Dann sind Sie über den Arbeitgeber unfallversichert und können die Unfalldeckung in der Grundversicherung ausschliessen." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Ein Häkchen weniger.", "Jeden Monat weniger Prämie."], dauer: 3.0,
      stimme: "Ein Häkchen weniger. Jeden Monat weniger Prämie." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "praemienverbilligung", titel: "Prämienverbilligung", szenen: [
    { id: "s1", art: "titel", hintergrund: "creme", text: ["Prämienverbilligung.", "Der Beitrag, den viele", "nicht abholen."], dauer: 3.2,
      stimme: "Prämienverbilligung: der Beitrag, den viele nicht abholen." },
    { id: "s2", art: "tacho", hintergrund: "petrol", anteil: .7, links: "kein Anspruch", rechts: "voller Beitrag", text: ["Der Anspruch hängt", "vom Einkommen ab."], dauer: 4.4,
      stimme: "Der Anspruch hängt vom steuerbaren Einkommen ab – und ist in jedem Kanton anders geregelt." },
    { id: "s3", art: "titel", hintergrund: "slate", text: ["In vielen Kantonen", "müssen Sie den Antrag", "selbst stellen."], dauer: 3.4,
      stimme: "In vielen Kantonen müssen Sie den Antrag selbst stellen. Wer nichts tut, bekommt nichts." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "zusatz-reihenfolge", titel: "Die Reihenfolge bei der Zusatzversicherung", szenen: [
    { id: "s1", art: "titel", hintergrund: "slate", text: ["Zusatzversicherung wechseln?", "Die Reihenfolge entscheidet."], dauer: 3.0,
      stimme: "Zusatzversicherung wechseln? Die Reihenfolge entscheidet." },
    { id: "s2", art: "schloss", hintergrund: "petrol", erst: "Neue Zusage schriftlich", dann: "Alte Zusatzversicherung kündigen", text: ["Erst die Zusage.", "Dann die Kündigung."], dauer: 4.6,
      stimme: "Erst die schriftliche Zusage der neuen Kasse. Dann die Kündigung der alten. Nie umgekehrt." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Eine Zusatzversicherung", "darf Sie ablehnen.", "Die Grundversicherung nicht."], dauer: 3.4,
      stimme: "Eine Zusatzversicherung darf Sie ablehnen. Die Grundversicherung nicht." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "sparglas", titel: "Das Sparglas", szenen: [
    { id: "s1", art: "muenzen", hintergrund: "slate", bis: 1200, text: ["Monat für Monat.", "Jahr für Jahr."], dauer: 4.4,
      stimme: "Hundert Franken im Monat weniger. Das sind zwölfhundert Franken im Jahr." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Gleiche Leistung.", "Das Geld bleibt bei Ihnen."], dauer: 2.8,
      stimme: "Gleiche Leistung. Das Geld bleibt bei Ihnen." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Einmal im Jahr vergleichen.", "Im Oktober oder November."], dauer: 3.4,
      stimme: "Einmal im Jahr vergleichen. Im Oktober oder November, wenn die neuen Prämien bekannt sind." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "checkliste-wechsel", titel: "Checkliste Kassenwechsel", szenen: [
    { id: "s1", art: "titel", hintergrund: "creme", text: ["Krankenkasse wechseln", "in fünf Schritten."], dauer: 2.6,
      stimme: "Krankenkasse wechseln – in fünf Schritten." },
    { id: "s2", art: "checkliste", hintergrund: "slate", punkte: ["Vergleichen", "Neue Kasse anfragen", "Zusage abwarten", "Eingeschrieben kündigen", "Bestätigungen prüfen"], dauer: 5.2,
      stimme: "Vergleichen. Neue Kasse anfragen. Zusage abwarten. Eingeschrieben kündigen. Beide Bestätigungen prüfen." },
    { id: "s3", art: "titel", hintergrund: "petrol", text: ["Kein Tag ohne Deckung.", "Alt bis 31. Dezember,", "neu ab 1. Januar."], dauer: 3.4,
      stimme: "Kein Tag ohne Deckung: alt bis einunddreissigsten Dezember, neu ab erstem Januar." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "treppe-26", titel: "Die zweite Stufe", szenen: [
    { id: "s1", art: "treppe", hintergrund: "petrol", stufen: ["Kinder", "19–25", "ab 26"], text: ["Zwei Stufen.", "Die zweite mit 26."], dauer: 4.6,
      stimme: "Die Prämie steigt in zwei Stufen. Die zweite mit sechsundzwanzig – und dann bleibt sie oben." },
    { id: "s2", art: "titel", hintergrund: "slate", text: ["Seit 19 nie verglichen?", "Dann zahlen Sie", "sehr wahrscheinlich zu viel."], dauer: 3.4,
      stimme: "Seit neunzehn nie verglichen? Dann zahlen Sie sehr wahrscheinlich zu viel." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Die Rangfolge der Kassen", "ändert sich jedes Jahr."], dauer: 2.8,
      stimme: "Die Rangfolge der Kassen ändert sich jedes Jahr." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "leistungen-gleich", titel: "Alles im Gesetz", szenen: [
    { id: "s1", art: "raster", hintergrund: "creme", text: ["Alles im Gesetz geregelt.", "Bei jeder Kasse gleich."], dauer: 4.6,
      stimme: "Arzt, Spital, Medikamente, Notfall: Was die Grundversicherung zahlt, steht im Gesetz. Bei jeder Kasse gleich." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Eine teurere Kasse", "zahlt nicht mehr.", "Sie kostet nur mehr."], dauer: 3.2,
      stimme: "Eine teurere Kasse zahlt nicht mehr. Sie kostet nur mehr." },
    { id: "s3", art: "titel", hintergrund: "slate", text: ["Unterschiedlich ist", "nur der Preis."], dauer: 2.4,
      stimme: "Unterschiedlich ist nur der Preis." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]},

  { id: "zwei-fenster", titel: "Zwei Fenster im Jahr", szenen: [
    { id: "s1", art: "jahresring", hintergrund: "slate", fenster: [[2, 6], [10, 12]], erst: "bis 31. März", zweit: "bis 30. November", text: ["Zwei Fenster im Jahr.", "Das erste kennt kaum jemand."], dauer: 5.0,
      stimme: "Zwei Fenster im Jahr: bis dreissigsten November für den Januar – und bis einunddreissigsten März für den Juli." },
    { id: "s2", art: "titel", hintergrund: "petrol", text: ["Das Juni-Fenster gilt nur", "mit tiefster Franchise", "im Standardmodell."], dauer: 3.4,
      stimme: "Das Juni-Fenster gilt nur mit der tiefsten Franchise im Standardmodell." },
    { id: "s3", art: "titel", hintergrund: "creme", text: ["Wer beide verpasst,", "wartet ein Jahr."], dauer: 2.6,
      stimme: "Wer beide verpasst, wartet ein Jahr." },
    { id: "s4", art: "abbinder", hintergrund: "petrol", dauer: 2.6, stimme: "Swisspremia Punkt C H." }
  ]}

];
