import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing, random } from "remotion";
import { MARKE } from "./reels.js";
import { SCHRIFT } from "./Marke.jsx";
import { Figur, POSEN, usePose, gehen, haende } from "./Figur.jsx";
import { useSzenenFrames } from "./Bausteine.jsx";

/* =========================================================================
   Spielszenen: eine Figur (oder mehrere) mit Requisiten auf einer Buehne
   von 1080 x 760, Boden bei y = 700. Jede Aktion ist eine kleine
   Choreografie mit einem Haken am Anfang und einer Wendung; die Zeiten
   haengen an der Szenenlaenge (Stimme), damit lange Szenen weiterleben.

   Verwendung in einer Titelszene:
     { art: "titel", text: [...], figur: { aktion: "briefkasten", wer: "lea" } }
   ========================================================================= */

const BODEN = 700;
const schrift = { fontFamily: SCHRIFT };

/* -------------------------------------------------------- kleine Teile */

const usePop = (ab, staerke = 1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - ab, fps, config: { damping: 9, stiffness: 170 * staerke, mass: 0.7 } });
};

/* Buehnenscheibe hinter der Figur: auf dunklem Grund hell, auf hellem
   Grund zart – die Figur steht nie auf ihrer eigenen Farbe. */
const Scheibe = ({ farben }) => {
  const dunkel = farben.fläche !== MARKE.creme;
  const frame = useCurrentFrame();
  const auf = interpolate(frame, [0, 14], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  return (
    <g transform={`translate(540 440) scale(${auf})`}>
      <circle r="335" fill={dunkel ? MARKE.creme : MARKE.petrol} opacity={dunkel ? 0.95 : 0.1} />
      <circle r="335" fill="none" stroke={dunkel ? MARKE.gold : MARKE.petrol} strokeWidth="4" strokeDasharray="6 18" opacity=".5"
        transform={`rotate(${frame * 0.4})`} />
    </g>
  );
};

export const Stern = ({ x, y, ab, groesse = 30, farbe = MARKE.gold }) => {
  const t = usePop(ab);
  const frame = useCurrentFrame();
  if (frame < ab) return null;
  const s = groesse * t;
  return <path transform={`translate(${x} ${y}) rotate(${(frame - ab) * 3})`} d={`M0 ${-s} Q${s * 0.15} ${-s * 0.15} ${s} 0 Q${s * 0.15} ${s * 0.15} 0 ${s} Q${-s * 0.15} ${s * 0.15} ${-s} 0 Q${-s * 0.15} ${-s * 0.15} 0 ${-s} Z`} fill={farbe} />;
};

/* Strahlenkranz (Sunburst) hinter einem Moment. */
const Strahlen = ({ x, y, ab, r = 220, farbe = MARKE.gold }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [ab, ab + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  if (t <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${frame * 0.5}) scale(${t})`} opacity=".35">
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M0 0 L${Math.sin((i / 16) * Math.PI * 2 - 0.08) * r} ${Math.cos((i / 16) * Math.PI * 2 - 0.08) * r} L${Math.sin((i / 16) * Math.PI * 2 + 0.08) * r} ${Math.cos((i / 16) * Math.PI * 2 + 0.08) * r} Z`} fill={farbe} />
      ))}
    </g>
  );
};

/* Etikett (Pille) mit Pop-in. */
export const Etikett = ({ x, y, ab, text, farbe = MARKE.gold, schriftFarbe = MARKE.slate, groesse = 40 }) => {
  const t = usePop(ab);
  const frame = useCurrentFrame();
  if (frame < ab || !text) return null;
  const breite = Math.max(120, String(text).length * groesse * 0.56 + 56);
  return (
    <g transform={`translate(${x} ${y}) scale(${t}) rotate(${(1 - Math.min(1, t)) * -8})`}>
      <rect x={-breite / 2} y={-groesse * 0.95} width={breite} height={groesse * 1.9} rx={groesse * 0.95} fill={farbe} />
      <text x="0" y={groesse * 0.34} textAnchor="middle" fontSize={groesse} fontWeight="700" fill={schriftFarbe} style={schrift}>{text}</text>
    </g>
  );
};

