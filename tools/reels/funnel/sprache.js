/* =========================================================================
   Sprache: Zahlen als Woerter (fuer die Stimme), Schweizer Zahlenformat,
   Datumshilfen. Schweizer Schreibweise ohne Eszett.
   ========================================================================= */

const EINER = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
  "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const ZEHNER = ["", "", "zwanzig", "dreissig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

function bis999(n, alleinstehend) {
  let s = "";
  const h = Math.floor(n / 100), r = n % 100;
  if (h) s += (h === 1 ? "ein" : EINER[h]) + "hundert";
  if (r) {
    if (r < 20) s += r === 1 && !alleinstehend ? "ein" : EINER[r];
    else {
      const e = r % 10, z = Math.floor(r / 10);
      s += (e ? (e === 1 ? "ein" : EINER[e]) + "und" : "") + ZEHNER[z];
    }
  }
  return s;
}

/* 2640 -> "zweitausendsechshundertvierzig". Rundet auf ganze Zahlen; die
   Stimme liest ausgeschriebene Zahlen zuverlaessiger als Ziffern. */
export function zahlwort(n) {
  n = Math.round(Number(n));
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "null";
  if (n < 0) return "minus " + zahlwort(-n);
  if (n >= 1_000_000) return String(n);
  const t = Math.floor(n / 1000), r = n % 1000;
  let s = "";
  if (t) s += (t === 1 ? "" : bis999(t, false)) + "tausend";
  if (r) s += bis999(r, true);
  return s;
}

/* Englische Zahlwoerter fuer die wenigen englischen Reels. */
const EN_EINER = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_ZEHNER = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
export function numberWord(n) {
  n = Math.round(Number(n));
  if (n === 0) return "zero";
  if (n < 0) return "minus " + numberWord(-n);
  const teil = (x) => {
    let s = "";
    const h = Math.floor(x / 100), r = x % 100;
    if (h) s += EN_EINER[h] + " hundred" + (r ? " and " : "");
    if (r < 20) s += EN_EINER[r];
    else s += EN_ZEHNER[Math.floor(r / 10)] + (r % 10 ? "-" + EN_EINER[r % 10] : "");
    return s;
  };
  const t = Math.floor(n / 1000), r = n % 1000;
  return [t ? teil(t) + " thousand" : "", r ? teil(r) : ""].filter(Boolean).join(" ").trim();
}

/* "CHF 2'640" – Schweizer Tausendertrennung, ganze Franken. */
export const chf = (n) => "CHF " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
export const zahl = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");

/* "... Franken" fuer die Stimme. */
export const franken = (n) => zahlwort(n) + " Franken";

export const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const ORDINAL = { 1: "erste", 2: "zweite", 3: "dritte", 7: "siebte", 8: "achte" };
/* 30 -> "dreissigste", 1 -> "erste" (fuer "am dreissigsten November" im Dativ ein -n anhaengen) */
export function ordinalwort(n) {
  if (ORDINAL[n]) return ORDINAL[n];
  return zahlwort(n) + (n < 20 ? "te" : "ste");
}

/* Datum als "2026-10-25" in lokaler Zeit. */
export function datumKurz(d = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function datumLesen(text) {
  const m = String(text).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Datum "${text}" nicht lesbar – erwartet JJJJ-MM-TT.`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
/* Ganze Tage von "von" (lokal, Mitternacht) bis zum naechsten Auftreten
   von Tag/Monat – inklusive des Zieltags selbst nicht mitgezaehlt. */
export function tageBis(von, monat, tag) {
  const start = new Date(von.getFullYear(), von.getMonth(), von.getDate());
  let ziel = new Date(start.getFullYear(), monat - 1, tag);
  if (ziel < start) ziel = new Date(start.getFullYear() + 1, monat - 1, tag);
  return Math.round((ziel - start) / 86_400_000);
}

/* Deterministischer Zufall je Tag – gleicher Tag, gleicher Plan. */
export function zufall(saat) {
  let h = 1779033703 ^ String(saat).length;
  for (const c of String(saat)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function mischen(liste, rnd) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* Kurzer, stabiler Fingerabdruck – fuer Reel-Ids, damit sich Tonspuren
   nur dann erneuern, wenn sich der Sprechtext wirklich geaendert hat. */
export function fingerabdruck(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).padStart(7, "0").slice(0, 6);
}
