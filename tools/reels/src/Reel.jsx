import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { MARKE } from "./reels.js";
import { HINTERGRUND, Kreuz, Wortmarke, chf } from "./Marke.jsx";
import { Buehne, BildKontext, SzenenKontext, useSprechschritt, woerterZaehlen, Ecke, Woerter, Rollziffern, Funken, Pulsring, Ping, Fortschritt, useEinblenden, useFeder, useSchweben, usePuls, useAnteil } from "./Bausteine.jsx";
import { GRAFIK } from "./Grafik.jsx";
import { UEBERGANG, szenenStarts, gesamtFrames, streuwert } from "./takt.js";

/* ------------------------------------------------------- Textszenen */

const Titel = ({ s, farben }) => {
  const symbol = useFeder(0, { damping: 10, stiffness: 140 });
  const schweb = useSchweben(10, 3.2);
  /* Woerter im Sprechtempo: ueber die Szene verteilt statt alle auf einmal. */
  const anzahl = woerterZaehlen(s.text);
  const schritt = useSprechschritt(anzahl, 6, 4, 12);
  let vorher = 0;
  const zeilen = s.text.map((zeile) => { const ab = 6 + vorher * schritt; vorher += woerterZaehlen([zeile]); return ab; });
  return (
    <Buehne farben={farben}>
      {s.symbol && (
        <div style={{ fontSize: 150, lineHeight: 1, marginBottom: 40, color: farben.akzent, transform: `scale(${symbol}) translateY(${schweb}px)` }}>{s.symbol}</div>
      )}
      {s.text.map((zeile, i) => (
        <div key={i} style={{ fontSize: 92, lineHeight: 1.14, fontWeight: 300, letterSpacing: "-0.01em" }}>
          <Woerter text={zeile} akzent={farben.akzent} ab={zeilen[i]} schritt={schritt} />
        </div>
      ))}
      {s.klein && (
        <div style={{ marginTop: 44, fontSize: 36, color: farben.leise, fontWeight: 400, ...useEinblenden(6 + anzahl * schritt + 4) }}>{s.klein}</div>
      )}
    </Buehne>
  );
};

