/* =========================================================================
   Serie «Durchblick» – Boegen, Sonne, Farbflaechen, Fotos in Schwarzweiss.

   Leitidee (Moodboard vom 13.11.2026): Jeder Kassenwechsel ist ein
   Durchgang. Jede Szene endet mit einer Kamerafahrt in ihr «Tor» (den
   innersten Bogen, die Sonne), dahinter liegt die naechste Szene.

   Eingabe `reel` (gebaut von durchblick/bauen.js):
     szenen    [{ von, bis, motiv: { art, … }, bloecke: [{ von, bis, t }] }]   bloecke in Frames ab Szenenbeginn
     abbinder  { von, foto }
     ton, musik, gesamt

   Regeln: Orange traegt Schrift nur auf Dunkel; auf Hell wird das
   Schluesselwort orange hinterlegt. Der erste Text steht ab dem ersten
   Bild. Alles Wichtige bleibt zwischen ZONE.oben und ZONE.unten.
   ========================================================================= */
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { loadFont as ladeFraunces } from "@remotion/google-fonts/Fraunces";
import { SCHRIFT, ZONE } from "./Marke.jsx";

const { fontFamily: SERIF } = ladeFraunces("normal", { weights: ["600"], subsets: ["latin", "latin-ext"] });

export const F = { petrolD: "#00446A", petrol: "#005786", orange: "#EC6A1E", sand: "#D9D2C5", creme: "#F4EEE4", nacht: "#14212C", dunst: "#9DB7C4", boden: "#C2B9A9", himmel: "#EADFCF" };
export const UEBER = 10;                      // Frames, die eine Szene in die naechste hineinragt (Fahrt durchs Tor)
const B = 1080, H = 1920;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const GRUND = { bogenfoto: F.sand, durchgang: F.petrolD, zahl: F.nacht, kennzahl: F.petrolD, saeulen: F.creme, landschaft: F.himmel, tisch: F.petrolD };
const istHell = (art) => art === "bogenfoto" || art === "saeulen" || art === "landschaft";
const foto = (name) => staticFile(`durchblick/${name}.jpg`);
const tausender = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");

/* ---- Bausteine ------------------------------------------------------ */
const Bogen = ({ x, b, h, farbe, e = 1, children }) => (
  <div style={{ position: "absolute", left: x, bottom: 0, width: b, height: h, borderRadius: `${b / 2}px ${b / 2}px 0 0`, background: farbe, overflow: "hidden", transform: `translateY(${(1 - e) * h}px)` }}>
    {children}
  </div>
);

const Foto = ({ name, p, position = "50% 50%" }) => (
  <Img src={foto(name)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position, filter: "grayscale(1) contrast(1.15)", transform: `scale(${1.14 - 0.1 * p})` }} />
);

const Kreis = ({ x, y, d, farbe = F.orange, s = 1 }) => (
  <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", background: farbe, transform: `scale(${s})` }} />
);

/* ---- Motive: jedes fuellt 1080 x 1920, das Wichtige liegt unten ------ */
const Bogenfoto = ({ m, p, ein }) => {
  const rechts = m.seite === "rechts";
  const sp = (x, b = 0) => (rechts ? B - x - b : x);
  return (
    <>
      <Kreis x={sp(640) + (rechts ? -1 : 1) * 30 * p} y={1070 - 50 * p} d={760} s={0.6 + 0.4 * ein(0)} />
      <div style={{ position: "absolute", left: sp(830, 250), bottom: 0, width: 250, height: 560, background: F.petrolD, transform: `translateY(${(1 - ein(4)) * 560}px)` }} />
      <Bogen x={sp(110, 600)} b={600} h={900} farbe={F.petrol} e={ein(2)}><Foto name={m.foto} p={p} /></Bogen>
    </>
  );
};

