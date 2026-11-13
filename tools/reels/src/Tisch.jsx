/* =========================================================================
   Serie «Küchentisch» – Komposition "tisch".

   Zwei Bildwelten nach Vorlagen des Nutzers (13.11.2026), alles im Code
   gezeichnet (SVG), nichts aus den Vorlagen uebernommen:

   - Kammerspiel: eine Trickfigur mit grossem Kopf und grossen Augen sitzt
     am Tisch voller Papiere, die Kamera faehrt langsam auf das Gesicht.
     Plastisch durch Verlaeufe, weiche Schatten und ein Lichtbad
     (Lampe nachts, kaltes Regenlicht, warmer Tag).
   - Erklaerfilm: Laptop mit Vergleich, dunkle Platine mit leuchtenden
     Leiterbahnen (Zaehler, Maschine, Abbinder), helle Schritt-Karten.

   Eingabe (tisch/bauen.js): reel.teile[] mit von/bis (Frames), art und den
   Angaben aus tisch/skripte.js, dazu bloecke[] fuer die Untertitel.
   Szenenarten: raum, zaehler, laptop, maschine, schritte, schluss.
   ========================================================================= */
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { loadFont as ladeFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as ladeAnton } from "@remotion/google-fonts/Anton";
import { SCHRIFT, ZONE } from "./Marke.jsx";

const { fontFamily: SERIF } = ladeFraunces("normal", { weights: ["600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: ZAHL } = ladeAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

const B0 = 1080, H0 = 1920;
const BLENDE = 8;          // Frames Ueberblendung zwischen zwei Szenen
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const NACHT = "#0E1B26", TINTE = "#14212C", CREME = "#F4EEE4", PETROL = "#005786", ORANGE = "#EC6A1E", GLUT = "#F5A46A", BAHN = "#2F6E94";
const HELL = { laptop: true, schritte: true };   // Szenen mit hellem Grund: dunkle Schrift

/* Fester Zufall (immer dieselbe Unordnung). */
const zufall = (saat) => { let a = saat >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
const weich = (t, von, bis) => interpolate(t, [von, bis], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
const feder = (t, fps, verz = 0, dauer = 20, daempfung = 200) => spring({ frame: t - verz, fps, config: { damping: daempfung }, durationInFrames: dauer });

/* ---- Papier ------------------------------------------------------------- */
const Blatt = ({ w = 200, h = 270, art = 0, ton = "#FBF7EE" }) => (
  <g>
    <rect x={-w / 2 + 7} y={-h / 2 + 9} width={w} height={h} rx="5" fill="rgba(25,20,30,0.22)" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="5" fill={ton} />
    {art === 1 ? <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.1} rx="5" fill="#C8452F" opacity="0.88" /> : null}
    <rect x={-w / 2 + 16} y={-h / 2 + h * (art === 1 ? 0.16 : 0.08)} width={w * 0.36} height={h * 0.07} rx="3" fill={art === 2 ? PETROL : "#98A2AB"} />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-w / 2 + 16} y={-h / 2 + h * 0.34 + i * h * 0.1} width={w * (i % 3 === 2 ? 0.46 : 0.8) - 16} height={h * 0.035} rx="2" fill="#BCC2C8" />)}
    <rect x={w / 2 - 16 - w * 0.3} y={h / 2 - h * 0.14} width={w * 0.3} height={h * 0.06} rx="3" fill={art === 1 ? "#C8452F" : "#6E7780"} />
  </g>
);
const Zettel = ({ text = "?" }) => (
  <g>
    <rect x="-51" y="-47" width="110" height="110" fill="rgba(25,20,30,0.2)" />
    <rect x="-55" y="-55" width="110" height="110" fill="#F6D35B" />
    <text x="0" y="24" textAnchor="middle" fontFamily={SERIF} fontWeight="600" fontSize="72" fill="#7A5A12">{text}</text>
  </g>
);
const Knaeuel = ({ r = 46 }) => (
  <g>
    <ellipse cx="6" cy={r * 0.75} rx={r} ry={r * 0.3} fill="rgba(25,20,30,0.22)" />
    <path d={`M${-r} 0 L${-r * 0.6} ${-r * 0.75} L0 ${-r} L${r * 0.7} ${-r * 0.7} L${r} ${-r * 0.1} L${r * 0.75} ${r * 0.7} L0 ${r} L${-r * 0.7} ${r * 0.65} Z`} fill="#ECE8E0" />
    <path d={`M${-r * 0.6} ${-r * 0.75} L${-r * 0.1} ${-r * 0.1} L${r * 0.7} ${-r * 0.7} M${-r * 0.1} ${-r * 0.1} L${r * 0.75} ${r * 0.7} M${-r * 0.1} ${-r * 0.1} L${-r * 0.7} ${r * 0.65} M${-r} 0 L${-r * 0.1} ${-r * 0.1}`} stroke="#BDB7AC" strokeWidth="3" fill="none" />
  </g>
);

/* Unordnung auf dem Tisch: Blaetter, nach hinten kleiner und flacher. */
const CHAOS = (() => {
  const r = zufall(7), liste = [];
  for (let i = 0; i < 30; i++) {
    const y = 1045 + r() * 560, tiefe = (y - 1045) / 560;
    liste.push({ x: -30 + r() * 1140, y, dreh: -45 + r() * 90, w: 170 + r() * 60, h: 230 + r() * 70, art: Math.floor(r() * 3.4) % 3, ton: ["#FBF7EE", "#F3ECDD", "#FFFFFF"][Math.floor(r() * 3)], gross: 0.72 + tiefe * 0.5, flach: 0.5 + tiefe * 0.22 });
  }
  return liste.sort((a, b) => a.y - b.y);
})();

const Tisch_ = ({ art, holz }) => (
  <g>
    <path d="M-80 1010 L1160 1010 L1160 1960 L-80 1960 Z" fill={`url(#t-holz-${holz})`} />
    {[-300, -60, 180, 420, 660, 900, 1140, 1380].map((x, i) => <path key={i} d={`M${540 + (x - 540) * 0.72} 1010 L${x} 1960`} stroke="rgba(40,22,10,0.16)" strokeWidth="4" />)}
    <rect x="-80" y="1010" width="1240" height="7" fill="rgba(255,240,215,0.35)" />
    {art === "stapel" ? (
      <g>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i} transform={`translate(${250 - i * 2} ${1190 - i * 9}) scale(1.05 0.62) rotate(${-14 + (i % 2) * 1.5})`}><Blatt art={i === 6 ? 2 : 0} /></g>)}
        <g transform="translate(820 1210) scale(1.05 0.62) rotate(12)">
          <rect x="-125" y="-80" width="262" height="176" rx="6" fill="rgba(25,20,30,0.22)" />
          <rect x="-130" y="-88" width="260" height="176" rx="6" fill="#FFFDF8" />
          <path d="M-130 -88 L0 16 L130 -88" stroke="#C9C2B4" strokeWidth="5" fill="none" />
          <rect x="62" y="-70" width="48" height="56" rx="3" fill={ORANGE} />
        </g>
      </g>
    ) : (
      <g>
        {CHAOS.map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.gross} ${p.gross * p.flach}) rotate(${p.dreh})`}><Blatt w={p.w} h={p.h} art={p.art} ton={p.ton} /></g>)}
        {art === "zettel" ? (
          <g>
            {[[150, 1120, -12, "?"], [905, 1150, 9, "?"], [330, 1330, 7, "CHF"], [760, 1380, -8, "?"], [560, 1150, 4, "?"]].map(([x, y, d, tx], i) => <g key={i} transform={`translate(${x} ${y}) scale(${0.8 + (y - 1045) / 1400} ${(0.8 + (y - 1045) / 1400) * 0.66}) rotate(${d})`}>{tx === "CHF" ? <g><rect x="-55" y="-55" width="110" height="110" fill="#F6D35B" /><text x="0" y="14" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="40" fill="#7A5A12">CHF</text></g> : <Zettel text={tx} />}</g>)}
            <g transform="translate(985 1300)"><Knaeuel r={52} /></g>
            <g transform="translate(80 1420)"><Knaeuel r={60} /></g>
            <g transform="translate(640 1065) scale(0.7)"><Knaeuel r={44} /></g>
          </g>
        ) : null}
      </g>
    )}
  </g>
);

/* ---- Figur -------------------------------------------------------------- */
const TYPEN = {
  anna: { haut: ["#FAD6B8", "#EBB18B", "#C98562"], haar: ["#96502C", "#592A12"], form: "dutt", kleid: ["#37989A", "#1B5B63"], lippe: "#A9483A", iris: "#5F8450" },
  marc: { haut: ["#F2C9A5", "#DCA67E", "#B67A56"], haar: ["#4E382B", "#241711"], form: "kurz", kleid: ["#6E7A89", "#3A4350"], lippe: "#93493B", iris: "#56799E", brille: true }
};

const FigurDefs = ({ typ }) => {
  const T = TYPEN[typ];
  return (
    <>
      <radialGradient id={`t-haut-${typ}`} gradientUnits="userSpaceOnUse" cx="-45" cy="-80" r="290"><stop offset="0" stopColor={T.haut[0]} /><stop offset="0.62" stopColor={T.haut[1]} /><stop offset="1" stopColor={T.haut[2]} /></radialGradient>
      <linearGradient id={`t-haar-${typ}`} gradientUnits="userSpaceOnUse" x1="-80" y1="-300" x2="80" y2="20"><stop offset="0" stopColor={T.haar[0]} /><stop offset="1" stopColor={T.haar[1]} /></linearGradient>
      <linearGradient id={`t-kleid-${typ}`} gradientUnits="userSpaceOnUse" x1="-120" y1="220" x2="120" y2="600"><stop offset="0" stopColor={T.kleid[0]} /><stop offset="1" stopColor={T.kleid[1]} /></linearGradient>
      <clipPath id="t-auge-l"><ellipse cx="-64" cy="-12" rx="40" ry="44" /></clipPath>
      <clipPath id="t-auge-r"><ellipse cx="64" cy="-12" rx="40" ry="44" /></clipPath>
    </>
  );
};

const Auge = ({ seite, T, typ, blick, sorge, froh, lid }) => {
  const cx = 64 * seite, cy = -12, oben = cy - 46;
  const decke = Math.min(1, 0.1 + 0.2 * sorge + 0.1 * froh + lid * 0.9);
  const yAussen = oben + decke * 92 + 15 * sorge, yInnen = oben + decke * 92 - 8 * sorge;
  const xA = cx + 48 * seite, xI = cx - 48 * seite;
  const ix = cx + blick[0] * 13, iy = cy + 4 + blick[1] * 13;
  return (
    <g>
      <g clipPath={`url(#t-auge-${seite < 0 ? "l" : "r"})`}>
        <ellipse cx={cx} cy={cy} rx="42" ry="46" fill="#FFFDF8" />
        <ellipse cx={cx} cy={cy + 40} rx="44" ry="20" fill="rgba(120,90,80,0.14)" />
        <circle cx={ix} cy={iy} r="24" fill={T.iris} />
        <circle cx={ix} cy={iy} r="24" fill="none" stroke="rgba(20,20,20,0.35)" strokeWidth="4" />
        <circle cx={ix} cy={iy} r="12" fill="#17110E" />
        <circle cx={ix - 8} cy={iy - 9} r="6.5" fill="#FFFFFF" />
        <circle cx={ix + 8} cy={iy + 7} r="3" fill="rgba(255,255,255,0.7)" />
        <path d={`M${xA} ${oben - 6} L${xI} ${oben - 6} L${xI} ${yInnen} L${xA} ${yAussen} Z`} fill={T.haut[1]} />
        <path d={`M${xI} ${yInnen} L${xA} ${yAussen}`} stroke={T.haar[1]} strokeWidth="6" strokeLinecap="round" />
        {froh > 0 ? <ellipse cx={cx} cy={cy + 62 - 16 * froh} rx="50" ry="22" fill={T.haut[1]} /> : null}
      </g>
      <ellipse cx={cx} cy={cy} rx="40" ry="44" fill="none" stroke="rgba(110,60,40,0.3)" strokeWidth="3" />
    </g>
  );
};

