/**
 * =========================================================================
 *  SwissPremia – Lead-Webhook (Google Apps Script)
 * =========================================================================
 *
 *  Was dieses Skript macht, sobald jemand ein Formular abschickt:
 *    1. Es schreibt den Lead in ein Google Sheet – dein Mini-CRM mit
 *       Status, Kontaktversuchen und Wiedervorlage.
 *    2. Es schickt dir sofort eine Telegram-Nachricht aufs Handy, damit du
 *       innert Minuten zurückrufen kannst (Speed-to-Lead entscheidet).
 *    3. Es erinnert dich automatisch, wenn ein Lead nach 30 Minuten noch
 *       auf "Neu" steht.
 *
 *  ----- EINRICHTUNG (einmalig, ca. 10 Minuten) ---------------------------
 *
 *  A) Google Sheet anlegen
 *     1. Neues Google Sheet erstellen, z. B. "SwissPremia Leads".
 *     2. Menü  Erweiterungen ▸ Apps Script  öffnen.
 *     3. Den Inhalt dieser Datei komplett in den Editor kopieren.
 *
 *  B) Telegram-Push einrichten (gratis, dauert 3 Minuten)
 *     1. In Telegram @BotFather anschreiben ▸ /newbot ▸ Namen vergeben.
 *        BotFather gibt dir einen Token wie 12345678:AAH....
 *     2. Deinen neuen Bot anschreiben (irgendeine Nachricht, z. B. "Start").
 *     3. Im Browser aufrufen:
 *        https://api.telegram.org/bot<DEIN_TOKEN>/getUpdates
 *        Dort steht "chat":{"id":123456789 – das ist deine CHAT_ID.
 *     4. Beides unten bei KONFIG eintragen.
 *     (Kein Telegram gewünscht? Felder leer lassen – dann kommt nur die E-Mail.)
 *
 *  C) Veröffentlichen
 *     1. Im Apps-Script-Editor: Bereitstellen ▸ Neue Bereitstellung
 *        ▸ Typ "Web-App"
 *        ▸ Ausführen als: Ich
 *        ▸ Zugriff: Jeder
 *     2. Die angezeigte URL (endet auf /exec) kopieren und in
 *        js/lead-core.js bei WEBHOOK_URL eintragen.
 *     3. Einmal die Funktion  einrichten()  im Editor ausführen und die
 *        Berechtigungen bestätigen. Das legt die Kopfzeile an und aktiviert
 *        die Nachfass-Erinnerung.
 *
 *  Wichtig: Nach jeder Änderung am Code musst du unter "Bereitstellen"
 *  eine NEUE VERSION veröffentlichen, sonst läuft weiter die alte.
 * =========================================================================
 */

/* ======================== KONFIG – hier anpassen ======================== */
var KONFIG = {
  BLATT_NAME: 'Leads',

  // Telegram-Sofortbenachrichtigung (leer lassen = deaktiviert)
  TELEGRAM_TOKEN: '',
  TELEGRAM_CHAT_ID: '',

  // >>> WICHTIG <<< Hierhin geht die Lead-Meldung.
  BENACHRICHTIGUNG_EMAIL: 'info@swisspremia.ch',

  // Eingangsbestätigung an den Interessenten – mit seinen Angaben.
  AUTO_ANTWORT: true,
  ABSENDER_NAME: 'SwissPremia',

  // Absenderadresse der Bestätigung. Muss in Gmail unter
  // Einstellungen ▸ Konten ▸ "Senden als" freigeschaltet sein,
  // sonst verschickt Google die Mail von deiner Gmail-Adresse.
  // Leer lassen = Standardadresse des Kontos.
  ABSENDER_EMAIL: 'info@swisspremia.ch',

  // Nach wie vielen Minuten ohne Bearbeitung erinnert dich das Skript?
  ERINNERUNG_NACH_MINUTEN: 30
};

/* Spalten des Mini-CRM. Reihenfolge = Reihenfolge im Sheet. */
var SPALTEN = [
  'Eingang',            // Zeitstempel
  'Status',             // Neu / Kontaktiert / Termin / Offerte / Abschluss / Verloren
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
  'Grundversicherung',   // heutige Kasse (KVG)
  'Franchise',
  'Zusatzversicherung',  // heutige Kasse (VVG) – oft eine andere
  'Erreichbarkeit',
  'Sprache',
  'Interessen',
  'Berechnung',
  'Bemerkung',
  'Kontaktversuche',
  'Nächster Schritt',
  'Notizen'
];

/* Auswahllisten für die Status-Spalte – hält das Sheet sauber. */
var STATUS_WERTE = ['Neu', 'Kontaktiert', 'Termin', 'Offerte', 'Abschluss', 'Verloren'];

/* ======================== Webhook-Einstieg ============================== */

