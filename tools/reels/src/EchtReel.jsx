/* =========================================================================
   Serie «Echt» – realistische Szenen im Vollbild statt Figuren und Flaechen.

   Aufbau je Reel (Eingabe `echt`, gebaut von real/bauen.js):
     bilder    [{ von, bis, tempo, clip: { datei, von, bis } }]   Frames im Reel / Sekunden im Clip
     bloecke   [{ von, bis, t, szene }]                    Untertitel im Sprechtakt
     karten    [{ von, bis, wert, zusatz, quelle }]        Zahlenkarten
     abbinder  { von, clip: { datei, zeit } }              Schlussbild
     ton, musik, gesamt

   Gestaltung: Video randlos, dunkler Verlauf unten, grosse fette
   Untertitel (Akzent in Gold), kleine Markenzeile oben, Zahlen auf einer
   weissen Karte, Abbinder auf dem unscharfen letzten Bild. Der erste
   Untertitel steht ab dem ersten Bild – der Hook darf nicht einblenden.
   ========================================================================= */
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, Freeze, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { MARKE } from "./reels.js";
import { SCHRIFT, ZONE, Kreuz, Wortmarke } from "./Marke.jsx";

const AKZENT = "#f2d998";          // helles Gold, auf Video gut lesbar
const NACHT = "rgba(8, 20, 30, ";  // Verlaufsfarbe (Slate, sehr dunkel)

/* **fett** -> Akzent */
const Zeile = ({ text }) => text.replace(/ – /g, " – ").split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((teil, i) =>
  teil.startsWith("**")
    ? <span key={i} style={{ color: AKZENT }}>{teil.slice(2, -2)}</span>
    : <span key={i}>{teil}</span>);

/* Eine Einstellung: Ausschnitt des Clips, an die Szenenlaenge angepasst. */
const Einstellung = ({ szene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frames = Math.max(1, szene.bis - szene.von);
  if (!szene.clip) return <AbsoluteFill style={{ backgroundColor: MARKE.slate }} />;
  /* Ausschnitt und Tempo kommen fertig aus real/bauen.js (zuordnen) – mit
     Abstand zu den Schnitten, damit nie ein Bild der Nachbar-Einstellung
     aufblitzt. */
  const von = szene.clip.von, tempo = szene.tempo || 1;
  const zoom = interpolate(frame, [0, frames], [1.03, 1.08]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(szene.clip.datei)} muted startFrom={Math.round(von * fps)} playbackRate={tempo}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "brightness(1.06) contrast(1.04) saturate(1.03)" }}
      />
    </AbsoluteFill>
  );
};

const Verlaeufe = () => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${NACHT}0.62) 0%, ${NACHT}0.28) 16%, ${NACHT}0) 30%)` }} />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${NACHT}0) 44%, ${NACHT}0.55) 66%, ${NACHT}0.88) 100%)` }} />
  </>
);

const Markenzeile = () => (
  <div style={{ position: "absolute", top: ZONE.oben + 6, left: ZONE.seite, display: "flex", alignItems: "center", gap: 18 }}>
    <Kreuz groesse={52} farbe={MARKE.weiss} kreuz={MARKE.petrol} />
    <div style={{ fontFamily: SCHRIFT, color: MARKE.weiss, fontSize: 32, fontWeight: 600, letterSpacing: "0.01em", textShadow: "0 2px 14px rgba(0,0,0,.5)" }}>
      swisspremia.ch <span style={{ opacity: 0.7, fontWeight: 400 }}>· Link im Profil</span>
    </div>
  </div>
);

/* Untertitel-Block: erscheint mit seinem ersten Wort, bleibt bis zum naechsten. */
const Untertitel = ({ block, erster }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const auf = erster ? 1 : spring({ frame, fps, config: { damping: 16, stiffness: 190, mass: 0.6 } });
  const lang = block.t.replace(/\*\*/g, "").length;
  const groesse = erster ? (lang > 44 ? 86 : 96) : lang > 62 ? 68 : lang > 40 ? 76 : 86;
  return (
    <div style={{
      position: "absolute", left: ZONE.seite - 14, right: ZONE.seite - 14, bottom: ZONE.unten + 96,
      fontFamily: SCHRIFT, fontWeight: 800, fontSize: groesse, lineHeight: 1.1, letterSpacing: "-0.015em",
      color: MARKE.weiss, textAlign: "center", textWrap: "balance",
      textShadow: "0 3px 22px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.5)",
      opacity: Math.min(1, auf * 1.4), transform: `translateY(${(1 - auf) * 26}px) scale(${0.96 + auf * 0.04})`
    }}>
      <Zeile text={block.t} />
    </div>
  );
};

