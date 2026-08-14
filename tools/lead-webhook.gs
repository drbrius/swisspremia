/**
 * =========================================================================
 *  SwissPremia – Lead-Empfang (Google Apps Script)
 * =========================================================================
 *
 *  Was passiert, sobald jemand das Formular abschickt:
 *
 *    1. Du bekommst die Lead-Anfrage als E-Mail an info@swisspremia.ch.
 *    2. Der Interessent bekommt eine Bestätigung mit seinen Angaben.
 *    3. Der Lead wird zusätzlich in ein Google Sheet geschrieben – deine
 *       Übersicht mit Status, Kontaktversuchen und Wiedervorlage.
 *
 *  Kein Fremddienst, keine Kosten, keine Freischaltung durch Dritte.
 *
 *  ----- EINRICHTUNG (einmalig, ca. 10 Minuten) ---------------------------
 *
 *  A) Sheet und Skript anlegen
 *     1. Neues Google Sheet erstellen, z. B. "SwissPremia Leads".
 *     2. Menü  Erweiterungen ▸ Apps Script  öffnen.
 *     3. Den Inhalt dieser Datei komplett in den Editor kopieren und speichern.
 *
 *  B) Absenderadresse freischalten (wichtig, sonst kommt die Bestätigung
 *     von deiner Gmail-Adresse statt von info@swisspremia.ch)
 *     In Gmail:  Einstellungen ▸ Konten und Import ▸ "Senden als"
 *     ▸ Weitere E-Mail-Adresse hinzufügen ▸ info@swisspremia.ch
 *     ▸ Bestätigungslink in der Mail an info@swisspremia.ch anklicken.
 *     Klappt das nicht, trag unten bei ABSENDER_EMAIL einfach '' ein –
 *     dann verschickt Google die Bestätigung von deiner Standardadresse.
 *
 *  C) Veröffentlichen
 *     1. Im Apps-Script-Editor: Bereitstellen ▸ Neue Bereitstellung
 *        ▸ Typ "Web-App"
 *        ▸ Ausführen als: Ich
 *        ▸ Zugriff: Jeder
 *     2. Die angezeigte URL (endet auf /exec) kopieren und in
 *        js/lead-core.js bei WEBHOOK_URL eintragen.
 *     3. Einmal die Funktion  einrichten()  im Editor ausführen und die
 *        Berechtigungen bestätigen. Das legt die Kopfzeile im Sheet an und
 *        aktiviert die Nachfass-Erinnerung.
 *     4. Mit  testLead()  einen Probelauf machen – danach solltest du eine
 *        E-Mail haben und eine Zeile im Sheet sehen.
 *
 *  Wichtig: Nach jeder Änderung am Code musst du unter "Bereitstellen"
 *  eine NEUE VERSION veröffentlichen, sonst läuft weiter die alte.
 * =========================================================================
 */

/* ======================== KONFIG – hier anpassen ======================== */
var KONFIG = {
  BLATT_NAME: 'Leads',

  // Hierhin geht die Lead-Anfrage.
  BENACHRICHTIGUNG_EMAIL: 'info@swisspremia.ch',

  // Absender der Bestätigung an den Interessenten.
  // Muss in Gmail unter "Senden als" freigeschaltet sein (Schritt B oben).
  // Leer lassen = Standardadresse deines Google-Kontos.
  ABSENDER_EMAIL: 'info@swisspremia.ch',
  ABSENDER_NAME: 'SwissPremia',

  // Bestätigung an den Interessenten verschicken?
  AUTO_ANTWORT: true,

  // Lead zusätzlich ins Google Sheet schreiben?
  // Die Mail geht in jedem Fall raus – das Sheet ist nur deine Übersicht.
  // Auf false setzen, wenn du ausschliesslich E-Mails willst.
  // Achtung: ohne Sheet gibt es auch keine Nachfass-Erinnerung.
  SHEET_SPEICHERN: true,

  // Nach wie vielen Minuten erinnert dich das Skript per E-Mail an einen
  // Lead, der noch auf "Neu" steht? 0 = Erinnerung ausgeschaltet.
  ERINNERUNG_NACH_MINUTEN: 30
};

/* Spalten des Sheets. Reihenfolge = Reihenfolge im Sheet. */
var SPALTEN = [
  'Eingang',
  'Status',
  'Priorität',
  'Kampagne',
  'Quelle',
  'Vorname',
  'Nachname',
  'Telefon',
  'E-Mail',
  'PLZ/Ort',
  'Personen',
  'Einreise',
  'Grundversicherung',
  'Franchise',
  'Zusatzversicherung',
  'Erreichbarkeit',
  'Sprache',
  'Interessen',
  'Berechnung',
  'Bemerkung',
  'Kontaktversuche',
  'Nächster Schritt',
  'Notizen'
];

