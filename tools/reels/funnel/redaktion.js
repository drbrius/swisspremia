/* =========================================================================
   Redaktion: Welche Reels laufen heute, in welcher Reihenfolge, wann?

   - Anzahl je Tag aus funnel.json ("10-20" wird je Tag ausgewuerfelt,
     deterministisch nach Datum – derselbe Tag ergibt denselben Plan).
   - Mix: Anteile daten / wissen / saison. Saison nur, wenn gerade eine
     Frist laeuft (Oktober/November, Februar/Maerz).
   - Gegen Dubletten: der Verlauf merkt sich je Thema den letzten Tag;
     am laengsten nicht gelaufene Themen kommen zuerst. Stamm-Reels und
     Mythen fruehestens nach "wiederholungStammTage" wieder.
   - Am selben Tag moeglichst kein Kanton doppelt und kein Format gehaeuft.
   - Zeiten gleichmaessig ueber das Fenster verteilt, mit etwas Streuung,
     nie unter dem Mindestabstand.
   ========================================================================= */
import { kandidaten } from "./formate.js";
import { bildtextBauen } from "./bildtext.js";
import { spanne, minuten } from "./konfig.js";
import { zufall, mischen, datumLesen } from "./sprache.js";

export function anzahlFuer(datumText, konfig) {
  const [a, b] = spanne(konfig.reelsProTag);
  const rnd = zufall("anzahl|" + datumText);
  return a + Math.floor(rnd() * (b - a + 1));
}

/* Zwei Listen gleichmaessig verzahnen (z. B. 7 Daten-Reels und 4
   Wissens-Reels -> D D W D D W D W D W ...). */
function verzahnen(a, b) {
  const aus = [];
  let ia = 0, ib = 0;
  while (ia < a.length || ib < b.length) {
    const anteilA = a.length ? ia / a.length : 1, anteilB = b.length ? ib / b.length : 1;
    if (ia < a.length && (ib >= b.length || anteilA <= anteilB)) aus.push(a[ia++]);
    else aus.push(b[ib++]);
  }
  return aus;
}

export function auswaehlen(datumText, anzahl, konfig, verlauf = {}) {
  const datum = datumLesen(datumText);
  const rnd = zufall("auswahl|" + datumText);
  const alle = kandidaten(datum);
  const tageSeit = (k) => (verlauf[k.schluessel] ? Math.round((datum - datumLesen(verlauf[k.schluessel])) / 86_400_000) : Infinity);
  const laengstHer = (liste) => mischen(liste, rnd).sort((x, y) => tageSeit(y) - tageSeit(x));

  const saison = alle.filter((k) => k.gruppe === "saison");
  const wissen = laengstHer(alle.filter((k) => k.gruppe === "wissen" && tageSeit(k) >= konfig.wiederholungStammTage));
  const daten = laengstHer(alle.filter((k) => k.gruppe === "daten"));

  const nSaison = Math.min(saison.length, Math.max(saison.length ? 1 : 0, Math.round(anzahl * konfig.mix.saison)), 2);
  const nWissen = Math.min(wissen.length, Math.round(anzahl * konfig.mix.wissen));
  const nDaten = Math.max(0, anzahl - nSaison - nWissen);

  const bauen = (k) => { if (k.paket === undefined) k.paket = k.bauen(); return k.paket; };

  /* Daten: erst streng (Kanton einmalig, Formate verteilt), dann locker. */
  const gewaehlt = [];
  const kantoneHeute = new Set();
  const jeFormat = {};
  const formate = new Set(daten.map((k) => k.format)).size || 1;
  const maxJeFormat = Math.ceil(nDaten / formate) + 1;
  for (const streng of [true, false]) {
    for (const k of daten) {
      if (gewaehlt.length >= nDaten) break;
      if (gewaehlt.includes(k)) continue;
      if (streng && (kantoneHeute.has(k.region) || (jeFormat[k.format] || 0) >= maxJeFormat)) continue;
      if (!bauen(k)) continue;
      gewaehlt.push(k);
      kantoneHeute.add(k.region);
      jeFormat[k.format] = (jeFormat[k.format] || 0) + 1;
    }
  }

  const wissenGewaehlt = [];
  for (const k of wissen) {
    if (wissenGewaehlt.length >= nWissen) break;
    if (bauen(k)) wissenGewaehlt.push(k);
  }
  /* Fehlt etwas (zu wenig Daten-Kandidaten), mit weiteren Wissens-Reels
     auffuellen – zur Not auch solche, die kuerzlich liefen. */
  let fehlend = anzahl - nSaison - gewaehlt.length - wissenGewaehlt.length;
  if (fehlend > 0) {
    for (const k of laengstHer(alle.filter((x) => x.gruppe === "wissen"))) {
      if (fehlend <= 0) break;
      if (wissenGewaehlt.includes(k)) continue;
      if (bauen(k)) { wissenGewaehlt.push(k); fehlend--; }
    }
  }

  const reihe = verzahnen(gewaehlt, wissenGewaehlt);
  /* Saison: das erste Reel des Tages, ein zweites gegen Abend. */
  const saisonGewaehlt = saison.slice(0, nSaison).filter((k) => bauen(k));
  if (saisonGewaehlt[0]) reihe.unshift(saisonGewaehlt[0]);
  if (saisonGewaehlt[1]) reihe.splice(Math.floor(reihe.length * 0.7), 0, saisonGewaehlt[1]);

  return reihe.map((k) => k.paket);
}

