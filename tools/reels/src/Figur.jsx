import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { MARKE } from "./reels.js";

/* =========================================================================
   Motion-Graphik-Menschen.

   Flache, geometrische Figuren in den SwissPremia-Farben: Eikopf, Koerper
   als abgerundete Form, Arme und Beine als dicke Baender mit runden Enden.
   Regie-Regeln (Grammatik aus der Mid-Century-Animation, keine Vorlage
   kopiert): Der Koerper bleibt ruhig, Haende und Gesicht spielen; jede
   Pose kommt mit Ausholen, Aktion und Nachschwingen (Back-Easing);
   Requisiten liegen zwischen den Haenden.

   Skelett (Einheiten bei groesse 1, H = 600 px): Ursprung auf dem Boden
   zwischen den Fuessen, y nach oben negativ. Winkel in Grad, 0 = nach
   unten, positiv = zum rechten Bildrand, 180 = nach oben. armL/beinL ist
   die Seite am linken Bildrand. [oben, unten]: Oberarm absolut, Unterarm
   relativ zum Oberarm.
   ========================================================================= */

export const HAUT = ["#f3d2b8", "#e2b08c", "#c78c64", "#93603f", "#5e3b27"];
export const FARBE = {
  petrol: MARKE.petrol, petrolHell: "#4f8fb3", gold: MARKE.gold, goldDunkel: "#a8935e", slate: MARKE.slate,
  creme: MARKE.creme, weiss: "#ffffff", sand: "#d9c7a3", koralle: "#d9826a", salbei: "#8fae9b", jeans: "#3f5f7f", grau: "#9aa3ab"
};

/* Die feste Besetzung – wiederkehrende Gesichter machen die Reels zur Serie. */
export const BESETZUNG = {
  lea: { haut: HAUT[1], haar: "#5a3a22", frisur: "zopf", oben: FARBE.petrol, unten: FARBE.jeans, schuhe: FARBE.slate, groesse: 1 },
  marco: { haut: HAUT[3], haar: "#1f1a17", frisur: "kurz", bart: true, oben: FARBE.gold, unten: FARBE.slate, schuhe: "#3a2a20", groesse: 1.05 },
  noah: { haut: HAUT[4], haar: "#141110", frisur: "locken", oben: FARBE.slate, kapuze: true, unten: FARBE.jeans, schuhe: FARBE.weiss, kopfhoerer: true, groesse: 0.97 },
  keller: { haut: HAUT[0], haar: "#a3a3a3", frisur: "dutt", oben: FARBE.petrolHell, kittel: true, unten: FARBE.slate, schuhe: FARBE.slate, brille: true, stethoskop: true, groesse: 0.98 },
  mia: { haut: HAUT[2], haar: "#3b2416", frisur: "zoepfe", oben: FARBE.koralle, kurzarm: true, unten: FARBE.petrolHell, schuhe: FARBE.slate, groesse: 0.56, kind: true },
  brunner: { haut: HAUT[1], haar: "#d0d0d0", frisur: "glatze", oben: FARBE.salbei, unten: FARBE.grau, schuhe: "#4a3a2e", brille: true, groesse: 1 }
};

const GRUND = {
  armL: [-8, -6], armR: [8, 6], kurzL: 1, kurzR: 1, beinL: [-3, 0], beinR: [3, 0],
  neigung: 0, kopf: 0, heben: 0, mund: "laecheln", brauen: 0, augen: "offen", blick: 0, finger: false
};

