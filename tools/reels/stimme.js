/* =========================================================================
   Stimme aus ElevenLabs fuer die Stamm-Reels (src/reels.js)

       ELEVENLABS_API_KEY=...  ELEVENLABS_VOICE_ID=...  npm run stimme
       npm run stimme -- zwei-termine        nur ein Reel

   Erzeugt fuer jede Szene mit "stimme" eine MP3 unter public/audio/
   und ueberspringt, was schon da ist. Der Schluessel kommt NUR aus der
   Umgebung – nie aus einer Datei im Repository, nie aus dem Chat.

   Ohne ELEVENLABS_VOICE_ID listet das Skript die verfuegbaren Stimmen
   des Kontos und bricht ab, damit bewusst eine gewaehlt wird.
   Die eigentliche Arbeit macht funnel/stimme.js (gemeinsam mit tag.js).
   ========================================================================= */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REELS } from "./src/reels.js";
import { stimmenErzeugen, StimmeFehler } from "./funnel/stimme.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const NUR = process.argv[2];

try {
  const { erzeugt, uebersprungen } = await stimmenErzeugen(REELS, { ordner: path.join(HIER, "public", "audio"), nur: NUR, melden: (z) => console.log("  " + z) });
  console.log(`\n${erzeugt} Tonspuren erzeugt, ${uebersprungen} bereits vorhanden.\n`);
} catch (e) {
  /* Kein process.exit() mitten in einer laufenden Anfrage – das laesst
     Node unter Windows beim Beenden mit einer libuv-Assertion abstuerzen. */
  console.error("\n" + (e instanceof StimmeFehler ? e.message : e.stack) + "\n");
  process.exitCode = 1;
}
