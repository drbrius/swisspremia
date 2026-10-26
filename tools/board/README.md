# Reels-Board

Performance-Board für die Instagram-Reels: Sendeplan des Tages (was gepostet wird und was
schon gepostet wurde), Zahlen je Beitrag und fürs ganze Konto. Eigene Vercel-Seite, nur mit
Login.

**Adresse:** https://swisspremia-board.vercel.app (Vercel-Projekt `swisspremia-board`)

## Was es zeigt

| Bereich | Inhalt |
|---|---|
| Kennzahlen | Aufrufe (Summe der Beiträge im Zeitraum), erreichte Konten, Interaktionen, Ø Wiedergabe, Profilaufrufe, Klicks auf den Website-Link, Follower |
| Sendeplan | je Tag alle Reels mit Uhrzeit, Format und Status (geplant, gerendert, bereit, veröffentlicht, Fehler, aufgegeben, nicht gepostet); Klick zeigt Video, Bildtext und Fehler |
| Erreichte Konten pro Tag | ganzes Konto, letzte 28 Tage |
| Aufrufe nach Format | Ø Aufrufe je Beitrag pro Format – die Grundlage, um `reelsProTag` und den Mix anzupassen |
| Beiträge | alle Beiträge mit Aufrufen, Reichweite, Likes, Kommentaren, Geteilt, Gespeichert, Ø Wiedergabe; sortierbar |
| Betrieb | letzter Abgleich, Instagram-Kontingent, Token, Hinweise, Protokoll |

Filter oben (Heute, 7 Tage, 28 Tage, Alle; Funnel oder von Hand) gelten für alles darunter.
Kontozahlen liefert Instagram höchstens für 28 Tage.

**Impressionen gibt es nicht mehr:** Instagram hat sie 2025 durch **Aufrufe** (`views`)
ersetzt. Reichweite zählt jedes Konto einmal, Aufrufe zählen jedes Abspielen. Instagram
schliesst Tage um Mitternacht kalifornischer Zeit ab, die Tageswerte sind deshalb um
neun Stunden verschoben.

## Wie die Daten fliessen

```
Reels-Rechner (Aufgabe "SwissPremia Reels - Board", alle 30 Min.)
  tools/reels/board.js
    liest plan/*.json und die Instagram-API (nur lesen)
    -> verschlüsselt (AES-256-GCM, BOARD_SCHLUESSEL)
    -> Vercel Blob  board/stand.json   (Store swisspremia-reels)

Board (Vercel, Funktion /api/stand)
    prüft die Sitzung -> holt board/stand.json -> entschlüsselt -> Browser
```

Nur der Rechner kennt das Instagram-Token und die Tagespläne; das Board bekommt beides
nie. Die Datei im Blob ist öffentlich erreichbar, aber ohne Schlüssel unlesbar. Läuft der
Rechner nicht, zeigt das Board den letzten Stand und warnt nach 75 Minuten.

## Umgebungsvariablen

| Wo | Name | Inhalt |
|---|---|---|
| Vercel | `BOARD_BENUTZER` | Benutzername (setzt `node passwort.js`) |
| Vercel | `BOARD_PASSWORT` | mindestens 12 Zeichen, «sensitive» (setzt `node passwort.js`) |
| Vercel | `BOARD_SCHLUESSEL` | derselbe Wert wie auf dem Rechner |
| Vercel | `BOARD_DATEN_URL` | `…public.blob.vercel-storage.com/board/stand.json` |
| Rechner | `BOARD_SCHLUESSEL` | Nutzer-Umgebungsvariable, erzeugt mit `node board.js schluessel` |

Fehlt in Vercel einer der Werte, bleibt das Board zu und nennt auf der Login-Seite, was fehlt.

## Bedienung

Die Vercel-CLI muss im eigenen Terminal angemeldet sein (einmalig `npx.cmd vercel login`;
`passwort.js` prüft das zuerst). In PowerShell `npx.cmd` statt `npx` – `npx.ps1` blockiert
die Ausführungsrichtlinie.

```powershell
cd tools\board
node passwort.js                 # Benutzer und Passwort setzen oder ändern, stellt neu bereit
npx vercel deploy --prod --yes   # nach Code-Änderungen neu bereitstellen

cd ..\reels
node board.js                    # Stand sofort abgleichen
node board.js --trocken          # nur lokal: plan/board-stand.json (Klartext)
.\zeitplan-einrichten.ps1 -NurBoard   # Aufgabe "SwissPremia Reels - Board" anlegen
```

Das Projekt ist **nicht** mit GitHub verbunden: Ein Push ändert das Board nicht, bereitgestellt
wird mit der Vercel-CLI aus diesem Ordner.

## Lokal testen

```powershell
node tools/board/dev.js --beispiel   # erfundene Daten, Port 4180
node tools/board/dev.js --port=4181  # echter Stand aus tools/reels/plan/board-stand.enc.json
```

Lokal gilt Benutzer `test`, Passwort `test-passwort-lokal` – nur in `dev.js`, nie auf Vercel.
In `.claude/launch.json` als `board` und `board-echt` eingetragen.

## Sicherheit

- Login prüft Benutzer und Passwort in konstanter Zeit und bremst Fehlversuche (1–1,5 s).
- Sitzung: Cookie `sp_board`, HttpOnly, Secure, SameSite=Strict, 30 Tage; signiert mit einem
  Schlüssel aus `BOARD_SCHLUESSEL` und dem Passwort. Neues Passwort = alle Geräte abgemeldet.
- POST nur von der eigenen Seite (Origin-Prüfung), strenge Content-Security-Policy,
  `noindex`, kein Einbetten in fremde Seiten.
- Alle Texte aus Instagram und dem Plan gehen als Text ins DOM, nie als HTML.

## Dateien

```
tools/board/
  api/login.js, logout.js, stand.js   Vercel-Funktionen
  lib/sitzung.js                      Zugang und Sitzungs-Cookie
  lib/stand.js                        Stand holen und entschlüsseln
  lib/http.js                         kleine Helfer
  public/                             Seite (index.html, board.css, board.js)
  passwort.js                         Zugang in Vercel setzen
  dev.js, test/beispiel.js            lokaler Test
tools/reels/
  board.js, funnel/board.js           Abgleich auf dem Rechner
```
