# Reel-Funnel: täglich 10–20 Reels, automatisch auf Instagram

Stand: 25. Oktober 2026. Zwei Skripte, zwei Aufgaben in der Windows-Aufgabenplanung,
alles andere ist Konfiguration.

| Schritt | Was passiert | Wer |
|---|---|---|
| 05:30 | `tag.js` würfelt die Tagesanzahl (10–20), wählt Themen, schreibt Bildtexte, holt Tonspuren, rendert die MP4, lädt sie in die Ablage, verteilt Sendezeiten über den Tag | Aufgabe «SwissPremia Reels - Tag» |
| alle 15 Min. | `posten.js` veröffentlicht, was fällig ist: Container anlegen, warten, publizieren | Aufgabe «SwissPremia Reels - Posten» |

Der Stand jedes Reels steht in `plan/<Datum>.json` (`geplant → gerendert → hochgeladen →
veroeffentlicht`), jedes Ereignis in `plan/protokoll.log`. Beide Skripte lassen sich beliebig
oft starten – sie machen nur, was noch fehlt.

---

## 1. Woher 10–20 Reels am Tag kommen

Handgeschriebene Skripte reichen für diese Menge nicht. Der Funnel baut die Reels aus drei
Quellen, alle aus Code in `funnel/formate.js`:

**Daten-Reels (rund die Hälfte).** Sieben Formate rechnen mit den BAG-Prämien der Website
(`data/praemien.js`) je Prämienregion oder Kanton – 42 Regionen × 5 Formate plus
Kantonsvergleiche ergeben rund 250 verschiedene Reels mit echten Zahlen:

| Format | Aussage | Beispiel |
|---|---|---|
| `franchise` | 300 vs. 2'500 bei derselben Kasse, Ersparnis im Jahr, Faustregel für den Grenzwert | «Kanton Genf: Franchise 2'500 statt 300 spart CHF 1'540» |
| `modelle` | Standard vs. Hausarzt vs. HMO/Telmed, günstigstes Angebot je Modell | «Vom Standard zum HMO sind es CHF 1'050 im Jahr» |
| `alter` | Kinder / 19–25 / ab 26, der Sprung mit 26 | «Luzern: Mit 26 steigt die Prämie um CHF 148» |
| `unfall` | Dasselbe Angebot mit und ohne Unfalldeckung | «Ein Häkchen weniger spart CHF 380» |
| `flexibel` | Standard/300 vs. günstigstes Modell/2'500 – Sparpotenzial für Gesunde | «Zürich: bis zu CHF 2'590 im Jahr» |
| `regionen` | Günstigste Region vs. teuerste Region im Kanton | «Bern vs. Langenthal» |
| `kantone` | Günstigster Kanton, heutiger Kanton, teuerster Kanton | «AI, ZH, GE» |

Die Datei enthält je Modell nur die acht günstigsten Angebote – deshalb vergleichen alle
Formate *günstigste Angebote* miteinander und behaupten nie etwas über «die teuerste Kasse».
Kassennamen werden nie genannt. Jeder Bildtext endet mit einer Quellenzeile (Region, Jahr,
Annahmen, «Beispielrechnung, keine Beratung»).

**Wissens-Reels (rund ein Drittel).** Die 21 Stamm-Reels aus `src/reels.js` (fertige Tonspuren
in `public/audio/`, keine neuen ElevenLabs-Kosten) und eine Mythen-Reihe mit zwölf Folgen
(`funnel/themen.js`). Ein Thema läuft frühestens nach 14 Tagen wieder.

**Saison-Reels.** Vom 1. Oktober bis 30. November täglich ein Countdown zum 30. November
(«Noch 36 Tage»), vom 1. Februar bis 31. März zur zweiten Frist. Immer das erste Reel des Tages.

**Gegen Dubletten:** `plan/verlauf.json` merkt sich je Thema den letzten Tag; am längsten nicht
gelaufene Themen kommen zuerst, am selben Tag kein Kanton doppelt. Derselbe Tag ergibt immer
denselben Plan (deterministisch nach Datum).

**Mehr Formate:** eine Funktion in `funnel/formate.js`, die ein Paket mit `reel` (Szenen wie in
`src/reels.js`) und `bildtext` liefert, und ein Eintrag in `DATENFORMATE` oder `kandidaten()`.
Neue Szenenarten entstehen wie bisher in `src/Grafik.jsx`.

### Bewegung und Fotos (seit 25.10.2026)

Alle Reels, die Stamm-Reels eingeschlossen, laufen über dieselben Bausteine in `src/`:

| Baustein | Wirkung | Datei |
|---|---|---|
| Szenenübergänge | Schieben, Wischen, Uhrzeiger, Kreisöffnung, Zoom; je Reel eine feste, abwechslungsreiche Folge | `Reel.jsx` (@remotion/transitions) |
| Kinetische Schrift | Wörter steigen federnd aus einer Maske, Schlüsselwörter bekommen einen Marker | `Bausteine.jsx` (`Woerter`) |
| Sprechtempo | Wörter erscheinen über die Szene verteilt, ungefähr im Takt der Stimme | `useSprechschritt` |
| Kamera | langsamer Zoom mit leichter Neigung über die ganze Szene | `Buehne` |
| Hintergrund | driftende Farbflächen, rotierende Ringe, aufsteigende Kreuze (Perlin-Rauschen) | `Hintergrund`, `Partikel`, `Ringe` |
| Zahlen | Ziffern rollen wie ein Zählwerk, Funken beim Aufschlag | `Rollziffern`, `Funken` |
| Fotos | Unsplash-Bild mit Ken-Burns-Fahrt und dunkler Markenfarb-Schicht | `Fotoebene`, `src/bilder.js` |

**Fotos:** 26 Motive aus Unsplash (Unsplash-Lizenz, kommerziell frei, keine Namensnennung nötig,
keine Unsplash+-Bilder), Liste mit Kurzbeschreibung in `src/bilder.js`. Die Dateien liegen nicht
im Repository; `npm run bilder` lädt sie nach `public/bilder/`, `tag.js` und `render.js` tun
das selbst. Eine Szene bekommt ein Foto mit `bild: "<name>"`; regionale Reels nehmen über
`kantonBild()` die Stadt ihres Kantons. Fehlt ein Foto (kein Netz), läuft die Szene ohne.
Das Kalenderbild zeigt «June» und passt nur zu den Juni-/März-Terminen.

**Takt:** Zwei Szenen überlappen sich 12 Frames (`src/takt.js`). Die Stimme läuft getrennt von
den Bildern ab dem Start ihrer Szene; der Nachhall von 0,5 s ist länger als der Übergang, damit
sich zwei Sätze nie überlagern.

**Sprechtexte:** Bei einer Szene mit mehr als etwa 100 Zeichen Sprechtext steht das Bild lange.
Zahlen, die ohnehin im Bild stehen, nicht auch noch vorlesen.

### Figuren und Copywriting-Rahmen (seit 25.10.2026)

**Motion-Graphik-Menschen:** feste Besetzung (Lea, Marco, Noah, Dr. Keller, Mia, Herr Brunner)
als flache, geometrische Figuren in den Markenfarben – Skelett, Posen mit Back-Easing, Gesicht,
Frisur, Kleidung in `src/Figur.jsx`; 20 Spielszenen (Türen, Rechnungen, Laptop mit Lupe,
Telefon, Briefkasten, Karton, Treppe, Torte, Sprechblase mit Stempel, Kalender, Familie, Ärztin,
Baby, Wandern, Münzglas …) in `src/Szenenbild.jsx`. Eine Titelszene bekommt eine Figur mit
`figur: { aktion, wer, … }`. Kontrollblatt: `npx remotion still src/index.jsx modellblatt`.

**Rahmen:** Jedes Format folgt einem Copywriting-Rahmen (HPSCA, Story, Problem-Promise, AIDA,
Myth-Busting, Question, Problem-Education, Before-After-Bridge, Claim-Reason-Evidence, Objection
Handling – Liste in `funnel/themen.js`), jede Szene trägt ihren Schritt (`beat`), der Tagesplan
den Rahmen. Neu: **Geschichte** (Story, je Region: Lea vergleicht und spart, echte Zahlen) und
**Einwand** (Objection Handling, fünf Folgen). Das vollständige Storyboard aller Formate erzeugt
`npm run storyboard` nach `marke/reels-storyboard.md` – aus demselben Code wie die Reels.

---

## 2. Einrichten – einmalig

### 2.1 Instagram-Konto verbinden

Voraussetzung: ein Instagram-**Profi-Konto** (Business oder Creator), verknüpft mit der
Facebook-Seite SwissPremia (Instagram ▸ Einstellungen ▸ Konto ▸ Mit Facebook-Seite verknüpfen).

1. Auf [developers.facebook.com](https://developers.facebook.com) eine App anlegen (Typ
   «Business»), Produkt **Instagram** hinzufügen. App-Id und App-Secret stehen unter
   Einstellungen ▸ Allgemein.
