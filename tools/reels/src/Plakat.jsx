/* =========================================================================
   Serie «Plakat» – Reiseplakate, die sich selbst aufbauen.

   Anregung (13.11.2026): animierte Reiseplakate – eine Karte auf einem
   Farbverlauf, darin eine flache Illustration, die aus dem Boden waechst;
   ein grosser Konturtitel, der sich zeichnet; Fahrzeuge gleiten durchs
   Bild; Pflanzen ragen ueber den Kartenrand; beim Szenenwechsel faehrt
   alles ein, die Karte wechselt Format und Tageszeit, die naechste Szene
   waechst. Hier mit eigenen Schweizer Szenen und den SwissPremia-Farben.

   Eingabe `reel` (plakat/bauen.js):
     teile  [{ von, bis, ort, palette, format, klein, gross, zahl?, bloecke, abbinder? }]
            ort      seestadt | bergdorf | bahnhof | praxis | quartier | gipfel
            palette  nacht | daemmerung | abend | morgen | tag
            format   quer | quadrat | hoch
            bloecke  [{ von, bis, t }] in Frames ab Szenenbeginn
            zahl     { wert, quelle } – der Titel zaehlt auf den Betrag hoch
     ton, musik, gesamt

   Geometrie: Die Szenen sind in «Weltmass» gezeichnet (Ursprung unten in
   der Kartenmitte, y nach oben negativ, Massstab S); die Karte ist ein
   Fenster darauf. Der Titel steht immer auf derselben Hoehe, die Karte
   wandert um ihn herum.
   ========================================================================= */
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { loadFont as ladeFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as ladeAnton } from "@remotion/google-fonts/Anton";
import { SCHRIFT, ZONE } from "./Marke.jsx";

