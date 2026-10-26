/* =========================================================================
   Kantonsseiten mit echten Praemientabellen

       node tools/build_kantone.js

   Schreibt kantone/index.html und je Kanton kantone/<slug>.html aus
   data/praemien.js und data/plz.js – denselben Daten wie der Rechner.

   Warum: Der Rechner rendert seine Zahlen erst im Browser. Suchmaschinen
   und Antwortmaschinen lesen statisches HTML; fuer sie war die Seite bisher
   ein leeres Formular. Diese Seiten zeigen die Zahlen im HTML, mit Quelle
   und Datum – genau das, was zitiert wird.

   Das ist kein Doorway-Netzwerk: Jede Seite hat eigene Zahlen, eigene
   Regionen, eigene Orte. Die Seiten gehoeren nur zu swisspremia.ch; der
   Marken-Generator entfernt die Verweise (siehe neue-marke.js).

   Reihenfolge: build_data.js -> build_kantone.js -> build_ratgeber.js
   (schreibt die Sitemap mit allen Seiten) -> neue-marke.js
   ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");

const STAMM = path.join(__dirname, "..");
const ZIEL = path.join(STAMM, "kantone");
const BASIS = "https://www.swisspremia.ch";
const MARKE = "SwissPremia";
const HEUTE = new Date().toISOString().slice(0, 10);

/* Daten laden wie der Browser. */
global.window = {};
require(path.join(STAMM, "data", "praemien.js"));
require(path.join(STAMM, "data", "plz.js"));
const KK = global.window.KK_DATA;
const PLZ = global.window.PLZ_DATA;
const JAHR = KK.jahr;

const KANTONE = [
  ["AG", "Aargau", "aargau"], ["AI", "Appenzell Innerrhoden", "appenzell-innerrhoden"],
  ["AR", "Appenzell Ausserrhoden", "appenzell-ausserrhoden"], ["BE", "Bern", "bern"],
  ["BL", "Basel-Landschaft", "basel-landschaft"], ["BS", "Basel-Stadt", "basel-stadt"],
  ["FR", "Freiburg", "freiburg"], ["GE", "Genf", "genf"], ["GL", "Glarus", "glarus"],
  ["GR", "Graubünden", "graubuenden"], ["JU", "Jura", "jura"], ["LU", "Luzern", "luzern"],
  ["NE", "Neuenburg", "neuenburg"], ["NW", "Nidwalden", "nidwalden"], ["OW", "Obwalden", "obwalden"],
  ["SG", "St. Gallen", "st-gallen"], ["SH", "Schaffhausen", "schaffhausen"], ["SO", "Solothurn", "solothurn"],
  ["SZ", "Schwyz", "schwyz"], ["TG", "Thurgau", "thurgau"], ["TI", "Tessin", "tessin"], ["UR", "Uri", "uri"],
  ["VD", "Waadt", "waadt"], ["VS", "Wallis", "wallis"], ["ZG", "Zug", "zug"], ["ZH", "Zürich", "zuerich"]
];

/* ------------------------------------------------------------ Helfer */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chf = (n) => "CHF " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const chf2 = (n) => "CHF " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const bildUrl = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=70`;
const BILD = "photo-1454165804606-c3d57bc86b40";

/* Regionen und Beispielorte je Kanton aus den PLZ-Daten. */
function regionenVon(kt) {
  const orte = {};
  for (const plz in PLZ) for (const [ort, k, reg] of PLZ[plz]) {
    if (k !== kt) continue;
    (orte[reg] = orte[reg] || new Set()).add(ort);
  }
  return Object.keys(orte).map(Number).sort().map((reg) => ({
    reg, anzahl: orte[reg].size,
    beispiele: [...orte[reg]].filter((o) => o.length < 22).sort((a, b) => a.localeCompare(b, "de")).slice(0, 6)
  }));
}

function angebote(kt, reg, alter, franchise, n) {
  const liste = KK.praemien[`${kt}${reg}|${alter}|${franchise}|M`] || [];
  return liste.slice(0, n).map(([v, mo, p]) => ({ kasse: KK.versicherer[v], modell: KK.modelle[mo], monat: p, jahr: p * 12 }));
}

/* -------------------------------------------------------- Bausteine */
function jsonld(o) { return '  <script type="application/ld+json">\n  ' + JSON.stringify(o, null, 2).replace(/\n/g, "\n  ") + "\n  </script>\n"; }

function kopf(o) {
  const url = BASIS + o.pfad, titel = esc(o.titel + " | " + MARKE), beschr = esc(o.beschreibung), og = bildUrl(BILD, 1200, 630);
  return `<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titel}</title>
  <meta name="description" content="${beschr}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="geo.region" content="CH${o.kt ? "-" + o.kt : ""}">

  <meta property="og:type" content="article">
  <meta property="og:locale" content="de_CH">
  <meta property="og:site_name" content="${MARKE}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${titel}">
  <meta property="og:description" content="${beschr}">
  <meta property="og:image" content="${og}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titel}">
  <meta name="twitter:description" content="${beschr}">
  <meta name="twitter:image" content="${og}">

