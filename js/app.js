/* ===== SwissPremia – App-Logik ===== */
(function () {
  "use strict";

  // Empfänger-Adresse, Webhook und Auto-Antwort werden zentral in
  // js/lead-core.js (CONFIG) gepflegt – für alle Seiten gemeinsam.

  var $ = function (id) { return document.getElementById(id); };
  var tausender = function (s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, "'"); };
  var fmt = function (n) { return "CHF " + tausender(Math.round(n).toString()); };
  var fmt2 = function (n) {
    var teile = n.toFixed(2).split(".");
    return "CHF " + tausender(teile[0]) + "." + teile[1];
  };
  /* Alles, was Besucher eintippen, wird vor dem Einsetzen ins HTML entschärft. */
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  var letzteBerechnung = ""; // wird ins Beratungsformular übernommen

  /* ========== Krankenkasse ========== */
  var kkRegionen = []; // mögliche [ort, kanton, region] zur eingegebenen PLZ

  /* Die Auswertung gibt es erst nach dem Absenden. Ist die Anfrage einmal
     übermittelt, darf in derselben Sitzung neu gerechnet werden, ohne dass
     jedes Mal ein weiterer Lead und eine weitere Bestätigung rausgehen. */
  var freigeschaltet = false;
  var kontakt = null;          // die übermittelten Angaben, für Offerten-Wünsche
  var stand = null;            // letzte Berechnung, für "alle anzeigen"
  var alleZeigen = false;
  var offertenGesendet = {};
  var TOP = 10;

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

  /* Heutige Kasse: die vom BAG zugelassenen Versicherer aus den Prämiendaten.
     Nur so lässt sich die heutige Kasse in der Auswertung wiederfinden. */
  function fuelleKassen() {
    var sel = $("kkKasse");
    var v = window.KK_DATA.versicherer;
    Object.keys(v)
      .map(function (id) { return { id: id, name: v[id] }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, "de"); })
      .concat([
        { id: "andere", name: "Andere Kasse / weiss ich nicht" },
        { id: "keine", name: "Noch keine Schweizer Krankenkasse" }
      ])
      .forEach(function (k) {
        var o = document.createElement("option");
        o.value = k.id;
        o.textContent = k.name;
        sel.appendChild(o);
      });
  }
  fuelleKassen();

  /* data/praemien.js enthält je Modell nur die günstigsten Kassen – genug
     für Tabellen, zu wenig, um JEDE heutige Kasse wiederzufinden. Schreibt
     tools/build_data.js zusätzlich die vollständigen Listen je Kanton
     (data/voll/<KT>.js, in KK_DATA.voll verzeichnet), werden sie geladen,
     sobald die Postleitzahl den Kanton verrät. Fehlen sie, rechnet die
     Auswertung mit der gekürzten Datei und sagt nur, was diese hergibt. */
  var vollGeladen = {};
  function ladeVoll(kanton) {
    var liste = window.KK_DATA.voll;
    if (!liste || liste.indexOf(kanton) < 0) return Promise.resolve(false);
    if (!vollGeladen[kanton]) {
      vollGeladen[kanton] = new Promise(function (fertig) {
        var skript = document.createElement("script");
        skript.src = "data/voll/" + kanton + ".js";
        skript.onload = function () { fertig(true); };
        skript.onerror = function () { fertig(false); };
        document.head.appendChild(skript);
      });
    }
    return vollGeladen[kanton];
  }
  /* Wartet höchstens vier Sekunden – dann lieber die gekürzte Liste. */
  function vollBereit() {
    var kantone = kkRegionen.map(function (r) { return r[1]; });
    return Promise.race([
      Promise.all(kantone.map(ladeVoll)),
      new Promise(function (weiter) { setTimeout(weiter, 4000); })
    ]);
  }

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
    unique.forEach(function (u) { ladeVoll(u[1]); });
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

  /* ---------- Berechnung ----------
     Liest die Eingaben und sucht die Angebote aus den BAG-Daten heraus.
     Rückgabe: null (PLZ fehlt), { fehler } oder das Ergebnis. */
  function berechne() {
    var info = $("kkPlzInfo");
    if (!kkRegionen.length) {
      info.textContent = "Bitte zuerst eine gültige PLZ eingeben.";
      info.className = "field-hint err";
      $("kkPlz").focus();
      return null;
    }
    var region = kkRegionen.length === 1 ? kkRegionen[0] : kkRegionen[$("kkOrt").value];
    var alter = $("kkAlter").value;
    var franchise = $("kkFranchise").value;
    var unfall = document.querySelector('input[name="kkUnfall"]:checked').value;
    var modell = $("kkModell").value;
    var daten = window.KK_DATA;

    var rest = "|" + alter + "|" + franchise + "|" + unfall;
    var schluessel = [region[1] + region[2] + rest, region[1] + "0" + rest, region[1] + "1" + rest];
    var voll = window.KK_VOLL || {};
    var angebote = null, vollstaendig = false;
    // Zweiter und dritter Schlüssel: Fallback, falls die Region so nicht existiert
    schluessel.forEach(function (k) {
      if (angebote) return;
      if (voll[k]) { angebote = voll[k]; vollstaendig = true; }
      else if (daten.praemien[k]) angebote = daten.praemien[k];
    });
    if (!angebote || !angebote.length) {
      return { fehler: "Für diese Kombination wurden keine Prämien gefunden. Bitte Angaben prüfen." };
    }

    var liste = modell === "alle"
      ? angebote
      : angebote.filter(function (a) { return a[1] === Number(modell); });
    if (!liste.length) {
      return { fehler: "In Ihrer Prämienregion bietet 2027 keine Kasse dieses Modell an. Bitte «Alle Modelle» wählen." };
    }

    var kasseId = $("kkKasse").value;
    var kasseName = daten.versicherer[kasseId] || "";
    var kasseText = kasseName ||
      (kasseId === "keine" ? "Noch keine Schweizer Krankenkasse" : "Andere Kasse / weiss ich nicht");

    /* Die heutige Kasse wird über alle Modelle betrachtet – welches Modell
       die Person heute hat, wissen wir nicht. */
    var heute = kasseName ? angebote.filter(function (a) { return String(a[0]) === kasseId; }) : [];
    var bester = liste[0][2];
    var teuerster = angebote[angebote.length - 1][2];

    /* Gekürzte Datei: Steht eine Kasse bei keinem Modell unter den ersten
       acht, kostet jedes ihrer Angebote mindestens so viel wie der achte
       Platz des günstigsten voll besetzten Modells. Das ist die Schwelle. */
    var schwelle = null;
    if (!vollstaendig) {
      var kappung = daten.topJeModell || 8;
      daten.modelle.forEach(function (m, nr) {
        var dieses = angebote.filter(function (a) { return a[1] === nr; });
        if (dieses.length < kappung) return;
        var letzter = dieses[dieses.length - 1][2];
        if (schwelle === null || letzter < schwelle) schwelle = letzter;
      });
    }

    return {
      region: region, plz: $("kkPlz").value.trim(),
      alter: alter, franchise: franchise, unfall: unfall, modell: modell,
      angebote: angebote, liste: liste,
      kasseId: kasseId, kasseName: kasseName, kasseText: kasseText,
      heute: heute, vollstaendig: vollstaendig, schwelle: schwelle,
      bester: bester, teuerster: teuerster,
      alterText: { E: "Erwachsene (26+)", J: "Junge Erwachsene (19–25)", K: "Kind (0–18)" }[alter],
      unfallText: unfall === "M" ? "mit Unfall" : "ohne Unfall",
      modellText: modell === "alle" ? "alle Modelle" : daten.modelle[modell],
      regionText: region[2] ? "Prämienregion " + region[1] + " " + region[2] : "Kanton " + region[1],
      jahr: daten.jahr, quelle: daten.quelle
    };
  }

  var name = function (a) { return window.KK_DATA.versicherer[a[0]] || "Versicherer"; };
  var modellName = function (a) { return window.KK_DATA.modelle[a[1]]; };

  /* Drei Kennzahlen über der Tabelle – dieselben stehen in der E-Mail.
     Jede Aussage vergleicht zwei bestimmte Angebote oder nennt eine
     Untergrenze; nichts davon hängt daran, ob die Liste vollständig ist. */
  function kennzahlen(b) {
    var erste = b.liste[0];
    var zahlen = [{
      name: "Günstigstes Angebot",
      wert: fmt2(erste[2]), einheit: "/Mt.",
      sub: name(erste) + " · " + modellName(erste)
    }];
    var titelHeute = "Ihre heutige Kasse " + b.jahr;
    var sparen = "Sparpotenzial pro Jahr";

    if (b.heute.length) {
      // Günstigstes Angebot der heutigen Kasse gegen das günstigste überhaupt
      // Ist ein Modell gewählt, zählt das Angebot der heutigen Kasse in diesem Modell.
      var imModell = b.liste.filter(function (x) { return String(x[0]) === b.kasseId; })[0];
      var h = imModell || b.heute[0];
      var teuerstesHeute = b.heute[b.heute.length - 1][2];
      var differenz = Math.round((h[2] - b.bester) * 12);
      zahlen.push({
        name: titelHeute, wert: fmt2(h[2]), einheit: "/Mt.",
        sub: b.kasseName + " · " + modellName(h) +
             (b.vollstaendig && teuerstesHeute > h[2] ? " – je nach Modell bis " + fmt2(teuerstesHeute) : "")
      });
      zahlen.push(differenz <= 0
        ? { name: sparen, wert: "CHF 0", einheit: "",
            sub: imModell
              ? "Ihre heutige Kasse hat hier bereits das günstigste Angebot. Modell und Franchise können sich trotzdem lohnen."
              : "Im gewählten Modell ist kein Angebot günstiger als das genannte Angebot Ihrer heutigen Kasse." }
        : { name: sparen, wert: fmt(differenz), einheit: "",
            sub: "günstigstes Angebot gegenüber " + b.kasseName + " (" + modellName(h) + "), bei gleicher Franchise" });
    } else if (b.kasseName && b.schwelle !== null) {
      // Heutige Kasse steht nicht in der gekürzten Liste: Untergrenze nennen
      zahlen.push({
        name: titelHeute, wert: "ab " + fmt2(b.schwelle), einheit: "/Mt.",
        sub: b.kasseName + " zählt in Ihrer Region bei keinem Modell zu den acht günstigsten Kassen."
      });
      zahlen.push({
        name: sparen, wert: "ab " + fmt(Math.floor((b.schwelle - b.bester) * 12)), einheit: "",
        sub: "mindestens, gegenüber Ihrer heutigen Kasse bei gleicher Franchise – den genauen Betrag rechnet Ihr Berater aus."
      });
    } else {
      var spanne = fmt((b.teuerster - b.bester) * 12);
      if (b.kasseName) {
        zahlen.push({
          name: titelHeute, wert: "–", einheit: "",
          sub: "Für " + b.kasseName + " gibt es in Ihrer Prämienregion " + b.jahr + " keine Prämie mit diesen Angaben."
        });
      } else {
        var standard = b.angebote.filter(function (x) { return x[1] === 0; })[0];
        zahlen.push(b.vollstaendig || !standard
          ? { name: "Teuerstes Angebot" + (b.vollstaendig ? "" : " der Auswahl"), wert: fmt2(b.teuerster), einheit: "/Mt.",
              sub: "bei gesetzlich identischen Leistungen" }
          : { name: "Günstigstes Standardmodell", wert: fmt2(standard[2]), einheit: "/Mt.",
              sub: name(standard) + " · freie Arztwahl" });
      }
      zahlen.push({
        name: "Unterschied pro Jahr",
        wert: (b.vollstaendig ? "bis " : "ab ") + spanne, einheit: "",
        sub: b.vollstaendig
          ? "zwischen dem günstigsten und dem teuersten Angebot in Ihrer Region"
          : "mindestens, zwischen dem günstigsten und dem teuersten Angebot in Ihrer Region"
      });
    }
    return zahlen;
  }

  /* Zeilen der Rangliste: die ersten zehn, dazu die heutige Kasse, falls sie
     weiter hinten steht. */
  function zeilen(b, alle) {
    var liste = b.liste.map(function (a, i) {
      return { a: a, rang: i + 1, heute: !!b.kasseName && String(a[0]) === b.kasseId };
    });
    if (alle || liste.length <= TOP) return liste;
    var oben = liste.slice(0, TOP);
    var heute = liste.slice(TOP).filter(function (z) { return z.heute; })[0];
    if (heute) oben.push(heute);
    return oben;
  }

  var kopfZeile = function (b) {
    return "Grundversicherung (OKP) " + b.jahr + ", " + b.alterText + ", Franchise " + fmt(Number(b.franchise)) +
      ", " + b.unfallText + ", " + b.modellText;
  };
  var ortZeile = function (b) {
    return b.plz + " " + b.region[0] + " (" + b.region[1] + "), " + b.regionText;
  };

  /* Die Auswertung als Text – für den Berater, das Sheet und als Rückfall. */
  function auswertungText(b) {
    return [kopfZeile(b), ortZeile(b)]
      .concat(kennzahlen(b).map(function (k) {
        return k.name + ": " + k.wert + (k.einheit ? " " + k.einheit : "") + " – " + k.sub;
      }))
      .concat(zeilen(b, false).map(function (z) {
        return z.rang + ". " + name(z.a) + " – " + modellName(z.a) + ": " + fmt2(z.a[2]) + "/Mt. (" +
          fmt(z.a[2] * 12) + "/Jahr)" + (z.heute ? " ← heutige Kasse" : "");
      }))
      .join("\n");
  }

  /* Dieselbe Auswertung in Feldern – daraus baut das Apps Script die Tabelle
     in der E-Mail (tools/lead-webhook.gs). Felder mit "_" erscheinen in
     keiner Feldliste. */
  function auswertungDaten(b) {
    return {
      jahr: b.jahr,
      titel: kopfZeile(b),
      ort: ortZeile(b),
      kennzahlen: kennzahlen(b).map(function (k) {
        return { name: k.name, wert: k.wert + (k.einheit ? " " + k.einheit : ""), sub: k.sub };
      }),
      zeilen: zeilen(b, false).map(function (z) {
        return {
          rang: z.rang, kasse: name(z.a), modell: modellName(z.a),
          monat: fmt2(z.a[2]), jahr: fmt(z.a[2] * 12), heute: z.heute
        };
      }),
      quelle: b.quelle
    };
  }

  /* ---------- Auswertung auf der Seite ---------- */
  function zeige(b, ohneScrollen) {
    stand = b;
    var box = $("kkResultat");
    var k = kontakt || {};
    var anrede = k.Anrede && k.Anrede !== "Keine Angabe"
      ? k.Anrede + " " + k.Nachname
      : [k.Vorname, k.Nachname].filter(Boolean).join(" ");

    var html = '<div class="auswertung-kopf">' +
      '<span class="eyebrow">Ihre Auswertung · Prämien ' + b.jahr + "</span>" +
      "<h3>" + (anrede ? esc(anrede) + ", das" : "Das") + " sind die günstigsten Angebote für " +
        esc(b.plz + " " + b.region[0]) + "</h3>" +
      "<p>" + esc(kopfZeile(b)) + " · " + esc(b.regionText) + "</p></div>";

    html += '<div class="kennzahlen">' + kennzahlen(b).map(function (z, i) {
      return '<div class="kennzahl' + (i === 0 ? " kennzahl--haupt" : "") + '">' +
        '<span class="kennzahl-label">' + esc(z.name) + "</span>" +
        '<div class="kennzahl-wert">' + esc(z.wert) + (z.einheit ? " <small>" + z.einheit + "</small>" : "") + "</div>" +
        '<div class="kennzahl-sub">' + esc(z.sub) + "</div></div>";
    }).join("") + "</div>";

    if (k["Auswertung per E-Mail"] === "Ja") {
      html += '<div class="savings-banner">✉ Diese Auswertung senden wir Ihnen zusätzlich an <strong>' +
        esc(k["E-Mail"]) + "</strong>.</div>";
    }

    html += '<div class="result-table-wrap"><table class="result-table"><thead><tr>' +
      "<th>#</th><th>Krankenkasse / Modell</th><th>Prämie / Monat</th><th>Prämie / Jahr</th><th></th>" +
      "</tr></thead><tbody>";
    zeilen(b, alleZeigen).forEach(function (z) {
      var a = z.a;
      var schluessel = a[0] + "|" + a[1];
      var klassen = [z.rang === 1 ? "best" : "", z.heute ? "heute" : ""].filter(Boolean).join(" ");
      html += "<tr" + (klassen ? ' class="' + klassen + '"' : "") + ">" +
        '<td class="rank">' + z.rang + "</td>" +
        '<td><div class="vname">' + esc(name(a)) + "</div>" +
        '<span class="badge' + (z.rang === 1 ? " top" : "") + '">' + (z.rang === 1 ? "★ Günstigstes Angebot · " : "") +
          esc(modellName(a)) + "</span>" +
        (z.heute ? ' <span class="badge heute">Ihre heutige Kasse</span>' : "") + "</td>" +
        '<td class="prem">' + fmt2(a[2]) + " <small>/Mt.</small></td>" +
        '<td class="pyear">' + fmt(a[2] * 12) + " /Jahr</td>" +
        "<td>" + (offertenGesendet[schluessel]
          ? '<button type="button" class="btn btn-row" disabled>✓ Angefragt</button>'
          : '<button type="button" class="btn btn-row" data-offerte="' + schluessel + '">Offerte anfordern</button>') +
        "</td></tr>";
    });
    html += "</tbody></table></div>";

    html += '<div class="auswertung-leiste">' +
      (b.liste.length > TOP
        ? '<button type="button" class="btn btn-small btn-ghost" id="kkAlle">' +
          (alleZeigen ? "Nur die ersten " + TOP + " anzeigen"
                       : (b.vollstaendig ? "Alle " + b.liste.length + " Angebote anzeigen" : "Weitere Angebote anzeigen")) + "</button>"
        : "") +
      '<button type="button" class="btn btn-small btn-ghost" id="kkAendern">Angaben ändern</button></div>';

    html += '<div class="result-cta"><p><strong>So geht es weiter</strong><br>' +
      "Ein lizenzierter Versicherungsvermittler meldet sich " + esc(LeadCore.config.RUECKRUF_VERSPRECHEN) +
      " bei Ihnen, prüft Modell und Franchise und übernimmt auf Wunsch Kündigung und Wechsel – kostenlos und unverbindlich.</p></div>";
    html += '<p class="source-note">' + esc(kopfZeile(b)) + ", Region: " + esc(b.region[0]) + " (" + b.region[1] +
      "). Die Leistungen der Grundversicherung sind bei allen Kassen gesetzlich identisch. Quelle: " + esc(b.quelle) + ".</p>";

    box.innerHTML = html;
    box.hidden = false;
    $("kkForm").hidden = true;
    if (!ohneScrollen) box.scrollIntoView({ behavior: "smooth", block: "start" });

    var alleKnopf = $("kkAlle");
    if (alleKnopf) alleKnopf.addEventListener("click", function () {
      alleZeigen = !alleZeigen;
      zeige(b, true);
    });
    $("kkAendern").addEventListener("click", function () {
      $("kkForm").hidden = false;
      $("kkBerechnen").textContent = "Auswertung aktualisieren";
      $("kkForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // "Offerte anfordern": Die Kontaktangaben liegen schon vor – ein Klick genügt.
    box.querySelectorAll("[data-offerte]").forEach(function (btn) {
      btn.addEventListener("click", function () { offerteAnfordern(b, btn); });
    });
  }

  function offerteAnfordern(b, btn) {
    var teile = btn.dataset.offerte.split("|");
    var a = b.liste.filter(function (x) { return String(x[0]) === teile[0] && String(x[1]) === teile[1]; })[0];
    if (!a || !kontakt) return;
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";

    var wunsch = "Offerten-Anfrage Krankenkasse " + b.jahr + ": " + name(a) + " – " + modellName(a) + ", " +
      fmt2(a[2]) + "/Monat (PLZ " + b.plz + ", " + b.alterText + ", Franchise " + fmt(Number(b.franchise)) +
      ", " + b.unfallText + ").";
    var angaben = {};
    ["Anrede", "Vorname", "Nachname", "Telefon", "E-Mail", "PLZ/Ort", "Grundversicherung",
     "Erreichbarkeit", "Einwilligung", "Einwilligungstext"].forEach(function (f) { angaben[f] = kontakt[f]; });
    angaben.Interessen = "Grundversicherung";
    angaben.Berechnung = wunsch;
    /* Die Person hat ihre Bestätigung schon – keine zweite pro Klick. */
    angaben._ohneBestaetigung = true;

    LeadCore.senden(angaben, {
      betreff: "🔥 Offerten-Wunsch – SwissPremia",
      prioritaet: "Hoch (Offerte gewünscht)"
    }).then(function (ergebnis) {
      if (!ergebnis.ok) {
        btn.disabled = false;
        btn.textContent = "Erneut senden";
        return;
      }
      offertenGesendet[btn.dataset.offerte] = true;
      btn.textContent = "✓ Angefragt";
      letzteBerechnung = wunsch;
      zeigeLeadZusammenfassung();
    });
  }

  /* ---------- Absenden: erst die Anfrage, dann die Auswertung ---------- */
  LeadCore.honeypotEinbauen($("kkForm"));

  $("kkTelefon").addEventListener("input", function () { $("kkTelefon").setCustomValidity(""); });

  $("kkForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var form = ev.target;
    var fehler = $("kkError");
    var btn = $("kkBerechnen");
    fehler.hidden = true;
    if (LeadCore.istBot(form)) return;

    if (!kkRegionen.length) { berechne(); return; }   // meldet die fehlende PLZ

    var tel = $("kkTelefon");
    tel.setCustomValidity(tel.value.replace(/\D/g, "").length >= 9 ? "" : "Bitte eine gültige Telefonnummer eingeben.");

    if (!form.checkValidity()) {
      var erstes = form.querySelector(":invalid");
      fehler.textContent = erstes && erstes.id === "kkConsent"
        ? "Bitte stimmen Sie der Weitergabe und der Kontaktaufnahme zu – erst dann können wir Ihnen die Auswertung anzeigen."
        : "Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.";
      fehler.hidden = false;
      form.reportValidity();
      return;
    }

    btn.disabled = true;
    vollBereit().then(function () {
      btn.disabled = false;
      var b = berechne();
      if (!b) return;
      if (b.fehler) {
        fehler.textContent = b.fehler;
        fehler.hidden = false;
        return;
      }
      if (freigeschaltet) { zeige(b); return; }
      anfrageSenden(form, b);
    });
  });

  function anfrageSenden(form, b) {
    var fehler = $("kkError");
    var btn = $("kkBerechnen");
    var tel = $("kkTelefon");

    letzteBerechnung = "Krankenkasse " + b.jahr + ": PLZ " + b.plz + " " + b.region[0] + " (" + b.region[1] + "), " +
      b.alterText + ", Franchise " + fmt(Number(b.franchise)) + ", " + b.unfallText + ", " + b.modellText +
      ". Günstigstes Angebot: " + name(b.liste[0]) + " " + fmt2(b.liste[0][2]) + "/Monat." +
      (b.heute.length
        ? " Heutige Kasse " + b.kasseName + " " + b.jahr + ": " + fmt2(b.heute[0][2]) + "/Monat (" + modellName(b.heute[0]) + ")."
        : " Heutige Kasse: " + b.kasseText + ".");

    var angaben = {
      Anrede: $("kkAnrede").value,
      Vorname: $("kkVorname").value.trim(),
      Nachname: $("kkNachname").value.trim(),
      Telefon: tel.value.trim(),
      "E-Mail": $("kkEmail").value.trim(),
      "PLZ/Ort": b.plz + " " + b.region[0] + " (" + b.region[1] + ")",
      Alter: b.alterText,
      Grundversicherung: b.kasseText,
      Franchise: fmt(Number(b.franchise)),
      Modell: b.modellText,
      Unfalldeckung: b.unfallText,
      Interessen: "Grundversicherung",
      Erreichbarkeit: $("kkZeit").value,
      Berechnung: letzteBerechnung,
      Auswertung: auswertungText(b),
      "Auswertung per E-Mail": $("kkPerMail").checked ? "Ja" : "Nein",
      _auswertung: auswertungDaten(b)
    };

    // Einwilligung samt Wortlaut – der Vermittler muss belegen können, wozu zugestimmt wurde.
    var einwilligung = LeadCore.einwilligung(form);
    Object.keys(einwilligung).forEach(function (k) { angaben[k] = einwilligung[k]; });

    btn.disabled = true;
    btn.textContent = "Auswertung wird erstellt …";

    LeadCore.senden(angaben, {
      betreff: "🔥 Neue Auswertung – SwissPremia",
      prioritaet: "Hoch (Auswertung erhalten)"
    }).then(function (ergebnis) {
      btn.disabled = false;
      if (!ergebnis.ok) {
        // Ohne übermittelte Anfrage keine Auswertung – verständlich melden.
        btn.textContent = "Erneut versuchen";
        fehler.innerHTML =
          "Ihre Angaben konnten gerade nicht übermittelt werden. " +
          "Bitte versuchen Sie es nochmals – oder senden Sie uns Ihre Angaben direkt " +
          '<a href="' + LeadCore.mailtoLink(ergebnis.lead) + '">per E-Mail</a>.';
        fehler.hidden = false;
        return;
      }
      btn.textContent = "Auswertung aktualisieren";
      freigeschaltet = true;
      kontakt = angaben;
      zeige(b);
      uebernehmeInsBeratungsformular();
    });
  }

  /* Wer nach der Auswertung noch das Beratungsformular nutzt (etwa für die
     Zusatzversicherung), soll nichts doppelt eintippen. */
  function uebernehmeInsBeratungsformular() {
    var paare = {
      lfVorname: "Vorname", lfName: "Nachname", lfTelefon: "Telefon", lfEmail: "E-Mail", lfPlzOrt: "PLZ/Ort"
    };
    Object.keys(paare).forEach(function (id) {
      if ($(id) && !$(id).value) $(id).value = kontakt[paare[id]];
    });
    if ($("lfAnrede")) $("lfAnrede").value = kontakt.Anrede;
    if ($("lfKasseGrund") && !$("lfKasseGrund").value && stand && stand.kasseName) {
      $("lfKasseGrund").value = stand.kasseName;
    }
    setzeInteresse("Grundversicherung");
    zeigeLeadZusammenfassung();
  }

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

    var angaben = {
      Anrede: $("lfAnrede").value,
      Vorname: $("lfVorname").value.trim(),
      Nachname: $("lfName").value.trim(),
      Telefon: $("lfTelefon").value.trim(),
      "E-Mail": $("lfEmail").value.trim(),
      "PLZ/Ort": $("lfPlzOrt").value.trim(),
      Grundversicherung: $("lfKasseGrund").value.trim() || "Keine Angabe",
      Franchise: $("lfFranchise").value || "Weiss ich nicht",
      Zusatzversicherung: $("lfKasseZusatz").value.trim() || "Keine Angabe",
      Interessen: interessen,
      Erreichbarkeit: $("lfZeit").value,
      Bemerkung: $("lfNachricht").value.trim(),
      Berechnung: letzteBerechnung || "Keine Berechnung durchgeführt"
    };

    // Einwilligung samt Wortlaut – der Vermittler muss belegen können, wozu zugestimmt wurde.
    var einwilligung = LeadCore.einwilligung(form);
    Object.keys(einwilligung).forEach(function (k) { angaben[k] = einwilligung[k]; });

    // Versand, Quellen-Tracking, Sicherungskopie und Auto-Antwort: siehe js/lead-core.js
    LeadCore.senden(angaben, {
      betreff: "🔥 Neue Lead-Anfrage – SwissPremia",
      prioritaet: letzteBerechnung ? "Hoch (hat gerechnet)" : "Normal"
    }).then(function (ergebnis) {
      if (ergebnis.ok) { zeigeErfolg(); return; }

      // Versand fehlgeschlagen: verständlich melden statt Erfolg vortäuschen
      btn.disabled = false;
      btn.textContent = "Erneut senden";
      fehler.innerHTML =
        "Ihre Anfrage konnte gerade nicht übermittelt werden. " +
        "Bitte versuchen Sie es nochmals – oder senden Sie uns Ihre Angaben direkt " +
        '<a href="' + LeadCore.mailtoLink(ergebnis.lead) + '">per E-Mail</a>.';
      fehler.hidden = false;
    });

    function zeigeErfolg() {
      form.hidden = true;
      $("leadSuccess").hidden = false;
      $("leadSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