const { fontFamily: SERIF } = ladeFraunces("normal", { weights: ["600"], subsets: ["latin", "latin-ext"] });
ladeFraunces("italic", { weights: ["600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: KONTUR } = ladeAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

const B0 = 1080, H0 = 1920;
const S = 0.92;            // Weltmass -> Pixel
const G = 230;             // Hoehe des Vordergrunds (Wasser, Strasse, Wiese) in Weltmass
const TITEL_Y = 715;       // Grundlinie des Konturtitels
const TITEL_UNTEN = 640;   // hoeher ragt keine Szene in den Titel
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const SCH = "rgba(20,33,44,0.16)";
const NACHT = "#14212C", CREME = "#F4EEE4", PETROL = "#00446A", ORANGE = "#EC6A1E", ROT = "#D4301F", STAMM = "#5A3B28";

export const FORMATE = { quer: { w: 920, h: 600, y: 640 }, quadrat: { w: 860, h: 860, y: 430 }, hoch: { w: 760, h: 1000, y: 340 } };

export const PALETTEN = {
  nacht: {
    bg: ["#0E1B26", "#00446A"], himmel: ["#12304A", "#3B7BA3"], bergFern: "#4C83A8", bergMitte: "#2F6790", bergNah: "#1C4E72", schnee: "#DCE7EC",
    gruenFern: "#1E5560", wieseA: "#1B4B57", wieseB: "#143B49", wasserA: "#2A6C96", wasserB: "#123F5E", glanz: "#9DB7C4", kai: "#0E2C42", strasse: "#17364B",
    haus: ["#D9CDB8", "#E08A52", "#B9C9D1", "#EDE3D2"], dach: ["#A8431A", "#6E2B12", "#0E2C42"], fenster: "#F6C56B", holz: "#8A5637", gruen: ["#2C6A60", "#1E4F4C"],
    gestirn: CREME, titel: CREME, zahl: "#F0803A", text: CREME, betont: { farbe: "#F5A46A" }, figur: CREME, dunkel: true
  },
  daemmerung: {
    bg: ["#00446A", "#9DB7C4"], himmel: ["#2F628A", "#B9CCD5"], bergFern: "#7FA3BA", bergMitte: "#4F7FA0", bergNah: "#2B5F86", schnee: CREME,
    gruenFern: "#3F7272", wieseA: "#356A6A", wieseB: "#27555A", wasserA: "#6C9AB6", wasserB: "#2B5F86", glanz: "#E6EEF0", kai: "#1C4764", strasse: "#3A5F78",
    haus: [CREME, "#EC8A4A", "#D9D2C5", "#C9D6DC"], dach: ["#B84C1C", "#7C2F12", PETROL], fenster: "#F6C56B", holz: "#9A6540", gruen: ["#3F8072", "#2C6A60"],
    gestirn: CREME, titel: CREME, zahl: "#F7A56B", text: NACHT, betont: { bg: ORANGE, farbe: NACHT }, figur: CREME, dunkel: true
  },
  abend: {
    bg: [PETROL, "#8A5F72", "#F2A46B"], himmel: ["#5E5078", "#F3A86E"], bergFern: "#5E6E95", bergMitte: "#2F5F8A", bergNah: PETROL, schnee: "#F9D9B8",
    gruenFern: "#2E5A66", wieseA: "#2C5F66", wieseB: "#1F4A55", wasserA: "#E79A66", wasserB: "#5A5C86", glanz: "#FBE3C6", kai: "#14334A", strasse: "#3B4F69",
    haus: [CREME, "#F0995C", "#E6D3BD", "#D9D2C5"], dach: ["#B4471A", "#7C2F12", PETROL], fenster: "#FBD98A", holz: "#8E5A3A", gruen: ["#3D7468", "#2C5A58"],
    gestirn: "#FBD9A0", titel: CREME, zahl: "#FBD9A0", text: NACHT, betont: { bg: NACHT, farbe: CREME }, figur: CREME, dunkel: true
  },
  morgen: {
    bg: [CREME, "#F3C9A0"], himmel: ["#F9DDB9", "#F4B887"], bergFern: "#A9C0CC", bergMitte: "#6F9BB6", bergNah: "#3B7BA3", schnee: "#FFF8EE",
    gruenFern: "#7FA08A", wieseA: "#6F9A7E", wieseB: "#4F7F6C", wasserA: "#9CC3D6", wasserB: "#5E97B8", glanz: "#FFFFFF", kai: "#8E7F73", strasse: "#B9AFA2",
    haus: ["#FFF8EE", "#EC8A4A", "#E6D9C6", CREME], dach: ["#C8501A", "#8A3413", PETROL], fenster: PETROL, holz: "#A56B42", gruen: ["#5F9278", "#3F7862"],
    gestirn: ORANGE, titel: PETROL, zahl: PETROL, text: NACHT, betont: { bg: ORANGE, farbe: NACHT }, figur: NACHT, dunkel: false
  },
  tag: {
    bg: ["#D9D2C5", CREME], himmel: ["#9CC3D6", "#DCEAF0"], bergFern: "#B5CDD9", bergMitte: "#7FA9C2", bergNah: "#4C83A8", schnee: "#FFFFFF",
    gruenFern: "#86A88F", wieseA: "#74A082", wieseB: "#558870", wasserA: "#6FA8C6", wasserB: "#3B7BA3", glanz: "#FFFFFF", kai: "#8E8377", strasse: "#B4AA9C",
    haus: ["#FFF8EE", "#EC8A4A", "#EADFCB", CREME], dach: ["#C8501A", "#8A3413", PETROL], fenster: PETROL, holz: "#A56B42", gruen: ["#5F9278", "#3F7862"],
    gestirn: ORANGE, titel: PETROL, zahl: PETROL, text: NACHT, betont: { bg: ORANGE, farbe: NACHT }, figur: NACHT, dunkel: false
  }
};
const verlauf = (farben) => `linear-gradient(180deg, ${farben.join(", ")})`;
const tausender = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");

/* ---- Bausteine der Illustration (Weltmass) --------------------------- */
const sk = (e) => Math.max(0.001, e);

const Berg = ({ x, b, h, farbe, schnee, e, y = -G }) => {
  const p = (dx, dy) => `${x + dx * b},${y - dy * h}`;
  return (
    <g transform={`translate(0 ${(1 - e) * (h + 60)})`}>
      <polygon points={[p(-0.5, 0), p(-0.2, 0.7), p(-0.1, 0.64), p(0, 1), p(0.12, 0.7), p(0.22, 0.78), p(0.5, 0)].join(" ")} fill={farbe} />
      <polygon points={[p(0, 1), p(0.12, 0.7), p(0.22, 0.78), p(0.5, 0), p(0.06, 0), p(-0.02, 0.5)].join(" ")} fill={SCH} />
      {schnee ? <polygon points={[p(0, 1), p(-0.066, 0.76), p(-0.035, 0.8), p(-0.01, 0.72), p(0.03, 0.8), p(0.06, 0.74), p(0.1, 0.75)].join(" ")} fill={schnee} /> : null}
    </g>
  );
};

const Huegel = ({ farbe, e, hoehe = 90 }) => (
  <path d={`M-700 ${-G + 2} V${-G - hoehe * 0.5} Q-350 ${-G - hoehe * 1.4} 0 ${-G - hoehe * 0.7} T700 ${-G - hoehe} V${-G + 2} Z`} fill={farbe} transform={`translate(0 ${(1 - e) * (hoehe * 1.6)})`} />
);

const Haus = ({ x, y = -G, b, h, wand, dach, form = "giebel", fx = 2, fy = 2, fenster, e, tuer }) => {
  const dh = form === "giebel" ? b * 0.42 : form === "flach" ? 12 : b * 0.3;
  const ue = form === "chalet" ? 26 : 7;
  const zelle = b / (fx + 0.5), fw = zelle * 0.5, fh = fw * 1.4, lz = fh * 0.6;
  const fen = [];
  for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) {
    const oben = -h + 22 + j * (fh + lz);
    if (oben + fh > (tuer ? -fh * 1.7 : -12)) continue;
    fen.push(<rect key={`${j}-${i}`} x={-b / 2 + zelle * (i + 0.5)} y={oben} width={fw} height={fh} rx="3" fill={fenster} />);
  }
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${sk(e)})`}>
      <rect x={-b / 2} y={-h} width={b} height={h} fill={wand} />
      <rect x={b * 0.14} y={-h} width={b * 0.36} height={h} fill={SCH} />
      {fen}
      {form === "chalet" ? <rect x={-b / 2 - 8} y={-h * 0.5} width={b + 16} height="9" fill={dach} /> : null}
      {tuer ? <rect x={-fw * 0.65} y={-fh * 1.5} width={fw * 1.3} height={fh * 1.5} rx="4" fill={tuer} /> : null}
      {form === "flach" ? <rect x={-b / 2 - 5} y={-h - 12} width={b + 10} height="14" fill={dach} />
        : form === "walm" ? <polygon points={`${-b / 2 - ue},${-h} ${-b * 0.22},${-h - dh} ${b * 0.22},${-h - dh} ${b / 2 + ue},${-h}`} fill={dach} />
          : <polygon points={`${-b / 2 - ue},${-h} 0,${-h - dh} ${b / 2 + ue},${-h}`} fill={dach} />}
      {form === "flach" ? null : <polygon points={`${b * 0.03},${-h - dh} ${form === "walm" ? b * 0.22 : b * 0.03},${-h - dh} ${b / 2 + ue},${-h} ${b * 0.03},${-h}`} fill={SCH} />}
    </g>
  );
};

const Kirche = ({ x, y = -G, h, wand, dach, fenster, e }) => {
  const b = h * 0.2, s0 = b * 0.5, sb = h * 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${sk(e)})`}>
      <rect x={s0} y={-h * 0.4} width={sb} height={h * 0.4} fill={wand} />
      <polygon points={`${s0},${-h * 0.4} ${s0 + sb * 0.12},${-h * 0.56} ${s0 + sb * 0.88},${-h * 0.56} ${s0 + sb + 6},${-h * 0.4}`} fill={dach} />
      {[0, 1, 2].map((n) => <rect key={n} x={s0 + sb * (0.16 + n * 0.27)} y={-h * 0.3} width={sb * 0.13} height={h * 0.18} rx={sb * 0.065} fill={fenster} />)}
      <rect x={-b / 2} y={-h * 0.68} width={b} height={h * 0.68} fill={wand} />
      <rect x={b * 0.12} y={-h * 0.68} width={b * 0.38} height={h * 0.68} fill={SCH} />
      <polygon points={`${-b / 2 - 5},${-h * 0.68} 0,${-h} ${b / 2 + 5},${-h * 0.68}`} fill={dach} />
      <polygon points={`0,${-h} ${b / 2 + 5},${-h * 0.68} 0,${-h * 0.68}`} fill={SCH} />
      <circle cx="0" cy={-h * 0.56} r={b * 0.3} fill={CREME} />
      <path d={`M0 ${-h * 0.56} v${-b * 0.2} M0 ${-h * 0.56} h${b * 0.14}`} stroke={NACHT} strokeWidth="3" strokeLinecap="round" />
      <rect x={-b * 0.14} y={-h * 0.4} width={b * 0.28} height={h * 0.13} rx={b * 0.14} fill={fenster} />
    </g>
  );
};

