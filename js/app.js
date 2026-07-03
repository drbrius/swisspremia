/* ===== PrämienCheck Schweiz – App-Logik ===== */
(function () {
  "use strict";

  // >>> HIER die E-Mail-Adresse ändern, an die Leads gesendet werden: <<<
  var LEAD_EMAIL = "drbrius@gmail.com";

  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) {
    return "CHF " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };
  var fmt2 = function (n) { return "CHF " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); };

  var letzteBerechnung = ""; // wird ins Lead-Formular übernommen

  /* ========== Tabs ========== */
  function aktiviereTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === name);
    });
    document.querySelectorAll(".tab-panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + name);
    });
  }
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { aktiviereTab(t.dataset.tab); });
  });
  document.querySelectorAll("[data-tab-link]").forEach(function (el) {
    el.addEventListener("click", function () {
      aktiviereTab(el.dataset.tabLink);
      document.getElementById("rechner").scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ========== Krankenkasse ========== */
  var kkRegionen = []; // mögliche [ort, kanton, region] zur eingegebenen PLZ

  function fuelleFranchisen() {
    var alter = $("kkAlter").value;
    var optionen = alter === "K" ? [0, 100, 200, 300, 400, 500, 600] : [300, 500, 1000, 1500, 2000, 2500];
    var standard = alter === "K" ? 0 : 300;
    var sel = $("kkFranchise");
    sel.innerHTML = "";
    optionen.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f;
      o.textContent = "CHF " + f + (f === standard ? " (tiefste Franchise)" : "");
      sel.appendChild(o);
    });
    // Kinder sind nicht erwerbstätig -> Unfalldeckung immer einschliessen
    var kind = alter === "K";
    $("kkUnfallField").style.display = kind ? "none" : "";
    if (kind) document.querySelector('input[name="kkUnfall"][value="M"]').checked = true;
  }
  $("kkAlter").addEventListener("change", fuelleFranchisen);
  fuelleFranchisen();

  function pruefePlz() {
    var plz = $("kkPlz").value.trim();
    var info = $("kkPlzInfo");
    var ortField = $("kkOrtField");
    kkRegionen = [];
    ortField.hidden = true;
    info.className = "field-hint";
    if (plz.length < 4) { info.textContent = ""; return; }
    var eintraege = window.PLZ_DATA[plz];
    if (!eintraege) {
      info.textContent = "PLZ nicht gefunden – bitte prüfen.";
      info.className = "field-hint err";
      return;
    }
    // Eindeutige Kanton/Region-Kombinationen
    var unique = [];
    eintraege.forEach(function (e) {
      var vorhanden = unique.find(function (u) { return u[1] === e[1] && u[2] === e[2]; });
      if (vorhanden) { if (vorhanden[0].indexOf(e[0]) < 0) vorhanden[0] += ", " + e[0]; }
      else unique.push([e[0], e[1], e[2]]);
    });
    kkRegionen = unique;
    if (unique.length === 1) {
      info.textContent = "✓ " + unique[0][0] + " (" + unique[0][1] + "), Prämienregion " + (unique[0][2] || "kantonal");
      info.className = "field-hint ok";
    } else {
      // PLZ liegt in mehreren Prämienregionen -> Ort wählen lassen
      var sel = $("kkOrt");
      sel.innerHTML = "";
      unique.forEach(function (u, i) {
        var o = document.createElement("option");
        o.value = i;
        o.textContent = u[0] + " (" + u[1] + ")";
        sel.appendChild(o);
      });
      ortField.hidden = false;
      info.textContent = "Diese PLZ liegt in mehreren Prämienregionen – bitte Ort wählen.";
    }
  }
  $("kkPlz").addEventListener("input", pruefePlz);

  $("kkBerechnen").addEventListener("click", function () {
    var info = $("kkPlzInfo");
    if (!kkRegionen.length) {
      info.textContent = "Bitte zuerst eine gültige PLZ eingeben.";
      info.className = "field-hint err";
      $("kkPlz").focus();
      return;
    }
    var region = kkRegionen.length === 1 ? kkRegionen[0] : kkRegionen[$("kkOrt").value];
    var alter = $("kkAlter").value;
    var franchise = $("kkFranchise").value;
    var unfall = document.querySelector('input[name="kkUnfall"]:checked').value;
    var modell = $("kkModell").value;

    var key = region[1] + region[2] + "|" + alter + "|" + franchise + "|" + unfall;
    var angebote = window.KK_DATA.praemien[key];
    // Fallback, falls die Region so nicht existiert
    if (!angebote) angebote = window.KK_DATA.praemien[region[1] + "0|" + alter + "|" + franchise + "|" + unfall];
    if (!angebote) angebote = window.KK_DATA.praemien[region[1] + "1|" + alter + "|" + franchise + "|" + unfall];

    var box = $("kkResultat");
    if (!angebote || !angebote.length) {
      box.hidden = false;
      box.innerHTML = '<div class="savings-banner" style="background:#fdecea;border-color:#f5c6c2;color:#8a1f16">Für diese Kombination wurden keine Prämien gefunden. Bitte Angaben prüfen.</div>';
      return;
    }

    var liste = angebote;
    if (modell !== "alle") {
      liste = angebote.filter(function (a) { return a[1] === Number(modell); });
    }
    liste = liste.slice(0, 10);

    var alterText = { E: "Erwachsene (26+)", J: "Junge Erwachsene (19–25)", K: "Kind (0–18)" }[alter];
    var unfallText = unfall === "M" ? "mit Unfall" : "ohne Unfall";
    var teuerste = angebote[angebote.length - 1][2];
    var ersparnis = (teuerste - liste[0][2]) * 12;

    var html = "";
    if (ersparnis > 50) {
      html += '<div class="savings-banner">💡 <strong>Sparpotenzial: bis ' + fmt(ersparnis) +
        ' pro Jahr</strong> – günstigstes vs. teuerstes angezeigtes Angebot in Ihrer Region.</div>';
    }
    html += '<div class="result-table-wrap"><table class="result-table"><thead><tr>' +
      "<th>#</th><th>Krankenkasse / Modell</th><th>Prämie / Monat</th><th>Prämie / Jahr</th><th></th>" +
      "</tr></thead><tbody>";
    liste.forEach(function (a, i) {
      var name = window.KK_DATA.versicherer[a[0]] || "Versicherer";
      var mod = window.KK_DATA.modelle[a[1]];
      html += "<tr" + (i === 0 ? ' class="best"' : "") + ">" +
        '<td class="rank">' + (i + 1) + "</td>" +
        '<td><div class="vname">' + name + "</div>" +
        '<span class="badge' + (i === 0 ? " top" : "") + '">' + (i === 0 ? "★ Günstigstes Angebot · " : "") + mod + "</span></td>" +
        '<td class="prem">' + fmt2(a[2]) + " <small>/Mt.</small></td>" +
        '<td class="pyear">' + fmt(a[2] * 12) + " /Jahr</td>" +
        '<td><button class="btn btn-row" data-offerte="' + name + "|" + mod + "|" + a[2].toFixed(2) + '">Offerte anfordern</button></td>' +
        "</tr>";
    });
    html += "</tbody></table></div>";
    html += '<div class="result-cta"><p><strong>Möchten Sie wechseln oder unsicher, welches Modell passt?</strong><br>' +
      "Ein Berater vergleicht kostenlos alle Angebote und übernimmt für Sie die Kündigung &amp; den Wechsel.</p>" +
      '<a href="#beratung" class="btn btn-primary" id="kkCta">Kostenlose Beratung</a></div>';
    html += '<p class="source-note">Grundversicherung (OKP) ' + window.KK_DATA.jahr + ", " + alterText + ", Franchise CHF " +
      franchise + ", " + unfallText + ", Region: " + region[0] + " (" + region[1] + "). Quelle: " + window.KK_DATA.quelle + ".</p>";

    box.innerHTML = html;
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "start" });

    letzteBerechnung = "Krankenkasse " + window.KK_DATA.jahr + ": PLZ " + $("kkPlz").value + " " + region[0] +
      " (" + region[1] + "), " + alterText + ", Franchise CHF " + franchise + ", " + unfallText +
      ". Günstigstes Angebot: " + (window.KK_DATA.versicherer[liste[0][0]] || "") + " " + fmt2(liste[0][2]) + "/Monat.";
    setzeInteresse("Krankenkasse");
    zeigeLeadZusammenfassung();

    // "Offerte anfordern"-Buttons in der Tabelle
    box.querySelectorAll("[data-offerte]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var teile = btn.dataset.offerte.split("|");
        letzteBerechnung = "Offerten-Anfrage Krankenkasse " + window.KK_DATA.jahr + ": " + teile[0] + " – " + teile[1] +
          ", CHF " + teile[2] + "/Monat (PLZ " + $("kkPlz").value + ", " + alterText + ", Franchise CHF " + franchise + ", " + unfallText + ").";
        setzeInteresse("Krankenkasse");
        zeigeLeadZusammenfassung();
        document.getElementById("beratung").scrollIntoView({ behavior: "smooth" });
      });
    });
  });

  /* ========== Autoversicherung (Marktspanne) ==========
     Kalibriert an publizierten Vergleichsdaten von moneyland.ch (2026).
     Referenzprofil: 30 Jahre, Kanton ZH, VW Golf (Wert ~CHF 35'000),
     10'000 km/Jahr, 5 schadenfreie Jahre. Jahresprämien:
       Haftpflicht 350–750 | + Teilkasko 150–400 | + Vollkasko 600–1'500 */
  var KANTONE = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];
  var kantonSel = $("autoKanton");
  KANTONE.forEach(function (k) {
    var o = document.createElement("option");
    o.value = k; o.textContent = k;
    if (k === "ZH") o.selected = true;
    kantonSel.appendChild(o);
  });
  var KANTON_FAKTOR = { GE: 1.2, TI: 1.2, BS: 1.15, VD: 1.12, ZH: 1.08, NE: 1.08, JU: 1.05, VS: 1.02,
    AI: 0.88, AR: 0.9, GR: 0.9, UR: 0.9, OW: 0.9, NW: 0.9, GL: 0.9, TG: 0.95, SG: 0.97 };
  var AUTO_REF = { HP: [350, 750], TK: [150, 400], VK: [600, 1500], wert: 35000, kantonF: 1.08, bonusF: 0.75 };

  $("autoBerechnen").addEventListener("click", function () {
    var kanton = kantonSel.value;
    var alter = Number($("autoAlter").value) || 35;
    var wert = Number($("autoWert").value) || 30000;
    var deckung = $("autoDeckung").value;
    var bonus = Number($("autoBonus").value);

    // Faktoren relativ zum Referenzprofil (30 J., ZH, 5 schadenfreie Jahre)
    var alterF = alter < 21 ? 1.75 : alter < 25 ? 1.45 : alter < 30 ? 1.15 : alter >= 75 ? 1.15 : 1.0;
    var kantonF = (KANTON_FAKTOR[kanton] || 1.0) / AUTO_REF.kantonF;
    var bonusF = bonus / AUTO_REF.bonusF;
    var wertF = Math.min(3, Math.max(0.5, wert / AUTO_REF.wert));
    var f = alterF * kantonF * bonusF;

    var von = AUTO_REF.HP[0] * f, bis = AUTO_REF.HP[1] * f;
    if (deckung === "tk") { von += AUTO_REF.TK[0] * wertF * f; bis += AUTO_REF.TK[1] * wertF * f; }
    if (deckung === "vk") { von += AUTO_REF.VK[0] * wertF * f; bis += AUTO_REF.VK[1] * wertF * f; }

    var deckungText = { hp: "Haftpflicht", tk: "Haftpflicht + Teilkasko", vk: "Haftpflicht + Vollkasko" }[deckung];
    var box = $("autoResultat");
    box.innerHTML =
      '<div class="estimate-card"><div class="estimate-sub">Marktspanne Jahresprämie (' + deckungText + ")</div>" +
      '<div class="estimate-range">' + fmt(von) + " – " + fmt(bis) + "</div>" +
      '<div class="estimate-sub"><strong>günstigster bis teuerster Anbieter</strong> – bei identischer Deckung liegen die Prämien ' +
      "in der Schweiz über 100&nbsp;% auseinander. Am günstigsten sind oft Online-Versicherer (z.&nbsp;B. Smile, Zurich Connect, Simpego).<br>" +
      "Ihr Berater holt kostenlos konkrete Offerten mehrerer Gesellschaften ein und findet den besten Preis.</div>" +
      '<a href="#beratung" class="btn btn-primary btn-big">Gratis Offerten anfordern</a>' +
      '<p class="source-note">Quelle: Vergleichsdaten moneyland.ch (2026), Referenzprofil 30 J. / Kanton ZH / Fahrzeugwert CHF 35\'000 / ' +
      "5 schadenfreie Jahre – angepasst an Ihre Angaben (Alter, Kanton, Fahrzeugwert, Bonusstufe). Unverbindliche Marktspanne, keine Offerte.</p></div>";
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "start" });

    letzteBerechnung = "Autoversicherung: Kanton " + kanton + ", Lenker/in " + alter + " Jahre, Fahrzeugwert " +
      fmt(wert) + ", " + deckungText + ". Marktspanne: " + fmt(von) + " – " + fmt(bis) + "/Jahr.";
    setzeInteresse("Autoversicherung");
    zeigeLeadZusammenfassung();
  });

  /* ========== Hausrat & Haftpflicht (Richtwert) ========== */
  function empfehleSumme() {
    var p = Number($("hrPersonen").value);
    var z = Number($("hrZimmer").value);
    $("hrSumme").value = 20000 + p * 20000 + z * 5000;
  }
  $("hrPersonen").addEventListener("change", empfehleSumme);
  $("hrZimmer").addEventListener("change", empfehleSumme);
  empfehleSumme();

  /* Kalibriert an der SRF-Kassensturz-Erhebung vom März 2024 (inkl. Privathaftpflicht 5 Mio.):
       Single, Mietwohnung, Summe CHF 72'000:  günstigster CHF 192 (Baloise), teuerste ~CHF 350 (Zurich/Mobiliar)
       Paar mit Eigenheim, Summe CHF 220'000:  günstigster ~CHF 370 (Smile), teuerste >CHF 700 (AXA/Zurich)
     Privathaftpflicht allein: Einzelperson ~CHF 60–150, Familie ~CHF 100–220 (Comparis/Marktübersicht). */
  var HR_ANKER = { s1: 72000, min1: 192, max1: 350, s2: 220000, min2: 370, max2: 700 };

  $("hrBerechnen").addEventListener("click", function () {
    var summe = Math.min(400000, Math.max(20000, Number($("hrSumme").value) || 60000));
    var personen = Number($("hrPersonen").value);
    var mitHaftpflicht = $("hrHaftpflicht").checked;

    // Lineare Interpolation zwischen den beiden publizierten Ankerprofilen (inkl. PHP)
    var t = (summe - HR_ANKER.s1) / (HR_ANKER.s2 - HR_ANKER.s1);
    var von = HR_ANKER.min1 + t * (HR_ANKER.min2 - HR_ANKER.min1);
    var bis = HR_ANKER.max1 + t * (HR_ANKER.max2 - HR_ANKER.max1);
    von = Math.max(120, von); bis = Math.max(220, bis);

    // Anteil Privathaftpflicht herausrechnen, falls nicht gewünscht
    if (!mitHaftpflicht) {
      von = Math.max(80, von - (personen === 1 ? 60 : 100));
      bis = Math.max(140, bis - (personen === 1 ? 150 : 220));
    }

    var box = $("hrResultat");
    box.innerHTML =
      '<div class="estimate-card"><div class="estimate-sub">Marktspanne Jahresprämie (Hausrat' +
      (mitHaftpflicht ? " + Privathaftpflicht 5 Mio." : "") + ")</div>" +
      '<div class="estimate-range">' + fmt(von) + " – " + fmt(bis) + "</div>" +
      '<div class="estimate-sub"><strong>günstigster bis teuerster Anbieter</strong> bei Versicherungssumme ' + fmt(summe) +
      ". Beim Wechsel zum günstigsten Anbieter sparen Singles bis 63&nbsp;%, Familien bis 40&nbsp;%.<br>" +
      "Ihr Berater vergleicht die Angebote und prüft auch Selbstbehalt und Zusatzdeckungen (Glas, Diebstahl auswärts, Erdbeben).</div>" +
      '<a href="#beratung" class="btn btn-primary btn-big">Gratis Offerten anfordern</a>' +
      '<p class="source-note">Quelle: SRF-Kassensturz-Prämienerhebung März 2024 (Single, Summe CHF 72\'000: CHF 192–350/Jahr; ' +
      "Paar mit Eigenheim, CHF 220'000: CHF 370–700+/Jahr, je inkl. Privathaftpflicht 5 Mio.), interpoliert auf Ihre Versicherungssumme. " +
      "Unverbindliche Marktspanne, keine Offerte.</p></div>";
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "start" });

    letzteBerechnung = "Hausrat" + (mitHaftpflicht ? " + Privathaftpflicht" : "") + ": Versicherungssumme " +
      fmt(summe) + ", " + personen + " Person(en). Marktspanne: " + fmt(von) + " – " + fmt(bis) + "/Jahr.";
    setzeInteresse("Hausrat/Haftpflicht");
    zeigeLeadZusammenfassung();
  });

  /* ========== Lead-Formular ========== */
  function setzeInteresse(wert) {
    var cb = document.querySelector('input[name="interesse"][value="' + wert + '"]');
    if (cb) cb.checked = true;
  }
  function zeigeLeadZusammenfassung() {
    var el = $("leadBerechnung");
    if (letzteBerechnung) {
      el.textContent = "📋 Ihre Berechnung: " + letzteBerechnung;
      el.hidden = false;
    }
  }

  $("leadForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fehler = $("lfError");
    fehler.hidden = true;

    var form = ev.target;
    if (!form.checkValidity()) {
      fehler.textContent = "Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.";
      fehler.hidden = false;
      form.reportValidity();
      return;
    }

    var interessen = Array.prototype.map.call(
      document.querySelectorAll('input[name="interesse"]:checked'),
      function (c) { return c.value; }
    ).join(", ") || "Keine Angabe";

    var lead = {
      _subject: "🔥 Neue Lead-Anfrage – PrämienCheck Schweiz",
      _template: "table",
      Anrede: $("lfAnrede").value,
      Vorname: $("lfVorname").value.trim(),
      Nachname: $("lfName").value.trim(),
      Telefon: $("lfTelefon").value.trim(),
      "E-Mail": $("lfEmail").value.trim(),
      "PLZ/Ort": $("lfPlzOrt").value.trim(),
      Interessen: interessen,
      Erreichbarkeit: $("lfZeit").value,
      Bemerkung: $("lfNachricht").value.trim(),
      Berechnung: letzteBerechnung || "Keine Berechnung durchgeführt",
      Zeitpunkt: new Date().toLocaleString("de-CH")
    };

    // Lokale Sicherungskopie aller Leads im Browser
    try {
      var leads = JSON.parse(localStorage.getItem("leads") || "[]");
      leads.push(lead);
      localStorage.setItem("leads", JSON.stringify(leads));
    } catch (e) { /* localStorage nicht verfügbar */ }

    var btn = $("lfSubmit");
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";

    fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead)
    })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function () { zeigeErfolg(); })
      .catch(function () {
        // Fallback: E-Mail-Programm öffnen, damit kein Lead verloren geht
        var body = Object.keys(lead)
          .filter(function (k) { return k.charAt(0) !== "_"; })
          .map(function (k) { return k + ": " + lead[k]; })
          .join("\n");
        window.location.href = "mailto:" + LEAD_EMAIL +
          "?subject=" + encodeURIComponent("Neue Lead-Anfrage – PrämienCheck") +
          "&body=" + encodeURIComponent(body);
        zeigeErfolg();
      });

    function zeigeErfolg() {
      form.hidden = true;
      $("leadSuccess").hidden = false;
      $("leadSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
