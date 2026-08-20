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
 *  D) Optional: Versand ueber Brevo statt ueber Gmail
 *     Nur damit ist die Absenderadresse wirklich frei waehlbar - Google
 *     erlaubt einen abweichenden Absender nur bei bestaetigtem Alias.
 *     1. Konto auf brevo.com anlegen (gratis bis 300 Mails pro Tag, EU-Hosting).
 *     2. Senders, Domains & Dedicated IPs ▸ Domains ▸ Domain hinzufuegen
 *        ▸ swisspremia.ch ▸ die angezeigten DNS-Eintraege bei Swizzonic
 *        setzen (Verifizierungs-TXT, DKIM, DMARC). Ein paar Stunden warten,
 *        bis Brevo die Domain als verifiziert anzeigt.
 *     3. Settings ▸ SMTP & API ▸ API Keys ▸ Schluessel erzeugen
 *        und unten bei BREVO_API_SCHLUESSEL eintragen.
 *     4. Funktion brevoTesten() ausfuehren und das Protokoll pruefen.
 *     Faellt Brevo einmal aus, verschickt das Skript automatisch wieder
 *     ueber Gmail - eine Anfrage geht dadurch nie verloren.
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
  // Funktioniert NUR, wenn die Adresse in Gmail unter "Senden als"
  // freigeschaltet ist – prüfbar mit der Funktion aliasePruefen().
  // Klappt die Freischaltung nicht (z. B. weil der Hoster keinen
  // SMTP-Versand erlaubt), hier '' eintragen: Dann verschickt Google
  // von deiner Kontoadresse, der Empfänger sieht aber weiterhin
  // "SwissPremia" als Namen, und Antworten gehen an ANTWORT_EMAIL.
  ABSENDER_EMAIL: 'info@swisspremia.ch',
  ABSENDER_NAME: 'SwissPremia',

  // ---- Versand ueber Brevo (optional, aber empfohlen) ----------------
  // Traegst du hier einen API-Schluessel ein, verschickt das Skript ueber
  // Brevo statt ueber Gmail. Erst dann ist ABSENDER_EMAIL wirklich der
  // sichtbare Absender - Google laesst das ohne bestaetigten Alias nicht zu.
  // Schluessel holen: app.brevo.com ▸ Settings ▸ SMTP & API ▸ API Keys.
  // Er beginnt mit "xkeysib-". Leer lassen = Versand wie bisher ueber Gmail.
  BREVO_API_SCHLUESSEL: '',

  // Wohin Antworten des Interessenten gehen sollen.
  // Unabhängig vom Absender – funktioniert immer, ohne Freischaltung.
  ANTWORT_EMAIL: 'info@swisspremia.ch',

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

/* ======================== Absenderadresse ============================== */
/**
 * Liefert ABSENDER_EMAIL zurück, aber nur wenn die Adresse in Gmail unter
 * "Senden als" freigeschaltet ist. Sonst null.
 *
 * Wichtig: MailApp.sendEmail() kennt die Option "from" gar nicht und
 * ignoriert sie stillschweigend – der Versand läuft dann immer über die
 * Standardadresse des Kontos. Nur GmailApp.sendEmail() kann den Absender
 * ändern, und auch nur auf einen bestätigten Alias. Deshalb wird hier
 * geprüft, bevor gesendet wird: ein unbekannter Absender führt sonst zu
 * einem Laufzeitfehler und der Lead ginge verloren.
 */
function absenderAlias() {
  if (!KONFIG.ABSENDER_EMAIL) return null;
  try {
    if (GmailApp.getAliases().indexOf(KONFIG.ABSENDER_EMAIL) >= 0) {
      return KONFIG.ABSENDER_EMAIL;
    }
  } catch (e) { /* keine Gmail-Berechtigung – dann eben Standardabsender */ }
  return null;
}

/* Verschickt über GmailApp, falls ein Alias gesetzt werden kann,
   sonst über MailApp mit der Standardadresse.
   Der Klartext bleibt immer dabei – manche Programme zeigen kein HTML. */
