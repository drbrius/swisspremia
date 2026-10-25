# Reels – Storyboards mit Figuren und Copywriting-Rahmen

Erzeugt mit `node test/storyboard.js` am 2026-10-25 – aus demselben Code, der die Reels baut. Nicht von Hand ändern; Änderungen gehören in `tools/reels/funnel/formate.js`, `funnel/themen.js` und `src/reels.js`.

## Regie-Regeln

- **Haken in den ersten 3 Sekunden** – eine Figur, eine Frage oder eine Zahl, nie ein Logo.
- **Ein Gedanke je Reel**, gebaut nach einem Copywriting-Rahmen; jede Szene ist ein Schritt.
- **Figuren:** Der Körper bleibt ruhig, Hände und Gesicht spielen. Jede Pose mit Ausholen, Aktion, Nachschwingen. Requisiten zwischen den Händen. Die Figur nimmt mindestens ein Drittel der Bildhöhe ein und steht nie auf ihrer eigenen Farbe (helle Bühnenscheibe auf dunklem Grund).
- **Abwechslung:** Figurenszene, Datengrafik und Foto wechseln sich ab; nie zwei gleiche Szenenarten hintereinander, wo es sich vermeiden lässt.
- **Text im Bild** höchstens rund 22 Zeichen je Zeile; Wörter erscheinen im Sprechtempo. Zahlen, die im Bild stehen, werden nicht vorgelesen.
- **Abschluss = Aufforderung:** Marke, Adresse, «In 1 Minute vergleichen · Link im Profil».
- **Ehrlichkeit:** Keine Kassennamen, nur günstigste Angebote; jede Zahl mit Quellenzeile im Bildtext; Beispielfiguren als solche bezeichnet.
- Die Grammatik (geometrische Figuren, ruhiger Körper, runde Lupe, Stempel, Strahlenkranz) ist von der Mid-Century-Animation und dem Regiebuch von lemo-opuscar (MIT) gelernt – keine Figuren, Zeichnungen oder Musik übernommen.

## Copywriting-Rahmen

| Rahmen | Schritte | Formate |
|---|---|---|
| HPSCA | Hook → Problem → Agitation → Solution → CTA | Countdown 30. November, Stamm: new-in-switzerland, Stamm: countdown-november |
| Story | Story → Struggle → Turning Point → Lesson | Geschichte (neu) |
| Problem-Promise | Problem → Pain → Promise → Proof → CTA | Unfalldeckung, Stamm: unfalldeckung, Stamm: praemienverbilligung |
| AIDA | Attention → Interest → Desire → Action | Kantone |
| Myth-Busting | Hook → Myth → Truth → Example → CTA | Mythos |
| Question | Question → Curiosity → Insight → Takeaway | Franchise, Stamm: zwei-termine, Stamm: franchise, Stamm: familienrabatt, Stamm: zwei-fenster |
| Problem-Education | Problem → Why It Matters → How to Fix It | Altersklassen, Stamm: mit-19, Stamm: umzug, Stamm: eingeschrieben, Stamm: selbstbehalt, Stamm: neugeborene, Stamm: zusatz-reihenfolge, Stamm: checkliste-wechsel, Stamm: treppe-26 |
| Before-After-Bridge | Before → After → Bridge → CTA | Sparpotenzial, Stamm: sparglas |
| Claim-Reason-Evidence | Claim → Reason → Evidence → Action | Modelle, Prämienregionen, Stamm: gleiche-leistung, Stamm: drei-modelle, Stamm: praemienregionen, Stamm: leistungen-gleich |
| Objection Handling | Hook → Objection → Reframe → Proof → CTA | Einwand (neu) |

## Besetzung

| Figur | Rolle | Merkmale |
|---|---|---|
| lea | Hauptfigur, vergleicht und handelt | zopf |
| marco | Skeptiker: Mythen, Einwände, Wandern | kurz, Bart |
| noah | Junger Erwachsener, Altersklassen, Telmed | locken, Kopfhörer |
| keller | Ärztin: Notfall, Grundversorgung | dutt, Brille, Kittel, Stethoskop |
| mia | Kind in der Familie | zoepfe, Kind |
| brunner | Senior: Prämienverbilligung | glatze, Brille |

