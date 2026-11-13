/* =========================================================================
   Serie «Echt» – 15 Reels mit realistischen Szenen (Higgsfield / Seedance),
   deutscher Stimme (ElevenLabs, Deutsch erzwungen) und Musik.

   Je Reel vier Szenen und ein Abbinder. Jede Szene hat
     bild    was zu sehen ist (englisch, fuer das Videomodell)
     zeilen  Untertitel-Bloecke: t = was im Bild steht (**fett** = Akzent),
             s = was gesprochen wird, falls es abweicht (Zahlen ausgeschrieben,
             «Franschise» fuer die deutsche Aussprache von Franchise)
     zahl    optionale Zahlenkarte { wert, zusatz, quelle }

   Regeln wie im Funnel: keine Kassennamen, keine Beratung, jede Zahl mit
   Quelle (BAG-Praemien 2027, guenstigstes Angebot, Region), Sie-Form,
   Schweizer Schreibweise. Zahlen aus data/praemien.js (Stand 10.11.2026):
   Zuerich (Region 1), Erwachsene, Franchise 300, mit Unfall: Standard 633,
   Hausarzt 535, ohne Unfall 508, junge Erwachsene 385 Franken im Monat.
   ========================================================================= */

/* Gemeinsamer Bildstil aller Clips. */
export const STIL = "Photorealistic documentary footage, vertical. Handheld camera, shallow depth of field, soft natural daylight, 35mm film look, realistic skin texture, calm natural acting, muted natural colours, set in Switzerland. Papers, screens and signs stay out of focus. Laptops, tablets and phones are only seen from the screen side, never their back or lid. No readable text, no logos, no captions, no subtitles, no watermark.";

/* Abbinder: gesprochen und gezeigt. */
export const ABBINDER = {
  zeilen: [{ t: "In 1 Minute vergleichen.", s: "Vergleichen Sie in einer Minute – auf Swisspremia Punkt Ce Ha." }]
};

const Q_ZH = "Günstigstes Angebot, Zürich (Region 1), Erwachsene, Franchise 300, BAG-Prämien 2027";