var STATUS_WERTE = ['Neu', 'Kontaktiert', 'Termin', 'Offerte', 'Abschluss', 'Verloren'];

/* Verwaltungsfelder, die den Interessenten nichts angehen. */
var NICHT_ANZEIGEN = ['Priorität', 'Kampagne', 'Quelle', 'Sprache', 'Zeitpunkt'];

/* ======================== Webhook-Einstieg ============================== */

function doPost(e) {
  try {
    var daten = JSON.parse(e.postData.contents);

    /* Die Mail hat Vorrang. Selbst wenn das Sheet zickt, geht der Lead raus. */
    var zeile = 0;
    if (KONFIG.SHEET_SPEICHERN) {
      try {
        zeile = leadSpeichern(daten);
      } catch (sheetFehler) {
        rohSichern('Sheet-Fehler: ' + sheetFehler + ' | ' + e.postData.contents);
      }
    }

    leadMelden(daten, zeile);
    if (KONFIG.AUTO_ANTWORT && daten['E-Mail']) bestaetigungSenden(daten);
    return antwort({ ok: true, zeile: zeile });
  } catch (fehler) {
    // Fehler protokollieren, aber nie den Lead verlieren: Rohdaten sichern.
    try {
      rohSichern(e && e.postData ? e.postData.contents : String(fehler));
    } catch (ignoriert) {}
    return antwort({ ok: false, fehler: String(fehler) });
  }
}

function doGet() {
  return antwort({ ok: true, dienst: 'SwissPremia Lead-Empfang', zeit: new Date().toISOString() });
}

function antwort(objekt) {
  return ContentService
    .createTextOutput(JSON.stringify(objekt))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ======================== Sheet-Verwaltung ============================== */

function blattHolen() {
  var datei = SpreadsheetApp.getActiveSpreadsheet();
  var blatt = datei.getSheetByName(KONFIG.BLATT_NAME);

  if (!blatt) blatt = datei.insertSheet(KONFIG.BLATT_NAME);

  if (blatt.getLastRow() === 0) {
    blatt.appendRow(SPALTEN);
    blatt.getRange(1, 1, 1, SPALTEN.length)
         .setFontWeight('bold')
         .setBackground('#005786')
         .setFontColor('#ffffff');
    blatt.setFrozenRows(1);
    blatt.setColumnWidth(SPALTEN.indexOf('Quelle') + 1, 220);
    blatt.setColumnWidth(SPALTEN.indexOf('Berechnung') + 1, 260);
    blatt.setColumnWidth(SPALTEN.indexOf('Notizen') + 1, 260);
  }

  return blatt;
}

function leadSpeichern(daten) {
  var blatt = blattHolen();

  // Gleichzeitige Formularabsendungen sauber serialisieren.
  var sperre = LockService.getScriptLock();
  sperre.waitLock(20000);

  try {
    var zeile = SPALTEN.map(function (spalte) {
      if (spalte === 'Eingang') return new Date();
      if (spalte === 'Status') return 'Neu';
      if (spalte === 'Kontaktversuche') return 0;
      if (spalte === 'Nächster Schritt') return 'Sofort anrufen';
      if (spalte === 'Notizen') return '';
      return daten[spalte] !== undefined ? daten[spalte] : '';
    });

    blatt.appendRow(zeile);
    var nr = blatt.getLastRow();

    blatt.getRange(nr, SPALTEN.indexOf('Status') + 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUS_WERTE, true).build()
    );
    blatt.getRange(nr, 1, 1, SPALTEN.length).setBackground('#fff8e1');

    return nr;
  } finally {
    sperre.releaseLock();
  }
}

function rohSichern(inhalt) {
  var datei = SpreadsheetApp.getActiveSpreadsheet();
  var blatt = datei.getSheetByName('Fehler') || datei.insertSheet('Fehler');
  blatt.appendRow([new Date(), inhalt]);
}

/* ======================== E-Mail an dich =============================== */

/**
 * Vergleicht Feldnamen unempfindlich gegen Gross-/Kleinschreibung und
 * beschädigte Sonderzeichen: 'Priorität' und 'Priorit?t' ergeben beide
 * 'prioritt'. Ohne das rutschen interne Felder in die Kundenmail, sobald
 * ein Umlaut auf dem Transportweg kaputtgeht.
 */