2. Im **Graph API Explorer** die App wählen, als Berechtigungen `instagram_basic`,
   `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` (für den
   ersten Kommentar zusätzlich `instagram_manage_comments`) anhaken und ein
   kurzlebiges Nutzer-Token erzeugen. Solange die App im Entwicklungsmodus ist, funktioniert
   das nur für Konten, die in der App als Tester/Admin eingetragen sind – für das eigene Konto
   reicht das.
3. Im Projektordner `tools/reels`, in PowerShell:
   ```powershell
   $env:META_APP_ID = "…"; $env:META_APP_SECRET = "…"
   node funnel/instagram.js verbinden <kurzlebiges-token>
   ```
   Das tauscht das Token in ein langlebiges, sucht die Seite mit dem Instagram-Konto und
   speichert `IG_USER_ID` und `IG_ACCESS_TOKEN` als Nutzer-Umgebungsvariablen (mit `setx`,
   das Token erscheint nirgends im Klartext). Ein so gewonnenes Seiten-Token läuft nicht ab.
4. Neues Fenster öffnen und prüfen:
   ```powershell
   node funnel/instagram.js pruefen
   ```
   Zeigt Konto, Follower und das Kontingent (`x von 50 in 24 h`).

**Weg B: Token aus dem Dashboard («Instagram-Login»).** Bietet der Graph API Explorer für
die App nur ein App-Token an (passiert bei neuen Apps ohne «Facebook Login for Business»),
ist dieser Weg einfacher und braucht keine Facebook-Seite:

1. App-Dashboard ▸ «Anwendungsfälle» ▸ Instagram-Fall «Anpassen» ▸ **«API-Einrichtung mit
   Instagram-Login»**. Lässt die App nur die Facebook-Variante zu, eine zweite App
   («SwissPremia Reels IG») mit dem Instagram-Anwendungsfall anlegen und dort diese
   Variante wählen.
2. Unter **«Zugriffstoken generieren»** ▸ «Instagram-Konto hinzufügen» ▸ im Fenster mit den
   Zugangsdaten von @swisspremia anmelden und die Berechtigungen erlauben.
3. Beim nun gelisteten Konto auf **«Token generieren»** ▸ Kästchen «Ich verstehe» ▸ Token
   kopieren.
4. PowerShell im Ordner `tools/reels`:
   ```powershell
   node funnel/instagram.js verbinden <token> --instagram
   ```
   Das stellt `funnel.json` auf `graph.instagram.com`, liest das Konto und speichert
   `IG_USER_ID` und `IG_ACCESS_TOKEN`. Das Token gilt 60 Tage; `posten.js` verlängert es
   alle 20 Tage selbst.
5. Neues Fenster, `node funnel/instagram.js pruefen`.

### 2.2 Ablage für die Videos

Instagram lädt das Video von einer öffentlichen URL. Standard ist **Vercel Blob**
(gleicher Account wie die Website): Vercel ▸ Storage ▸ Blob ▸ Store anlegen (öffentlich) ▸
Token erzeugen ▸ als `BLOB_READ_WRITE_TOKEN` speichern. 15 Videos × 4 MB × 14 Tage
Aufbewahrung sind unter einem Gigabyte.

Alternative ohne Vercel: `"ablage": "ordner"` in `funnel.json` plus `videoOrdner` (lokaler
Pfad, z. B. ein Webserver- oder NAS-Ordner) und `videoBasisUrl` (dessen öffentliche Adresse).

### 2.3 Stimme (optional)

`ELEVENLABS_API_KEY` und `ELEVENLABS_VOICE_ID` wie bisher (Matilda `XrExE9yKIg1WjnnlVkGX`,
Modell `eleven_multilingual_v2`). Tonspuren der Daten-Reels liegen in `public/audio/tag/`
und werden über Tage hinweg wiederverwendet: die Reel-Id trägt einen Fingerabdruck des
Sprechtexts, nur ein geänderter Satz kostet neue Zeichen. Überschlag: ein Daten-Reel hat
rund 450 Zeichen Sprechtext; alle 250 Kombinationen einmal zu vertonen sind rund 115'000
Zeichen – danach fast nichts mehr. Ohne Schlüssel oder mit `"stimme": "aus"` wird stumm
gerendert (Text steht ohnehin im Bild).

**Schlüssel richtig kopieren:** In der Liste «API Keys» zeigt ElevenLabs nur die ID eines
Schlüssels. Der Schlüssel selbst beginnt mit `sk_` und erscheint nur einmal, beim Anlegen. Für
einen eingeschränkten Schlüssel reicht «Text to Speech: Access»; «Voices: Read» braucht der
Funnel nicht, weil die Stimme fest eingetragen ist.

