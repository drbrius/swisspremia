import React from "react";
import { AbsoluteFill } from "remotion";
import { MARKE } from "./reels.js";
import { SCHRIFT } from "./Marke.jsx";
import { Figur, BESETZUNG, POSEN, usePose } from "./Figur.jsx";

/* Modellblatt: Besetzung und Posen auf einen Blick – zur Kontrolle von
   Proportionen, Gelenken und Gesichtern (npx remotion still … modellblatt). */
const Zelle = ({ wer, pose, inHand, titel }) => {
  const p = usePose(pose);
  return (
    <div style={{ width: 205, height: 330, position: "relative" }}>
      <svg width="205" height="305" viewBox="-220 -720 440 760">
        <Figur wer={wer} pose={p} inHand={inHand} />
      </svg>
      <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center", fontSize: 20, color: MARKE.slate }}>{titel}</div>
    </div>
  );
};

export const Modellblatt = () => (
  <AbsoluteFill style={{ backgroundColor: MARKE.creme, fontFamily: SCHRIFT, padding: 20, display: "flex", flexWrap: "wrap", alignContent: "flex-start" }}>
    {Object.keys(BESETZUNG).map((wer) => <Zelle key={wer} wer={wer} pose="winken" titel={wer} />)}
    {["stehen", "zeigenOben", "denken", "jubeln", "schulter", "sorge"].map((p) => <Zelle key={p} wer="lea" pose={p} titel={p} />)}
    <Zelle wer="marco" pose="tragen" inHand="karton" titel="tragen + karton" />
    <Zelle wer="lea" pose="wiegen" inHand="baby" titel="wiegen + baby" />
    <Zelle wer="noah" pose="telefon" inHand="telefon" titel="telefon" />
    <Zelle wer="lea" pose="einwerfen" inHand="brief" titel="einwerfen + brief" />
    <Zelle wer="marco" pose="hueften" titel="hueften" />
    <Zelle wer="keller" pose="daumen" titel="daumen" />
    <Zelle wer="brunner" pose="staunen" titel="staunen" />
    <Zelle wer="marco" pose="tippen" titel="tippen" />
    <Zelle wer="mia" pose="jubeln" titel="mia jubeln" />
  </AbsoluteFill>
);
