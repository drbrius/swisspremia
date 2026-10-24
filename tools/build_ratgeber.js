/* =========================================================================
   Ratgeber erzeugen

       node tools/build_ratgeber.js

   Liest tools/ratgeber-inhalte.js und schreibt:
     ratgeber/index.html          Uebersicht, nach Themen gruppiert
     ratgeber/<slug>.html         je ein Ratgeber
     sitemap.xml                  komplett neu, mit allen Seiten

   Die Ratgeber gehoeren NUR zu swisspremia.ch. Der Marken-Generator
   (neue-marke.js) uebernimmt den Ordner nicht und entfernt Verweise
   darauf – derselbe Text auf zwanzig Domains waere fuer Google eine
   Dublette und wuerde allen Marken zusammen schaden.
   ========================================================================= */
"use strict";

var fs = require("fs");
var pfad = require("path");
var RATGEBER = require("./ratgeber-inhalte");

var STAMM = pfad.join(__dirname, "..");
var ZIEL = pfad.join(STAMM, "ratgeber");
var BASIS = "https://www.swisspremia.ch";
var MARKE = "SwissPremia";
var HEUTE = new Date().toISOString().slice(0, 10);

/* Seiten, die es neben den Ratgebern gibt. Die Sitemap wird als Ganzes
   geschrieben, damit sie nie halb aktuell ist. */
var WEITERE_SEITEN = [
  { pfad: "/",                            lastmod: "2026-10-24", freq: "weekly",  prio: "1.0" },
  { pfad: "/ratgeber/",                   lastmod: HEUTE,        freq: "weekly",  prio: "0.9" },
  { pfad: "/lp/neu-in-der-schweiz.html",  lastmod: "2026-08-20", freq: "monthly", prio: "0.9" },
  { pfad: "/lp/praemien-2027.html",       lastmod: "2026-08-24", freq: "monthly", prio: "0.9" },
  { pfad: "/lp/baby.html",                lastmod: "2026-08-20", freq: "monthly", prio: "0.8" },
  { pfad: "/lp/junge-erwachsene.html",    lastmod: "2026-08-20", freq: "monthly", prio: "0.8" },
  { pfad: "/impressum.html",              lastmod: "2026-08-20", freq: "yearly",  prio: "0.3" },
  { pfad: "/datenschutz.html",            lastmod: "2026-08-20", freq: "yearly",  prio: "0.3" }
];

