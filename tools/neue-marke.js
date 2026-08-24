/* =========================================================================
   Neue Marke aus der Vorlage erzeugen

       node tools/neue-marke.js kassenklar
       node tools/neue-marke.js --alle

   Nimmt die Website im Projektstamm (swisspremia) als Vorlage und legt
   daraus unter sites/<id>/ eine eigenstaendige, sofort ausrollbare Website
   an: eigener Name, eigene Domain, eigenes Design, eigene Icons.

   Absicht: 20 Marken sollen nicht 20 gepflegte Kopien sein. Geaendert wird
   immer die Vorlage; danach werden die Marken neu erzeugt. Alles unter
   sites/ ist Ergebnis und darf jederzeit ueberschrieben werden.

   Was jede Marke eindeutig macht:
     - SITE_ID und SITE_NAME in js/lead-core.js
     - daraus die Spalte "Website" im gemeinsamen Google Sheet

   Alle Marken schicken ihre Leads an denselben Webhook. Die Leads landen
   also in einer Liste und tragen die Marke, aus der sie stammen.
   ========================================================================= */
"use strict";

var fs = require("fs");
var pfad = require("path");
var icons = require("./icons");

var STAMM = pfad.join(__dirname, "..");
var ZIEL_STAMM = pfad.join(STAMM, "sites");

/* Vorlage: was uebernommen wird. Verzeichnisse werden mitsamt Inhalt
   kopiert, Textdateien dabei umgeschrieben. */
var UEBERNEHMEN = [
  "index.html",
  "impressum.html",
  "datenschutz.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  ".nojekyll",
  "css",
  "js",
  "data",
  "lp"
];

/* Dateiendungen, in denen Marken- und Domainnamen ersetzt werden. */
var TEXT = [".html", ".css", ".js", ".txt", ".xml", ".webmanifest", ".json"];

function istText(datei) {
  return TEXT.indexOf(pfad.extname(datei).toLowerCase()) !== -1;
}

/* ------------------------------------------------------------- Ersetzen */

function umschreiben(inhalt, marke) {
  return inhalt
    /* Im Logo ist der Name auf zwei Elemente verteilt: Swiss<strong>Premia
       </strong>. Eine Ersetzung von "SwissPremia" greift dort nicht – ohne
       diesen Fall stuende in Kopf- und Fusszeile weiter die alte Marke. */
    .split("Swiss<strong>Premia</strong>")
    .join(marke.logoHtml || marke.name)
    /* Domain zuerst: sonst wuerde "SwissPremia" in swisspremia.ch mitgehen. */
    .split("www.swisspremia.ch").join("www." + marke.domain)
    .split("swisspremia.ch").join(marke.domain)
    .split("SwissPremia").join(marke.name)
    .split("swisspremia").join(marke.id)
    /* Leitfarbe der Vorlage, u. a. im Manifest und in den Mail-Vorlagen. */
    .split("#005786").join(marke.themeFarbe);
}

/* Die Datei js/lead-core.js braucht mehr als eine Textersetzung: die
   Kennung muss exakt stimmen, sonst ist der Lead im Sheet falsch
   zugeordnet. Und die Empfaengeradresse bleibt bewusst eine Entscheidung
   aus marken.json, nicht ein Nebeneffekt der Domainersetzung. */
function leadCoreAnpassen(inhalt, marke) {
  return inhalt
    .replace(/SITE_ID:\s*"[^"]*"/, 'SITE_ID: "' + marke.id + '"')
    .replace(/SITE_NAME:\s*"[^"]*"/, 'SITE_NAME: "' + marke.name + '"')
    .replace(/LEAD_EMAIL:\s*"[^"]*"/, 'LEAD_EMAIL: "' + marke.email + '"');
}

/* Die Vorlage laedt Figtree. Jedes Theme bringt seine eigenen Schriften
   per @import mit, deshalb faellt der Verweis der Vorlage weg – sonst laedt
   jede Marke eine Schrift, die sie gar nicht benutzt. */
function schriftDerVorlageEntfernen(inhalt) {
  return inhalt.replace(/[ \t]*<link[^>]+fonts\.googleapis\.com\/css2[^>]*>\n/g, "");
}

/* Das Theme liegt hinter den Stylesheets der Vorlage und ueberschreibt
   sie. Der Verweis muss deshalb als letzter im Kopf stehen. */
function themeVerlinken(inhalt) {
  if (inhalt.indexOf("css/theme.css") !== -1) return inhalt;

  var treffer = inhalt.match(/[ \t]*<link[^>]+rel="stylesheet"[^>]*>\n/g);
  if (!treffer) return inhalt;

  var letzter = treffer[treffer.length - 1];
  var einzug = (letzter.match(/^[ \t]*/) || [""])[0];
  return inhalt.replace(
    letzter,
    letzter + einzug + '<link rel="stylesheet" href="/css/theme.css">\n'
  );
}

/* Stellt die Abschnitte der Startseite in die Reihenfolge aus marken.json.

   Bewusst im Dokument und nicht per CSS-"order": Wer die Seite mit der
   Tastatur bedient oder vorlesen laesst, folgt der Reihenfolge im HTML.
   Eine rein optische Umsortierung wuerde beides auseinanderlaufen lassen.

   Der Hero bleibt, wo er ist – umsortiert wird nur, was eine id hat. */