const Fragezeichen = ({ x, y, ab }) => {
  const t = usePop(ab);
  const frame = useCurrentFrame();
  if (frame < ab) return null;
  return <text x={x} y={y - Math.sin((frame - ab) / 8) * 6} fontSize={84 * t} fontWeight="700" fill={MARKE.gold} textAnchor="middle" style={schrift} transform={`rotate(${Math.sin((frame - ab) / 10) * 8} ${x} ${y})`}>?</text>;
};

const Gluehbirne = ({ x, y, ab }) => {
  const t = usePop(ab);
  const frame = useCurrentFrame();
  if (frame < ab) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${t})`}>
      <Strahlen x={0} y={0} ab={ab} r={120} />
      <circle r="44" fill="#ffe08a" />
      <rect x="-18" y="38" width="36" height="26" rx="5" fill={MARKE.slate} />
    </g>
  );
};

const Haken = ({ x, y, ab, groesse = 70, farbe = "#2e9e6a" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [ab, ab + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = usePop(ab);
  if (frame < ab) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.min(1.15, pop)})`}>
      <circle r={groesse} fill={farbe} />
      <path d={`M${-groesse * 0.42} 0 L${-groesse * 0.1} ${groesse * 0.32} L${groesse * 0.45} ${-groesse * 0.3}`} fill="none" stroke="#fff" strokeWidth={groesse * 0.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="120" strokeDashoffset={120 * (1 - t)} />
    </g>
  );
};

/* Runde Lupe mit Fuehrungslinie (Call-out) – die Nahaufnahme. */
const Lupe = ({ x, y, r = 150, zu, ab, children }) => {
  const t = usePop(ab);
  const frame = useCurrentFrame();
  if (frame < ab) return null;
  return (
    <g>
      <path d={`M${zu.x} ${zu.y} L${x} ${y}`} stroke={MARKE.slate} strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" opacity={Math.min(1, t)} />
      <g transform={`translate(${x} ${y}) scale(${t})`}>
        <circle r={r + 8} fill={MARKE.gold} />
        <circle r={r} fill="#ffffff" />
        {children}
      </g>
    </g>
  );
};

/* --------------------------------------------------------- Aktionen */

const Winken = ({ f }) => {
  const frames = useSzenenFrames();
  const pose = usePose([[0, "stehen"], [5, "winken"], [12, "winken2"], [19, "winken"], [26, "winken2"], [33, "stehen"], [Math.round(frames * 0.55), "daumen"]]);
  return <><Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} /><Stern x={720} y={190} ab={8} /><Stern x={380} y={150} ab={14} groesse={22} /></>;
};

const Zeigen = ({ f }) => {
  const pose = usePose([[0, "stehen"], [8, "zeigenOben"]]);
  return <><Figur wer={f.wer || "lea"} x={520} y={BODEN} pose={pose} /><Stern x={640} y={70} ab={14} /><Stern x={700} y={130} ab={18} groesse={18} /></>;
};

const Denken = ({ f }) => {
  const frames = useSzenenFrames();
  const aha = f.einfall ? Math.round(frames * 0.55) : 99999;
  const pose = usePose([[0, "stehen"], [6, "denken"], [aha, "aha"]]);
  const frame = useCurrentFrame();
  return (
    <>
      <Figur wer={f.wer || "lea"} x={500} y={BODEN} pose={pose} />
      {frame < aha && <><Fragezeichen x={680} y={150} ab={14} /><Fragezeichen x={760} y={90} ab={22} /><Fragezeichen x={620} y={70} ab={30} /></>}
      <Gluehbirne x={700} y={110} ab={aha} />
    </>
  );
};

const Jubeln = ({ f }) => {
  const pose = usePose([[0, "stehen"], [6, (fr) => ({ ...POSEN.jubeln, heben: 10 + Math.abs(Math.sin(fr / 6)) * 22 })]]);
  return (
    <>
      <Strahlen x={540} y={330} ab={8} r={330} />
      <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} />
      {[[300, 160, 10], [790, 140, 14], [250, 380, 18], [840, 360, 22], [540, 40, 26]].map(([x, y, ab], i) => <Stern key={i} x={x} y={y} ab={ab} groesse={20 + (i % 3) * 8} />)}
    </>
  );
};

const Schulter = ({ f }) => {
  const pose = usePose([[0, "stehen"], [6, "schulter"], [34, "stehen"], [44, "schulter"]]);
  return <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} />;
};