/* ebene "koerper": Rumpf und Kopf (hinter dem Tisch); ebene "arme": Arme,
   Haende und das Blatt (liegen auf dem Tisch, also davor). */
const Figur = ({ typ, x, y, s = 0.92, pose = "brief", sorge = 0, froh = 0, blick = [0, 0], lid = 0, neig = 0, ebene }) => {
  const T = TYPEN[typ];
  const kopfY = pose === "kopf" ? 52 : 0;
  const haut = `url(#t-haut-${typ})`, haar = `url(#t-haar-${typ})`;
  if (ebene === "arme") {
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {pose === "kopf" ? (
          <g>
            {[-1, 1].map((m) => (
              <g key={m}>
                <path d={`M${m * 232} 500 C${m * 228} 380 ${m * 200} 250 ${m * 178} 150`} stroke={T.kleid[1]} strokeWidth="84" strokeLinecap="round" fill="none" />
                <path d={`M${m * 226} 492 C${m * 222} 380 ${m * 196} 250 ${m * 176} 156`} stroke={T.kleid[0]} strokeWidth="58" strokeLinecap="round" fill="none" />
                <rect x={m * 178 - 46} y="118" width="92" height="30" rx="12" fill={T.kleid[1]} transform={`rotate(${m * -12} ${m * 178} 133)`} />
                <g transform={`translate(${m * 150} ${kopfY - 40}) rotate(${m * -10})`}>
                  <ellipse cx="0" cy="26" rx="54" ry="80" fill={T.haut[1]} />
                  {[-30, -10, 10, 30].map((f, i) => <rect key={i} x={f - 11} y={-96 + Math.abs(f) * 0.5} width="22" height="78" rx="11" fill={T.haut[i % 2 ? 1 : 0]} />)}
                  <ellipse cx={m * -12} cy="20" rx="34" ry="56" fill={T.haut[0]} opacity="0.5" />
                </g>
              </g>
            ))}
          </g>
        ) : (
          <g>
            {[-1, 1].map((m) => (
              <g key={m}>
                <path d={`M${m * 268} 566 L${m * 160} ${500 + m * 6}`} stroke="rgba(20,15,25,0.3)" strokeWidth="96" strokeLinecap="round" fill="none" transform="translate(0 14)" filter="url(#t-weich-klein)" />
                <path d={`M${m * 268} 566 L${m * 160} ${500 + m * 6}`} stroke={T.kleid[1]} strokeWidth="96" strokeLinecap="round" fill="none" />
                <path d={`M${m * 266} 556 L${m * 164} ${492 + m * 6}`} stroke={T.kleid[0]} strokeWidth="64" strokeLinecap="round" fill="none" />
              </g>
            ))}
            <g transform="translate(0 440) rotate(-4)">
              <rect x="-112" y="-142" width="236" height="300" rx="6" fill="rgba(25,20,30,0.25)" />
              <rect x="-118" y="-150" width="236" height="300" rx="6" fill="#FFFCF5" />
              <rect x="-96" y="-124" width="92" height="24" rx="4" fill={PETROL} />
              {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="-96" y={-74 + i * 30} width={i % 3 === 2 ? 110 : 190} height="11" rx="3" fill="#BCC2C8" />)}
              <rect x="10" y="108" width="86" height="18" rx="4" fill={ORANGE} />
            </g>
            {[-1, 1].map((m) => (
              <g key={m} transform={`translate(${m * 124} ${486 + m * 6})`}>
                <ellipse cx="0" cy="0" rx="46" ry="38" fill={T.haut[1]} />
                <ellipse cx={m * -4} cy="-8" rx="34" ry="22" fill={T.haut[0]} opacity="0.6" />
                <ellipse cx={m * -30} cy="-18" rx="19" ry="32" transform={`rotate(${m * 28})`} fill={T.haut[0]} />
              </g>
            ))}
          </g>
        )}
      </g>
    );
  }
  const mundY = 124, mundMitte = mundY + 28 * froh - 22 * sorge;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="610" rx="330" ry="60" fill="rgba(20,15,25,0.35)" filter="url(#t-weich)" />
      <path d="M-290 640 C-296 350 -175 258 -80 240 L80 240 C175 258 296 350 290 640 Z" fill={`url(#t-kleid-${typ})`} />
      <path d="M-290 640 C-296 350 -175 258 -80 240 C-150 300 -215 420 -215 640 Z" fill="rgba(255,255,255,0.08)" />
      <path d="M-84 240 C-50 300 50 300 84 240 C60 272 -60 272 -84 240 Z" fill={T.kleid[1]} />
      <path d="M-54 120 L-54 240 C-30 276 30 276 54 240 L54 120 Z" fill={T.haut[1]} />
      <ellipse cx="0" cy="182" rx="56" ry="20" fill={T.haut[2]} opacity="0.6" filter="url(#t-weich-klein)" />
      <g transform={`translate(0 ${kopfY}) rotate(${neig})`}>
        {T.form === "dutt" ? <g><circle cx="34" cy="-252" r="66" fill={haar} /><path d="M-10 -292 C20 -318 70 -312 90 -276" stroke="rgba(255,220,180,0.25)" strokeWidth="10" fill="none" strokeLinecap="round" /></g> : null}
        {[-1, 1].map((m) => <g key={m}><ellipse cx={m * 155} cy="8" rx="25" ry="38" fill={T.haut[1]} /><ellipse cx={m * 158} cy="10" rx="12" ry="22" fill={T.haut[2]} opacity="0.6" /></g>)}
        <path d="M-150 -30 C-152 -160 -85 -200 0 -200 C85 -200 152 -160 150 -30 C150 70 100 172 0 178 C-100 172 -150 70 -150 -30 Z" fill={haut} />
        <ellipse cx="-98" cy="72" rx="36" ry="24" fill="#F08A7A" opacity="0.3" filter="url(#t-weich-klein)" />
        <ellipse cx="98" cy="72" rx="36" ry="24" fill="#F08A7A" opacity="0.3" filter="url(#t-weich-klein)" />
        {T.form === "dutt" ? (
          <g>
            <path d="M-160 8 C-184 -142 -112 -238 5 -240 C118 -238 186 -142 160 8 C154 -50 132 -102 72 -140 C22 -110 -80 -94 -140 -40 C-150 -24 -156 -8 -160 8 Z" fill={haar} />
            <path d="M-120 -120 C-80 -190 0 -214 70 -190" stroke="rgba(255,220,180,0.22)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M-158 0 C-170 44 -164 86 -150 108 C-146 62 -146 28 -138 -34 Z" fill={haar} />
            <path d="M158 0 C170 44 164 86 150 108 C146 62 146 28 142 -40 Z" fill={haar} />
          </g>
        ) : (
          <g>
            <path d="M-158 -6 C-176 -140 -106 -232 0 -234 C106 -232 176 -140 158 -6 C152 -60 140 -98 110 -122 C40 -152 -50 -152 -112 -120 C-140 -98 -152 -60 -158 -6 Z" fill={haar} />
            <path d="M-96 -150 C-50 -198 30 -206 90 -170" stroke="rgba(255,225,200,0.18)" strokeWidth="12" fill="none" strokeLinecap="round" />
          </g>
        )}
        {[-1, 1].map((m) => <path key={m} d={`M${m * 114} ${-64 + 10 * sorge} Q${m * 72} ${-94 - 4 * sorge - 6 * froh} ${m * 30} ${-74 - 26 * sorge}`} stroke={T.haar[1]} strokeWidth="15" strokeLinecap="round" fill="none" />)}
        <Auge seite={-1} T={T} typ={typ} blick={blick} sorge={sorge} froh={froh} lid={lid} />
        <Auge seite={1} T={T} typ={typ} blick={blick} sorge={sorge} froh={froh} lid={lid} />
        <ellipse cx="0" cy="84" rx="22" ry="8" fill={T.haut[2]} opacity="0.7" />
        <ellipse cx="0" cy="62" rx="27" ry="21" fill={T.haut[0]} />
        <ellipse cx="-8" cy="54" rx="10" ry="7" fill="rgba(255,255,255,0.5)" />
        <path d={`M-46 ${mundY} Q0 ${mundMitte} 46 ${mundY}`} stroke={T.lippe} strokeWidth="10" strokeLinecap="round" fill="none" />
        {froh > 0.5 ? <path d={`M-46 ${mundY} Q0 ${mundMitte} 46 ${mundY} Q0 ${mundY + 6} -46 ${mundY} Z`} fill="#FFFDF8" stroke={T.lippe} strokeWidth="7" strokeLinejoin="round" /> : null}
        {T.brille ? (
          <g fill="rgba(255,255,255,0.1)" stroke="#232831" strokeWidth="8">
            <rect x="-118" y="-66" width="104" height="100" rx="34" />
            <rect x="14" y="-66" width="104" height="100" rx="34" />
            <path d="M-14 -22 Q0 -34 14 -22 M-118 -30 L-152 -22 M118 -30 L152 -22" fill="none" />
          </g>
        ) : null}
      </g>
    </g>
  );
};

