/* =========================================================================
   Tagesreels im Look der Serie «Küchentisch» (seit 14.11.2026 Standard).

   Der Nutzer wollte nach dem Video «Vom Zettelchaos zum Vergleich» alle
   Videos des Funnels in diesem Stil. Die Skripte der Redaktion bleiben, wie
   sie sind (funnel/formate.js) – geaendert wird nur, wie eine Szene aussieht:

   - Textszenen ("titel") spielen im Raum: eine Figur am Tisch voller
     Papiere, die Kamera faehrt langsam naeher; am Schluss ist aufgeraeumt
     und es ist hell. Wo das Skript jemanden am Laptop zeigt, kommt der
     aufgeraeumte Tisch von oben; wo vom Vergleich die Rede ist, die Platine
     mit dem Chip. Der Text steht als Untertitel in Fraunces darunter.
   - Grafikszenen (Zahl, Zaehler, Balken, Karte …) behalten ihre Grafik und
     stehen auf der Platine oder auf Papier (Bausteine.jsx, Buehne).
   - Der Abbinder ist der Platinen-Abbinder der Serie.

   regieFuer(reel) legt je Reel fest: Figur, Raum, Licht, Tisch und die
   Kamerafahrt – immer gleich fuer denselben Reel (Streuwert aus der Id).
   ========================================================================= */
import React, { useContext } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { MARKE } from "./reels.js";
import { SCHRIFT, ZONE } from "./Marke.jsx";
import { SzenenKontext } from "./Bausteine.jsx";
import { SERIF, NACHT, TINTE, CREME, PETROL, ORANGE, GLUT, Leinwand, Platine, Raum, Laptop, Maschine, feder } from "./Tisch.jsx";
import { STUFEN } from "../funnel/themen.js";
import { streuwert } from "./takt.js";

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

/* Figuren der Redaktion -> Figuren der Serie. */
const WER = { lea: "anna", anna: "anna", marco: "marc", marc: "marc", noah: "noah", brunner: "brunner" };
const FIGUREN = ["anna", "marc", "noah", "anna", "marc", "brunner"];
/* Schritte eines Skripts (beat), in denen es um das Problem geht. */
const SORGE = /^(Hook|Problem|Agitation|Myth|Pain|Before|Objection|Struggle|Question|Story|Claim)$/;
const VERGLEICH = /vergleich|günstigst|offiziell/i;

/* Je Szene die Bildangaben (nur fuer "titel", sonst null). */
export function regieFuer(reel) {
  const szenen = reel.szenen;
  const titel = szenen.map((s, i) => (s.art === "titel" ? i : -1)).filter((i) => i >= 0);
  const mitFigur = szenen.find((s) => s.figur && WER[s.figur.wer]);
  const figur = mitFigur ? WER[mitFigur.figur.wer] : FIGUREN[Math.floor(streuwert(reel.id + "#figur") * FIGUREN.length)];
  const raum = streuwert(reel.id + "#raum") < 0.55 ? "kueche" : "buero";
  const dunkel = raum === "kueche" ? "nacht" : "kalt";
  const tisch = streuwert(reel.id + "#tisch") < 0.5 ? "chaos" : "zettel";
  const kopfZuerst = streuwert(reel.id + "#pose") < 0.35;
  const regie = szenen.map(() => null);
  let nah = 0, sorgen = 0, maschine = false;
  titel.forEach((i, k) => {
    const s = szenen[i];
    const letzte = k === titel.length - 1;
    const stimmung = s.beat
      ? (SORGE.test(s.beat) ? "sorge" : letzte ? "froh" : "auf")
      : (k === 0 && (titel.length > 1 || i === 0) ? "sorge" : letzte ? "froh" : "auf");
    const text = (s.text || []).join(" ") + " " + (s.stimme || "");
    if (stimmung !== "sorge" && s.figur && s.figur.aktion === "laptop") {
      const schild = Array.isArray(s.figur.bildschirm) ? s.figur.bildschirm.join(" ") : "";
      regie[i] = { art: "laptop", figur, schild: schild && schild.length <= 22 ? schild : null };
      return;
    }
    if (stimmung === "auf" && !maschine && VERGLEICH.test(text)) { maschine = true; regie[i] = { art: "maschine" }; return; }
    if (stimmung === "froh") {
      regie[i] = { art: "raum", raum, licht: "warm", figur, pose: "brief", froh: 1, tisch: "stapel", zoom: [1.3, 1.46] };
      return;
    }
    const z0 = Math.min(1.7, 1 + nah * 0.2), z1 = Math.min(1.9, z0 + 0.2);
    nah++;
    if (stimmung === "sorge") {
      const kopf = (sorgen % 2 === 0) === kopfZuerst;
      sorgen++;
      regie[i] = { art: "raum", raum, licht: dunkel, figur, pose: kopf ? "kopf" : "brief", sorge: 1, tisch, zoom: [z0, z1] };
    } else {
      regie[i] = { art: "raum", raum, licht: dunkel, figur, pose: "brief", sorge: 0.45, aufblick: true, tisch, zoom: [z0, z1] };
    }
  });
  return regie;
}

