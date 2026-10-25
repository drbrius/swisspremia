import React, { createContext, useContext } from "react";
import { AbsoluteFill, Img, staticFile, random, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { noise2D } from "@remotion/noise";
import { MARKE } from "./reels.js";
import { SCHRIFT, ZONE, Kreuz } from "./Marke.jsx";
import { bildDatei } from "./bilder.js";

/* =========================================================================
   Gemeinsame Bausteine. Alles, was eine Szene lebendig macht, sitzt hier:
   driftender Hintergrund mit Partikeln, Fotoebene mit Ken-Burns-Fahrt,
   Kamerafahrt, kinetische Typografie mit Maske und Marker, rollende
   Ziffern, Funken, Schweben, Puls.
   ========================================================================= */

/* Foto der aktuellen Szene (Name aus src/bilder.js) – Reel.jsx setzt es,
   Buehne liest es. So muss keine Szene selbst davon wissen. */
export const BildKontext = createContext(null);

/* Laenge der aktuellen Szene in Frames (aus der Tonspur). Damit laufen
   Kamerafahrt und Ken-Burns ueber die ganze Szene, und die Woerter
   erscheinen im Sprechtempo statt alle in der ersten Sekunde. */
export const SzenenKontext = createContext({ frames: 120 });
export const useSzenenFrames = () => useContext(SzenenKontext).frames;

/* Abstand zwischen zwei Woertern, so dass "anzahl" Woerter ab Frame "ab"
   bis etwa drei Viertel der Szene erschienen sind – ungefaehr im Takt der
   Stimme. Nie hektischer als 3 und nie zaeher als 12 Frames je Wort. */
export const useSprechschritt = (anzahl, ab = 6, min = 3, max = 12) => {
  const frames = useSzenenFrames();
  const verfuegbar = Math.max(20, frames * 0.74 - ab);
  return Math.max(min, Math.min(max, Math.floor(verfuegbar / Math.max(1, anzahl))));
};
export const woerterZaehlen = (zeilen = []) => zeilen.join(" ").replace(/\*\*/g, "").split(/\s+/).filter(Boolean).length;

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

/* Textzeile Wort fuer Wort: jedes Wort steigt federnd aus einer Maske auf
   (kinetische Typografie). **so** markierte Woerter kommen in der
   Akzentfarbe, mit einem Marker, der sich von links hinter das Wort zieht. */
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const auf = spring({ frame: frame - ab, fps, config: { damping: 14, stiffness: 150, mass: 0.8 } });
  const sicht = interpolate(frame, [ab, ab + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const marker = useAnteil(ab + dauer * 0.6, ab + dauer * 0.6 + 12, Easing.inOut(Easing.cubic));
  return (
    /* Maske: das Wort steigt von unten herein; Polster, damit g, p, y nicht abgeschnitten werden. */
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.06em 0.04em 0.14em", margin: "-0.06em -0.04em -0.14em" }}>
      <span style={{
        display: "inline-block", position: "relative", opacity: sicht,
        transform: `translateY(${(1 - auf) * 110}%) rotate(${(1 - Math.min(1, auf)) * 6}deg)`, transformOrigin: "left bottom",
        color: fett ? akzent : undefined, fontWeight: fett ? 600 : undefined
      }}>
        {fett && <span style={{
          position: "absolute", left: "-0.1em", right: "-0.1em", top: "22%", bottom: "4%", borderRadius: 8,
          backgroundColor: akzent, opacity: 0.22, transform: `scaleX(${marker})`, transformOrigin: "left center"
        }} />}
        <span style={{ position: "relative" }}>{text}</span>
      </span>
    </span>
  );
};

/* Ziffern, die wie ein Zaehlwerk auf ihren Wert rollen – Spalte fuer
   Spalte leicht versetzt. Nicht-Ziffern (Punkt, Apostroph) stehen fest. */
export const Rollziffern = ({ text, ab = 0, dauer = 26 }) => {
  const frame = useCurrentFrame();
  const zeichen = String(text).split("");
  let spalte = 0;
  return (
    <span style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums" }}>
      {zeichen.map((z, i) => {
        if (!/\d/.test(z)) return <span key={i}>{z}</span>;
        const ziel = Number(z) + 10;   // eine volle Runde, dann die Ziffer
        const start = ab + spalte++ * 4;
        const t = interpolate(frame, [start, start + dauer], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const pos = t * ziel;
        return (
          <span key={i} style={{ display: "inline-block", height: "1em", lineHeight: 1, overflow: "hidden", position: "relative" }}>
            <span style={{ display: "block", transform: `translateY(${-pos}em)` }}>
              {Array.from({ length: 21 }, (_, k) => <span key={k} style={{ display: "block", height: "1em" }}>{k % 10}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/* Funken: kurze Striche, die einmal sternfoermig auseinanderfliegen –
   der "Aufschlag" einer Zahl. */
export const Funken = ({ farbe, ab = 0, anzahl = 12, radius = 340 }) => {
  const t = useAnteil(ab, ab + 20, Easing.out(Easing.quad));
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={radius * 2} height={radius * 2} viewBox={`${-radius} ${-radius} ${radius * 2} ${radius * 2}`}
      style={{ position: "absolute", pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: anzahl }, (_, i) => {
        const w = (i / anzahl) * Math.PI * 2 + 0.3;
        const r1 = radius * (0.45 + t * 0.45), r2 = r1 + 50 * (1 - t);
        return <line key={i} x1={Math.cos(w) * r1} y1={Math.sin(w) * r1} x2={Math.cos(w) * r2} y2={Math.sin(w) * r2}
          stroke={farbe} strokeWidth={7 * (1 - t) + 1} strokeLinecap="round" opacity={1 - t} />;
      })}
    </svg>
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
      <Ringe farben={farben} />
      <Partikel farben={farben} />
      <div style={{
        position: "absolute", left: `${band}%`, top: -400, width: 260, height: 2800, transform: "rotate(22deg)",
        background: `linear-gradient(90deg, transparent, ${dunkel ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.5)"}, transparent)`
      }} />
    </AbsoluteFill>
  );
};

/* Kleine Kreuze und Punkte, die langsam aufsteigen und dabei organisch
   pendeln (Perlin-Rauschen) – der Hintergrund steht nie still. */
const Partikel = ({ farben, anzahl = 18 }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const dunkel = farben.fläche !== MARKE.creme;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: anzahl }, (_, i) => {
        const x0 = random("px" + i) * 1080, y0 = random("py" + i) * (height + 200);
        const tempo = 0.6 + random("pt" + i) * 1.2;
        const groesse = 14 + random("pg" + i) * 26;
        const y = ((y0 - frame * tempo) % (height + 200) + height + 200) % (height + 200) - 100;
        const x = x0 + noise2D("nx" + i, frame / 140, i) * 60;
        const dreh = noise2D("nr" + i, frame / 200, 0) * 40;
        const kreuz = i % 3 === 0;
        const deckkraft = (dunkel ? 0.10 : 0.14) * (0.6 + random("po" + i) * 0.8);
        const farbe = i % 4 === 0 ? farben.akzent : (dunkel ? "#ffffff" : MARKE.petrol);
        return kreuz ? (
          <svg key={i} width={groesse} height={groesse} viewBox="0 0 10 10"
            style={{ position: "absolute", left: x, top: y, opacity: deckkraft, transform: `rotate(${dreh}deg)` }}>
            <rect x="4" y="1" width="2" height="8" fill={farbe} /><rect x="1" y="4" width="8" height="2" fill={farbe} />
          </svg>
        ) : (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: groesse * 0.4, height: groesse * 0.4, borderRadius: "50%", backgroundColor: farbe, opacity: deckkraft }} />
        );
      })}
    </AbsoluteFill>
  );
};

/* Zwei duenne Ringe, die sich gegenlaeufig drehen – geometrische Tiefe. */
const Ringe = ({ farben }) => {
  const frame = useCurrentFrame();
  const dunkel = farben.fläche !== MARKE.creme;
  const linie = dunkel ? "rgba(255,255,255,.07)" : "rgba(0,87,134,.08)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1400" height="1400" viewBox="-700 -700 1400 1400" style={{ position: "absolute", left: 380, top: -420, transform: `rotate(${frame * 0.25}deg)` }}>
        <circle r="560" fill="none" stroke={linie} strokeWidth="3" strokeDasharray="4 22" />
        <circle r="430" fill="none" stroke={linie} strokeWidth="2" />
      </svg>
      <svg width="1100" height="1100" viewBox="-550 -550 1100 1100" style={{ position: "absolute", left: -560, top: 1180, transform: `rotate(${-frame * 0.35}deg)` }}>
        <circle r="480" fill="none" stroke={linie} strokeWidth="3" strokeDasharray="60 30" />
      </svg>
    </AbsoluteFill>
  );
};

/* Foto als Hintergrund: langsame Ken-Burns-Fahrt (Zoom und Schwenk, je
   Bild in eine andere Richtung), darueber dunkle Verlaufsschicht in
   Markenfarben, damit weisse Schrift sicher lesbar bleibt. */
const Fotoebene = ({ name }) => {
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const richtung = random("kb" + name) > 0.5 ? 1 : -1;
  const zoom = interpolate(frame, [0, frames], [1.16, 1.02], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const schwenk = interpolate(frame, [0, frames], [0, 50 * richtung], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(bildDatei(name))} style={{
        position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${zoom}) translateX(${schwenk}px)`
      }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,68,106,.62) 0%, rgba(33,45,57,.52) 38%, rgba(33,45,57,.58) 62%, rgba(20,28,36,.88) 100%)" }} />
    </AbsoluteFill>
  );
};

/* Buehne: Hintergrund (Farbe oder Foto) und der Inhalt in der sicheren
   Zone. Der Inhalt bekommt eine langsame Kamerafahrt (Zoom), damit
   auch eine stehende Zeile lebt. */
export const Buehne = ({ farben, children, ausrichtung = "center" }) => {
  const bild = useContext(BildKontext);
  const frame = useCurrentFrame();
  const frames = useSzenenFrames();
  const fahrt = interpolate(frame, [0, frames], [1, 1.06], { extrapolateRight: "clamp" });
  const neigung = Math.sin(frame / 55) * 0.35;
  return (
    <AbsoluteFill style={{ backgroundColor: farben.fläche, fontFamily: SCHRIFT, color: farben.text }}>
      {bild ? <><Fotoebene name={bild} /><Partikel farben={farben} anzahl={8} /></> : <Hintergrund farben={farben} />}
      <div style={{
        position: "absolute", left: ZONE.seite, right: ZONE.seite, top: ZONE.oben, bottom: ZONE.unten,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: ausrichtung,
        textAlign: ausrichtung === "center" ? "center" : "left",
        transform: `scale(${fahrt}) rotate(${neigung}deg)`,
        textShadow: bild ? "0 2px 24px rgba(0,0,0,.35)" : undefined
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

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

/* Textzeilen unter einer Grafik – Wort fuer Wort, im Sprechtempo. */
export const Unterzeilen = ({ text = [], farben, ab = 30, groesse = 72 }) => {
  const schritt = useSprechschritt(woerterZaehlen(text), ab, 3, 9);
  let vorher = 0;
  return (
    <div style={{ marginTop: 56 }}>
      {text.map((zeile, i) => {
        const start = ab + vorher * schritt;
        vorher += woerterZaehlen([zeile]);
        return (
          <div key={i} style={{ fontSize: groesse, lineHeight: 1.18, fontWeight: 300 }}>
            <Woerter text={zeile} akzent={farben.akzent} ab={start} schritt={schritt} />
          </div>
        );
      })}
    </div>
  );
};

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
