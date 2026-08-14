/* =========================================================================
   SwissPremia – Landingpage-Logik
   Zwei Aufgaben: Sprachumschaltung (DE/EN) und Formularversand über LeadCore.
   ========================================================================= */
(function (global) {
  "use strict";

  /* ---------------------------------------------------------------
     Sprachumschaltung
     Texte stehen direkt im HTML als data-de="…" data-en="…".
     Platzhalter analog als data-de-ph="…" data-en-ph="…".
     --------------------------------------------------------------- */
  function spracheSetzen(sprache) {
    document.documentElement.lang = sprache === "en" ? "en" : "de-CH";

    Array.prototype.forEach.call(document.querySelectorAll("[data-de]"), function (el) {
      var text = el.getAttribute("data-" + sprache);
      if (text !== null) el.innerHTML = text;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-de-ph]"), function (el) {
      var ph = el.getAttribute("data-" + sprache + "-ph");
      if (ph !== null) el.placeholder = ph;
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-lang-btn]"), function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang-btn") === sprache ? "true" : "false");
    });

    try { sessionStorage.setItem("pc_lang", sprache); } catch (e) {}
    global.LP.sprache = sprache;
  }

  function spracheErmitteln() {
    var params = new URLSearchParams(global.location.search);
    var ausUrl = params.get("lang");
    if (ausUrl === "en" || ausUrl === "de") return ausUrl;

    var gespeichert = null;
    try { gespeichert = sessionStorage.getItem("pc_lang"); } catch (e) {}
    if (gespeichert) return gespeichert;

    /* Kein Hinweis in der URL: Browsersprache entscheidet.
       Deutschsprachige bleiben auf DE, alle anderen sehen EN. */
    var browser = (navigator.language || "de").toLowerCase();
    return browser.indexOf("de") === 0 ? "de" : "en";
  }

  /* ---------------------------------------------------------------
     Formularversand
     --------------------------------------------------------------- */
  function formularAnbinden(optionen) {
    var form = document.getElementById(optionen.formId);
    if (!form) return;

    LeadCore.honeypotEinbauen(form);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (LeadCore.istBot(form)) return;

      var fehler = form.querySelector(".form-error");
      if (fehler) fehler.hidden = true;

      if (!form.checkValidity()) {
        if (fehler) {
          fehler.textContent = global.LP.sprache === "en"
            ? "Please complete all required fields (*)."
            : "Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.";
          fehler.hidden = false;
        }
        form.reportValidity();
        return;
      }

      /* Alle sichtbaren Felder einsammeln – Beschriftung kommt aus data-label. */
      var felder = {};
      Array.prototype.forEach.call(form.querySelectorAll("[name]"), function (el) {
        if (el.name.charAt(0) === "_") return;
        var label = el.getAttribute("data-label") || el.name;
        if (el.type === "checkbox") {
          if (!el.checked) return;
          felder[label] = felder[label] ? felder[label] + ", " + el.value : el.value;
        } else if (el.value.trim()) {
          felder[label] = el.value.trim();
        }
      });
      felder.Sprache = global.LP.sprache === "en" ? "Englisch" : "Deutsch";

      var btn = form.querySelector('button[type="submit"]');
      var urspruenglich = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = global.LP.sprache === "en" ? "Sending …" : "Wird gesendet …";
      }

      LeadCore.senden(felder, {
        betreff: optionen.betreff,
        kampagne: optionen.kampagne,
        prioritaet: optionen.prioritaet || "Normal"
      }).then(function (ergebnis) {
        if (ergebnis && ergebnis.ok) {
          var ziel = optionen.danke || LeadCore.config.DANKE_URL;
          global.location.href = ziel +
            "?k=" + encodeURIComponent(optionen.kampagne) +
            "&lang=" + global.LP.sprache;
          return;
        }

        /* Versand fehlgeschlagen: nicht auf die Danke-Seite weiterleiten,
           sonst glaubt der Interessent, die Anfrage sei angekommen. */
        if (btn) { btn.disabled = false; btn.textContent = urspruenglich; }
        if (fehler) {
          fehler.innerHTML = global.LP.sprache === "en"
            ? "We could not submit your request just now. Please try again – or send us your details " +
              '<a href="' + LeadCore.mailtoLink(ergebnis.lead) + '">by email</a>.'
            : "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es nochmals – " +
              'oder senden Sie uns Ihre Angaben <a href="' + LeadCore.mailtoLink(ergebnis.lead) + '">per E-Mail</a>.';
          fehler.hidden = false;
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = urspruenglich; }
      });
    });
  }

  global.LP = {
    sprache: "de",
    spracheSetzen: spracheSetzen,
    formularAnbinden: formularAnbinden,
    init: function (optionen) {
      /* Einsprachige Seiten setzen sprache: "de" fest – sonst würde bei einem
         englischen Browser die Bestätigungsmail in der falschen Sprache rausgehen. */
      var fest = optionen && optionen.sprache;
      spracheSetzen(fest || spracheErmitteln());
      Array.prototype.forEach.call(document.querySelectorAll("[data-lang-btn]"), function (btn) {
        btn.addEventListener("click", function () {
          spracheSetzen(btn.getAttribute("data-lang-btn"));
        });
      });
      if (optionen && optionen.formId) formularAnbinden(optionen);
    }
  };
})(window);