/* ---- Raeume ------------------------------------------------------------- */
const Kueche = () => (
  <g>
    <rect x="-80" y="-80" width="1240" height="1100" fill="#DCCBB0" />
    <rect x="-80" y="520" width="1240" height="292" fill="#EFE7D6" />
    {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${-70 + i * 72} 520 V812`} stroke="#CFC2A9" strokeWidth="3" />)}
    {[592, 664, 736].map((y) => <path key={y} d={`M-80 ${y} H1160`} stroke="#CFC2A9" strokeWidth="3" />)}
    {[[-80, 430], [740, 420]].map(([x, w], i) => (
      <g key={i}>
        <rect x={x} y="70" width={w} height="450" fill="#9B6B45" />
        <rect x={x} y="70" width={w} height="450" fill="url(#t-schrank)" />
        <path d={`M${x + w / 2} 70 V520`} stroke="rgba(40,22,10,0.4)" strokeWidth="5" />
        <rect x={x + w / 2 - 34} y="410" width="12" height="60" rx="6" fill="#D9C39A" />
        <rect x={x + w / 2 + 22} y="410" width="12" height="60" rx="6" fill="#D9C39A" />
        <rect x={x} y="520" width={w} height="12" fill="#FFE7B0" />
        <ellipse cx={x + w / 2} cy="560" rx={w / 2} ry="70" fill="#FFE2A0" opacity="0.45" filter="url(#t-weich)" />
      </g>
    ))}
    <rect x="492" y="-80" width="110" height="290" fill="#A7B0B5" />
    <path d="M400 310 L694 310 L650 205 L444 205 Z" fill="#B9C1C5" />
    <rect x="400" y="310" width="294" height="22" fill="#8C959A" />
    <rect x="-80" y="812" width="1240" height="46" fill="#7C5437" />
    <rect x="-80" y="812" width="1240" height="6" fill="rgba(255,235,205,0.4)" />
    <rect x="-80" y="858" width="1240" height="170" fill="#5E3E29" />
    <g>
      <rect x="60" y="786" width="250" height="26" rx="6" fill="#23262B" />
      {[90, 150, 210, 270].map((x) => <rect key={x} x={x} y="778" width="12" height="10" fill="#3A3F46" />)}
      <path d="M118 786 C110 720 122 690 180 690 C238 690 250 720 242 786 Z" fill="#C4CBD0" />
      <path d="M150 690 Q180 664 210 690" stroke="#8C959A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M242 730 Q286 716 280 748" stroke="#C4CBD0" strokeWidth="13" fill="none" strokeLinecap="round" />
    </g>
    <g>
      <rect x="850" y="716" width="64" height="96" rx="12" fill="#F1E6D2" /><rect x="846" y="704" width="72" height="20" rx="8" fill="#B5683C" />
      <rect x="930" y="738" width="56" height="74" rx="12" fill="#C97B4A" /><rect x="926" y="728" width="64" height="18" rx="8" fill="#7C5437" />
      <rect x="1002" y="700" width="60" height="112" rx="12" fill="#DDE4E1" opacity="0.9" /><rect x="998" y="690" width="68" height="18" rx="8" fill="#8C959A" />
    </g>
    <path d="M790 -80 V118" stroke="#3A2A20" strokeWidth="6" />
    <path d="M694 222 Q790 86 886 222 Z" fill="#D9772F" />
    <path d="M694 222 Q790 150 886 222 Z" fill="#B85A1E" opacity="0.5" />
    <ellipse cx="790" cy="222" rx="96" ry="17" fill="#FFEBC0" />
  </g>
);

const Buero = ({ t }) => (
  <g>
    <rect x="-80" y="-80" width="1240" height="1100" fill="#CDD3DA" />
    <rect x="-80" y="840" width="1240" height="180" fill="#AEB6C0" />
    <g>
      <rect x="40" y="110" width="430" height="590" fill="#8D97A3" />
      <rect x="58" y="128" width="394" height="554" fill="url(#t-fenster)" />
      <path d="M255 128 V682 M58 400 H452" stroke="#8D97A3" strokeWidth="14" />
      <g clipPath="url(#t-fenster-clip)" stroke="rgba(235,242,250,0.55)" strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 22 }, (_, i) => { const y = ((i * 97 + t * 14) % 640) + 100; const x = 70 + ((i * 53) % 370); return <path key={i} d={`M${x} ${y} l-10 46`} />; })}
      </g>
      <rect x="20" y="700" width="470" height="22" fill="#7C8692" />
    </g>
    <g>
      <rect x="640" y="130" width="470" height="20" fill="#7C8692" /><rect x="640" y="400" width="470" height="20" fill="#7C8692" /><rect x="640" y="670" width="470" height="20" fill="#7C8692" />
      {[[660, 50, "#5E7FA3"], [716, 44, "#B56A52"], [766, 56, "#6F8F7B"], [830, 46, "#C7A24E"], [884, 60, "#5E7FA3"], [954, 44, "#8D7AA8"], [1006, 52, "#B56A52"]].map(([x, w, f], i) => <g key={i}><rect x={x} y={170 + (i % 3) * 14} width={w} height={230 - (i % 3) * 14} rx="5" fill={f} /><rect x={x + 8} y={210 + (i % 3) * 14} width={w - 16} height="46" rx="4" fill="rgba(255,255,255,0.75)" /></g>)}
      <rect x="670" y="520" width="190" height="150" rx="6" fill="#B79B78" /><path d="M670 560 H860" stroke="#8E7556" strokeWidth="5" /><rect x="738" y="572" width="54" height="26" rx="4" fill="#F1E6D2" />
      <rect x="890" y="486" width="170" height="184" rx="6" fill="#A68C6B" /><path d="M890 530 H1060" stroke="#8E7556" strokeWidth="5" />
    </g>
  </g>
);

/* Lichtbad: gibt der flachen Zeichnung Tiefe. */
const Licht = ({ art }) => (
  <g style={{ pointerEvents: "none" }}>
    <rect x="-200" y="-200" width="1480" height="2400" fill={`url(#t-licht-${art})`} style={{ mixBlendMode: "multiply" }} />
    {art !== "kalt" ? <circle cx="790" cy="232" r={art === "warm" ? 560 : 430} fill="url(#t-lampe)" style={{ mixBlendMode: "screen" }} /> : null}
  </g>
);

const SzeneDefs = () => (
  <defs>
    <filter id="t-weich" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
    <filter id="t-weich-klein" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
    <filter id="t-glimmen" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
    <linearGradient id="t-holz-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A8744B" /><stop offset="1" stopColor="#6B452C" /></linearGradient>
    <linearGradient id="t-holz-grau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9BA0A8" /><stop offset="1" stopColor="#5E636D" /></linearGradient>
    <linearGradient id="t-schrank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,255,255,0.1)" /><stop offset="1" stopColor="rgba(0,0,0,0.18)" /></linearGradient>
    <linearGradient id="t-fenster" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FB0C2" /><stop offset="1" stopColor="#DCE3EA" /></linearGradient>
    <clipPath id="t-fenster-clip"><rect x="58" y="128" width="394" height="554" /></clipPath>
    <radialGradient id="t-licht-nacht" gradientUnits="userSpaceOnUse" cx="600" cy="800" r="1200"><stop offset="0" stopColor="#FFF0D4" /><stop offset="0.5" stopColor="#D0A784" /><stop offset="1" stopColor="#2A2742" /></radialGradient>
    <radialGradient id="t-licht-warm" gradientUnits="userSpaceOnUse" cx="600" cy="640" r="1150"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#F4DEC0" /><stop offset="1" stopColor="#9A7868" /></radialGradient>
    <linearGradient id="t-licht-kalt" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="900" y2="1900"><stop offset="0" stopColor="#C5D2E0" /><stop offset="1" stopColor="#55647A" /></linearGradient>
    <radialGradient id="t-lampe"><stop offset="0" stopColor="rgba(255,205,130,0.75)" /><stop offset="0.4" stopColor="rgba(255,190,110,0.28)" /><stop offset="1" stopColor="rgba(255,180,100,0)" /></radialGradient>
    <radialGradient id="t-tief" gradientUnits="userSpaceOnUse" cx="540" cy="760" r="1150"><stop offset="0" stopColor="#14384F" /><stop offset="0.55" stopColor="#0E1B26" /><stop offset="1" stopColor="#070E15" /></radialGradient>
    <linearGradient id="t-fuellung" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GLUT} /><stop offset="1" stopColor={ORANGE} /></linearGradient>
    <linearGradient id="t-chip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1F5A80" /><stop offset="1" stopColor="#0D2A3F" /></linearGradient>
    <linearGradient id="t-pult" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0E2CB" /><stop offset="1" stopColor="#D8C2A0" /></linearGradient>
    <FigurDefs typ="anna" />
    <FigurDefs typ="marc" />
  </defs>
);

const Leinwand = ({ children, stil }) => (
  <svg width={B0} height={H0} viewBox={`0 0 ${B0} ${H0}`} style={{ position: "absolute", inset: 0, ...stil }} aria-hidden="true">
    <SzeneDefs />
    {children}
  </svg>
);

/* Figur am Tisch, langsame Kamerafahrt auf das Gesicht. */
const Raum = ({ teil, t, D, absolut }) => {
  const { fps } = useVideoConfig();
  const [z0, z1] = teil.zoom || [1, 1.2];
  const z = z0 + (z1 - z0) * (t / D);
  const nah = Math.min(1, Math.max(0, (z - 1) / 0.95));
  const fx = 540, fy = 600;
  const kamera = `translate(${540} ${fy - 60 + 165 * nah}) scale(${z}) translate(${-fx} ${-fy})`;
  /* Lidschlag alle gut drei Sekunden, Blick wandert ueber das Blatt. */
  const takt = absolut % 100;
  const blinzeln = teil.pose === "kopf" ? 1 : interpolate(takt, [0, 3, 7], [0, 1, 0], CL);
  const auf = teil.aufblick ? weich(t, D * 0.56, D * 0.56 + 16) : 0;
  const frohIn = teil.froh ? feder(t, fps, 2, 18) * teil.froh : 0;
  const sorge = (teil.sorge || 0) * (1 - 0.35 * auf);
  const lesen = teil.froh ? [0, 0] : [0.55 * Math.sin(absolut / 13), 0.8];
  const blick = [lesen[0] * (1 - auf), lesen[1] * (1 - auf)];
  const neig = teil.pose === "kopf" ? 0 : -3 + 1.4 * Math.sin(absolut / 38) + 3 * auf + 2 * frohIn;
  const fig = { typ: teil.figur, x: 540, y: 600 + (teil.pose === "kopf" ? 1.5 * Math.sin(absolut / 26) : 0), pose: teil.pose, sorge, froh: frohIn, blick, lid: blinzeln, neig };
  const marke = teil.marke ? feder(t, fps, 8, 20, 14) : 0;
  return (
    <Leinwand stil={teil.licht === "kalt" ? { filter: "saturate(0.6)" } : undefined}>
      <rect width={B0} height={H0} fill={NACHT} />
      <g transform={kamera}>
        {teil.raum === "buero" ? <Buero t={absolut} /> : <Kueche />}
        <Figur {...fig} ebene="koerper" />
        <Tisch_ art={teil.tisch} holz={teil.raum === "buero" ? "grau" : "warm"} />
        <Figur {...fig} ebene="arme" />
        <Licht art={teil.licht} />
      </g>
      {teil.marke ? (
        <g transform={`translate(885 440) scale(${marke * 0.92}) rotate(8)`} opacity={Math.min(1, marke)}>
          <circle r="150" fill={ORANGE} />
          <circle r="150" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" />
          <text x="0" y="34" textAnchor="middle" fontFamily={ZAHL} fontSize="190" fill={CREME}>{teil.marke.gross}</text>
          <text x="0" y="92" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="34" fill={CREME}>{teil.marke.klein}</text>
        </g>
      ) : null}
    </Leinwand>
  );
};

/* ---- Platine: dunkler Grund mit Leiterbahnen und wandernden Lichtpunkten -- */
const SPUREN = (() => {
  const r = zufall(11), liste = [];
  for (let i = 0; i < 28; i++) {
    const seite = i % 4, o = (r() - 0.5) * 230, d1 = 70 + r() * 150, d2 = 110 + r() * 260, k = r() < 0.5 ? -1 : 1;
    const p = seite === 0 ? [[o, -130], [o, -130 - d1], [o + k * d2, -130 - d1 - d2], [o + k * d2, -1500]]
      : seite === 1 ? [[o, 130], [o, 130 + d1], [o + k * d2, 130 + d1 + d2], [o + k * d2, 1500]]
        : seite === 2 ? [[-130, o], [-130 - d1, o], [-130 - d1 - d2 * 0.6, o + k * d2 * 0.6], [-800, o + k * d2 * 0.6]]
          : [[130, o], [130 + d1, o], [130 + d1 + d2 * 0.6, o + k * d2 * 0.6], [800, o + k * d2 * 0.6]];
    liste.push({ d: "M" + p.map((q) => q.map((n) => Math.round(n)).join(" ")).join(" L"), ende: p[2], phase: r(), tempo: 70 + r() * 90 });
  }
  return liste;
})();
const Platine = ({ t, x = 540, y = 760, hin = false }) => (
  <g>
    <rect width={B0} height={H0} fill="url(#t-tief)" />
    <g transform={`translate(${x} ${y})`} fill="none" strokeLinejoin="round">
      {SPUREN.map((s, i) => (
        <g key={i}>
          <path d={s.d} stroke={BAHN} strokeWidth="3" opacity="0.55" />
          <circle cx={s.ende[0]} cy={s.ende[1]} r="7" fill={BAHN} opacity="0.8" />
          <path d={s.d} pathLength="1" strokeDasharray="0.05 1" strokeDashoffset={hin ? -1 + ((t / s.tempo + s.phase) % 1.05) : -((t / s.tempo + s.phase) % 1.05)} stroke={GLUT} strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
    </g>
  </g>
);

/* Rechnungen fliegen in den Franchise-Zaehler; ist er voll: 90 %. */
const Zaehler = ({ teil, t, D }) => {
  const { fps } = useVideoConfig();
  const voll = teil.bloecke[1] ? teil.bloecke[1].von : Math.round(D * 0.55);
  const N = 5, schritt = (voll - 34) / N;
  const flug = (i) => interpolate(t, [10 + i * schritt, 10 + i * schritt + 24], [0, 1], { ...CL, easing: Easing.in(Easing.quad) });
  let stand = 0;
  for (let i = 0; i < N; i++) stand += feder(t, fps, 10 + i * schritt + 22, 14) / N;
  const fertig = feder(t, fps, voll + 2, 18, 12);
  const puls = 0.5 + 0.5 * Math.sin(t / 5);
  const T = { x: 400, y: 530, w: 280, h: 480 };
  const hoehe = stand * (T.h - 16);
  return (
    <Leinwand>
      <Platine t={t} y={770} hin />
      <text x="540" y="486" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="36" letterSpacing="9" fill={CREME} opacity={interpolate(t, [0, 10], [0, 1], CL)}>FRANCHISE</text>
      <rect x={T.x - 16} y={T.y - 16} width={T.w + 32} height={T.h + 32} rx="56" fill="none" stroke={ORANGE} strokeWidth="14" opacity={0.25 + 0.45 * fertig * puls} filter="url(#t-glimmen)" />
      <rect x={T.x} y={T.y} width={T.w} height={T.h} rx="44" fill="#0B1620" />
      <clipPath id="t-tank"><rect x={T.x + 8} y={T.y + 8} width={T.w - 16} height={T.h - 16} rx="36" /></clipPath>
      <g clipPath="url(#t-tank)">
        <path d={`M${T.x} ${T.y + T.h - hoehe} q35 ${-12 * Math.sin(t / 7)} 70 0 t70 0 t70 0 t70 0 V${T.y + T.h} H${T.x} Z`} fill="url(#t-fuellung)" />
        <rect x={T.x + 26} y={T.y + 20} width="26" height={T.h - 40} rx="13" fill="rgba(255,255,255,0.1)" />
      </g>
      <rect x={T.x} y={T.y} width={T.w} height={T.h} rx="44" fill="none" stroke={CREME} strokeWidth="6" />
      {[1, 2, 3, 4].map((i) => <path key={i} d={`M${T.x - 44} ${T.y + (T.h * i) / 5} h26`} stroke={CREME} strokeWidth="5" strokeLinecap="round" opacity="0.7" />)}
      {Array.from({ length: N }, (_, i) => {
        const u = flug(i);
        if (u <= 0 || u >= 1) return null;
        const links = i % 2 === 0, sx = links ? -140 : 1220, sy = 640 + i * 60;
        const x = sx + (540 - sx) * u, y = sy + (T.y + 10 - sy) * u - 150 * Math.sin(Math.PI * u);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${(links ? -28 : 28) * (1 - u) + 6}) scale(${1 - 0.5 * u})`} opacity={interpolate(u, [0.85, 1], [1, 0], CL)}><Blatt art={i % 3} /></g>;
      })}
      <g transform={`translate(${T.x + T.w - 6} ${T.y + 6}) scale(${fertig})`}>
        <circle r="50" fill={ORANGE} /><path d="M-22 2 L-6 18 L24 -16" stroke={CREME} strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform={`translate(540 1190) scale(${0.6 + 0.4 * fertig})`} opacity={Math.min(1, fertig)}>
        <text x="0" y="0" textAnchor="middle" fontFamily={ZAHL} fontSize="170" fill={CREME}>90<tspan dx="22" fill={GLUT}>%</tspan></text>
      </g>
    </Leinwand>
  );
};

/* Aufgeraeumter Tisch von oben: Laptop mit Vergleich, Angebote sortieren sich. */
const Laptop = ({ teil, t, D }) => {
  const { fps } = useVideoConfig();
  const z = 1 + 0.06 * (t / D);
  const LAENGE = [0.86, 0.58, 1.0, 0.7];
  const rang = LAENGE.map((l) => LAENGE.filter((m) => m < l).length);
  const sortiert = feder(t, fps, 16, 16);
  const preis = feder(t, fps, 32, 14, 14);
  return (
    <Leinwand>
      <rect width={B0} height={H0} fill="url(#t-pult)" />
      <path d="M-100 1500 L700 -100 L1300 -100 L560 1700 Z" fill="rgba(255,255,255,0.22)" />
      <g transform={`translate(540 700) scale(${z}) translate(-540 -700)`}>
        <g transform="translate(170 392)">
          <circle cx="8" cy="12" r="112" fill="rgba(90,60,30,0.2)" filter="url(#t-weich-klein)" />
          <circle r="108" fill="#FFFFFF" /><circle r="78" fill="#F4EEE4" /><circle r="66" fill="#8A5A36" />
          <path d="M0 26 C-34 2 -30 -30 -10 -30 C-2 -30 0 -22 0 -18 C0 -22 2 -30 10 -30 C30 -30 34 2 0 26 Z" fill="#F1DDBF" />
          <path d="M70 -40 Q128 -70 118 -6 Q112 22 76 18" stroke="#FFFFFF" strokeWidth="20" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(935 372)">
          <circle cx="8" cy="14" r="86" fill="rgba(90,60,30,0.2)" filter="url(#t-weich-klein)" />
          <circle r="80" fill="#C97B4A" /><circle r="62" fill="#5A3B28" />
          {[0, 52, 104, 156, 208, 260, 312].map((w, i) => <ellipse key={i} cx="0" cy="-66" rx={24 + (i % 2) * 6} ry={62 + (i % 3) * 8} transform={`rotate(${w + 2 * Math.sin((t + i * 9) / 18)})`} fill={i % 2 ? "#2F7D5B" : "#3F9A6E"} />)}
        </g>
        <rect x="86" y="548" width="924" height="640" rx="34" fill="rgba(60,40,20,0.25)" filter="url(#t-weich)" />
        <rect x="80" y="520" width="920" height="600" rx="30" fill="#1B222B" />
        <rect x="104" y="544" width="872" height="552" rx="10" fill="#F7F4EE" />
        <g transform="translate(104 544)">
          <rect width="872" height="78" rx="10" fill={PETROL} /><rect y="40" width="872" height="38" fill={PETROL} />
          <rect x="24" y="17" width="44" height="44" rx="10" fill={CREME} /><path d="M41.6 25.8h8.8v8.8h8.8v8.8h-8.8v8.8h-8.8v-8.8h-8.8v-8.8h8.8z" fill={PETROL} />
          <text x="84" y="51" fontFamily={SCHRIFT} fontWeight="700" fontSize="32" fill={CREME}>Prämien 2027</text>
          <rect x="672" y="20" width="176" height="38" rx="19" fill="none" stroke="rgba(244,238,228,0.7)" strokeWidth="3" /><text x="760" y="47" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="600" fontSize="22" fill={CREME}>Ihr Wohnort</text>
          {LAENGE.map((l, i) => {
            const rein = feder(t, fps, 2 + i * 3, 14);
            const platz = i + (rang[i] - i) * sortiert;
            const bester = rang[i] === 0;
            return (
              <g key={i} transform={`translate(${(1 - rein) * 80} ${100 + platz * 110})`} opacity={rein}>
                <rect x="24" y="4" width="824" height="96" rx="16" fill="rgba(20,33,44,0.08)" />
                <rect x="20" y="0" width="824" height="96" rx="16" fill="#FFFFFF" stroke={bester ? ORANGE : "none"} strokeWidth={5 * sortiert} />
                <circle cx="70" cy="48" r="26" fill={bester ? ORANGE : "#E3E7EA"} opacity={0.35 + 0.65 * sortiert} />
                <text x="70" y="59" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="30" fill={bester ? CREME : TINTE} opacity={sortiert}>{rang[i] + 1}</text>
                <rect x="116" y="26" width="150" height="16" rx="8" fill="#AEB7BF" /><rect x="116" y="54" width="96" height="12" rx="6" fill="#D2D8DD" />
                <rect x="300" y="36" width="500" height="24" rx="12" fill="#EEF1F3" />
                <rect x="300" y="36" width={500 * l * rein} height="24" rx="12" fill={bester ? ORANGE : "#9DB7C4"} />
              </g>
            );
          })}
          <g transform={`translate(676 122) scale(${preis})`}><rect x="-150" y="-24" width="300" height="48" rx="24" fill={TINTE} /><text x="0" y="9" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="24" fill={CREME}>günstigstes Angebot</text></g>
        </g>
        <rect x="80" y="1120" width="920" height="26" fill="#8F99A2" />
        <path d="M50 1146 L1030 1146 L1120 1560 L-40 1560 Z" fill="#D9DEE3" />
        {[0, 1, 2, 3].map((r) => Array.from({ length: 12 }, (_, k) => { const b = 980 + r * 44, x0 = 540 - b / 2 + 26, w = (b - 52) / 12; return <rect key={`${r}-${k}`} x={x0 + k * w + 5} y={1168 + r * 70} width={w - 10} height="54" rx="9" fill="#2A323C" />; }))}
        {[-1, 1].map((m) => {
          const tipp = 5 * Math.sin(t / 2.2 + (m > 0 ? 1.6 : 0));
          return (
            <g key={m} transform={`translate(${540 + m * 215} ${1330 + tipp})`}>
              <path d={`M${m * 250} 700 C${m * 190} 420 ${m * 90} 250 ${m * 20} 120`} stroke="#3A4350" strokeWidth="190" strokeLinecap="round" fill="none" />
              <path d={`M${m * 250} 700 C${m * 190} 420 ${m * 90} 250 ${m * 20} 120`} stroke="#6E7A89" strokeWidth="150" strokeLinecap="round" fill="none" />
              <ellipse cx="0" cy="20" rx="82" ry="94" fill={TYPEN.marc.haut[1]} />
              {[-48, -16, 16, 48].map((f, i) => <rect key={i} x={f - 15} y={-128 + Math.abs(f) * 0.45 + (i === (Math.floor(t / 4) + (m > 0 ? 2 : 0)) % 4 ? 10 : 0)} width="30" height="110" rx="15" fill={TYPEN.marc.haut[i % 2 ? 1 : 0]} />)}
              <ellipse cx={m * -10} cy="6" rx="52" ry="62" fill={TYPEN.marc.haut[0]} opacity="0.5" />
            </g>
          );
        })}
      </g>
    </Leinwand>
  );
};

/* Viele Praemien fallen in den Chip, unten kommen die guenstigsten sortiert heraus. */
const REGEN = (() => { const r = zufall(23); return Array.from({ length: 16 }, (_, i) => ({ x: 60 + r() * 960, dreh: -50 + r() * 100, art: Math.floor(r() * 3), ab: i * 8 + r() * 4 })); })();
const Maschine = ({ teil, t, D }) => {
  const { fps } = useVideoConfig();
  const C = { x: 540, y: 690 };
  const an = feder(t, fps, 0, 18, 14);
  const puls = 0.5 + 0.5 * Math.sin(t / 6);
  const KARTEN = [0.46, 0.6, 0.76];
  return (
    <Leinwand>
      <Platine t={t} y={C.y} />
      <g opacity={interpolate(t, [2, 12], [0, 1], CL)}>
        <rect x="262" y="350" width="556" height="62" rx="31" fill="rgba(14,27,38,0.7)" stroke="rgba(244,238,228,0.6)" strokeWidth="3" />
        <text x="540" y="392" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="600" fontSize="29" fill={CREME}>Offizielle Prämien 2027 · BAG</text>
      </g>
      {REGEN.map((p, i) => {
        const u = interpolate((t - p.ab) % 150, [0, 28], [0, 1], { ...CL, easing: Easing.in(Easing.quad) });
        if (t < p.ab || u <= 0 || u >= 1 || t > D * 0.78) return null;
        const y = 430 + (C.y - 110 - 430) * u, x = p.x + (C.x - p.x) * u * u;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${p.dreh * (1 - u)}) scale(${0.62 - 0.4 * u})`} opacity={interpolate(u, [0, 0.12, 0.86, 1], [0, 1, 1, 0], CL)}><Blatt art={p.art} /></g>;
      })}
      <g transform={`translate(${C.x} ${C.y}) scale(${0.7 + 0.3 * an})`} opacity={an}>
        <rect x="-150" y="-150" width="300" height="300" rx="50" fill="none" stroke={ORANGE} strokeWidth="16" opacity={0.3 + 0.4 * puls} filter="url(#t-glimmen)" />
        {[-84, -42, 0, 42, 84].map((o) => <g key={o} fill={CREME} opacity="0.85"><rect x={o - 7} y="-158" width="14" height="30" rx="4" /><rect x={o - 7} y="128" width="14" height="30" rx="4" /><rect x="-158" y={o - 7} width="30" height="14" rx="4" /><rect x="128" y={o - 7} width="30" height="14" rx="4" /></g>)}
        <rect x="-130" y="-130" width="260" height="260" rx="40" fill="url(#t-chip)" stroke={CREME} strokeWidth="5" />
        <rect x="-78" y="-78" width="156" height="156" rx="32" fill={CREME} />
        <path d="M-18 -50h36v32h32v36h-32v32h-36v-32h-32v-36h32z" fill={PETROL} />
      </g>
      {KARTEN.map((l, k) => {
        const u = feder(t, fps, Math.round(D * 0.3) + k * 16, 20, 16);
        if (u <= 0.001) return null;
        const y = C.y + 100 + (930 + k * 112 - C.y - 100) * u;
        return (
          <g key={k} transform={`translate(540 ${y}) scale(${0.3 + 0.7 * Math.min(1, u)})`} opacity={Math.min(1, u * 1.6)}>
            {k === 0 ? <rect x="-322" y="-48" width="644" height="96" rx="24" fill="none" stroke={ORANGE} strokeWidth="12" opacity={0.35 + 0.3 * puls} filter="url(#t-glimmen)" /> : null}
            <rect x="-320" y="-46" width="640" height="92" rx="22" fill="#15344B" stroke={k === 0 ? ORANGE : "rgba(244,238,228,0.45)"} strokeWidth={k === 0 ? 5 : 3} />
            <circle cx="-262" cy="0" r="28" fill={k === 0 ? ORANGE : "rgba(244,238,228,0.16)"} />
            <text x="-262" y="11" textAnchor="middle" fontFamily={SCHRIFT} fontWeight="700" fontSize="32" fill={CREME}>{k + 1}</text>
            <rect x="-212" y="-20" width="120" height="14" rx="7" fill="rgba(244,238,228,0.6)" /><rect x="-212" y="6" width="80" height="11" rx="5.5" fill="rgba(244,238,228,0.3)" />
            <rect x="-60" y="-12" width="350" height="24" rx="12" fill="rgba(244,238,228,0.12)" />
            <rect x="-60" y="-12" width={350 * l} height="24" rx="12" fill={k === 0 ? ORANGE : "#6FA3BF"} />
          </g>
        );
      })}
    </Leinwand>
  );
};

/* Vier Angaben als Karten im Zickzack, Pfeile dazwischen. */
const ZEICHEN = [
  <path key="plz" d="M0 -30 C-22 -30 -34 -14 -34 2 C-34 24 0 46 0 46 C0 46 34 24 34 2 C34 -14 22 -30 0 -30 Z M0 -10 a12 12 0 1 0 0.01 0 Z" fill={CREME} fillRule="evenodd" />,
  <g key="alter" fill={CREME}><circle cx="0" cy="-16" r="17" /><path d="M-32 40 C-32 12 -16 6 0 6 C16 6 32 12 32 40 Z" /></g>,
  <g key="franchise" fill="none" stroke={CREME} strokeWidth="8"><ellipse cx="0" cy="-16" rx="30" ry="12" /><path d="M-30 -16 V16 C-30 32 30 32 30 16 V-16 M-30 0 C-30 16 30 16 30 0" /></g>,
  <g key="modell"><path d="M0 -38 L32 -24 V4 C32 24 16 36 0 42 C-16 36 -32 24 -32 4 V-24 Z" fill={CREME} /><path d="M-6 -16h12v12h12v12h-12v12h-12v-12h-12v-12h12z" fill={PETROL} /></g>
];
const Schritte = ({ teil, t, D }) => {
  const { fps } = useVideoConfig();
  const d0 = teil.bloecke[0] ? teil.bloecke[0].bis : D;
  const ab = [0.02, 0.24, 0.4, 0.58].map((a) => Math.round(a * d0));
  const haken = teil.bloecke[1] ? teil.bloecke[1].von : D;
  const K = { w: 480, h: 170 };
  const ort = (i) => ({ x: i % 2 === 0 ? 64 : 536, y: 360 + i * 232 });
  return (
    <Leinwand>
      <rect width={B0} height={H0} fill={CREME} />
      {Array.from({ length: 13 }, (_, r) => Array.from({ length: 8 }, (_, k) => <circle key={`${r}-${k}`} cx={70 + k * 134} cy={330 + r * 80} r="3.5" fill="rgba(20,33,44,0.1)" />))}
      {[0, 1, 2].map((i) => {
        const a = ort(i), b = ort(i + 1), rechts = i % 2 === 0;
        const x1 = rechts ? a.x + K.w + 14 : a.x - 14, y1 = a.y + K.h / 2, x2 = b.x + K.w / 2, y2 = b.y - 20;
        const u = interpolate(t, [ab[i + 1] - 9, ab[i + 1] + 3], [0, 1], CL);
        const L = 420;
        return (
          <g key={i} opacity={u > 0 ? 1 : 0}>
            <path d={`M${x1} ${y1} Q${x2} ${y1} ${x2} ${y2}`} stroke={ORANGE} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - u)} />
            <path d={`M${x2 - 24} ${y2 - 22} L${x2} ${y2 + 4} L${x2 + 24} ${y2 - 22}`} stroke={ORANGE} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(u, [0.8, 1], [0, 1], CL)} />
          </g>
        );
      })}
      {teil.karten.map((name, i) => {
        const u = feder(t, fps, ab[i], 18, 13), o = ort(i);
        const ok = feder(t, fps, haken + 2 + i * 4, 14, 11);
        return (
          <g key={i} transform={`translate(${o.x + K.w / 2} ${o.y + K.h / 2}) scale(${0.6 + 0.4 * u}) translate(${-K.w / 2} ${-K.h / 2})`} opacity={Math.min(1, u * 1.5)}>
            <rect x="6" y="10" width={K.w} height={K.h} rx="34" fill="rgba(20,33,44,0.14)" filter="url(#t-weich-klein)" />
            <rect width={K.w} height={K.h} rx="34" fill="#FFFFFF" />
            <circle cx="88" cy={K.h / 2} r="58" fill={PETROL} />
            <g transform={`translate(88 ${K.h / 2})`}>{ZEICHEN[i]}</g>
            <text x="170" y="66" fontFamily={SCHRIFT} fontWeight="700" fontSize="27" letterSpacing="3" fill={ORANGE}>{`SCHRITT ${i + 1}`}</text>
            <text x="168" y="122" fontFamily={SCHRIFT} fontWeight="700" fontSize="46" fill={TINTE}>{name}</text>
            <g transform={`translate(${K.w - 26} 24) scale(${ok})`}><circle r="34" fill={ORANGE} /><path d="M-15 1 L-4 12 L16 -11" stroke={CREME} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
          </g>
        );
      })}
    </Leinwand>
  );
};

