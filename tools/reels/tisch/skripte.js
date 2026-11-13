/* =========================================================================
   Serie «Küchentisch» – Skripte und Regie.

   Zwei Vorlagen des Nutzers (13.11.2026): eine besorgte Trickfigur nachts
   am Küchentisch voller Rechnungen, die Kamera faehrt langsam auf das
   Gesicht – und ein Erklaerfilm mit Vorher/Nachher, Technik-Szene und
   Schritt-Karten. Hier sind beide Ideen eigene Szenen im Code
   (src/Tisch.jsx); nichts stammt aus den Vorlagen.

   Aufbau je Reel wie in real/skripte.js (damit real/stimme.js Ton und
   Sprechzeiten liefert): szenen[].zeilen mit t = Text im Bild (**fett** =
   Akzent) und s = gesprochene Fassung, falls sie abweicht. Dazu je Szene
   "bild": welche Szene src/Tisch.jsx zeichnet und wie.

   Regeln wie im Funnel: keine Kassennamen, keine Beratung, Sie-Form,
   Schweizer Schreibweise, Aussagen mit Quelle im Bildtext.
   ========================================================================= */

export const REELS = [
  {
    id: "belege", titel: "Der Stapel, der Geld wert ist", stufe: "tofu",
    szenen: [
      { bild: { art: "raum", raum: "kueche", licht: "nacht", figur: "anna", pose: "brief", sorge: 1, tisch: "chaos", zoom: [1, 1.22] },
        zeilen: [{ t: "Ein Stapel Arztrechnungen – und **keine eingereicht**?" }] },
      { bild: { art: "raum", raum: "kueche", licht: "nacht", figur: "anna", pose: "brief", sorge: 1, tisch: "chaos", zoom: [1.22, 1.95], aufblick: true },
        zeilen: [{ t: "Unter der Franchise zahlt die Kasse **nichts zurück**.", s: "Unter der Franschise zahlt die Kasse nichts zurück." }, { t: "Einsenden lohnt sich **trotzdem**." }] },
      { bild: { art: "zaehler" },
        zeilen: [{ t: "Nur was die Kasse kennt, **zählt an Ihre Franchise**.", s: "Nur was die Kasse kennt, zählt an Ihre Franschise." }, { t: "Ist sie erreicht, übernimmt die Kasse **90 Prozent**.", s: "Ist sie erreicht, übernimmt die Kasse neunzig Prozent." }] },
      { bild: { art: "raum", raum: "kueche", licht: "warm", figur: "anna", pose: "brief", froh: 1, tisch: "stapel", zoom: [1.35, 1.5], marke: { gross: "5", klein: "Jahre Zeit" } },
        zeilen: [{ t: "Zeit dafür haben Sie **fünf Jahre**." }] }
    ],
    schluss: "Stimme KI-generiert · keine Beratung",
    bildtext: {
      aufhaenger: "Arztrechnungen unter der Franchise einsenden? Ja – sonst zählt die Kasse sie nicht mit.",
      absaetze: [
        "Bekommen Sie die Rechnung selbst (Tiers garant), weiss Ihre Kasse nichts davon, bis Sie sie einreichen. Nur eingereichte Kosten zählen an die Franchise. Ist sie erreicht, übernimmt die Kasse die weiteren Kosten abzüglich 10 Prozent Selbstbehalt – bei Erwachsenen höchstens 700 Franken im Jahr.",
        "Der Anspruch auf Rückerstattung erlischt nach fünf Jahren. Schickt der Arzt oder das Spital die Rechnung direkt an die Kasse (Tiers payant), müssen Sie nichts tun."
      ],
      quelle: "Grundlagen: Art. 64 KVG, Art. 103 KVV (Franchise, Selbstbehalt), Art. 24 ATSG (Frist). Keine Beratung.",
      hashtags: ["franchise"]
    }
  },
  {
    id: "vergleich", titel: "Vom Zettelchaos zum Vergleich", stufe: "mofu",
    szenen: [
      { bild: { art: "raum", raum: "buero", licht: "kalt", figur: "marc", pose: "kopf", sorge: 1, tisch: "zettel", zoom: [1, 1.2] },
        zeilen: [{ t: "Jede Kasse, jedes Modell, sechs Franchisen – **wer blickt da durch?**", s: "Jede Kasse, jedes Modell, sechs Franschisen – wer blickt da durch?" }] },
      { bild: { art: "laptop" },
        zeilen: [{ t: "Es geht auch **einfacher**." }] },
      { bild: { art: "maschine" },
        zeilen: [{ t: "Aus den offiziellen Prämien 2027: die **günstigsten Angebote** für Ihren Wohnort.", s: "Aus den offiziellen Prämien für nächstes Jahr: die günstigsten Angebote für Ihren Wohnort." }] },
      { bild: { art: "schritte", karten: ["Postleitzahl", "Alter", "Franchise", "Modell"] },
        zeilen: [{ t: "**Postleitzahl, Alter, Franchise, Modell** – vier Angaben genügen.", s: "Postleitzahl, Alter, Franschise, Modell – vier Angaben genügen." }, { t: "Kostenlos und **ohne Anmeldung**." }] }
    ],
    schluss: "Stimme KI-generiert · keine Beratung",
    bildtext: {
      aufhaenger: "Krankenkassen vergleichen, ohne den Überblick zu verlieren: vier Angaben, eine Minute.",
      absaetze: [
        "Die Leistungen der Grundversicherung sind gesetzlich festgelegt und bei jeder Kasse gleich. Unterschiedlich ist der Preis – je nach Wohnort, Alter, Franchise und Modell.",
        "SwissPremia zeigt die günstigsten Angebote aus den offiziellen Prämien 2027. Kündigen können Sie auf Ende Jahr; die Kündigung muss bis 30. November bei der Kasse eingetroffen sein."
      ],
      quelle: "Datenquelle: Bundesamt für Gesundheit (BAG), Prämien 2027. Keine Beratung.",
      hashtags: ["wechsel"]
    }
  }
];