**Spielszenen (20):** kalender, winken, zeigen, denken, jubeln, schulter, tueren, rechnungen, laptop, telefon, briefkasten, karton, treppe, torte, sprechblase, familie, arzt, baby, wandern, muenzen. Verwendung: `figur: { aktion, wer, … }` an einer Titelszene.

## Formate

### Franchise

Je Prämienregion. Lea steht zwischen zwei Türen – die Frage ist der Haken.

**Rahmen:** Question (Question → Curiosity → Insight → Takeaway)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Question** | titel<br>Figur: lea · tueren | Zürich: Franchise / 300 oder 2'500? | Zürich: Franchise zweitausendfünfhundert oder dreihundert? Gleiche Kasse, gleiches Modell. |
| 2 | **Curiosity** | zaehler | Prämienersparnis im Jahr CHF 1540 mit Franchise 2'500 | Mit der hohen Franchise sparen Sie tausendfünfhundertvierzig Franken Prämie im Jahr. |
| 3 | **Insight** | titel<br>Figur: lea · rechnungen | Krank? Dann tragen Sie / bis CHF 2'200 selbst. | Dafür tragen Sie bis zu zweitausendzweihundert Franken mehr selbst – wenn Sie krank werden. |
| 4 | **Insight** | titel<br>Foto: zuerich | Faustregel: / Unter CHF 2'000 / Arztkosten im Jahr / gewinnt 2'500. | Faustregel: Bleiben Ihre Arztkosten unter zweitausend Franken im Jahr, gewinnt die hohe Franchise. |
| 5 | **Takeaway** | titel<br>Figur: lea · laptop | Franchise ändern – / bis 30. November, / ohne Kassenwechsel. | Die Franchise ändern Sie bis Ende November – ohne die Kasse zu wechseln. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zürich: Franchise 2'500 statt 300 spart CHF 1'540 Prämie im Jahr. Ob sich das lohnt, entscheidet eine Zahl.

### Modelle

Je Prämienregion. Behauptung zuerst, dann der Grund, dann die Zahlen.

**Rahmen:** Claim-Reason-Evidence (Claim → Reason → Evidence → Action)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Claim** | modelle | Zürich: / drei Alternativen / zum Standard. | Hausarzt, HMO oder Telmed: In Zürich sind alle drei günstiger als das Standardmodell – bei gleichen Leistungen. |
| 2 | **Reason** | titel<br>Figur: noah · telefon | Der Grund: Sie gehen / zuerst zum Hausarzt, / in die Praxis – oder / rufen an. | Der Grund: Sie gehen zuerst zum Hausarzt, in die Gruppenpraxis – oder rufen an. |
| 3 | **Evidence** | balken | Günstigstes Angebot / je Modell, pro Monat. | Standard sechshundertfünf Franken. Hausarzt fünfhundertdreiundzwanzig Franken. HMO fünfhundertachtzehn Franken. |
| 4 | **Evidence** | zaehler<br>Foto: praxis | Standard → HMO: CHF 1050 weniger im Jahr | Vom Standard zum HMO-Modell: tausendfünfzig Franken weniger im Jahr. |
| 5 | **Action** | titel<br>Figur: – · arzt | Notfälle sind in jedem / Modell gedeckt. | Notfälle sind in jedem Modell gedeckt. Sie binden sich nur bei der ersten Anlaufstelle. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zürich: Vom Standardmodell zum HMO-Modell sind es CHF 1'050 im Jahr – bei identischen Leistungen.

### Altersklassen

Je Prämienregion. Noah steigt die Treppe der Altersklassen hinauf.

**Rahmen:** Problem-Education (Problem → Why It Matters → How to Fix It)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Problem** | titel<br>Figur: noah · treppe | Zürich: / drei Altersklassen, / drei Prämien. | Zürich: Kinder, junge Erwachsene, Erwachsene. Drei Altersklassen, drei Prämien. |
| 2 | **Why It Matters** | titel<br>Figur: noah · torte | Mit 26: / + CHF 147 / im Monat. Automatisch. | Mit sechsundzwanzig steigt die Prämie um einhundertsiebenundvierzig Franken im Monat. Automatisch. |
| 3 | **Why It Matters** | zwei | 19–25 vs. ab 26 CHF 371 vs. 518 | Das sind tausendsiebenhundertachtundfünfzig Franken mehr im Jahr. |
| 4 | **How to Fix It** | titel<br>Foto: jung | Die Lösung: / mit 26 neu vergleichen. / Jede Altersklasse hat / eine andere Rangfolge. | Die Lösung: Mit sechsundzwanzig neu vergleichen. Die Rangfolge der Kassen ist in jeder Altersklasse anders. |
| 5 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zürich: Mit 26 steigt die günstigste Prämie um CHF 147 im Monat. Automatisch – und meist unbemerkt.