const Durchgang = ({ m, p, ein }) => (
  <>
    <Bogen x={80} b={920} h={1180} farbe={F.orange} e={ein(0)} />
    <Bogen x={180} b={720} h={1000} farbe={F.sand} e={ein(3)} />
    <Bogen x={280} b={520} h={820} farbe={F.petrol} e={ein(6)} />
    <Bogen x={370} b={340} h={650} farbe={F.nacht} e={ein(9)}><Foto name={m.foto} p={p} /></Bogen>
  </>
);

const Zahl = ({ m, p, ein, frame }) => {
  const ziffern = Number(String(m.wert).replace(/\D/g, "")) || 0;
  const vorsatz = (String(m.wert).match(/^[^\d]+/) || [""])[0].trim();
  const t = interpolate(frame, [m.ab, m.ab + 26], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const da = interpolate(frame, [m.ab - 2, m.ab + 6], [0, 1], CL);
  return (
    <>
      <Kreis x={905 - 20 * p} y={790 + 30 * p} d={110} />
      <Bogen x={140} b={800} h={1100} farbe={F.petrolD} e={ein(0)} />
      <Bogen x={340} b={400} h={330} farbe={F.petrol} e={ein(5)} />
      <div style={{ position: "absolute", left: 140, width: 800, top: 1010, display: "flex", flexDirection: "column", alignItems: "center", opacity: da, transform: `translateY(${(1 - da) * 30}px)` }}>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 40, letterSpacing: "0.2em", color: F.creme }}>{vorsatz}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 230, lineHeight: 1, color: F.orange, fontVariantNumeric: "tabular-nums" }}>{tausender(Math.round(ziffern * t))}</div>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 46, color: F.creme, marginTop: 6, textAlign: "center" }}>{m.zusatz}</div>
        <div style={{ fontFamily: SCHRIFT, fontSize: 27, lineHeight: 1.3, color: F.creme, opacity: 0.9, marginTop: 26, maxWidth: 640, textAlign: "center" }}>{m.quelle}</div>
      </div>
    </>
  );
};

