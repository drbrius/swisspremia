import React from "react";
import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { Reel } from "./Reel.jsx";
import { REELS } from "./reels.js";
import { FPS, NACHHALL, gesamtFrames } from "./takt.js";
import { Modellblatt } from "./Modellblatt.jsx";
import { Karussell, KARUSSELL_BEISPIEL, KARUSSELL_BREITE, KARUSSELL_HOEHE } from "./Karussell.jsx";

export { FPS };
export const BREITE = 1080;
export const HOEHE = 1920;

/* Liegt fuer eine Szene eine Tonspur vor, wird sie so lang wie der Ton
   plus Nachhall (src/takt.js). Fehlt die Datei (noch kein Schluessel,
   noch nicht erzeugt), gilt die Mindestdauer – der Reel laesst sich also
   immer rendern, auch stumm.

   Die Stamm-Reels aus reels.js lesen ihre Tonspuren aus public/audio/;
   vom Funnel erzeugte Reels bringen einen eigenen Ordner mit
   (reel.audioOrdner, z. B. "audio/tag"), damit sich beides nicht mischt. */
async function szenenDauern(reel) {
  const ordner = reel.audioOrdner || "audio";
  /* Der Funnel weiss, welche Tonspuren auf der Platte liegen, und gibt
     die Liste mit (reel.tonVorhanden) – dann wird gar nicht erst nach
     fehlenden Dateien gefragt. Ohne Liste wird jede Szene probiert. */
  const bekannt = Array.isArray(reel.tonVorhanden) ? new Set(reel.tonVorhanden) : null;
  const dauern = [];
  for (const szene of reel.szenen) {
    const datei = `${ordner}/${reel.id}-${szene.id}.mp3`;
    let sekunden = szene.dauer;
    let hatTon = false;
    if (!bekannt || bekannt.has(szene.id)) {
      try {
        const ton = await getAudioDurationInSeconds(staticFile(datei));
        if (ton > 0) { sekunden = Math.max(szene.dauer, ton + NACHHALL); hatTon = true; }
      } catch (e) { /* keine Tonspur – stumm rendern */ }
    }
    dauern.push({ frames: Math.ceil(sekunden * FPS), hatTon, datei });
  }
  return dauern;
}

const mindestFrames = (reel) => gesamtFrames(reel.szenen.map((z) => ({ frames: Math.ceil(z.dauer * FPS) })));

const metadaten = async ({ props }) => {
  const dauern = await szenenDauern(props.reel);
  return { durationInFrames: gesamtFrames(dauern), props: { ...props, dauern } };
};

export const RemotionRoot = () => (
  <>
    {REELS.map((reel) => (
      <Composition
        key={reel.id}
        id={reel.id}
        component={Reel}
        width={BREITE}
        height={HOEHE}
        fps={FPS}
        durationInFrames={mindestFrames(reel)}
        defaultProps={{ reel, dauern: null }}
        calculateMetadata={metadaten}
      />
    ))}

    {/* Eine Komposition fuer alles, was der Funnel taeglich erzeugt: der
        Reel kommt als Eingabe (inputProps.reel) herein, Laenge und Ton
        werden daraus berechnet. Ohne Eingabe zeigt sie den ersten
        Stamm-Reel, damit das Studio etwas anzuzeigen hat. */}
    <Composition
      id="tagesreel"
      component={Reel}
      width={BREITE}
      height={HOEHE}
      fps={FPS}
      durationInFrames={mindestFrames(REELS[0])}
      defaultProps={{ reel: REELS[0], dauern: null }}
      calculateMetadata={metadaten}
    />

    {/* Karussell-Folien fuer Instagram (1080 x 1350): eine Folie je Frame,
        fps 1, Laenge = Anzahl Folien. Der Funnel gibt das Karussell als
        Eingabe (inputProps.karussell) und rendert jeden Frame als JPEG. */}
    <Composition
      id="karussell"
      component={Karussell}
      width={KARUSSELL_BREITE}
      height={KARUSSELL_HOEHE}
      fps={1}
      durationInFrames={KARUSSELL_BEISPIEL.folien.length}
      defaultProps={{ karussell: KARUSSELL_BEISPIEL }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, props.karussell.folien.length) })}
    />

    {/* Kontrollblatt der Figuren (Standbild): npx remotion still src/index.jsx modellblatt out/modellblatt.png */}
    <Composition id="modellblatt" component={Modellblatt} width={BREITE} height={HOEHE} fps={FPS} durationInFrames={60} />
  </>
);
