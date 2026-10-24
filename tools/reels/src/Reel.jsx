import React from "react";
import {
  AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  spring, interpolate, Easing
} from "remotion";
import { MARKE } from "./reels.js";
import { SCHRIFT, ZONE, HINTERGRUND, Kreuz, Wortmarke, chf } from "./Marke.jsx";

/* ------------------------------------------------------------ Helfer */

/* Weiches Einblenden mit leichtem Anheben. Verzoegerung in Frames. */
const useEinblenden = (verzoegerung = 0, dauer = 14) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [verzoegerung, verzoegerung + dauer], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)
  });
  return { opacity: t, transform: `translateY(${(1 - t) * 28}px)` };
};

/* **fett** innerhalb einer Zeile hervorheben. */
const Zeile = ({ text, akzent }) => {
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

const Buehne = ({ farben, children, ausrichtung = "center" }) => (
  <AbsoluteFill style={{ backgroundColor: farben.fläche, fontFamily: SCHRIFT, color: farben.text }}>
    <div style={{
      position: "absolute", left: ZONE.seite, right: ZONE.seite, top: ZONE.oben, bottom: ZONE.unten,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: ausrichtung,
      textAlign: ausrichtung === "center" ? "center" : "left"
    }}>
      {children}
    </div>
  </AbsoluteFill>
);

/* Kleines Markenzeichen, in jeder Szene, dezent – knapp innerhalb der
   sicheren Zone, damit es nicht unter dem Profilnamen von Instagram liegt. */
const Ecke = ({ farben }) => (
  <div style={{ position: "absolute", top: ZONE.oben + 10, left: ZONE.seite, display: "flex", alignItems: "center", gap: 18, opacity: .9 }}>
    <Kreuz groesse={44} farbe={farben.akzent === MARKE.gold ? MARKE.gold : MARKE.petrol} kreuz={farben.akzent === MARKE.gold ? MARKE.slate : MARKE.weiss} />
    <div style={{ fontSize: 26, letterSpacing: ".18em", textTransform: "uppercase", color: farben.leise, fontWeight: 500 }}>SwissPremia</div>
  </div>
);

/* ------------------------------------------------------------ Szenen */

const Titel = ({ s, farben }) => {
  const frame = useCurrentFrame();
  return (
    <Buehne farben={farben}>
      {s.symbol && (
        <div style={{ fontSize: 150, lineHeight: 1, marginBottom: 40, color: farben.akzent, ...useEinblenden(0) }}>{s.symbol}</div>
      )}
      {s.text.map((zeile, i) => (
        <div key={i} style={{ fontSize: 92, lineHeight: 1.12, fontWeight: 300, letterSpacing: "-0.01em", ...useEinblenden(8 + i * 9) }}>
          <Zeile text={zeile} akzent={farben.akzent} />
        </div>
      ))}
      {s.klein && (
        <div style={{ marginTop: 44, fontSize: 36, color: farben.leise, fontWeight: 400, ...useEinblenden(8 + s.text.length * 9 + 6) }}>{s.klein}</div>
      )}
      <span style={{ display: "none" }}>{frame}</span>
    </Buehne>
  );
};

const Zahl = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame, fps, config: { damping: 14, stiffness: 120, mass: .9 } });
  return (
    <Buehne farben={farben}>
      {s.oben && <div style={{ fontSize: 44, color: farben.leise, marginBottom: 30, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ fontSize: 360, fontWeight: 600, lineHeight: .95, color: farben.akzent, transform: `translateY(${(1 - fall) * -220}px)`, opacity: Math.min(1, fall * 1.4) }}>
        {s.zahl}
      </div>
      <div style={{ fontSize: 84, fontWeight: 300, marginTop: 24, ...useEinblenden(12) }}>{s.wort}</div>
    </Buehne>
  );
};

const Zaehler = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wert = interpolate(frame, [6, Math.round(fps * 1.6)], [s.von, s.bis], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad)
  });
  return (
    <Buehne farben={farben}>
      {s.oben && <div style={{ fontSize: 56, fontWeight: 300, marginBottom: 36, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ fontSize: 230, fontWeight: 600, lineHeight: 1, color: farben.akzent, fontVariantNumeric: "tabular-nums" }}>
        {s.praefix ? <span style={{ fontSize: 110, fontWeight: 300, marginRight: 24, color: farben.text }}>{s.praefix}</span> : null}
        {chf(wert)}
      </div>
      {s.unten && <div style={{ fontSize: 56, fontWeight: 300, marginTop: 36, ...useEinblenden(Math.round(fps * 1.5)) }}>{s.unten}</div>}
    </Buehne>
  );
};

