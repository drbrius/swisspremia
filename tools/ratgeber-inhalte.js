/* =========================================================================
   Ratgeber – Inhalte

   Reiner Text, keine Darstellung. Gerendert wird mit tools/build_ratgeber.js.

   Warum getrennt: Die Seiten unterscheiden sich nur im Inhalt, nicht im
   Aufbau. Zwoelf Dateien von Hand zu pflegen hiesse, jede Aenderung an
   Kopf, Navigation oder strukturierten Daten zwoelfmal nachzuziehen.

   Zu den Zahlen: Franchisestufen, Selbstbehalt und Fristen stehen im KVG
   und in der KVV und aendern sich selten. Konkrete Praemien stehen hier
   bewusst NICHT – die gehoeren in den Rechner, wo sie aus den BAG-Daten
   kommen und jaehrlich neu erzeugt werden. Ein Ratgeber mit eingetippten
   Preisen ist nach zwoelf Monaten falsch, ohne dass es jemand merkt.

   Die Regionsangaben stammen aus data/plz.js, also aus denselben
   BAG-Daten wie der Rechner.
   ========================================================================= */
"use strict";

var CTA = '<p class="center-note" style="margin-top:28px"><a class="btn btn-primary" href="/#rechner">Ihre Prämie berechnen</a></p>';

