/* =========================================================================
   Zugang zum Board setzen – im Ordner tools/board, in einem Terminal:

       node passwort.js

   Fragt Benutzername und Passwort (verdeckt, zweimal), speichert beide als
   Umgebungsvariablen im Vercel-Projekt (BOARD_BENUTZER, BOARD_PASSWORT,
   Passwort als "sensitive") und stellt das Board neu bereit – erst dann
   gelten die Werte. Das Passwort geht ueber die Standardeingabe an die
   Vercel-CLI, nie ueber die Kommandozeile oder eine Datei.
   Ein neues Passwort meldet alle Geraete ab.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MINDESTLAENGE } from "./lib/sitzung.js";

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const TROCKEN = process.argv.includes("--trocken");   // nur fragen, nichts in Vercel aendern

/* Im Terminal Zeichen fuer Zeichen lesen (Rohmodus): Die Frage bleibt
   stehen, verdeckte Eingaben erscheinen als *. readline.question hat beim
   Zeichnen die Zeile geloescht – die Frage war dadurch unsichtbar. */
function imTerminalLesen(zeile, verdeckt) {
  return new Promise((fertig) => {
    const ein = process.stdin;
    let wert = "";
    process.stdout.write(zeile);
    ein.setRawMode(true);
    ein.setEncoding("utf8");
    ein.resume();
    const taste = (daten) => {
      if (daten.startsWith("\u001b")) return;   // Pfeiltasten und andere Sondertasten
      for (const z of daten) {
        if (z === "\r" || z === "\n") {
          ein.off("data", taste);
          ein.setRawMode(false);
          ein.pause();
          process.stdout.write("\n");
          return fertig(wert);
        }
        if (z === "\u0003") { process.stdout.write("\nAbgebrochen, nichts geaendert.\n"); process.exit(130); }
        if (z === "\u007f" || z === "\b") {
          if (wert) { wert = wert.slice(0, -1); process.stdout.write("\b \b"); }
          continue;
        }
        if (z < " ") continue;
        wert += z;
        process.stdout.write(verdeckt ? "*" : z);
      }
    };
    ein.on("data", taste);
  });
}

/* Ohne Terminal (Eingabe umgeleitet): Zeile fuer Zeile aus einer einzigen
   readline-Schnittstelle, sonst gehen gepufferte Zeilen verloren. */
let zeilen = null;
async function zeileLesen(zeile) {
  process.stdout.write(zeile + "\n");
  zeilen ||= readline.createInterface({ input: process.stdin })[Symbol.asyncIterator]();
  const r = await zeilen.next();
  return r.done ? "" : r.value;
}

async function frage(text, { verdeckt = false, vorgabe = "" } = {}) {
  const zeile = text + (vorgabe ? ` [${vorgabe}]` : "") + ": ";
  const antwort = process.stdin.isTTY ? await imTerminalLesen(zeile, verdeckt) : await zeileLesen(zeile);
  /* Passwoerter unveraendert lassen – das Login-Formular kuerzt sie auch nicht. */
  return verdeckt ? antwort : antwort.trim() || vorgabe;
}

/* Als eine Befehlszeile (nur feste Woerter, Werte gehen ueber stdin) –
   ein Argument-Array mit shell:true loest in Node 24 die Warnung DEP0190 aus. */
function vercel(args, eingabe) {
  const r = spawnSync(["npx", "vercel", ...args].join(" "), { cwd: WURZEL, input: eingabe, encoding: "utf8", shell: true, stdio: eingabe === undefined ? "inherit" : ["pipe", "pipe", "pipe"] });
  if (r.status !== 0) throw new Error(`vercel ${args.slice(0, 2).join(" ")} fehlgeschlagen:\n${(r.stderr || r.stdout || "").trim()}`);
  return r;
}

if (!fs.existsSync(path.join(WURZEL, ".vercel", "project.json"))) {
  console.error("Dieser Ordner ist noch mit keinem Vercel-Projekt verbunden (npx vercel link). Siehe README.md.");
  process.exit(1);
}
if (!process.stdin.isTTY) console.log("Hinweis: kein interaktives Terminal – die Eingabe ist sichtbar.");

/* Vor der Passwort-Eingabe pruefen, ob die Vercel-CLI hier angemeldet ist –
   sonst scheitert erst der Schritt danach mit "No existing credentials". */
if (!TROCKEN) {
  console.log("Pruefe die Anmeldung der Vercel-CLI …");
  const wer = spawnSync("npx vercel whoami", { cwd: WURZEL, encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "pipe"] });
  if (wer.status !== 0 || /Logged out|credentials/i.test(wer.stdout + wer.stderr)) {
    console.error("Die Vercel-CLI ist in diesem Terminal nicht angemeldet. Zuerst anmelden (oeffnet den Browser):\n\n    npx.cmd vercel login\n\nDanach dieses Skript noch einmal starten.");
    process.exit(1);
  }
  console.log(`Angemeldet als ${wer.stdout.trim().split("\n").pop()}.\n`);
}

const benutzer = await frage("Benutzername", { vorgabe: "swisspremia" });

/* Verdeckt vertippt man sich leicht – bis zu drei Versuche statt Abbruch. */
let passwort = null;
for (let versuch = 1; versuch <= 3 && passwort === null; versuch++) {
  const erst = await frage(`Passwort (mindestens ${MINDESTLAENGE} Zeichen)`, { verdeckt: true });
  if (erst.length < MINDESTLAENGE) { console.log(`Zu kurz: ${erst.length} Zeichen. Bitte noch einmal.\n`); continue; }
  if ((await frage("Passwort wiederholen", { verdeckt: true })) !== erst) { console.log("Die beiden Eingaben sind verschieden. Bitte noch einmal.\n"); continue; }
  passwort = erst;
}
if (passwort === null) { console.error("Drei Versuche ohne Treffer. Nichts geaendert."); process.exit(1); }

if (TROCKEN) {
  console.log(`Trocken: wuerde BOARD_BENUTZER="${benutzer}" und BOARD_PASSWORT (${passwort.length} Zeichen) setzen und neu bereitstellen.`);
  process.exit(0);
}

try {
  vercel(["env", "add", "BOARD_BENUTZER", "production", "--force", "--yes"], benutzer);
  vercel(["env", "add", "BOARD_PASSWORT", "production", "--force", "--sensitive", "--yes"], passwort);
  console.log("Zugang in Vercel gespeichert. Board wird neu bereitgestellt …\n");
  vercel(["deploy", "--prod", "--yes"]);
  console.log(`\nFertig. Anmelden mit Benutzer "${benutzer}" und dem eben gewaehlten Passwort.`);
  process.exit(0);
} catch (e) {
  console.error("\n" + e.message);
  process.exit(1);
}