/* Sendezeiten "HH:MM" fuer n Reels – lokale Zeit des Rechners. */
export function zeitfenster(datumText, n, konfig) {
  const von = minuten(konfig.postVon), bis = minuten(konfig.postBis);
  if (bis <= von) throw new Error(`Zeitfenster ${konfig.postVon}–${konfig.postBis} ist leer.`);
  const abstand = Math.max(1, Number(konfig.mindestabstandMinuten) || 1);
  const maxN = Math.floor((bis - von) / abstand) + 1;
  const warnung = n > maxN ? `Nur ${maxN} Reels passen mit ${abstand} Min. Abstand in das Fenster ${konfig.postVon}–${konfig.postBis}; ${n - maxN} entfallen.` : null;
  n = Math.min(n, maxN);
  const rnd = zufall("zeiten|" + datumText);
  const schritt = n > 1 ? (bis - von) / (n - 1) : 0;
  const streuung = n > 1 ? Math.min(12, Math.max(0, (schritt - abstand) / 2)) : 0;
  const zeiten = [];
  for (let i = 0; i < n; i++) {
    const basis = n > 1 ? von + i * schritt : (von + bis) / 2;
    zeiten.push(Math.max(von, Math.min(bis, Math.round(basis + (rnd() * 2 - 1) * streuung))));
  }
  for (let i = 1; i < n; i++) if (zeiten[i] - zeiten[i - 1] < abstand) zeiten[i] = Math.min(bis, zeiten[i - 1] + abstand);
  const text = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return { zeiten: zeiten.map(text), warnung };
}

/* Der komplette Tagesplan – noch ohne Ton, Video und Veroeffentlichung. */
export function planErstellen(datumText, konfig, { anzahl = null, verlauf = {} } = {}) {
  const gewuenscht = anzahl || anzahlFuer(datumText, konfig);
  const pakete = auswaehlen(datumText, gewuenscht, konfig, verlauf);
  const { zeiten, warnung } = zeitfenster(datumText, pakete.length, konfig);
  const hinweise = [];
  if (warnung) hinweise.push(warnung);
  if (pakete.length < gewuenscht) hinweise.push(`Nur ${pakete.length} von ${gewuenscht} Reels gefunden – zu wenig Kandidaten (Verlauf/Wiederholungssperre).`);
  const reels = pakete.slice(0, zeiten.length).map((p, i) => {
    const { text, kommentar, warnungen } = bildtextBauen({ ...p.bildtext, sprache: p.sprache, modus: konfig.hashtags });
    return {
      nr: i + 1, format: p.format, rahmen: p.rahmen || null, gruppe: p.gruppe, schluessel: p.schluessel, titel: p.titel, sprache: p.sprache, cover: p.cover,
      zeit: zeiten[i], status: "geplant", reel: p.reel, bildtext: text, kommentar,
      datei: null, url: null, containerId: null, mediaId: null, veroeffentlicht: null, fehler: null, versuche: 0,
      warnungen: warnungen.length ? warnungen : undefined
    };
  });
  return { datum: datumText, erzeugt: new Date().toISOString(), gewuenscht, hinweise, reels };
}
