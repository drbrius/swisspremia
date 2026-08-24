# Projektstand SwissPremia – Übergabe

Stand: 20. August 2026. Dieses Dokument fasst zusammen, was gebaut wurde, warum es so
gebaut wurde und was offen ist. Gedacht als Einstieg für eine neue Arbeitssitzung.

> **Keine Zugangsdaten in dieser Datei.** Das Repository ist öffentlich. Schlüssel und
> Passwörter gehören ausschliesslich ins Apps Script beziehungsweise in den jeweiligen Dienst.

---

## 1. Was das Geschäft ist

**SwissPremia ist eine Vergleichsplattform, kein Versicherungsvermittler.**

Besucher vergleichen Krankenkassenprämien mit den offiziellen BAG-Daten und fordern eine
Beratung an. Die Anfrage wird gegen Entgelt an einen **lizenzierten Versicherungsvermittler**
weitergegeben, der berät und abschliesst. SwissPremia berät selbst nicht und erhält keine
Abschlussentschädigung von Versicherern.

Das ist wichtig, weil die Website ursprünglich als Vermittler-Site gebaut war und an
21 Stellen etwas anderes behauptete. Alle Texte sind inzwischen korrigiert.
**Diese Unterscheidung nicht wieder verwischen** – sie bestimmt Impressum, Datenschutz und
jeden Einwilligungstext.

| | |
|---|---|
| Betreiber | SwissPremia, Inh. Ramseier, Feldmoosstrasse 1, 8853 Lachen |
| Handelsregister | kein Eintrag |
| Kontakt | info@swisspremia.ch |

---

## 2. Rechtlicher Rahmen

**Telefonische Kaltakquise ist in der Schweiz seit dem 1.9.2024 verboten** (Branchen-
vereinbarung BVV 3.0, vom Bundesrat am 14.8.2024 allgemeinverbindlich erklärt). Als
Kaltakquise gilt der Kontakt zu Personen, die beim betreffenden Versicherer nie oder seit
über 36 Monaten nicht mehr versichert waren.

Die gesamte Akquise ist deshalb auf **Inbound** ausgelegt: Es wird nur kontaktiert, wer
über ein Formular ausdrücklich darum gebeten hat. Die Einwilligung nennt die Weitergabe
an den Vermittler ausdrücklich – ohne das wäre sie als Rechtsgrundlage wertlos.

**Noch anwaltlich zu prüfen:** ob der Vertrag mit den abnehmenden Vermittlern regelt, dass
diese nach der Übergabe zur eigenen verantwortlichen Stelle werden. Die Datenschutz-
erklärung sagt das; der Vertrag sollte es auch sagen.

---

## 3. Was live ist

**https://www.swisspremia.ch** – Vercel deployt automatisch aus GitHub, ein Push ist nach
rund 15 Sekunden online.

