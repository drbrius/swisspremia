/* =========================================================================
   Reels rendern

       npm run render                 alle sechs
       npm run render -- zwei-termine nur einen

   Schreibt out/<id>.mp4 in 1080 x 1920, 30 fps, H.264. Liegen Tonspuren
   unter public/audio/, werden sie eingemischt; sonst wird stumm
   gerendert. Die Szenendauern richten sich nach dem Ton (siehe Root.jsx).
   ========================================================================= */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REELS } from "./src/reels.js";
import { bilderSichern } from "./funnel/bilder.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const NUR = process.argv[2];
fs.mkdirSync(path.join(HIER, "out"), { recursive: true });
/* Szenen mit "bild" brauchen die Fotos in public/bilder/. */
const bilder = await bilderSichern({ melden: console.log });
console.log(bilder.size + " Fotos bereit.");

/* Der von Remotion mitgelieferte Chrome Headless laesst sich auf diesem
   Rechner nicht starten (spawn EFTYPE – das Projekt liegt in OneDrive,
   das frisch geladene Programme blockieren kann). Ein installierter
   Chrome oder Edge tut es genauso; Remotion nimmt jeden Chromium. */
const BROWSER = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
].find((p) => fs.existsSync(p));
const BROWSER_ARG = BROWSER ? ` --browser-executable="${BROWSER}"` : "";
console.log(BROWSER ? "Browser: " + BROWSER : "Browser: mitgelieferter Chrome Headless");

for (const reel of REELS) {
  if (NUR && reel.id !== NUR) continue;
  const ziel = path.join("out", reel.id + ".mp4");
  console.log("\n=== " + reel.titel + " -> " + ziel);
  execSync(
    `npx remotion render src/index.jsx ${reel.id} ${ziel} --codec h264 --crf 18 --log warn${BROWSER_ARG}`,
    { cwd: HIER, stdio: "inherit" }
  );
}
console.log("\nFertig.\n");
