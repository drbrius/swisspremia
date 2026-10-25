/* =========================================================================
   Redaktion: Welche Reels laufen heute, in welcher Reihenfolge, wann?

   - Anzahl je Tag aus funnel.json ("10-20" wird je Tag ausgewuerfelt,
     deterministisch nach Datum – derselbe Tag ergibt denselben Plan).
   - Funnel-Mix: Anteile TOFU / MOFU / BOFU ("stufen"); waehrend einer
     Kuendigungsfrist ("stufenSaison") mehr BOFU, weil dann entschieden
     wird. Der Countdown eroeffnet den Tag und zaehlt zu BOFU.
   - Innerhalb einer Stufe: Daten- und Wissens-Reels im Verhaeltnis von
     "mix" (daten/wissen).
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

/* Mehrere Listen gleichmaessig ueber den Tag verteilen: jedes Element
   bekommt seine relative Position in seiner Liste; "spaeter" schiebt eine
   Liste in Richtung Abend (BOFU: dann wird gehandelt). */
function verteilen(listen) {
  const alle = [];
  listen.forEach(({ liste, spaeter = 0 }, li) => liste.forEach((k, j) => alle.push({ k, pos: spaeter + (1 - spaeter) * ((j + 0.5) / liste.length), li })));
  return alle.sort((a, b) => a.pos - b.pos || a.li - b.li).map((x) => x.k);
}

const STUFEN_REIHE = ["bofu", "mofu", "tofu"];

export function auswaehlen(datumText, anzahl, konfig, verlauf = {}) {
  const datum = datumLesen(datumText);
  const rnd = zufall("auswahl|" + datumText);
  const alle = kandidaten(datum);
  const tageSeit = (k) => (verlauf[k.schluessel] ? Math.round((datum - datumLesen(verlauf[k.schluessel])) / 86_400_000) : Infinity);
  const laengstHer = (liste) => mischen(liste, rnd).sort((x, y) => tageSeit(y) - tageSeit(x));
  const bauen = (k) => { if (k.paket === undefined) k.paket = k.bauen(); return k.paket; };
  const gesperrt = (k) => k.gruppe === "wissen" && tageSeit(k) < konfig.wiederholungStammTage;

  /* Saison (Countdown) eroeffnet den Tag und zaehlt zu BOFU. */
  const eroeffnung = alle.filter((k) => k.gruppe === "saison").find((k) => bauen(k)) || null;
  const anteile = eroeffnung ? konfig.stufenSaison : konfig.stufen;
  const summe = (anteile.tofu || 0) + (anteile.mofu || 0) + (anteile.bofu || 0) || 1;
  const ziel = { tofu: Math.round((anzahl * (anteile.tofu || 0)) / summe), mofu: Math.round((anzahl * (anteile.mofu || 0)) / summe) };
  ziel.bofu = Math.max(0, anzahl - ziel.tofu - ziel.mofu - (eroeffnung ? 1 : 0));

  const wissenAnteil = konfig.mix.wissen / ((konfig.mix.daten + konfig.mix.wissen) || 1);
  const maxJeFormat = Math.max(2, Math.ceil(anzahl / 8));   // bei 10–16 Reels: jedes Format hoechstens zweimal
  const kantoneHeute = new Set(), jeFormat = {}, genommen = new Set();
  const gewaehlt = { tofu: [], mofu: [], bofu: [] };
  const passt = (k, streng) => !streng || ((!k.region || !kantoneHeute.has(k.region)) && (jeFormat[k.format] || 0) < maxJeFormat);
  const nimm = (k, stufe) => {
    gewaehlt[stufe].push(k); genommen.add(k);
    if (k.region) kantoneHeute.add(k.region);
    jeFormat[k.format] = (jeFormat[k.format] || 0) + 1;
  };
  /* Aus einer Liste bis "soll" nehmen – streng (Kanton einmalig, jedes
     Format hoechstens maxJeFormat) oder locker. */
  const fuellen = (liste, soll, stufe, modi = [true]) => {
    let n = 0;
    for (const streng of modi) for (const k of liste) {
      if (n >= soll) return n;
      if (genommen.has(k) || !passt(k, streng) || !bauen(k)) continue;
      nimm(k, stufe); n++;
    }
    return n;
  };

  for (const stufe of STUFEN_REIHE) {
    const pool = alle.filter((k) => k.stufe === stufe && k.gruppe !== "saison" && !gesperrt(k));
    const daten = laengstHer(pool.filter((k) => k.gruppe === "daten"));
    const wissen = laengstHer(pool.filter((k) => k.gruppe === "wissen"));
    const sollW = Math.min(wissen.length, Math.round(ziel[stufe] * wissenAnteil));
    fuellen(wissen, sollW, stufe);
    fuellen(daten, ziel[stufe] - gewaehlt[stufe].length, stufe);
    fuellen([...wissen, ...daten], ziel[stufe] - gewaehlt[stufe].length, stufe);            // Rest aus der anderen Gruppe, weiter streng
    fuellen([...wissen, ...daten], ziel[stufe] - gewaehlt[stufe].length, stufe, [false]);   // erst jetzt locker
  }
  /* Fehlt dann noch etwas: aus allen Stufen auffuellen, zur Not auch
     Wissens-Reels, die kuerzlich liefen. */
  const fehlend = anzahl - (eroeffnung ? 1 : 0) - STUFEN_REIHE.reduce((n, s) => n + gewaehlt[s].length, 0);
  if (fehlend > 0) {
    let rest = fehlend;
    for (const k of laengstHer(alle.filter((x) => x.gruppe !== "saison"))) {
      if (rest <= 0) break;
      if (genommen.has(k) || !bauen(k)) continue;
      nimm(k, k.stufe || "mofu"); rest--;
    }
  }

  const reihe = verteilen([{ liste: gewaehlt.tofu }, { liste: gewaehlt.mofu }, { liste: gewaehlt.bofu, spaeter: 0.3 }]);
  if (eroeffnung) reihe.unshift(eroeffnung);
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
    const { text, kommentar, warnungen } = bildtextBauen({ ...p.bildtext, sprache: p.sprache, modus: konfig.hashtags, stufe: p.stufe });
    return {
      nr: i + 1, format: p.format, stufe: p.stufe || null, rahmen: p.rahmen || null, gruppe: p.gruppe, schluessel: p.schluessel, titel: p.titel, sprache: p.sprache, cover: p.cover,
      zeit: zeiten[i], status: "geplant", reel: p.reel, bildtext: text, kommentar,
      datei: null, url: null, containerId: null, mediaId: null, veroeffentlicht: null, fehler: null, versuche: 0,
      warnungen: warnungen.length ? warnungen : undefined
    };
  });
  return { datum: datumText, erzeugt: new Date().toISOString(), gewuenscht, hinweise, reels };
}
