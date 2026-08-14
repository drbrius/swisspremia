# SwissPremia – Krankenkassen-Vergleich & Leadgenerator

Statische Website ohne Backend und ohne Build-Schritt: Besucher vergleichen ihre
Krankenkassenprämie, fordern eine Beratung an – und der Lead landet sofort bei Ihnen.

**Der Akquiseplan zu dieser Website steht in [AKQUISE.md](AKQUISE.md).**

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Startseite mit Prämienrechner (Grundversicherung 2026) und Beratungsformular |
| `lp/neu-in-der-schweiz.html` | Landingpage Neuzuzüger / Expats – **zweisprachig DE/EN**, Ziel der bezahlten Kampagne |
| `lp/baby.html` | Landingpage Familien und Neugeborene |
| `lp/junge-erwachsene.html` | Landingpage 19–25 Jahre (Altersgruppen-Sprung) |
| `lp/praemien-2027.html` | Warteliste für die Prämienpublikation Ende September |
| `lp/danke.html` | Danke-Seite mit Terminlink, WhatsApp und Direktanruf |
| `js/lead-core.js` | **Zentrale Konfiguration**, Quellen-Tracking, Versand, Auto-Antwort |
| `js/lp.js` | Sprachumschaltung und Formularlogik der Landingpages |
| `js/app.js` | Prämienrechner der Startseite |
| `tools/lead-webhook.gs` | Google Apps Script: Lead-Mail an Sie, Bestätigung an den Kunden, Sheet-Übersicht |
| `tools/build_data.js` | Erzeugt `data/praemien.js` und `data/plz.js` aus den BAG-Dateien |

## Design

Ruhige, seriöse Broker-Ästhetik: Petrolblau als Leitfarbe, Gold als sparsamer Akzent,
viel Weissraum, grosse Headlines in leichtem Schnitt, Pill-Buttons und weiche Radien.

| Element | Wert |
|---|---|
| Leitfarbe | `--petrol` `#005786` |
| Dunkelton | `--slate-tief` `#212d39` |
| Akzent | `--gold` `#ccba89` (kleine Schrift auf hellem Grund: `--gold-text` `#7d6839`) |
| Flächenton | `--creme` `#f4eee4` |
| Radien | `10px` / `20px` |
| Schrift | Figtree (Google Fonts), Fallback Segoe UI / system-ui |

Alle Farben liegen als CSS-Variablen im `:root`-Block von `css/style.css` – dort einmal
ändern genügt für die ganze Site.