### Unfalldeckung

Je Prämienregion. Das Problem kennt jede angestellte Person.

**Rahmen:** Problem-Promise (Problem → Pain → Promise → Proof → CTA)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Problem** | titel<br>Figur: lea · laptop | Angestellt, / mindestens 8 Stunden / pro Woche? | Angestellt, mindestens acht Stunden pro Woche? |
| 2 | **Pain** | titel<br>Figur: lea · schulter | Dann zahlen Sie / den Unfall vielleicht / doppelt. | Dann zahlen Sie den Unfall vielleicht doppelt: beim Arbeitgeber und bei der Kasse. |
| 3 | **Promise** | schalter | Unfall läuft über / den Arbeitgeber. | Dann läuft der Unfall über den Arbeitgeber. Die Unfalldeckung der Krankenkasse können Sie ausschliessen. |
| 4 | **Proof** | zaehler<br>Foto: laptop | In Zürich: CHF 311 weniger im Jahr | dreihundertelf Franken weniger im Jahr – für ein Häkchen. |
| 5 | **Proof** | titel<br>Figur: lea · karton | Stelle gekündigt? / Unfall wieder / einschliessen. | Stelle gekündigt oder selbstständig? Dann den Unfall wieder einschliessen. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zürich: Angestellte zahlen die Unfalldeckung oft doppelt. Ein Häkchen weniger spart CHF 311 im Jahr.

### Sparpotenzial

Je Prämienregion. Vorher, Nachher – und die Brücke dazwischen.

**Rahmen:** Before-After-Bridge (Before → After → Bridge → CTA)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Before** | titel<br>Figur: marco · wandern | Gesund, flexibel, / selten beim Arzt? | Gesund, flexibel, selten beim Arzt? |
| 2 | **Before** | titel<br>Foto: gipfel | Standard mit 300: / CHF 605 im Monat. / HMO mit 2'500: / CHF 389 im Monat. | Standard mit dreihundert Franchise – oder HMO mit zweitausendfünfhundert. |
| 3 | **After** | muenzen | Zürich: / so viel liegt drin. / Pro Jahr. | In Zürich liegen bis zu zweitausendfünfhundertneunzig Franken im Jahr drin. |
| 4 | **Bridge** | titel<br>Figur: marco · rechnungen | Der Haken: krank? / Bis CHF 2'200 / selbst zahlen. | Der Haken: Werden Sie krank, zahlen Sie bis zweitausendzweihundert Franken mehr selbst. Das Geld muss da sein. |
| 5 | **Bridge** | titel<br>Figur: marco · laptop | Modell und Franchise / ändern Sie / bis 30. November. | Modell und Franchise ändern Sie bis Ende November. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zürich: Bis zu CHF 2'590 im Jahr zwischen Standard mit Franchise 300 und HMO mit Franchise 2'500.

### Prämienregionen

Je Kanton mit mehreren Regionen.

**Rahmen:** Claim-Reason-Evidence (Claim → Reason → Evidence → Action)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Claim** | karte | Gleicher Kanton. / Andere Prämie. | Kanton Bern: drei Prämienregionen. Ihre Wohngemeinde entscheidet, in welcher Sie sind. |
| 2 | **Evidence** | zwei<br>Foto: bern | Langenthal vs. Bern CHF 448 vs. 540 | Günstigstes Angebot in Langenthal: vierhundertachtundvierzig Franken. In Bern: fünfhundertvierzig Franken. |
| 3 | **Evidence** | zaehler | Unterschied im Jahr CHF 1111 gleiche Leistung | tausendeinhundertelf Franken Unterschied im Jahr – für dieselbe Grundversicherung. |
| 4 | **Action** | titel<br>Figur: marco · denken | Die Region können Sie / nicht wählen. / Die Kasse schon. | Die Region können Sie nicht wählen. Die Kasse schon. |
| 5 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Kanton Bern: CHF 448 in Langenthal, CHF 540 in Bern – gleiche Leistung, 1111 Franken Unterschied im Jahr.

### Kantone

Je Kanton.