/* Zwei Tueren: die Wahl. f.links / f.rechts (Beschriftung), f.linksKlein /
   f.rechtsKlein (Preis), f.wahl = "links" | "rechts". */
const Tuer = ({ x, titel, klein, an, ab }) => {
  const t = usePop(ab);
  const glanz = interpolate(useCurrentFrame(), [an, an + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g transform={`translate(${x} ${BODEN}) scale(${t})`}>
      {glanz > 0 && <rect x="-130" y="-470" width="260" height="480" rx="30" fill={MARKE.gold} opacity={0.35 * glanz} />}
      <path d="M-105 0 L-105 -330 Q-105 -430 0 -430 Q105 -430 105 -330 L105 0 Z" fill={glanz > 0.5 ? MARKE.gold : MARKE.petrol} />
      <path d="M-82 0 L-82 -320 Q-82 -404 0 -404 Q82 -404 82 -320 L82 0 Z" fill={glanz > 0.5 ? "#e6d9b4" : "#2f73a0"} />
      <circle cx="54" cy="-190" r="11" fill={MARKE.gold} />
      <text x="0" y="-300" textAnchor="middle" fontSize="62" fontWeight="700" fill={glanz > 0.5 ? MARKE.slate : "#ffffff"} style={schrift}>{titel}</text>
      {klein && <text x="0" y="-240" textAnchor="middle" fontSize="30" fontWeight="500" fill={glanz > 0.5 ? MARKE.slate : "rgba(255,255,255,.85)"} style={schrift}>{klein}</text>}
    </g>
  );
};
const Tueren = ({ f }) => {
  const frames = useSzenenFrames();
  const t1 = Math.round(frames * 0.32), t2 = Math.round(frames * 0.46), t3 = Math.round(frames * 0.6);
  const rechts = f.wahl !== "links";
  const pose = usePose([[0, "stehen"], [6, "denken"], [t1, { ...POSEN.denken, kopf: -9, blick: -1 }], [t2, { ...POSEN.denken, kopf: 9, blick: 1 }], [t3, rechts ? "zeigenRechts" : "zeigenLinks"]]);
  return (
    <>
      <Tuer x={240} titel={f.links} klein={f.linksKlein} an={rechts ? 99999 : t3} ab={0} />
      <Tuer x={840} titel={f.rechts} klein={f.rechtsKlein} an={rechts ? t3 : 99999} ab={4} />
      <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} skala={0.92} />
      <Fragezeichen x={540} y={70} ab={14} />
      <Stern x={rechts ? 900 : 180} y={200} ab={t3 + 4} />
    </>
  );
};

/* Rechnungen regnen: das Risiko einer hohen Franchise. f.betrag */
const Rechnungen = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose([[0, "stehen"], [4, "sorge"]]);
  const anzahl = Math.min(16, Math.max(0, Math.floor((frame - 8) / 7)));
  const blaetter = Array.from({ length: anzahl }, (_, i) => {
    const start = 8 + i * 7;
    const fall = interpolate(frame, [start, start + 16], [0, 1], { extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
    const links = i % 2 === 0;
    const zielX = links ? 230 + random("rx" + i) * 50 : 830 + random("rx" + i) * 50;
    const zielY = BODEN - 26 - Math.floor(i / 2) * 22;
    const y = interpolate(fall, [0, 1], [-160, zielY]);
    const dreh = (random("rd" + i) - 0.5) * 50 * (1 - fall) + (random("rz" + i) - 0.5) * 16;
    return (
      <g key={i} transform={`translate(${zielX} ${y}) rotate(${dreh})`}>
        <rect x="-70" y="-24" width="140" height="48" rx="5" fill="#ffffff" stroke={MARKE.slate} strokeWidth="3" />
        <text x="-56" y="10" fontSize="24" fontWeight="700" fill="#d9534f" style={schrift}>CHF</text>
        <rect x="6" y="-6" width="52" height="6" rx="3" fill="#c7cdd3" /><rect x="6" y="6" width="38" height="6" rx="3" fill="#c7cdd3" />
      </g>
    );
  });
  return (
    <>
      <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} inHand="thermometer" />
      {blaetter}
      <Etikett x={540} y={90} ab={36} text={f.betrag} farbe="#d9534f" schriftFarbe="#ffffff" />
    </>
  );
};

