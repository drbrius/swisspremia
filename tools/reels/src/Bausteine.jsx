import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { MARKE } from "./reels.js";
import { SCHRIFT, ZONE, Kreuz } from "./Marke.jsx";

/* =========================================================================
   Gemeinsame Bausteine. Alles, was eine Szene lebendig macht, sitzt hier:
   driftender Hintergrund, Wort-fuer-Wort-Typografie, Schweben, Puls.
   ========================================================================= */

/* 0..1 zwischen zwei Frames, weich auslaufend. */
export const useAnteil = (von, bis, easing = Easing.out(Easing.cubic)) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [von, bis], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
};

/* Federnd von 0 auf 1, ab einem Frame. */
export const useFeder = (ab = 0, config = { damping: 14, stiffness: 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - ab, fps, config });
};

/* Sanftes Auf und Ab, nie still. Amplitude in Pixel, Tempo in Sekunden je Welle. */
export const useSchweben = (amplitude = 8, sekunden = 3, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps / sekunden) * 2 * Math.PI + phase) * amplitude;
};

/* Puls 0.85..1 fuer Ringe und Hervorhebungen. */
export const usePuls = (sekunden = 1.6, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return 0.925 + Math.sin((frame / fps / sekunden) * 2 * Math.PI + phase) * 0.075;
};

/* Einblenden mit Anheben, Schaerfe-Einzug und leichtem Wachsen. */
export const useEinblenden = (verzoegerung = 0, dauer = 14) => {
  const t = useAnteil(verzoegerung, verzoegerung + dauer);
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * 44}px) scale(${0.96 + t * 0.04})`,
    filter: `blur(${(1 - t) * 14}px)`
  };
};

/* Textzeile Wort fuer Wort. **so** markierte Woerter kommen in der Akzentfarbe
   und bekommen eine Linie, die sich von links aufzieht. */
export const Woerter = ({ text, akzent, ab = 0, schritt = 4, dauer = 12 }) => {
  const teile = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  let index = 0;
  return (
    <>
      {teile.map((teil, ti) => {
        const fett = teil.startsWith("**");
        const woerter = (fett ? teil.slice(2, -2) : teil).split(/(\s+)/);
        return woerter.map((w, wi) => {
          if (/^\s+$/.test(w)) return <span key={ti + "-" + wi}>{w}</span>;
          if (!w) return null;
          const i = index++;
          return <Wort key={ti + "-" + wi} text={w} fett={fett} akzent={akzent} ab={ab + i * schritt} dauer={dauer} />;
        });
      })}
    </>
  );
};

const Wort = ({ text, fett, akzent, ab, dauer }) => {
  const stil = useEinblenden(ab, dauer);
  const linie = useAnteil(ab + dauer, ab + dauer + 10);
  return (
    <span style={{ display: "inline-block", position: "relative", ...stil, color: fett ? akzent : undefined, fontWeight: fett ? 600 : undefined }}>
      {text}
      {fett && <span style={{ position: "absolute", left: 0, bottom: -6, height: 6, width: `${linie * 100}%`, backgroundColor: akzent, borderRadius: 3, opacity: .9 }} />}
    </span>
  );
};

/* Fuer Stellen, die keine Wortanimation wollen. */
export const Zeile = ({ text, akzent }) => {
  const teile = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {teile.map((t, i) =>
        t.startsWith("**")
          ? <span key={i} style={{ color: akzent, fontWeight: 600 }}>{t.slice(2, -2)}</span>
          : <span key={i}>{t}</span>
      )}
    </>
  );
};

/* Lebender Hintergrund: drei weiche Farbflaechen, die langsam driften,
   dazu ein schraeges Lichtband, das einmal pro Szene durchlaeuft. */
const Hintergrund = ({ farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dunkel = farben.fläche !== MARKE.creme;
  const a = dunkel ? .22 : .16;
  const Fleck = ({ x, y, r, farbe, tempo, phase }) => (
    <div style={{
      position: "absolute", left: x + Math.sin(t / tempo + phase) * 70, top: y + Math.cos(t / (tempo * 1.3) + phase) * 60,
      width: r, height: r, borderRadius: "50%", background: `radial-gradient(circle, ${farbe} 0%, transparent 70%)`, opacity: a
    }} />
  );
  const band = interpolate(frame, [0, fps * 2.4], [-60, 160], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fleck x={-300} y={-200} r={1100} farbe={dunkel ? MARKE.petrol : MARKE.gold} tempo={4.2} phase={0} />
      <Fleck x={400} y={900} r={1000} farbe={dunkel ? MARKE.gold : MARKE.petrol} tempo={5.1} phase={2} />
      <Fleck x={-100} y={1300} r={900} farbe={dunkel ? "#2f5785" : MARKE.petrol} tempo={3.6} phase={4} />
      <div style={{
        position: "absolute", left: `${band}%`, top: -400, width: 260, height: 2800, transform: "rotate(22deg)",
        background: `linear-gradient(90deg, transparent, ${dunkel ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.5)"}, transparent)`
      }} />
    </AbsoluteFill>
  );
};

