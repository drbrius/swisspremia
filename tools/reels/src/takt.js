/* =========================================================================
   Takt der Reels – gemeinsam fuer Remotion (Root, Reel) und Node
   (Titelbild, Standbilder). Reines JavaScript, damit Node es laden kann.

   Zwei Szenen ueberlappen sich um UEBERGANG Frames (Szenenuebergang).
   Die Gesamtlaenge ist deshalb die Summe der Szenen minus die
   Ueberlappungen. NACHHALL ist laenger als ein Uebergang, damit die
   Stimme einer Szene endet, bevor die naechste zu sprechen beginnt.
   ========================================================================= */
export const FPS = 30;
export const UEBERGANG = 12;
export const NACHHALL = 0.5;

/* Startframe jeder Szene im fertigen Video. */
export const szenenStarts = (dauern) => {
  const starts = [];
  let t = 0;
  for (const d of dauern) { starts.push(t); t += d.frames - UEBERGANG; }
  return starts;
};

export const gesamtFrames = (dauern) =>
  dauern.reduce((summe, d) => summe + d.frames, 0) - Math.max(0, dauern.length - 1) * UEBERGANG;

/* Kleiner, stabiler Zufall aus einem Text – gleicher Reel, gleiche Wahl. */
export const streuwert = (text) => {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
};