/* ------------------------------------------------------------ Helfer */

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Fuer JSON-LD: aus HTML-Antworten den reinen Text machen. */
function text(html) {
  return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function bildUrl(id, w, h) {
  return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&crop=entropy&w=" + w + "&h=" + h + "&q=70";
}

function nachSlug(slug) {
  return RATGEBER.find(function (r) { return r.slug === slug; });
}

/* -------------------------------------------------------- Bausteine */

function kopf(o) {
  var url = BASIS + o.pfad;
  var titel = esc(o.titel + " | " + MARKE);
  var beschr = esc(o.beschreibung);
  var og = bildUrl(o.bild, 1200, 630);
  return '<!DOCTYPE html>\n<html lang="de-CH">\n<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + titel + '</title>\n' +
    '  <meta name="description" content="' + beschr + '">\n' +
    '  <link rel="canonical" href="' + url + '">\n' +
    '  <meta name="robots" content="index, follow, max-image-preview:large">\n' +
    '  <meta name="geo.region" content="CH">\n\n' +
    '  <meta property="og:type" content="article">\n' +
    '  <meta property="og:locale" content="de_CH">\n' +
    '  <meta property="og:site_name" content="' + MARKE + '">\n' +
    '  <meta property="og:url" content="' + url + '">\n' +
    '  <meta property="og:title" content="' + titel + '">\n' +
    '  <meta property="og:description" content="' + beschr + '">\n' +
    '  <meta property="og:image" content="' + og + '">\n' +
    '  <meta name="twitter:card" content="summary_large_image">\n' +
    '  <meta name="twitter:title" content="' + titel + '">\n' +
    '  <meta name="twitter:description" content="' + beschr + '">\n' +
    '  <meta name="twitter:image" content="' + og + '">\n\n' +
    o.jsonld +
    '\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n' +
    '  <link rel="stylesheet" href="/css/style.css">\n' +
    '  <link rel="stylesheet" href="/css/lp.css">\n' +
    '  <link rel="icon" href="/favicon.ico" sizes="48x48">\n' +
    '  <link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96">\n' +
    '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
    '  <link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
    '  <link rel="manifest" href="/site.webmanifest">\n' +
    '  <style>\n' +
    '    .ratgeber-text h2 { font-size: 1.45rem; margin: 40px 0 14px; }\n' +
    '    .ratgeber-text p, .ratgeber-text li { font-size: 1.02rem; line-height: 1.7; }\n' +
    '    .ratgeber-text ul, .ratgeber-text ol { margin: 12px 0 12px 22px; }\n' +
    '    .ratgeber-text li { margin-bottom: 8px; }\n' +
    '    .ratgeber-text .rechts-tabelle { width: 100%; margin: 16px 0; border-collapse: collapse; }\n' +
    '    .ratgeber-text .rechts-tabelle td { padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; font-size: .95rem; }\n' +
    '    /* .lp-alert stammt aus dem dunklen Hero der Landingpages: weisse Schrift auf\n' +
    '       durchsichtiger Flaeche. Im weissen Textbereich waere das unsichtbar. */\n' +
    '    .ratgeber-text .lp-alert { margin: 22px 0; background: var(--creme); color: var(--text); border-color: var(--gold); }\n' +
    '    .ratgeber-text .lp-alert strong { color: var(--gold-text); }\n' +
    '    .ratgeber-stand { margin-top: 36px; font-size: .82rem; color: var(--text-soft); }\n' +
    '    .ratgeber-weiter { margin-top: 56px; }\n' +
    '    .ratgeber-weiter h2 { font-size: 1.25rem; margin-bottom: 18px; }\n' +
    '    .ratgeber-weiter .lp-fact h3 { font-size: 1rem; }\n' +
    '    .ratgeber-weiter .lp-fact h3 a { color: inherit; text-decoration: none; }\n' +
    '    .ratgeber-weiter .lp-fact h3 a:hover { color: var(--petrol); }\n' +
    '    .ratgeber-kat { margin-top: 48px; }\n' +
    '    .ratgeber-kat:first-of-type { margin-top: 0; }\n' +
    '    .brotkrumen { font-size: .82rem; color: var(--text); margin-bottom: 18px; }\n' +
    '    .brotkrumen a { color: inherit; }\n' +
    /* Hero-Bild als Klasse mit Handy-Variante. Ein Inline-Stil wuerde jede
       Medienabfrage ueberstimmen, und das Handy laedt dann das 1600-px-Bild. */
    '    .ratgeber-hero { --hero-bild: url("' + bildUrl(o.bild, 1600, 900) + '"); }\n' +
    '    @media (max-width: 700px) { .ratgeber-hero { --hero-bild: url("' + bildUrl(o.bild, 800, 1000).replace("q=70", "q=62") + '"); } }\n' +
    '  </style>\n' +
    '</head>\n<body>\n';
}

function kopfzeile() {
  return '<header class="topbar">\n' +
    '  <div class="container topbar-inner">\n' +
    '    <a href="/" class="logo">\n' +
    '      <span class="logo-cross" aria-hidden="true"></span>\n' +
    '      <span>Swiss<strong>Premia</strong> <small>Krankenkassen-Vergleich</small></span>\n' +
    '    </a>\n' +
    '    <nav class="nav">\n' +
    '      <a href="/#rechner">Prämien vergleichen</a>\n' +
    '      <a href="/ratgeber/">Ratgeber</a>\n' +
    '      <a href="/#fragen">Fragen</a>\n' +
    '      <a href="/#beratung" class="btn btn-small btn-primary">Kostenlose Beratung</a>\n' +
    '    </nav>\n' +
    '  </div>\n' +
    '</header>\n\n';
}

function fusszeile() {
  return '<footer class="footer">\n' +
    '  <div class="container">\n' +
    '    <div class="footer-grid">\n' +
    '      <div>\n' +
    '        <div class="logo footer-logo"><span class="logo-cross" aria-hidden="true"></span> Swiss<strong>Premia</strong></div>\n' +
    '        <p>Unabhängiger Krankenkassen-Prämienvergleich für die Schweiz. Kostenlos, ohne Anmeldung.</p>\n' +
    '      </div>\n' +
    '      <div>\n' +
    '        <h4>Ratgeber</h4>\n' +
    '        <p><a href="/ratgeber/">Alle Ratgeber</a><br>' +
    '<a href="/ratgeber/krankenkasse-wechseln.html">Krankenkasse wechseln</a><br>' +
    '<a href="/ratgeber/praemienregionen.html">Prämienregionen</a><br>' +
    '<a href="/ratgeber/franchise-waehlen.html">Franchise wählen</a></p>\n' +
    '      </div>\n' +
    '      <div>\n' +
    '        <h4>Rechtliches</h4>\n' +
    '        <p>Alle Angaben ohne Gewähr. Der Leistungskatalog der Grundversicherung ist gesetzlich festgelegt und bei allen Kassen identisch. SwissPremia ist eine Vergleichsplattform und selbst kein Versicherungsvermittler: Ihre Angaben gehen an einen lizenzierten Vermittler, der Sie berät. Einzelheiten in der <a href="/datenschutz.html">Datenschutzerklärung</a>.</p>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <p class="copyright">© 2026 SwissPremia · <a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a></p>\n' +
    '  </div>\n' +
    '</footer>\n\n' +
    '<script src="/js/lead-core.js" defer></script>\n' +
    '</body>\n</html>\n';
}

function jsonld(objekt) {
  return '  <script type="application/ld+json">\n  ' + JSON.stringify(objekt, null, 2).replace(/\n/g, "\n  ") + '\n  </script>\n';
}

function brotkrumen(titel) {
  return '<nav class="brotkrumen" aria-label="Pfad"><a href="/">Start</a> › <a href="/ratgeber/">Ratgeber</a> › ' + esc(titel) + '</nav>\n';
}

/* ----------------------------------------------------------- Seiten */

function ratgeberSeite(r) {
  var url = BASIS + "/ratgeber/" + r.slug + ".html";

  var ld = jsonld({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": r.titel,
    "description": r.beschreibung,
    "image": bildUrl(r.bild, 1200, 630),
    "datePublished": HEUTE,
    "dateModified": HEUTE,
    "inLanguage": "de-CH",
    "mainEntityOfPage": url,
    "author": { "@type": "Organization", "name": MARKE, "url": BASIS + "/" },
    "publisher": { "@type": "Organization", "name": MARKE, "url": BASIS + "/" },
    "about": "Obligatorische Krankenpflegeversicherung in der Schweiz",
    "isBasedOn": "https://www.priminfo.admin.ch/"
  }) + jsonld({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": r.faq.map(function (q) {
      return { "@type": "Question", "name": q.f, "acceptedAnswer": { "@type": "Answer", "text": q.a } };
    })
  }) + jsonld({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Start", "item": BASIS + "/" },
      { "@type": "ListItem", "position": 2, "name": "Ratgeber", "item": BASIS + "/ratgeber/" },
      { "@type": "ListItem", "position": 3, "name": r.h1, "item": url }
    ]
  });

  var inhalt = r.abschnitte.map(function (a) {
    return '      <h2>' + esc(a.h2) + '</h2>\n      ' + a.html + '\n';
  }).join("\n");

  var faq = r.faq.map(function (q) {
    return '        <details>\n          <summary>' + esc(q.f) + '</summary>\n          <p>' + esc(q.a) + '</p>\n        </details>';
  }).join("\n");

  var weiter = r.verwandt.map(nachSlug).filter(Boolean).map(function (v) {
    return '        <div class="lp-fact">\n' +
      '          <span class="eyebrow">' + esc(v.kategorie) + '</span>\n' +
      '          <h3><a href="/ratgeber/' + v.slug + '.html">' + esc(v.h1) + '</a></h3>\n' +
      '          <p>' + esc(v.beschreibung) + '</p>\n' +
      '        </div>';
  }).join("\n");

  return kopf({ pfad: "/ratgeber/" + r.slug + ".html", titel: r.titel, beschreibung: r.beschreibung, bild: r.bild, jsonld: ld }) +
    kopfzeile() +
    '<section class="lp-hero auf-dunkel ratgeber-hero">\n' +
    '  <div class="container narrow">\n' +
    '    <span class="eyebrow">Ratgeber · ' + esc(r.kategorie) + '</span>\n' +
    '    <h1>' + esc(r.h1) + '</h1>\n' +
    '    <p class="lead">' + esc(r.lead) + '</p>\n' +
    '  </div>\n' +
    '</section>\n\n' +
    '<section class="section">\n' +
    '  <div class="container narrow">\n' +
    brotkrumen(r.h1) +
    '    <article class="ratgeber-text">\n' +
    inhalt +
    '    </article>\n\n' +
    '    <h2 style="margin-top:52px">Häufige Fragen</h2>\n' +
    '    <div class="lp-faq" style="margin-top:18px">\n' + faq + '\n    </div>\n\n' +
    '    <p class="ratgeber-stand">Stand: ' + HEUTE.slice(8, 10) + '.' + HEUTE.slice(5, 7) + '.' + HEUTE.slice(0, 4) +
    '. Rechtsgrundlagen: Krankenversicherungsgesetz (KVG) und Krankenversicherungsverordnung (KVV). Prämiendaten: Bundesamt für Gesundheit, ' +
    '<a href="https://www.priminfo.admin.ch" target="_blank" rel="noopener">priminfo.admin.ch</a>. Alle Angaben ohne Gewähr.</p>\n\n' +
    '    <div class="ratgeber-weiter">\n' +
    '      <h2>Weiterlesen</h2>\n' +
    '      <div class="lp-facts">\n' + weiter + '\n      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</section>\n\n' +
    fusszeile();
}