/* Abbinder auf der Platine. */
const Schluss = ({ teil, t }) => {
  const { fps } = useVideoConfig();
  const e = (verz) => feder(t, fps, verz, 22);
  const logo = feder(t, fps, 4, 22, 13);
  const puls = 0.5 + 0.5 * Math.sin(t / 7);
  return (
    <>
      <Leinwand>
        <Platine t={t} y={700} />
        <g transform={`translate(540 700) scale(${0.5 + 0.5 * logo})`} opacity={Math.min(1, logo)}>
          <rect x="-128" y="-128" width="256" height="256" rx="60" fill="none" stroke={ORANGE} strokeWidth="18" opacity={0.3 + 0.35 * puls} filter="url(#t-glimmen)" />
          <rect x="-112" y="-112" width="224" height="224" rx="50" fill={PETROL} stroke={CREME} strokeWidth="5" />
          <path d="M-22 -66h44v44h44v44h-44v44h-44v-44h-44v-44h44z" fill={CREME} />
        </g>
      </Leinwand>
      <div style={{ position: "absolute", left: 60, right: 60, top: 380, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 74, lineHeight: 1.1, letterSpacing: "-0.01em", color: CREME, opacity: e(2), transform: `translateY(${(1 - e(2)) * 20}px)` }}>In 1 Minute vergleichen.</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: SCHRIFT, fontSize: 84, color: CREME, letterSpacing: "-0.01em", opacity: e(9), transform: `translateY(${(1 - e(9)) * 20}px)` }}>Swiss<span style={{ fontWeight: 700 }}>Premia</span></div>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 500, fontSize: 31, color: CREME, marginTop: 14, opacity: 0.9 * e(12) }}>Offizielle Prämien 2027 · kostenlos · ohne Anmeldung</div>
        <div style={{ marginTop: 34, padding: "24px 60px", borderRadius: 999, background: ORANGE, color: "#FFFFFF", fontFamily: SCHRIFT, fontWeight: 700, fontSize: 46, opacity: e(16), transform: `scale(${0.9 + 0.1 * e(16)})` }}>Link im Profil</div>
        <div style={{ marginTop: 26, fontFamily: SCHRIFT, fontSize: 24, color: CREME, opacity: 0.7 * e(19) }}>{teil.hinweis}</div>
      </div>
    </>
  );
};