**Rahmen:** AIDA (Attention → Interest → Desire → Action)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Attention** | titel<br>Foto: flagge | Gleiche Leistung. / 26 Kantone. / 26 Preisniveaus. | Gleiche Grundversicherung, sechsundzwanzig Kantone, sechsundzwanzig Preisniveaus. |
| 2 | **Interest** | balken | Günstigstes Angebot / pro Monat, Erwachsene. | Zug: dreihundertsechsundachtzig Franken. Zürich: vierhundertneunundachtzig Franken. Genf: sechshundertsiebenundachtzig Franken. |
| 3 | **Desire** | titel<br>Figur: marco · schulter | Wegziehen? Nein. / Vergleichen reicht – / auch in Zürich. | Wegziehen müssen Sie deswegen nicht. Vergleichen reicht – auch in Zürich. |
| 4 | **Action** | titel<br>Figur: lea · laptop | In Ihrem Kanton liegen / die Kassen Hunderte / Franken auseinander. | Denn innerhalb Ihres Kantons liegen die Kassen Hunderte Franken im Jahr auseinander. |
| 5 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Zug CHF 386, Zürich CHF 489, Genf CHF 687: dieselbe Grundversicherung, pro Monat.

### Geschichte (neu)

Je Prämienregion. Lea ist eine Beispielfigur, die Zahlen sind echt.

**Rahmen:** Story (Story → Struggle → Turning Point → Lesson)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Story** | titel<br>Figur: lea · winken | Das ist Lea. / Sie wohnt in Zürich. | Das ist Lea. Sie wohnt in Zürich und ist seit Jahren bei derselben Kasse. |
| 2 | **Struggle** | titel<br>Figur: lea · schulter | Jedes Jahr teurer. / Standardmodell: / CHF 605 im Monat. | Jedes Jahr wird es teurer. Im Standardmodell zahlt sie sechshundertfünf Franken im Monat. |
| 3 | **Turning Point** | titel<br>Figur: lea · laptop | Dann vergleicht sie. / Hausarztmodell: / CHF 523 im Monat. | Dann vergleicht sie. Im Hausarztmodell sind es fünfhundertdreiundzwanzig Franken – bei gleichen Leistungen. |
| 4 | **Lesson** | zaehler<br>Foto: zuerich | Lea spart CHF 989 im Jahr | neunhundertneunundachtzig Franken im Jahr. |
| 5 | **Lesson** | titel<br>Figur: lea · jubeln | Gleiche Leistungen. / Einmal im Jahr / vergleichen lohnt sich. | Gleiche Leistungen. Einmal im Jahr vergleichen lohnt sich. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Lea in Zürich zahlte CHF 605 im Monat. Dann hat sie verglichen – und spart CHF 989 im Jahr.

### Countdown 30. November

Täglich vom 1. Oktober bis 30. November, immer das erste Reel des Tages.

**Rahmen:** HPSCA (Hook → Problem → Agitation → Solution → CTA)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Hook** | zahl | Kündigungsfrist 30. November / 36 Tage | Noch sechsunddreissig Tage bis zum dreissigsten November. |
| 2 | **Problem** | titel<br>Figur: lea · briefkasten | Bis dann muss die / Kündigung da sein – / nicht abgeschickt. | Bis dann muss die Kündigung bei der Kasse eingetroffen sein. Nicht abgeschickt – eingetroffen. |
| 3 | **Agitation** | titel<br>Figur: marco · kalender | Einen Tag zu spät? / Ein Jahr länger / bei der alten Kasse. | Einen Tag zu spät? Dann bleiben Sie ein ganzes Jahr länger bei der alten Kasse. |
| 4 | **Solution** | zahl<br>Foto: brief | 20. November – spätestens aufgeben | Spätestens am zwanzigsten November aufgeben. Dann sind Sie sicher. |
| 5 | **Solution** | titel<br>Figur: lea · laptop | Erst die Zusage / der neuen Kasse. / Dann kündigen. | Erst die schriftliche Zusage der neuen Kasse. Dann kündigen. |
| 6 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** Noch 36 Tage: Am 30. November muss die Kündigung bei der Krankenkasse liegen – nicht unterwegs sein.

### Mythos

12 Folgen. Beispiel: Folge 4.