function schluesselKern(name) {
  return String(name).toLowerCase().replace(/[^a-z]/g, '');
}

var NICHT_ANZEIGEN_KERN = NICHT_ANZEIGEN.map(schluesselKern);

/* Baut aus den ausgefüllten Feldern eine lesbare Liste. */
function angabenAuflisten(daten, mitVerwaltung) {
  var zeilen = [];
  Object.keys(daten).forEach(function (schluessel) {
    if (schluessel.charAt(0) === '_') return;
    if (schluessel === 'email') return; // Dublette zu "E-Mail"
    if (!mitVerwaltung && NICHT_ANZEIGEN_KERN.indexOf(schluesselKern(schluessel)) >= 0) return;
    var wert = String(daten[schluessel] == null ? '' : daten[schluessel]).trim();
    if (wert === '') return;
    // Platzhalter für leere Felder gehören nicht in die Kundenmail
    if (!mitVerwaltung &&
        (wert === 'Keine Angabe' || wert === 'Weiss ich nicht' ||
         wert === 'Keine Berechnung durchgeführt')) return;
    zeilen.push('  ' + schluessel + ': ' + wert);
  });
  return zeilen.join('\n');
}

function leadMelden(daten, zeile) {
  if (!KONFIG.BENACHRICHTIGUNG_EMAIL) return;

  var name = [daten.Vorname, daten.Nachname].filter(String).join(' ') || 'Unbekannt';
  var telefon = daten.Telefon || '–';

  var text =
    'Neue Anfrage über swisspremia.ch\n\n' +
    angabenAuflisten(daten, true) + '\n\n' +
    '➡️ Jetzt anrufen – nicht später. Wer sofort zurückruft, erreicht deutlich mehr Leute.' +
    (zeile ? '\n\nDer Lead steht als Zeile ' + zeile + ' im Google Sheet.' : '');

  MailApp.sendEmail({
    to: KONFIG.BENACHRICHTIGUNG_EMAIL,
    subject: '🔥 Neuer Lead: ' + name + ' – ' + telefon,
    body: text,
    name: KONFIG.ABSENDER_NAME,
    // Antworten gehen direkt an den Interessenten
    replyTo: daten['E-Mail'] || KONFIG.BENACHRICHTIGUNG_EMAIL
  });
}

/* ======================== Bestätigung an den Kunden ==================== */

function bestaetigungSenden(daten) {
  var englisch = String(daten.Sprache || '').toLowerCase().indexOf('eng') === 0;
  var uebersicht = angabenAuflisten(daten, false);

  var betreff = englisch
    ? 'Your health insurance comparison – we have received your request'
    : 'Ihr Krankenkassen-Vergleich – Ihre Anfrage ist eingegangen';

  var text = englisch
    ? 'Hello ' + (daten.Vorname || '') + ',\n\n' +
      'Thank you for your request to SwissPremia – we have received it.\n\n' +
      'YOUR DETAILS\n' + uebersicht + '\n\n' +
      'Something wrong or missing? Simply reply to this email.\n\n' +
      'WHAT HAPPENS NEXT\n' +
      'We prepare your personal comparison based on the official federal premium ' +
      'data and call you shortly. The consultation is free and without obligation.\n\n' +
      'Kind regards\n' + KONFIG.ABSENDER_NAME + '\n' + (KONFIG.ABSENDER_EMAIL || '')
    : 'Guten Tag ' + (daten.Vorname || '') + '\n\n' +
      'Vielen Dank für Ihre Anfrage bei SwissPremia – sie ist bei uns eingegangen.\n\n' +
      'IHRE ANGABEN\n' + uebersicht + '\n\n' +
      'Stimmt etwas nicht oder fehlt eine Angabe? Antworten Sie einfach auf diese E-Mail.\n\n' +
      'WAS JETZT PASSIERT\n' +
      'Wir stellen Ihren persönlichen Vergleich auf Basis der offiziellen Prämiendaten ' +
      'des Bundes zusammen und melden uns in Kürze telefonisch bei Ihnen. ' +
      'Die Beratung ist für Sie kostenlos und unverbindlich.\n\n' +
      'Freundliche Grüsse\n' + KONFIG.ABSENDER_NAME + '\n' + (KONFIG.ABSENDER_EMAIL || '');

  var optionen = {
    to: daten['E-Mail'],
    subject: betreff,
    body: text,
    name: KONFIG.ABSENDER_NAME
  };
  if (KONFIG.ABSENDER_EMAIL) {
    optionen.from = KONFIG.ABSENDER_EMAIL;
    optionen.replyTo = KONFIG.ABSENDER_EMAIL;
  }

  MailApp.sendEmail(optionen);
}