const Zahl = ({ s, farben }) => {
  const fall = useFeder(0, { damping: 12, stiffness: 130, mass: .9 });
  const schweb = useSchweben(6, 2.8);
  return (
    <Buehne farben={farben}>
      <Pulsring farbe={farben.akzent} ab={6} />
      <Funken farbe={farben.akzent} ab={16} radius={380} />
      {s.oben && <div style={{ fontSize: 44, color: farben.leise, marginBottom: 30, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ fontSize: 360, fontWeight: 600, lineHeight: 1, color: farben.akzent, transform: `translateY(${(1 - fall) * -260 + schweb}px) scale(${0.8 + fall * 0.2})`, opacity: Math.min(1, fall * 1.4) }}>
        <Rollziffern text={s.zahl} ab={2} />
      </div>
      <div style={{ fontSize: 84, fontWeight: 300, marginTop: 24 }}>
        <Woerter text={s.wort} akzent={farben.akzent} ab={12} schritt={4} />
      </div>
    </Buehne>
  );
};

const Zaehler = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ende = Math.round(fps * 1.6);
  const wert = interpolate(frame, [6, ende], [s.von, s.bis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const ueber = useFeder(ende - 4, { damping: 9, stiffness: 200 });
  return (
    <Buehne farben={farben}>
      <Ping farbe={farben.akzent} ab={ende - 2} groesse={620} />
      <Funken farbe={farben.akzent} ab={ende - 2} radius={440} anzahl={14} />
      {s.oben && <div style={{ fontSize: 56, fontWeight: 300, marginBottom: 36, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ fontSize: 230, fontWeight: 600, lineHeight: 1, color: farben.akzent, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + (1 - Math.min(1, ueber)) * 0.12})` }}>
        {s.praefix ? <span style={{ fontSize: 110, fontWeight: 300, marginRight: 24, color: farben.text }}>{s.praefix}</span> : null}
        {chf(wert)}
      </div>
      {s.unten && <div style={{ fontSize: 56, fontWeight: 300, marginTop: 36 }}><Woerter text={s.unten} akzent={farben.akzent} ab={Math.round(fps * 1.4)} /></div>}
    </Buehne>
  );
};

const Zwei = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ende = Math.round(fps * 1.4);
  const l = interpolate(frame, [4, ende], [0, s.links.bis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const r = interpolate(frame, [4, ende], [0, s.rechts.bis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const puls = usePuls(1.6);
  const Kreis = ({ praefix, wert, akzent, phase }) => {
    const auf = useFeder(akzent ? 0 : 6, { damping: 12, stiffness: 110 });
    const schweb = useSchweben(10, 3, phase);
    return (
      <div style={{
        width: 400, height: 400, borderRadius: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: `6px solid ${akzent ? farben.akzent : farben.leise}`, color: akzent ? farben.akzent : farben.text,
        transform: `scale(${auf * (akzent ? puls : 1)}) translateY(${schweb}px)`,
        boxShadow: akzent ? `0 0 ${60 * puls}px ${farben.akzent}44` : "none"
      }}>
        {praefix ? <div style={{ fontSize: 40, fontWeight: 300, opacity: .8 }}>{praefix}</div> : null}
        <div style={{ fontSize: 120, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{chf(wert)}</div>
      </div>
    );
  };
  const vs = useFeder(14, { damping: 9, stiffness: 180 });
  return (
    <Buehne farben={farben}>
      {s.oben && <div style={{ fontSize: 60, fontWeight: 300, marginBottom: 70, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
        <Kreis praefix={s.links.praefix} wert={l} akzent phase={0} />
        <div style={{ fontSize: 80, fontWeight: 300, color: farben.leise, transform: `scale(${vs})` }}>vs</div>
        <Kreis praefix={s.rechts.praefix} wert={r} phase={1.5} />
      </div>
    </Buehne>
  );
};

const Balken = ({ s, farben }) => {
  const puls = usePuls(1.8);
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 54, height: 560, marginBottom: 90 }}>
        {s.balken.map((b, i) => {
          const w = useFeder(i * 8, { damping: 13, stiffness: 100 });
          const schweb = useSchweben(5, 2.6, i);
          const h = Math.max(8, 500 * b.hoehe * w);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, transform: `translateY(${schweb}px)` }}>
              <div style={{ width: 200, height: h, borderRadius: 12, position: "relative", overflow: "hidden",
                backgroundColor: b.gold ? farben.akzent : "rgba(255,255,255,.28)", boxShadow: b.gold ? `0 0 ${50 * puls}px ${farben.akzent}55` : "none" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 22, background: "linear-gradient(180deg, rgba(255,255,255,.35), transparent)" }} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 500, color: b.gold ? farben.akzent : farben.text, ...useEinblenden(i * 8 + 10) }}>{b.label}</div>
            </div>
          );
        })}
      </div>
      {s.text.map((zeile, i) => (
        <div key={i} style={{ fontSize: 76, lineHeight: 1.15, fontWeight: 300 }}><Woerter text={zeile} akzent={farben.akzent} ab={28 + i * 10} /></div>
      ))}
    </Buehne>
  );
};

const Schritte = ({ s, farben }) => (
  <Buehne farben={farben} ausrichtung="flex-start">
    {s.schritte.map((t, i) => {
      const pop = useFeder(6 + i * 22, { damping: 9, stiffness: 170 });
      return (
        <div key={i} style={{ display: "flex", gap: 34, alignItems: "flex-start", marginBottom: 54, ...useEinblenden(6 + i * 22) }}>
          <div style={{ flex: "none", width: 92, height: 92, borderRadius: 46, backgroundColor: farben.akzent, color: farben.fläche, fontSize: 52, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>{i + 1}</div>
          <div style={{ fontSize: 58, lineHeight: 1.2, fontWeight: 300, paddingTop: 10 }}><Woerter text={t} akzent={farben.akzent} ab={10 + i * 22} schritt={3} /></div>
        </div>
      );
    })}
  </Buehne>
);

const Abbinder = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const z = useFeder(0, { damping: 14, stiffness: 110 });
  const ring = useFeder(8, { damping: 18, stiffness: 70 });
  const schimmer = useAnteil(22, 50);
  return (
    <Buehne farben={farben}>
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", border: `2px dashed ${farben.akzent}`, opacity: .45 * ring, transform: `scale(${ring}) rotate(${frame * 0.6}deg)` }} />
      <div style={{ transform: `scale(${.7 + z * .3}) rotate(${(1 - z) * -20}deg)`, opacity: z }}><Kreuz groesse={170} farbe={MARKE.gold} kreuz={MARKE.slate} /></div>
      <div style={{ marginTop: 44, position: "relative", overflow: "hidden", ...useEinblenden(10) }}>
        <Wortmarke groesse={96} />
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 120, left: `${schimmer * 140 - 20}%`, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)", transform: "skewX(-20deg)" }} />
      </div>
      <div style={{ marginTop: 56, fontSize: 60, fontWeight: 500, color: farben.akzent }}><Woerter text={MARKE.url + (s.urlZusatz || "")} akzent={farben.akzent} ab={18} /></div>
      <div style={{ marginTop: 22, fontSize: 36, letterSpacing: ".14em", textTransform: "uppercase", color: farben.leise, ...useEinblenden(28) }}>
        {s.urlZusatz ? "Free · Official federal data" : "Kostenlos · Offizielle BAG-Daten"}
      </div>
    </Buehne>
  );
};

const SZENEN = { titel: Titel, zahl: Zahl, zaehler: Zaehler, zwei: Zwei, balken: Balken, schritte: Schritte, abbinder: Abbinder, ...GRAFIK };

/* --------------------------------------------------- Szenenuebergaenge */

/* Kreisoeffnung: die neue Szene oeffnet sich als wachsender Kreis aus
   der Mitte, die alte tritt dabei leicht zurueck. */
const KreisOeffnung = ({ children, presentationDirection, presentationProgress: p }) =>
  presentationDirection === "exiting"
    ? <AbsoluteFill style={{ transform: `scale(${1 - p * 0.06})`, filter: `brightness(${1 - p * 0.35})` }}>{children}</AbsoluteFill>
    : <AbsoluteFill style={{ clipPath: `circle(${p * 118}% at 50% 48%)` }}>{children}</AbsoluteFill>;

/* Zoom: die alte Szene fliegt auf die Kamera zu und verblasst, die neue
   kommt aus der Tiefe. */
const ZoomDurch = ({ children, presentationDirection, presentationProgress: p }) =>
  presentationDirection === "exiting"
    ? <AbsoluteFill style={{ transform: `scale(${1 + p * 0.4})`, opacity: 1 - p }}>{children}</AbsoluteFill>
    : <AbsoluteFill style={{ transform: `scale(${0.82 + p * 0.18})`, opacity: p }}>{children}</AbsoluteFill>;

const UEBERGAENGE = [
  () => slide({ direction: "from-bottom" }),
  () => wipe({ direction: "from-top-left" }),
  () => ({ component: KreisOeffnung, props: {} }),
  () => clockWipe({ width: 1080, height: 1920 }),
  () => ({ component: ZoomDurch, props: {} }),
  () => slide({ direction: "from-right" }),
  () => wipe({ direction: "from-bottom-right" })
];
const TAKT = linearTiming({ durationInFrames: UEBERGANG, easing: Easing.inOut(Easing.cubic) });

/* Je Reel eine feste, aber abwechslungsreiche Folge: Startpunkt und
   Schrittweite aus der Reel-Id. Bei 7 Uebergaengen (Primzahl) und einer
   Schrittweite von 1 bis 6 kommt jeder vor, bevor sich einer wiederholt,
   und nie zweimal derselbe hintereinander. */
function uebergaengeFuer(reel) {
  const n = UEBERGAENGE.length;
  const start = Math.floor(streuwert(reel.id) * n);
  const schritt = 1 + Math.floor(streuwert(reel.id + "#schritt") * (n - 1));
  return Array.from({ length: Math.max(0, reel.szenen.length - 1) }, (_, i) => UEBERGAENGE[(start + i * schritt) % n]());
}

/* ------------------------------------------------------------- Reel */

export const Reel = ({ reel, dauern }) => {
  const { fps } = useVideoConfig();
  const d = dauern || reel.szenen.map((s) => ({ frames: Math.ceil(s.dauer * fps), hatTon: false }));
  const gesamt = gesamtFrames(d);
  const starts = szenenStarts(d);
  const uebergaenge = uebergaengeFuer(reel);
  const teile = [];
  reel.szenen.forEach((s, i) => {
    const Szene = SZENEN[s.art];
    if (!Szene) throw new Error(`Unbekannte Szenenart "${s.art}" in Reel "${reel.id}"`);
    const farben = s.bild ? HINTERGRUND.foto : HINTERGRUND[s.hintergrund];
    if (i > 0) teile.push(<TransitionSeries.Transition key={"u" + i} presentation={uebergaenge[i - 1]} timing={TAKT} />);
    teile.push(
      <TransitionSeries.Sequence key={s.id} durationInFrames={d[i].frames} name={`${i + 1} ${s.art}${s.bild ? " · " + s.bild : ""}`}>
        <SzenenKontext.Provider value={{ frames: d[i].frames }}>
          <BildKontext.Provider value={s.bild || null}>
            <Szene s={s} farben={farben} />
            {s.art !== "abbinder" && <Ecke farben={farben} />}
          </BildKontext.Provider>
        </SzenenKontext.Provider>
      </TransitionSeries.Sequence>
    );
  });
  return (
    <AbsoluteFill style={{ backgroundColor: MARKE.slate }}>
      <TransitionSeries>{teile}</TransitionSeries>
      {/* Die Stimme laeuft getrennt von den Bildern, genau ab dem Start
          ihrer Szene – Uebergaenge verschieben sie nicht. */}
      {reel.szenen.map((s, i) => d[i].hatTon
        ? <Sequence key={"ton-" + s.id} from={starts[i]} durationInFrames={d[i].frames} name={`Ton ${i + 1}`}><Audio src={staticFile(d[i].datei)} /></Sequence>
        : null)}
      <Fortschritt gesamt={gesamt} farbe={MARKE.gold} />
    </AbsoluteFill>
  );
};