**Rahmen:** Myth-Busting (Hook → Myth → Truth → Example → CTA)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Myth** | titel<br>Figur: marco · sprechblase | Mythos: | Mythos: Der Poststempel vom dreissigsten November reicht. |
| 2 | **Truth** | titel<br>Figur: marco · sprechblase | Stimmt nicht. / Es zählt der Eingang / bei der Kasse. | Stimmt nicht. Es zählt der Tag, an dem die Kündigung bei der Kasse liegt – nicht der Tag, an dem Sie sie aufgeben. |
| 3 | **Example** | titel<br>Foto: brief | Eingeschrieben. / Ein paar Tage früher. | Eingeschrieben, und ein paar Tage früher. Dann sind Sie sicher. |
| 4 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** «Der Poststempel vom 30. November reicht.» Nein. Es zählt, wann der Brief bei der Kasse liegt.

### Einwand (neu)

5 Folgen. Beispiel: Folge 2 mit echten Zahlen.

**Rahmen:** Objection Handling (Hook → Objection → Reframe → Proof → CTA)

| # | Schritt | Bild | Text im Bild | Stimme |
|---|---|---|---|---|
| 1 | **Objection** | titel<br>Figur: marco · sprechblase | Kennen Sie den Satz? | Kennen Sie den Satz? Für ein paar Franken lohnt sich das nicht. |
| 2 | **Reframe** | titel<br>Figur: lea · zeigen | Es sind keine paar / Franken. Schon unter / den acht günstigsten… | Es sind keine paar Franken. Schon unter den acht günstigsten Angeboten liegen Hunderte Franken im Jahr. |
| 3 | **Proof** | zaehler<br>Foto: genf | Kanton Genf: Platz 1 bis 8 CHF 676 Unterschied im Jahr | In Kanton Genf, nur unter den acht günstigsten Angeboten im Standardmodell: sechshundertsechsundsiebzig Franken im Jahr. |
| 4 | **CTA** | titel<br>Figur: lea · laptop | Vergleichen dauert / eine Minute. | Vergleichen dauert eine Minute. |
| 5 | **CTA** | abbinder | swisspremia.ch · In 1 Minute vergleichen · Link im Profil | Swisspremia Punkt C H. |

**Bildtext, erste Zeile:** «Für ein paar Franken lohnt sich das nicht.» Schon unter den acht günstigsten Angeboten liegen Hunderte Franken im Jahr.

## Stamm-Reels

Fertig vertont; Figuren und Fotos ergänzen einzelne Szenen, die Sprechtexte sind unverändert.

| Reel | Rahmen | Figurenszenen | Fotoszenen |
|---|---|---|---|
| Zwei Termine | Question | s2: briefkasten | s5: kalender |
| Gleiche Leistung, anderer Preis | Claim-Reason-Evidence | s6: laptop | s3: praxis |
| Mit 19 passiert etwas | Problem-Education | s2: torte | s4: jung |
| Franchise in 10 Sekunden | Question | s2: tueren, s7: laptop | s6: rechner |
| New in Switzerland | HPSCA | s3: karton | s2: flagge |
| Der Umzug | Problem-Education | s4: karton | s1: umzug |
| Countdown zum 30. November | HPSCA | s4: laptop | s2: brief |
| Eingeschrieben | Problem-Education | s2: briefkasten | – |
| Der Selbstbehalt | Problem-Education | s1: rechnungen | s4: muenzen |
| Drei Modelle | Claim-Reason-Evidence | s2: telefon, s4: arzt | s3: arzt |
| Prämienregionen | Claim-Reason-Evidence | s2: karton | s3: dorf |
| Familienrabatt | Question | s2: familie | s3: kinder |
| Neugeborene | Problem-Education | s3: baby | s2: baby |
| Unfalldeckung | Problem-Promise | s3: laptop | s1: laptop |
| Prämienverbilligung | Problem-Promise | s1: muenzen | s3: eltern |
| Die Reihenfolge bei der Zusatzversicherung | Problem-Education | s1: denken | s3: stethoskop |
| Das Sparglas | Before-After-Bridge | s3: laptop | s2: muenzstapel |
| Checkliste Kassenwechsel | Problem-Education | s1: zeigen | s3: spital |
| Die zweite Stufe | Problem-Education | s3: denken | s2: jung |
| Alles im Gesetz | Claim-Reason-Evidence | s3: schulter | s2: medikamente |
| Zwei Fenster im Jahr | Question | s2: zeigen | s3: kalender |
