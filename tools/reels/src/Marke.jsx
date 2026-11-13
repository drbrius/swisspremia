import React from "react";
import { loadFont } from "@remotion/google-fonts/Figtree";
import { MARKE } from "./reels.js";

const { fontFamily } = loadFont();
export const SCHRIFT = fontFamily;

/* Sichere Zonen: oben liegen Profilname und Ton-Schalter, unten
   Beschreibung und Aktionsleiste. Alles Wichtige bleibt dazwischen. */
export const ZONE = { oben: 250, unten: 320, seite: 84 };

export const HINTERGRUND = {
  petrol: { fläche: MARKE.petrol, text: MARKE.weiss, akzent: MARKE.gold, leise: "rgba(255,255,255,.72)" },
  slate:  { fläche: MARKE.slate,  text: MARKE.weiss, akzent: MARKE.gold, leise: "rgba(255,255,255,.68)" },
  creme:  { fläche: MARKE.creme,  text: MARKE.slate, akzent: MARKE.petrol, leise: "rgba(33,45,57,.68)" },
  /* Szenen mit Foto (s.bild): helle Schrift auf abgedunkeltem Bild. */
  foto:   { fläche: MARKE.slate,  text: MARKE.weiss, akzent: MARKE.gold, leise: "rgba(255,255,255,.82)" }
};

/* Look «Küchentisch» (seit 14.11.2026 Standard der Tagesreels): dunkel ist
   die Platine, hell das Papier. "akzent" faerbt Grafik und Zahlen, "marker"
   ist das orange Feld hinter hervorgehobenen Woertern. */
export const TISCHFARBEN = {
  dunkel: { fläche: "#0E1B26", text: "#F4EEE4", akzent: "#EC6A1E", leise: "rgba(244,238,228,.74)", marker: "#EC6A1E", hell: false },
  hell:   { fläche: "#F4EEE4", text: "#14212C", akzent: "#005786", leise: "rgba(20,33,44,.68)", marker: "#EC6A1E", hell: true }
};

/* Bildmarke: dieselbe wie auf der Website – Kreuz auf Petrol. */
export const Kreuz = ({ groesse = 120, farbe = MARKE.petrol, kreuz = MARKE.weiss }) => (
  <svg width={groesse} height={groesse} viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" rx="20" fill={farbe} />
    <rect x="42" y="20" width="16" height="60" fill={kreuz} />
    <rect x="20" y="42" width="60" height="16" fill={kreuz} />
  </svg>
);

export const Wortmarke = ({ farbe = MARKE.weiss, groesse = 64 }) => (
  <div style={{ fontFamily: SCHRIFT, color: farbe, fontSize: groesse, letterSpacing: "-0.01em", lineHeight: 1 }}>
    Swiss<span style={{ fontWeight: 700 }}>Premia</span>
  </div>
);

/* "CHF 2'640" – Schweizer Tausendertrennung. */
export const chf = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