/* ======================== Nachfass-Erinnerung =========================== */
/**
 * Läuft alle 15 Minuten und meldet dir per E-Mail, welche Leads noch auf
 * "Neu" stehen. Der häufigste Grund für verlorene Abschlüsse ist schlicht
 * zu spätes Zurückrufen.
 */
function erinnerungPruefen() {
  if (!KONFIG.ERINNERUNG_NACH_MINUTEN || !KONFIG.BENACHRICHTIGUNG_EMAIL) return;
  // Ohne Sheet gibt es nichts nachzuschlagen
  if (!KONFIG.SHEET_SPEICHERN) return;

  var blatt = blattHolen();
  if (blatt.getLastRow() < 2) return;

  var werte = blatt.getRange(2, 1, blatt.getLastRow() - 1, SPALTEN.length).getValues();
  var iEingang = SPALTEN.indexOf('Eingang');
  var iStatus = SPALTEN.indexOf('Status');
  var iVorname = SPALTEN.indexOf('Vorname');
  var iNachname = SPALTEN.indexOf('Nachname');
  var iTelefon = SPALTEN.indexOf('Telefon');

  var grenze = KONFIG.ERINNERUNG_NACH_MINUTEN * 60 * 1000;
  var jetzt = new Date().getTime();
  var offen = [];

  werte.forEach(function (zeile, index) {
    if (String(zeile[iStatus]).trim() !== 'Neu') return;
    var eingang = zeile[iEingang];
    if (!(eingang instanceof Date)) return;
    if (jetzt - eingang.getTime() < grenze) return;

    var alterMinuten = Math.round((jetzt - eingang.getTime()) / 60000);
    offen.push('  Zeile ' + (index + 2) + ': ' +
      [zeile[iVorname], zeile[iNachname]].filter(String).join(' ') +
      ' – ' + zeile[iTelefon] + ' (seit ' + alterMinuten + ' Min. offen)');
  });

  if (!offen.length) return;

  MailApp.sendEmail({
    to: KONFIG.BENACHRICHTIGUNG_EMAIL,
    subject: '⏰ ' + offen.length + ' unbearbeitete Lead(s)',
    body: 'Diese Anfragen stehen noch auf "Neu":\n\n' + offen.join('\n') +
          '\n\nSetz den Status im Sheet auf "Kontaktiert", sobald erledigt.',
    name: KONFIG.ABSENDER_NAME
  });
}

/* ======================== Einmalige Einrichtung ========================= */

function einrichten() {
  if (KONFIG.SHEET_SPEICHERN) blattHolen();

  // Alte Trigger entfernen, damit nichts doppelt läuft.
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'erinnerungPruefen') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  if (KONFIG.ERINNERUNG_NACH_MINUTEN && KONFIG.SHEET_SPEICHERN) {
    ScriptApp.newTrigger('erinnerungPruefen').timeBased().everyMinutes(15).create();
  }

  Logger.log('Einrichtung abgeschlossen. Sheet und Erinnerung sind bereit.');
}

/**
 * Probelauf – prüft Sheet, Lead-Mail und Kundenbestätigung in einem Durchgang.
 * Trag bei Bedarf deine eigene Adresse ein, um beide Mails zu sehen.
 */
function testLead() {
  var beispiel = {
    Priorität: 'Normal',
    Kampagne: 'test',
    Quelle: 'manueller Probelauf',
    Zeitpunkt: new Date().toLocaleString('de-CH'),
    Vorname: 'Test',
    Nachname: 'Person',
    Telefon: '079 000 00 00',
    'E-Mail': KONFIG.BENACHRICHTIGUNG_EMAIL,
    'PLZ/Ort': '8001 Zürich',
    Grundversicherung: 'CSS',
    Franchise: "CHF 2'500",
    Zusatzversicherung: 'keine',
    Erreichbarkeit: 'Vormittag (8–12 Uhr)',
    Sprache: 'Deutsch'
  };
  var zeile = KONFIG.SHEET_SPEICHERN ? leadSpeichern(beispiel) : 0;
  leadMelden(beispiel, zeile);
  if (KONFIG.AUTO_ANTWORT) bestaetigungSenden(beispiel);
  Logger.log('Probelauf: Zeile ' + zeile + ' geschrieben, Mails verschickt.');
}
