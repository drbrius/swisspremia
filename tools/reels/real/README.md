# Serie «Echt» – 15 Reels mit realistischen Szenen

Seit 10.11.2026. Neues Design neben den Figuren-Reels des Funnels: randloses, realistisches
Video, grosse Untertitel im Sprechtakt, Zahlenkarte, Abbinder auf dem unscharfen letzten Bild.
Neue Skripte (15 Themen), deutsche Stimme, Musik.

| Was | Womit | Wo |
|---|---|---|
| Skripte, Bildbeschriebe, Bildtexte | `real/skripte.js` | je Reel vier Szenen und ein Abbinder |
| Stimme | ElevenLabs `eleven_v3`, `language_code: "de"`, Stimme Mila | `real/stimme.js` → `public/real/ton/<id>.mp3`, `real/zeiten/<id>.json` |
| Szenen | Higgsfield, Modell `seedance_2_0`, 720p, 9:16, 15 s, ohne Ton | `real/clips.js` → `public/real/clips/<id>.mp4` (nicht im Repository), `real/clips.json` |
| Zusammenbau | Remotion, Komposition `echtreel` (`src/EchtReel.jsx`) | `real/bauen.js` → `out/real/<id>.mp4` und `<id>.jpg` |
| Bildtexte | `real/bildtexte.js` | `out/real/bildtexte.md` |

## Ablauf

```powershell
node real/stimme.js                  # 15 Tonspuren mit Zeitstempeln (rund 5'300 Zeichen)
node real/clips.js naechster         # Id und Prompt des naechsten fehlenden Clips
# … Clip auf Higgsfield erzeugen (seedance_2_0, 9:16, 15 s, 720p, ohne Ton) …
node real/clips.js holen <id> <url>  # laden, Schnitte suchen, eintragen
node real/bauen.js                   # alle Reels rendern, deren Clip vorliegt
node real/bildtexte.js               # Bildtexte schreiben
```

## Warum so

- **Ein Clip je Reel, vier Einstellungen.** Das Modell hält dieselbe Person über alle
  Einstellungen; vier einzelne Clips ergäben vier verschiedene Menschen. Die gewünschte Länge
  je Einstellung folgt der Sprechdauer der Szene, das Modell hält sie nur ungefähr ein. Darum
  sucht `clips.js` die tatsächlichen Schnitte (Bildvergleich), und `bauen.js` legt die
  Einstellungen mit 0.68- bis 1.15-fachem Tempo auf die Sprechzeit (`zuordnen`).
- **Stimme ohne englischen Einschlag.** Im Funnel entsteht je Szene ein kurzer Schnipsel mit
  `eleven_multilingual_v2`, das die Sprache selbst errät – bei kurzen Sätzen und Wörtern wie
  «Franchise» oder «Swisspremia» rutscht es ins Englische. Hier: ganzer Text in einem Zug,
  Modell `eleven_v3` mit erzwungenem Deutsch, Zahlen ausgeschrieben, «Franschise» für die
  deutsche Aussprache. Andere Stimme: `REAL_VOICE_ID` setzen, `node real/stimme.js --neu`,
  `node real/bauen.js --neu`. Hörproben: `node real/stimme.js --probe=<voice_id>:<Name>`.
- **Untertitel aus den Zeitstempeln.** ElevenLabs liefert je Zeichen Start und Ende; jeder
  Untertitel-Block erscheint mit seinem ersten Wort. Der erste steht ab dem ersten Bild.
- **Musik.** `public/musik/real-1.mp3` (REAL_MUSIK). Künftig keine Musik über Higgsfield
  erzeugen (Wunsch vom 10.11.2026); eigene Stücke oder ElevenLabs direkt, siehe FUNNEL.md.

## Grenzen

- Higgsfield: Die Unlimited-Freigabe des Plans deckt `seedance_2_0` bis 720p und 15 s, aber
  nur **einen Auftrag gleichzeitig** (sonst 429). Ein Clip braucht rund 10 Minuten.
- Die Clips zeigen erfundene Personen. Instagram verlangt bei realistisch wirkenden
  KI-Videos eine Kennzeichnung; die Bildtexte und der Abbinder nennen es («Szenen und Stimme
  KI-generiert»). Beim Posten in der App zusätzlich das KI-Label setzen.
- Keine Kassennamen, keine Beratung, Zahlen mit Quelle – wie im Funnel.