/* Posen-Bibliothek. Nur Abweichungen von GRUND. */
export const POSEN = {
  stehen: {},
  winken: { armR: [150, 22], kopf: 4, mund: "offen", augen: "froh" },
  winken2: { armR: [150, -28], kopf: 4, mund: "offen", augen: "froh" },
  zeigenOben: { armR: [168, 4], kopf: -5, blick: 1, finger: true, mund: "offen" },
  zeigenRechts: { armR: [96, -4], kopf: 7, blick: 1, finger: true },
  zeigenLinks: { armL: [-96, 4], kopf: -7, blick: -1, finger: true },
  denken: { armR: [32, -205], kurzR: 0.68, armL: [-6, 88], kurzL: 0.9, kopf: 6, blick: 1, mund: "neutral", brauen: 0.4 },
  aha: { armR: [160, 8], kopf: -4, mund: "offen", augen: "froh", finger: true, brauen: -0.2 },
  jubeln: { armL: [-158, -14], armR: [158, 14], mund: "offen", augen: "froh", heben: 18 },
  schulter: { armL: [-26, -84], armR: [26, 84], kopf: 8, brauen: 1, mund: "neutral", heben: 4 },
  sorge: { armR: [30, -200], kurzR: 0.7, kopf: -6, brauen: 1, mund: "sorge", augen: "halb" },
  tragen: { armL: [-14, 22], armR: [14, -22], kurzL: 0.75, kurzR: 0.75, mund: "laecheln" },
  einwerfen: { armR: [82, 8], kopf: 8, blick: 1 },
  telefon: { armR: [28, -205], kurzR: 0.66, kopf: -7, blick: -1, mund: "offen" },
  tippen: { armL: [-14, 62], armR: [14, -62], kurzL: 0.6, kurzR: 0.6, kopf: 0, blick: 0, mund: "neutral" },
  wiegen: { armL: [-24, 74], armR: [24, -74], kurzL: 0.74, kurzR: 0.74, kopf: 10, blick: 1, augen: "froh" },
  hueften: { armL: [-42, 104], armR: [42, -104], kopf: -4, mund: "grinsen" },
  staunen: { armL: [-30, -40], armR: [30, 40], mund: "o", brauen: -0.4, heben: 6 },
  daumen: { armR: [40, -130], kurzR: 0.8, mund: "grinsen", augen: "froh", kopf: 5 }
};

/* Gehen als Posenfunktion: Beine pendeln, Arme gegengleich, Koerper wippt. */
export const gehen = (tempo = 0.32, phase = 0) => (frame) => {
  const p = frame * tempo + phase;
  const s = Math.sin(p);
  return {
    beinL: [24 * s, Math.max(0, 28 * Math.sin(p + 1.4))], beinR: [-24 * s, Math.max(0, 28 * Math.sin(p + Math.PI + 1.4))],
    armL: [-6 - 20 * s, -10], armR: [6 - 20 * s, 10], heben: Math.abs(Math.cos(p)) * 8, mund: "laecheln"
  };
};

/* Eine Pose zu einem Zeitpunkt: String, Objekt oder Funktion(frame). */
const aufloesen = (pose, frame) => {
  const p = typeof pose === "function" ? pose(frame) : typeof pose === "string" ? POSEN[pose] || {} : pose || {};
  return { ...GRUND, ...p };
};
const mischen = (a, b, t) => {
  const z = (x, y) => x + (y - x) * t;
  const paar = (x, y) => [z(x[0], y[0]), z(x[1], y[1])];
  return {
    armL: paar(a.armL, b.armL), armR: paar(a.armR, b.armR), beinL: paar(a.beinL, b.beinL), beinR: paar(a.beinR, b.beinR),
    kurzL: z(a.kurzL, b.kurzL), kurzR: z(a.kurzR, b.kurzR), neigung: z(a.neigung, b.neigung), kopf: z(a.kopf, b.kopf),
    heben: z(a.heben, b.heben), brauen: z(a.brauen, b.brauen), blick: z(a.blick, b.blick),
    mund: t < 0.5 ? a.mund : b.mund, augen: t < 0.5 ? a.augen : b.augen, finger: t < 0.5 ? a.finger : b.finger
  };
};
/* Ausholen, Aktion, Nachschwingen: Back-Easing mit Ueberschwinger. */
const SCHWUNG = Easing.bezier(0.34, 1.5, 0.64, 1);

/* Ablauf: [[frame, pose], ...]. Ab jedem Schluesselframe geht die Figur in
   "dauer" Frames in die neue Pose und haelt sie bis zum naechsten. */
export const usePose = (ablauf, dauer = 9) => {
  const frame = useCurrentFrame();
  if (!Array.isArray(ablauf)) return aufloesen(ablauf, frame);
  let i = 0;
  while (i + 1 < ablauf.length && ablauf[i + 1][0] <= frame) i++;
  const [ab, ziel] = ablauf[i];
  const neu = aufloesen(ziel, frame);
  if (i === 0) return neu;
  const alt = aufloesen(ablauf[i - 1][1], frame);
  const t = interpolate(frame, [ab, ab + dauer], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCHWUNG });
  return mischen(alt, neu, t);
};

