/* =========================================================================
   Serie «Plakat» – Regie je Reel.

   Skript, Stimme und Zeiten kommen aus real/skripte.js, public/real/ton
   und real/zeiten (wie bei der Serie «Durchblick»); hier steht je Szene,
   welches Plakat sie zeigt:

     ort      seestadt | bergdorf | bahnhof | praxis | quartier | gipfel
     palette  nacht | daemmerung | abend | morgen | tag    (Tageszeit)
     format   quer | quadrat | hoch                        (Form der Karte)
     klein    kleines Wort ueber dem Titel (kursiv)
     gross    Konturtitel in Versalien, ein bis zwei Woerter

   Szenen mit einer Zahl im Skript zeigen als Titel den Betrag (er zaehlt
   hoch); «gross» entfaellt dort. Lange Bildtexte brauchen Platz unter der
   Karte – plakat/bauen.js weicht dann von «hoch» auf «quadrat» aus.
   ========================================================================= */
const T = (ort, palette, format, klein, gross) => ({ ort, palette, format, klein, gross });

export const REGIE = {
  baby: [
    T("quartier", "morgen", "quadrat", "schon vor der", "GEBURT"),
    T("bergdorf", "tag", "quer", "danach bleiben", "3 MONATE"),
    T("seestadt", "abend", "hoch", "freie", "WAHL"),
    T("praxis", "daemmerung", "quadrat", "es lohnt sich", "VERGLEICHEN")
  ],
  unfall: [
    T("bahnhof", "morgen", "quer", "Unfall", "DOPPELT?"),
    T("praxis", "tag", "quadrat", "ab", "8 STUNDEN"),
    T("quartier", "abend", "hoch", "Unfalldeckung", "STREICHEN"),
    T("seestadt", "nacht", "quer", "in Zürich rund")
  ],
  franchise: [
    T("bergdorf", "morgen", "quadrat", "selten", "KRANK?"),
    T("seestadt", "tag", "quer", "im Jahr bis zu"),
    T("praxis", "abend", "quadrat", "der", "HAKEN"),
    T("quartier", "daemmerung", "hoch", "nur mit", "RESERVE")
  ],
  hausarzt: [
    T("praxis", "morgen", "quadrat", "immer zuerst zum", "HAUSARZT?"),
    T("bergdorf", "tag", "quer", "weniger", "PRÄMIE"),
    T("seestadt", "abend", "quer", "in Zürich rund"),
    T("quartier", "nacht", "hoch", "immer", "GEDECKT")
  ],
  neu: [
    T("bahnhof", "morgen", "quer", "neu in der", "SCHWEIZ?"),
    T("seestadt", "tag", "quadrat", "Sie haben", "3 MONATE"),
    T("quartier", "abend", "quer", "sonst droht ein", "ZUSCHLAG"),
    T("bergdorf", "daemmerung", "hoch", "jede Kasse", "NIMMT SIE")
  ],
  verbilligung: [
    T("quartier", "morgen", "quadrat", "Geld vom", "KANTON"),
    T("bergdorf", "tag", "quer", "nicht", "AUTOMATISCH"),
    T("seestadt", "abend", "quadrat", "nur auf", "ANTRAG"),
    T("praxis", "daemmerung", "hoch", "Fragen kostet", "NICHTS")
  ],
  treue: [
    T("bergdorf", "nacht", "quadrat", "treu seit", "20 JAHREN"),
    T("quartier", "daemmerung", "quer", "dafür gibt es keinen", "RABATT"),
    T("seestadt", "abend", "hoch", "damals", "GÜNSTIG"),
    T("bahnhof", "tag", "quer", "wechseln in jedem", "ALTER")
  ],
  zusatz: [
    T("quartier", "nacht", "quer", "ein teurer", "FEHLER"),
    T("praxis", "daemmerung", "quadrat", "die Zusatz darf", "ABLEHNEN"),
    T("bahnhof", "abend", "quer", "erst die", "ZUSAGE"),
    T("seestadt", "tag", "quadrat", "erlaubt sind", "2 KASSEN")
  ],
  schritte: [
    T("gipfel", "tag", "quadrat", "ganz", "EINFACH"),
    T("seestadt", "abend", "quer", "eins und zwei", "ANMELDEN"),
    T("quartier", "daemmerung", "quadrat", "kündigen bis", "30. NOV."),
    T("bergdorf", "nacht", "hoch", "keine", "LÜCKE")
  ],
  offen: [
    T("bahnhof", "nacht", "quer", "der Wechsel ist", "BLOCKIERT"),
    T("quartier", "daemmerung", "quadrat", "zuerst", "BEZAHLEN"),
    T("praxis", "abend", "quer", "ist alles", "BEGLICHEN?"),
    T("seestadt", "tag", "hoch", "freie", "BAHN")
  ]
};

/* Abbinder: der Sonnenaufgang am Gipfel. */
export const ABBINDER = { ort: "gipfel", palette: "morgen", format: "quer", klein: "alle Kassen in", gross: "1 MINUTE" };