function doPost(e) {
  try {
    var daten = JSON.parse(e.postData.contents);
    var zeile = leadSpeichern(daten);
    benachrichtigen(daten, zeile);
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
  return antwort({ ok: true, dienst: 'SwissPremia Lead-Webhook', zeit: new Date().toISOString() });
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

  if (!blatt) {
    blatt = datei.insertSheet(KONFIG.BLATT_NAME);
  }

  if (blatt.getLastRow() === 0) {
    blatt.appendRow(SPALTEN);
    var kopf = blatt.getRange(1, 1, 1, SPALTEN.length);
    kopf.setFontWeight('bold')
        .setBackground('#10263f')
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

    // Status-Dropdown und Hervorhebung für die neue Zeile setzen.
    var statusSpalte = SPALTEN.indexOf('Status') + 1;
    blatt.getRange(nr, statusSpalte).setDataValidation(
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

/* ======================== Benachrichtigungen ============================ */

function benachrichtigen(daten, zeile) {
  var name = [daten.Vorname, daten.Nachname].filter(String).join(' ') || 'Unbekannt';
  var telefon = daten.Telefon || '–';

  var text =
    '🔥 NEUER LEAD #' + zeile + '\n\n' +
    'Name:     ' + name + '\n' +
    'Telefon:  ' + telefon + '\n' +
    'E-Mail:   ' + (daten['E-Mail'] || '–') + '\n' +
    'Ort:      ' + (daten['PLZ/Ort'] || '–') + '\n' +
    'Personen: ' + (daten.Personen || '–') + '\n' +
    'Einreise: ' + (daten.Einreise || '–') + '\n' +
    'Heute:    ' + (daten.Grundversicherung || '–') +
      ' / Franchise ' + (daten.Franchise || '–') +
      ' / Zusatz ' + (daten.Zusatzversicherung || '–') + '\n' +
    'Sprache:  ' + (daten.Sprache || '–') + '\n' +
    'Erreichbar: ' + (daten.Erreichbarkeit || 'Egal') + '\n' +
    'Kampagne: ' + (daten.Kampagne || '–') + '\n\n' +
    '➡️ JETZT ANRUFEN – nicht später.';

  telegramSenden(text);

  if (KONFIG.BENACHRICHTIGUNG_EMAIL) {
    MailApp.sendEmail({
      to: KONFIG.BENACHRICHTIGUNG_EMAIL,
      subject: '🔥 Lead #' + zeile + ' – ' + name + ' – ' + telefon,
      body: text
    });
  }

  if (KONFIG.AUTO_ANTWORT && daten['E-Mail']) {
    autoAntwortSenden(daten);
  }
}

function telegramSenden(text) {
  if (!KONFIG.TELEGRAM_TOKEN || !KONFIG.TELEGRAM_CHAT_ID) return;

  var url = 'https://api.telegram.org/bot' + KONFIG.TELEGRAM_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    payload: { chat_id: KONFIG.TELEGRAM_CHAT_ID, text: text },
    muteHttpExceptions: true
  });
}

/* Verwaltungsfelder gehören nicht in die Kundenbestätigung. */
var NICHT_ANZEIGEN = ['Priorität', 'Kampagne', 'Quelle', 'Sprache', 'Zeitpunkt'];

/* Baut aus den ausgefüllten Feldern eine lesbare Übersicht für den Kunden. */
function angabenAuflisten(daten) {
  var zeilen = [];
  Object.keys(daten).forEach(function (schluessel) {
    if (schluessel.charAt(0) === '_') return;
    if (NICHT_ANZEIGEN.indexOf(schluessel) >= 0) return;
    if (schluessel === 'email') return; // Dublette zu "E-Mail"
    var wert = daten[schluessel];
    if (wert === null || wert === undefined || String(wert).trim() === '') return;
    zeilen.push('  ' + schluessel + ': ' + wert);
  });
  return zeilen.join('\n');
}

function autoAntwortSenden(daten) {
  var englisch = String(daten.Sprache || '').toLowerCase().indexOf('eng') === 0;
  var uebersicht = angabenAuflisten(daten);

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
 * Läuft alle 15 Minuten und meldet Leads, die noch auf "Neu" stehen.
 * Verhindert, dass ein Lead liegen bleibt – der häufigste Grund für
 * verlorene Abschlüsse ist schlicht zu spätes Zurückrufen.
 */
function erinnerungPruefen() {
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
    var alterMinuten = Math.round((jetzt - eingang.getTime()) / 60000);
    if (jetzt - eingang.getTime() < grenze) return;

    offen.push('#' + (index + 2) + ' ' +
      [zeile[iVorname], zeile[iNachname]].filter(String).join(' ') +
      ' – ' + zeile[iTelefon] + ' (seit ' + alterMinuten + ' Min. offen)');
  });

  if (!offen.length) return;

  telegramSenden('⏰ UNBEARBEITETE LEADS (' + offen.length + ')\n\n' + offen.join('\n') +
    '\n\nStatus im Sheet auf "Kontaktiert" setzen, sobald erledigt.');
}

/* ======================== Einmalige Einrichtung ========================= */

function einrichten() {
  blattHolen();

  // Alte Trigger entfernen, damit nichts doppelt läuft.
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'erinnerungPruefen') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('erinnerungPruefen')
    .timeBased()
    .everyMinutes(15)
    .create();

  telegramSenden('✅ SwissPremia Lead-Webhook ist aktiv. Ab jetzt bekommst du jeden Lead sofort hier.');
  Logger.log('Einrichtung abgeschlossen. Sheet und Erinnerungs-Trigger sind bereit.');
}

/**
 * Testlead erzeugen – prüft Sheet, Telegram und E-Mail in einem Durchgang,
 * ohne dass du das Formular ausfüllen musst.
 */
function testLead() {
  var beispiel = {
    Priorität: 'Hoch (gesetzliche Frist)',
    Kampagne: 'neuzuzueger',
    Quelle: 'test / manuell',
    Vorname: 'Test',
    Nachname: 'Person',
    Telefon: '079 000 00 00',
    'E-Mail': 'test@example.com',
    'PLZ/Ort': '8001 Zürich',
    Personen: '2',
    Einreise: 'Bereits eingereist – Frist läuft',
    Erreichbarkeit: 'Abend (17–20 Uhr)',
    Sprache: 'Englisch'
  };
  var zeile = leadSpeichern(beispiel);
  benachrichtigen(beispiel, zeile);
  Logger.log('Testlead in Zeile ' + zeile + ' geschrieben.');
}
