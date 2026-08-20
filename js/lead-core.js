/* =========================================================================
   SwissPremia – Lead-Core
   Gemeinsame Lead-Logik für index.html und alle Landingpages in /lp.

   Aufgaben:
     1. Quelle des Besuchers erfassen (UTM, Referrer, Landingpage) und über
        die ganze Sitzung mitschleppen  → damit weisst du, welcher Kanal zahlt.
     2. Lead an formsubmit.co senden (E-Mail an dich) UND optional an einen
        Google-Apps-Script-Webhook (Google-Sheet-CRM + Sofort-Push aufs Handy).
     3. Automatische Eingangsbestätigung an den Interessenten auslösen.
     4. Sicherungskopie im Browser + mailto-Fallback, damit nie ein Lead
        verloren geht.
     5. Einfacher Spam-Schutz per Honeypot-Feld.
   ========================================================================= */
(function (global) {
  "use strict";

  var CONFIG = {
    /* Wohin die Lead-Benachrichtigung geht (formsubmit.co, gratis). */
    LEAD_EMAIL: "info@swisspremia.ch",

    /* >>> HAUPTKANAL <<< URL der Google-Apps-Script-Web-App (endet auf /exec).
       Siehe tools/lead-webhook.gs. Das Skript schreibt jeden Lead ins Google
       Sheet, schickt dir die Meldung an LEAD_EMAIL und dem Interessenten die
       Bestätigung mit seinen Angaben.
       Solange dieses Feld leer ist, läuft der Versand nur über formsubmit.co –
       und der Dienst hat sich als unzuverlässig erwiesen. Bitte eintragen. */
    WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbwCVz8C7HGbxV02ARXNIso-KJAZfRlL2ZASThr3J0Jio0aB59gLuIXXiJetHaYsyXM7/exec",

    /* Zweitkanal formsubmit.co – standardmässig AUS.
       Der Dienst war am 14.08.2026 über Stunden nicht erreichbar (HTTP 000)
       und hat dabei Leads verschluckt. Nur einschalten, wenn du ihn bewusst
       als Reserve willst und info@swisspremia.ch dort bestätigt hast. */
    FORMSUBMIT_AKTIV: false,

    /* Name, der in der automatischen Antwort an den Interessenten steht. */
    BERATER_NAME: "Ihr SwissPremia-Team",

    /* Rückrufversprechen – muss zu deinem Follow-up-Prozess passen. */
    RUECKRUF_VERSPRECHEN: "innert 24 Stunden (werktags meist innert 1 Stunde)",
    RUECKRUF_VERSPRECHEN_EN: "within 24 hours (usually within an hour on working days)",

    /* >>> AUSFÜLLEN <<< Erscheinen auf der Danke-Seite, damit heisse Leads
       sich sofort selbst melden können. Leer lassen = wird ausgeblendet. */
    BERATER_TELEFON: "",          // z. B. "+41791234567"
    WHATSAPP_NUMMER: "",          // z. B. "41791234567" (ohne + und ohne Leerzeichen)
    TERMIN_URL: "",               // z. B. Calendly-/Cal.com-Link für Selbstbuchung

    /* Danke-Seite relativ zur aufrufenden Seite. */
    DANKE_URL: "danke.html"
  };

  var SPEICHER_KEY = "pc_quelle";
  var LEADS_KEY = "leads";

  /* ---------------------------------------------------------------
     Krankenkassen für die Vorschlagsliste
     Grundlage sind die 34 vom BAG zugelassenen Versicherer (siehe
     data/praemien.js). Ergänzt um die Konzern- und Zusatzversicherungs-
     Marken, die Leute im Alltag nennen – bei der Zusatzversicherung ist
     das oft eine andere Marke als bei der Grundversicherung.
     Die Liste ist nur ein Vorschlag: Eingetippt werden darf alles.
     --------------------------------------------------------------- */
  var KASSEN = [
    "Agrisano", "AMB", "Aquilana", "Arcosana", "Assura", "Atupri", "Avenir",
    "Avanex", "Birchmeier", "Compact", "CONCORDIA", "CSS", "EGK",
    "Einsiedler Krankenkasse", "Galenos", "Glarner", "Groupe Mutuel", "Helsana",
    "Innova", "Intras", "KPT", "Luzerner Hinterland", "Mutuel", "ÖKK", "Philos",
    "Progrès", "Provita", "rhenusana", "Sanagate", "sana24", "Sanitas", "SLKK",
    "sodalis", "Steffisburg", "Sumiswalder", "SWICA", "Sympany",
    "Vallée d'Entremont", "Visana", "Visperterminen", "vita surselva",
    "Vivacare", "Vivao Sympany", "Wädenswil", "curaulta"
  ];

  /* Baut die <datalist> einmal pro Seite, sobald ein Feld sie referenziert. */
  function kassenlisteEinbauen() {
    if (!document.querySelector('[list="kassenListe"]')) return;
    if (document.getElementById("kassenListe")) return;

    var liste = document.createElement("datalist");
    liste.id = "kassenListe";
    KASSEN.forEach(function (name) {
      var o = document.createElement("option");
      o.value = name;
      liste.appendChild(o);
    });
    document.body.appendChild(liste);
  }

  /* ---------------------------------------------------------------
     1. Quelle erfassen (First-Touch-Attribution)
     --------------------------------------------------------------- */
  function ermittleQuelle() {
    var gespeichert = null;
    try {
      gespeichert = JSON.parse(sessionStorage.getItem(SPEICHER_KEY) || "null");
    } catch (e) { /* Storage gesperrt */ }

    var params = new URLSearchParams(global.location.search);
    var hatUtm = params.has("utm_source") || params.has("k");

    /* Bereits erfasste Quelle behalten, ausser der Besucher kommt neu über
       eine Kampagne herein (dann gewinnt die frische Kampagne). */
    if (gespeichert && !hatUtm) return gespeichert;

    var quelle = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || params.get("k") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
      landingpage: global.location.pathname.split("/").pop() || "index.html",
      referrer: document.referrer || "direkt",
      erstkontakt: new Date().toISOString()
    };

    /* Ohne UTM-Parameter versuchen wir die Quelle aus dem Referrer zu raten. */
    if (!quelle.utm_source) {
      var ref = quelle.referrer.toLowerCase();
      if (ref === "direkt" || ref === "") quelle.utm_source = "direkt";
      else if (/facebook|instagram|fb\.|meta\./.test(ref)) quelle.utm_source = "meta-organisch";
      else if (/google\./.test(ref)) quelle.utm_source = "google-organisch";
      else if (/linkedin/.test(ref)) quelle.utm_source = "linkedin";
      else if (/whatsapp/.test(ref)) quelle.utm_source = "whatsapp";
      else quelle.utm_source = "verweis";
    }

    try { sessionStorage.setItem(SPEICHER_KEY, JSON.stringify(quelle)); } catch (e) {}
    return quelle;
  }

  function quelleAlsText(q) {
    var teile = [q.utm_source];
    if (q.utm_medium) teile.push(q.utm_medium);
    if (q.utm_campaign) teile.push(q.utm_campaign);
    if (q.utm_content) teile.push("Anzeige: " + q.utm_content);
    return teile.join(" / ") + " → " + q.landingpage;
  }

  /* ---------------------------------------------------------------
     2. Automatische Eingangsbestätigung an den Interessenten
     --------------------------------------------------------------- */
  /* Steuer- und Verwaltungsfelder gehören nicht in die Kundenbestätigung. */
  var NICHT_ANZEIGEN = [
    "_subject", "_template", "_autoresponse", "_honey", "email",
    "Priorität", "Kampagne", "Quelle", "Sprache", "Zeitpunkt"
  ];

  /* Vergleicht Feldnamen unempfindlich gegen beschädigte Sonderzeichen:
     "Priorität" und "Priorit?t" ergeben beide "prioritt". */
  function schluesselKern(name) {
    return String(name).toLowerCase().replace(/[^a-z]/g, "");
  }
  var NICHT_ANZEIGEN_KERN = NICHT_ANZEIGEN.map(schluesselKern);

  /* Baut aus den ausgefüllten Feldern eine lesbare Übersicht für den Kunden. */
  function zusammenfassung(lead) {
    return Object.keys(lead)
      .filter(function (k) {
        if (k.charAt(0) === "_" || NICHT_ANZEIGEN_KERN.indexOf(schluesselKern(k)) >= 0) return false;
        var wert = String(lead[k] == null ? "" : lead[k]).trim();
        /* Platzhalter für leere Felder gehören nicht in die Kundenmail */
        return wert !== "" &&
               wert !== "Keine Angabe" &&
               wert !== "Weiss ich nicht" &&
               wert !== "Keine Berechnung durchgeführt";
      })
      .map(function (k) { return "  " + k + ": " + lead[k]; })
      .join("\n");
  }

  function autoAntwort(vorname, lead) {
    var uebersicht = zusammenfassung(lead);

    /* Der Interessent bekommt die Bestätigung in der Sprache, in der er
       das Formular gesehen hat – sonst wirkt der Erstkontakt unseriös. */
    if ((document.documentElement.lang || "").toLowerCase().indexOf("en") === 0) {
      return "Hello " + (vorname || "") + ",\n\n" +
        "Thank you for your request to SwissPremia – we have received it.\n\n" +
        "YOUR DETAILS\n" + uebersicht + "\n\n" +
        "Something wrong or missing? Simply reply to this email.\n\n" +
        "WHAT HAPPENS NEXT\n" +
        "1. We review your details and put together the offers that fit you.\n" +
        "2. " + CONFIG.BERATER_NAME + " passes your request to a licensed insurance broker, who will contact you " + CONFIG.RUECKRUF_VERSPRECHEN_EN + ".\n" +
        "3. You receive a non-binding overview – and decide in your own time.\n\n" +
        "The consultation is free of charge and without obligation.\n\n" +
        "Kind regards\n" + CONFIG.BERATER_NAME + "\nSwissPremia\n" + CONFIG.LEAD_EMAIL;
    }

    return "Guten Tag " + (vorname || "") + "\n\n" +
      "Vielen Dank für Ihre Anfrage bei SwissPremia – sie ist bei uns eingegangen.\n\n" +
      "IHRE ANGABEN\n" + uebersicht + "\n\n" +
      "Stimmt etwas nicht oder fehlt eine Angabe? Antworten Sie einfach auf diese E-Mail.\n\n" +
      "WAS JETZT PASSIERT\n" +
      "1. Wir prüfen Ihre Angaben und suchen die passenden Angebote heraus.\n" +
      "2. " + CONFIG.BERATER_NAME + " leitet Ihre Anfrage an einen lizenzierten Versicherungsvermittler weiter, der sich " + CONFIG.RUECKRUF_VERSPRECHEN + " bei Ihnen meldet.\n" +
      "3. Sie erhalten eine unverbindliche Übersicht – Sie entscheiden in Ruhe.\n\n" +
      "Die Beratung ist für Sie kostenlos und unverbindlich.\n\n" +
      "Freundliche Grüsse\n" + CONFIG.BERATER_NAME + "\nSwissPremia\n" + CONFIG.LEAD_EMAIL;
  }

  /* ---------------------------------------------------------------
     3. Versand
     --------------------------------------------------------------- */
  function sendeLead(felder, optionen) {
    optionen = optionen || {};
    var quelle = ermittleQuelle();

    var vorname = felder.Vorname || felder.vorname || "";
    var email = felder["E-Mail"] || felder.email || "";

    var lead = {
      Priorität: optionen.prioritaet || "Normal",
      Kampagne: optionen.kampagne || quelle.utm_campaign || "Direkt",
      Quelle: quelleAlsText(quelle),
      Zeitpunkt: new Date().toLocaleString("de-CH")
    };

    /* Inhaltliche Felder anhängen (überschreiben die Defaults nicht). */
    Object.keys(felder).forEach(function (k) {
      if (lead[k] === undefined) lead[k] = felder[k];
    });

    /* Steuerfelder erst jetzt setzen – die Bestätigung soll die
       ausgefüllten Angaben enthalten, also muss lead vorher vollständig sein. */
    lead._subject = optionen.betreff || "🔥 Neuer Lead – SwissPremia";
    lead._template = "table";
    lead._autoresponse = autoAntwort(vorname, lead);
    /* formsubmit nutzt das Feld "email" für die automatische Antwort */
    lead.email = email;

    sicherungskopie(lead);

    var versuche = [];

    /* a) Hauptkanal: eigenes Google Apps Script.
       Wegen mode:"no-cors" lässt sich die Antwort nicht auslesen – die
       Anfrage geht aber zuverlässig raus. Kommt sie an, verschickt das
       Skript beide Mails: Meldung an dich und Bestätigung an den Kunden. */
    if (CONFIG.WEBHOOK_URL) {
      versuche.push(
        fetch(CONFIG.WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          /* text/plain vermeidet den CORS-Preflight, den Apps Script nicht beantwortet */
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(lead)
        })
      );
    }

    /* b) Zweitkanal: formsubmit.co. Scheitert dieser, ist das unkritisch,
       solange der Webhook oben eingerichtet ist. */
    if (CONFIG.FORMSUBMIT_AKTIV) {
      versuche.push(
        fetch("https://formsubmit.co/ajax/" + CONFIG.LEAD_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(lead)
        }).then(function (r) {
          if (!r.ok) throw new Error("formsubmit HTTP " + r.status);
          return r.json();
        })
      );
    }

    if (!versuche.length) {
      return Promise.resolve({ ok: false, lead: lead, fehler: new Error("Kein Versandkanal konfiguriert") });
    }

    /* Ein durchgekommener Kanal genügt. */
    return Promise.all(versuche.map(function (p) {
      return p.then(function () { return true; }, function () { return false; });
    })).then(function (ergebnisse) {
      var erfolg = ergebnisse.some(Boolean);
      return erfolg
        ? { ok: true, lead: lead }
        : { ok: false, lead: lead, fehler: new Error("Alle Versandkanäle fehlgeschlagen") };
    });
  }

  function sicherungskopie(lead) {
    try {
      var leads = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
      leads.push(lead);
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    } catch (e) { /* localStorage nicht verfügbar */ }
  }

  /* Letzte Rettung – wird NICHT mehr automatisch ausgelöst.
     Früher öffnete sich bei einem Versandfehler ungefragt das Mailprogramm
     des Besuchers. Das wirkt defekt und kostet den Lead. Jetzt bekommt der
     Besucher eine verständliche Meldung mit einem Link, den er bewusst
     anklicken kann – dieser hier. */
  function mailtoLink(lead) {
    var text = Object.keys(lead)
      .filter(function (k) { return k.charAt(0) !== "_"; })
      .map(function (k) { return k + ": " + lead[k]; })
      .join("\n");
    return "mailto:" + CONFIG.LEAD_EMAIL +
      "?subject=" + encodeURIComponent("Neue Anfrage – SwissPremia") +
      "&body=" + encodeURIComponent(text);
  }

  /* ---------------------------------------------------------------
     4. Honeypot – unsichtbares Feld, das nur Bots ausfüllen
     --------------------------------------------------------------- */
  function honeypotEinbauen(form) {
    if (!form || form.querySelector('[name="_honey"]')) return;
    var wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-9999px;height:0;overflow:hidden";
    wrap.innerHTML = '<label>Bitte leer lassen<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(wrap);
  }

  function istBot(form) {
    var feld = form && form.querySelector('[name="_honey"]');
    return !!(feld && feld.value);
  }

  /* ---------------------------------------------------------------
     5. Öffentliche Schnittstelle
     --------------------------------------------------------------- */
  global.LeadCore = {
    config: CONFIG,
    kassen: KASSEN,
    quelle: ermittleQuelle,
    quelleAlsText: quelleAlsText,
    senden: sendeLead,
    mailtoLink: mailtoLink,
    honeypotEinbauen: honeypotEinbauen,
    istBot: istBot,
    kassenlisteEinbauen: kassenlisteEinbauen
  };

  /* Quelle sofort beim Laden festhalten – auch wenn erst später abgeschickt wird. */
  ermittleQuelle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kassenlisteEinbauen);
  } else {
    kassenlisteEinbauen();
  }

  /* Frühwarnung: Ohne konfigurierten Kanal geht jede Anfrage verloren.
     Lieber beim Öffnen der Seite laut in der Konsole als still im Betrieb. */
  if (!CONFIG.WEBHOOK_URL && !CONFIG.FORMSUBMIT_AKTIV) {
    console.error(
      "[SwissPremia] Kein Versandkanal konfiguriert – Formulare können keine " +
      "Anfragen zustellen. Bitte WEBHOOK_URL in js/lead-core.js eintragen " +
      "(Anleitung: tools/lead-webhook.gs)."
    );
  }
})(window);