const ARTEN = { raum: Raum, zaehler: Zaehler, laptop: Laptop, maschine: Maschine, schritte: Schritte, schluss: Schluss };

const Bild = ({ teil, erste }) => {
  const t = useCurrentFrame();
  const D = teil.bis - teil.von;
  const Art = ARTEN[teil.art] || Raum;
  const hell = HELL[teil.art];
  return (
    <AbsoluteFill style={{ opacity: erste ? 1 : interpolate(t, [0, BLENDE], [0, 1], CL), backgroundColor: hell ? CREME : NACHT }}>
      <Art teil={teil} t={t} D={D} absolut={teil.von + t} />
      {teil.art === "schluss" ? null : (
        <>
          <AbsoluteFill style={{ background: hell ? "linear-gradient(to bottom, rgba(244,238,228,0.9) 0px, rgba(244,238,228,0) 340px)" : "linear-gradient(to bottom, rgba(8,14,20,0.62) 0px, rgba(8,14,20,0) 420px)" }} />
          {teil.art === "schritte" ? null : <AbsoluteFill style={{ background: hell ? "linear-gradient(to bottom, rgba(244,238,228,0) 1290px, rgba(244,238,228,0.96) 1440px)" : "linear-gradient(to bottom, rgba(8,14,20,0) 1200px, rgba(8,14,20,0.88) 1420px, rgba(8,14,20,0.96) 1920px)" }} />}
        </>
      )}
    </AbsoluteFill>
  );
};

