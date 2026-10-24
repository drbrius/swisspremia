import React from "react";
import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { Reel } from "./Reel.jsx";
import { REELS } from "./reels.js";

export const FPS = 30;
export const BREITE = 1080;
export const HOEHE = 1920;

/* Nachhall nach dem letzten gesprochenen Wort, damit die Szene nicht auf
   der Silbe schneidet. */
const NACHHALL = 0.35;

/* Liegt fuer eine Szene eine Tonspur vor, wird sie so lang wie der Ton.
   Fehlt die Datei (noch kein Schluessel, noch nicht erzeugt), gilt die
   Mindestdauer – der Reel laesst sich also immer rendern, auch stumm. */
async function szenenDauern(reel) {
  const dauern = [];
  for (const szene of reel.szenen) {
    const datei = `audio/${reel.id}-${szene.id}.mp3`;
    let sekunden = szene.dauer;
    let hatTon = false;
    try {
      const ton = await getAudioDurationInSeconds(staticFile(datei));
      if (ton > 0) { sekunden = Math.max(szene.dauer, ton + NACHHALL); hatTon = true; }
    } catch (e) { /* keine Tonspur – stumm rendern */ }
    dauern.push({ frames: Math.ceil(sekunden * FPS), hatTon, datei });
  }
  return dauern;
}

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
        durationInFrames={Math.ceil(reel.szenen.reduce((s, z) => s + z.dauer, 0) * FPS)}
        defaultProps={{ reel, dauern: null }}
        calculateMetadata={async ({ props }) => {
          const dauern = await szenenDauern(props.reel);
          return {
            durationInFrames: dauern.reduce((s, d) => s + d.frames, 0),
            props: { ...props, dauern }
          };
        }}
      />
    ))}
  </>
);
