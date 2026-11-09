/* =========================================================================
   Eigene Hintergrundmusik, im Code erzeugt – ohne fremde Rechte.

   Ersatz, solange keine ElevenLabs-Musik vorliegt (funnel/musik.js zieht
   ElevenLabs-Stuecke vor). Vier Stimmungen, je 50 s, als ruhiges Bett unter
   der Stimme: Flaechen, gezupfte Toene (Karplus-Strong), weicher Bass,
   leises Rhythmus-Rauschen. Akkordfolgen und Tempo je Stimmung; Lautheit
   mit ffmpeg auf -20 LUFS angeglichen, damit alle Stuecke gleich laut sind.

       node funnel/musik.js eigene        alle vier erzeugen (wenige Sekunden)
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const SR = 44100;
const SEKUNDEN = 50;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* Fester Zufall, damit jedes Stueck bei jedem Lauf gleich klingt. */
function zufall(saat) {
  let s = saat >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function hinzu(puffer, start, signal) {
  const i0 = Math.round(start * SR);
  for (let i = 0; i < signal.length && i0 + i < puffer.length; i++) if (i0 + i >= 0) puffer[i0 + i] += signal[i];
}

/* Weiche Flaeche: je Ton zwei leicht verstimmte Oszillatoren (Sinus plus
   etwas Dreieck), langsamer Einsatz und Ausklang, sanftes Schweben. */
function flaeche(toene, dauer, lautstaerke) {
  const n = Math.round((dauer + 1.2) * SR), out = new Float32Array(n);
  const angriff = 0.7 * SR, ausklang = 1.2 * SR, halten = dauer * SR;
  for (const midi of toene) {
    for (const verstimmung of [0.9985, 1.0015]) {
      const f = hz(midi) * verstimmung;
      let phase = Math.random() * 2 * Math.PI;
      for (let i = 0; i < n; i++) {
        phase += (2 * Math.PI * f) / SR;
        const dreieck = (2 / Math.PI) * Math.asin(Math.sin(phase));
        const env = i < angriff ? i / angriff : i < halten ? 1 : Math.max(0, 1 - (i - halten) / ausklang);
        out[i] += (0.75 * Math.sin(phase) + 0.25 * dreieck) * env * lautstaerke / toene.length;
      }
    }
  }
  return tiefpass(out, 1600);
}

/* Gezupfter Ton (Karplus-Strong): Rauschimpuls in einer Verzoegerungs-
   schleife, die sich bei jedem Umlauf glaettet – klingt nach Gitarre/Harfe. */
function zupfen(midi, lautstaerke, rnd, { dauer = 1.6, daempfung = 0.994, hell = 0.5 } = {}) {
  const f = hz(midi), laenge = Math.max(2, Math.round(SR / f));
  const ring = new Float32Array(laenge);
  for (let i = 0; i < laenge; i++) ring[i] = rnd() * 2 - 1;
  const n = Math.round(dauer * SR), out = new Float32Array(n);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[k], b = ring[(k + 1) % laenge];
    ring[k] = daempfung * (hell * a + (1 - hell) * b);
    out[i] = a * lautstaerke * (i < 40 ? i / 40 : 1);
    k = (k + 1) % laenge;
  }
  return tiefpass(out, 3200);
}

function bass(midi, dauer, lautstaerke) {
  const n = Math.round((dauer + 0.2) * SR), out = new Float32Array(n), f = hz(midi);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.012) * Math.exp(-t / (dauer * 0.9));
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(4 * Math.PI * f * t)) * env * lautstaerke;
  }
  return out;
}

function rascheln(lautstaerke, rnd, dauer = 0.07) {
  const n = Math.round(dauer * SR), out = new Float32Array(n);
  let vorher = 0;
  for (let i = 0; i < n; i++) {
    const r = rnd() * 2 - 1, hoch = r - vorher; vorher = r;   // grober Hochpass
    out[i] = hoch * Math.exp(-i / (0.018 * SR)) * lautstaerke;
  }
  return out;
}

function schlag(lautstaerke) {
  const n = Math.round(0.22 * SR), out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 50 + 70 * Math.exp(-t / 0.03);
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t / 0.07) * lautstaerke;
  }
  return out;
}

function ticken(lautstaerke) {
  const n = Math.round(0.02 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * 2200 * i) / SR) * Math.exp(-i / (0.004 * SR)) * lautstaerke;
  return out;
}

function tiefpass(sig, grenze) {
  const a = Math.exp((-2 * Math.PI * grenze) / SR);
  let y = 0;
  for (let i = 0; i < sig.length; i++) { y = (1 - a) * sig[i] + a * y; sig[i] = y; }
  return sig;
}

function echo(sig, sekunden, rueckkopplung, anteil) {
  const d = Math.round(sekunden * SR), out = Float32Array.from(sig);
  for (let i = d; i < out.length; i++) out[i] += out[i - d] * rueckkopplung;
  for (let i = 0; i < out.length; i++) out[i] = sig[i] * (1 - anteil) + out[i] * anteil;
  return out;
}

/* Akkorde als MIDI-Grundton + Art. */
const DUR = [0, 4, 7], MOLL = [0, 3, 7];
const akkord = (grund, art) => art.map((x) => grund + x);

const STIMMUNGEN = {
  ruhig: { bpm: 84, folge: [[57, MOLL], [53, DUR], [60, DUR], [55, DUR]], zupf: "viertel", rhythmus: false, schlag: false, ticken: false, saat: 11 },
  hell: { bpm: 112, folge: [[60, DUR], [55, DUR], [57, MOLL], [53, DUR]], zupf: "achtel", rhythmus: true, schlag: true, ticken: false, saat: 23 },
  puls: { bpm: 104, folge: [[57, MOLL], [53, DUR], [60, DUR], [55, DUR]], zupf: "puls", rhythmus: false, schlag: false, ticken: true, saat: 37 },
  warm: { bpm: 80, folge: [[53, DUR], [60, DUR], [55, DUR], [57, MOLL]], zupf: "fingerpicking", rhythmus: false, schlag: false, ticken: false, saat: 41 }
};