**Kein stummer Ersatz bei kaputtem Schlüssel:** Ist ein Schlüssel gespeichert, aber ElevenLabs
lehnt ab (falscher Schlüssel, Kontingent leer), rendert `tag.js` Reels ohne fertige Tonspur
nicht, sondern lässt sie mit Fehler auf «geplant». Ein späterer Lauf am selben Tag holt sie
nach. Nur ganz ohne Schlüssel wird bewusst stumm gerendert.

### 2.4 Aufgabenplanung

```powershell
cd C:\Users\info\OneDrive\Dokumente\leads\tools\reels
.\zeitplan-einrichten.ps1
```

Fragt alle Schlüssel ab (Enter behält den gespeicherten Wert) und legt die zwei Aufgaben an.
`-Status` zeigt letzte Läufe und Protokoll, `-Entfernen` löscht beide, `-TagesStart 06:00`
und `-TaktMinuten 10` ändern die Zeiten.

Der Rechner muss laufen. `WakeToRun` weckt ihn aus dem Energiesparmodus für die
Tagesproduktion, ein zugeklappter Laptop postet aber nichts. Wer das nicht will, lässt die
beiden Skripte auf einem kleinen Server oder in einer Cloud-Routine laufen – sie brauchen nur
Node, einen Chrome und die Umgebungsvariablen.

---

## 3. Bedienung

```powershell
npm run plan                      # Plan für heute anzeigen (nichts gerendert)
node tag.js --datum=2026-11-03    # einen Tag vorproduzieren
node tag.js --anzahl=12 --neu     # heute neu planen mit fester Anzahl
node tag.js --nur=4               # nur Reel Nr. 4 (z. B. nach Fehler)
node posten.js --ausfuehrlich     # was wäre jetzt fällig?
node posten.js --alle             # alles Fällige sofort posten
node funnel/instagram.js kontingent
.\zeitplan-einrichten.ps1 -Status
```

`funnel.json` (kein Geheimnis darin):

| Schlüssel | Standard | Bedeutung |
|---|---|---|
| `reelsProTag` | `"10-20"` | feste Zahl oder Spanne, je Tag ausgewürfelt |
| `postVon` / `postBis` | `07:00` / `21:30` | Sendefenster, lokale Zeit |
| `mindestabstandMinuten` | `30` | nie zwei Reels näher beieinander |
| `proTick` | `1` | wie viele fällige Reels ein Lauf von `posten.js` postet |
| `mix` | daten .5, wissen .35, saison .15 | Anteile je Tag |
| `wiederholungStammTage` | `14` | Sperrfrist für Stamm-Reels und Mythen |
| `hashtags` | `bildtext` | `bildtext`, `kommentar` (erster Kommentar) oder `keine` |
| `stimme` | `auto` | `aus` = immer stumm |
| `ablage` | `vercel-blob` | oder `ordner` |
| `aufbewahrungTage` | `14` | danach werden Videos und Pläne gelöscht |
| `igHost` / `igApiVersion` | `graph.facebook.com` / `v26.0` | API-Endpunkt |

Jeder Wert lässt sich mit einer Umgebungsvariable in Grossbuchstaben übersteuern
(`REELS_PRO_TAG`, `POST_VON`, …).

---

## 4. Grenzen, die man kennen muss

**Instagram-Kontingent.** Höchstens 50 API-Veröffentlichungen je Konto und 24 Stunden.
`posten.js` liest das Kontingent vor jedem Lauf und wartet, wenn es erschöpft ist.

**10–20 Reels am Tag sind viel.** Technisch kein Problem, aber weit über dem, was Instagram
üblicherweise belohnt (ein bis drei Reels am Tag). Mögliche Folgen: sinkende Reichweite je
Reel, im schlechtesten Fall Einstufung als Spam. Die Anzahl ist bewusst ein Regler
(`reelsProTag`), nicht fest verdrahtet – mit `"3-5"` läuft derselbe Funnel als Normalbetrieb.
Empfehlung: zwei Wochen mit `"10-20"` messen (Reichweite, Follower, Klicks auf den Profil-Link),
dann anhand der Zahlen entscheiden.

**Prämienjahr.** Die Zahlen kommen aus `data/praemien.js` (aktuell Prämien 2026). Für die
Wechselsaison 2027 die BAG-Dateien laden und `tools/build_data.js` ausführen (README);
alle Reels nehmen das neue Jahr automatisch in die Quellenzeile auf. Sprechtexte mit
Zahlen bekommen dann neue Tonspuren – das ist gewollt.

