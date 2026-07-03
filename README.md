# PrämienCheck Schweiz – Leadgenerator für Versicherungsprämien

Eine einfache Vergleichsplattform **ohne Anmeldung**: Besucher berechnen ihre Prämie,
senden eine Anfrage – und ein Berater meldet sich bei ihnen.

## Was die Plattform kann

| Bereich | Datenbasis |
|---|---|
| **Krankenkasse (Grundversicherung 2026)** | Offizielle Prämiendaten des BAG ([priminfo.admin.ch](https://www.priminfo.admin.ch)) – alle 34 Versicherer, alle Prämienregionen, nach PLZ, Altersgruppe, Franchise, Unfalldeckung und Modell |
| **Autoversicherung** | Marktspannen-Rechner, kalibriert an publizierten Vergleichsdaten von [moneyland.ch](https://www.moneyland.ch/de/kosten-autoversicherung-schweiz) 2026 (Referenzprofil 30 J./ZH/VW Golf/5 schadenfreie Jahre: Haftpflicht CHF 350–750, +Teilkasko 150–400, +Vollkasko 600–1'500/Jahr), angepasst nach Kanton, Alter, Fahrzeugwert, Bonus |
| **Hausrat & Privathaftpflicht** | Marktspannen-Rechner, kalibriert an der [SRF-Kassensturz-Erhebung März 2024](https://www.srf.ch/sendungen/kassensturz-espresso/tests/finanzen-versicherungen/hausrat-und-haftpflicht-enorme-preisunterschiede-bei-haushaltsversicherungen) (Single 72'000: CHF 192–350; Paar Eigenheim 220'000: CHF 370–700+, je inkl. Privathaftpflicht 5 Mio.) |

**Wichtig:** Für Auto/Hausrat/Haftpflicht gibt es – anders als bei der Krankenkassen-Grundversicherung –
**keine amtliche Prämiendatenbank**. Jede Gesellschaft rechnet individuell. Die Rechner zeigen deshalb
transparente **Marktspannen (günstigster–teuerster Anbieter)** aus publizierten Erhebungen, mit Quelle
direkt im Resultat. Genau das ist das Verkaufsargument für die Beratung: Der Berater holt die
verbindlichen Offerten ein.
| **Lead-Formular** | Kontaktdaten + Interessen + letzte Berechnung → per E-Mail an Sie |

## Website öffnen

Einfach die Datei `index.html` doppelklicken – die Seite läuft komplett im Browser,
es braucht keinen Server und keine Datenbank.

## Leads empfangen (wichtig – einmalige Aktivierung!)

Das Formular sendet Leads über den Gratis-Dienst [formsubmit.co](https://formsubmit.co)
an **drbrius@gmail.com**.

1. Beim **allerersten** abgeschickten Formular sendet formsubmit.co eine
   **Aktivierungs-E-Mail** an drbrius@gmail.com.
2. Einmal auf **«Activate Form»** klicken – ab dann landet jeder Lead direkt in Ihrem Posteingang
   (übersichtlich als Tabelle, inkl. Berechnung des Kunden).
3. Kein Konto, keine Kosten nötig.

**E-Mail-Adresse ändern:** In der Datei `js/app.js` ganz oben die Zeile
`var LEAD_EMAIL = "drbrius@gmail.com";` anpassen.

**Sicherheitsnetz:** Jeder Lead wird zusätzlich im Browser des Besuchers gespeichert
(localStorage, Schlüssel `leads`). Schlägt der Versand fehl, öffnet sich automatisch
das E-Mail-Programm des Besuchers mit vorausgefüllter Nachricht.

## Online stellen (optional)

Die Seite ist statisch und kann gratis gehostet werden, z. B.:

- **Netlify:** [app.netlify.com/drop](https://app.netlify.com/drop) → Ordner per Drag & Drop hochladen → fertig.
- **GitHub Pages** oder jeder beliebige Webspace (alle Dateien hochladen).

## Prämiendaten aktualisieren (jährlich im Herbst)

Die Krankenkassen-Prämien liegen in `data/praemien.js` und `data/plz.js`
(generiert aus den BAG-Dateien `gesamtbericht_ch.xlsx` und `praemienregionen.xlsx`
von [priminfo.admin.ch/de/downloads/aktuell](https://www.priminfo.admin.ch/de/downloads/aktuell)).
Sobald das BAG die neuen Prämien publiziert (jeweils Ende September):

1. Von [priminfo.admin.ch/de/downloads/aktuell](https://www.priminfo.admin.ch/de/downloads/aktuell) herunterladen:
   `gesamtbericht_ch.xlsx`, `praemienregionen.xlsx` und die Versichererliste
   (`zugelassene-krankenversicherer-….xlsx`, als `versicherer.xlsx` speichern).
2. Die drei Dateien in den Ordner `tools/` legen.
3. Im Ordner `tools/` ausführen: `npm install xlsx` und dann `node build_data.js`
   (im Skript ggf. das Jahr `2026` anpassen) – die Dateien in `data/` werden neu erzeugt.

Oder einfach Claude fragen: *«Aktualisiere die Prämiendaten von priminfo.admin.ch»*.

## Rechtlicher Hinweis

- Krankenkassen-Prämien: offizielle BAG-Daten, Angaben ohne Gewähr.
- Auto-/Hausratprämien sind **Richtwerte**, keine Offerten.
- Das Formular enthält eine Einwilligung zur Kontaktaufnahme (DSG-konform formuliert);
  für den produktiven Betrieb empfiehlt sich eine eigene Datenschutzerklärung mit
  Impressum (Name/Adresse des Betreibers).
