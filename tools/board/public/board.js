/* =========================================================================
   Reels-Board – Darstellung

   Holt /api/stand (nur mit Sitzung, sonst Login) und zeichnet daraus
   Kennzahlen, Sendeplan, zwei Diagramme, die Beitragstabelle und den
   Betriebsstand. Alle Texte aus dem Stand (Titel, Bildtexte, Protokoll)
   gehen ueber textContent ins DOM, nie als HTML.
   ========================================================================= */
"use strict";

const TZ = "Europe/Zurich";
const NEU_LADEN_MS = 5 * 60_000;
const ABGLEICH_ALT_MIN = 75;   // danach Warnung: laeuft der Rechner?

const FORMATE = {
  franchise: "Franchise", modelle: "Modelle", alter: "Alter", unfall: "Unfall", flexibel: "Sparpotenzial",
  regionen: "Regionen", kantone: "Kantone", countdown: "Countdown", mythos: "Mythen", stamm: "Stamm-Reels", hand: "Von Hand"
};
const STATUS = {
  geplant: { text: "Geplant", art: "neutral", symbol: "○" },
  gerendert: { text: "Gerendert", art: "neutral", symbol: "◐" },
  hochgeladen: { text: "Bereit", art: "neutral", symbol: "●" },
  veroeffentlicht: { text: "Veröffentlicht", art: "gut", symbol: "✓" },
  fehler: { text: "Fehler, neuer Versuch", art: "ernst", symbol: "!" },
  aufgegeben: { text: "Aufgegeben", art: "kritisch", symbol: "×" },
  verpasst: { text: "Nicht gepostet", art: "warnung", symbol: "!" }
};

const zustand = {
  stand: null,
  zeitraum: lokalLesen("zeitraum", "7"),
  quelle: lokalLesen("quelle", "alle"),
  planTag: null,
  sortierung: { spalte: "zeit", absteigend: true },
  zeilen: 30
};
const ZEILEN_SCHRITT = 30;

/* ---------------------------------------------------------------- Helfer */

function lokalLesen(name, ersatz) { try { return localStorage.getItem("board." + name) || ersatz; } catch (e) { return ersatz; } }
function lokalMerken(name, wert) { try { localStorage.setItem("board." + name, wert); } catch (e) { /* privat */ } }

const $ = (sel) => document.querySelector(sel);

function el(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const kind of kinder.flat()) if (kind != null && kind !== false) e.append(kind instanceof Node ? kind : String(kind));
  return e;
}
function svg(tag, attrs, ...kinder) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
  for (const kind of kinder) e.append(kind);
  return e;
}