/* Am Laptop: Franchise oder Modell aendern – die Lupe zeigt den Bildschirm. */
const Laptop = ({ f }) => {
  const frames = useSzenenFrames();
  const frame = useCurrentFrame();
  const fertig = Math.round(frames * 0.5);
  const pose = usePose((fr) => ({ ...POSEN.tippen, armL: [-14 + Math.sin(fr / 2.2) * 5, 62], armR: [14 - Math.cos(fr / 2.4) * 5, -62], mund: fr > fertig ? "grinsen" : "neutral", augen: fr > fertig ? "froh" : "offen" }));
  return (
    <>
      <Figur wer={f.wer || "lea"} x={540} y={BODEN + 40} pose={pose} skala={0.95} />
      {/* Tisch und Laptop (Rueckseite zum Betrachter) */}
      <rect x="250" y="520" width="580" height="34" rx="10" fill="#b98a5a" />
      <rect x="290" y="554" width="26" height="150" fill="#9a7148" /><rect x="764" y="554" width="26" height="150" fill="#9a7148" />
      <path d="M440 520 L452 410 L628 410 L640 520 Z" fill="#c9ced3" />
      <path d="M534 455 l12 0 l0 -12 l10 0 l0 12 l12 0 l0 10 l-12 0 l0 12 l-10 0 l0 -12 l-12 0 Z" fill="#ffffff" opacity=".8" />
      <Lupe x={840} y={190} r={140} zu={{ x: 600, y: 440 }} ab={10}>
        {(f.bildschirm || ["Franchise", "2'500"]).map((z, i) => (
          <text key={i} x="0" y={-28 + i * 50} textAnchor="middle" fontSize={i === 0 ? 34 : 50} fontWeight={i === 0 ? 500 : 700} fill={i === 0 ? MARKE.slate : MARKE.petrol} style={schrift}>{z}</text>
        ))}
        {frame >= fertig && <Haken x={0} y={78} ab={fertig} groesse={36} />}
      </Lupe>
    </>
  );
};

/* Telefon (Telmed): zuerst anrufen. Schallwellen pulsieren. */
const Telefon = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose([[0, "stehen"], [6, { ...POSEN.telefon, mund: "reden" }]]);
  const h = haende(f.wer || "noah", pose);
  return (
    <>
      <Figur wer={f.wer || "noah"} x={500} y={BODEN} pose={pose} inHand="telefon" />
      {[0, 1, 2].map((i) => {
        const t = ((frame - 10 - i * 8) % 30) / 30;
        if (frame < 10 + i * 8) return null;
        const hx = 500 + h.handR.x * 0.97 + 34, hy = BODEN + h.handR.y * 0.97 - 40;
        return <path key={i} d={`M${hx + i * 4} ${hy - 30 - t * 30} q${24 + t * 40} ${30 + t * 20} 0 ${60 + t * 60}`} fill="none" stroke={MARKE.gold} strokeWidth="7" strokeLinecap="round" opacity={1 - t} transform={`translate(${t * 40} 0)`} />;
      })}
      {f.etikett && <Etikett x={800} y={150} ab={20} text={f.etikett} />}
    </>
  );
};