${o.jsonld}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/lp.css">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <style>
    .kt-text h2 { font-size: 1.45rem; margin: 44px 0 12px; }
    .kt-text h3 { font-size: 1.1rem; margin: 26px 0 10px; color: var(--slate-tief); }
    .kt-text p, .kt-text li { font-size: 1.02rem; line-height: 1.7; }
    .kt-text ul { margin: 10px 0 10px 22px; }
    .kt-kern { background: var(--creme); border-left: 3px solid var(--gold); padding: 18px 22px; border-radius: var(--radius); margin: 22px 0; font-size: 1.02rem; line-height: 1.65; }
    .kt-tabelle-wrap { overflow-x: auto; margin: 10px 0 6px; }
    .kt-tabelle { width: 100%; border-collapse: collapse; font-size: .95rem; min-width: 560px; }
    .kt-tabelle th, .kt-tabelle td { padding: 10px 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    .kt-tabelle th { font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; color: var(--text-soft); font-weight: 600; }
    .kt-tabelle td.zahl, .kt-tabelle th.zahl { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .kt-tabelle tr:first-child td { font-weight: 600; color: var(--slate-tief); }
    .kt-hinweis { font-size: .82rem; color: var(--text-soft); margin: 6px 0 0; line-height: 1.55; }
    .kt-stand { margin-top: 36px; font-size: .82rem; color: var(--text-soft); }
    .kt-weiter { margin-top: 56px; }
    .kt-weiter h2 { font-size: 1.25rem; margin-bottom: 18px; }
    .kt-karten .lp-fact h3 { font-size: 1rem; }
    .kt-karten .lp-fact h3 a { color: inherit; text-decoration: none; }
    .kt-karten .lp-fact h3 a:hover { color: var(--petrol); }
    .kt-karten .lp-fact .kt-preis { font-size: 1.35rem; font-weight: 600; color: var(--petrol); margin: 6px 0 2px; }
    .brotkrumen { font-size: .82rem; color: var(--text); margin-bottom: 18px; }
    .brotkrumen a { color: inherit; }
    .ratgeber-hero { --hero-bild: url("${bildUrl(BILD, 1600, 900)}"); }
    @media (max-width: 700px) { .ratgeber-hero { --hero-bild: url("${bildUrl(BILD, 800, 1000).replace("q=70", "q=62")}"); } }
  </style>
</head>
<body>
`;
}

function kopfzeile() {
  return `<header class="topbar">
  <div class="container topbar-inner">
    <a href="/" class="logo">
      <span class="logo-cross" aria-hidden="true"></span>
      <span>Swiss<strong>Premia</strong> <small>Krankenkassen-Vergleich</small></span>
    </a>
    <nav class="nav">
      <a href="/#rechner">Prämien vergleichen</a>
      <a href="/kantone/">Kantone</a>
      <a href="/ratgeber/">Ratgeber</a>
      <a href="/#beratung" class="btn btn-small btn-primary">Kostenlose Beratung</a>
    </nav>
  </div>
</header>

`;
}

function fusszeile() {
  return `<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="logo footer-logo"><span class="logo-cross" aria-hidden="true"></span> Swiss<strong>Premia</strong></div>
        <p>Unabhängiger Krankenkassenvergleich für die Schweiz. Kostenlos, ohne Anmeldung.</p>
      </div>
      <div>
        <h4>Datenquelle</h4>
        <p>Krankenkassen-Prämien ${JAHR}: Bundesamt für Gesundheit (BAG),<br>
        <a href="https://www.priminfo.admin.ch" target="_blank" rel="noopener">priminfo.admin.ch</a> · <a href="/kantone/">Alle Kantone</a> · <a href="/ratgeber/">Ratgeber</a></p>
      </div>
      <div>
        <h4>Rechtliches</h4>
        <p>Alle Angaben ohne Gewähr. Der Leistungskatalog der Grundversicherung ist gesetzlich festgelegt und bei allen Kassen identisch. SwissPremia ist eine Vergleichsplattform und selbst kein Versicherungsvermittler: Ihre Angaben gehen an einen lizenzierten Vermittler, der Sie berät. Einzelheiten in der <a href="/datenschutz.html">Datenschutzerklärung</a>.</p>
      </div>
    </div>
    <p class="copyright">© 2026 SwissPremia · <a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a></p>
  </div>
</footer>

<script src="/js/lead-core.js" defer></script>
</body>
</html>
`;
}

function tabelle(zeilen, hinweis) {
  if (!zeilen.length) return "<p class=\"kt-hinweis\">Für diese Kombination liegen keine Tarife vor.</p>";
  return `<div class="kt-tabelle-wrap"><table class="kt-tabelle">
<thead><tr><th>#</th><th>Krankenkasse</th><th>Modell</th><th class="zahl">Prämie / Monat</th><th class="zahl">Prämie / Jahr</th></tr></thead>
<tbody>
${zeilen.map((z, i) => `<tr><td>${i + 1}</td><td>${esc(z.kasse)}</td><td>${esc(z.modell)}</td><td class="zahl">${chf2(z.monat)}</td><td class="zahl">${chf(z.jahr)}</td></tr>`).join("\n")}
</tbody></table></div>
<p class="kt-hinweis">${hinweis}</p>`;
}

/* ----------------------------------------------------------- Seiten */
function kantonSeite([kt, name, slug]) {
  const regionen = regionenVon(kt);
  const url = BASIS + "/kantone/" + slug + ".html";
  const erste = regionen[0];
  const top = angebote(kt, erste.reg, "E", 300, 10);
  const guenstig = top[0];
  const teuerst = top[top.length - 1];
  const mehrereRegionen = regionen.length > 1;
  const regionText = mehrereRegionen
    ? `${regionen.length} Prämienregionen`
    : "eine einzige Prämienregion – dieselbe Kasse kostet im ganzen Kanton gleich viel";

  /* Spanne ueber alle Regionen: guenstigstes Standard-Angebot je Region. */
  const spanne = regionen.map((r) => { const a = angebote(kt, r.reg, "E", 300, 1)[0]; return a ? a.monat : null; }).filter(Boolean);

  const beschreibung = `Krankenkassenvergleich Kanton ${name} ${JAHR}: die günstigsten Krankenkassen je Prämienregion für Erwachsene, junge Erwachsene und Kinder. Offizielle BAG-Prämien, ab ${guenstig ? chf2(guenstig.monat) : "–"} pro Monat.`;

  const faq = [
    { f: `Wie viele Prämienregionen hat der Kanton ${name}?`,
      a: mehrereRegionen
        ? `Der Kanton ${name} ist in ${regionen.length} Prämienregionen eingeteilt. Massgebend ist die Wohngemeinde. Region 1 ist in der Regel die teuerste, Region ${regionen.length} die günstigste.`
        : `Der Kanton ${name} hat eine einzige Prämienregion. Dieselbe Kasse kostet im ganzen Kanton gleich viel.` },
    { f: `Welche Krankenkasse ist im Kanton ${name} ${JAHR} am günstigsten?`,
      a: guenstig
        ? `Für Erwachsene mit Franchise CHF 300 und Unfalldeckung ist ${JAHR} in Prämienregion ${erste.reg || 1} das günstigste Angebot ${guenstig.kasse} im ${guenstig.modell} mit ${chf2(guenstig.monat)} pro Monat (BAG-Prämiendaten ${JAHR}). Mit höherer Franchise sinkt die Prämie deutlich.`
        : `Für diese Kombination liegen keine Daten vor.` },
    { f: `Wie gross ist der Unterschied zwischen günstigster und teurer Kasse im Kanton ${name}?`,
      a: guenstig && teuerst && top.length > 1
        ? `Allein unter den zehn günstigsten Angeboten in Region ${erste.reg || 1} liegen ${chf(Math.round((teuerst.monat - guenstig.monat) * 12))} pro Jahr – bei gesetzlich identischen Leistungen. Zu teureren Kassen ist der Abstand noch grösser.`
        : `Die Unterschiede zwischen den Kassen betragen bei identischen Leistungen oft mehrere hundert bis über tausend Franken pro Jahr.` },
    { f: `Wo beantrage ich im Kanton ${name} die Prämienverbilligung?`,
      a: `Die Prämienverbilligung ist kantonal geregelt. Zuständig ist die vom Kanton ${name} bezeichnete Stelle, meist die Ausgleichskasse oder Sozialversicherungsanstalt. In vielen Kantonen müssen Sie den Antrag selbst stellen.` }
  ];

  const ld = jsonld({
    "@context": "https://schema.org", "@type": "Article",
    "headline": `Krankenkassenvergleich Kanton ${name} ${JAHR}`,
    "description": beschreibung, "image": bildUrl(BILD, 1200, 630),
    "datePublished": HEUTE, "dateModified": HEUTE, "inLanguage": "de-CH", "mainEntityOfPage": url,
    "author": { "@type": "Organization", "name": MARKE, "url": BASIS + "/" },
    "publisher": { "@type": "Organization", "name": MARKE, "url": BASIS + "/" },
    "about": { "@type": "AdministrativeArea", "name": `Kanton ${name}`, "containedInPlace": { "@type": "Country", "name": "Schweiz" } },
    "isBasedOn": { "@type": "Dataset", "name": `Prämien der obligatorischen Krankenpflegeversicherung ${JAHR}`, "creator": { "@type": "GovernmentOrganization", "name": "Bundesamt für Gesundheit (BAG)" }, "url": "https://www.priminfo.admin.ch/" }
  }) + jsonld({
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": faq.map((q) => ({ "@type": "Question", "name": q.f, "acceptedAnswer": { "@type": "Answer", "text": q.a } }))
  }) + jsonld({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Start", "item": BASIS + "/" },
      { "@type": "ListItem", "position": 2, "name": "Kantone", "item": BASIS + "/kantone/" },
      { "@type": "ListItem", "position": 3, "name": `Kanton ${name}`, "item": url }
    ]
  });

  const regionenHtml = regionen.map((r) => {
    const titelRegion = mehrereRegionen ? `Prämienregion ${r.reg}` : "Alle Gemeinden";
    const orte = r.beispiele.length ? `<p>${mehrereRegionen ? `Dazu gehören unter anderem ${r.beispiele.map(esc).join(", ")} – insgesamt ${r.anzahl} Ortschaften.` : `Beispiele: ${r.beispiele.map(esc).join(", ")}.`}</p>` : "";
    return `
      <h2>${titelRegion}</h2>
      ${orte}
      <h3>Erwachsene ab 26 · Franchise CHF 300 · mit Unfalldeckung</h3>
      ${tabelle(angebote(kt, r.reg, "E", 300, 10), `Die zehn günstigsten Angebote über alle Modelle. Mit höherer Franchise sinkt die Prämie, mit Unfallausschluss (bei Anstellung ab 8 Stunden pro Woche) ebenfalls.`)}
      <h3>Junge Erwachsene 19–25 · Franchise CHF 300 · mit Unfalldeckung</h3>
      ${tabelle(angebote(kt, r.reg, "J", 300, 5), "Die fünf günstigsten Angebote.")}
      <h3>Kinder bis 18 · Franchise CHF 0 · mit Unfalldeckung</h3>
      ${tabelle(angebote(kt, r.reg, "K", 0, 5), "Die fünf günstigsten Angebote. Viele Kassen gewähren ab dem zweiten oder dritten Kind zusätzlich Rabatt – hier nicht eingerechnet.")}`;
  }).join("\n");

  const andere = KANTONE.filter((k) => k[0] !== kt).slice(0, 3);

  return kopf({ pfad: "/kantone/" + slug + ".html", kt, titel: `Krankenkassenvergleich Kanton ${name} ${JAHR}: Prämien aller Kassen`, beschreibung, jsonld: ld }) +
    kopfzeile() +
    `<section class="lp-hero auf-dunkel ratgeber-hero">
  <div class="container narrow">
    <span class="eyebrow">Krankenkassenvergleich ${JAHR} · Kanton ${esc(name)}</span>
    <h1>Krankenkassenvergleich Kanton ${esc(name)} ${JAHR}</h1>
    <p class="lead">Die günstigsten Krankenkassen im Kanton ${esc(name)} für ${JAHR} – je Prämienregion, für Erwachsene, junge Erwachsene und Kinder. Aus den offiziellen Prämiendaten des Bundesamts für Gesundheit.</p>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    <nav class="brotkrumen" aria-label="Pfad"><a href="/">Start</a> › <a href="/kantone/">Kantone</a> › Kanton ${esc(name)}</nav>
    <article class="kt-text">
      <div class="kt-kern">
        <strong>Das Wichtigste:</strong> Der Kanton ${esc(name)} hat ${regionText}.
        ${guenstig ? `Das günstigste Angebot für Erwachsene (Franchise CHF 300, mit Unfalldeckung) kostet ${JAHR} in Region ${erste.reg || 1} <strong>${chf2(guenstig.monat)} pro Monat</strong> – ${esc(guenstig.kasse)}, ${esc(guenstig.modell)}.` : ""}
        ${spanne.length > 1 ? ` Zwischen der günstigsten und der teuersten Region liegen beim jeweils günstigsten Angebot ${chf2(Math.max(...spanne) - Math.min(...spanne))} pro Monat.` : ""}
        Quelle: BAG-Prämiendaten ${JAHR}.
      </div>
      <p>Die Grundversicherung leistet bei jeder Kasse dasselbe – das steht im Gesetz. Unterschiedlich ist nur die Prämie, und die hängt von drei Dingen ab: Ihrer Prämienregion, Ihrer Franchise und Ihrem Versicherungsmodell. Die Tabellen zeigen die günstigsten Angebote für die häufigste Kombination; Ihre persönliche Prämie berechnen Sie mit Postleitzahl im <a href="/#rechner">Prämienrechner</a>.</p>
      ${regionenHtml}
      <h2>So lesen Sie die Tabellen</h2>
      <ul>
        <li><strong>Modell:</strong> Hausarzt-, HMO-, Telmed- und flexible Modelle sind günstiger als das Standardmodell, schränken aber die freie Arztwahl ein. Notfälle sind in jedem Modell gedeckt.</li>
        <li><strong>Franchise:</strong> CHF 300 ist die tiefste Stufe für Erwachsene. Mit CHF 2'500 sinkt die Prämie deutlich, dafür tragen Sie mehr selbst. <a href="/ratgeber/franchise-waehlen.html">Welche Franchise lohnt sich?</a></li>
        <li><strong>Unfalldeckung:</strong> Wer mindestens 8 Stunden pro Woche angestellt ist, ist über den Arbeitgeber unfallversichert und kann sie ausschliessen.</li>
        <li><strong>Wechsel:</strong> Kündigung bis 30. November, Wechsel auf 1. Januar. <a href="/ratgeber/krankenkasse-wechseln.html">So geht der Kassenwechsel.</a></li>
      </ul>
      <p class="center-note" style="margin-top:28px"><a class="btn btn-primary" href="/#rechner">Ihre Prämie im Kanton ${esc(name)} berechnen</a></p>
    </article>

    <h2 style="margin-top:52px">Häufige Fragen zum Kanton ${esc(name)}</h2>
    <div class="lp-faq" style="margin-top:18px">
${faq.map((q) => `      <details>\n        <summary>${esc(q.f)}</summary>\n        <p>${esc(q.a)}</p>\n      </details>`).join("\n")}
    </div>

    <p class="kt-stand">Stand: ${HEUTE.slice(8, 10)}.${HEUTE.slice(5, 7)}.${HEUTE.slice(0, 4)}. Prämien der obligatorischen Krankenpflegeversicherung ${JAHR}, Bundesamt für Gesundheit (BAG), <a href="https://www.priminfo.admin.ch" target="_blank" rel="noopener">priminfo.admin.ch</a>. Monatsprämien in CHF, gerundet; je Kasse und Modell der günstigste Tarif. Alle Angaben ohne Gewähr.</p>

    <div class="kt-weiter">
      <h2>Weitere Kantone</h2>
      <div class="lp-facts kt-karten">
${andere.map((k) => `        <div class="lp-fact"><span class="eyebrow">Kanton</span><h3><a href="/kantone/${k[2]}.html">Krankenkassenvergleich ${esc(k[1])}</a></h3><p><a href="/kantone/${k[2]}.html">Zu den Prämien ${JAHR}</a></p></div>`).join("\n")}
        <div class="lp-fact"><span class="eyebrow">Übersicht</span><h3><a href="/kantone/">Alle 26 Kantone</a></h3><p>Günstigste Prämie je Kanton auf einen Blick.</p></div>
      </div>
    </div>
  </div>
</section>

` + fusszeile();
}

function uebersicht() {
  const karten = KANTONE.map(([kt, name, slug]) => {
    const regionen = regionenVon(kt);
    const g = angebote(kt, regionen[0].reg, "E", 300, 1)[0];
    return { kt, name, slug, regionen: regionen.length, preis: g ? g.monat : null, kasse: g ? g.kasse : "" };
  });
  const ld = jsonld({
    "@context": "https://schema.org", "@type": "CollectionPage",
    "name": `Krankenkassenvergleich nach Kanton ${JAHR}`, "url": BASIS + "/kantone/", "inLanguage": "de-CH",
    "hasPart": karten.map((k) => ({ "@type": "Article", "headline": `Krankenkassenvergleich Kanton ${k.name} ${JAHR}`, "url": `${BASIS}/kantone/${k.slug}.html` }))
  }) + jsonld({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Start", "item": BASIS + "/" }, { "@type": "ListItem", "position": 2, "name": "Kantone", "item": BASIS + "/kantone/" }]
  });
  return kopf({ pfad: "/kantone/", titel: `Krankenkassenvergleich nach Kanton ${JAHR}: alle 26 Kantone`, beschreibung: `Krankenkassenvergleich ${JAHR} für jeden Kanton der Schweiz: günstigste Krankenkasse, Prämienregionen und Prämientabellen für Erwachsene, junge Erwachsene und Kinder – aus den offiziellen BAG-Daten.`, jsonld: ld }) +
    kopfzeile() +
    `<section class="lp-hero auf-dunkel ratgeber-hero">
  <div class="container narrow">
    <span class="eyebrow">Krankenkassenvergleich ${JAHR}</span>
    <h1>Krankenkassenvergleich nach Kanton</h1>
    <p class="lead">Für jeden der 26 Kantone: die günstigsten Krankenkassen ${JAHR} je Prämienregion, mit echten Zahlen aus den offiziellen Daten des Bundes.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="center-note">Günstigstes Angebot für Erwachsene ab 26, Franchise CHF 300, mit Unfalldeckung, in Prämienregion 1 des Kantons. Quelle: BAG-Prämiendaten ${JAHR}.</p>
    <div class="lp-facts kt-karten" style="margin-top:26px">
${karten.map((k) => `      <div class="lp-fact"><span class="eyebrow">${k.regionen === 1 ? "1 Prämienregion" : k.regionen + " Prämienregionen"}</span><h3><a href="/kantone/${k.slug}.html">Kanton ${esc(k.name)}</a></h3>${k.preis ? `<div class="kt-preis">ab ${chf2(k.preis)}</div><p>${esc(k.kasse)}</p>` : ""}<p style="margin-top:12px"><a class="btn btn-small btn-ghost" href="/kantone/${k.slug}.html">Prämien ${JAHR}</a></p></div>`).join("\n")}
    </div>
    <p class="center-note" style="margin-top:52px"><a class="btn btn-primary btn-big" href="/#rechner">Ihre Prämie mit Postleitzahl berechnen</a></p>
  </div>
</section>

` + fusszeile();
}

/* ------------------------------------------------------------ Start */
fs.mkdirSync(ZIEL, { recursive: true });
let ok = 0;
for (const k of KANTONE) {
  const regionen = regionenVon(k[0]);
  if (!regionen.length) { console.error("Keine Regionen fuer " + k[0]); continue; }
  fs.writeFileSync(path.join(ZIEL, k[2] + ".html"), kantonSeite(k), "utf8"); ok++;
}
fs.writeFileSync(path.join(ZIEL, "index.html"), uebersicht(), "utf8");
console.log(`\n  ${ok} Kantonsseiten + Uebersicht  ->  kantone/   (Praemien ${JAHR})\n`);