const wiegen = (t, x) => Math.sin(t / 17 + x / 50) * 1.6;
const Zypresse = ({ x, y, h, farbe, e, t = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${wiegen(t, x)}) scale(${sk(e)})`}>
    <rect x={-h * 0.02} y={-h * 0.1} width={h * 0.04} height={h * 0.1} fill={STAMM} />
    <path d={`M0 ${-h * 0.06} C${-h * 0.2} ${-h * 0.25} ${-h * 0.13} ${-h * 0.8} 0 ${-h} C${h * 0.13} ${-h * 0.8} ${h * 0.2} ${-h * 0.25} 0 ${-h * 0.06} Z`} fill={farbe} />
    <path d={`M0 ${-h * 0.06} C${h * 0.2} ${-h * 0.25} ${h * 0.13} ${-h * 0.8} 0 ${-h} C${h * 0.04} ${-h * 0.7} ${h * 0.05} ${-h * 0.3} 0 ${-h * 0.06} Z`} fill={SCH} />
  </g>
);
const Tanne = ({ x, y, h, farbe, e, t = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${wiegen(t, x) * 0.6}) scale(${sk(e)})`}>
    <rect x={-h * 0.03} y={-h * 0.12} width={h * 0.06} height={h * 0.12} fill={STAMM} />
    {[0, 1, 2].map((n) => <polygon key={n} points={`${-h * (0.24 - n * 0.05)},${-h * (0.1 + n * 0.27)} 0,${-h * (0.52 + n * 0.24)} ${h * (0.24 - n * 0.05)},${-h * (0.1 + n * 0.27)}`} fill={farbe} />)}
    {[0, 1, 2].map((n) => <polygon key={n} points={`0,${-h * (0.1 + n * 0.27)} 0,${-h * (0.52 + n * 0.24)} ${h * (0.24 - n * 0.05)},${-h * (0.1 + n * 0.27)}`} fill={SCH} />)}
  </g>
);
const Kugelbaum = ({ x, y, h, farbe, e, t = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${wiegen(t, x) * 0.7}) scale(${sk(e)})`}>
    <rect x={-h * 0.035} y={-h * 0.5} width={h * 0.07} height={h * 0.5} fill={STAMM} />
    <circle cx="0" cy={-h * 0.66} r={h * 0.34} fill={farbe} />
    <path d={`M0 ${-h} A${h * 0.34} ${h * 0.34} 0 0 1 0 ${-h * 0.32} A${h * 0.17} ${h * 0.34} 0 0 0 0 ${-h} Z`} fill={SCH} />
  </g>
);
const Busch = ({ x, y, r, farbe, e }) => (
  <g transform={`translate(${x} ${y}) scale(${sk(e)})`} fill={farbe}>
    <circle cx={-r * 0.75} cy={-r * 0.55} r={r * 0.7} /><circle cx="0" cy={-r * 0.95} r={r} /><circle cx={r * 0.85} cy={-r * 0.5} r={r * 0.65} />
    <rect x={-r * 1.45} y={-r * 0.6} width={r * 2.95} height={r * 0.6} />
    <circle cx={r * 0.25} cy={-r * 0.95} r={r * 0.75} fill={SCH} />
  </g>
);

const Gestirn = ({ x, y, r, farbe, e }) => (
  <g transform={`translate(${x} ${y}) scale(${sk(e)})`}><circle r={r * 1.55} fill={farbe} opacity="0.18" /><circle r={r} fill={farbe} /></g>
);
const Wolke = ({ x, y, s = 1, farbe, o = 0.9 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill={farbe}>
    <ellipse cx="-50" cy="0" rx="48" ry="26" /><ellipse cx="0" cy="-18" rx="56" ry="36" /><ellipse cx="56" cy="0" rx="50" ry="26" /><rect x="-96" y="0" width="200" height="26" rx="13" />
  </g>
);
const Flagge = ({ x, y, h = 80, t, e = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${sk(e)})`}>
    <rect x="-2" y={-h} width="4" height={h} fill={NACHT} />
    <g transform={`translate(2 ${-h}) skewY(${Math.sin(t / 5) * 5})`}>
      <rect width="46" height="46" fill={ROT} /><rect x="18" y="8" width="10" height="30" fill="#fff" /><rect x="8" y="18" width="30" height="10" fill="#fff" />
    </g>
  </g>
);
const Wasser = ({ P, t, oben }) => (
  <g>
    <rect x="-700" y={oben} width="1400" height={-oben + 80} fill={P.wasserB} />
    <rect x="-700" y={oben} width="1400" height="50" fill={P.wasserA} />
    {[[-380, 74, 120], [-90, 100, 80], [210, 68, 150], [-260, 150, 90], [120, 168, 110], [380, 130, 70]].map(([x, dy, l], n) => (
      <rect key={n} x={x + Math.sin(t / 22 + n) * 10} y={oben + dy} width={l} height="5" rx="2.5" fill={P.glanz} opacity={0.3 + 0.25 * Math.sin(t / 8 + n * 1.7)} />
    ))}
  </g>
);
const Strasse = ({ P, t }) => (
  <g>
    <rect x="-700" y={-G} width="1400" height="26" fill={P.kai} />
    <rect x="-700" y={-G + 26} width="1400" height={G + 60} fill={P.strasse} />
    {[-520, -340, -160, 20, 200, 380, 560].map((x) => <rect key={x} x={x} y={-G + 124} width="80" height="8" rx="4" fill={CREME} opacity="0.55" />)}
  </g>
);

const Schiff = ({ x, y, t, P }) => (
  <g transform={`translate(${x} ${y + Math.sin(t / 9) * 2.5})`}>
    <rect x="-20" y="-84" width="18" height="28" fill={ORANGE} />
    <rect x="-70" y="-58" width="124" height="30" rx="4" fill="#FFF8EE" />
    {[0, 1, 2, 3].map((n) => <rect key={n} x={-58 + n * 27} y="-50" width="16" height="13" rx="2" fill={PETROL} />)}
    <path d="M-112 -30 H102 L80 0 H-94 Z" fill="#FFF8EE" />
    <path d="M-106 -17 H93 L87 -8 H-100 Z" fill={ROT} />
    <path d="M-170 6 H-104 M100 6 H138" stroke={P.glanz} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
  </g>
);
const Tram = ({ x, y, farbe }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-22 -78 L0 -98 L22 -78" stroke={NACHT} strokeWidth="4" fill="none" />
    <rect x="-130" y="-78" width="260" height="66" rx="14" fill={farbe} />
    <rect x="-130" y="-40" width="260" height="13" fill={CREME} />
    {[0, 1, 2, 3, 4].map((n) => <rect key={n} x={-116 + n * 48} y="-68" width="36" height="23" rx="4" fill="#CFE3EC" />)}
    <circle cx="-80" cy="-10" r="10" fill={NACHT} /><circle cx="80" cy="-10" r="10" fill={NACHT} />
  </g>
);
const Zug = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 1, 2].map((n) => (
      <g key={n} transform={`translate(${n * 412} 0)`}>
        <path d={n === 0 ? "M-160 -18 Q-200 -18 -200 -62 Q-194 -120 -146 -120 H200 V-18 Z" : "M-200 -120 H200 V-18 H-200 Z"} fill={ROT} />
        <rect x="-200" y="-54" width="400" height="12" fill={CREME} />
        {[0, 1, 2, 3, 4].map((m) => <rect key={m} x={-150 + m * 68} y="-106" width="50" height="38" rx="5" fill="#1B3A52" />)}
        <circle cx="-120" cy="-12" r="13" fill={NACHT} /><circle cx="120" cy="-12" r="13" fill={NACHT} />
      </g>
    ))}
  </g>
);
const Transporter = ({ x, y, farbe, kreuz, links }) => (
  <g transform={`translate(${x} ${y}) scale(${links ? -1 : 1} 1)`}>
    <path d="M-100 -12 V-84 Q-100 -94 -90 -94 H38 L92 -52 Q100 -46 100 -34 V-12 Z" fill={farbe} />
    <path d="M44 -84 L84 -52 H44 Z" fill="#CFE3EC" />
    {kreuz ? <g fill={PETROL}><rect x="-52" y="-78" width="16" height="46" /><rect x="-67" y="-63" width="46" height="16" /></g> : <rect x="-84" y="-66" width="96" height="9" fill={NACHT} opacity="0.5" />}
    <circle cx="-56" cy="-10" r="15" fill={NACHT} /><circle cx="56" cy="-10" r="15" fill={NACHT} />
  </g>
);