function uebersicht() {
  var kategorien = [];
  RATGEBER.forEach(function (r) { if (kategorien.indexOf(r.kategorie) === -1) kategorien.push(r.kategorie); });

  var ld = jsonld({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ratgeber Krankenkasse Schweiz",
    "url": BASIS + "/ratgeber/",
    "inLanguage": "de-CH",
    "hasPart": RATGEBER.map(function (r) {
      return { "@type": "Article", "headline": r.titel, "url": BASIS + "/ratgeber/" + r.slug + ".html" };
    })
  }) + jsonld({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Start", "item": BASIS + "/" },
      { "@type": "ListItem", "position": 2, "name": "Ratgeber", "item": BASIS + "/ratgeber/" }
    ]
  });

  var beschr = {
    "Wechseln": "Fristen, Kündigung, Franchise und Modell – alles, was Sie für den Kassenwechsel brauchen.",
    "Region": "Warum der Wohnort den Preis bestimmt und was in Ihrem Kanton gilt.",
    "Alter": "Kinder, junge Erwachsene, ab 26: an welchen Altersgrenzen die Prämie springt."
  };

  var bloecke = kategorien.map(function (k) {
    var karten = RATGEBER.filter(function (r) { return r.kategorie === k; }).map(function (r) {
      return '      <div class="lp-fact">\n' +
        '        <span class="eyebrow">' + esc(k) + '</span>\n' +
        '        <h3><a href="/ratgeber/' + r.slug + '.html">' + esc(r.h1) + '</a></h3>\n' +
        '        <p>' + esc(r.beschreibung) + '</p>\n' +
        '        <p style="margin-top:14px"><a class="btn btn-small btn-ghost" href="/ratgeber/' + r.slug + '.html">Lesen</a></p>\n' +
        '      </div>';
    }).join("\n");
    return '    <div class="ratgeber-kat">\n' +
      '      <h2>' + esc(k) + '</h2>\n' +
      '      <p class="center-note" style="text-align:left;margin:0 0 20px">' + esc(beschr[k] || "") + '</p>\n' +
      '      <div class="lp-facts">\n' + karten + '\n      </div>\n' +
      '    </div>';
  }).join("\n\n");

  return kopf({
    pfad: "/ratgeber/",
    titel: "Ratgeber: Krankenkasse wechseln, Prämienregionen, Alter",
    beschreibung: "Verständliche Ratgeber zur Schweizer Krankenkasse: Kündigungsfrist, Franchise, Versicherungsmodelle, Prämienregionen nach Kanton und die Prämiensprünge mit 19 und 26.",
    bild: "photo-1454165804606-c3d57bc86b40",
    jsonld: ld
  }) +
    kopfzeile() +
    '<section class="lp-hero auf-dunkel ratgeber-hero">\n' +
    '  <div class="container narrow">\n' +
    '    <span class="eyebrow">Ratgeber</span>\n' +
    '    <h1>Krankenkasse verstehen, bevor Sie entscheiden</h1>\n' +
    '    <p class="lead">Zwölf kurze Ratgeber zu den Fragen, die beim Kassenwechsel wirklich entscheiden: Fristen, Franchise, Wohnort und Alter. Ohne Fachchinesisch, mit den Zahlen aus dem Gesetz.</p>\n' +
    '  </div>\n' +
    '</section>\n\n' +
    '<section class="section">\n' +
    '  <div class="container">\n' +
    bloecke + '\n' +
    '    <p class="center-note" style="margin-top:52px"><a class="btn btn-primary btn-big" href="/#rechner">Ihre Prämie berechnen</a></p>\n' +
    '  </div>\n' +
    '</section>\n\n' +
    fusszeile();
}