export const REELS = [
  {
    id: "brief", titel: "Der Brief, den alle weglegen", stufe: "tofu",
    person: "a woman in her mid-thirties with shoulder-length brown hair, wearing a mustard knit sweater",
    szenen: [
      { bild: "In the entrance hall of a Swiss apartment building she takes a white envelope out of a metal letterbox and looks at it.",
        zeilen: [{ t: "Diesen Brief legen die meisten **einfach weg**." }] },
      { bild: "She sits at a wooden kitchen table by the window, unfolds the letter and reads it with a slight frown, a cup of coffee beside her.",
        zeilen: [{ t: "Darin steht Ihre **Prämie für 2027**.", s: "Darin steht Ihre Krankenkassenprämie für nächstes Jahr." }, { t: "Was nicht drinsteht:" }] },
      { bild: "She puts the letter on a small pile of papers and looks thoughtfully out of the window.",
        zeilen: [{ t: "Dieselbe Grundversicherung gibt es anderswo oft **Hunderte Franken günstiger**.", s: "Dieselbe Grundversicherung gibt es anderswo oft Hunderte Franken im Jahr günstiger." }, { t: "Die Leistungen sind per Gesetz **überall gleich**." }] },
      { bild: "She opens a laptop on the kitchen table, starts typing and her face relaxes into a small relieved smile.",
        zeilen: [{ t: "Kündigen können Sie **bis 30. November**.", s: "Kündigen können Sie bis zum dreissigsten November." }] }
    ],
    bildtext: {
      aufhaenger: "Diesen Brief legen die meisten weg. Dabei entscheidet er, was Sie 2027 für dieselbe Leistung zahlen.",
      absaetze: ["Im Herbst teilt Ihre Krankenkasse die neue Prämie mit. Was im Brief nicht steht: Die Leistungen der Grundversicherung sind gesetzlich festgelegt und bei jeder Kasse identisch – der Preis nicht.", "Kündigen können Sie auf Ende Jahr. Die Kündigung muss bis 30. November bei der Kasse eingetroffen sein."],
      hashtags: ["wechsel"]
    }
  },
  {
    id: "eingang", titel: "Abgeschickt ist nicht angekommen", stufe: "bofu",
    person: "an ordinary-looking woman in her early fifties with short auburn hair and freckles, wearing a grey wool coat",
    szenen: [
      { bild: "At a desk at home she folds a letter, slides it into a white envelope and seals it.",
        zeilen: [{ t: "Am 30. November abschicken? **Zu spät.**", s: "Am dreissigsten November abschicken? Zu spät." }] },
      { bild: "She walks briskly along a quiet street with autumn trees, holding the envelope in her hand.",
        zeilen: [{ t: "Ihre Kündigung muss dann schon **bei der Kasse liegen**." }, { t: "Es zählt der Eingang – **nicht der Poststempel**." }] },
      { bild: "At the wooden counter of a small village shop she hands the envelope to a friendly shop assistant.",
        zeilen: [{ t: "Ein Tag zu spät heisst: **ein Jahr länger** bei der alten Kasse." }] },
      { bild: "Outside on the street she stops, takes a deep breath and smiles with relief.",
        zeilen: [{ t: "Darum: **eingeschrieben** – spätestens am 20. November.", s: "Darum: eingeschrieben – und spätestens am zwanzigsten November zur Post." }] }
    ],
    bildtext: {
      aufhaenger: "Am 30. November abschicken ist zu spät: Die Kündigung muss dann bei der Kasse liegen.",
      absaetze: ["Bei der Kündigung der Grundversicherung zählt der Eingang, nicht der Poststempel. Trifft der Brief zu spät ein, bleiben Sie ein weiteres Jahr bei der alten Kasse.", "Sicher sind Sie mit einem eingeschriebenen Brief, den Sie spätestens am 20. November aufgeben. Die Quittung aufbewahren."],
      hashtags: ["wechsel"]
    }
  },
  {
    id: "gleich", titel: "Gleiche Behandlung, anderer Preis", stufe: "tofu",
    person: "a man in his fifties with grey hair and glasses, wearing a dark green cardigan",
    szenen: [
      { bild: "In the bright waiting room of a doctor's practice he sits next to a young woman, both waiting quietly.",
        zeilen: [{ t: "Zwei Patienten. **Dieselbe Behandlung.**" }] },
      { bild: "A female doctor in a white coat listens to his chest with a stethoscope in the consulting room.",
        zeilen: [{ t: "Der eine zahlt dafür **deutlich mehr Prämie** als der andere." }] },
      { bild: "In a pharmacy a pharmacist hands him a small paper bag over the counter.",
        zeilen: [{ t: "Denn die Leistungen der Grundversicherung stehen **im Gesetz**." }, { t: "Sie sind bei jeder Kasse **identisch**." }] },
      { bild: "He walks out onto a sunny street, looks at his phone and smiles.",
        zeilen: [{ t: "Wer mehr zahlt, **bekommt nicht mehr**." }] }
    ],
    bildtext: {
      aufhaenger: "Zwei Patienten, dieselbe Behandlung – und trotzdem zahlt der eine deutlich mehr Prämie.",
      absaetze: ["Der Leistungskatalog der Grundversicherung steht im Krankenversicherungsgesetz. Er ist bei jeder Kasse identisch: dieselben Ärzte, Spitäler, Medikamente.", "Unterschiedlich sind nur Prämie, Modell und Service. Wer mehr zahlt, bekommt in der Grundversicherung nicht mehr."],
      hashtags: []
    }
  },
  {
    id: "sechsundzwanzig", titel: "Mit 26 wird es teurer", stufe: "tofu",
    person: "a young woman in her mid-twenties with long dark-blond hair in a ponytail, wearing a light-blue denim shirt",
    szenen: [
      { bild: "In a cosy flat she blows out the candles on a birthday cake while friends around her clap.",
        zeilen: [{ t: "Mit 26 wird Ihre Krankenkasse **auf einen Schlag teurer**.", s: "Mit sechsundzwanzig wird Ihre Krankenkasse auf einen Schlag teurer." }] },
      { bild: "Later she sits on the sofa, looks at her phone and raises her eyebrows in surprise.",
        zeilen: [{ t: "Der Rabatt für junge Erwachsene **fällt weg** – automatisch." }, { t: "In Zürich sind das rund **CHF 150 mehr pro Monat**.", s: "In Zürich sind das beim günstigsten Angebot rund hundertfünfzig Franken mehr – pro Monat." }],
        zahl: { wert: "+ CHF 150", zusatz: "pro Monat ab 26", quelle: Q_ZH } },
      { bild: "Seen over her shoulder, she sits at a desk typing on a laptop, concentrated, a notebook beside her.",
        zeilen: [{ t: "Genau dann lohnt sich **ein neuer Vergleich**." }] },
      { bild: "Close on her face as she leans back in her chair, satisfied, and takes a sip of tea.",
        zeilen: [{ t: "Denn in jeder Altersklasse ist oft **eine andere Kasse** die günstigste." }] }
    ],
    bildtext: {
      aufhaenger: "Mit 26 steigt die Krankenkassenprämie automatisch – in Zürich um rund CHF 150 im Monat.",
      absaetze: ["Bis 25 gilt die Prämie für junge Erwachsene. Ab dem Jahr, in dem Sie 26 werden, zahlen Sie die Erwachsenenprämie.", "Im Beispiel Zürich kostet das günstigste Angebot für junge Erwachsene CHF 385 im Monat, für Erwachsene CHF 535. Die Rangfolge der Kassen ist in jeder Altersklasse anders – ein neuer Vergleich lohnt sich."],
      quelle: "Zahlen: günstigstes Angebot je Altersklasse, Franchise 300, mit Unfalldeckung, Prämienregion ZH 1 (Zürich), BAG-Prämien 2027, gerundet. Beispielrechnung, keine Beratung.",
      hashtags: ["alter"]
    }
  },
  {
    id: "umzug", titel: "Neue Adresse, neue Prämie", stufe: "tofu",
    person: "a couple in their late twenties: a man with dark curly hair and a beard in a grey hoodie, and a woman with red hair in a bun wearing a striped shirt",
    szenen: [
      { bild: "They carry cardboard moving boxes up the stairwell of an old apartment building.",
        zeilen: [{ t: "Umgezogen? Dann ändert sich vielleicht **Ihre Prämie**." }] },
      { bild: "In an empty sunlit living room they unpack boxes and laugh.",
        zeilen: [{ t: "Die Schweiz ist in **Prämienregionen** eingeteilt." }, { t: "Entscheidend ist **Ihre Wohngemeinde**." }] },
      { bild: "The woman opens a window and looks out over the roofs of a small Swiss town with mountains in the distance.",
        zeilen: [{ t: "Schon ein Umzug ins Nachbardorf kann die Prämie **spürbar ändern**." }] },
      { bild: "They sit on the floor with a laptop on a moving box and give each other a high five.",
        zeilen: [{ t: "Nach dem Zügeln also: **neu vergleichen**." }] }
    ],
    bildtext: {
      aufhaenger: "Umgezogen? Gleiche Kasse, gleiches Modell – und trotzdem kann die Prämie eine andere sein.",
      absaetze: ["Die Kantone sind in bis zu drei Prämienregionen eingeteilt. Welche gilt, bestimmt Ihre Wohngemeinde – nicht Ihre Kasse.", "Nach einem Umzug lohnt sich deshalb ein neuer Vergleich mit der neuen Postleitzahl."],
      hashtags: ["regionen"]
    }
  },
  {
    id: "baby", titel: "Vor der Geburt anmelden", stufe: "tofu",
    person: "a couple in their early thirties: a woman with dark hair wearing a loose cream cardigan, and a man with short brown hair in a grey sweater",
    szenen: [
      { bild: "In a bright nursery they assemble a wooden cot together and laugh.",
        zeilen: [{ t: "Ihr Baby braucht eine Krankenkasse – **am besten schon vor der Geburt**." }] },
      { bild: "Seen over their shoulders, they look at a laptop on the sofa table and she points at the blurred screen.",
        zeilen: [{ t: "Nach der Geburt bleiben **drei Monate** Zeit." }, { t: "Rechtzeitig angemeldet, gilt die Deckung **ab dem ersten Tag**." }] },
      { bild: "Close-up of the woman's hands folding tiny knitted clothes and placing a small pair of woollen socks on a shelf.",
        zeilen: [{ t: "Das Kind muss **nicht zur Kasse der Eltern**." }] },
      { bild: "They stand arm in arm next to the finished cot with a small mobile above it and smile at each other.",
        zeilen: [{ t: "Kinderprämien unterscheiden sich – **vergleichen lohnt sich**." }] }
    ],
    bildtext: {
      aufhaenger: "Ihr Baby braucht eine eigene Grundversicherung – am besten schon vor der Geburt angemeldet.",
      absaetze: ["Nach der Geburt haben Sie drei Monate Zeit. Wer rechtzeitig anmeldet, ist ab dem ersten Lebenstag gedeckt.", "Das Kind muss nicht bei der Kasse der Eltern versichert sein. Jede Kasse muss es in die Grundversicherung aufnehmen, und die Kinderprämien unterscheiden sich."],
      hashtags: ["familie"]
    }
  },
  {
    id: "unfall", titel: "Den Unfall doppelt bezahlt", stufe: "mofu",
    person: "an ordinary-looking woman in her late thirties with curly black hair and round glasses, wearing a rust-coloured blouse",
    szenen: [
      { bild: "She works at a desk in a bright modern open-plan office, typing on a keyboard.",
        zeilen: [{ t: "Angestellt? Dann zahlen Sie den Unfall vielleicht **doppelt**." }] },
      { bild: "She rides a bicycle along a quiet street in the morning light, wearing a helmet.",
        zeilen: [{ t: "Ab **8 Stunden pro Woche** beim selben Arbeitgeber", s: "Ab acht Stunden pro Woche beim selben Arbeitgeber" }, { t: "sind Sie über ihn versichert – **auch in der Freizeit**.", s: "sind Sie über ihn gegen Unfälle versichert – auch in der Freizeit." }] },
      { bild: "Back at her desk she fills in a short paper form and signs it with a pen.",
        zeilen: [{ t: "Die Unfalldeckung der Krankenkasse können Sie dann **ausschliessen**." }] },
      { bild: "During a coffee break she laughs with an older male colleague, holding a cup.",
        zeilen: [{ t: "In Zürich spart das rund **CHF 320 im Jahr**.", s: "In Zürich spart das beim günstigsten Angebot rund dreihundertzwanzig Franken im Jahr." }],
        zahl: { wert: "CHF 320", zusatz: "weniger im Jahr", quelle: Q_ZH } }
    ],
    bildtext: {
      aufhaenger: "Angestellt, mindestens 8 Stunden pro Woche? Dann zahlen Sie die Unfalldeckung vielleicht doppelt.",
      absaetze: ["Wer mindestens acht Stunden pro Woche beim selben Arbeitgeber arbeitet, ist über ihn auch gegen Freizeitunfälle versichert. Die Unfalldeckung in der Grundversicherung können Sie dann ausschliessen.", "Im Beispiel Zürich sinkt die Prämie des günstigsten Angebots von CHF 535 auf CHF 508 im Monat. Endet das Arbeitsverhältnis, die Deckung wieder einschliessen."],
      quelle: "Zahlen: dasselbe günstigste Angebot für Erwachsene, Franchise 300, mit und ohne Unfalldeckung, Prämienregion ZH 1 (Zürich), BAG-Prämien 2027, gerundet. Beispielrechnung, keine Beratung.",
      hashtags: ["unfall"]
    }
  },
  {
    id: "franchise", titel: "300 oder 2'500?", stufe: "mofu",
    person: "an athletic woman in her early forties with a blond ponytail, wearing a dark running jacket",
    szenen: [
      { bild: "She jogs along a lakeside path at sunrise, mountains in the background.",
        zeilen: [{ t: "Selten krank? Dann verschenken Sie vielleicht **Geld**." }] },
      { bild: "She stops, catches her breath and checks her sports watch, the lake behind her.",
        zeilen: [{ t: "Mit der höchsten Franchise sinkt die Prämie um bis zu **CHF 1'540 im Jahr**.", s: "Mit der höchsten Franschise sinkt die Prämie um bis zu eintausendfünfhundertvierzig Franken im Jahr." }],
        zahl: { wert: "CHF 1'540", zusatz: "weniger Prämie im Jahr, höchstens", quelle: "Höchster zulässiger Prämienrabatt bei Franchise 2'500 statt 300 (Erwachsene)" } },
      { bild: "At home at a table she thinks while looking at a few papers and a calculator.",
        zeilen: [{ t: "Der Haken: Die ersten **CHF 2'500** Arztkosten zahlen Sie selbst.", s: "Der Haken: Die ersten zweitausendfünfhundert Franken Arztkosten zahlen Sie selbst." }] },
      { bild: "She drops a few coins into a glass jar on a shelf, screws the lid on and smiles.",
        zeilen: [{ t: "Das lohnt sich nur, wenn Sie dieses Geld **auf der Seite haben**." }] }
    ],
    bildtext: {
      aufhaenger: "Selten krank? Mit der Franchise 2'500 sinkt die Prämie um bis zu CHF 1'540 im Jahr.",
      absaetze: ["Die Kassen dürfen für die höchste Franchise höchstens 70 Prozent des zusätzlich getragenen Risikos als Rabatt geben: bis zu CHF 1'540 im Jahr gegenüber der Franchise 300.", "Dafür zahlen Sie im Krankheitsfall die ersten CHF 2'500 selbst, dazu den Selbstbehalt. Das Geld für den Ernstfall muss vorhanden sein. Die Franchise ändern Sie bis 30. November, ohne die Kasse zu wechseln."],
      quelle: "Beispielrechnung, keine Beratung.",
      hashtags: ["franchise"]
    }
  },
  {
    id: "hausarzt", titel: "Zuerst zum Hausarzt", stufe: "mofu",
    person: "a woman of about sixty with short grey hair, wearing a burgundy scarf",
    szenen: [
      { bild: "She enters a family doctor's practice and a male doctor in his forties in a white coat greets her with a handshake.",
        zeilen: [{ t: "Gehen Sie ohnehin **zuerst zum Hausarzt**?" }] },
      { bild: "In the consulting room the doctor measures her blood pressure while they talk.",
        zeilen: [{ t: "Im Hausarztmodell verpflichten Sie sich genau dazu – und zahlen **weniger Prämie**." }] },
      { bild: "At the reception desk a medical assistant hands her a small appointment card and they both smile.",
        zeilen: [{ t: "In Zürich sind es rund **CHF 1'170 im Jahr**.", s: "In Zürich sind es beim günstigsten Angebot rund eintausendeinhundertsiebzig Franken im Jahr." }],
        zahl: { wert: "CHF 1'170", zusatz: "weniger im Jahr", quelle: Q_ZH + ", Standard- gegen Hausarztmodell" } },
      { bild: "She leaves the practice and walks down a quiet street, looking content.",
        zeilen: [{ t: "Die Leistungen bleiben **dieselben**." }, { t: "Notfälle sind **immer gedeckt**." }] }
    ],
    bildtext: {
      aufhaenger: "Sie gehen ohnehin zuerst zum Hausarzt? Dann zahlen Sie im Standardmodell wahrscheinlich zu viel.",
      absaetze: ["Im Hausarztmodell ist die Hausärztin oder der Hausarzt die erste Anlaufstelle und überweist bei Bedarf weiter. Dafür ist die Prämie tiefer – bei gleichen Leistungen. Notfälle sind immer gedeckt.", "Im Beispiel Zürich kostet das günstigste Angebot im Standardmodell CHF 633 im Monat, im Hausarztmodell CHF 535."],
      quelle: "Zahlen: günstigstes Angebot je Modell, Erwachsene, Franchise 300, mit Unfalldeckung, Prämienregion ZH 1 (Zürich), BAG-Prämien 2027, gerundet. Beispielrechnung, keine Beratung.",
      hashtags: ["modelle"]
    }
  },
  {
    id: "neu", titel: "Neu in der Schweiz", stufe: "tofu",
    person: "a woman in her late twenties with black curly hair, wearing a beige trench coat",
    szenen: [
      { bild: "She walks through the bright hall of a large railway station pulling a suitcase and looks around.",
        zeilen: [{ t: "Neu in der Schweiz? **Die Uhr läuft** – seit dem ersten Tag." }] },
      { bild: "At the counter of a municipal office she hands documents to a clerk.",
        zeilen: [{ t: "Sie haben **drei Monate**, um eine Krankenkasse zu wählen." }, { t: "Die Deckung gilt dann **rückwirkend ab Ihrer Ankunft**." }] },
      { bild: "She unlocks the door of her new apartment and steps inside.",
        zeilen: [{ t: "Wer die Frist verpasst, wird **zugeteilt** – und riskiert einen Zuschlag." }] },
      { bild: "Seen over her shoulder, she sits on the floor of the empty apartment typing on a laptop between moving boxes, then turns her head and smiles.",
        zeilen: [{ t: "Jede Kasse muss Sie aufnehmen – **ohne Gesundheitsfragen**." }] }
    ],
    bildtext: {
      aufhaenger: "Neu in der Schweiz? Für die Krankenkasse haben Sie drei Monate – ab dem Tag der Ankunft.",
      absaetze: ["Die Grundversicherung ist obligatorisch. Wer sich innert drei Monaten nach der Wohnsitznahme versichert, ist rückwirkend ab der Ankunft gedeckt.", "Wer die Frist verpasst, wird einer Kasse zugeteilt und riskiert einen Prämienzuschlag. Jede Kasse muss Sie in die Grundversicherung aufnehmen, ohne Gesundheitsfragen."],
      hashtags: []
    }
  },
  {
    id: "verbilligung", titel: "Geld, das liegen bleibt", stufe: "tofu",
    person: "a family: a mother in her late thirties with a dark bob wearing an olive sweater, a father with a short beard, and two children of about six and nine",
    szenen: [
      { bild: "The family eats dinner together at a kitchen table, warm evening light.",
        zeilen: [{ t: "Viele Haushalte hätten Anspruch auf **Prämienverbilligung**." }, { t: "Und holen sie **nicht ab**." }] },
      { bild: "Later in the evening the mother sits alone at the table sorting bills with a calculator.",
        zeilen: [{ t: "Je nach Kanton kommt sie **nicht automatisch**." }] },
      { bild: "Seen from behind, she types on a laptop at the table while the father stands beside her and looks at the blurred screen.",
        zeilen: [{ t: "Sie müssen **einen Antrag stellen** – die Fristen sind kantonal." }] },
      { bild: "The whole family walks through an autumn park, the children running ahead, everyone relaxed.",
        zeilen: [{ t: "Massgebend sind **Einkommen und Haushalt**." }, { t: "Nachfragen kostet nichts." }] }
    ],
    bildtext: {
      aufhaenger: "Prämienverbilligung: Viele Haushalte hätten Anspruch – und holen sie nicht ab.",
      absaetze: ["Die Prämienverbilligung ist kantonal geregelt. In vielen Kantonen kommt sie nicht automatisch, sondern nur auf Antrag, und die Fristen sind unterschiedlich.", "Massgebend sind Einkommen, Vermögen und Haushaltsgrösse. Auskunft gibt die zuständige Stelle Ihres Wohnkantons."],
      hashtags: ["verbilligung"]
    }
  },
  {
    id: "treue", titel: "20 Jahre treu", stufe: "bofu",
    person: "a couple in their late sixties: a man with white hair in a beige cardigan and a woman with a silver bob in a blue blouse",
    szenen: [
      { bild: "They sit at a dining table with a few ring binders and papers in front of them.",
        zeilen: [{ t: "Seit 20 Jahren bei derselben Krankenkasse?", s: "Seit zwanzig Jahren bei derselben Krankenkasse?" }, { t: "**Dafür gibt es nichts.**" }] },
      { bild: "The man reads a letter through reading glasses and shakes his head slightly.",
        zeilen: [{ t: "In der Grundversicherung wird Treue **nicht belohnt**." }, { t: "Kein Rabatt. Keine besseren Leistungen." }] },
      { bild: "Seen over their shoulders, the woman holds a tablet and they look at the blurred screen together, interested.",
        zeilen: [{ t: "Die günstigste Kasse von damals ist es heute **oft nicht mehr**." }] },
      { bild: "They walk arm in arm along a lakeside promenade in soft afternoon light.",
        zeilen: [{ t: "Wechseln dürfen Sie **in jedem Alter**." }, { t: "Jede Kasse muss Sie aufnehmen." }] }
    ],
    bildtext: {
      aufhaenger: "Seit 20 Jahren bei derselben Krankenkasse? In der Grundversicherung gibt es dafür nichts.",
      absaetze: ["Treue wird in der Grundversicherung nicht belohnt: kein Rabatt, keine besseren Leistungen. Die Leistungen stehen im Gesetz und sind überall gleich.", "Wechseln dürfen Sie in jedem Alter und mit jeder Vorgeschichte. Jede Kasse muss Sie aufnehmen. Bei Zusatzversicherungen gelten andere Regeln."],
      hashtags: ["wechsel"]
    }
  },
  {
    id: "zusatz", titel: "Erst die Zusage, dann kündigen", stufe: "bofu",
    person: "a woman in her mid-forties with dark-blond wavy hair, wearing a white blouse and a grey blazer",
    szenen: [
      { bild: "At a desk she is about to sign a letter with a pen, then hesitates and lifts the pen.",
        zeilen: [{ t: "Dieser Fehler beim Kassenwechsel lässt sich **nicht rückgängig machen**." }] },
      { bild: "She fills in a questionnaire on a clipboard, looking concentrated.",
        zeilen: [{ t: "Die Grundversicherung muss Sie nehmen. Die Zusatzversicherung **nicht**." }, { t: "Sie darf Gesundheitsfragen stellen – **und ablehnen**." }] },
      { bild: "She opens an envelope, reads the letter inside and nods with relief.",
        zeilen: [{ t: "Kündigen Sie die alte Zusatzversicherung erst, wenn die neue **schriftlich zugesagt** hat." }] },
      { bild: "She puts two letters into a folder, closes it and smiles.",
        zeilen: [{ t: "Grund- und Zusatzversicherung dürfen bei **verschiedenen Kassen** sein." }] }
    ],
    bildtext: {
      aufhaenger: "Zusatzversicherung wechseln? Erst die schriftliche Zusage der neuen, dann die alte kündigen.",
      absaetze: ["In der Grundversicherung muss jede Kasse Sie aufnehmen. In der Zusatzversicherung nicht: Sie darf Gesundheitsfragen stellen, Vorbehalte anbringen oder ablehnen.", "Wer zuerst kündigt, steht im schlechtesten Fall ohne Zusatzdeckung da. Grund- und Zusatzversicherung dürfen bei verschiedenen Kassen sein."],
      hashtags: ["zusatz"]
    }
  },
  {
    id: "schritte", titel: "Wechseln in drei Schritten", stufe: "bofu",
    person: "an ordinary-looking man in his late twenties with a round face, short black hair and a full beard, wearing a white t-shirt under an open checked flannel shirt",
    szenen: [
      { bild: "He stands in a tram looking at his phone, the city passing by outside the window.",
        zeilen: [{ t: "Krankenkasse wechseln ist **einfacher, als Sie denken**." }] },
      { bild: "Seen over his shoulder, he sits at a café table typing on a laptop, a cup of coffee beside him.",
        zeilen: [{ t: "Erstens: **vergleichen**." }, { t: "Zweitens: bei der neuen Kasse **anmelden**." }] },
      { bild: "He drops a white envelope into a plain letterbox on a street with autumn leaves.",
        zeilen: [{ t: "Drittens: die alte **eingeschrieben kündigen** – bis 30. November.", s: "Drittens: die alte eingeschrieben kündigen – bis zum dreissigsten November." }] },
      { bild: "At home he leans back on a sofa with a cup of coffee, relaxed and smiling.",
        zeilen: [{ t: "Die neue Kasse meldet sich bei der alten." }, { t: "**Eine Lücke gibt es nicht.**" }] }
    ],
    bildtext: {
      aufhaenger: "Krankenkasse wechseln in drei Schritten – ohne einen Tag ohne Deckung.",
      absaetze: ["Erstens vergleichen. Zweitens bei der neuen Kasse anmelden. Drittens die alte eingeschrieben kündigen, so dass der Brief bis 30. November dort eintrifft.", "Die neue Kasse bestätigt der alten die Aufnahme. Die alte Deckung endet erst, wenn die neue steht – eine Lücke gibt es nicht."],
      hashtags: ["wechsel"]
    }
  },
  {
    id: "offen", titel: "Offene Prämien blockieren", stufe: "bofu",
    person: "an ordinary-looking, slightly stocky man in his early thirties with thinning light-brown hair and stubble, wearing a grey sweater",
    szenen: [
      { bild: "At a desk at home he looks at a small stack of unopened envelopes and rubs his forehead.",
        zeilen: [{ t: "Unbezahlte Prämien können Ihren Kassenwechsel **blockieren**." }] },
      { bild: "He opens the envelopes one by one and lays the letters out on the desk.",
        zeilen: [{ t: "Wer bei der alten Kasse **im Verzug** ist, darf nicht wechseln." }, { t: "Erst wenn alles bezahlt ist." }] },
      { bild: "Seen over his shoulder, he taps on his phone a few times, then leans back and exhales with relief.",
        zeilen: [{ t: "Prüfen Sie vor der Kündigung: **Ist alles beglichen?**" }, { t: "Prämien, Franchise, Selbstbehalt.", s: "Prämien, Franschise, Selbstbehalt." }] },
      { bild: "He folds a letter, slides it into an envelope and smiles.",
        zeilen: [{ t: "Dann steht dem Wechsel **nichts im Weg**." }] }
    ],
    bildtext: {
      aufhaenger: "Unbezahlte Prämien können den Kassenwechsel blockieren – prüfen Sie es vor der Kündigung.",
      absaetze: ["Wer bei der bisherigen Kasse mit Prämien oder Kostenbeteiligungen im Verzug ist, kann den Versicherer nicht wechseln, bis alles samt Zinsen und Betreibungskosten bezahlt ist.", "Vor der Kündigung also prüfen: Sind Prämien, Franchise und Selbstbehalt beglichen?"],
      hashtags: ["wechsel"]
    }
  }
];