/* ---- Orte: ({ t, D, w, sicht, P, H, B, p }) -> { gestirn, innen, aussen }
   w(verz, weich)  Aufbau 0..1 (mit Ueberschwingen), faellt am Szenenende auf 0
   sicht           Deckkraft fuer Gleitendes (ein- und ausgeblendet)
   H               hoechste erlaubte Hoehe ueber dem Kartenboden (Weltmass)
   B               sichtbare Breite der Karte (Weltmass)                    */
const seestadt = ({ t, D, w, sicht, P, H, B, p }) => ({
  gestirn: <Gestirn x={215 + 45 * p} y={-H * 0.93 + 12 * p} r={56} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
    <>
      <Berg x={-290} b={640} h={H * 0.7 - G} farbe={P.bergFern} e={w(0, true)} />
      <Berg x={150} b={780} h={H * 0.98 - G} farbe={P.bergMitte} schnee={P.schnee} e={w(2, true)} />
      <Berg x={470} b={460} h={H * 0.6 - G} farbe={P.bergNah} e={w(4, true)} />
      <Huegel farbe={P.gruenFern} e={w(3, true)} />
      <Haus x={-345} b={118} h={170} wand={P.haus[0]} dach={P.dach[0]} fx={2} fy={3} fenster={P.fenster} e={w(6)} />
      <Haus x={-222} b={112} h={218} wand={P.haus[1]} dach={P.dach[1]} form="walm" fx={2} fy={4} fenster={P.fenster} e={w(8)} />
      <Kirche x={-112} h={Math.min(340, H - G - 40)} wand={P.haus[3]} dach={P.dach[2]} fenster={P.fenster} e={w(10)} />
      <Haus x={152} b={128} h={236} wand={P.haus[0]} dach={P.dach[0]} fx={2} fy={4} fenster={P.fenster} e={w(13)} />
      <Haus x={284} b={120} h={176} wand={P.haus[2]} dach={P.dach[1]} form="walm" fx={2} fy={3} fenster={P.fenster} e={w(15)} />
      <Haus x={400} b={104} h={204} wand={P.haus[1]} dach={P.dach[2]} fx={2} fy={3} fenster={P.fenster} e={w(17)} />
      <Flagge x={152} y={-G - 236 - 52} h={62} t={t} e={w(20)} />
      <rect x="-700" y={-G} width="1400" height="20" fill={P.kai} />
      <g opacity={sicht}><Tram x={interpolate(t, [0, D], [-600, 300])} y={-G + 4} farbe={P.dach[2]} /></g>
      <Wasser P={P} t={t} oben={-G + 20} />
      <g opacity={sicht}><Schiff x={interpolate(t, [0, D], [330, -40])} y={-G + 132} t={t} P={P} /></g>
    </>
  ),
  aussen: (
    <>
      <Zypresse x={B / 2 - 34} y={36} h={430} farbe={P.gruen[0]} e={w(22)} t={t} />
      <Zypresse x={B / 2 - 116} y={40} h={300} farbe={P.gruen[1]} e={w(24)} t={t} />
      <Zypresse x={B / 2 + 26} y={42} h={250} farbe={P.gruen[1]} e={w(26)} t={t} />
      <Busch x={-B / 2 + 14} y={36} r={62} farbe={P.gruen[0]} e={w(23)} />
      <Busch x={-B / 2 + 118} y={40} r={38} farbe={P.gruen[1]} e={w(25)} />
    </>
  )
});

const bergdorf = ({ t, D, w, sicht, P, H, B, p }) => {
  const q = 0.12 + 0.7 * p, sx = -560 + 820 * q, sy = (-G - 70) + ((-H * 0.76) - (-G - 70)) * q;
  return {
    gestirn: <Gestirn x={-235 + 40 * p} y={-H * 0.9} r={54} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
      <>
        <Berg x={-370} b={600} h={H * 0.68 - G} farbe={P.bergFern} e={w(0, true)} />
        <Berg x={110} b={860} h={H - G} farbe={P.bergMitte} schnee={P.schnee} e={w(2, true)} />
        <Berg x={470} b={520} h={H * 0.64 - G} farbe={P.bergNah} schnee={P.schnee} e={w(4, true)} />
        <Wolke x={-140 + 60 * p} y={-H * 0.66} s={0.9} farbe={P.schnee} o={0.85 * sicht} />
        <Wolke x={340 - 50 * p} y={-H * 0.5} s={0.7} farbe={P.schnee} o={0.8 * sicht} />
        <g opacity={sicht}>
          <line x1="-560" y1={-G - 70} x2="260" y2={-H * 0.76} stroke={NACHT} strokeWidth="3" opacity="0.6" />
          <g transform={`translate(${sx} ${sy})`}><line y2="22" stroke={NACHT} strokeWidth="3" /><rect x="-24" y="22" width="48" height="38" rx="9" fill={ROT} /><rect x="-18" y="29" width="36" height="13" rx="3" fill={CREME} /></g>
        </g>
        <path d={`M-700 60 V${-G - 20} C-420 ${-G - 100} -180 ${-G + 10} 60 ${-G - 50} S480 ${-G - 110} 700 ${-G - 40} V60 Z`} fill={P.wieseA} transform={`translate(0 ${(1 - w(3, true)) * 320})`} />
        <Kirche x={-160} y={-G - 36} h={Math.min(250, H - G - 80)} wand={P.haus[0]} dach={P.dach[2]} fenster={P.fenster} e={w(8)} />
        <Haus x={-345} y={-G - 56} b={186} h={92} wand={P.holz} dach={P.dach[1]} form="chalet" fx={3} fy={1} fenster={P.fenster} e={w(6)} />
        <Haus x={360} y={-G - 82} b={170} h={86} wand={P.holz} dach={P.dach[1]} form="chalet" fx={3} fy={1} fenster={P.fenster} e={w(12)} />
        <Tanne x={-478} y={-G - 62} h={190} farbe={P.gruen[1]} e={w(9)} t={t} />
        <Tanne x={238} y={-G - 64} h={214} farbe={P.gruen[0]} e={w(13)} t={t} />
        <Tanne x={478} y={-G - 80} h={160} farbe={P.gruen[1]} e={w(14)} t={t} />
        <path d={`M-700 60 V${-G + 70} C-380 ${-G + 20} -100 ${-G + 110} 180 ${-G + 60} S560 ${-G + 30} 700 ${-G + 80} V60 Z`} fill={P.wieseB} transform={`translate(0 ${(1 - w(5, true)) * 260})`} />
        <path d={`M-30 60 C60 -40 -80 -90 70 ${-G + 76}`} stroke={P.schnee} strokeWidth="14" strokeLinecap="round" fill="none" opacity={0.75 * w(8, true)} />
        <Haus x={112} y={-G + 62} b={214} h={104} wand={P.holz} dach={P.dach[0]} form="chalet" fx={3} fy={1} fenster={P.fenster} e={w(10)} />
        <Tanne x={-30} y={-G + 84} h={176} farbe={P.gruen[0]} e={w(11)} t={t} />
        <Flagge x={262} y={-G + 62} h={130} t={t} e={w(16)} />
      </>
    ),
    aussen: (
      <>
        <Tanne x={-B / 2 + 22} y={42} h={420} farbe={P.gruen[1]} e={w(20)} t={t} />
        <Tanne x={-B / 2 + 124} y={44} h={280} farbe={P.gruen[0]} e={w(22)} t={t} />
        <Busch x={B / 2 - 26} y={36} r={58} farbe={P.gruen[0]} e={w(21)} />
        <Tanne x={B / 2 + 14} y={44} h={300} farbe={P.gruen[1]} e={w(24)} t={t} />
      </>
    )
  };
};