const Untertitel = ({ teil, erste }) => {
  const t = useCurrentFrame();
  const D = teil.bis - teil.von;
  const block = teil.bloecke.filter((b) => t >= b.von).pop() || teil.bloecke[0];
  if (!block) return null;
  const lokal = t - block.von, vorn = block === teil.bloecke[0];
  const da = (erste && vorn ? 1 : interpolate(lokal, [vorn ? 3 : 0, vorn ? 10 : 7], [0, 1], CL)) * (1 - interpolate(t, [D - 5, D - 1], [0, 1], CL));
  const laenge = Math.max(...teil.bloecke.map((b) => b.t.replace(/\*\*/g, "").length));
  const groesse = laenge <= 40 ? 70 : laenge <= 62 ? 62 : 55;
  const hell = HELL[teil.art];
  const marke = { background: ORANGE, color: "#FFFFFF", padding: "0 0.16em", borderRadius: 10, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };
  return (
    <div style={{ position: "absolute", left: ZONE.seite - 14, right: ZONE.seite - 14, bottom: ZONE.unten + 36, textAlign: "center", opacity: da, transform: `translateY(${(1 - da) * 18}px)` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: groesse, lineHeight: 1.2, letterSpacing: "-0.01em", color: hell ? TINTE : CREME, textWrap: "balance", textShadow: hell ? "none" : "0 2px 18px rgba(0,0,0,0.45)" }}>
        {block.t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((stueck, i) => (stueck.startsWith("**") ? <span key={i} style={marke}>{stueck.slice(2, -2)}</span> : <span key={i}>{stueck}</span>))}
      </div>
    </div>
  );
};