export const Buehne = ({ farben, children, ausrichtung = "center" }) => (
  <AbsoluteFill style={{ backgroundColor: farben.fläche, fontFamily: SCHRIFT, color: farben.text }}>
    <Hintergrund farben={farben} />
    <div style={{
      position: "absolute", left: ZONE.seite, right: ZONE.seite, top: ZONE.oben, bottom: ZONE.unten,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: ausrichtung,
      textAlign: ausrichtung === "center" ? "center" : "left"
    }}>
      {children}
    </div>
  </AbsoluteFill>
);

/* Kleines Markenzeichen, knapp innerhalb der sicheren Zone, gleitet herein. */
export const Ecke = ({ farben }) => {
  const stil = useEinblenden(2, 12);
  return (
    <div style={{ position: "absolute", top: ZONE.oben + 10, left: ZONE.seite, display: "flex", alignItems: "center", gap: 18, ...stil }}>
      <Kreuz groesse={44} farbe={farben.akzent === MARKE.gold ? MARKE.gold : MARKE.petrol} kreuz={farben.akzent === MARKE.gold ? MARKE.slate : MARKE.weiss} />
      <div style={{ fontSize: 26, letterSpacing: ".18em", textTransform: "uppercase", color: farben.leise, fontWeight: 500 }}>SwissPremia</div>
    </div>
  );
};

/* Textzeilen unter einer Grafik – Wort fuer Wort. */
export const Unterzeilen = ({ text = [], farben, ab = 30, groesse = 72 }) => (
  <div style={{ marginTop: 56 }}>
    {text.map((zeile, i) => (
      <div key={i} style={{ fontSize: groesse, lineHeight: 1.18, fontWeight: 300 }}>
        <Woerter text={zeile} akzent={farben.akzent} ab={ab + i * 10} schritt={3} />
      </div>
    ))}
  </div>
);

/* Haken: Strich zieht sich auf, dann ein kurzer Ueberschwinger. */
export const Haken = ({ groesse = 60, farbe, ab = 0, dauer = 12 }) => {
  const t = useAnteil(ab, ab + dauer);
  const pop = useFeder(ab + dauer - 2, { damping: 8, stiffness: 220 });
  const laenge = 60;
  return (
    <svg width={groesse} height={groesse} viewBox="0 0 40 40" style={{ transform: `scale(${1 + (1 - Math.min(1, pop)) * 0.25})` }}>
      <path d="M8 21 L17 30 L33 11" fill="none" stroke={farbe} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={laenge} strokeDashoffset={laenge * (1 - t)} />
    </svg>
  );
};

/* Pulsender Ring hinter grossen Zahlen. */
export const Pulsring = ({ farbe, groesse = 760, ab = 0 }) => {
  const puls = usePuls(1.8);
  const auf = useFeder(ab, { damping: 16, stiffness: 90 });
  return (
    <div style={{
      position: "absolute", width: groesse, height: groesse, borderRadius: "50%", border: `3px solid ${farbe}`,
      opacity: .35 * auf, transform: `scale(${puls * auf})`, pointerEvents: "none"
    }} />
  );
};

/* Ping: ein Ring, der sich einmal ausbreitet und verblasst. */
export const Ping = ({ farbe, ab = 0, groesse = 400 }) => {
  const t = useAnteil(ab, ab + 28, Easing.out(Easing.quad));
  return (
    <div style={{
      position: "absolute", width: groesse, height: groesse, borderRadius: "50%", border: `4px solid ${farbe}`,
      opacity: (1 - t) * .7, transform: `scale(${0.6 + t * 1.4})`, pointerEvents: "none"
    }} />
  );
};

/* Fortschrittsstrich am unteren Rand der sicheren Zone. */
export const Fortschritt = ({ gesamt, farbe }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: ZONE.seite, right: ZONE.seite, bottom: ZONE.unten - 40, height: 4, backgroundColor: "rgba(128,128,128,.25)", borderRadius: 2 }}>
      <div style={{ width: `${(frame / gesamt) * 100}%`, height: "100%", backgroundColor: farbe, borderRadius: 2 }} />
    </div>
  );
};