const zahlFormat = new Intl.NumberFormat("de-CH");
const zahl = (n) => (n == null || Number.isNaN(n) ? "–" : zahlFormat.format(Math.round(n)));
const kompakt = (n) => (n >= 10_000 ? new Intl.NumberFormat("de-CH", { notation: "compact", maximumFractionDigits: 1 }).format(n) : zahl(n));
const sekunden = (ms) => (ms == null ? "–" : (ms / 1000).toFixed(1).replace(".", ",") + " s");
function dauerText(ms) {
  if (ms == null) return "–";
  if (ms < 60_000) return sekunden(ms);
  const min = Math.round(ms / 60_000);
  return min < 60 ? `${min} Min.` : `${Math.floor(min / 60)} Std. ${min % 60} Min.`;
}
const tagSchluessel = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
const uhrzeit = (d) => new Intl.DateTimeFormat("de-CH", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
const tagText = (schluessel, mitWochentag = true) =>
  new Intl.DateTimeFormat("de-CH", { timeZone: "UTC", weekday: mitWochentag ? "short" : undefined, day: "numeric", month: "short" }).format(new Date(schluessel + "T12:00:00Z"));
const tagKurz = (schluessel) => `${Number(schluessel.slice(8))}.${Number(schluessel.slice(5, 7))}.`;
const heute = () => tagSchluessel(new Date());
const tagPlus = (schluessel, n) => { const d = new Date(schluessel + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function vorMinuten(datum) {
  const min = Math.round((Date.now() - datum.getTime()) / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.floor(min / 60);
  return std < 48 ? `vor ${std} Std.` : `vor ${Math.floor(std / 24)} Tagen`;
}
const ersteZeile = (text) => (text || "").split("\n").find((z) => z.trim()) || "";
const gekuerzt = (text, n) => (text.length > n ? text.slice(0, n - 1).trimEnd() + "…" : text);

function statusPille(schluessel) {
  const s = STATUS[schluessel] || { text: schluessel, art: "neutral", symbol: "?" };
  return el("span", { class: `status ${s.art}` }, el("span", { class: "symbol", "aria-hidden": "true", text: s.symbol }), s.text);
}

/* ------------------------------------------------------------ Tooltip */

const tooltip = $("#tooltip");
function tooltipZeigen(x, y, zeilen) {
  tooltip.replaceChildren(...zeilen.map(([art, text]) => el(art === "wert" ? "strong" : "span", { text })));
  tooltip.hidden = false;
  const b = tooltip.getBoundingClientRect();
  const links = Math.min(window.innerWidth - b.width - 8, Math.max(8, x + 14));
  const oben = y - b.height - 12 < 8 ? y + 16 : y - b.height - 12;
  tooltip.style.left = links + "px";
  tooltip.style.top = oben + "px";
}
function tooltipAn(ziel, zeilen) {
  ziel.addEventListener("pointermove", (ev) => tooltipZeigen(ev.clientX, ev.clientY, zeilen));
  ziel.addEventListener("pointerleave", () => { tooltip.hidden = true; });
  ziel.addEventListener("focus", () => { const r = ziel.getBoundingClientRect(); tooltipZeigen(r.left + r.width / 2, r.top, zeilen); });
  ziel.addEventListener("blur", () => { tooltip.hidden = true; });
}

/* ------------------------------------------------------------ Laden */

function ansicht(name) {
  $("#laden").hidden = name !== "laden";
  $("#anmeldung").hidden = name !== "anmeldung";
  $("#board").hidden = name !== "board";
}

async function laden({ still = false } = {}) {
  if (!still && !zustand.stand) ansicht("laden");
  let r;
  try {
    r = await fetch("/api/stand", { cache: "no-store", credentials: "same-origin" });
  } catch (e) {
    if (zustand.stand) return banner("warnung", "Keine Verbindung – die Anzeige ist der letzte geladene Stand.");
    ansicht("anmeldung");
    return meldung("Keine Verbindung zum Board.");
  }
  if (r.status === 401) { zustand.stand = null; ansicht("anmeldung"); return; }
  if (r.status === 503) { const d = await r.json().catch(() => ({})); ansicht("anmeldung"); return einrichtungFehlt(d.fehlt || []); }
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    ansicht("board");
    return banner("kritisch", d.text || `Stand nicht abrufbar (HTTP ${r.status}).`);
  }
  zustand.stand = vorbereiten(await r.json());
  ansicht("board");
  zeichnen();
}

function einrichtungFehlt(fehlt) {
  zustand.gesperrt = true;
  meldung("Das Board ist noch nicht fertig eingerichtet. Im Vercel-Projekt fehlt: " + fehlt.join(", ") + ".");
  $("#anmeldeformular .knopf").disabled = true;
}
function meldung(text) { $("#anmeldemeldung").textContent = text; }

/* Rohdaten einmal aufbereiten: Datumsobjekte, Tage, Titel, Quelle. */
function vorbereiten(s) {
  const medien = (s.medien || []).map((m) => {
    const datum = new Date(m.zeit);
    const z = m.zahlen || {};
    return {
      ...m, datum, tag: tagSchluessel(datum),
      quelle: m.funnel ? "funnel" : "hand",
      format: m.funnel ? m.funnel.format : "hand",
      titel: m.funnel?.titel || gekuerzt(ersteZeile(m.text), 64) || "Ohne Bildtext",
      typText: m.typ === "REELS" ? "Reel" : m.art === "CAROUSEL_ALBUM" ? "Karussell" : m.art === "IMAGE" ? "Bild" : "Video",
      hochkant: m.typ === "REELS" || m.typ === "STORY",
      aufrufe: z.views ?? null, reichweite: z.reach ?? null,
      likes: z.likes ?? m.likes ?? null, kommentare: z.comments ?? m.kommentare ?? null,
      geteilt: z.shares ?? null, gespeichert: z.saved ?? null, interaktionen: z.total_interactions ?? null,
      wiedergabe: z.ig_reels_avg_watch_time ?? null, wiedergabeGesamt: z.ig_reels_video_view_total_time ?? null
    };
  });
  const nachId = new Map(medien.map((m) => [m.id, m]));
  const jetzt = new Date();
  const plan = (s.plan || []).map((p) => {
    const geplant = new Date(`${p.datum}T${p.zeit}:00`);   // Ortszeit des Browsers (Schweiz)
    const verpasst = p.status !== "veroeffentlicht" && p.status !== "aufgegeben" && p.datum < heute();
    return { ...p, geplant, statusAnzeige: verpasst ? "verpasst" : p.status, medium: p.mediaId ? nachId.get(p.mediaId) || null : null, vorbei: geplant < jetzt };
  });
  return { ...s, standDatum: new Date(s.stand), medien, plan };
}

/* --------------------------------------------------------- Filtern */

function imZeitraum(datum) {
  const z = zustand.zeitraum;
  if (z === "alle") return true;
  if (z === "heute") return tagSchluessel(datum) === heute();
  return datum.getTime() >= Date.now() - Number(z) * 86_400_000;
}
function tagImZeitraum(schluessel) {
  const z = zustand.zeitraum;
  if (z === "alle") return true;
  if (z === "heute") return schluessel === heute();
  return schluessel > tagPlus(heute(), -Number(z));
}
const zeitraumText = () => ({ heute: "heute", 7: "letzte 7 Tage", 28: "letzte 28 Tage", alle: "alle Beiträge" })[zustand.zeitraum];
const gefiltert = () => zustand.stand.medien.filter((m) => imZeitraum(m.datum) && (zustand.quelle === "alle" || m.quelle === zustand.quelle));
const summe = (liste, feld) => liste.reduce((s, m) => s + (m[feld] ?? 0), 0);
const mitWert = (liste, feld) => liste.filter((m) => m[feld] != null);

/* ------------------------------------------------------------ Zeichnen */

function zeichnen() {
  const s = zustand.stand;
  $("#konto").textContent = s.konto ? `@${s.konto.username}` : "";
  for (const b of document.querySelectorAll("#zeitraum button")) b.setAttribute("aria-checked", String(b.dataset.wert === zustand.zeitraum));
  $("#quelle").value = zustand.quelle;
  $("#banner").replaceChildren();
  abgleichZeichnen();
  kennzahlenZeichnen();
  planZeichnen();
  reichweiteZeichnen();
  formateZeichnen();
  tabelleZeichnen();
  betriebZeichnen();
}

function abgleichZeichnen() {
  const s = zustand.stand;
  const alt = (Date.now() - s.standDatum.getTime()) / 60_000 > ABGLEICH_ALT_MIN;
  $("#abgleich").replaceChildren(
    el("span", { class: "punkt", "aria-hidden": "true", style: null }),
    `Abgleich ${uhrzeit(s.standDatum)} · ${vorMinuten(s.standDatum)}`
  );
  $("#abgleich .punkt").style.background = alt ? "var(--warnung)" : "var(--gut)";
  $("#banner-abgleich")?.remove();
  if (alt) banner("warnung", `Letzter Abgleich ${vorMinuten(s.standDatum)}. Läuft der Reels-Rechner? Ohne ihn wird weder gepostet noch abgeglichen.`, "banner-abgleich");
}

const warnSymbol = (art = "warnung") => el("span", { class: "status " + art, "aria-hidden": "true" }, el("span", { class: "symbol", text: "!" }));

function banner(art, text, id = null) {
  $("#banner").append(el("div", { class: `banner ${art}`, role: "status", id }, warnSymbol(art), el("span", { text })));
}

/* -------------------------------------------------------- Kennzahlen */

function kontoWert(name) {
  const k = zustand.stand.kontoZahlen;
  if (!k) return { wert: null, bereich: "" };
  const schluessel = zustand.zeitraum === "alle" ? "28" : zustand.zeitraum;
  const bereich = { heute: "heute", 7: "7 Tage", 28: "28 Tage" }[schluessel];
  return { wert: k[schluessel]?.[name] ?? null, bereich: zustand.zeitraum === "alle" ? "28 Tage (max.)" : bereich };
}

function kachel(etikett, bereich, wert, zusatz) {
  return el("div", { class: "karte kachel" },
    el("div", { class: "etikett" }, el("span", { text: etikett }), bereich ? el("span", { class: "bereich", text: bereich }) : null),
    el("div", { class: "wert", text: wert }),
    zusatz ? el("div", { class: "zusatz" }, zusatz) : null);
}

function kennzahlenZeichnen() {
  const s = zustand.stand;
  const liste = gefiltert();
  const mitAufrufen = mitWert(liste, "aufrufe");
  const aufrufe = summe(mitAufrufen, "aufrufe");
  const bester = [...mitAufrufen].sort((a, b) => b.aufrufe - a.aufrufe)[0];

  $("#hauptzahl").replaceChildren(
    el("div", { class: "etikett" }, el("span", { text: "Aufrufe" }), el("span", { class: "bereich", text: zeitraumText() })),
    el("div", { class: "wert", text: zahl(aufrufe) }),
    el("div", { class: "zusatz", text: mitAufrufen.length
      ? `aus ${mitAufrufen.length} ${mitAufrufen.length === 1 ? "Beitrag" : "Beiträgen"} · Ø ${zahl(aufrufe / mitAufrufen.length)} je Beitrag`
      : "keine Beiträge in diesem Zeitraum" }),
    bester ? el("div", { class: "bester" }, "Stärkster Beitrag: ", el("strong", { text: bester.titel }), ` – ${zahl(bester.aufrufe)} Aufrufe`) : null
  );

  const reach = kontoWert("reach");
  const profil = kontoWert("profile_views");
  const klicks = kontoWert("website_clicks");
  const reels = mitWert(liste, "wiedergabe").filter((m) => m.aufrufe);
  const gewicht = summe(reels, "aufrufe");
  const wiedergabe = gewicht ? reels.reduce((x, m) => x + m.wiedergabe * m.aufrufe, 0) / gewicht : null;

  $("#kacheln").replaceChildren(
    kachel("Erreichte Konten", reach.bereich, zahl(reach.wert), "ganzes Konto, jedes Konto einmal gezählt"),
    kachel("Interaktionen", null, zahl(summe(liste, "interaktionen")),
      `${zahl(summe(liste, "likes"))} Likes · ${zahl(summe(liste, "kommentare"))} Komm. · ${zahl(summe(liste, "geteilt"))} geteilt · ${zahl(summe(liste, "gespeichert"))} gesp.`),
    kachel("Ø Wiedergabe", null, sekunden(wiedergabe), "je Aufruf, nur Reels"),
    kachel("Profilaufrufe", profil.bereich, zahl(profil.wert), "ganzes Konto"),
    kachel("Klicks auf Website-Link", klicks.bereich, zahl(klicks.wert), "Link im Profil zu swisspremia.ch"),
    followerKachel(s)
  );
}

function followerKachel(s) {
  const aktuell = s.konto?.follower ?? null;
  const verlauf = s.followerTage || [];
  let zusatz = verlauf.length ? `Verlauf seit ${tagKurz(verlauf[0].datum)}` : "noch kein Verlauf";
  if (aktuell != null && zustand.zeitraum !== "alle" && verlauf.length) {
    const start = zustand.zeitraum === "heute" ? tagPlus(heute(), -1) : tagPlus(heute(), -Number(zustand.zeitraum));
    const basis = [...verlauf].reverse().find((v) => v.datum <= start);
    if (basis) {
      const d = aktuell - basis.wert;
      zusatz = el("span", {}, el("span", { class: d > 0 ? "delta-gut" : d < 0 ? "delta-schlecht" : "", text: (d > 0 ? "+" : d < 0 ? "−" : "±") + zahl(Math.abs(d)) }), ` seit ${tagKurz(basis.datum)}`);
    }
  }
  return kachel("Follower", "jetzt", zahl(aktuell), zusatz);
}

/* --------------------------------------------------------- Sendeplan */

function planZeichnen() {
  const plan = zustand.stand.plan;
  const tage = [...new Set(plan.map((p) => p.datum))].sort();
  if (!zustand.planTag || !tage.includes(zustand.planTag)) zustand.planTag = tage.includes(heute()) ? heute() : tage.filter((t) => t > heute())[0] || tage[tage.length - 1] || heute();

  $("#plan-tage").replaceChildren(...tage.slice(-8).map((t) => el("button", {
    type: "button", role: "tab", "aria-selected": String(t === zustand.planTag),
    text: t === heute() ? "Heute" : t === tagPlus(heute(), 1) ? "Morgen" : tagText(t),
    onclick: () => { zustand.planTag = t; planZeichnen(); }
  })));

  const reels = plan.filter((p) => p.datum === zustand.planTag).sort((a, b) => a.zeit.localeCompare(b.zeit));
  const anzahl = (st) => reels.filter((r) => r.statusAnzeige === st).length;
  const naechstes = reels.find((r) => !r.vorbei && r.status !== "veroeffentlicht" && r.status !== "aufgegeben");
  const teile = [`${anzahl("veroeffentlicht")} von ${reels.length} veröffentlicht`];
  const probleme = anzahl("fehler") + anzahl("aufgegeben") + anzahl("verpasst");
  if (probleme) teile.push(`${probleme} mit Problem`);
  if (naechstes) teile.push(`nächstes um ${naechstes.zeit}`);
  $("#plan-zusammenfassung").textContent = reels.length ? teile.join(" · ") : "";

  const liste = $("#plan-liste");
  if (!reels.length) {
    liste.replaceChildren(el("li", { class: "leer", text: zustand.planTag === heute()
      ? "Für heute gibt es noch keinen Plan. Die Tagesproduktion (tag.js) legt ihn morgens an."
      : "Kein Plan für diesen Tag." }));
    return;
  }
  liste.replaceChildren(...reels.map((r) => {
    const m = r.medium;
    const zahlen = m && m.aufrufe != null ? `${zahl(m.aufrufe)} Aufrufe · ${zahl(m.likes)} Likes` : r.fehler ? "" : r.dauer ? `${String(r.dauer).replace(".", ",")} s` : "";
    return el("li", {
      class: "plan-zeile" + (r === naechstes ? " naechstes" : ""), tabindex: "0",
      onclick: () => schubladePlan(r), onkeydown: (ev) => { if (ev.key === "Enter") schubladePlan(r); }
    },
      el("span", { class: "zeit", text: r.zeit }),
      daumen(m?.bild || r.cover, true),
      el("div", { class: "titelzelle" },
        el("div", { class: "titel", text: r.titel }),
        el("div", { class: "unter" }, el("span", { class: "chip", text: FORMATE[r.format] || r.format }), r.fehler ? el("span", { class: "fehlertext", text: r.fehler }) : r === naechstes ? "als Nächstes" : "")),
      el("span", { class: "status-zelle" }, statusPille(r.statusAnzeige)),
      el("span", { class: "zahlen", text: zahlen }));
  }));
}

function daumen(url, hochkant) {
  const klasse = "daumen" + (hochkant ? "" : " quadrat");
  if (!url) return el("span", { class: klasse, "aria-hidden": "true" });
  const bild = el("img", { class: klasse, src: url, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
  bild.addEventListener("error", () => bild.replaceWith(el("span", { class: klasse, "aria-hidden": "true" })), { once: true });
  return bild;
}

/* ---------------------------------------------------------- Diagramme */

function schoeneSchritte(max, ziel = 4) {
  const roh = Math.max(max, 1) / ziel;
  const p = 10 ** Math.floor(Math.log10(roh));
  const schritt = [1, 2, 2.5, 5, 10].map((f) => f * p).find((x) => x >= roh);
  const werte = [];
  for (let v = 0; v <= Math.max(max, 1) + schritt * 0.001; v += schritt) werte.push(v);
  if (werte[werte.length - 1] < max) werte.push(werte[werte.length - 1] + schritt);
  return werte;
}

/* Saeule mit gerundetem Datenende (4 px), eckig an der Grundlinie. */
function saeulenPfad(x, y, b, h) {
  const r = Math.min(4, h, b / 2);
  return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + b - r}A${r},${r} 0 0 1 ${x + b},${y + r}V${y + h}Z`;
}

function reichweiteZeichnen() {
  const rahmen = $("#reichweite");
  const tage = zustand.stand.reichweiteTage || [];
  if (!tage.length) { rahmen.replaceChildren(el("p", { class: "leer", text: "Instagram hat keine Tageswerte geliefert." })); return; }
  const B = 640, H = 230, L = 40, R = 6, O = 18, U = 26;
  const pb = B - L - R, ph = H - O - U;
  const schritte = schoeneSchritte(Math.max(...tage.map((t) => t.wert)));
  const oben = schritte[schritte.length - 1];
  const slot = pb / tage.length, breite = Math.min(24, slot - 2);
  const yVon = (v) => O + ph - (v / oben) * ph;
  const beitraegeAm = (t) => zustand.stand.medien.filter((m) => m.tag === t).length;
  const maxIndex = tage.reduce((best, t, i) => (t.wert > tage[best].wert ? i : best), 0);

  const s = svg("svg", { viewBox: `0 0 ${B} ${H}`, class: "diagramm", role: "img", "aria-label": `Erreichte Konten pro Tag, ${tagText(tage[0].datum, false)} bis ${tagText(tage[tage.length - 1].datum, false)}` });
  for (const v of schritte) {
    const y = yVon(v);
    s.append(svg("line", { x1: L, x2: B - R, y1: y, y2: y, class: v === 0 ? "achse" : "gitter" }));
    s.append(svg("text", { x: L - 8, y: y + 4, "text-anchor": "end", class: "tick" }, kompakt(v)));
  }
  tage.forEach((t, i) => {
    const x = L + i * slot + (slot - breite) / 2, h = (t.wert / oben) * ph;
    const saeule = h > 0 ? svg("path", { d: saeulenPfad(x, O + ph - h, breite, h), class: "saeule" + (tagImZeitraum(t.datum) ? "" : " gedaempft") }) : null;
    if (saeule) s.append(saeule);
    if (i === maxIndex && t.wert > 0) s.append(svg("text", { x: x + breite / 2, y: O + ph - h - 6, "text-anchor": "middle", class: "marke-wert" }, zahl(t.wert)));
    if ((tage.length - 1 - i) % 7 === 0) s.append(svg("text", { x: x + breite / 2, y: H - 6, "text-anchor": "middle", class: "tick" }, tagKurz(t.datum)));
    const treffer = svg("rect", { x: L + i * slot, y: O, width: slot, height: ph, class: "treffer", tabindex: "0", "aria-label": `${tagText(t.datum)}: ${t.wert} erreichte Konten` });
    const n = beitraegeAm(t.datum);
    tooltipAn(treffer, [["wert", zahl(t.wert)], ["", "erreichte Konten"], ["", `${tagText(t.datum)} · ${n} ${n === 1 ? "Beitrag" : "Beiträge"} veröffentlicht`]]);
    if (saeule) {
      for (const an of ["pointerenter", "focus"]) treffer.addEventListener(an, () => saeule.classList.add("aktiv"));
      for (const aus of ["pointerleave", "blur"]) treffer.addEventListener(aus, () => saeule.classList.remove("aktiv"));
    }
    s.append(treffer);
  });
  rahmen.replaceChildren(s);
}

function formateZeichnen() {
  const rahmen = $("#formate");
  const gruppen = new Map();
  for (const m of mitWert(gefiltert(), "aufrufe")) {
    const g = gruppen.get(m.format) || { format: m.format, n: 0, summe: 0 };
    g.n++; g.summe += m.aufrufe;
    gruppen.set(m.format, g);
  }
  const liste = [...gruppen.values()].map((g) => ({ ...g, schnitt: g.summe / g.n })).sort((a, b) => b.schnitt - a.schnitt);
  if (!liste.length) { rahmen.replaceChildren(el("p", { class: "leer", text: "Keine Beiträge mit Zahlen in diesem Zeitraum." })); return; }
  const max = liste[0].schnitt || 1;
  rahmen.replaceChildren(...liste.map((g) => {
    const name = FORMATE[g.format] || g.format;
    const balken = el("div", { class: "balken" });
    balken.style.width = Math.max(1, (g.schnitt / max) * 100) + "%";
    const zeile = el("div", { class: "balken-zeile", tabindex: "0" },
      el("span", { class: "balken-name", text: name }),
      el("div", { class: "balken-spur" }, balken),
      el("span", { class: "balken-wert" }, el("strong", { text: zahl(g.schnitt) }), ` · ${g.n} ${g.n === 1 ? "Beitrag" : "Beitr."}`));
    tooltipAn(zeile, [["wert", `Ø ${zahl(g.schnitt)} Aufrufe`], ["", name], ["", `${g.n} ${g.n === 1 ? "Beitrag" : "Beiträge"}, zusammen ${zahl(g.summe)} Aufrufe`]]);
    return zeile;
  }));
}

/* ------------------------------------------------------------ Tabelle */

const SPALTEN = [
  { schluessel: "zeit", text: "Beitrag", wert: (m) => m.datum.getTime() },
  { schluessel: "aufrufe", text: "Aufrufe" },
  { schluessel: "reichweite", text: "Reichweite" },
  { schluessel: "likes", text: "Likes" },
  { schluessel: "kommentare", text: "Komm." },
  { schluessel: "geteilt", text: "Geteilt" },
  { schluessel: "gespeichert", text: "Gesp." },
  { schluessel: "wiedergabe", text: "Ø Wiedergabe", format: sekunden }
];

function tabelleZeichnen() {
  const liste = gefiltert();
  const { spalte, absteigend } = zustand.sortierung;
  const def = SPALTEN.find((s) => s.schluessel === spalte);
  const wert = def.wert || ((m) => m[spalte] ?? -1);
  liste.sort((a, b) => (absteigend ? wert(b) - wert(a) : wert(a) - wert(b)));

  $("#beitraege-zusammenfassung").textContent = `${liste.length} ${liste.length === 1 ? "Beitrag" : "Beiträge"} · ${zeitraumText()}. Klick auf eine Zeile zeigt Details.`;
  const kopf = el("tr", {}, ...SPALTEN.map((s) => el("th", { scope: "col", "aria-sort": s.schluessel === spalte ? (absteigend ? "descending" : "ascending") : null },
    el("button", { type: "button", onclick: () => {
      zustand.sortierung = { spalte: s.schluessel, absteigend: s.schluessel === spalte ? !absteigend : true };
      tabelleZeichnen();
    } }, s.text + (s.schluessel === spalte ? (absteigend ? " ↓" : " ↑") : "")))));
  const zeilen = liste.slice(0, zustand.zeilen).map((m) => el("tr", { tabindex: "0", onclick: () => schubladeMedium(m), onkeydown: (ev) => { if (ev.key === "Enter") schubladeMedium(m); } },
    el("td", {}, el("div", { class: "beitrag" }, daumen(m.bild, m.hochkant),
      el("div", { class: "titelzelle" },
        el("div", { class: "titel", text: m.titel }),
        el("div", { class: "unter" }, el("span", { class: "chip", text: m.quelle === "funnel" ? FORMATE[m.format] || m.format : `${m.typText}, von Hand` }),
          `${tagText(m.tag)}, ${uhrzeit(m.datum)}`)))),
    ...SPALTEN.slice(1).map((s) => el("td", { text: (s.format || zahl)(m[s.schluessel]) }))));
  $("#beitraege").replaceChildren(el("thead", {}, kopf), el("tbody", {}, ...(zeilen.length ? zeilen : [el("tr", {}, el("td", { colspan: String(SPALTEN.length), class: "leer", text: "Keine Beiträge in diesem Zeitraum." }))])));
  const rest = liste.length - zeilen.length;
  $("#beitraege-mehr").replaceChildren(rest > 0 ? el("button", { type: "button", class: "knopf-leise", text: `Weitere ${Math.min(rest, ZEILEN_SCHRITT)} von ${rest} anzeigen`,
    onclick: () => { zustand.zeilen += ZEILEN_SCHRITT; tabelleZeichnen(); } }) : "");
}

/* ------------------------------------------------------------ Betrieb */

function betriebZeichnen() {
  const s = zustand.stand;
  const e = s.einstellungen || {};
  const paare = [
    ["Letzter Abgleich", `${tagText(tagSchluessel(s.standDatum))}, ${uhrzeit(s.standDatum)}`],
    ["Instagram-Kontingent", s.kontingent ? `${s.kontingent.genutzt} von ${s.kontingent.gesamt} in 24 Std.` : "–"],
    ["Token aufgefrischt", s.token?.aufgefrischt ? tagText(tagSchluessel(new Date(s.token.aufgefrischt))) : "–"],
    ["Reels pro Tag", e.reelsProTag || "–"],
    ["Sendefenster", e.postVon ? `${e.postVon}–${e.postBis} Uhr` : "–"],
    ["Beiträge auf Instagram", s.konto?.beitraege != null ? zahl(s.konto.beitraege) : "–"]
  ];
  $("#betrieb").replaceChildren(...paare.map(([dt, dd]) => el("div", {}, el("dt", { text: dt }), el("dd", { text: dd }))));
  $("#hinweise").replaceChildren(...(s.hinweise || []).map((h) => el("li", {}, warnSymbol(), el("span", { text: h }))));
  $("#protokoll").textContent = (s.protokoll || []).slice().reverse().join("\n") || "Noch keine Einträge.";
}

/* ---------------------------------------------------------- Schublade */

let zuletztFokus = null;
function schubladeOeffnen(inhalt) {
  zuletztFokus = document.activeElement;
  $("#schublade-inhalt").replaceChildren(...inhalt.filter(Boolean));
  $("#schublade").hidden = false;
  $("#schublade-hintergrund").hidden = false;
  $("#schublade-zu").focus();
}
function schubladeSchliessen() {
  const video = $("#schublade video");
  if (video) video.pause();
  $("#schublade").hidden = true;
  $("#schublade-hintergrund").hidden = true;
  if (zuletztFokus) zuletztFokus.focus();
}

function medienAnzeige(videoUrl, bildUrl, hochkant) {
  if (videoUrl) return el("video", { class: "medium", src: videoUrl, poster: bildUrl || null, controls: true, preload: "metadata", playsinline: true });
  if (bildUrl) return el("img", { class: "medium" + (hochkant ? "" : " quadrat"), src: bildUrl, alt: "", referrerpolicy: "no-referrer" });
  return null;
}

function messwerte(m) {
  const werte = [
    ["Aufrufe", zahl(m.aufrufe)], ["Reichweite", zahl(m.reichweite)], ["Interaktionen", zahl(m.interaktionen)],
    ["Likes", zahl(m.likes)], ["Kommentare", zahl(m.kommentare)], ["Geteilt", zahl(m.geteilt)],
    ["Gespeichert", zahl(m.gespeichert)]
  ];
  if (m.hochkant) werte.push(["Ø Wiedergabe", sekunden(m.wiedergabe)], ["Wiedergabe gesamt", dauerText(m.wiedergabeGesamt)]);
  return el("dl", { class: "messwerte" }, ...werte.map(([dt, dd]) => el("div", {}, el("dt", { text: dt }), el("dd", { text: dd }))));
}

function instagramLink(url) {
  return url ? el("p", {}, el("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: "Auf Instagram öffnen ↗" })) : null;
}

function schubladeMedium(m) {
  schubladeOeffnen([
    el("span", { class: "chip", text: m.quelle === "funnel" ? FORMATE[m.format] || m.format : `${m.typText}, von Hand` }),
    el("h2", { id: "schublade-titel", text: m.titel }),
    el("p", { class: "leise", text: `Veröffentlicht ${tagText(m.tag)}, ${uhrzeit(m.datum)} Uhr` + (m.funnel ? ` · geplant ${m.funnel.zeit}` : "") }),
    medienAnzeige(m.funnel?.video, m.bild, m.hochkant),
    m.zahlen ? messwerte(m) : el("p", { class: "leer", text: "Instagram hat für diesen Beitrag keine Zahlen geliefert." }),
    instagramLink(m.permalink),
    m.text ? el("div", { class: "bildtext", text: m.text }) : null
  ]);
}

function schubladePlan(r) {
  if (r.medium) return schubladeMedium(r.medium);
  schubladeOeffnen([
    el("span", { class: "chip", text: FORMATE[r.format] || r.format }),
    el("h2", { id: "schublade-titel", text: r.titel }),
    el("p", { class: "leise", text: `Geplant ${tagText(r.datum)}, ${r.zeit} Uhr` + (r.dauer ? ` · ${String(r.dauer).replace(".", ",")} s` : "") }),
    el("p", {}, statusPille(r.statusAnzeige)),
    r.fehler ? el("p", { class: "fehlertext", text: `Fehler (Versuch ${r.versuche || 1}): ${r.fehler}` }) : null,
    medienAnzeige(r.video, r.cover, true) || el("p", { class: "leer", text: "Noch nicht gerendert." }),
    instagramLink(r.permalink),
    r.text ? el("div", { class: "bildtext", text: r.text }) : null
  ]);
}

/* -------------------------------------------------------- Ereignisse */

$("#anmeldeformular").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = ev.currentTarget;
  const knopf = form.querySelector(".knopf");
  const daten = { benutzer: form.benutzer.value.trim(), passwort: form.passwort.value };
  if (!daten.benutzer || !daten.passwort) return meldung("Bitte Benutzername und Passwort eingeben.");
  knopf.disabled = true;
  meldung("");
  try {
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(daten), credentials: "same-origin" });
    if (r.ok) { form.passwort.value = ""; await laden(); return; }
    if (r.status === 503) return einrichtungFehlt((await r.json().catch(() => ({}))).fehlt || []);
    meldung(r.status === 401 ? "Benutzername oder Passwort stimmt nicht." : `Anmeldung nicht möglich (HTTP ${r.status}).`);
    form.passwort.select();
  } catch (e) {
    meldung("Keine Verbindung zum Board.");
  } finally {
    knopf.disabled = Boolean(zustand.gesperrt);
  }
});

$("#abmelden").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin" }).catch(() => {});
  zustand.stand = null;
  ansicht("anmeldung");
  meldung("Abgemeldet.");
});

$("#zeitraum").addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-wert]");
  if (!b) return;
  zustand.zeitraum = b.dataset.wert;
  zustand.zeilen = ZEILEN_SCHRITT;
  lokalMerken("zeitraum", zustand.zeitraum);
  zeichnen();
});
$("#quelle").addEventListener("change", (ev) => {
  zustand.quelle = ev.target.value;
  zustand.zeilen = ZEILEN_SCHRITT;
  lokalMerken("quelle", zustand.quelle);
  zeichnen();
});

$("#schublade-zu").addEventListener("click", schubladeSchliessen);
$("#schublade-hintergrund").addEventListener("click", schubladeSchliessen);
document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !$("#schublade").hidden) schubladeSchliessen(); });

setInterval(() => { if (zustand.stand && !document.hidden) laden({ still: true }); }, NEU_LADEN_MS);
setInterval(() => { if (zustand.stand) abgleichZeichnen(); }, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && zustand.stand) laden({ still: true }); });

laden();