/* Gesprochener Text eines Blocks: s, sonst t ohne Auszeichnung. Auf dem
   Bild steht die Schweizer Schreibweise (ss); die Sprechfassung bekommt
   das scharfe S, sonst spricht eine deutsche Stimme den Vokal davor kurz
   («Mass-gebend» statt «Maassgebend»). */
const SCHARF = [["dreissig", "dreißig"], ["Dreissig", "Dreißig"], ["heisst", "heißt"], ["schliessen", "schließen"], ["Massgebend", "Maßgebend"], ["massgebend", "maßgebend"], ["grösste", "größte"], ["Grösste", "Größte"], ["gross", "groß"], ["Gross", "Groß"], ["ausser", "außer"], ["Ausser", "Außer"]];
export const sprich = (z) => SCHARF.reduce((s, [ch, de]) => s.split(ch).join(de), (z.s || z.t).replace(/\*\*/g, ""));

/* Dasselbe fuer die Sprechtexte des Funnels (funnel/stimme.js): scharfes S
   und «Franschise» – so spricht Marcus das Wort deutsch aus, wie in den
   Serien, wo es von Hand so geschrieben ist. */
export const sprechfassung = (text) => SCHARF.reduce((s, [ch, de]) => s.split(ch).join(de), String(text)).replace(/\bFranchise/g, "Franschise");

/* Alle Bloecke eines Reels in Sprechreihenfolge, mit Szenenindex
   (der Abbinder ist die letzte «Szene»). */
export function bloecke(reel) {
  const liste = [];
  reel.szenen.forEach((sz, i) => sz.zeilen.forEach((z) => liste.push({ szene: i, t: z.t, s: sprich(z) })));
  ABBINDER.zeilen.forEach((z) => liste.push({ szene: reel.szenen.length, t: z.t, s: sprich(z) }));
  return liste;
}
export const sprechtext = (reel) => bloecke(reel).map((b) => b.s).join(" ");