/* Zum Briefkasten: hingehen, einwerfen, Fahne hoch. */
const Briefkasten = ({ f }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const T = Math.max(28, Math.min(60, Math.round(frames * 0.42)));
  const x = interpolate(frame, [0, T], [150, 640], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const pose = usePose([[0, gehen(0.34)], [T, "einwerfen"], [T + 26, "daumen"]]);
  const brief = interpolate(frame, [T + 6, T + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const fahne = usePop(T + 16);
  return (
    <>
      {/* Briefkasten */}
      <g transform={`translate(880 ${BODEN})`}>
        <rect x="-14" y="-300" width="28" height="300" fill="#7d8790" />
        <rect x="-95" y="-470" width="190" height="190" rx="22" fill={MARKE.gold} />
        <rect x="-60" y="-430" width="120" height="18" rx="9" fill={MARKE.slate} />
        <g transform={`translate(95 -440) rotate(${-90 + 90 * Math.min(1.1, fahne)})`}><rect x="0" y="-8" width="16" height="80" fill="#d9534f" /><rect x="0" y="-8" width="56" height="34" fill="#d9534f" /></g>
      </g>
      <Figur wer={f.wer || "lea"} x={x} y={BODEN} pose={pose} inHand={frame < T + 6 ? "brief" : null} />
      {frame >= T + 6 && brief < 1 && (
        <g transform={`translate(${interpolate(brief, [0, 1], [x + 250, 880])} ${interpolate(brief, [0, 1], [BODEN - 450, BODEN - 421])}) scale(${1 - brief * 0.6}, ${1 - brief * 0.85})`}>
          <rect x="-50" y="-34" width="100" height="68" rx="6" fill="#ffffff" stroke={MARKE.slate} strokeWidth="3" />
        </g>
      )}
      <Stern x={960} y={170} ab={T + 18} /><Stern x={790} y={130} ab={T + 22} groesse={20} />
      {f.etikett && <Etikett x={880} y={110} ab={T + 20} text={f.etikett} />}
    </>
  );
};

/* Karton tragen: Umzug oder Stellenwechsel. f.links / f.rechts: Haeuser. */
const Haus = ({ x, titel, preis, ab }) => {
  const t = usePop(ab);
  return (
    <g transform={`translate(${x} ${BODEN}) scale(${t})`}>
      <rect x="-90" y="-230" width="180" height="230" fill={MARKE.petrol} />
      <path d="M-115 -225 L0 -330 L115 -225 Z" fill={MARKE.slate} />
      <rect x="-26" y="-110" width="52" height="110" fill={MARKE.gold} />
      <rect x="-70" y="-190" width="44" height="44" fill="#cfe3f0" /><rect x="26" y="-190" width="44" height="44" fill="#cfe3f0" />
      {titel && <text x="0" y="-350" textAnchor="middle" fontSize="38" fontWeight="600" fill={MARKE.slate} style={schrift}>{titel}</text>}
      {preis && <Etikett x={0} y={-420} ab={ab + 10} text={preis} groesse={32} />}
    </g>
  );
};
const Karton = ({ f }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const mitHaus = f.links || f.rechts;
  const x = interpolate(frame, [4, frames - 12], mitHaus ? [240, 840] : [180, 900], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pose = usePose((fr) => ({ ...gehen(0.3)(fr), armL: POSEN.tragen.armL, armR: POSEN.tragen.armR, kurzL: POSEN.tragen.kurzL, kurzR: POSEN.tragen.kurzR }));
  return (
    <>
      {mitHaus && <><Haus x={110} titel={f.links} preis={f.linksPreis} ab={0} /><Haus x={970} titel={f.rechts} preis={f.rechtsPreis} ab={Math.round(frames * 0.45)} /></>}
      <Figur wer={f.wer || "marco"} x={x} y={BODEN} pose={pose} inHand="karton" skala={mitHaus ? 0.82 : 0.95} />
    </>
  );
};

/* Treppe der Altersklassen: die Figur steigt und waechst, Preise poppen. */
const Treppe = ({ f }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const stufen = f.stufen || ["Kinder", "19–25", "ab 26"];
  const preise = f.preise || [];
  const zeiten = [10, Math.round(frames * 0.34), Math.round(frames * 0.58)];
  const orte = [{ x: 250, y: BODEN - 100 }, { x: 540, y: BODEN - 170 }, { x: 830, y: BODEN - 240 }];
  const groesse = [0.46, 0.56, 0.64];
  let stufe = -1;
  zeiten.forEach((z, i) => { if (frame >= z) stufe = i; });
  const von = stufe <= 0 ? { x: 90, y: BODEN } : orte[stufe - 1];
  const nach = stufe < 0 ? { x: 90, y: BODEN } : orte[stufe];
  const t = stufe < 0 ? 1 : interpolate(frame, [zeiten[stufe], zeiten[stufe] + 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const x = von.x + (nach.x - von.x) * t;
  const y = von.y + (nach.y - von.y) * t - Math.sin(t * Math.PI) * 90;
  const sk = stufe <= 0 ? groesse[0] : groesse[stufe - 1] + (groesse[stufe] - groesse[stufe - 1]) * t;
  const pose = usePose([[0, "stehen"], ...zeiten.flatMap((z, i) => [[z, "jubeln"], [z + 12, i === 2 ? "staunen" : "stehen"]])]);
  return (
    <>
      {orte.map((o, i) => (
        <g key={i}>
          <rect x={o.x - 140} y={o.y} width="280" height={BODEN - o.y + 4} fill={i === stufe ? MARKE.gold : i < 2 ? "#5d8fb0" : MARKE.petrol} opacity={i <= stufe ? 1 : 0.55} />
          <text x={o.x} y={o.y + 54} textAnchor="middle" fontSize="38" fontWeight="700" fill={i === stufe ? MARKE.slate : "#ffffff"} style={schrift}>{stufen[i]}</text>
          {preise[i] && <Etikett x={o.x} y={o.y - 34 - 600 * groesse[i]} ab={zeiten[i] + 12} text={preise[i]} groesse={30} />}
        </g>
      ))}
      <Figur wer={f.wer || "noah"} x={x} y={y} pose={pose} skala={sk} />
    </>
  );
};

/* Geburtstagstorte mit Zahl: der Sprung mit 19 oder 26. */
const Torte = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose([[0, "stehen"], [8, "staunen"], [40, "schulter"]]);
  const flackern = (i) => 1 + Math.sin(frame / 3 + i) * 0.15;
  return (
    <>
      <Figur wer={f.wer || "noah"} x={720} y={BODEN} pose={pose} />
      <g transform="translate(380 700)">
        <rect x="-150" y="-110" width="300" height="110" rx="14" fill="#f3c7cf" />
        <rect x="-150" y="-60" width="300" height="14" fill="#e59aa8" />
        <rect x="-115" y="-190" width="230" height="84" rx="12" fill="#ffffff" />
        <path d="M-115 -150 q19 18 38 0 q19 18 38 0 q19 18 38 0 q19 18 38 0 q19 18 38 0 q19 18 38 0" fill="none" stroke="#e59aa8" strokeWidth="8" />
        <text x="0" y="-205" textAnchor="middle" fontSize="110" fontWeight="800" fill={MARKE.gold} stroke={MARKE.slate} strokeWidth="3" style={schrift}>{f.zahl || "26"}</text>
        {[-70, 70].map((cx, i) => (
          <g key={i}><rect x={cx - 7} y="-300" width="14" height="60" rx="5" fill={MARKE.petrol} /><ellipse cx={cx} cy={-312} rx={9} ry={16 * flackern(i)} fill="#ffb300" /></g>
        ))}
      </g>
      <Etikett x={720} y={70} ab={22} text={f.etikett} farbe="#d9534f" schriftFarbe="#ffffff" />
    </>
  );
};

/* Sprechblase mit Mythos – und der Stempel, der ihn durchstreicht. */
const Sprechblase = ({ f }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  /* stempel: true = zur Haelfte der Szene, "frueh" = gleich zu Beginn
     (wenn die Stimme mit "Stimmt nicht" einsetzt). */
  const stempel = f.stempel === "frueh" ? 10 : f.stempel ? Math.round(frames * 0.5) : 99999;
  const pose = usePose([[0, "stehen"], [6, { ...POSEN.hueften, mund: "reden" }], [stempel, "staunen"]]);
  const blase = usePop(4);
  const st = usePop(stempel, 1.3);
  const zeilen = f.blase || [];
  return (
    <>
      <Figur wer={f.wer || "marco"} x={300} y={BODEN} pose={pose} />
      <g transform={`translate(700 230) scale(${blase})`}>
        <path d="M-300 -150 Q-300 -190 -260 -190 L260 -190 Q300 -190 300 -150 L300 110 Q300 150 260 150 L-150 150 L-250 230 L-210 150 L-260 150 Q-300 150 -300 110 Z" fill="#ffffff" stroke={MARKE.slate} strokeWidth="5" />
        {zeilen.map((z, i) => (
          <text key={i} x="0" y={-20 - (zeilen.length - 1) * 30 + i * 62} textAnchor="middle" fontSize="48" fontWeight="500" fill={MARKE.slate} style={schrift}>{z}</text>
        ))}
        {frame >= stempel && (
          <g transform={`scale(${st}) rotate(-12)`} opacity=".92">
            <circle r="150" fill="none" stroke="#d9534f" strokeWidth="16" />
            <path d="M-80 -80 L80 80 M80 -80 L-80 80" stroke="#d9534f" strokeWidth="24" strokeLinecap="round" />
          </g>
        )}
      </g>
    </>
  );
};

/* Familie: winken, Etikett ueber dem Kind (z. B. Rabatt). */
const Familie = ({ f }) => {
  const poseL = usePose([[0, "stehen"], [6, "winken"], [14, "winken2"], [22, "winken"], [30, "stehen"]]);
  const poseM = usePose([[0, "stehen"], [8, "wiegen"]]);
  const poseK = usePose([[0, "stehen"], [12, "jubeln"], [30, "winken"]]);
  return (
    <>
      <Figur wer="lea" x={300} y={BODEN} pose={poseL} skala={0.92} />
      <Figur wer="marco" x={760} y={BODEN} pose={poseM} inHand="baby" skala={0.92} />
      <Figur wer="mia" x={530} y={BODEN} pose={poseK} />
      <Etikett x={530} y={250} ab={24} text={f.etikett} />
      <Stern x={640} y={210} ab={28} groesse={20} />
    </>
  );
};

/* Aerztin: Notfall und Grundversorgung – Daumen hoch, Kreuz-Schild. */
const Arzt = ({ f }) => {
  const pose = usePose([[0, "stehen"], [6, "winken"], [16, "winken2"], [26, "daumen"]]);
  const schild = usePop(4);
  return (
    <>
      <g transform={`translate(270 250) scale(${schild}) rotate(${(1 - Math.min(1, schild)) * 30})`}>
        <rect x="-110" y="-110" width="220" height="220" rx="40" fill={MARKE.petrol} />
        <path d="M-26 -80 h52 v54 h54 v52 h-54 v54 h-52 v-54 h-54 v-52 h54 Z" fill="#ffffff" />
      </g>
      <Figur wer="keller" x={640} y={BODEN} pose={pose} />
      <Haken x={270} y={470} ab={30} groesse={46} />
    </>
  );
};

/* Baby im Arm: Herzen steigen auf. */
const Baby = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose([[0, "stehen"], [6, (fr) => ({ ...POSEN.wiegen, kopf: 10 + Math.sin(fr / 10) * 4 })]]);
  return (
    <>
      <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} inHand="baby" />
      {[0, 1, 2, 3].map((i) => {
        const ab = 14 + i * 14, t = ((frame - ab) % 56) / 56;
        if (frame < ab) return null;
        return <path key={i} transform={`translate(${620 + i * 40 + Math.sin(t * 6) * 14} ${300 - t * 260}) scale(${1.2 - t * 0.5})`} d="M0 10 C-26 -10 -16 -34 0 -20 C16 -34 26 -10 0 10 Z" fill="#d9826a" opacity={1 - t} />;
      })}
    </>
  );
};

/* Wandern: die Figur geht, die Landschaft zieht vorbei (Parallaxe). */
const Wandern = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose(gehen(0.28));
  const hinten = (frame * 1.4) % 1080, vorne = (frame * 3.2) % 1080;
  const huegel = (versatz, y, farbe, h) => (
    <g transform={`translate(${-versatz} 0)`}>
      {[0, 1080].map((d) => <path key={d} d={`M${d} ${y} Q${d + 180} ${y - h} ${d + 360} ${y} Q${d + 540} ${y - h * 1.3} ${d + 720} ${y} Q${d + 900} ${y - h * 0.8} ${d + 1080} ${y} L${d + 1080} 760 L${d} 760 Z`} fill={farbe} />)}
    </g>
  );
  return (
    <>
      <defs><clipPath id="wandernMaske"><circle cx="540" cy="440" r="335" /></clipPath></defs>
      <g clipPath="url(#wandernMaske)">
        {huegel(hinten, 560, "#a9c3b4", 140)}
        {huegel(vorne, 690, "#7fa58f", 90)}
        <path d={`M${300 - (frame * 2.2) % 900 + 600} 520 l40 -120 l40 120 Z`} fill="#4f7a64" />
      </g>
      <Figur wer={f.wer || "marco"} x={540} y={BODEN - 10} pose={pose} />
    </>
  );
};

/* Muenzglas: Muenzen fallen hinein, der Stand steigt. */
const Muenzen = ({ f }) => {
  const frame = useCurrentFrame();
  const pose = usePose([[0, "stehen"], [4, { ...POSEN.tragen, mund: "grinsen", augen: "froh" }]]);
  const h = haende(f.wer || "lea", pose);
  const glasX = 540 + (h.handL.x + h.handR.x) / 2, glasY = BODEN + (h.handL.y + h.handR.y) / 2 - 70;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const ab = 8 + i * 9;
        const t = interpolate(frame, [ab, ab + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
        if (frame < ab || t >= 1) return null;
        return <ellipse key={i} cx={glasX + (random("mx" + i) - 0.5) * 60} cy={interpolate(t, [0, 1], [-60, glasY])} rx="34" ry="12" fill={MARKE.gold} stroke="#a8935e" strokeWidth="3" />;
      })}
      <Figur wer={f.wer || "lea"} x={540} y={BODEN} pose={pose} inHand="glas" />
      <Etikett x={800} y={130} ab={50} text={f.betrag} />
    </>
  );
};