| Baustein | Stand |
|---|---|
| Domain, SSL (Let's Encrypt) | läuft, Apex leitet mit 308 auf www |
| Prämienrechner, BAG-Daten 2026, alle 34 Versicherer | läuft |
| Vier Kampagnen-Landingpages | läuft |
| Formular → Lead-Mail + Kundenbestätigung | läuft |
| Google Sheet als Lead-Übersicht | läuft |
| Nachfass-Erinnerung nach 30 Minuten | läuft |
| Google Search Console, Sitemap eingereicht | 5 Seiten erkannt |
| Impressum, Datenschutzerklärung | vollständig |
| Markendateien für Social Media | im Ordner `marke/` |

---

## 4. Technischer Aufbau

Statische Website, kein Build-Schritt, kein Backend.

```
Besucher füllt Formular aus
        │
        ▼  fetch, mode no-cors
Google Apps Script (im Google-Konto des Betreibers)
        │
        ├──► Lead-Mail an info@swisspremia.ch
        ├──► Bestätigung an den Interessenten, mit seinen Angaben
        └──► Zeile im Google Sheet
                 │
                 └──► Versand läuft über Brevo (Absender info@swisspremia.ch)
```

### Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Startseite: Rechner, Zielgruppen, FAQ, Beratungsformular |
| `lp/neu-in-der-schweiz.html` | **Hauptlandingpage**, zweisprachig DE/EN |
| `lp/baby.html`, `lp/junge-erwachsene.html`, `lp/praemien-2027.html` | weitere Zielgruppen |
| `lp/danke.html` | Danke-Seite, `noindex` |
| `js/lead-core.js` | **Zentrale Konfiguration**, Quellen-Tracking, Versand, Auto-Antwort |
| `js/lp.js` | Sprachumschaltung, Formularlogik der Landingpages |
| `js/app.js` | Prämienrechner |
| `tools/lead-webhook.gs` | Apps Script: Mails, Sheet, Erinnerung, Brevo |
| `tools/build_data.js` | erzeugt `data/` aus den BAG-Excel-Dateien |
| `AKQUISE.md` | Akquiseplan, Telefon-Script, Compliance |
| `SOCIAL.md` | Profiltexte, 12 fertige Beiträge, Kampagnen-Setup |

### Konten und Dienste

| Dienst | Wofür | Zugang |
|---|---|---|
| GitHub `drbrius/swisspremia` | Quellcode, öffentlich | Token in der Windows-Anmeldeinformationsverwaltung |
| Vercel, Projekt `swisspremia` | Hosting, Auto-Deploy | CLI war abgemeldet |
| Swizzonic | Domain und DNS, Postfach | Kundenbereich |
| Google Apps Script + Sheet | Lead-Verarbeitung | Google-Konto drbrius@gmail.com |
| Brevo | E-Mail-Versand, 300/Tag gratis | Konto „Swisspremia" |
| Google Search Console | Domain-Property | verifiziert per TXT |

### DNS bei Swizzonic

```
swisspremia.ch          A      216.150.1.1              (Vercel)
www                     CNAME  f4074d37bb8b0f91.vercel-dns-016.com
swisspremia.ch          MX     mx.swizzonic.email
swisspremia.ch          TXT    v=spf1 a mx include:spf.webapps.net ~all
swisspremia.ch          TXT    brevo-code:...
swisspremia.ch          TXT    google-site-verification=...
brevo1._domainkey       CNAME  b1.swisspremia-ch.dkim.brevo.com
brevo2._domainkey       CNAME  b2.swisspremia-ch.dkim.brevo.com
_dmarc                  TXT    v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
```

---

## 5. Mehrere Marken auf einer Lead-Liste

Ziel sind bis zu 20 Websites, die alle in dieselbe Lead-Liste einzahlen. Jede
Anfrage trägt die Marke, aus der sie stammt.

### Wie eine Marke entsteht

```
node tools/neue-marke.js kassenklar     # eine Marke
node tools/neue-marke.js --alle         # alle aus tools/marken.json
```

Der Generator nimmt die Website im Projektstamm als Vorlage und schreibt
`sites/<id>/` neu. Drei Dinge gehören zu einer Marke:

| Datei | Inhalt |
|---|---|
| `tools/marken.json` | Name, Domain, E-Mail, Farben, Icon-Zeichen |
| `tools/themes/<id>.css` | das Design – **von Hand geschrieben** |
| `abschnitte` in `marken.json` | Reihenfolge der Abschnitte auf der Startseite |
| `sites/<id>/` | Ergebnis, wird bei jedem Lauf überschrieben |

**Nie in `sites/` arbeiten.** Alles dort ist Ergebnis. Änderungen gehören in die
Vorlage im Projektstamm oder in das Theme, danach neu erzeugen.

Der Generator weigert sich, eine Marke ohne eigenes Theme zu bauen. Eine reine
Farbkopie wäre für Google eine Dublette und für Besucher nicht unterscheidbar –
lieber ein Fehler als zwanzig gleich aussehende Seiten.

### Wie die Zuordnung funktioniert

In `js/lead-core.js` stehen zwei Zeilen je Marke:

```js
SITE_ID: "kassenklar",
SITE_NAME: "Kassenklar",
```

`SITE_NAME` reist als Feld `Website` mit jedem Lead an **denselben** Webhook und
landet in der neuen Sheet-Spalte `Website`, direkt hinter `Status`. Ausserdem
steht die Marke im Betreff der Lead-Mail. In der Kundenbestätigung erscheint sie
nicht – der Interessent hat mit den anderen Marken nichts zu tun.

Das Apps Script gleicht fehlende Spalten in einem bestehenden Sheet selbst an
(`spaltenAngleichen`). Ohne das wären beim ersten Lead nach der Umstellung alle
Werte um eine Spalte verrutscht.

### Reihenfolge der Abschnitte

Die Startseite der Vorlage hat sechs Abschnitte mit `id`: `rechner`, `situation`,
`warum`, `ablauf`, `fragen`, `beratung`. Das Feld `abschnitte` in `marken.json`
bestimmt, in welcher Reihenfolge sie erscheinen.

Umsortiert wird **im Dokument**, nicht per CSS-`order`. Wer die Seite mit der
Tastatur bedient oder vorlesen laesst, folgt der Reihenfolge im HTML – eine rein
optische Umsortierung wuerde beides auseinanderlaufen lassen.

Stimmt die Liste nicht mit der Vorlage ueberein, bricht der Generator ab und
nennt den fehlenden Abschnitt. Eine Startseite ohne Formular faellt beim
Durchklicken nicht zwingend auf – deshalb lieber ein Fehler.

### Icons

`tools/icons.js` erzeugt die komplette Favicon-Familie aus den Farbangaben in
`marken.json` – SVG, vier PNG-Grössen, apple-touch-icon und ein ICO mit 16, 32
und 48 Pixeln. Keine Fremdpakete, nur `zlib` aus Node. Das ICO enthält BMP-Daten
statt PNG, siehe den Fallstrick weiter unten.

### Deployment einer Marke

Ein Vercel-Projekt je Marke, **Root Directory** auf `sites/<id>` gesetzt, eigene
Domain darauf. Alle Projekte hängen am selben GitHub-Repository. Ein Push
aktualisiert damit alle Marken gleichzeitig.

### Der Vorbehalt, der bleibt

20 fast identische Vergleichsseiten sind in Googles Spam-Richtlinien als
Doorway-Netzwerk beschrieben. Die übliche Folge ist keine Abstrafung einzelner
Seiten, sondern aller zusammen – swisspremia.ch eingeschlossen. Für bezahlten
Verkehr und Direktzugriffe funktioniert der Aufbau, für organische Suche ist er
ein Risiko.

Wer das Risiko klein halten will, gibt jeder Marke einen eigenen Blickwinkel
statt nur einer eigenen Farbe: eigene Zielgruppe, eigene Texte, eigene Fragen im
Formular. Der Generator erzwingt bereits ein eigenes Theme; eigene Inhalte sind
der nächste Schritt und Handarbeit.

---

## 6. Entscheidungen, die nicht rückgängig gemacht werden sollten

**formsubmit.co ist abgeschaltet.** Der Dienst war am 14.8.2026 über Stunden nicht
erreichbar (HTTP 000), hat dabei Leads verschluckt und den Notfall-Pfad ausgelöst, der
ungefragt das Mailprogramm des Besuchers öffnete. `FORMSUBMIT_AKTIV` steht auf `false`.
Nicht ohne Not reaktivieren.

**Kein ungefragtes Mailprogramm mehr.** Schlägt der Versand fehl, bleibt das Formular
stehen und zeigt eine Meldung mit «Erneut senden» und einem anklickbaren Mail-Link.
Es öffnet sich nichts von selbst.

**Versand über Brevo, nicht über Gmail.** `MailApp.sendEmail()` kennt die Option `from`
nicht und ignoriert sie stillschweigend. Nur `GmailApp` kann den Absender ändern, und auch
nur auf einen in Gmail bestätigten Alias. Der Alias scheiterte am SMTP-Server von Swizzonic
(Authentifizierungsfehler). Deshalb Brevo. Fällt Brevo aus, fällt das Skript automatisch
auf Gmail zurück.

**Telegram wurde entfernt.** Der Betreiber wollte einen reinen E-Mail-Weg.

**Auto-, Hausrat- und Haftpflicht-Rechner wurden entfernt.** Nur Krankenkasse, weil dafür
amtliche Daten existieren. Die früheren Marktspannen-Kalibrierungen sind hinfällig.

**Nur eine Zielgruppe bekommt Werbebudget: Neuzuzüger.** Gesetzlicher Kaufzwang, kein
bestehender Berater, ganzjährig, dünne Konkurrenz auf Englisch. Die anderen drei laufen
organisch. CHF 300 auf vier Kampagnen verteilt kämen nie aus der Lernphase.

**Auf den Landingpages steht die Botschaft vor dem Formular**, auch auf dem Handy. Wer
zuerst ein Formular sieht und nicht weiss wofür, füllt es nicht aus.

**Auf der Neuzuzüger-Seite gibt es keine Fragen zur heutigen Kasse.** Wer neu zuzieht, hat
noch keine – die Felder wären sinnlose Reibung auf der einzigen bezahlten Landingpage.

---

## 7. Gelernte Fallstricke

**Das Apps Script wird durch einen Push nicht aktualisiert.** Es liegt im Google-Konto.
Nach jeder Änderung: Inhalt von `tools/lead-webhook.gs` in den Editor kopieren, dann
*Bereitstellen ▸ Bereitstellungen verwalten ▸ Stift ▸ Neue Version*. Wählt man
«Neue Bereitstellung», ändert sich die URL und `WEBHOOK_URL` muss nachgezogen werden.

**Swizzonic hängt die Domain an den Datensatznamen an.** `@` eintippen ergibt
`@.swisspremia.ch` und funktioniert nicht. Stattdessen `swisspremia.ch` schreiben.

**Es darf nur einen SPF-Eintrag geben.** Zwei nebeneinander machen beide ungültig – dann
landet auch die normale Swizzonic-Post im Spam.

**Der lokale Testserver `npx serve` verwirft Query-Parameter**, wenn er `/pfad.html` auf
`/pfad` umleitet. Für UTM-Tests die URL ohne `.html` aufrufen.

**Google akzeptiert kein `data:`-URI als Favicon.** Es braucht echte Dateien unter einer
abrufbaren URL. Der Favicon-Crawler ist ein eigener Vorgang und braucht Tage bis Wochen.

**Bilder in E-Mails werden standardmässig blockiert.** Das Kopfband ist deshalb aus
Tabellenzellen gezeichnet, nicht als Bilddatei geladen.

**Prüfen statt glauben.** Mehrfach meldete eine Oberfläche Erfolg, während die Messung von
aussen das Gegenteil zeigte – Brevo meldete «Authentifiziert», bevor die DNS-Einträge
publiziert waren. Autoritativ abfragen: `Resolve-DnsName -Server dns1.swizzonic.ch`.

---

## 8. Offene Punkte

### Dringend

**Brevo-API-Schlüssel austauschen.** Der aktuell im Apps Script hinterlegte Schlüssel wurde
im Chat im Klartext übermittelt und gilt damit als offengelegt. In Brevo neu erzeugen, alten
löschen, in Zeile 85 des Skripts ersetzen, neue Version bereitstellen.

**Meta-Werbekonto.** Der einzige Kanal, der kurzfristig Leads bringt. Die Prüfung dauert
24–48 Stunden und ist der Engpass. Alles Weitere steht in `SOCIAL.md`.

### Vor dem Kampagnenstart

- **Testdaten löschen**: rund zehn Einträge im Google Sheet und im Postfach
- **SPF um Brevo ergänzen** – bestehende Zeile bearbeiten, nicht ergänzen:
  `v=spf1 a mx include:spf.webapps.net include:spf.brevo.com ~all`
- **Prüfen, ob die Kundenbestätigung aktuell ist**: Sie muss sagen «leiten Ihre Anfrage an
  einen lizenzierten Versicherungsvermittler weiter», nicht «melden uns telefonisch»
- **Facebook-Seite** mit mindestens drei Beiträgen füllen, bevor Anzeigen laufen

### Optional

- `BERATER_TELEFON`, `WHATSAPP_NUMMER`, `TERMIN_URL` in `js/lead-core.js` – solange leer,
  bleiben die Schaltflächen auf der Danke-Seite ausgeblendet
- Vorname des Inhabers im Impressum ergänzen (sicherere Form als nur der Nachname)
- Prämiendaten Ende September auf 2027 aktualisieren, siehe README

---

## 9. Was als Nächstes ansteht

Die Technik ist fertig. **Was fehlt, ist Verkehr.**

SEO liefert frühestens in Monaten – für «Krankenkasse vergleichen» stehen comparis.ch und
bonus.ch mit zwanzig Jahren Vorsprung. Gewinnbar sind die Nischen, auf die die
Landingpages ausgerichtet sind, und auch die brauchen Zeit.

Das ursprüngliche Ziel waren fünf Leads bis zum 21. August. Dieser Termin ist verstrichen,
weil das Werbekonto nie eingerichtet wurde. Der Erwartungswert bleibt: **5–14 verwertbare
Leads für CHF 200** über Meta Lead Ads mit Instant Forms.

Der nächste sinnvolle Schritt ist das Werbekonto – nicht ein weiteres Detail an der Website.