const Zahlenkarte = ({ karte }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const auf = spring({ frame, fps, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
      <div style={{
        backgroundColor: MARKE.weiss, borderRadius: 40, padding: "30px 54px 28px", maxWidth: 880, textAlign: "center",
        boxShadow: "0 18px 60px rgba(0,0,0,.35)", fontFamily: SCHRIFT,
        opacity: Math.min(1, auf * 1.5), transform: `translateY(${(1 - auf) * 40}px) scale(${0.9 + auf * 0.1})`
      }}>
        <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, color: MARKE.petrol, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{karte.wert}</div>
        <div style={{ fontSize: 42, fontWeight: 600, color: MARKE.slate, marginTop: 10 }}>{karte.zusatz}</div>
        <div style={{ fontSize: 24, fontWeight: 400, color: "#5d6b78", marginTop: 14, lineHeight: 1.25 }}>{karte.quelle}</div>
      </div>
    </div>
  );
};

const Abbinder = ({ abbinder }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ein = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const f = (ab) => spring({ frame: frame - ab, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const teil = (ab) => ({ opacity: Math.min(1, f(ab) * 1.4), transform: `translateY(${(1 - f(ab)) * 34}px)` });
  return (
    <AbsoluteFill style={{ opacity: ein }}>
      {abbinder.clip
        ? <Freeze frame={0}><OffthreadVideo src={staticFile(abbinder.clip.datei)} muted startFrom={Math.round(abbinder.clip.zeit * fps)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.12)", filter: "blur(22px) brightness(0.6)" }} /></Freeze>
        : <AbsoluteFill style={{ backgroundColor: MARKE.slate }} />}
      <AbsoluteFill style={{ backgroundColor: "rgba(0, 52, 82, 0.74)" }} />
      <AbsoluteFill style={{ fontFamily: SCHRIFT, color: MARKE.weiss, alignItems: "center", justifyContent: "center", textAlign: "center", padding: `0 ${ZONE.seite}px` }}>
        <div style={teil(2)}><Kreuz groesse={150} farbe={MARKE.weiss} kreuz={MARKE.petrol} /></div>
        <div style={{ marginTop: 34, ...teil(5) }}><Wortmarke groesse={92} /></div>
        <div style={{ marginTop: 70, fontSize: 92, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em", ...teil(9) }}>Alle Kassen.<br /><span style={{ color: AKZENT }}>1 Minute.</span></div>
        <div style={{ marginTop: 34, fontSize: 38, fontWeight: 400, opacity: 0.9, ...teil(13) }}>Offizielle Prämien 2027 · kostenlos · ohne Anmeldung</div>
        <div style={{ marginTop: 64, ...teil(17) }}>
          <div style={{ display: "inline-block", backgroundColor: AKZENT, color: MARKE.slate, fontSize: 48, fontWeight: 700, padding: "24px 60px", borderRadius: 999 }}>Link im Profil</div>
        </div>
        <div style={{ marginTop: 30, fontSize: 42, fontWeight: 600, ...teil(20) }}>swisspremia.ch</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: ZONE.unten + 8, textAlign: "center", fontFamily: SCHRIFT, fontSize: 24, color: MARKE.weiss, opacity: 0.6 }}>Szenen und Stimme KI-generiert · Beispielrechnungen, keine Beratung</div>
    </AbsoluteFill>
  );
};

const MUSIK_EIN = 8, MUSIK_AUS = 30;

export const EchtReel = ({ echt }) => {
  const { gesamt } = echt;
  return (
    <AbsoluteFill style={{ backgroundColor: MARKE.slate }}>
      {echt.bilder.map((sz, i) => (
        <Sequence key={"s" + i} from={sz.von} durationInFrames={Math.max(1, sz.bis - sz.von)} name={`Einstellung ${i + 1}`}>
          <Einstellung szene={sz} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={echt.abbinder.von} name="Verlauf und Marke">
        <Verlaeufe />
        <Markenzeile />
      </Sequence>
      {echt.karten.map((k, i) => (
        <Sequence key={"k" + i} from={k.von} durationInFrames={k.bis - k.von} name={`Karte ${k.wert}`}>
          <Zahlenkarte karte={k} />
        </Sequence>
      ))}
      {echt.bloecke.map((b, i) => (
        <Sequence key={"b" + i} from={b.von} durationInFrames={b.bis - b.von} name={`Text ${i + 1}`}>
          <Untertitel block={b} erster={i === 0} />
        </Sequence>
      ))}
      <Sequence from={echt.abbinder.von} durationInFrames={gesamt - echt.abbinder.von} name="Abbinder">
        <Abbinder abbinder={echt.abbinder} />
      </Sequence>
      {echt.ton ? <Audio src={staticFile(echt.ton)} /> : null}
      {echt.musik && echt.musik.datei ? (
        <Audio
          src={staticFile(echt.musik.datei)} loop
          volume={(f) => (echt.musik.lautstaerke ?? 0.13)
            * interpolate(f, [0, MUSIK_EIN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            * interpolate(f, [gesamt - MUSIK_AUS, gesamt], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/* Platzhalter fuer das Studio, wenn keine Eingabe da ist. */
export const ECHT_BEISPIEL = {
  id: "beispiel", gesamt: 150, ton: null, musik: null,
  bilder: [{ von: 0, bis: 100, tempo: 1, clip: null }],
  bloecke: [{ von: 0, bis: 100, t: "Diesen Brief legen die meisten **einfach weg**.", szene: 0 }],
  karten: [{ von: 40, bis: 100, wert: "CHF 1'540", zusatz: "weniger im Jahr", quelle: "Beispiel" }],
  abbinder: { von: 100, clip: null }
};