/* Kalenderblatt: der 30. November kippt auf den 1. Dezember – zu spaet.
   Die Figur erschrickt (Agitation im HPSCA-Rahmen). */
const Kalender = ({ f }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const kipp = Math.round(frames * 0.35);
  const pose = usePose([[0, "stehen"], [kipp + 4, "staunen"], [kipp + 22, "sorge"]]);
  const t = interpolate(frame, [kipp, kipp + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const blatt = (monat, tag, farbe, rot) => (
    <g>
      <rect x="-130" y="-150" width="260" height="300" rx="18" fill="#ffffff" stroke={MARKE.slate} strokeWidth="5" />
      <rect x="-130" y="-150" width="260" height="78" rx="18" fill={farbe} />
      <rect x="-130" y="-96" width="260" height="24" fill={farbe} />
      <text x="0" y="-96" textAnchor="middle" fontSize="44" fontWeight="700" fill="#ffffff" style={schrift}>{monat}</text>
      <text x="0" y="90" textAnchor="middle" fontSize="150" fontWeight="800" fill={rot ? "#d9534f" : MARKE.slate} style={schrift}>{tag}</text>
    </g>
  );
  return (
    <>
      <g transform="translate(780 330)">
        {[-70, 70].map((x) => <rect key={x} x={x - 8} y="-176" width="16" height="44" rx="8" fill={MARKE.slate} />)}
        <g transform={`scale(1 ${t < 0.5 ? 1 - t * 2 : 0.001})`}>{blatt("NOV", "30", MARKE.petrol, false)}</g>
        <g transform={`scale(1 ${t < 0.5 ? 0.001 : (t - 0.5) * 2})`}>{blatt("DEZ", "1", "#d9534f", true)}</g>
      </g>
      <Figur wer={f.wer || "marco"} x={380} y={BODEN} pose={pose} />
      <Etikett x={780} y={570} ab={kipp + 12} text="zu spät" farbe="#d9534f" schriftFarbe="#ffffff" />
      {frame > kipp + 6 && <><Stern x={640} y={120} ab={kipp + 6} farbe="#d9534f" groesse={22} /><Stern x={930} y={150} ab={kipp + 9} farbe="#d9534f" groesse={18} /></>}
    </>
  );
};

export const AKTIONEN = {
  kalender: Kalender,
  winken: Winken, zeigen: Zeigen, denken: Denken, jubeln: Jubeln, schulter: Schulter, tueren: Tueren, rechnungen: Rechnungen,
  laptop: Laptop, telefon: Telefon, briefkasten: Briefkasten, karton: Karton, treppe: Treppe, torte: Torte, sprechblase: Sprechblase,
  familie: Familie, arzt: Arzt, baby: Baby, wandern: Wandern, muenzen: Muenzen
};

/* Buehne fuer eine Titelszene mit Figur – volle Bildbreite, leicht
   vergroessert um den Boden, damit die Figur gut ein Drittel der
   Bildhoehe einnimmt. */
export const Spielszene = ({ figur, farben }) => {
  const Aktion = AKTIONEN[figur.aktion] || Winken;
  return (
    <svg viewBox="0 0 1080 760" width="1080" height="760" style={{ overflow: "visible", display: "block" }}>
      <g transform="translate(540 700) scale(1.1) translate(-540 -700)">
        <Scheibe farben={farben} />
        <Aktion f={figur} farben={farben} />
      </g>
    </svg>
  );
};