export function stueckRechnen(stimmung) {
  const s = STIMMUNGEN[stimmung];
  const rnd = zufall(s.saat);
  const schlagS = 60 / s.bpm, takt = 4 * schlagS;
  const mix = new Float32Array(SEKUNDEN * SR + SR);
  const gezupft = new Float32Array(mix.length);
  for (let t = 0, nr = 0; t < SEKUNDEN; t += takt, nr++) {
    const [grund, art] = s.folge[nr % s.folge.length];
    const toene = akkord(grund, art);
    hinzu(mix, t, flaeche(toene.map((m) => m - 12).concat([grund + art[2]]), takt, 0.55));
    hinzu(mix, t, bass(grund - 24, schlagS * 1.8, 0.32));
    hinzu(mix, t + 2 * schlagS, bass(grund - 24, schlagS * 1.6, 0.26));
    const oben = toene.concat([grund + 12]);
    if (s.zupf === "viertel") {
      for (let b = 0; b < 4; b++) hinzu(gezupft, t + b * schlagS, zupfen(oben[(b + nr) % oben.length], 0.22, rnd, { dauer: 2.2, daempfung: 0.996 }));
    } else if (s.zupf === "achtel") {
      const muster = [0, 2, 1, 3, 2, 1, 3, 2];
      for (let b = 0; b < 8; b++) hinzu(gezupft, t + (b * schlagS) / 2, zupfen(oben[muster[b]] + 12, b % 2 ? 0.12 : 0.17, rnd, { dauer: 1.1, daempfung: 0.992, hell: 0.45 }));
    } else if (s.zupf === "puls") {
      for (let b = 0; b < 16; b++) hinzu(gezupft, t + (b * schlagS) / 4, zupfen((b % 4 === 2 ? grund + 7 : grund) + 12, b % 4 === 0 ? 0.16 : 0.09, rnd, { dauer: 0.35, daempfung: 0.97, hell: 0.4 }));
    } else if (s.zupf === "fingerpicking") {
      const muster = [grund - 12, grund + art[2], grund + 12, grund + art[1] + 12, grund + art[2] + 12, grund + 12, grund + art[2], grund + art[1] + 12];
      for (let b = 0; b < 8; b++) hinzu(gezupft, t + (b * schlagS) / 2, zupfen(muster[b], b === 0 ? 0.24 : 0.15, rnd, { dauer: 2.0, daempfung: 0.997, hell: 0.55 }));
    }
    for (let b = 0; b < 8; b++) {
      const zeit = t + (b * schlagS) / 2;
      if (s.rhythmus) hinzu(mix, zeit, rascheln(b % 2 ? 0.05 : 0.09, rnd));
      if (s.schlag && b % 2 === 0) hinzu(mix, zeit, schlag(0.35));
      if (s.ticken && b % 2 === 0) hinzu(mix, zeit, ticken(b === 0 ? 0.06 : 0.035));
    }
  }
  const mitEcho = echo(gezupft, 0.75 * schlagS, 0.32, 0.3);
  for (let i = 0; i < mix.length; i++) mix[i] += mitEcho[i];
  /* Sanft begrenzen, dann auf 50 s schneiden; Ein-/Ausblenden macht das Reel. */
  const out = new Int16Array(SEKUNDEN * SR);
  let max = 1e-9;
  for (let i = 0; i < out.length; i++) max = Math.max(max, Math.abs(mix[i]));
  for (let i = 0; i < out.length; i++) out[i] = Math.round(Math.tanh((mix[i] / max) * 1.4) * 0.85 * 32767);
  return out;
}

function wavSchreiben(datei, samples) {
  const kopf = Buffer.alloc(44);
  kopf.write("RIFF", 0); kopf.writeUInt32LE(36 + samples.length * 2, 4); kopf.write("WAVE", 8);
  kopf.write("fmt ", 12); kopf.writeUInt32LE(16, 16); kopf.writeUInt16LE(1, 20); kopf.writeUInt16LE(1, 22);
  kopf.writeUInt32LE(SR, 24); kopf.writeUInt32LE(SR * 2, 28); kopf.writeUInt16LE(2, 32); kopf.writeUInt16LE(16, 34);
  kopf.write("data", 36); kopf.writeUInt32LE(samples.length * 2, 40);
  fs.writeFileSync(datei, Buffer.concat([kopf, Buffer.from(samples.buffer)]));
}

/* ffmpeg aus der Remotion-Installation (Windows); sonst eines im PATH. */
export function ffmpegPfad() {
  try {
    const require = createRequire(import.meta.url);
    const ordner = path.dirname(require.resolve("@remotion/compositor-win32-x64-msvc/package.json"));
    const exe = path.join(ordner, "ffmpeg.exe");
    if (fs.existsSync(exe)) return exe;
  } catch (e) { /* anderes System */ }
  return "ffmpeg";
}

/* Ein Stueck erzeugen und als MP3 (-20 LUFS) ablegen. */
export function eigenesStueck(stimmung, ziel) {
  const wav = ziel.replace(/\.mp3$/, ".wav");
  wavSchreiben(wav, stueckRechnen(stimmung));
  execFileSync(ffmpegPfad(), ["-y", "-hide_banner", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-20:TP=-2:LRA=7", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", ziel]);
  fs.rmSync(wav, { force: true });
  return ziel;
}