/* ---------------------------------------------------------- Sitemap */

function sitemap() {
  var eintraege = WEITERE_SEITEN.map(function (s) {
    return { loc: BASIS + s.pfad, lastmod: s.lastmod, freq: s.freq, prio: s.prio };
  }).concat(RATGEBER.map(function (r) {
    return { loc: BASIS + "/ratgeber/" + r.slug + ".html", lastmod: HEUTE, freq: "monthly", prio: "0.7" };
  }));

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    eintraege.map(function (e) {
      return '  <url>\n    <loc>' + e.loc + '</loc>\n    <lastmod>' + e.lastmod + '</lastmod>\n' +
        '    <changefreq>' + e.freq + '</changefreq>\n    <priority>' + e.prio + '</priority>\n  </url>';
    }).join("\n") + '\n</urlset>\n';
}

/* ------------------------------------------------------------ Start */

function main() {
  /* Jeder Verweis in "verwandt" muss auf einen echten Ratgeber zeigen. */
  RATGEBER.forEach(function (r) {
    r.verwandt.forEach(function (v) {
      if (!nachSlug(v)) throw new Error('"' + r.slug + '" verweist auf "' + v + '", den es nicht gibt.');
    });
  });

  fs.mkdirSync(ZIEL, { recursive: true });
  RATGEBER.forEach(function (r) {
    fs.writeFileSync(pfad.join(ZIEL, r.slug + ".html"), ratgeberSeite(r), "utf8");
  });
  fs.writeFileSync(pfad.join(ZIEL, "index.html"), uebersicht(), "utf8");
  fs.writeFileSync(pfad.join(STAMM, "sitemap.xml"), sitemap(), "utf8");

  console.log("\n  " + RATGEBER.length + " Ratgeber + Uebersicht  ->  ratgeber/");
  console.log("  Sitemap: " + (WEITERE_SEITEN.length + RATGEBER.length) + " Seiten\n");
}

main();