const P = (x, y, w, l) => ({ x: x + Math.sin((w * Math.PI) / 180) * l, y: y + Math.cos((w * Math.PI) / 180) * l });
const dunkler = (hex, f = 0.82) => {
  const n = parseInt(hex.slice(1), 16);
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return "#" + [k(n >> 16), k((n >> 8) & 255), k(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
};

/* Handpositionen einer Pose – fuer Requisiten zwischen den Haenden. */
export const haende = (wer, pose) => {
  const b = BESETZUNG[wer] || BESETZUNG.lea;
  const m = masse(b);
  const sY = -m.bein - m.rumpf - (pose.heben || 0);
  const ellL = P(-m.sx, sY, pose.armL[0], m.oa * pose.kurzL), handL = P(ellL.x, ellL.y, pose.armL[0] + pose.armL[1], m.ua);
  const ellR = P(m.sx, sY, pose.armR[0], m.oa * pose.kurzR), handR = P(ellR.x, ellR.y, pose.armR[0] + pose.armR[1], m.ua);
  return { handL, handR, schulterY: sY, kopfY: sY - m.hals - m.kopfRy, masse: m };
};

function masse(b) {
  const H = 600;
  const k = b.kind ? 1.28 : 1;   // Kinder: groesserer Kopf im Verhaeltnis
  return {
    bein: 0.45 * H, rumpf: 0.29 * H, hals: 0.035 * H, kopfRx: 0.085 * H * k, kopfRy: 0.1 * H * k,
    sx: 0.105 * H, hx: 0.062 * H, oa: 0.155 * H, ua: 0.15 * H, arm: 0.062 * H, beinD: 0.078 * H, hand: 0.034 * H
  };
}

/* ------------------------------------------------------------ Zeichnen */

export const Figur = ({ wer = "lea", x = 0, y = 0, pose, skala = 1, spiegeln = false, inHand = null, kittelFarbe }) => {
  const frame = useCurrentFrame();
  const b = BESETZUNG[wer] || BESETZUNG.lea;
  const m = masse(b);
  const p = pose || aufloesen("stehen", frame);
  const atmen = Math.sin(frame / 18) * 2.5;
  const hY = -m.bein - (p.heben || 0);                       // Huefte
  const sY = hY - m.rumpf + atmen * 0.4;                     // Schulter
  const kopfY = sY - m.hals - m.kopfRy;                      // Kopfmitte
  const blinzeln = (frame + Math.round(b.groesse * 37)) % 97 < 3;

  const huefteL = { x: -m.hx, y: hY }, huefteR = { x: m.hx, y: hY };
  const knieL = P(huefteL.x, huefteL.y, p.beinL[0], m.bein / 2), fussL = P(knieL.x, knieL.y, p.beinL[0] + p.beinL[1], m.bein / 2);
  const knieR = P(huefteR.x, huefteR.y, p.beinR[0], m.bein / 2), fussR = P(knieR.x, knieR.y, p.beinR[0] + p.beinR[1], m.bein / 2);
  const schL = { x: -m.sx, y: sY }, schR = { x: m.sx, y: sY };
  const ellL = P(schL.x, schL.y, p.armL[0], m.oa * p.kurzL), handL = P(ellL.x, ellL.y, p.armL[0] + p.armL[1], m.ua);
  const ellR = P(schR.x, schR.y, p.armR[0], m.oa * p.kurzR), handR = P(ellR.x, ellR.y, p.armR[0] + p.armR[1], m.ua);

  const band = (a, c, d, farbe, breite) => (
    <path d={`M${a.x} ${a.y} L${c.x} ${c.y} L${d.x} ${d.y}`} fill="none" stroke={farbe} strokeWidth={breite} strokeLinecap="round" strokeLinejoin="round" />
  );
  const arm = (sch, ell, hand, seite) => (
    <g>
      {b.kurzarm
        ? <>{band(sch, ell, ell, b.oben, m.arm)}<path d={`M${ell.x} ${ell.y} L${hand.x} ${hand.y}`} stroke={b.haut} strokeWidth={m.arm * 0.78} strokeLinecap="round" /></>
        : band(sch, ell, hand, b.kittel ? (kittelFarbe || "#ffffff") : b.oben, m.arm)}
      <circle cx={hand.x} cy={hand.y} r={m.hand} fill={b.haut} />
      {p.finger && seite === "R" && (() => {
        const w = p.armR[0] + p.armR[1];
        const f = P(hand.x, hand.y, w, m.hand * 1.9);
        return <path d={`M${hand.x} ${hand.y} L${f.x} ${f.y}`} stroke={b.haut} strokeWidth={m.hand * 0.75} strokeLinecap="round" />;
      })()}
    </g>
  );

  const rumpfBreiteO = m.sx + m.arm * 0.42, rumpfBreiteU = m.hx + m.beinD * 0.5;
  const rumpf = `M${-rumpfBreiteO} ${sY - 6} Q0 ${sY - 22} ${rumpfBreiteO} ${sY - 6} L${rumpfBreiteU} ${hY + 8} Q0 ${hY + 18} ${-rumpfBreiteU} ${hY + 8} Z`;
  const augeY = kopfY - m.kopfRy * 0.05, augeX = m.kopfRx * 0.38, blick = p.blick * m.kopfRx * 0.08;
  const r = m.kopfRx * 0.11;

  return (
    <g transform={`translate(${x} ${y}) scale(${skala * b.groesse * (spiegeln ? -1 : 1)} ${skala * b.groesse})`}>
      {/* Schatten */}
      <ellipse cx="0" cy="4" rx={m.sx * 1.5} ry="14" fill="rgba(0,0,0,.14)" />
      {/* Haare hinten (Zopf, lange Haare) */}
      <g transform={`rotate(${p.kopf} 0 ${sY})`}>
        {b.frisur === "zopf" && (
          <ellipse cx={m.kopfRx * 0.95} cy={kopfY + m.kopfRy * 0.35} rx={m.kopfRx * 0.32} ry={m.kopfRy * 0.6} fill={b.haar}
            transform={`rotate(${-18 + Math.sin(frame / 9) * 6} ${m.kopfRx * 0.7} ${kopfY - m.kopfRy * 0.2})`} />
        )}
        {b.kapuze && <ellipse cx="0" cy={sY - 4} rx={m.sx * 1.05} ry={m.hals * 2.2} fill={dunkler(b.oben, 0.8)} />}
      </g>
      {/* Beine */}
      {band(huefteL, knieL, fussL, b.unten, m.beinD)}
      {band(huefteR, knieR, fussR, b.unten, m.beinD)}
      <ellipse cx={fussL.x - 10} cy={fussL.y + 4} rx={m.beinD * 0.78} ry={m.beinD * 0.42} fill={b.schuhe} />
      <ellipse cx={fussR.x + 10} cy={fussR.y + 4} rx={m.beinD * 0.78} ry={m.beinD * 0.42} fill={b.schuhe} />
      {/* Rumpf, Kittel */}
      <path d={rumpf} fill={b.oben} />
      <path d={`M${rumpfBreiteO * 0.15} ${sY - 12} Q${rumpfBreiteO * 0.7} ${sY + 10} ${rumpfBreiteU} ${hY + 8} L${rumpfBreiteU * 0.2} ${hY + 14} Z`} fill={dunkler(b.oben, 0.88)} opacity=".6" />
      {b.kittel && (
        <>
          <path d={`M${-rumpfBreiteO - 4} ${sY - 4} L${-rumpfBreiteU - 16} ${hY + 70} L${-8} ${hY + 70} L${-6} ${sY + 30} Z`} fill="#ffffff" />
          <path d={`M${rumpfBreiteO + 4} ${sY - 4} L${rumpfBreiteU + 16} ${hY + 70} L${8} ${hY + 70} L${6} ${sY + 30} Z`} fill="#f1f3f5" />
        </>
      )}
      {b.stethoskop && (
        <g fill="none" stroke={MARKE.slate} strokeWidth="5" strokeLinecap="round">
          <path d={`M${-m.hx * 0.9} ${sY - 2} Q${-m.hx * 1.1} ${sY + 70} ${-4} ${sY + 92}`} />
          <path d={`M${m.hx * 0.9} ${sY - 2} Q${m.hx * 1.1} ${sY + 60} ${m.hx * 0.5} ${sY + 84}`} />
          <circle cx={m.hx * 0.5} cy={sY + 96} r="11" fill={MARKE.gold} stroke={MARKE.slate} />
        </g>
      )}
      {/* Requisit zwischen den Haenden (vor dem Rumpf, hinter den Armen) */}
      {inHand && <Requisit art={inHand} handL={handL} handR={handR} m={m} frame={frame} />}
      {/* Hals und Kopf */}
      <g transform={`rotate(${p.kopf} 0 ${sY})`}>
        <rect x={-m.hals * 0.9} y={sY - m.hals - 6} width={m.hals * 1.8} height={m.hals + 12} rx="6" fill={dunkler(b.haut, 0.92)} />
        <ellipse cx="0" cy={kopfY} rx={m.kopfRx} ry={m.kopfRy} fill={b.haut} />
        <Haare b={b} m={m} kopfY={kopfY} frame={frame} />
        {/* Gesicht */}
        <circle cx={-augeX * 1.15} cy={augeY + m.kopfRy * 0.32} r={r * 1.5} fill="#e88f7a" opacity=".28" />
        <circle cx={augeX * 1.15} cy={augeY + m.kopfRy * 0.32} r={r * 1.5} fill="#e88f7a" opacity=".28" />
        {[-1, 1].map((seite) => (
          blinzeln || p.augen === "zu"
            ? <path key={seite} d={`M${seite * augeX - r} ${augeY} L${seite * augeX + r} ${augeY}`} stroke={MARKE.slate} strokeWidth="3.5" strokeLinecap="round" />
            : p.augen === "froh"
              ? <path key={seite} d={`M${seite * augeX - r * 1.1 + blick} ${augeY + 2} Q${seite * augeX + blick} ${augeY - r * 1.4} ${seite * augeX + r * 1.1 + blick} ${augeY + 2}`} fill="none" stroke={MARKE.slate} strokeWidth="4" strokeLinecap="round" />
              : <ellipse key={seite} cx={seite * augeX + blick} cy={augeY} rx={r} ry={p.augen === "halb" ? r * 0.55 : r * 1.15} fill={MARKE.slate} />
        ))}
        {[-1, 1].map((seite) => {
          const innen = seite * augeX * 0.55, aussen = seite * augeX * 1.45, h = augeY - m.kopfRy * 0.26;
          return <path key={"b" + seite} d={`M${innen} ${h - p.brauen * 7} L${aussen} ${h + p.brauen * 3}`} stroke={dunkler(b.haar, 0.9)} strokeWidth="4.5" strokeLinecap="round" />;
        })}
        <Mund art={p.mund} y={kopfY + m.kopfRy * 0.42} w={m.kopfRx * 0.32} frame={frame} />
        {b.bart && <path d={`M${-m.kopfRx * 0.82} ${kopfY + m.kopfRy * 0.1} Q${-m.kopfRx * 0.7} ${kopfY + m.kopfRy * 1.05} 0 ${kopfY + m.kopfRy * 1.02} Q${m.kopfRx * 0.7} ${kopfY + m.kopfRy * 1.05} ${m.kopfRx * 0.82} ${kopfY + m.kopfRy * 0.1} Q${m.kopfRx * 0.5} ${kopfY + m.kopfRy * 0.6} 0 ${kopfY + m.kopfRy * 0.62} Q${-m.kopfRx * 0.5} ${kopfY + m.kopfRy * 0.6} ${-m.kopfRx * 0.82} ${kopfY + m.kopfRy * 0.1} Z`} fill={b.haar} opacity=".9" />}
        {b.brille && (
          <g fill="rgba(255,255,255,.18)" stroke={MARKE.slate} strokeWidth="3.5">
            <circle cx={-augeX} cy={augeY} r={r * 2.4} /><circle cx={augeX} cy={augeY} r={r * 2.4} />
            <path d={`M${-augeX + r * 2.4} ${augeY} L${augeX - r * 2.4} ${augeY}`} />
          </g>
        )}
        {b.kopfhoerer && (
          <g>
            <path d={`M${-m.kopfRx * 1.02} ${kopfY} Q${-m.kopfRx * 1.1} ${kopfY - m.kopfRy * 1.45} 0 ${kopfY - m.kopfRy * 1.32} Q${m.kopfRx * 1.1} ${kopfY - m.kopfRy * 1.45} ${m.kopfRx * 1.02} ${kopfY}`} fill="none" stroke={MARKE.gold} strokeWidth="9" />
            <rect x={-m.kopfRx * 1.18} y={kopfY - 18} width="20" height="40" rx="9" fill={MARKE.gold} />
            <rect x={m.kopfRx * 1.18 - 20} y={kopfY - 18} width="20" height="40" rx="9" fill={MARKE.gold} />
          </g>
        )}
      </g>
      {/* Arme zuletzt: sie liegen vor Rumpf und Requisit */}
      {arm(schL, ellL, handL, "L")}
      {arm(schR, ellR, handR, "R")}
    </g>
  );
};

const Mund = ({ art, y, w, frame }) => {
  const st = { fill: "none", stroke: MARKE.slate, strokeWidth: 4.5, strokeLinecap: "round" };
  if (art === "offen") return <path d={`M${-w} ${y - 3} Q0 ${y + w * 1.35} ${w} ${y - 3} Z`} fill="#7a2f2a" stroke={MARKE.slate} strokeWidth="3" strokeLinejoin="round" />;
  if (art === "grinsen") return <path d={`M${-w * 1.2} ${y - 4} Q0 ${y + w * 1.1} ${w * 1.2} ${y - 4}`} {...st} />;
  if (art === "neutral") return <path d={`M${-w * 0.7} ${y + 2} L${w * 0.7} ${y + 2}`} {...st} />;
  if (art === "sorge") return <path d={`M${-w * 0.8} ${y + 8} Q0 ${y - 6} ${w * 0.8} ${y + 8}`} {...st} />;
  if (art === "o") return <ellipse cx="0" cy={y + 3} rx={w * 0.38} ry={w * 0.5} fill="#7a2f2a" stroke={MARKE.slate} strokeWidth="3" />;
  if (art === "reden") return frame % 8 < 4 ? <Mund art="offen" y={y} w={w * 0.85} frame={frame} /> : <Mund art="laecheln" y={y} w={w} frame={frame} />;
  return <path d={`M${-w} ${y} Q0 ${y + w * 0.8} ${w} ${y}`} {...st} />;
};

const Haare = ({ b, m, kopfY, frame }) => {
  const rx = m.kopfRx, ry = m.kopfRy, f = b.haar;
  const kappe = <path d={`M${-rx * 1.04} ${kopfY + ry * 0.05} Q${-rx * 1.12} ${kopfY - ry * 1.2} 0 ${kopfY - ry * 1.08} Q${rx * 1.12} ${kopfY - ry * 1.2} ${rx * 1.04} ${kopfY + ry * 0.05} Q${rx * 0.78} ${kopfY - ry * 0.55} ${rx * 0.2} ${kopfY - ry * 0.62} Q${-rx * 0.5} ${kopfY - ry * 0.5} ${-rx * 1.04} ${kopfY + ry * 0.05} Z`} fill={f} />;
  switch (b.frisur) {
    case "kurz": return <path d={`M${-rx * 1.02} ${kopfY - ry * 0.1} Q${-rx * 1.05} ${kopfY - ry * 1.18} 0 ${kopfY - ry * 1.1} Q${rx * 1.05} ${kopfY - ry * 1.18} ${rx * 1.02} ${kopfY - ry * 0.1} Q${rx * 0.6} ${kopfY - ry * 0.72} 0 ${kopfY - ry * 0.7} Q${-rx * 0.6} ${kopfY - ry * 0.72} ${-rx * 1.02} ${kopfY - ry * 0.1} Z`} fill={f} />;
    case "locken": return (
      <g fill={f}>
        {[-0.85, -0.45, 0, 0.45, 0.85, -0.65, -0.2, 0.25, 0.68].map((u, i) => (
          <circle key={i} cx={u * rx} cy={kopfY - ry * (i < 5 ? 0.85 : 1.12) + Math.sin(frame / 14 + i) * 1.5} r={rx * 0.36} />
        ))}
      </g>
    );
    case "dutt": return <g>{kappe}<circle cx="0" cy={kopfY - ry * 1.2} r={rx * 0.42} fill={f} /></g>;
    case "zoepfe": return (
      <g>{kappe}
        <circle cx={-rx * 1.12} cy={kopfY + ry * 0.05} r={rx * 0.3} fill={f} transform={`rotate(${Math.sin(frame / 8) * 8} ${-rx} ${kopfY - ry * 0.2})`} />
        <circle cx={rx * 1.12} cy={kopfY + ry * 0.05} r={rx * 0.3} fill={f} transform={`rotate(${-Math.sin(frame / 8) * 8} ${rx} ${kopfY - ry * 0.2})`} />
      </g>
    );
    case "glatze": return (
      <g fill={f}>
        <ellipse cx={-rx * 0.95} cy={kopfY - ry * 0.05} rx={rx * 0.2} ry={ry * 0.3} />
        <ellipse cx={rx * 0.95} cy={kopfY - ry * 0.05} rx={rx * 0.2} ry={ry * 0.3} />
      </g>
    );
    default: return kappe;   // zopf: Kappe vorne, Zopf hinten
  }
};

/* Requisiten, die eine Figur haelt – zwischen den Haenden. */
const Requisit = ({ art, handL, handR, m, frame }) => {
  const mx = (handL.x + handR.x) / 2, my = (handL.y + handR.y) / 2;
  if (art === "karton") return (
    <g transform={`translate(${mx} ${my - 18})`}>
      <rect x="-92" y="-62" width="184" height="124" rx="8" fill="#c99a62" />
      <rect x="-92" y="-62" width="184" height="24" fill="#b4864f" />
      <rect x="-14" y="-62" width="28" height="124" fill="#e2c597" opacity=".7" />
    </g>
  );
  if (art === "glas") return (
    <g transform={`translate(${mx} ${my - 70})`}>
      <path d="M-70 -60 L70 -60 L62 70 Q60 84 46 84 L-46 84 Q-60 84 -62 70 Z" fill="rgba(255,255,255,.35)" stroke="#ffffff" strokeWidth="5" />
      <rect x="-76" y="-74" width="152" height="18" rx="7" fill={MARKE.gold} />
    </g>
  );
  if (art === "baby") return (
    <g transform={`translate(${mx} ${my - 34})`}>
      <ellipse cx="0" cy="0" rx="92" ry="44" fill="#ffffff" />
      <ellipse cx="0" cy="6" rx="78" ry="30" fill="#e9eef2" />
      <circle cx="58" cy="-14" r="34" fill={HAUT[1]} />
      <path d="M44 -14 Q50 -20 56 -14 M62 -14 Q68 -20 74 -14" fill="none" stroke={MARKE.slate} strokeWidth="3" strokeLinecap="round" />
      <path d="M26 -40 Q58 -66 90 -36 Q60 -46 26 -40 Z" fill={FARBE.koralle} />
    </g>
  );
  if (art === "brief") {
    const h = handR;
    return (
      <g transform={`translate(${h.x + 6} ${h.y - 10}) rotate(${-12 + Math.sin(frame / 10) * 3})`}>
        <rect x="-10" y="-46" width="118" height="80" rx="6" fill="#ffffff" stroke={MARKE.slate} strokeWidth="3" />
        <path d="M-10 -46 L49 0 L108 -46" fill="none" stroke={MARKE.slate} strokeWidth="3" />
      </g>
    );
  }
  if (art === "telefon") {
    const h = handR;
    return (
      <g transform={`translate(${h.x - 4} ${h.y - 4}) rotate(-12)`}>
        <rect x="-18" y="-58" width="36" height="72" rx="8" fill={MARKE.slate} />
        <rect x="-13" y="-50" width="26" height="54" rx="4" fill={FARBE.petrolHell} />
      </g>
    );
  }
  if (art === "thermometer") {
    const h = handR;
    return <g transform={`translate(${h.x - 6} ${h.y - 30}) rotate(-35)`}><rect x="-7" y="-46" width="14" height="60" rx="7" fill="#ffffff" stroke={MARKE.slate} strokeWidth="2.5" /><circle cx="0" cy="18" r="11" fill="#d9534f" /></g>;
  }
  return null;
};