const Zwei = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ende = Math.round(fps * 1.4);
  const l = interpolate(frame, [4, ende], [0, s.links.bis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const r = interpolate(frame, [4, ende], [0, s.rechts.bis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const Kreis = ({ praefix, wert, akzent }) => (
    <div style={{
      width: 400, height: 400, borderRadius: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: `6px solid ${akzent ? farben.akzent : farben.leise}`, color: akzent ? farben.akzent : farben.text
    }}>
      {praefix ? <div style={{ fontSize: 40, fontWeight: 300, opacity: .8 }}>{praefix}</div> : null}
      <div style={{ fontSize: 120, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{chf(wert)}</div>
    </div>
  );
  return (
    <Buehne farben={farben}>
      {s.oben && <div style={{ fontSize: 60, fontWeight: 300, marginBottom: 70, ...useEinblenden(0) }}>{s.oben}</div>}
      <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
        <Kreis praefix={s.links.praefix} wert={l} akzent />
        <div style={{ fontSize: 80, fontWeight: 300, color: farben.leise }}>vs</div>
        <Kreis praefix={s.rechts.praefix} wert={r} />
      </div>
    </Buehne>
  );
};

const Balken = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 54, height: 560, marginBottom: 90 }}>
        {s.balken.map((b, i) => {
          const w = spring({ frame: frame - i * 8, fps, config: { damping: 18, stiffness: 90 } });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ width: 200, height: Math.max(8, 500 * b.hoehe * w), borderRadius: 12, backgroundColor: b.gold ? farben.akzent : "rgba(255,255,255,.28)" }} />
              <div style={{ fontSize: 40, fontWeight: 500, color: b.gold ? farben.akzent : farben.text }}>{b.label}</div>
            </div>
          );
        })}
      </div>
      {s.text.map((zeile, i) => (
        <div key={i} style={{ fontSize: 76, lineHeight: 1.15, fontWeight: 300, ...useEinblenden(28 + i * 9) }}>{zeile}</div>
      ))}
    </Buehne>
  );
};

const Schritte = ({ s, farben }) => (
  <Buehne farben={farben} ausrichtung="flex-start">
    {s.schritte.map((t, i) => (
      <div key={i} style={{ display: "flex", gap: 34, alignItems: "flex-start", marginBottom: 54, ...useEinblenden(6 + i * 22) }}>
        <div style={{ flex: "none", width: 92, height: 92, borderRadius: 46, backgroundColor: farben.akzent, color: farben.fläche, fontSize: 52, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
        <div style={{ fontSize: 58, lineHeight: 1.2, fontWeight: 300, paddingTop: 10 }}>{t}</div>
      </div>
    ))}
  </Buehne>
);

const Abbinder = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  return (
    <Buehne farben={farben}>
      <div style={{ transform: `scale(${.7 + z * .3})`, opacity: z }}><Kreuz groesse={170} farbe={MARKE.gold} kreuz={MARKE.slate} /></div>
      <div style={{ marginTop: 44, ...useEinblenden(10) }}><Wortmarke groesse={96} /></div>
      <div style={{ marginTop: 56, fontSize: 60, fontWeight: 500, color: farben.akzent, ...useEinblenden(18) }}>{MARKE.url}{s.urlZusatz || ""}</div>
      <div style={{ marginTop: 22, fontSize: 36, letterSpacing: ".14em", textTransform: "uppercase", color: farben.leise, ...useEinblenden(26) }}>
        {s.urlZusatz ? "Free · Official federal data" : "Kostenlos · Offizielle BAG-Daten"}
      </div>
    </Buehne>
  );
};

const SZENEN = { titel: Titel, zahl: Zahl, zaehler: Zaehler, zwei: Zwei, balken: Balken, schritte: Schritte, abbinder: Abbinder };

/* Weicher Uebergang: jede Szene blendet am Ende kurz aus. */
const Ausblenden = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------- Reel */

export const Reel = ({ reel, dauern }) => {
  const { fps } = useVideoConfig();
  /* Ohne berechnete Dauern (Vorschau vor calculateMetadata) gilt die Mindestdauer. */
  const d = dauern || reel.szenen.map((s) => ({ frames: Math.ceil(s.dauer * fps), hatTon: false }));
  let start = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: MARKE.slate }}>
      {reel.szenen.map((s, i) => {
        const von = start;
        start += d[i].frames;
        const Szene = SZENEN[s.art];
        const farben = HINTERGRUND[s.hintergrund];
        return (
          <Sequence key={s.id} from={von} durationInFrames={d[i].frames} name={`${i + 1} ${s.art}`}>
            <Ausblenden frames={d[i].frames}>
              <Szene s={s} farben={farben} />
              {s.art !== "abbinder" && <Ecke farben={farben} />}
            </Ausblenden>
            {d[i].hatTon && <Audio src={staticFile(d[i].datei)} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