const Markenzeile = ({ hell }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 262, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
    <svg width="38" height="38" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill={hell ? PETROL : CREME} /><path d="M41 20h18v21h21v18H59v21H41V59H20V41h21z" fill={hell ? CREME : PETROL} /></svg>
    <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 24, letterSpacing: "0.16em", color: hell ? TINTE : CREME }}>SWISSPREMIA.CH</div>
  </div>
);

const MUSIK_EIN = 8, MUSIK_AUS = 30;

export const Tisch = ({ reel }) => {
  const { teile, gesamt } = reel;
  return (
    <AbsoluteFill style={{ backgroundColor: NACHT }}>
      {teile.map((teil, n) => (
        <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von + (n + 1 < teile.length ? BLENDE : 0)} name={`Szene ${n + 1} ${teil.art}`}>
          <Bild teil={teil} erste={n === 0} />
        </Sequence>
      ))}
      {teile.map((teil, n) => (teil.art === "schluss" ? null : (
        <Sequence key={n} from={teil.von} durationInFrames={teil.bis - teil.von} layout="none" name={`Text ${n + 1}`}>
          <Markenzeile hell={HELL[teil.art]} />
          <Untertitel teil={teil} erste={n === 0} />
        </Sequence>
      )))}
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.32, pointerEvents: "none" }}>
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
export const TISCH_BEISPIEL = {
  id: "beispiel", gesamt: 300, ton: null, musik: null,
  teile: [
    { von: 0, bis: 120, art: "raum", raum: "kueche", licht: "nacht", figur: "anna", pose: "brief", sorge: 1, tisch: "chaos", zoom: [1, 1.5], bloecke: [{ von: 0, bis: 120, t: "Ein Stapel Arztrechnungen – und **keine eingereicht**?" }] },
    { von: 120, bis: 210, art: "maschine", bloecke: [{ von: 0, bis: 90, t: "Die **günstigsten Angebote** für Ihren Wohnort." }] },
    { von: 210, bis: 300, art: "schluss", hinweis: "Stimme KI-generiert · keine Beratung", bloecke: [] }
  ]
};
