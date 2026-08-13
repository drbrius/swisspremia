/* ===== SwissPremia – App-Logik ===== */
(function () {
  "use strict";

  // Empfänger-Adresse, Webhook und Auto-Antwort werden zentral in
  // js/lead-core.js (CONFIG) gepflegt – für alle Seiten gemeinsam.

  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) {
    return "CHF " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };
  var fmt2 = function (n) { return "CHF " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); };

  var letzteBerechnung = ""; // wird ins Lead-Formular übernommen

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
    setzeInteresse("Grundversicherung");
    zeigeLeadZusammenfassung();

    // "Offerte anfordern"-Buttons in der Tabelle
    box.querySelectorAll("[data-offerte]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var teile = btn.dataset.offerte.split("|");
        letzteBerechnung = "Offerten-Anfrage Krankenkasse " + window.KK_DATA.jahr + ": " + teile[0] + " – " + teile[1] +
          ", CHF " + teile[2] + "/Monat (PLZ " + $("kkPlz").value + ", " + alterText + ", Franchise CHF " + franchise + ", " + unfallText + ").";
        setzeInteresse("Grundversicherung");
        zeigeLeadZusammenfassung();
        document.getElementById("beratung").scrollIntoView({ behavior: "smooth" });
      });
    });
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

  LeadCore.honeypotEinbauen($("leadForm"));

  $("leadForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fehler = $("lfError");
    fehler.hidden = true;

    var form = ev.target;
    if (LeadCore.istBot(form)) return;
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

    var btn = $("lfSubmit");
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";

    // Versand, Quellen-Tracking, Sicherungskopie und Auto-Antwort: siehe js/lead-core.js
    LeadCore.senden({
      Anrede: $("lfAnrede").value,
      Vorname: $("lfVorname").value.trim(),
      Nachname: $("lfName").value.trim(),
      Telefon: $("lfTelefon").value.trim(),
      "E-Mail": $("lfEmail").value.trim(),
      "PLZ/Ort": $("lfPlzOrt").value.trim(),
      Interessen: interessen,
      Erreichbarkeit: $("lfZeit").value,
      Bemerkung: $("lfNachricht").value.trim(),
      Berechnung: letzteBerechnung || "Keine Berechnung durchgeführt"
    }, {
      betreff: "🔥 Neue Lead-Anfrage – SwissPremia",
      prioritaet: letzteBerechnung ? "Hoch (hat gerechnet)" : "Normal"
    }).then(zeigeErfolg);

    function zeigeErfolg() {
      form.hidden = true;
      $("leadSuccess").hidden = false;
      $("leadSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