**Entwicklungsmodus der Meta-App.** Posten funktioniert damit nur für das eigene,
in der App eingetragene Konto. Das reicht hier. Wer die App veröffentlichen will
(App Review), braucht es für diesen Zweck nicht.

**Titelbild.** Instagram nimmt ohne eigenes Titelbild den ersten Frame, und der ist bei
unseren Reels leer, weil jede Szene erst einblendet. Die Zeitangabe `thumb_offset` hat Instagram
im Probelauf vom 25.10.2026 ignoriert. Deshalb rendert `tag.js` je Reel ein JPEG (Szene beim
Anteil `cover`, Frame bei 75 %), lädt es neben das Video und `posten.js` schickt es als
`cover_url` mit. Ein bereits veröffentlichtes Reel bekommt sein Titelbild nur noch in der
Instagram-App (Reel ▸ ⋯ ▸ Bearbeiten ▸ Titelbild bearbeiten).

**Kein Nachholen.** Was an einem Tag nicht gepostet wurde (Rechner aus), bleibt im Plan des
Tages stehen und wird am Folgetag nicht nachgeholt – ein Countdown von gestern wäre falsch.
`posten.js --datum=<gestern> --alle` holt es bei Bedarf von Hand nach.

**Kosten.** ElevenLabs nach Zeichen (siehe 2.3), Vercel Blob nach Speicher und Transfer
(Instagram lädt jedes Video einmal). Instagram-API und Remotion sind kostenlos.

---

## 5. Testen ohne Instagram

`test/graph-attrappe.js` spielt die Graph API nach (Container, Status nach zweitem
Nachfragen `FINISHED`, Publish, Kontingent) und liefert die Videos aus einem Ordner aus:

```powershell
node test/graph-attrappe.js 8787 C:\Temp\videos        # Fenster 1

$env:IG_HOST = "localhost:8787"; $env:IG_PROTOKOLL = "http"  # Fenster 2
$env:IG_USER_ID = "17841400000000000"; $env:IG_ACCESS_TOKEN = "test"
$env:ABLAGE = "ordner"; $env:VIDEO_ORDNER = "C:\Temp\videos"; $env:VIDEO_BASIS_URL = "http://localhost:8787/video"
node tag.js --anzahl=2 --ohne-stimme
node posten.js --alle --jetzt=2099-01-01T00:00 --ausfuehrlich
```

`http://localhost:8787/_protokoll` zeigt jeden Aufruf. Danach `plan\<Datum>.json` löschen,
sonst gilt der Testplan als Tagesplan.

---

## 6. Dateien

```
tools/reels/
  tag.js                    Tagesproduktion (Plan, Stimme, Render, Upload)
  posten.js                 Veröffentlichen fälliger Reels
  funnel.json               Einstellungen ohne Geheimnisse
  zeitplan-einrichten.ps1   Aufgabenplanung + Schlüssel als Nutzer-Umgebungsvariablen
  funnel/
    konfig.js               Einstellungen und Geheimnisse (nur Umgebung)
    daten.js                BAG-Prämien lesen, Regionen benennen
    formate.js              die Reel-Formate (daten / wissen / saison)
    themen.js               Bildtexte der Stamm-Reels, Mythen, Hashtags
    bildtext.js             Caption zusammensetzen
    redaktion.js            Auswahl, Reihenfolge, Sendezeiten
    stimme.js               ElevenLabs (gemeinsam mit stimme.js)
    rendern.js              Remotion programmatisch, MP4-Dauer
    ablage.js               Vercel Blob oder Ordner
    instagram.js            Graph API + Kommandozeile (verbinden, pruefen)
    zustand.js              Plan, Verlauf, Protokoll, Aufräumen
    sprache.js              Zahlwörter, CHF-Format, Datum, Zufall
  test/graph-attrappe.js    Nachbau der Graph API für Tests
  test/standbilder.js       ein Standbild je Szene als Kontaktbogen (Layoutprüfung)
  src/takt.js               Übergangslänge, Nachhall, Szenenstarts (Remotion und Node)
  src/bilder.js             Unsplash-Motive; funnel/bilder.js lädt sie nach public/bilder/
  plan/                     Tagespläne, Verlauf, Protokoll (nicht im Git)
  out/tag/<Datum>/          gerenderte Videos (nicht im Git)
  public/audio/tag/         Tonspuren der Daten-Reels (nicht im Git)
```

Die Komposition `tagesreel` in `src/Root.jsx` nimmt jeden Reel als Eingabe entgegen; die
Stamm-Reels bleiben wie bisher eigene Kompositionen (`npm run render`, `npm run vorschau`).