const Kennzahl = ({ m, p, ein }) => (
  <>
    <Bogen x={-60} b={460} h={640} farbe={F.petrol} e={ein(4)} />
    <Bogen x={700} b={460} h={900} farbe={F.sand} e={ein(6)} />
    <div style={{ position: "absolute", left: 170, top: 870 - 30 * p, width: 740, height: 740, borderRadius: "50%", background: F.orange, transform: `scale(${0.5 + 0.5 * ein(0)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 330, lineHeight: 0.92, color: F.nacht }}>{m.wert}</div>
      <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: m.einheit.length > 10 ? 50 : 72, color: F.nacht, textAlign: "center", maxWidth: 560, lineHeight: 1.1 }}>{m.einheit}</div>
    </div>
  </>
);

const SAEULENFARBE = { petrol: [F.petrolD, F.creme], petrolhell: [F.petrol, F.creme], orange: [F.orange, F.nacht], sand: [F.sand, F.nacht] };
const Saeulen = ({ m, ein }) => {
  const n = m.saeulen.length, luecke = 40, b = (B - 2 * ZONE.seite - (n - 1) * luecke) / n;
  return (
    <>
      {m.saeulen.map((s, i) => {
        const [flaeche, schrift] = SAEULENFARBE[s.farbe] || SAEULENFARBE.petrol;
        const h = 620 + s.h * 500;
        return (
          <Bogen key={i} x={ZONE.seite + i * (b + luecke)} b={b} h={h} farbe={flaeche} e={ein(i * 5)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: Math.min(b * 0.46, 190) }}>
              {s.gross === "haken"
                ? <svg width={b * 0.42} height={b * 0.42} viewBox="0 0 24 24" fill="none" stroke={schrift} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" /></svg>
                : <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: Math.min(n === 2 ? 118 : 150, (b * 1.55) / Math.max(2.4, s.gross.length)), lineHeight: 1, color: schrift }}>{s.gross}</div>}
              <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: n === 2 ? 34 : 27, letterSpacing: "0.06em", textTransform: "uppercase", color: schrift, textAlign: "center", maxWidth: b - 30 }}>{s.klein}</div>
            </div>
          </Bogen>
        );
      })}
    </>
  );
};

const Landschaft = ({ p, ein }) => (
  <svg viewBox={`0 0 ${B} ${H}`} width={B} height={H} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
    <circle cx={760} cy={1120 - 150 * p - 80 * ein(0)} r={170} fill={F.orange} />
    <g transform={`translate(${-20 * p} 0)`}><path d="M-120 1330 L150 1040 L330 1230 L560 900 L800 1250 L960 1110 L1200 1300 V1920 H-120 Z" fill={F.dunst} /></g>
    <g transform={`translate(${-45 * p} 0)`}><path d="M-120 1470 L160 1340 L470 1490 L740 1310 L1240 1520 V1920 H-120 Z" fill={F.petrol} /></g>
    <g transform={`translate(${-75 * p} 0)`}><path d="M-120 1600 C150 1500 420 1660 660 1570 C860 1500 1000 1560 1260 1520 V1920 H-120 Z" fill={F.petrolD} /></g>
    <path d={`M${B} 620 L${B} 1050 L260 ${H} L-80 ${H} Z`} fill={F.creme} opacity={0.2} />
    <g transform={`translate(${-110 * p} 0)`}>
      <path d="M-120 1760 C260 1650 620 1800 1300 1690 V1920 H-120 Z" fill={F.nacht} />
      <path d="M430 1920 C520 1800 430 1750 590 1690" fill="none" stroke={F.creme} strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(600 1560)">
        <circle cx="0" cy="0" r="17" fill={F.nacht} />
        <rect x="-16" y="22" width="32" height="64" rx="6" fill={F.nacht} />
        <rect x="-34" y="24" width="20" height="44" rx="5" fill={F.orange} />
        <path d="M-8 86 v34 M9 86 v34" stroke={F.nacht} strokeWidth="9" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

const Tisch = ({ p, ein }) => (
  <div style={{ position: "absolute", left: 0, top: 800, width: B, height: 1120, transform: `rotate(${-2 + 4 * p}deg) scale(${0.86 + 0.14 * ein(0)})`, transformOrigin: "540px 520px" }}>
    <div style={{ position: "absolute", left: 80, top: 60, width: 920, height: 920, borderRadius: "50%", background: F.sand }} />
    <div style={{ position: "absolute", left: 230, top: 190, width: 400, height: 540, background: F.creme, transform: "rotate(-10deg)", boxSizing: "border-box", padding: "70px 54px", display: "flex", flexDirection: "column", gap: 30 }}>
      <div style={{ height: 22, width: "60%", background: F.petrolD }} />
      <div style={{ height: 8, background: F.dunst }} />
      <div style={{ height: 8, background: F.dunst }} />
      <div style={{ height: 8, width: "80%", background: F.dunst }} />
      <div style={{ height: 58, width: "54%", background: F.orange, marginTop: 22 }} />
      <div style={{ height: 8, background: F.dunst }} />
      <div style={{ height: 8, width: "70%", background: F.dunst }} />
    </div>
    <div style={{ position: "absolute", left: 540, top: 520, width: 360, height: 260, overflow: "hidden", transform: "rotate(14deg)" }}>
      <Img src={foto("umschlag")} style={{ position: "absolute", left: -70, top: -130, width: 500, height: 548, objectFit: "cover", filter: "grayscale(1) contrast(1.1)" }} />
    </div>
    <div style={{ position: "absolute", left: 660, top: 160, width: 200, height: 200, borderRadius: "50%", background: F.orange }} />
    <div style={{ position: "absolute", left: 700, top: 200, width: 120, height: 120, borderRadius: "50%", background: F.nacht }} />
    <div style={{ position: "absolute", left: 170, top: 800, width: 330, height: 22, borderRadius: 11, background: F.nacht, transform: "rotate(-32deg)" }} />
  </div>
);

const MOTIV = { bogenfoto: Bogenfoto, durchgang: Durchgang, zahl: Zahl, kennzahl: Kennzahl, saeulen: Saeulen, landschaft: Landschaft, tisch: Tisch };
/* Punkt, in den die Kamera am Szenenende faehrt. */
const tor = (m) => ({ bogenfoto: [m.seite === "rechts" ? 670 : 410, 1480], durchgang: [540, 1560], zahl: [540, 1760], kennzahl: [540, 1230], saeulen: [540, 1500], landschaft: [760, 1000], tisch: [540, 1320] }[m.art] || [540, 1400]);

/* ---- Schrift -------------------------------------------------------- */
const Markenzeile = ({ hell }) => (
  <div style={{ position: "absolute", left: ZONE.seite, top: 176, display: "flex", alignItems: "center", gap: 16 }}>
    <svg width="40" height="40" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill={hell ? F.petrolD : F.creme} /><path d="M41 20h18v21h21v18H59v21H41V59H20V41h21z" fill={hell ? F.creme : F.petrolD} /></svg>
    <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 25, letterSpacing: "0.16em", color: hell ? F.nacht : F.creme }}>SWISSPREMIA.CH</div>
  </div>
);

const Textblock = ({ text, hell, sofort, verz = 0 }) => {
  const frame = useCurrentFrame();
  const da = sofort ? 1 : interpolate(frame, [verz, verz + 7], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const laenge = text.replace(/\*\*/g, "").length;
  const groesse = laenge <= 34 ? 106 : laenge <= 58 ? 92 : laenge <= 84 ? 80 : 70;
  const marke = hell
    ? { background: F.orange, color: F.nacht, padding: "0 0.12em", borderRadius: 8, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }
    : { color: F.orange };
  return (
    <div style={{ position: "absolute", left: ZONE.seite, right: ZONE.seite, top: 266, fontFamily: SERIF, fontWeight: 600, fontSize: groesse, lineHeight: 1.1, letterSpacing: "-0.012em", color: hell ? F.nacht : F.creme, opacity: da, transform: `translateY(${(1 - da) * 26}px)`, textWrap: "balance" }}>
      {text.replace(/CHF /g, "CHF\u00a0").split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((teil, i) => (teil.startsWith("**") ? <span key={i} style={marke}>{teil.slice(2, -2)}</span> : <span key={i}>{teil}</span>))}
    </div>
  );
};

/* ---- Szene ---------------------------------------------------------- */
const Szene = ({ sz, erste }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dauer = sz.bis - sz.von;
  const m = sz.motiv;
  const Motiv = MOTIV[m.art] || Landschaft;
  const hell = istHell(m.art);
  const ein = (verz = 0) => (erste ? 1 : spring({ frame: frame - 2 - verz, fps, config: { damping: 200 }, durationInFrames: 22 }));
  const p = interpolate(frame, [0, dauer + UEBER], [0, 1], CL);
  const raus = interpolate(frame, [dauer, dauer + UEBER], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  const rein = erste ? 1 : interpolate(frame, [0, 14], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const [tx, ty] = tor(m);
  return (
    <AbsoluteFill style={{ background: GRUND[m.art] || F.sand, transform: `scale(${(1.14 - 0.14 * rein) * (1 + raus * 3.4)})`, transformOrigin: `${tx}px ${ty}px`, opacity: 1 - interpolate(frame, [dauer + 3, dauer + UEBER], [0, 1], CL), overflow: "hidden" }}>
      <Motiv m={m} p={p} ein={ein} frame={frame} />
      {hell && m.art !== "landschaft" ? <div style={{ position: "absolute", left: 0, bottom: 0, width: B, height: 0, borderTop: `0 solid ${F.boden}` }} /> : null}
      <Markenzeile hell={hell} />
      {/* Der Text raeumt das Feld, bevor die naechste Szene durchs Tor sichtbar wird. */}
      <AbsoluteFill style={{ opacity: 1 - interpolate(frame, [dauer - 3, dauer + 2], [0, 1], CL) }}>
        {sz.bloecke.map((b, i) => (
          <Sequence key={i} from={b.von} durationInFrames={Math.max(1, b.bis - b.von)} layout="none">
            <Textblock text={b.t} hell={hell} sofort={erste && i === 0} verz={i === 0 ? 5 : 0} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---- Abbinder: die Sonne geht hinter dem Berg auf -------------------- */
const Abbinder = ({ abbinder }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = (verz) => spring({ frame: frame - verz, fps, config: { damping: 200 }, durationInFrames: 26 });
  const rein = interpolate(frame, [0, 14], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const p = interpolate(frame, [0, 120], [0, 1], CL);
  return (
    <AbsoluteFill style={{ background: F.sand, transform: `scale(${1.14 - 0.14 * rein})`, transformOrigin: "540px 1400px", overflow: "hidden" }}>
      <Kreis x={540} y={1640 - 300 * e(4) - 30 * p} d={760} />
      <Bogen x={210} b={660} h={640} farbe={F.petrol} e={e(0)}><Foto name={abbinder.foto} p={p} position="50% 40%" /></Bogen>
      <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", flexDirection: "column", alignItems: "center", opacity: e(6), transform: `translateY(${(1 - e(6)) * 30}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill={F.petrolD} /><path d="M41 20h18v21h21v18H59v21H41V59H20V41h21z" fill={F.creme} /></svg>
          <div style={{ fontFamily: SCHRIFT, fontSize: 62, color: F.nacht, letterSpacing: "-0.01em" }}>Swiss<span style={{ fontWeight: 700 }}>Premia</span></div>
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 124, lineHeight: 1.04, color: F.petrolD, textAlign: "center", marginTop: 44 }}>Alle Kassen.<br />1 Minute.</div>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 500, fontSize: 32, color: F.nacht, marginTop: 30 }}>Offizielle Prämien 2027 · kostenlos · ohne Anmeldung</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", opacity: e(14), transform: `scale(${0.9 + 0.1 * e(14)})` }}>
        <div style={{ padding: "24px 58px", borderRadius: 999, background: F.nacht, color: F.creme, fontFamily: SCHRIFT, fontWeight: 600, fontSize: 46 }}>Link im Profil</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1536, display: "flex", justifyContent: "center", opacity: e(14) }}>
        <div style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(20,33,44,0.78)", color: F.creme, fontFamily: SCHRIFT, fontSize: 23 }}>Stimme KI-generiert · Beispielrechnungen, keine Beratung</div>
      </div>
    </AbsoluteFill>
  );
};