**Bilder:** Hero-Hintergründe und Bildbänder kommen von [Unsplash](https://unsplash.com/license)
(kostenlos, auch kommerziell nutzbar, Namensnennung nicht erforderlich) und werden direkt
über die Unsplash-CDN im passenden Zuschnitt geladen – es liegt also nichts im Repo.
Die Hero-Bilder stehen gesammelt am Ende von `css/style.css` in den Klassen `.hero--start`,
`.lp-hero--neuzuzueger`, `.lp-hero--familie`, `.lp-hero--jung`, `.lp-hero--praemien`.
Zum Austauschen dort die Foto-ID (`photo-…`) ersetzen; für ein eigenes Bild
`url("../img/eigenes.jpg")` eintragen.

## Datenbasis

Krankenkassen-Grundversicherung 2026: offizielle Prämiendaten des Bundesamts für Gesundheit
([priminfo.admin.ch](https://www.priminfo.admin.ch)) – alle zugelassenen Versicherer, alle
Prämienregionen, nach PLZ, Altersgruppe, Franchise, Unfalldeckung und Modell.

Der Leistungskatalog der Grundversicherung ist gesetzlich festgelegt und bei jeder Kasse
identisch – der Preis ist der einzige echte Unterschied. Genau das ist das Verkaufsargument.

## Einrichtung (einmalig)

### So läuft eine Anfrage

```
Besucher füllt das Formular aus
        │
        ▼
Google Apps Script (tools/lead-webhook.gs)
        │
        ├──► Lead-Mail an info@swisspremia.ch
        ├──► Bestätigung an den Interessenten, mit seinen Angaben
        └──► Zeile im Google Sheet (Status, Kontaktversuche, Wiedervorlage)
```

Kein Fremddienst dazwischen. Das Skript läuft unter Ihrem Google-Konto und ist gratis.

### 1. Postfach anlegen

`info@swisspremia.ch` muss als Postfach existieren – dorthin gehen alle Lead-Mails.

### 2. Apps Script veröffentlichen (Pflicht)

Die vollständige Anleitung steht als Kommentar am Anfang von `tools/lead-webhook.gs`
(ca. 10 Minuten). Kurzfassung: Google Sheet anlegen → *Erweiterungen ▸ Apps Script* →
Code einfügen → *Bereitstellen ▸ Web-App* (Zugriff: Jeder) → Funktion `einrichten()`
einmal ausführen → mit `testLead()` einen Probelauf machen.

Damit die Bestätigung von `info@swisspremia.ch` kommt und nicht von Ihrer Gmail-Adresse,
die Adresse in Gmail unter *Einstellungen ▸ Konten ▸ Senden als* freischalten.

### 3. Zentrale Konfiguration

Alles Wichtige steht oben in `js/lead-core.js` im Block `CONFIG`:

```js
LEAD_EMAIL:       "info@swisspremia.ch"  // Empfänger der Lead-Anfrage
WEBHOOK_URL:      ""                     // >>> Apps-Script-URL (…/exec) eintragen <<<
FORMSUBMIT_AKTIV: false                  // Reserve-Kanal, standardmässig aus
BERATER_NAME:     "…"                    // Absender der Bestätigung
BERATER_TELEFON:  ""                     // erscheint auf der Danke-Seite
WHATSAPP_NUMMER:  ""                     // z. B. "41791234567"
TERMIN_URL:       ""                     // Calendly / Cal.com für Selbstbuchung
```

**Solange `WEBHOOK_URL` leer ist, kann keine Anfrage zugestellt werden.** Die Seite
schreibt in diesem Fall beim Laden eine Fehlermeldung in die Browser-Konsole.

Leere Felder werden auf der Danke-Seite automatisch ausgeblendet.

### 4. Sicherungsnetze

Jeder Lead wird zusätzlich im Browser des Besuchers gespeichert (localStorage,
Schlüssel `leads`). Schlägt der Versand fehl, bleibt das Formular stehen und der
Besucher sieht eine verständliche Meldung mit «Erneut senden» sowie einem
anklickbaren E-Mail-Link – es öffnet sich **nichts** von selbst.

> **Warum nicht formsubmit.co?** Der Dienst war die ursprüngliche Lösung, fiel am
> 14.08.2026 über Stunden komplett aus (keine Verbindung, HTTP 000) und verschluckte
> dabei Anfragen. Er ist deshalb standardmässig abgeschaltet.

## Kampagnen-Links

Hängen Sie an jede Landingpage UTM-Parameter an – die Quelle wird erfasst und steht
in jeder Lead-Benachrichtigung:

```
https://swisspremia.ch/lp/neu-in-der-schweiz.html?utm_source=meta&utm_medium=paid&utm_campaign=neuzuzueger&utm_content=anzeige-a
```

Sprache der zweisprachigen Seite erzwingen: `&lang=en` bzw. `&lang=de`.
Ohne Parameter entscheidet die Browsersprache.

## Online stellen

Deployen:

- **Vercel:** `npx vercel deploy --prod --yes` im Projektordner
- **GitHub Pages:** `git push` (`.nojekyll` nötig)

**Domain swisspremia.ch aufschalten** (einmalig, nach der Registrierung):

1. Domain bei einem Schweizer Registrar bestellen (z. B. Hostpoint, Infomaniak, Metanet).
2. Im Vercel-Projekt unter *Settings ▸ Domains* `swisspremia.ch` und `www.swisspremia.ch` eintragen.
3. Beim Registrar die von Vercel angezeigten DNS-Einträge setzen (A-Record für die
   Hauptdomain, CNAME für `www`). Bis zur weltweiten Verbreitung können einige
   Stunden vergehen.
4. Erst danach die Kampagnen-Links auf `swisspremia.ch` umstellen – vorher laufen
   Anzeigen ins Leere.

Solange die Domain nicht aufgeschaltet ist, funktioniert die bestehende Vercel-Adresse
weiter. Beide Deploys (Vercel und GitHub Pages) sind unabhängig – nach Änderungen
beide aktualisieren oder eines stilllegen.

## Prämiendaten aktualisieren (jährlich, Ende September)

Sobald das BAG die neuen Prämien publiziert:

1. Von [priminfo.admin.ch/de/downloads/aktuell](https://www.priminfo.admin.ch/de/downloads/aktuell)
   herunterladen: `gesamtbericht_ch.xlsx`, `praemienregionen.xlsx` und die Versichererliste
   (`zugelassene-krankenversicherer-….xlsx`, als `versicherer.xlsx` speichern).
2. Die drei Dateien in den Ordner `tools/` legen.
3. Im Ordner `tools/` ausführen: `npm install xlsx`, dann `node build_data.js`
   (im Skript ggf. das Jahr anpassen) – die Dateien in `data/` werden neu erzeugt.

Oder einfach Claude fragen: *«Aktualisiere die Prämiendaten von priminfo.admin.ch»*.

## Rechtliches

- Prämien: offizielle BAG-Daten, Angaben ohne Gewähr.
- Die Formulare enthalten eine DSG-konform formulierte Einwilligung zur Kontaktaufnahme.
  Für den produktiven Betrieb brauchen Sie zusätzlich eine eigene Datenschutzerklärung
  mit Impressum – **Meta verlangt den Link zur Datenschutzerklärung für Lead Ads zwingend.**
- Telefonische Kaltakquise ist in der Schweiz seit dem 1. September 2024 verboten.
  Kontaktiert werden ausschliesslich Personen, die über ein Formular ausdrücklich
  darum gebeten haben. Details in [AKQUISE.md](AKQUISE.md), Abschnitt 2.
