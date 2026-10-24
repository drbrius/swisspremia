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
  }
];