const MUSIK_EIN = 8, MUSIK_AUS = 30;

export const Durchblick = ({ reel }) => {
  const { gesamt, szenen, abbinder } = reel;
  return (
    <AbsoluteFill style={{ backgroundColor: F.sand }}>
      <Sequence from={abbinder.von} durationInFrames={Math.max(1, gesamt - abbinder.von)} name="Abbinder">
        <Abbinder abbinder={abbinder} />
      </Sequence>
      {/* Rueckwaerts: die fruehere Szene liegt oben und gibt beim Hineinfahren die naechste frei. */}
      {szenen.map((sz, i) => ({ sz, i })).reverse().map(({ sz, i }) => (
        <Sequence key={i} from={sz.von} durationInFrames={sz.bis - sz.von + UEBER} name={`Szene ${i + 1} ${sz.motiv.art}`}>
          <Szene sz={sz} erste={i === 0} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.5, pointerEvents: "none" }}>
        <Img src={staticFile("durchblick/korn.png")} style={{ width: B, height: H, imageRendering: "pixelated" }} />
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
export const DURCHBLICK_BEISPIEL = {
  id: "beispiel", gesamt: 150, ton: null, musik: null,
  szenen: [{ von: 0, bis: 110, motiv: { art: "landschaft" }, bloecke: [{ von: 0, bis: 120, t: "Selten krank? Dann verschenken Sie vielleicht **Geld**." }] }],
  abbinder: { von: 110, foto: "berg" }
};