function mailSenden(empfaenger, betreff, text, antwortAn, html) {
  /* Erste Wahl: Brevo. Nur damit ist die Absenderadresse frei waehlbar.
     Scheitert der Versand, wird still auf Google zurueckgefallen - eine
     Anfrage darf nie an einem Dienstausfall verloren gehen. */
  if (KONFIG.BREVO_API_SCHLUESSEL) {
    try {
      brevoSenden(empfaenger, betreff, text, antwortAn, html);
      return;
    } catch (fehler) {
      try { rohSichern('Brevo fehlgeschlagen, Rueckfall auf Gmail: ' + fehler); } catch (e) {}
    }
  }

  var alias = absenderAlias();
  var optionen = {
    name: KONFIG.ABSENDER_NAME,
    /* Die Antwortadresse braucht keine Freischaltung. Auch wenn der
       Absender die Gmail-Adresse bleibt, landen Antworten dadurch
       zuverlaessig im Geschaeftspostfach. */
    replyTo: antwortAn || KONFIG.ANTWORT_EMAIL || KONFIG.ABSENDER_EMAIL || undefined
  };
  if (html) optionen.htmlBody = html;

  if (alias) {
    optionen.from = alias;
    GmailApp.sendEmail(empfaenger, betreff, text, optionen);
    return;
  }

  optionen.to = empfaenger;
  optionen.subject = betreff;
  optionen.body = text;
  MailApp.sendEmail(optionen);
}

/**
 * Versand ueber die Brevo-Schnittstelle.
 * Erfolg meldet Brevo mit 201 (sofort) oder 202 (geplant).
 */
function brevoSenden(empfaenger, betreff, text, antwortAn, html) {
  /* Frueh und deutlich scheitern statt mit einem raetselhaften 401 von Brevo.
     "authentication not found in headers" bedeutet naemlich: leerer Schluessel. */
  if (!KONFIG.BREVO_API_SCHLUESSEL) {
    throw new Error('Kein API-Schluessel in KONFIG.BREVO_API_SCHLUESSEL hinterlegt.');
  }
  if (!empfaenger) {
    throw new Error('Kein Empfaenger uebergeben - diese Funktion nicht direkt aufrufen, ' +
                    'sondern brevoTesten() im Auswahlfeld waehlen.');
  }

  var nutzlast = {
    sender: {
      name: KONFIG.ABSENDER_NAME,
      email: KONFIG.ABSENDER_EMAIL || KONFIG.ANTWORT_EMAIL
    },
    to: [{ email: empfaenger }],
    subject: betreff,
    // htmlContent ist bei Brevo Pflicht - notfalls aus dem Klartext bauen
    htmlContent: html || ('<pre style="font-family:sans-serif;white-space:pre-wrap;">' +
                          htmlSchuetzen(text) + '</pre>'),
    textContent: text,
    replyTo: { email: antwortAn || KONFIG.ANTWORT_EMAIL || KONFIG.ABSENDER_EMAIL }
  };

  var antwort = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': KONFIG.BREVO_API_SCHLUESSEL, 'accept': 'application/json' },
    payload: JSON.stringify(nutzlast),
    muteHttpExceptions: true
  });

  var code = antwort.getResponseCode();
  if (code !== 201 && code !== 202) {
    throw new Error('HTTP ' + code + ' – ' + antwort.getContentText().slice(0, 300));
  }
}

/**
 * Diagnose: schickt eine Probemail ueber Brevo und zeigt die Antwort.
 * Im Editor ausfuehren und ins Ausfuehrungsprotokoll schauen.
 */
function brevoTesten() {
  if (!KONFIG.BREVO_API_SCHLUESSEL) {
    Logger.log('Kein API-Schluessel hinterlegt – es wird weiter ueber Gmail verschickt.');
    return;
  }
  try {
    brevoSenden(
      KONFIG.BENACHRICHTIGUNG_EMAIL,
      'Brevo-Probelauf – SwissPremia',
      'Wenn diese Nachricht ankommt und als Absender ' + KONFIG.ABSENDER_EMAIL +
      ' zeigt, ist der Versand richtig eingerichtet.',
      null,
      htmlRahmen('Probelauf',
        '<p style="margin:0;">Wenn diese Nachricht ankommt und als Absender <strong>' +
        htmlSchuetzen(KONFIG.ABSENDER_EMAIL) + '</strong> zeigt, ist der Versand richtig eingerichtet.</p>',
        'SwissPremia · technischer Probelauf')
    );
    Logger.log('Erfolgreich an Brevo uebergeben. Posteingang von ' +
               KONFIG.BENACHRICHTIGUNG_EMAIL + ' pruefen.');
  } catch (fehler) {
    Logger.log('FEHLGESCHLAGEN: ' + fehler);
    Logger.log('401 = falscher Schluessel · 400 mit "sender" = Domain noch nicht verifiziert');
  }
}