function abschnitteSortieren(inhalt, marke) {
  if (!Array.isArray(marke.abschnitte) || !marke.abschnitte.length) return inhalt;

  var muster = /^<section id="([^"]+)"[\s\S]*?^<\/section>\n/gm;
  var bloecke = {};
  var gefunden = [];
  var erster = -1;
  var letzter = -1;
  var treffer;

  while ((treffer = muster.exec(inhalt)) !== null) {
    bloecke[treffer[1]] = treffer[0];
    gefunden.push(treffer[1]);
    if (erster === -1) erster = treffer.index;
    letzter = treffer.index + treffer[0].length;
  }

  if (!gefunden.length) return inhalt;

  /* Laut abbrechen statt stillschweigend einen Abschnitt zu verlieren:
     eine Seite ohne Formular faellt beim Durchklicken nicht zwingend auf. */
  var fehlt = gefunden.filter(function (id) { return marke.abschnitte.indexOf(id) === -1; });
  var unbekannt = marke.abschnitte.filter(function (id) { return gefunden.indexOf(id) === -1; });

  if (fehlt.length || unbekannt.length) {
    throw new Error(
      'Abschnittsliste von "' + marke.id + '" passt nicht zur Vorlage.\n' +
      (fehlt.length ? "  fehlt in marken.json: " + fehlt.join(", ") + "\n" : "") +
      (unbekannt.length ? "  gibt es in der Vorlage nicht: " + unbekannt.join(", ") + "\n" : "") +
      "  Vorlage hat: " + gefunden.join(", ")
    );
  }

  var neu = marke.abschnitte.map(function (id) { return bloecke[id]; }).join("");
  return inhalt.slice(0, erster) + neu + inhalt.slice(letzter);
}

/* ------------------------------------------------------------- Kopieren */

function kopieren(von, nach, marke) {
  var status = fs.statSync(von);

  if (status.isDirectory()) {
    fs.mkdirSync(nach, { recursive: true });
    fs.readdirSync(von).forEach(function (eintrag) {
      kopieren(pfad.join(von, eintrag), pfad.join(nach, eintrag), marke);
    });
    return;
  }

  if (!istText(von)) {
    fs.copyFileSync(von, nach);
    return;
  }

  var inhalt = fs.readFileSync(von, "utf8");
  inhalt = umschreiben(inhalt, marke);

  if (pfad.basename(von) === "lead-core.js") inhalt = leadCoreAnpassen(inhalt, marke);
  if (pfad.extname(von) === ".html") inhalt = schriftDerVorlageEntfernen(themeVerlinken(inhalt));
  if (pfad.basename(von) === "index.html") inhalt = abschnitteSortieren(inhalt, marke);

  fs.writeFileSync(nach, inhalt, "utf8");
}

/* --------------------------------------------------------------- Bauen */

function bauen(marke) {
  var ziel = pfad.join(ZIEL_STAMM, marke.id);
  var theme = pfad.join(__dirname, "themes", marke.id + ".css");

  if (!fs.existsSync(theme)) {
    throw new Error(
      "Kein Theme fuer \"" + marke.id + "\".\n" +
      "Erwartet: tools/themes/" + marke.id + ".css\n" +
      "Ohne eigenes Theme waere die Marke eine reine Farbkopie – das ist " +
      "genau das, was vermieden werden soll."
    );
  }

  fs.rmSync(ziel, { recursive: true, force: true });
  fs.mkdirSync(ziel, { recursive: true });

  UEBERNEHMEN.forEach(function (eintrag) {
    var von = pfad.join(STAMM, eintrag);
    if (!fs.existsSync(von)) return;
    kopieren(von, pfad.join(ziel, eintrag), marke);
  });

  fs.copyFileSync(theme, pfad.join(ziel, "css", "theme.css"));

  var erzeugt = icons.alleIcons(marke);
  Object.keys(erzeugt).forEach(function (name) {
    fs.writeFileSync(pfad.join(ziel, name), erzeugt[name]);
  });

  var seiten = zaehleSeiten(ziel);
  console.log(
    "  " + marke.name + "  ->  sites/" + marke.id +
    "   (" + seiten + " Seiten, " + Object.keys(erzeugt).length + " Icons, " + marke.domain + ")"
  );
}

function zaehleSeiten(verzeichnis) {
  var n = 0;
  fs.readdirSync(verzeichnis, { withFileTypes: true }).forEach(function (e) {
    if (e.isDirectory()) n += zaehleSeiten(pfad.join(verzeichnis, e.name));
    else if (e.name.endsWith(".html")) n++;
  });
  return n;
}

/* --------------------------------------------------------------- Start */

function main() {
  var marken = JSON.parse(fs.readFileSync(pfad.join(__dirname, "marken.json"), "utf8"));
  var wunsch = process.argv[2];

  if (!wunsch) {
    console.log("Aufruf: node tools/neue-marke.js <id|--alle>\n");
    console.log("Eingetragene Marken:");
    marken.forEach(function (m) { console.log("  " + m.id + "  (" + m.domain + ")"); });
    process.exit(1);
  }

  var auswahl = wunsch === "--alle"
    ? marken
    : marken.filter(function (m) { return m.id === wunsch; });

  if (!auswahl.length) {
    console.error('Marke "' + wunsch + '" steht nicht in tools/marken.json.');
    process.exit(1);
  }

  console.log("");
  auswahl.forEach(bauen);
  console.log("\nFertig. Jede Marke ist ein eigenes Wurzelverzeichnis fuer Vercel.\n");
}

main();