/* Hell ist nur der Laptop-Tisch von oben. */
export const tischHell = (r) => Boolean(r && r.art === "laptop");

const ARTEN = { raum: Raum, laptop: Laptop, maschine: Maschine };
const STANDARD = { art: "raum", raum: "kueche", licht: "nacht", figur: "anna", pose: "brief", sorge: 1, tisch: "chaos", zoom: [1, 1.2] };

/* Textszene: Bild aus der Regie, der Text als Untertitel unten. Der Hook
   (erste Szene) steht ab dem ersten Bild – ohne Einblenden. */
export const TischTitel = ({ s }) => {
  const t = useCurrentFrame();
  const { frames: D, hook, start = 0, regie } = useContext(SzenenKontext);
  const teil = { ...(regie || STANDARD), bloecke: [] };
  const Art = ARTEN[teil.art] || Raum;
  const hell = tischHell(teil);
  const text = (s.text || []).join(" ");
  const laenge = text.replace(/\*\*/g, "").length;
  const groesse = laenge <= 40 ? 70 : laenge <= 62 ? 62 : laenge <= 86 ? 55 : 49;
  const da = hook ? 1 : interpolate(t, [3, 10], [0, 1], CL);
  const marke = { background: ORANGE, color: "#FFFFFF", padding: "0 0.16em", borderRadius: 10, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };
  return (
    <AbsoluteFill style={{ backgroundColor: hell ? CREME : NACHT }}>
      <Art teil={teil} t={t} D={Math.max(1, D)} absolut={start + t} />
      <AbsoluteFill style={{ background: hell ? "linear-gradient(to bottom, rgba(244,238,228,0.9) 0px, rgba(244,238,228,0) 340px)" : "linear-gradient(to bottom, rgba(8,14,20,0.62) 0px, rgba(8,14,20,0) 420px)" }} />
      <AbsoluteFill style={{ background: hell ? "linear-gradient(to bottom, rgba(244,238,228,0) 1250px, rgba(244,238,228,0.96) 1400px)" : "linear-gradient(to bottom, rgba(8,14,20,0) 1160px, rgba(8,14,20,0.88) 1390px, rgba(8,14,20,0.96) 1920px)" }} />
      <div style={{ position: "absolute", left: ZONE.seite - 14, right: ZONE.seite - 14, bottom: ZONE.unten + 30, textAlign: "center", opacity: da, transform: `translateY(${(1 - da) * 18}px)` }}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: groesse, lineHeight: 1.2, letterSpacing: "-0.01em", color: hell ? TINTE : CREME, textWrap: "balance", textShadow: hell ? "none" : "0 2px 18px rgba(0,0,0,0.45)" }}>
          {text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((stueck, i) => (stueck.startsWith("**") ? <span key={i} style={marke}>{stueck.slice(2, -2)}</span> : <span key={i}>{stueck}</span>))}
        </div>
        {s.klein ? <div style={{ marginTop: 16, fontFamily: SCHRIFT, fontWeight: 500, fontSize: 30, color: hell ? TINTE : CREME, opacity: 0.82 }}>{s.klein}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/* Abbinder auf der Platine. Die Aufforderung kommt aus der Funnel-Stufe
   («In 1 Minute vergleichen · Link im Profil»): der erste Teil als Zeile
   oben, der zweite im orangen Knopf. */
export const TischAbbinder = ({ s }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const st = STUFEN[s.stufe] || STUFEN.mofu;
  const en = Boolean(s.urlZusatz);
  const [kopf, knopf] = String(en ? st.ctaVideoEn : st.ctaVideo).split(" · ");
  const e = (verz) => feder(t, fps, verz, 20);
  const logo = feder(t, fps, 2, 20, 13);
  const puls = 0.5 + 0.5 * Math.sin(t / 7);
  return (
    <AbsoluteFill style={{ backgroundColor: NACHT }}>
      <Leinwand>
        <Platine t={t} y={700} />
        <g transform={`translate(540 700) scale(${0.5 + 0.5 * logo})`} opacity={Math.min(1, logo)}>
          <rect x="-128" y="-128" width="256" height="256" rx="60" fill="none" stroke={ORANGE} strokeWidth="18" opacity={0.3 + 0.35 * puls} filter="url(#t-glimmen)" />
          <rect x="-112" y="-112" width="224" height="224" rx="50" fill={PETROL} stroke={CREME} strokeWidth="5" />
          <path d="M-22 -66h44v44h44v44h-44v44h-44v-44h-44v-44h44z" fill={CREME} />
        </g>
      </Leinwand>
      <div style={{ position: "absolute", left: 60, right: 60, top: 372, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 74, lineHeight: 1.1, letterSpacing: "-0.01em", color: CREME, textWrap: "balance", opacity: e(0), transform: `translateY(${(1 - e(0)) * 20}px)` }}>{kopf}{/[.!?]$/.test(kopf) ? "" : "."}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 872, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: SCHRIFT, fontSize: 84, color: CREME, letterSpacing: "-0.01em", opacity: e(5), transform: `translateY(${(1 - e(5)) * 20}px)` }}>Swiss<span style={{ fontWeight: 700 }}>Premia</span></div>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 600, fontSize: 46, color: GLUT, marginTop: 12, opacity: e(8) }}>{MARKE.url + (s.urlZusatz || "")}</div>
        <div style={{ fontFamily: SCHRIFT, fontWeight: 500, fontSize: 30, color: CREME, marginTop: 16, opacity: 0.9 * e(10) }}>{en ? "Official federal data · free · no sign-up" : "Offizielle Prämien 2027 · kostenlos · ohne Anmeldung"}</div>
        {knopf ? <div style={{ marginTop: 36, padding: "24px 60px", borderRadius: 999, background: ORANGE, color: "#FFFFFF", fontFamily: SCHRIFT, fontWeight: 700, fontSize: 46, opacity: e(13), transform: `scale(${(0.9 + 0.1 * e(13)) * (1 + Math.max(0, Math.sin((t - 30) / 7)) * 0.035)})` }}>{knopf}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/* Filmkorn ueber allem, wie in der Serie. */
export const Korn = () => (
  <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.2, pointerEvents: "none" }}>
    <Img src={staticFile("plakat/korn.png")} style={{ width: 1080, height: 1920, imageRendering: "pixelated" }} />
  </AbsoluteFill>
);

/* Szenenwechsel: weiche Ueberblendung statt Schieben und Wischen. */
export const ueberblenden = () => fade();