module.exports = [

/* ================================ WECHSELN ============================== */
{
  slug: "krankenkasse-wechseln",
  kategorie: "Wechseln",
  titel: "Krankenkasse wechseln: Fristen, Ablauf und die häufigsten Fehler",
  h1: "Krankenkasse wechseln",
  beschreibung: "Krankenkasse wechseln: Die Kündigung muss bis 30. November bei Ihrer Kasse sein. Ablauf, Fristen und die Fehler, die einen Wechsel scheitern lassen.",
  bild: "photo-1450101499163-c8848c66ca85",
  bildAlt: "Zwei Personen rechnen Unterlagen an einem Tisch durch",
  lead: "Die Grundversicherung ist bei jeder Kasse dieselbe – der Preis nicht. Ein Wechsel ist deshalb eine reine Preisentscheidung. Er scheitert selten am Willen, sondern am Datum.",
  abschnitte: [
    { h2: "Der einzige Termin, der zählt", html:
      '<p>Die Grundversicherung können Sie auf Ende Jahr kündigen. Die Kündigung muss bis spätestens <strong>30. November beim bisherigen Versicherer eingetroffen</strong> sein – eingetroffen, nicht abgeschickt. Der Poststempel hilft Ihnen nicht, wenn der Brief am 2. Dezember ankommt.</p>' +
      '<div class="lp-alert"><span class="ico">📅</span><div>Senden Sie die Kündigung <em>eingeschrieben</em> und bewahren Sie den Beleg auf. Das ist der einzige Nachweis, der im Streitfall zählt.</div></div>' +
      '<p>Der Wechsel wird dann auf den 1. Januar wirksam. Dazwischen liegt kein Tag ohne Deckung: Sie sind bis 31. Dezember bei der alten Kasse versichert und ab 1. Januar bei der neuen.</p>' },
    { h2: "Es gibt einen zweiten Termin – den kaum jemand kennt", html:
      '<p>Wer die <strong>tiefste Franchise im Standardmodell</strong> hat, kann zusätzlich auf Ende Juni kündigen. Die Frist dafür ist der 31. März.</p>' +
      '<p>Das betrifft nur diese Kombination. Wer ein Hausarzt-, HMO- oder Telmed-Modell hat oder eine höhere Franchise, ist an den Novembertermin gebunden.</p>' },
    { h2: "Ablauf in vier Schritten", html:
      '<ol>' +
      '<li><strong>Vergleichen.</strong> Gleiche Leistung, anderer Preis – es geht ausschliesslich um die Prämie, Region, Franchise und Modell.</li>' +
      '<li><strong>Neue Kasse anfragen.</strong> Lassen Sie sich die Aufnahme schriftlich bestätigen, bevor Sie kündigen.</li>' +
      '<li><strong>Kündigen.</strong> Eingeschrieben, rechtzeitig vor dem 30. November.</li>' +
      '<li><strong>Bestätigung prüfen.</strong> Beide Kassen schicken eine Bestätigung. Fehlt eine, nachhaken – nicht abwarten.</li>' +
      '</ol>' },
    { h2: "Was einen Wechsel scheitern lässt", html:
      '<ul>' +
      '<li><strong>Offene Prämien.</strong> Stehen Prämien oder Kostenbeteiligungen aus, kann die Kasse die Kündigung zurückweisen. Zuerst zahlen, dann kündigen.</li>' +
      '<li><strong>Keine Nachfolgeversicherung gemeldet.</strong> Die alte Kasse darf Sie erst entlassen, wenn die neue Deckung feststeht. Niemand darf in der Schweiz unversichert sein.</li>' +
      '<li><strong>Die Zusatzversicherung mitgekündigt.</strong> Der häufigste und teuerste Fehler – dazu <a href="/ratgeber/zusatzversicherung-und-grundversicherung.html">der eigene Ratgeber</a>.</li>' +
      '</ul>' },
    { h2: "Was Sie nicht befürchten müssen", html:
      '<p>Jede Kasse <strong>muss</strong> Sie in der Grundversicherung aufnehmen. Es gibt keine Gesundheitsprüfung, keine Ablehnung wegen Vorerkrankungen, keinen Zuschlag wegen Alter oder Krankengeschichte. Diese Aufnahmepflicht gilt für alle zugelassenen Versicherer.</p>' +
      '<p>Auch der Leistungskatalog ändert sich nicht. Welche Behandlung bezahlt wird, steht im Gesetz, nicht im Vertrag.</p>' + CTA }
  ],
  faq: [
    { f: "Bis wann muss die Kündigung bei der Krankenkasse sein?",
      a: "Bis spätestens 30. November, und zwar eingetroffen, nicht abgeschickt. Der Wechsel wird auf den 1. Januar wirksam." },
    { f: "Kann mich eine Krankenkasse ablehnen?",
      a: "In der Grundversicherung nicht. Jeder zugelassene Versicherer muss jede Person aufnehmen, ohne Gesundheitsprüfung. Bei Zusatzversicherungen ist das anders." },
    { f: "Verliere ich Leistungen, wenn ich zu einer günstigeren Kasse wechsle?",
      a: "Nein. Der Leistungskatalog der Grundversicherung ist gesetzlich festgelegt und bei allen Kassen identisch. Unterschiedlich sind Prämie und Service." },
    { f: "Kann ich auch mitten im Jahr wechseln?",
      a: "Nur mit der tiefsten Franchise im Standardmodell – dann auf Ende Juni, mit Kündigung bis 31. März." }
  ],
  verwandt: ["krankenkasse-kuendigen", "franchise-waehlen", "zusatzversicherung-und-grundversicherung"]
},

{
  slug: "krankenkasse-kuendigen",
  kategorie: "Wechseln",
  titel: "Krankenkasse kündigen: Frist 30. November, Schritt für Schritt",
  h1: "Krankenkasse kündigen",
  beschreibung: "Kündigungsfrist 30. November: Was im Kündigungsschreiben stehen muss, wie Sie den Eingang beweisen und was passiert, wenn Sie den Termin verpassen.",
  bild: "photo-1506784983877-45594efa4cbe",
  bildAlt: "Aufgeschlagener Kalender im November",
  lead: "Eine Kündigung der Grundversicherung ist ein kurzer Brief. Entscheidend ist nicht, was darin steht, sondern wann er ankommt.",
  abschnitte: [
    { h2: "Was im Schreiben stehen muss", html:
      '<p>Mehr als diese Angaben braucht es nicht:</p>' +
      '<ul>' +
      '<li>Ihr Name, Adresse und Geburtsdatum</li>' +
      '<li>Ihre Versichertennummer</li>' +
      '<li>Der Satz, dass Sie die <strong>obligatorische Grundversicherung</strong> auf den 31. Dezember kündigen</li>' +
      '<li>Namen aller Personen, für die die Kündigung gilt – bei Familien ist das der häufigste Fehler</li>' +
      '<li>Datum und Unterschrift</li>' +
      '</ul>' +
      '<div class="lp-alert"><span class="ico">⚠️</span><div>Schreiben Sie ausdrücklich <em>Grundversicherung</em>. Wer nur «meine Versicherung» kündigt, riskiert, dass die Kasse auch die Zusatzversicherungen auflöst.</div></div>' },
    { h2: "Eingang beweisen", html:
      '<p>Die Frist ist eine Eingangsfrist. Es zählt der Tag, an dem der Brief bei der Kasse liegt – nicht der Poststempel und nicht das Datum auf dem Schreiben.</p>' +
      '<p>Schicken Sie deshalb eingeschrieben und planen Sie Puffer ein. Ende November ist bei jeder Kasse die Zeit mit dem höchsten Posteingang. Wer am 28. November aufgibt, hat keinen Spielraum mehr.</p>' +
      '<p>Manche Kassen nehmen Kündigungen auch über das Kundenportal entgegen. Auch dort gilt: Bestätigung herunterladen und aufbewahren.</p>' },
    { h2: "Wenn Sie den Termin verpasst haben", html:
      '<p>Dann bleiben Sie ein weiteres Jahr bei Ihrer Kasse – mit einer Ausnahme: Wer die tiefste Franchise im Standardmodell hat, kann bis 31. März auf Ende Juni kündigen.</p>' +
      '<p>Was Sie auch nach dem 30. November noch ändern können, ist die <a href="/ratgeber/franchise-waehlen.html">Franchise</a> oder das <a href="/ratgeber/versicherungsmodelle.html">Modell</a> innerhalb derselben Kasse – die Fristen dafür legt die Kasse fest, fragen Sie direkt nach. Beides kann schon spürbar etwas bringen, ohne dass Sie den Versicherer wechseln.</p>' },
    { h2: "Nach der Kündigung", html:
      '<p>Sie erhalten eine schriftliche Bestätigung. Kommt innert zwei Wochen keine, rufen Sie an. Eine Kündigung, die niemand bestätigt, ist im Zweifel nie angekommen.</p>' +
      '<p>Die neue Kasse schickt Ihnen Police und Versichertenkarte, meist im Dezember. Die alte Karte können Sie danach vernichten.</p>' + CTA }
  ],
  faq: [
    { f: "Zählt der Poststempel für die Kündigungsfrist?",
      a: "Nein. Massgebend ist der Eingang bei der Krankenkasse bis spätestens 30. November." },
    { f: "Muss ich einen Grund für die Kündigung angeben?",
      a: "Nein. Die Kündigung der Grundversicherung braucht keine Begründung." },
    { f: "Kann ich per E-Mail kündigen?",
      a: "Manche Kassen akzeptieren das Kundenportal, viele verlangen Schriftform mit Unterschrift. Eingeschrieben per Post ist der sichere Weg, weil Sie den Eingang beweisen können." },
    { f: "Was passiert, wenn ich kündige, aber keine neue Kasse habe?",
      a: "Die Kündigung bleibt wirkungslos. Die bisherige Kasse darf Sie erst entlassen, wenn eine Nachfolgeversicherung gemeldet ist – in der Schweiz darf niemand unversichert sein." }
  ],
  verwandt: ["krankenkasse-wechseln", "zusatzversicherung-und-grundversicherung", "franchise-waehlen"]
},

{
  slug: "franchise-waehlen",
  kategorie: "Wechseln",
  titel: "Welche Franchise lohnt sich? Die Rechnung in drei Schritten",
  h1: "Die richtige Franchise wählen",
  beschreibung: "Franchise 300 oder 2500? Die Rechnung ist einfacher, als sie aussieht. Stufen, Selbstbehalt und der Punkt, ab dem sich eine hohe Franchise nicht mehr lohnt.",
  bild: "photo-1454165804606-c3d57bc86b40",
  bildAlt: "Zwei Personen rechnen etwas auf Papier durch",
  lead: "Die Franchise ist die einzige Stellschraube, mit der Sie Ihre Prämie sofort senken können – ohne die Kasse zu wechseln. Sie ist auch die, bei der am meisten falsch gerechnet wird.",
  abschnitte: [
    { h2: "Die Stufen", html:
      '<p>Für Erwachsene gibt es sechs Stufen, für Kinder sieben:</p>' +
      '<table class="rechts-tabelle"><tbody>' +
      '<tr><td><strong>Erwachsene</strong></td><td>CHF 300 · 500 · 1000 · 1500 · 2000 · 2500</td></tr>' +
      '<tr><td><strong>Kinder</strong></td><td>CHF 0 · 100 · 200 · 300 · 400 · 500 · 600</td></tr>' +
      '</tbody></table>' +
      '<p>Je höher die Franchise, desto tiefer die Prämie. Dafür zahlen Sie im Krankheitsfall mehr selbst.</p>' },
    { h2: "Der Selbstbehalt, den viele vergessen", html:
      '<p>Mit der Franchise ist es nicht getan. Über der Franchise zahlen Sie zusätzlich <strong>10 Prozent Selbstbehalt</strong> – bis zu einem Jahresmaximum von CHF 700 für Erwachsene und CHF 350 für Kinder.</p>' +
      '<p>Im schlechtesten Fall zahlen Sie also Franchise plus 700 Franken. Bei einer Franchise von 2500 sind das 3200 Franken, bevor die Kasse alles übernimmt. Bei Spitalaufenthalten kommt ein Beitrag an die Unterkunft dazu.</p>' },
    { h2: "Die Rechnung", html:
      '<p>Drei Schritte, mehr braucht es nicht:</p>' +
      '<ol>' +
      '<li><strong>Prämiendifferenz pro Jahr ausrechnen.</strong> Monatliche Differenz zwischen zwei Franchisestufen mal zwölf.</li>' +
      '<li><strong>Mit der Franchisedifferenz vergleichen.</strong> Zwischen 300 und 2500 liegen 2200 Franken zusätzliches Risiko.</li>' +
      '<li><strong>Ehrlich schätzen.</strong> Was haben Sie in den letzten drei Jahren tatsächlich an Arzt- und Medikamentenkosten gehabt?</li>' +
      '</ol>' +
      '<p>Faustregel: Wer kaum zum Arzt geht, fährt mit der höchsten Franchise meist günstiger. Wer regelmässig Behandlungen oder Medikamente braucht, mit der tiefsten. Dazwischen lohnt sich die Rechnung wirklich – die mittleren Stufen sind oft die schlechteste Wahl.</p>' },
    { h2: "Zwei Dinge, die gegen eine hohe Franchise sprechen", html:
      '<ul>' +
      '<li><strong>Sie brauchen das Geld liquide.</strong> Eine Franchise von 2500 nützt nichts, wenn die Rechnung im Februar kommt und das Konto leer ist.</li>' +
      '<li><strong>Sie wollen flexibel bleiben.</strong> Nur mit der <em>tiefsten</em> Franchise im Standardmodell dürfen Sie auch auf Ende Juni kündigen.</li>' +
      '</ul>' +
      '<p>Die Franchise können Sie in der Regel auf den 1. Januar ändern, ohne die Kasse zu wechseln. Fragen Sie bei Ihrer Kasse nach der genauen Frist.</p>' + CTA }
  ],
  faq: [
    { f: "Welche Franchise ist die günstigste?",
      a: "Das hängt von Ihren Gesundheitskosten ab. Wer pro Jahr weniger ausgibt als die Prämienersparnis gegenüber der tiefsten Stufe, fährt mit einer hohen Franchise besser." },
    { f: "Was ist der Selbstbehalt?",
      a: "Zehn Prozent der Kosten oberhalb der Franchise, höchstens CHF 700 pro Jahr für Erwachsene und CHF 350 für Kinder." },
    { f: "Kann ich die Franchise ändern, ohne die Kasse zu wechseln?",
      a: "Ja, in der Regel auf den 1. Januar. Die genaue Meldefrist legt Ihre Kasse fest." },
    { f: "Welche Franchise haben Kinder?",
      a: "Für Kinder gibt es die Stufen 0, 100, 200, 300, 400, 500 und 600 Franken. Die Stufe 0 bedeutet: keine Franchise, aber trotzdem Selbstbehalt." }
  ],
  verwandt: ["versicherungsmodelle", "krankenkasse-wechseln", "krankenkasse-kinder"]
},

{
  slug: "versicherungsmodelle",
  kategorie: "Wechseln",
  titel: "Standard, Hausarzt, HMO oder Telmed: welches Modell zu Ihnen passt",
  h1: "Die Versicherungsmodelle im Vergleich",
  beschreibung: "Hausarzt-, HMO- und Telmed-Modelle senken die Prämie gegen eine Einschränkung bei der Arztwahl. Was die Modelle unterscheidet und für wen sich welches eignet.",
  bild: "photo-1556742049-0cfed4f6a45d",
  bildAlt: "Beratungsgespräch an einem Tresen",
  lead: "Nach der Franchise ist das Modell die zweite Stellschraube. Sie tauschen ein Stück freie Arztwahl gegen eine tiefere Prämie – und merken im Alltag oft nichts davon.",
  abschnitte: [
    { h2: "Die vier gängigen Modelle", html:
      '<table class="rechts-tabelle"><tbody>' +
      '<tr><td><strong>Standard</strong></td><td>Freie Arztwahl. Teuerste Variante, dafür keine Einschränkung.</td></tr>' +
      '<tr><td><strong>Hausarzt</strong></td><td>Sie wählen eine Praxis als erste Anlaufstelle. Überweisung zum Spezialisten läuft über sie.</td></tr>' +
      '<tr><td><strong>HMO</strong></td><td>Erste Anlaufstelle ist eine Gruppenpraxis. Meist der grösste Rabatt, aber nur in Gebieten mit solchen Zentren.</td></tr>' +
      '<tr><td><strong>Telmed</strong></td><td>Vor jedem Arztbesuch rufen Sie eine medizinische Beratungsstelle an.</td></tr>' +
      '</tbody></table>' +
      '<p>Einige Kassen bieten zusätzlich Apotheken-Modelle, bei denen die Apotheke die erste Station ist. Welche Modelle verfügbar sind, unterscheidet sich je nach Kasse und Wohnort.</p>' },
    { h2: "Was der Verzicht wert ist", html:
      '<p>Wie gross der Rabatt ausfällt, legt jede Kasse selbst fest, und er fällt je nach Region unterschiedlich aus. Zwischen Standard- und HMO-Modell liegen bei vielen Kassen zweistellige Prozentsätze.</p>' +
      '<p>Darum lohnt es sich, Modell und Franchise nicht getrennt zu betrachten: Ein Hausarztmodell mit mittlerer Franchise kann günstiger sein als das Standardmodell mit der höchsten.</p>' },
    { h2: "Woran die Wahl in der Praxis scheitert", html:
      '<ul>' +
      '<li><strong>Sie haben ohnehin einen Hausarzt.</strong> Dann kostet Sie das Hausarztmodell gar nichts – prüfen Sie nur, ob Ihre Praxis bei der Kasse gelistet ist.</li>' +
      '<li><strong>Sie gehen direkt zum Spezialisten.</strong> Wer regelmässig ohne Überweisung zum Dermatologen oder Orthopäden geht, verliert mit eingeschränkten Modellen Zeit.</li>' +
      '<li><strong>Sie wohnen ländlich.</strong> HMO-Zentren gibt es vor allem in Städten und Agglomerationen.</li>' +
      '</ul>' +
      '<p>Notfälle sind in allen Modellen gedeckt. Auch Gynäkologie und Augenarzt sind bei vielen Kassen von der Überweisungspflicht ausgenommen – das steht in den Versicherungsbedingungen, nicht im Gesetz. Fragen Sie konkret nach.</p>' + CTA }
  ],
  faq: [
    { f: "Welches Versicherungsmodell ist am günstigsten?",
      a: "Meistens das HMO-Modell, gefolgt von Telmed und Hausarzt. Die genauen Rabatte legt jede Kasse selbst fest und sie unterscheiden sich je nach Region." },
    { f: "Was passiert im Notfall bei einem Hausarztmodell?",
      a: "Notfälle sind in allen Modellen gedeckt. Die Überweisungspflicht gilt für planbare Behandlungen." },
    { f: "Kann ich das Modell wechseln, ohne die Kasse zu wechseln?",
      a: "Ja, in der Regel auf den 1. Januar. Die Meldefrist legt Ihre Kasse fest." },
    { f: "Ändert sich der Leistungsumfang mit dem Modell?",
      a: "Nein. Welche Leistungen die Grundversicherung bezahlt, ist gesetzlich festgelegt. Das Modell regelt nur den Weg dorthin." }
  ],
  verwandt: ["franchise-waehlen", "krankenkasse-wechseln", "praemienregionen"]
},

{
  slug: "zusatzversicherung-und-grundversicherung",
  kategorie: "Wechseln",
  titel: "Zusatzversicherung und Grundversicherung: zwei Verträge, zwei Regeln",
  h1: "Zusatzversicherung und Grundversicherung trennen",
  beschreibung: "Grundversicherung und Zusatzversicherung folgen unterschiedlichen Gesetzen, Fristen und Aufnahmeregeln. Der häufigste und teuerste Fehler beim Kassenwechsel.",
  bild: "photo-1521737711867-e3b97375f902",
  bildAlt: "Personen besprechen Unterlagen am Laptop",
  lead: "Beide stehen auf derselben Police, oft bei derselben Kasse. Rechtlich haben sie fast nichts miteinander zu tun – und genau daran scheitern Wechsel.",
  abschnitte: [
    { h2: "Der Unterschied in einem Satz", html:
      '<table class="rechts-tabelle"><tbody>' +
      '<tr><td><strong>Grundversicherung</strong></td><td>Obligatorisch, Leistungen gesetzlich festgelegt, Aufnahmepflicht ohne Gesundheitsprüfung, Kündigung auf 31. Dezember.</td></tr>' +
      '<tr><td><strong>Zusatzversicherung</strong></td><td>Freiwillig, Leistungen vertraglich vereinbart, Aufnahme nur nach Gesundheitsprüfung, eigene Kündigungsfristen.</td></tr>' +
      '</tbody></table>' +
      '<p>Die Grundversicherung folgt dem Krankenversicherungsgesetz, die Zusatzversicherung dem Versicherungsvertragsgesetz. Zwei Gesetze, zwei Logiken.</p>' },
    { h2: "Der Fehler, der teuer wird", html:
      '<div class="lp-alert"><span class="ico">⚠️</span><div>Kündigen Sie die Zusatzversicherung <em>niemals</em>, bevor eine neue schriftlich zugesagt ist. Anders als bei der Grundversicherung darf ein Versicherer Sie ablehnen.</div></div>' +
      '<p>Wer mit 50 eine Zusatzversicherung kündigt und dann eine Vorerkrankung angeben muss, bekommt sie womöglich nirgends mehr – oder nur mit Vorbehalten. Dieser Schritt ist in der Praxis nicht umkehrbar.</p>' +
      '<p>Der umgekehrte Weg ist unproblematisch: Sie dürfen die Grundversicherung wechseln und die Zusatzversicherung bei der alten Kasse behalten. Das ist ausdrücklich erlaubt, auch wenn manche Kassen es ungern hören.</p>' },
    { h2: "Fristen", html:
      '<p>Die Kündigungsfristen für Zusatzversicherungen stehen im Vertrag, nicht im Gesetz. Üblich sind drei Monate auf Ende Jahr, also Ende September – aber es gibt mehrjährige Verträge und abweichende Termine.</p>' +
      '<p>Schauen Sie in Ihre Police, bevor Sie planen. Wer im November merkt, dass die Zusatzversicherung schon im September hätte gekündigt werden müssen, hat ein Jahr verloren.</p>' },
    { h2: "Praktisches Vorgehen", html:
      '<ol>' +
      '<li>Zuerst klären, ob Sie die Zusatzversicherung überhaupt wechseln wollen – oft lohnt nur der Wechsel der Grundversicherung.</li>' +
      '<li>Falls ja: neue Zusatzversicherung beantragen, Gesundheitsfragen ehrlich beantworten, schriftliche Zusage abwarten.</li>' +
      '<li>Erst dann die alte kündigen.</li>' +
      '<li>Die Grundversicherung separat und ausdrücklich kündigen.</li>' +
      '</ol>' + CTA }
  ],
  faq: [
    { f: "Kann ich die Grundversicherung wechseln und die Zusatzversicherung behalten?",
      a: "Ja. Beide Verträge sind rechtlich unabhängig, auch wenn sie bei derselben Kasse laufen." },
    { f: "Wird die Zusatzversicherung automatisch mitgekündigt?",
      a: "Nein, und sie darf es auch nicht. Schreiben Sie in der Kündigung trotzdem ausdrücklich, dass nur die Grundversicherung gemeint ist." },
    { f: "Kann mich eine Zusatzversicherung ablehnen?",
      a: "Ja. Dort gilt keine Aufnahmepflicht, es gibt eine Gesundheitsprüfung, und Ablehnungen oder Vorbehalte sind möglich." },
    { f: "Bis wann muss ich die Zusatzversicherung kündigen?",
      a: "Das steht in Ihrem Vertrag. Üblich sind drei Monate auf Ende Jahr, also Ende September, aber es gibt Ausnahmen." }
  ],
  verwandt: ["krankenkasse-kuendigen", "krankenkasse-wechseln", "franchise-waehlen"]
},

/* ================================= REGION =============================== */
{
  slug: "praemienregionen",
  kategorie: "Region",
  titel: "Prämienregionen der Schweiz: warum Ihr Wohnort den Preis bestimmt",
  h1: "Prämienregionen verstehen",
  beschreibung: "Dieselbe Kasse, dasselbe Modell, dieselbe Franchise – und trotzdem ein anderer Preis. Wie die Prämienregionen funktionieren und was ein Umzug bedeutet.",
  bild: "photo-1568605114967-8130f3a36994",
  bildAlt: "Beleuchtetes Haus in der Dämmerung",
  lead: "Die Grundversicherung kostet nicht überall gleich viel. Nicht weil die Leistungen anders wären, sondern weil die Gesundheitskosten regional stark auseinanderliegen.",
  abschnitte: [
    { h2: "Wie die Einteilung funktioniert", html:
      '<p>Das Eidgenössische Departement des Innern teilt jeden Kanton in <strong>höchstens drei Prämienregionen</strong> ein. Massgebend ist Ihre Wohnsitzgemeinde, nicht Ihr Arbeitsort und nicht Ihre Postadresse.</p>' +
      '<p>Nicht jeder Kanton nutzt alle drei. Einige haben nur eine einzige Region – dort kostet dieselbe Versicherung im ganzen Kanton gleich viel. Andere, etwa Zürich, Bern, Luzern und St. Gallen, haben drei.</p>' +
      '<p>In der Regel ist Region 1 die Stadt oder Agglomeration mit den höchsten Kosten, Region 3 der ländliche Raum.</p>' },
    { h2: "Wie gross der Unterschied ist", html:
      '<p>Zwischen Region 1 und Region 3 desselben Kantons liegen bei gleicher Kasse, gleichem Modell und gleicher Franchise oft mehrere hundert Franken pro Jahr. Über eine Familie gerechnet wird daraus schnell ein vierstelliger Betrag.</p>' +
      '<p>Das ist kein Spielraum, den Sie verhandeln können – die Region steht fest. Was Sie beeinflussen können, ist die Wahl der Kasse <em>innerhalb</em> Ihrer Region. Und dort sind die Unterschiede meist noch grösser.</p>' },
    { h2: "Was bei einem Umzug passiert", html:
      '<p>Ziehen Sie in eine andere Gemeinde, kann sich Ihre Prämienregion ändern – auch innerhalb desselben Kantons. Melden Sie den Umzug Ihrer Kasse; sie passt die Prämie an.</p>' +
      '<p>Dass sich Ihre Prämie durch den Umzug ändert, berechtigt Sie nicht automatisch zu einem ausserordentlichen Kassenwechsel. Dafür gelten die normalen Fristen. Eine Ausnahme kann greifen, wenn Ihre Kasse am neuen Wohnort gar nicht tätig ist – einige Versicherer arbeiten nur in bestimmten Kantonen. Fragen Sie in dem Fall direkt bei der Kasse nach.</p>' +
      '<p>Mehr dazu im Ratgeber <a href="/ratgeber/umzug-und-krankenkasse.html">Umzug und Krankenkasse</a>.</p>' + CTA }
  ],
  faq: [
    { f: "Wie viele Prämienregionen gibt es pro Kanton?",
      a: "Höchstens drei. Wie viele ein Kanton tatsächlich nutzt, legt das Eidgenössische Departement des Innern fest – manche Kantone haben nur eine." },
    { f: "Welche Prämienregion gilt für mich?",
      a: "Die Ihrer Wohnsitzgemeinde. Im Prämienrechner genügt die Postleitzahl, dann wird die Region automatisch bestimmt." },
    { f: "Warum ist die Krankenkasse in der Stadt teurer?",
      a: "Weil die Gesundheitskosten dort höher sind – mehr Spitäler, mehr Spezialisten, mehr Behandlungen pro Kopf. Die Prämienregionen bilden diesen Unterschied ab." },
    { f: "Ändert sich meine Prämie, wenn ich umziehe?",
      a: "Wenn die neue Gemeinde in einer anderen Prämienregion liegt, ja. Melden Sie den Umzug Ihrer Kasse." }
  ],
  verwandt: ["krankenkasse-zuerich", "krankenkasse-bern", "umzug-und-krankenkasse"]
},

{
  slug: "krankenkasse-zuerich",
  kategorie: "Region",
  titel: "Krankenkasse im Kanton Zürich: drei Prämienregionen, drei Preise",
  h1: "Krankenkasse im Kanton Zürich",
  beschreibung: "Der Kanton Zürich hat drei Prämienregionen. Welche Gemeinden wohin gehören und warum dieselbe Kasse in Zürich anders kostet als im Zürcher Oberland.",
  bild: "photo-1523240795612-9a054b0db644",
  bildAlt: "Junge Erwachsene an einem Tisch mit Laptop",
  lead: "Zürich nutzt alle drei zulässigen Prämienregionen. Zwischen der Stadt und dem ländlichen Kantonsteil liegt deshalb eine spürbare Differenz – bei identischen Leistungen.",
  abschnitte: [
    { h2: "Die drei Regionen", html:
      '<p>Die Einteilung folgt der Wohnsitzgemeinde:</p>' +
      '<table class="rechts-tabelle"><tbody>' +
      '<tr><td><strong>Region 1</strong></td><td>Stadt Zürich und direkt angrenzende Gemeinden, darunter Adliswil, Zollikerberg, Glattbrugg und Uitikon Waldegg.</td></tr>' +
      '<tr><td><strong>Region 2</strong></td><td>Weiteres Agglomerationsgebiet, darunter Regensdorf, Fällanden, Gockhausen und Pfaffhausen – rund 80 Ortschaften.</td></tr>' +
      '<tr><td><strong>Region 3</strong></td><td>Der übrige Kanton, darunter Buchs ZH, Weiningen ZH, Oberengstringen und Unterengstringen – über 200 Ortschaften.</td></tr>' +
      '</tbody></table>' +
      '<p>Einzelne Postleitzahlen fallen je nach Ortsteil in unterschiedliche Regionen. Verlassen Sie sich nicht auf die Nachbargemeinde, sondern prüfen Sie Ihre eigene PLZ.</p>' },
    { h2: "Was das für Ihre Prämie heisst", html:
      '<p>Region 1 ist die teuerste, Region 3 die günstigste. Der Unterschied entsteht nicht durch bessere oder schlechtere Leistungen – die sind überall gesetzlich identisch – sondern durch die regionalen Gesundheitskosten.</p>' +
      '<p>Wichtiger als die Region ist allerdings die Wahl der Kasse. Innerhalb derselben Zürcher Region liegen zwischen der günstigsten und der teuersten Kasse regelmässig mehr als tausend Franken im Jahr. Diese Differenz können Sie beeinflussen, die Region nicht.</p>' },
    { h2: "Zürich-spezifisch", html:
      '<ul>' +
      '<li><strong>HMO-Modelle sind gut verfügbar.</strong> In der Agglomeration gibt es viele Gruppenpraxen – das macht die günstigsten Modelle zugänglich, anders als in ländlichen Kantonen.</li>' +
      '<li><strong>Viele Kassen sind aktiv.</strong> Zürich ist für Versicherer ein Kernmarkt, entsprechend gross ist die Auswahl.</li>' +
      '<li><strong>Prämienverbilligung.</strong> Der Kanton zahlt einkommensabhängige Beiträge. Zuständig ist die Sozialversicherungsanstalt des Kantons Zürich.</li>' +
      '</ul>' + CTA }
  ],
  faq: [
    { f: "Wie viele Prämienregionen hat der Kanton Zürich?",
      a: "Drei. Region 1 umfasst die Stadt Zürich und direkt angrenzende Gemeinden, Region 2 das weitere Agglomerationsgebiet, Region 3 den übrigen Kanton." },
    { f: "In welcher Prämienregion liegt die Stadt Zürich?",
      a: "In Region 1, der teuersten des Kantons." },
    { f: "Lohnt sich ein Kassenwechsel im Kanton Zürich?",
      a: "In der Regel ja. Innerhalb derselben Region liegen zwischen günstigster und teuerster Kasse oft über tausend Franken pro Jahr, bei gesetzlich identischen Leistungen." },
    { f: "Wo beantrage ich im Kanton Zürich die Prämienverbilligung?",
      a: "Bei der Sozialversicherungsanstalt des Kantons Zürich. Der Anspruch hängt vom steuerbaren Einkommen ab." }
  ],
  verwandt: ["praemienregionen", "krankenkasse-bern", "versicherungsmodelle"]
},

{
  slug: "krankenkasse-bern",
  kategorie: "Region",
  titel: "Krankenkasse im Kanton Bern: Regionen, Besonderheiten, Sparpotenzial",
  h1: "Krankenkasse im Kanton Bern",
  beschreibung: "Der Kanton Bern ist in drei Prämienregionen eingeteilt. Welche Orte dazugehören, was der zweisprachige Kantonsteil bedeutet und wo das Sparpotenzial liegt.",
  bild: "photo-1494526585095-c41746248156",
  bildAlt: "Beleuchteter Hauseingang in der Dämmerung",
  lead: "Bern ist flächenmässig gross und sehr unterschiedlich besiedelt. Entsprechend deutlich fallen die Unterschiede zwischen den drei Prämienregionen aus.",
  abschnitte: [
    { h2: "Die drei Regionen", html:
      '<table class="rechts-tabelle"><tbody>' +
      '<tr><td><strong>Region 1</strong></td><td>Stadt Bern, Biel/Bienne und das nähere Umland, darunter Hinterkappelen, Wohlen bei Bern und Evilard – rund 40 Ortschaften.</td></tr>' +
      '<tr><td><strong>Region 2</strong></td><td>Der grösste Teil des Kantons, rund 350 Ortschaften, vom Berner Jura bis ins Mittelland.</td></tr>' +
      '<tr><td><strong>Region 3</strong></td><td>Ländliche Gebiete, darunter Herzogenbuchsee, Niederönz, Grasswil und Seeberg – rund 200 Ortschaften.</td></tr>' +
      '</tbody></table>' +
      '<p>Dass Biel/Bienne in Region 1 liegt, überrascht manche: Massgebend sind die Gesundheitskosten, nicht die Einwohnerzahl.</p>' },
    { h2: "Zweisprachigkeit und Kassenwahl", html:
      '<p>Im Berner Jura und in Biel/Bienne wird französisch gesprochen. Nicht jede Kasse bietet Beratung und Unterlagen in beiden Sprachen in gleicher Qualität an. Wenn Ihnen das wichtig ist, klären Sie es vor dem Wechsel – an der Prämie ändert es nichts, am Alltag schon.</p>' },
    { h2: "Wo das Sparpotenzial liegt", html:
      '<p>Wie überall gilt: Der Unterschied zwischen den Kassen ist grösser als der zwischen den Regionen. Dazu kommt im Kanton Bern, dass im ländlichen Raum HMO-Zentren fehlen – das günstigste Modell steht dort oft gar nicht zur Verfügung.</p>' +
      '<p>Realistischer Hebel im Berner Mittelland und Oberland ist deshalb meist das <a href="/ratgeber/versicherungsmodelle.html">Hausarztmodell</a> in Kombination mit einer passenden <a href="/ratgeber/franchise-waehlen.html">Franchise</a>.</p>' +
      '<p>Die Prämienverbilligung läuft im Kanton Bern über die Gesundheits-, Sozial- und Integrationsdirektion.</p>' + CTA }
  ],
  faq: [
    { f: "Wie viele Prämienregionen hat der Kanton Bern?",
      a: "Drei. Region 1 umfasst Bern, Biel/Bienne und das nähere Umland, Region 2 den grössten Teil des Kantons, Region 3 ländliche Gebiete." },
    { f: "In welcher Prämienregion liegt die Stadt Bern?",
      a: "In Region 1, zusammen mit Biel/Bienne und dem näheren Umland." },
    { f: "Gibt es im Kanton Bern HMO-Modelle?",
      a: "In Bern und Biel ja, im ländlichen Raum oft nicht. Dort ist meist das Hausarztmodell die günstigste verfügbare Variante." },
    { f: "Wer ist im Kanton Bern für die Prämienverbilligung zuständig?",
      a: "Die Gesundheits-, Sozial- und Integrationsdirektion des Kantons Bern." }
  ],
  verwandt: ["praemienregionen", "krankenkasse-zuerich", "versicherungsmodelle"]
},

{
  slug: "umzug-und-krankenkasse",
  kategorie: "Region",
  titel: "Umzug: was mit Ihrer Krankenkasse passiert",
  h1: "Umzug und Krankenkasse",
  beschreibung: "Nach einem Umzug kann sich die Prämie ändern, auch innerhalb desselben Kantons. Was Sie melden müssen, was sich automatisch anpasst und wann ein Wechsel möglich ist.",
  bild: "photo-1476703993599-0035a21b17a9",
  bildAlt: "Familie zu Hause auf dem Sofa",
  lead: "Beim Umzug denkt kaum jemand an die Krankenkasse. Dabei kann sich die Prämie durch nichts anderes als die neue Adresse ändern – nach oben wie nach unten.",
  abschnitte: [
    { h2: "Was Sie melden müssen", html:
      '<p>Teilen Sie Ihrer Kasse die neue Adresse mit, sobald sie feststeht. Die Kasse prüft, in welche <a href="/ratgeber/praemienregionen.html">Prämienregion</a> die neue Gemeinde fällt, und passt die Prämie an.</p>' +
      '<p>Das geschieht nicht automatisch über die Einwohnerkontrolle. Wer die Meldung vergisst, zahlt unter Umständen monatelang den falschen Betrag – und bekommt die Differenz nachbelastet.</p>' },
    { h2: "Wann sich die Prämie ändert", html:
      '<ul>' +
      '<li><strong>Umzug innerhalb der Gemeinde:</strong> keine Änderung.</li>' +
      '<li><strong>Umzug in eine andere Gemeinde derselben Region:</strong> keine Änderung.</li>' +
      '<li><strong>Umzug in eine andere Prämienregion:</strong> die Prämie ändert sich, auch innerhalb desselben Kantons.</li>' +
      '<li><strong>Umzug in einen anderen Kanton:</strong> fast immer eine Änderung, oft deutlich.</li>' +
      '</ul>' },
    { h2: "Kassenwechsel beim Umzug", html:
      '<p>Ein Umzug berechtigt Sie nicht automatisch zu einem ausserordentlichen Wechsel. Grundsätzlich gelten die normalen Fristen – Kündigung bis 30. November auf Ende Jahr.</p>' +
      '<p>Anders liegt der Fall, wenn Ihre Kasse am neuen Wohnort gar nicht tätig ist. Einige Versicherer arbeiten nur in bestimmten Kantonen. Klären Sie das direkt mit Ihrer Kasse, bevor Sie umziehen.</p>' +
      '<div class="lp-alert"><span class="ico">💡</span><div>Ein Umzug ist trotzdem ein guter Anlass zum Rechnen. Wenn Sie ohnehin im Herbst umziehen, fällt der neue Wohnort mit der <em>Kündigungsfrist Ende November</em> zusammen.</div></div>' },
    { h2: "Prämienverbilligung nicht vergessen", html:
      '<p>Die Prämienverbilligung ist kantonal geregelt. Bei einem Kantonswechsel müssen Sie sie im neuen Kanton neu beantragen – Ansprüche werden nicht übertragen, und die Bedingungen unterscheiden sich erheblich.</p>' + CTA }
  ],
  faq: [
    { f: "Muss ich meiner Krankenkasse einen Umzug melden?",
      a: "Ja. Die Kasse erfährt den Wohnortwechsel nicht automatisch und passt die Prämie erst nach Ihrer Meldung an." },
    { f: "Kann ich wegen eines Umzugs die Krankenkasse wechseln?",
      a: "Nicht automatisch. Es gelten die normalen Fristen. Eine Ausnahme kann gelten, wenn Ihre Kasse am neuen Wohnort nicht tätig ist." },
    { f: "Ändert sich die Prämie bei einem Umzug innerhalb des Kantons?",
      a: "Nur wenn die neue Gemeinde in einer anderen Prämienregion liegt. Das kommt innerhalb eines Kantons durchaus vor." },
    { f: "Was passiert mit der Prämienverbilligung bei einem Kantonswechsel?",
      a: "Sie müssen sie im neuen Kanton neu beantragen. Die Regeln sind kantonal unterschiedlich." }
  ],
  verwandt: ["praemienregionen", "krankenkasse-wechseln", "krankenkasse-zuerich"]
},

/* ================================== ALTER =============================== */
{
  slug: "krankenkasse-kinder",
  kategorie: "Alter",
  titel: "Krankenkasse für Kinder: Franchise, Prämien und was Eltern wissen müssen",
  h1: "Krankenkasse für Kinder",
  beschreibung: "Kinder zahlen eigene Prämien und haben eigene Franchisestufen ab null Franken. Was bei Neugeborenen gilt, welche Rabatte es gibt und worauf Eltern achten sollten.",
  bild: "photo-1543342384-1f1350e27861",
  bildAlt: "Eltern mit einem Neugeborenen",
  lead: "Kinder sind in der Grundversicherung eigenständig versichert, mit eigener Prämie und eigenen Franchisestufen. Für Eltern ist vor allem der Zeitpunkt wichtig.",
  abschnitte: [
    { h2: "Neugeborene: die Drei-Monats-Frist", html:
      '<p>Ihr Kind muss innert drei Monaten nach der Geburt versichert sein. Melden Sie es rechtzeitig an, gilt die Deckung <strong>rückwirkend ab dem Geburtstag</strong> – auch für Behandlungen, die vorher angefallen sind.</p>' +
      '<div class="lp-alert"><span class="ico">👶</span><div>Für die <em>Zusatzversicherung</em> lohnt sich der Abschluss schon vor der Geburt. Danach ist eine Gesundheitsprüfung möglich, und angeborene Besonderheiten können zu Vorbehalten führen.</div></div>' +
      '<p>In der Grundversicherung gilt die Aufnahmepflicht auch für Säuglinge – dort kann Ihr Kind nicht abgelehnt werden.</p>' },
    { h2: "Franchise bei Kindern", html:
      '<p>Für Kinder gibt es sieben Stufen: 0, 100, 200, 300, 400, 500 und 600 Franken. Die Stufe 0 bedeutet keine Franchise – der <strong>Selbstbehalt von 10 Prozent</strong> fällt trotzdem an, begrenzt auf 350 Franken im Jahr.</p>' +
      '<p>Weil die Prämienersparnis bei Kindern im Verhältnis klein ist und Kinder häufiger zum Arzt müssen als Erwachsene, fahren Familien mit der Franchise 0 oft besser. Rechnen Sie es durch, bevor Sie eine höhere Stufe wählen.</p>' },
    { h2: "Rabatte für Familien", html:
      '<p>Die meisten Kassen gewähren ab dem zweiten oder dritten Kind einen Rabatt auf die Kinderprämien. Wie hoch er ausfällt und ab welchem Kind er greift, legt jede Kasse selbst fest – hier lohnt der Vergleich besonders.</p>' +
      '<p>Kinder müssen <strong>nicht</strong> bei derselben Kasse versichert sein wie die Eltern. Oft ist es günstiger, alle bei derselben Kasse zu haben, weil der Familienrabatt sonst entfällt. Nachrechnen schlägt Annehmen.</p>' },
    { h2: "Was mit 18 passiert", html:
      '<p>Mit dem Übergang in die nächste Altersklasse steigt die Prämie deutlich. Dieser Sprung kommt für viele Familien überraschend – mehr dazu im Ratgeber <a href="/ratgeber/krankenkasse-junge-erwachsene.html">Mit 19 steigt die Prämie</a>.</p>' + CTA }
  ],
  faq: [
    { f: "Bis wann muss ein Neugeborenes versichert sein?",
      a: "Innert drei Monaten nach der Geburt. Bei rechtzeitiger Anmeldung gilt die Deckung rückwirkend ab dem Geburtstag." },
    { f: "Welche Franchise gilt für Kinder?",
      a: "Die Stufen 0, 100, 200, 300, 400, 500 und 600 Franken. Der Selbstbehalt beträgt 10 Prozent, höchstens 350 Franken im Jahr." },
    { f: "Müssen Kinder bei derselben Krankenkasse sein wie die Eltern?",
      a: "Nein. Oft lohnt es sich trotzdem, weil Familienrabatte meist nur innerhalb derselben Kasse gelten." },
    { f: "Soll ich die Zusatzversicherung fürs Kind vor der Geburt abschliessen?",
      a: "Das ist empfehlenswert. Nach der Geburt ist eine Gesundheitsprüfung möglich, und Vorbehalte lassen sich später kaum korrigieren." }
  ],
  verwandt: ["krankenkasse-junge-erwachsene", "franchise-waehlen", "zusatzversicherung-und-grundversicherung"]
},

{
  slug: "krankenkasse-junge-erwachsene",
  kategorie: "Alter",
  titel: "Mit 19 steigt die Prämie: was junge Erwachsene jetzt tun können",
  h1: "Krankenkasse für junge Erwachsene",
  beschreibung: "Beim Übergang von der Kinder- zur Jugendprämie steigt die Rechnung sprunghaft. Warum das passiert, was die Altersklasse bestimmt und wo der grösste Hebel liegt.",
  bild: "photo-1543269865-cbf427effbad",
  bildAlt: "Vier junge Erwachsene an einem Tisch",
  lead: "Der erste eigene Prämienbescheid überrascht fast jeden. Die Erhöhung kommt automatisch, ohne dass sich an der Versicherung etwas geändert hätte.",
  abschnitte: [
    { h2: "Warum die Prämie springt", html:
      '<p>Die Grundversicherung kennt drei Altersklassen: Kinder, junge Erwachsene und Erwachsene. Sobald Sie in die nächste Klasse fallen, gilt die höhere Prämie – ohne Kündigung, ohne Mitteilung, ohne dass Sie etwas tun.</p>' +
      '<p>Massgebend ist dabei das Kalenderjahr, nicht der Geburtstag. Wer im Dezember 19 wird, fällt für dasselbe Jahr in dieselbe Klasse wie jemand, der im Januar Geburtstag hatte. Wenn Sie es genau wissen wollen, fragen Sie Ihre Kasse – die Umstellung läuft automatisch.</p>' },
    { h2: "Der grösste Hebel: der Wechsel selbst", html:
      '<p>Junge Erwachsene sind die Gruppe, die am seltensten wechselt – und gleichzeitig die mit dem grössten relativen Sparpotenzial. Viele bleiben einfach bei der Kasse der Eltern.</p>' +
      '<p>Dabei fällt beim Übertritt oft auch der Familienrabatt weg, den die bisherige Kasse gewährt hat. Die bisher günstige Kasse kann dadurch über Nacht zu einer teuren werden.</p>' },
    { h2: "Franchise und Modell", html:
      '<ul>' +
      '<li><strong>Franchise.</strong> Wer jung und gesund ist, fährt mit der höchsten Stufe meist günstiger. Voraussetzung: Sie können 2500 plus Selbstbehalt notfalls aufbringen.</li>' +
      '<li><strong>Modell.</strong> Telmed und HMO sind für junge Erwachsene oft unproblematisch – wer selten zum Arzt geht, merkt die Einschränkung kaum.</li>' +
      '</ul>' +
      '<p>Beides zusammen macht mehr aus als der Kassenwechsel allein. Rechnen Sie die Kombinationen durch, nicht nur die Kassen.</p>' },
    { h2: "Prämienverbilligung prüfen", html:
      '<p>Studierende und Auszubildende mit tiefem Einkommen haben in vielen Kantonen Anspruch auf Prämienverbilligung. Die Beiträge sind kantonal geregelt, und in einigen Kantonen müssen Sie selbst einen Antrag stellen – wer nichts tut, bekommt nichts.</p>' +
      '<p>Der zweite Sprung kommt mit 26: siehe <a href="/ratgeber/krankenkasse-ab-26.html">Der zweite Prämiensprung</a>.</p>' + CTA }
  ],
  faq: [
    { f: "Warum steigt meine Prämie mit 19?",
      a: "Weil Sie aus der Altersklasse der Kinder in die der jungen Erwachsenen wechseln. Die Umstellung erfolgt automatisch." },
    { f: "Welche Altersklassen gibt es in der Grundversicherung?",
      a: "Kinder, junge Erwachsene und Erwachsene. Massgebend ist das Kalenderjahr, in dem Sie die jeweilige Altersgrenze erreichen." },
    { f: "Lohnt sich für junge Erwachsene eine hohe Franchise?",
      a: "Meistens ja, wenn Sie gesund sind und den Betrag im Ernstfall aufbringen können. Rechnen Sie Prämienersparnis gegen Franchisedifferenz." },
    { f: "Muss ich bei der Kasse meiner Eltern bleiben?",
      a: "Nein. Sie können frei wechseln, und oft lohnt es sich – gerade weil beim Übertritt der Familienrabatt wegfallen kann." }
  ],
  verwandt: ["krankenkasse-ab-26", "franchise-waehlen", "versicherungsmodelle"]
},

{
  slug: "krankenkasse-ab-26",
  kategorie: "Alter",
  titel: "Der zweite Prämiensprung: Krankenkasse ab 26",
  h1: "Krankenkasse ab 26 Jahren",
  beschreibung: "Mit dem Übertritt in die Erwachsenenprämie steigt die Rechnung ein zweites Mal – und bleibt dann hoch. Was sich ändert und warum sich jetzt ein Vergleich besonders lohnt.",
  bild: "photo-1555252333-9f8e92e65df9",
  bildAlt: "Ruhiges Detailbild, Tuch in Weiss",
  lead: "Der erste Sprung mit 19 ist bekannt. Der zweite mit 26 trifft viele unvorbereitet – und er ist der letzte, der automatisch kommt.",
  abschnitte: [
    { h2: "Was sich ändert", html:
      '<p>Mit dem Übertritt in die Altersklasse der Erwachsenen gilt der volle Tarif. Danach steigt die Prämie nicht mehr wegen Ihres Alters – Erhöhungen kommen nur noch aus der allgemeinen Kostenentwicklung.</p>' +
      '<p>Wie bei der Umstellung mit 19 ist das Kalenderjahr massgebend, nicht der Geburtstag.</p>' },
    { h2: "Warum gerade jetzt vergleichen", html:
      '<p>Zwei Gründe:</p>' +
      '<ul>' +
      '<li><strong>Die Beträge werden relevant.</strong> Eine Differenz von zehn Prozent fällt bei einer Erwachsenenprämie deutlich stärker ins Gewicht als bei einer Jugendprämie.</li>' +
      '<li><strong>Viele haben seit Jahren nicht geprüft.</strong> Wer mit 19 eine Kasse gewählt hat und seither dabei ist, zahlt mit hoher Wahrscheinlichkeit zu viel. Die Rangfolge der Kassen ändert sich jedes Jahr.</li>' +
      '</ul>' },
    { h2: "Was in dieser Lebensphase dazukommt", html:
      '<p>Mit Mitte zwanzig ändern sich oft mehrere Dinge gleichzeitig: erste feste Stelle, Umzug, Partnerschaft, vielleicht Familienplanung. Jedes davon betrifft die Krankenkasse.</p>' +
      '<ul>' +
      '<li><strong>Anstellung ab acht Stunden pro Woche:</strong> Sie sind über den Arbeitgeber unfallversichert und können die Unfalldeckung in der Grundversicherung ausschliessen. Das senkt die Prämie.</li>' +
      '<li><strong>Umzug:</strong> möglicherweise eine andere <a href="/ratgeber/praemienregionen.html">Prämienregion</a>.</li>' +
      '<li><strong>Familienplanung:</strong> Zusatzversicherungen vor der Schwangerschaft prüfen, nicht danach.</li>' +
      '</ul>' },
    { h2: "Franchise neu beurteilen", html:
      '<p>Die hohe Franchise, die mit 20 sinnvoll war, ist es mit 30 nicht zwingend noch. Prüfen Sie Ihre tatsächlichen Gesundheitskosten der letzten drei Jahre – die Rechnung steht im Ratgeber <a href="/ratgeber/franchise-waehlen.html">Welche Franchise lohnt sich</a>.</p>' + CTA }
  ],
  faq: [
    { f: "Warum steigt die Prämie mit 26?",
      a: "Weil Sie aus der Altersklasse der jungen Erwachsenen in die der Erwachsenen wechseln. Danach gibt es keine altersbedingten Sprünge mehr." },
    { f: "Steigt die Prämie später nochmals wegen des Alters?",
      a: "Nein. Nach dem Übertritt in die Erwachsenenklasse ändert sich die Prämie nur noch durch die allgemeine Kostenentwicklung." },
    { f: "Kann ich die Unfalldeckung ausschliessen?",
      a: "Wenn Sie mindestens acht Stunden pro Woche angestellt sind, sind Sie über den Arbeitgeber unfallversichert und können die Deckung in der Grundversicherung ausschliessen. Das senkt die Prämie." },
    { f: "Wie oft sollte ich die Krankenkasse vergleichen?",
      a: "Einmal im Jahr, im Oktober oder November, wenn die neuen Prämien bekannt sind. Die Rangfolge der Kassen ändert sich jährlich." }
  ],
  verwandt: ["krankenkasse-junge-erwachsene", "franchise-waehlen", "krankenkasse-wechseln"]
}

];