const bahnhof = ({ t, D, w, sicht, P, H, B, p }) => ({
  gestirn: <Gestirn x={-265 + 40 * p} y={-H * 0.9} r={52} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
    <>
      <Berg x={-300} b={700} h={H * 0.72 - G} farbe={P.bergFern} e={w(0, true)} />
      <Berg x={340} b={640} h={H * 0.9 - G} farbe={P.bergMitte} schnee={P.schnee} e={w(2, true)} />
      <Huegel farbe={P.gruenFern} e={w(3, true)} hoehe={70} />
      <g transform={`translate(-50 ${-G}) scale(1 ${sk(w(6))})`}>
        <rect x="-290" y="-150" width="580" height="150" fill={P.haus[0]} />
        <rect x="60" y="-150" width="230" height="150" fill={SCH} />
        <polygon points="-306,-150 -262,-196 262,-196 306,-150" fill={P.dach[0]} />
        {[0, 1, 2, 3, 4, 5].map((n) => (n === 2 || n === 3 ? null : <path key={n} d={`M${-264 + n * 90} -14 V-80 a26 26 0 0 1 52 0 V-14 Z`} fill={P.fenster} />))}
      </g>
      <g transform={`translate(-50 ${-G}) scale(1 ${sk(w(9))})`}>
        <rect x="-64" y="-290" width="128" height="290" fill={P.haus[3]} />
        <rect x="14" y="-290" width="50" height="290" fill={SCH} />
        <polygon points="-76,-290 0,-362 76,-290" fill={P.dach[2]} />
        <circle cx="0" cy="-214" r="40" fill={CREME} stroke={NACHT} strokeWidth="6" />
        <line x1="0" y1="-214" x2="0" y2="-244" stroke={NACHT} strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 4} 0 -214)`} />
        <line x1="0" y1="-214" x2="18" y2="-214" stroke={NACHT} strokeWidth="5" strokeLinecap="round" transform={`rotate(${t / 3} 0 -214)`} />
        <path d="M-32 0 V-76 a32 32 0 0 1 64 0 V0 Z" fill={P.kai} />
      </g>
      <Flagge x={-50} y={-G - 362} h={56} t={t} e={w(14)} />
      {[-380, 270].map((x, n) => (
        <g key={x} transform={`translate(${x} ${-G}) scale(1 ${sk(w(12 + n * 2))})`}><rect x="-3" y="-136" width="6" height="136" fill={NACHT} /><circle cx="0" cy="-144" r="15" fill="#F6C56B" /></g>
      ))}
      <rect x="-700" y={-G} width="1400" height="30" fill={P.kai} />
      <rect x="-700" y={-G + 5} width="1400" height="5" fill={CREME} opacity="0.6" />
      <rect x="-700" y={-G + 30} width="1400" height={G + 60} fill={P.strasse} />
      {Array.from({ length: 24 }, (_, n) => <rect key={n} x={-690 + n * 60} y={-G + 152} width="26" height="16" fill={NACHT} opacity="0.35" />)}
      <rect x="-700" y={-G + 148} width="1400" height="7" fill={P.glanz} opacity="0.8" />
      <g opacity={sicht}><Zug x={interpolate(t, [0, Math.min(D * 0.6, 80)], [860, -70], { ...CL, easing: Easing.out(Easing.cubic) })} y={-G + 150} /></g>
    </>
  ),
  aussen: (
    <>
      <Busch x={-B / 2 + 16} y={36} r={58} farbe={P.gruen[0]} e={w(21)} />
      <Busch x={-B / 2 + 112} y={40} r={36} farbe={P.gruen[1]} e={w(23)} />
      <Kugelbaum x={B / 2 - 12} y={40} h={300} farbe={P.gruen[0]} e={w(22)} t={t} />
      <Busch x={B / 2 - 124} y={40} r={40} farbe={P.gruen[1]} e={w(24)} />
    </>
  )
});

const praxis = ({ t, D, w, sicht, P, H, B, p }) => ({
  gestirn: <Gestirn x={235 - 30 * p} y={-H * 0.9} r={54} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
    <>
      <Berg x={-390} b={560} h={H * 0.66 - G} farbe={P.bergFern} e={w(0, true)} />
      <Berg x={390} b={620} h={H * 0.84 - G} farbe={P.bergMitte} schnee={P.schnee} e={w(2, true)} />
      <Huegel farbe={P.gruenFern} e={w(3, true)} />
      <Kugelbaum x={-410} y={-G} h={210} farbe={P.gruen[1]} e={w(7)} t={t} />
      <Haus x={-250} b={190} h={150} wand={P.haus[2]} dach={P.dach[2]} form="flach" fx={3} fy={2} fenster={P.fenster} e={w(6)} />
      <g transform={`translate(20 ${-G}) scale(1 ${sk(w(9))})`}>
        <rect x="-170" y="-250" width="340" height="250" fill={P.haus[0]} />
        <rect x="50" y="-250" width="120" height="250" fill={SCH} />
        <rect x="-178" y="-264" width="356" height="16" fill={P.dach[2]} />
        {[0, 1].map((j) => [0, 1, 2, 3].map((n) => <rect key={`${j}${n}`} x={-146 + n * 76} y={-226 + j * 62} width="44" height="40" rx="4" fill={P.fenster} />))}
        <rect x="-52" y="-88" width="104" height="88" fill="#CFE3EC" /><rect x="-3" y="-88" width="6" height="88" fill={P.dach[2]} />
        <polygon points="-70,-88 70,-88 58,-112 -58,-112" fill={ORANGE} />
        <rect x="-46" y="-356" width="92" height="92" rx="20" fill={PETROL} />
        <rect x="-9" y="-340" width="18" height="60" fill={CREME} /><rect x="-30" y="-319" width="60" height="18" fill={CREME} />
      </g>
      <Kugelbaum x={272} y={-G} h={240} farbe={P.gruen[0]} e={w(12)} t={t} />
      <Kugelbaum x={404} y={-G} h={180} farbe={P.gruen[1]} e={w(14)} t={t} />
      <g transform={`translate(216 ${-G}) scale(1 ${sk(w(15))})`}><rect x="-3" y="-130" width="6" height="130" fill={NACHT} /><circle cx="0" cy="-138" r="14" fill="#F6C56B" /></g>
      <Strasse P={P} t={t} />
      <g opacity={sicht}><Transporter x={interpolate(t, [0, D], [-640, 280])} y={-G + 112} farbe="#FFF8EE" kreuz /></g>
    </>
  ),
  aussen: (
    <>
      <Kugelbaum x={B / 2 - 10} y={40} h={330} farbe={P.gruen[0]} e={w(22)} t={t} />
      <Busch x={-B / 2 + 14} y={36} r={62} farbe={P.gruen[0]} e={w(21)} />
      <Busch x={-B / 2 + 120} y={40} r={38} farbe={P.gruen[1]} e={w(23)} />
    </>
  )
});

const quartier = ({ t, D, w, sicht, P, H, B, p }) => {
  const f = Math.min(1, Math.max(0, (t - 8) / Math.max(1, D - 8)));
  return {
    gestirn: <Gestirn x={-245 + 40 * p} y={-H * 0.9} r={52} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
      <>
        <Berg x={290} b={760} h={H * 0.92 - G} farbe={P.bergFern} schnee={P.schnee} e={w(0, true)} />
        <Berg x={-390} b={520} h={H * 0.66 - G} farbe={P.bergMitte} e={w(2, true)} />
        <Huegel farbe={P.gruenFern} e={w(3, true)} />
        <Tanne x={404} y={-G} h={270} farbe={P.gruen[1]} e={w(13)} t={t} />
        <Haus x={-300} b={200} h={170} wand={P.haus[0]} dach={P.dach[0]} fx={3} fy={2} fenster={P.fenster} tuer={P.dach[2]} e={w(6)} />
        <Haus x={-40} b={220} h={232} wand={P.haus[2]} dach={P.dach[1]} form="walm" fx={3} fy={3} fenster={P.fenster} tuer={P.dach[0]} e={w(9)} />
        <Haus x={236} b={200} h={160} wand={P.haus[3]} dach={P.dach[0]} fx={3} fy={2} fenster={P.fenster} tuer={P.dach[2]} e={w(12)} />
        <Kugelbaum x={-172} y={-G} h={196} farbe={P.gruen[0]} e={w(10)} t={t} />
        {[[-470, 120], [96, 60], [350, 110]].map(([x, l], n) => <rect key={n} x={x} y={-G - 34 * w(11 + n)} width={l} height={36} rx="16" fill={P.gruen[1]} />)}
        {[-196, 82, 346].map((x, n) => (
          <g key={x} transform={`translate(${x} ${-G}) scale(${sk(w(15 + n * 2))})`}><rect x="-3" y="-58" width="6" height="58" fill={NACHT} /><rect x="-20" y="-86" width="40" height="30" rx="6" fill="#F2B45C" /><rect x="-12" y="-76" width="24" height="4" fill={NACHT} opacity="0.6" /></g>
        ))}
        <Strasse P={P} t={t} />
        <g opacity={sicht}>
          <Transporter x={interpolate(t, [0, D], [620, -260])} y={-G + 112} farbe="#F2B45C" links />
          <g transform={`translate(${-196 + 330 * f} ${-G - 120 - Math.sin(f * Math.PI) * 200}) rotate(${Math.sin(t / 10) * 12})`}>
            <rect x="-36" y="-24" width="72" height="48" rx="5" fill="#FFF8EE" /><path d="M-36 -22 L0 6 L36 -22" stroke={PETROL} strokeWidth="4" fill="none" />
          </g>
        </g>
      </>
    ),
    aussen: (
      <>
        <Busch x={-B / 2 + 16} y={36} r={60} farbe={P.gruen[0]} e={w(21)} />
        <Busch x={-B / 2 + 120} y={40} r={36} farbe={P.gruen[1]} e={w(23)} />
        <Kugelbaum x={B / 2 - 8} y={40} h={320} farbe={P.gruen[0]} e={w(22)} t={t} />
        <Busch x={B / 2 - 124} y={40} r={40} farbe={P.gruen[1]} e={w(24)} />
      </>
    )
  };
};

const gipfel = ({ t, D, w, sicht, P, H, B, p }) => ({
  gestirn: <Gestirn x={-60} y={-H * (0.5 + 0.38 * interpolate(p, [0, 1], [0, 1], { easing: Easing.out(Easing.cubic) }))} r={112} farbe={P.gestirn} e={w(0, true)} />,
    innen: (
    <>
      <Berg x={-410} b={700} h={H * 0.72 - G} farbe={P.bergFern} e={w(0, true)} />
      <Berg x={430} b={680} h={H * 0.76 - G} farbe={P.bergFern} schnee={P.schnee} e={w(1, true)} />
      <Berg x={80} b={820} h={H * 0.98 - G} farbe={P.bergMitte} schnee={P.schnee} e={w(3, true)} />
      {[[-430, 1.5], [-150, 1.3], [160, 1.55], [440, 1.3]].map(([x, s], n) => <Wolke key={n} x={x + Math.sin(t / 40 + n) * 22} y={-G - 16} s={s} farbe={P.schnee} o={0.94 * sicht} />)}
      <g transform={`translate(0 ${(1 - w(5, true)) * 330})`}>
        <path d={`M-700 60 V${-G + 30} C-420 ${-G - 50} -220 ${-G - 20} -20 ${-G + 50} S420 ${-G} 700 ${-G + 90} V60 Z`} fill={P.bergNah} />
        <path d={`M-560 ${-G + 2} C-400 ${-G - 40} -230 ${-G - 12} -40 ${-G + 52}`} stroke={CREME} strokeWidth="6" strokeDasharray="4 16" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>
      <g transform={`translate(176 ${-G + 34}) scale(${sk(w(12))})`}>
        <rect x="-4" y="-150" width="8" height="150" fill={NACHT} />
        <polygon points="4,-146 78,-146 96,-130 78,-114 4,-114" fill="#F2B45C" /><polygon points="-4,-104 -70,-104 -86,-90 -70,-76 -4,-76" fill="#F2B45C" />
      </g>
      <g transform={`translate(-250 ${-G - 26}) scale(${sk(w(14))})`}>
        <path d="M-7 -40 L-12 0 M7 -40 L13 0" stroke={P.figur} strokeWidth="10" strokeLinecap="round" />
        <rect x="-15" y="-88" width="30" height="52" rx="8" fill={P.figur} />
        <rect x="-33" y="-84" width="20" height="38" rx="6" fill={ORANGE} />
        <circle cx="0" cy="-104" r="14" fill={P.figur} />
        <path d="M24 -70 L34 0" stroke={P.figur} strokeWidth="5" strokeLinecap="round" />
      </g>
    </>
  ),
  aussen: (
    <>
      <Tanne x={-B / 2 + 18} y={44} h={380} farbe={P.gruen[1]} e={w(20)} t={t} />
      <Tanne x={-B / 2 + 112} y={46} h={250} farbe={P.gruen[0]} e={w(22)} t={t} />
      <Busch x={B / 2 - 22} y={36} r={56} farbe={P.gruen[0]} e={w(21)} />
    </>
  )
});

const ORTE = { seestadt, bergdorf, bahnhof, praxis, quartier, gipfel };

/* ---- Szene, Titel, Bildtext ----------------------------------------- */
const Szene = ({ teil, r, erste, letzte, ebene }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = teil.bis - teil.von;
  const raus = letzte ? 0 : interpolate(t, [D - 13, D - 3], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  const ab = erste ? -12 : 3;
  const w = (verz = 0, weich = false) => Math.max(0, spring({ frame: t - ab - verz, fps, config: weich ? { damping: 200 } : { damping: 11, stiffness: 150, mass: 0.7 } }) * (1 - raus));
  const sicht = interpolate(t, [erste ? -1 : 2, erste ? 0 : 12], [0, 1], CL) * (1 - raus);
  const unten = r.y + r.h;
  const kontext = { t, D, w, sicht, P: PALETTEN[teil.palette], H: (unten - TITEL_UNTEN) / S, B: r.w / S, p: Math.min(1, t / D) };
  const { gestirn, innen, aussen } = (ORTE[teil.ort] || seestadt)(kontext);
  /* Sonne und Mond liegen HINTER dem Titel, alles andere davor. */
  if (ebene === "gestirn") return <g clipPath="url(#plakat-karte)"><g transform={`translate(${B0 / 2} ${unten}) scale(${S})`}>{gestirn}</g></g>;
  return (
    <>
      <g clipPath="url(#plakat-karte)"><g transform={`translate(${B0 / 2} ${unten}) scale(${S})`}>{innen}</g></g>
      <g transform={`translate(${B0 / 2} ${unten}) scale(${S})`}>{aussen}</g>
    </>
  );
};

/* Breite eines Worts in der Konturschrift, in Geviert (geschaetzt). */
const WEITE = { I: 0.25, "1": 0.36, " ": 0.2, "'": 0.16, ".": 0.19, "?": 0.44, M: 0.6, W: 0.64, "-": 0.3 };
const breite = (text) => [...text].reduce((s, z) => s + (WEITE[z] ?? 0.47), 0);

const Titel = ({ teil, erste, letzte }) => {
  const t = useCurrentFrame();
  const P = PALETTEN[teil.palette];
  const D = teil.bis - teil.von;
  const rein = interpolate(t, [erste ? -6 : 4, erste ? 20 : 32], [0, 1], { ...CL, easing: Easing.inOut(Easing.quad) });
  const raus = letzte ? 0 : interpolate(t, [D - 11, D - 3], [0, 1], CL);
  let text = teil.gross, gefuellt = false;
  if (teil.zahl) {
    const ziffern = Number(String(teil.zahl.wert).replace(/\D/g, "")) || 0;
    const roll = interpolate(t, [erste ? 0 : 8, erste ? 24 : 36], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
    text = `CHF ${tausender(Math.round(ziffern * roll))}`;
    gefuellt = true;
  }
  const ziel = teil.zahl ? `CHF ${tausender(Number(String(teil.zahl.wert).replace(/\D/g, "")) || 0)}` : text;
  const groesse = Math.min(250, 860 / breite(ziel));
  const weit = breite(ziel) * groesse, L = groesse * 6;
  const umlaut = /[ÄÖÜ]/.test(ziel) ? groesse * 0.15 : 0;   // Punkte ueber den Versalien
  return (
    <g opacity={1 - raus}>
      <text x={B0 / 2 - weit / 2 + 6} y={TITEL_Y - groesse * 0.9 - 24 - umlaut} fontFamily={SERIF} fontStyle="italic" fontWeight="600" fontSize="56" fill={P.titel} opacity={interpolate(t, [erste ? -1 : 2, erste ? 0 : 12], [0, 1], CL)}>{teil.klein}</text>
      <text x={B0 / 2} y={TITEL_Y} textAnchor="middle" fontFamily={KONTUR} fontSize={groesse} fill={gefuellt ? P.zahl : "none"} stroke={gefuellt ? "none" : P.titel} strokeWidth="5" strokeLinejoin="round" strokeDasharray={gefuellt ? undefined : L} strokeDashoffset={gefuellt ? undefined : L * (1 - rein)} opacity={gefuellt ? rein : 1} textLength={gefuellt ? undefined : weit} lengthAdjust="spacingAndGlyphs">{text}</text>
    </g>
  );
};

const Bildtext = ({ teil, r, erste }) => {
  const t = useCurrentFrame();
  const P = PALETTEN[teil.palette];
  const D = teil.bis - teil.von;
  const block = teil.bloecke.filter((b) => t >= b.von).pop() || teil.bloecke[0];
  if (!block) return null;
  const lokal = t - block.von;
  const da = (erste && block === teil.bloecke[0] ? 1 : interpolate(lokal, [block === teil.bloecke[0] ? 4 : 0, block === teil.bloecke[0] ? 11 : 7], [0, 1], CL)) * (1 - interpolate(t, [D - 7, D - 2], [0, 1], CL));
  const laenge = Math.max(...teil.bloecke.map((b) => b.t.replace(/\*\*/g, "").length));
  const groesse = laenge <= 44 ? 66 : laenge <= 70 ? 58 : laenge <= 92 ? 52 : 47;
  const marke = P.betont.bg
    ? { background: P.betont.bg, color: P.betont.farbe, padding: "0 0.14em", borderRadius: 8, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }
    : { color: P.betont.farbe };
  return (
    <div style={{ position: "absolute", left: ZONE.seite - 10, right: ZONE.seite - 10, top: r.y + r.h + 50, textAlign: "center", opacity: da, transform: `translateY(${(1 - da) * 18}px)` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: groesse, lineHeight: 1.16, letterSpacing: "-0.01em", color: P.text, textWrap: "balance" }}>
        {block.t.replace(/CHF /g, "CHF\u00a0").split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((teilchen, i) => (teilchen.startsWith("**") ? <span key={i} style={marke}>{teilchen.slice(2, -2)}</span> : <span key={i}>{teilchen}</span>))}
      </div>
      {teil.zahl && teil.zahl.quelle ? <div style={{ fontFamily: SCHRIFT, fontSize: 25, lineHeight: 1.3, color: P.text, opacity: 0.8, marginTop: 18 }}>{teil.zahl.quelle}</div> : null}
    </div>
  );
};

/* Abbinder: Wortmarke, Zusage, Hinweis auf den Link. */
const Schluss = ({ teil, r }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = PALETTEN[teil.palette];
  const e = (verz) => spring({ frame: t - verz, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: r.y + r.h + 44, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: e(8), transform: `translateY(${(1 - e(8)) * 20}px)` }}>
        <svg width="58" height="58" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill={PETROL} /><path d="M41 20h18v21h21v18H59v21H41V59H20V41h21z" fill={CREME} /></svg>
        <div style={{ fontFamily: SCHRIFT, fontSize: 58, color: P.text, letterSpacing: "-0.01em" }}>Swiss<span style={{ fontWeight: 700 }}>Premia</span></div>
      </div>
      <div style={{ fontFamily: SCHRIFT, fontWeight: 500, fontSize: 31, color: P.text, marginTop: 16, opacity: e(11) }}>Offizielle Prämien 2027 · kostenlos · ohne Anmeldung</div>
      <div style={{ marginTop: 26, padding: "22px 56px", borderRadius: 999, background: NACHT, color: CREME, fontFamily: SCHRIFT, fontWeight: 600, fontSize: 44, opacity: e(15), transform: `scale(${0.9 + 0.1 * e(15)})` }}>Link im Profil</div>
      <div style={{ marginTop: 20, fontFamily: SCHRIFT, fontSize: 23, color: P.text, opacity: 0.75 * e(18) }}>Stimme KI-generiert · Beispielrechnungen, keine Beratung</div>
    </div>
  );
};

const Markenzeile = ({ dunkel, deck }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 262, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, opacity: deck }}>
    <svg width="38" height="38" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill={dunkel ? CREME : PETROL} /><path d="M41 20h18v21h21v18H59v21H41V59H20V41h21z" fill={dunkel ? PETROL : CREME} /></svg>
    <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 24, letterSpacing: "0.16em", color: dunkel ? CREME : NACHT }}>SWISSPREMIA.CH</div>
  </div>
);

const MUSIK_EIN = 8, MUSIK_AUS = 30;

export const Plakat = ({ reel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { teile, gesamt } = reel;
  /* Welches Format und welche Tageszeit gelten gerade – und wie weit ist der Wechsel? */
  let i = 0;
  for (let n = 1; n < teile.length; n++) if (frame >= teile[n].von - 6) i = n;
  const k = i === 0 ? 1 : spring({ frame: frame - (teile[i].von - 6), fps, config: { damping: 200 }, durationInFrames: 20 });
  const vor = teile[Math.max(0, i - 1)], jetzt = teile[i];
  const a = FORMATE[vor.format], b = FORMATE[jetzt.format];
  const mix = (x, y) => x + (y - x) * k;
  const r = { w: mix(a.w, b.w), h: mix(a.h, b.h), y: mix(a.y, b.y) };
  r.x = B0 / 2 - r.w / 2;
  const Pa = PALETTEN[vor.palette], Pb = PALETTEN[jetzt.palette];
  return (
    <AbsoluteFill style={{ backgroundColor: Pa.bg[0] }}>
      <AbsoluteFill style={{ background: verlauf(Pa.bg) }} />
      <AbsoluteFill style={{ background: verlauf(Pb.bg), opacity: k }} />
      <svg width={B0} height={H0} viewBox={`0 0 ${B0} ${H0}`} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <defs>
          {Object.entries(PALETTEN).map(([name, P]) => (
            <linearGradient key={name} id={`plakat-himmel-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.himmel[0]} /><stop offset="1" stopColor={P.himmel[1]} /></linearGradient>
          ))}
          <clipPath id="plakat-karte"><rect x={r.x} y="-400" width={r.w} height={r.y + r.h + 400} /></clipPath>
        </defs>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#plakat-himmel-${vor.palette})`} />
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#plakat-himmel-${jetzt.palette})`} opacity={k} />
        {teile.map((teil, n) => (
          <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von} layout="none" name={`Gestirn ${n + 1}`}>
            <Szene teil={teil} r={r} erste={n === 0} letzte={n === teile.length - 1} ebene="gestirn" />
          </Sequence>
        ))}
        {teile.map((teil, n) => (
          <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von} layout="none" name={`Titel ${n + 1}`}>
            <Titel teil={teil} erste={n === 0} letzte={n === teile.length - 1} />
          </Sequence>
        ))}
        {teile.map((teil, n) => (
          <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von} layout="none" name={`Szene ${n + 1} ${teil.ort}`}>
            <Szene teil={teil} r={r} erste={n === 0} letzte={n === teile.length - 1} />
          </Sequence>
        ))}
      </svg>
      <Markenzeile dunkel={Pa.dunkel} deck={1 - k} />
      <Markenzeile dunkel={Pb.dunkel} deck={k} />
      {teile.map((teil, n) => (
        <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von} layout="none">
          {teil.abbinder ? <Schluss teil={teil} r={r} /> : <Bildtext teil={teil} r={r} erste={n === 0} />}
        </Sequence>
      ))}
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.55, pointerEvents: "none" }}>
        <Img src={staticFile("plakat/korn.png")} style={{ width: B0, height: H0, imageRendering: "pixelated" }} />
      </AbsoluteFill>
      {reel.ton ? <Audio src={staticFile(reel.ton)} /> : null}
      {reel.musik && reel.musik.datei ? (
        <Audio
          src={staticFile(reel.musik.datei)} loop
          volume={(f) => (reel.musik.lautstaerke ?? 0.13)
            * interpolate(f, [0, MUSIK_EIN], [0, 1], CL)
            * interpolate(f, [gesamt - MUSIK_AUS, gesamt], [1, 0], CL)}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/* Platzhalter fuer das Studio, wenn keine Eingabe da ist. */
export const PLAKAT_BEISPIEL = {
  id: "beispiel", gesamt: 240, ton: null, musik: null,
  teile: [
    { von: 0, bis: 120, ort: "seestadt", palette: "daemmerung", format: "quadrat", klein: "in", gross: "ZÜRICH", bloecke: [{ von: 0, bis: 120, t: "So viel sparen Sie mit dem **günstigsten Angebot**." }] },
    { von: 120, bis: 240, ort: "gipfel", palette: "morgen", format: "quer", klein: "alle Kassen in", gross: "1 MINUTE", abbinder: true, bloecke: [] }
  ]
};