/* ======================== HTML-Gestaltung ============================== */
/**
 * E-Mail-HTML folgt anderen Regeln als eine Website: keine externen
 * Stylesheets, kein Flexbox oder Grid, alle Angaben direkt am Element.
 * Deshalb Tabellen und inline-Stile – das stellen Gmail, Outlook und
 * Apple Mail zuverlässig dar.
 */
var FARBE = {
  petrol: '#005786',
  slate: '#212d39',
  gold: '#ccba89',
  creme: '#f4eee4',
  linie: '#dcdee2',
  text: '#3d4852',
  grau: '#7b8794'
};

function htmlSchuetzen(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Kopfband mit Wortmarke – bewusst ohne Bild, damit nichts blockiert wird
   oder als roter Platzhalter erscheint. */
function bannerHtml(unterzeile) {
  /* Die Bildmarke wird aus Tabellenzellen gezeichnet statt als Bild geladen.
     Mailprogramme blockieren externe Bilder standardmässig – so ist das
     Zeichen immer da, ohne dass der Empfänger etwas freigeben muss. */
  var marke =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="38" ' +
      'style="width:38px;height:38px;background-color:#ffffff;border-radius:9px;">' +
      '<tr>' +
        '<td width="13" style="width:13px;">&nbsp;</td>' +
        '<td width="12" style="width:12px;height:11px;background-color:' + FARBE.petrol + ';font-size:0;line-height:0;">&nbsp;</td>' +
        '<td width="13" style="width:13px;">&nbsp;</td>' +
      '</tr>' +
      '<tr>' +
        '<td colspan="3" style="height:16px;background-color:' + FARBE.petrol + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="width:13px;">&nbsp;</td>' +
        '<td style="width:12px;height:11px;background-color:' + FARBE.petrol + ';font-size:0;line-height:0;">&nbsp;</td>' +
        '<td style="width:13px;">&nbsp;</td>' +
      '</tr>' +
    '</table>';

  return '' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:' + FARBE.petrol + ';">' +
    '<tr><td style="padding:26px 32px 24px 32px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td valign="middle" style="padding-right:13px;">' + marke + '</td>' +
        '<td valign="middle">' +
          '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.15;color:#ffffff;letter-spacing:.3px;">' +
            'Swiss<strong style="font-weight:700;">Premia</strong>' +
          '</div>' +
          '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:' + FARBE.gold + ';padding-top:5px;">' +
            htmlSchuetzen(unterzeile) +
          '</div>' +
        '</td>' +
      '</tr></table>' +
    '</td></tr>' +
    '<tr><td style="background-color:' + FARBE.gold + ';font-size:0;line-height:0;height:4px;">&nbsp;</td></tr>' +
  '</table>';
}

/* Rahmen um den Inhalt: grauer Hintergrund, weisse Karte, Fusszeile. */
function htmlRahmen(unterzeile, inhalt, fusszeile) {
  return '' +
  '<!DOCTYPE html><html><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="margin:0;padding:0;background-color:#eef1f4;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1f4;">' +
      '<tr><td align="center" style="padding:24px 12px;">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;">' +
          '<tr><td>' + bannerHtml(unterzeile) + '</td></tr>' +
          '<tr><td style="padding:32px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:' + FARBE.text + ';">' +
            inhalt +
          '</td></tr>' +
          '<tr><td style="background-color:' + FARBE.slate + ';padding:20px 32px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9fb0c0;">' +
            fusszeile +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

/* Überschrift innerhalb der Karte */
function abschnittHtml(titel) {
  return '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + FARBE.petrol +
         ';font-weight:600;padding:26px 0 10px 0;">' + htmlSchuetzen(titel) + '</div>';
}

/* Die Angaben als zweispaltige Tabelle statt als Textliste */
function angabenTabelleHtml(daten, mitVerwaltung) {
  var zeilen = '';
  Object.keys(daten).forEach(function (schluessel) {
    if (schluessel.charAt(0) === '_') return;
    if (schluessel === 'email') return;
    if (!mitVerwaltung && NICHT_ANZEIGEN_KERN.indexOf(schluesselKern(schluessel)) >= 0) return;
    var wert = String(daten[schluessel] == null ? '' : daten[schluessel]).trim();
    if (wert === '') return;
    if (!mitVerwaltung &&
        (wert === 'Keine Angabe' || wert === 'Weiss ich nicht' ||
         wert === 'Keine Berechnung durchgeführt')) return;

    zeilen +=
      '<tr>' +
        '<td style="padding:9px 14px;border-bottom:1px solid ' + FARBE.linie + ';color:' + FARBE.grau +
          ';font-size:13px;white-space:nowrap;vertical-align:top;width:38%;">' + htmlSchuetzen(schluessel) + '</td>' +
        '<td style="padding:9px 14px;border-bottom:1px solid ' + FARBE.linie + ';color:' + FARBE.slate +
          ';font-size:14px;font-weight:600;vertical-align:top;">' + htmlSchuetzen(wert) + '</td>' +
      '</tr>';
  });

  if (!zeilen) return '';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
         'style="border:1px solid ' + FARBE.linie + ';border-radius:8px;overflow:hidden;">' +
         zeilen + '</table>';
}

/* Hervorgehobener Kasten (cremefarben, goldene Kante) */
function kastenHtml(inhalt) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">' +
    '<tr><td style="background-color:' + FARBE.creme + ';border-left:3px solid ' + FARBE.gold +
      ';border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;line-height:1.6;color:' + FARBE.slate + ';">' +
      inhalt +
    '</td></tr></table>';
}

/**
 * Diagnose: zeigt, welche Absenderadressen zur Verfügung stehen.
 * Im Editor ausführen und ins Ausführungsprotokoll schauen.
 */
function aliasePruefen() {
  var aliase = GmailApp.getAliases();
  Logger.log('Freigeschaltete Absenderadressen: ' +
    (aliase.length ? aliase.join(', ') : '(keine)'));
  Logger.log('Gewuenschter Absender: ' + KONFIG.ABSENDER_EMAIL);
  Logger.log(absenderAlias()
    ? '=> wird verwendet'
    : '=> NICHT verfuegbar, Mails gehen von der Standardadresse des Kontos raus');
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

  var telLink = String(telefon).replace(/[^0-9+]/g, '');
  var inhalt =
    '<p style="margin:0 0 4px 0;font-size:20px;color:' + FARBE.slate + ';font-weight:600;">' +
      htmlSchuetzen(name) + '</p>' +
    '<p style="margin:0;font-size:15px;color:' + FARBE.grau + ';">Neue Anfrage über swisspremia.ch</p>' +
    (telLink
      ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;">' +
        '<tr><td style="background-color:' + FARBE.petrol + ';border-radius:999px;">' +
        '<a href="tel:' + htmlSchuetzen(telLink) + '" style="display:inline-block;padding:13px 30px;' +
        'font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.6px;' +
        'color:#ffffff;text-decoration:none;">📞 ' + htmlSchuetzen(telefon) + ' anrufen</a>' +
        '</td></tr></table>'
      : '') +
    abschnittHtml('Angaben') + angabenTabelleHtml(daten, true) +
    kastenHtml('<strong>Jetzt anrufen, nicht später.</strong> Wer sofort zurückruft, erreicht deutlich mehr Leute.' +
      (zeile ? ' Der Lead steht als Zeile ' + zeile + ' im Google Sheet.' : ''));

  var html = htmlRahmen('Neuer Lead', inhalt,
    'Eine Antwort auf diese E-Mail geht direkt an den Interessenten.');

  // Antworten gehen direkt an den Interessenten
  mailSenden(
    KONFIG.BENACHRICHTIGUNG_EMAIL,
    '🔥 Neuer Lead: ' + name + ' – ' + telefon,
    text,
    daten['E-Mail'] || KONFIG.BENACHRICHTIGUNG_EMAIL,
    html
  );
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
      'data and pass your request to a licensed insurance broker, who will contact you shortly. The consultation is free and without obligation.\n\n' +
      'Kind regards\n' + KONFIG.ABSENDER_NAME + '\n' + (KONFIG.ABSENDER_EMAIL || '')
    : 'Guten Tag ' + (daten.Vorname || '') + '\n\n' +
      'Vielen Dank für Ihre Anfrage bei SwissPremia – sie ist bei uns eingegangen.\n\n' +
      'IHRE ANGABEN\n' + uebersicht + '\n\n' +
      'Stimmt etwas nicht oder fehlt eine Angabe? Antworten Sie einfach auf diese E-Mail.\n\n' +
      'WAS JETZT PASSIERT\n' +
      'Wir stellen Ihren persönlichen Vergleich auf Basis der offiziellen Prämiendaten ' +
      'des Bundes zusammen und leiten Ihre Anfrage an einen lizenzierten Versicherungsvermittler weiter, der sich in Kürze bei Ihnen meldet. ' +
      'Die Beratung ist für Sie kostenlos und unverbindlich.\n\n' +
      'Freundliche Grüsse\n' + KONFIG.ABSENDER_NAME + '\n' + (KONFIG.ABSENDER_EMAIL || '');

  /* HTML-Fassung mit Kopfband. Der Klartext oben bleibt als Rückfall. */
  var tabelle = angabenTabelleHtml(daten, false);
  var inhalt = englisch
    ? '<p style="margin:0 0 14px 0;font-size:17px;color:' + FARBE.slate + ';">Hello ' +
        htmlSchuetzen(daten.Vorname || '') + ',</p>' +
      '<p style="margin:0;">Thank you for your request to SwissPremia – we have received it.</p>' +
      abschnittHtml('Your details') + tabelle +
      kastenHtml('<strong>Something wrong or missing?</strong> Simply reply to this email – it reaches us directly.') +
      abschnittHtml('What happens next') +
      '<p style="margin:0;">We prepare your personal comparison based on the official federal premium data ' +
      'and pass your request to a licensed insurance broker, who will contact you shortly. The consultation is free and without obligation.</p>'
    : '<p style="margin:0 0 14px 0;font-size:17px;color:' + FARBE.slate + ';">Guten Tag ' +
        htmlSchuetzen(daten.Vorname || '') + '</p>' +
      '<p style="margin:0;">Vielen Dank für Ihre Anfrage – sie ist bei uns eingegangen.</p>' +
      abschnittHtml('Ihre Angaben') + tabelle +
      kastenHtml('<strong>Stimmt etwas nicht oder fehlt eine Angabe?</strong> Antworten Sie einfach auf diese E-Mail – sie erreicht uns direkt.') +
      abschnittHtml('Was jetzt passiert') +
      '<p style="margin:0;">Wir stellen Ihren persönlichen Vergleich auf Basis der offiziellen Prämiendaten ' +
      'des Bundes zusammen und leiten Ihre Anfrage an einen lizenzierten Versicherungsvermittler weiter, der sich in Kürze bei Ihnen meldet. ' +
      'Die Beratung ist für Sie kostenlos und unverbindlich.</p>';

  var fuss = englisch
    ? 'SwissPremia · Swiss health insurance comparison<br>' +
      'Premium data: Federal Office of Public Health (FOPH), priminfo.admin.ch<br>' +
      'You are receiving this email because you submitted a request on swisspremia.ch.'
    : 'SwissPremia · Krankenkassen-Vergleich Schweiz<br>' +
      'Prämiendaten: Bundesamt für Gesundheit (BAG), priminfo.admin.ch<br>' +
      'Sie erhalten diese E-Mail, weil Sie auf swisspremia.ch eine Anfrage gestellt haben.';

  var html = htmlRahmen(
    englisch ? 'Health insurance comparison' : 'Krankenkassen-Vergleich',
    inhalt,
    fuss
  );

  mailSenden(daten['E-Mail'], betreff, text, null, html);
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

  mailSenden(
    KONFIG.BENACHRICHTIGUNG_EMAIL,
    '⏰ ' + offen.length + ' unbearbeitete Lead(s)',
    'Diese Anfragen stehen noch auf "Neu":\n\n' + offen.join('\n') +
      '\n\nSetz den Status im Sheet auf "Kontaktiert", sobald erledigt.'
  );
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
