import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as ladeFraunces } from "@remotion/google-fonts/Fraunces";
import { MARKE } from "./reels.js";
import { SCHRIFT, Kreuz } from "./Marke.jsx";
import { bildDateiKarussell } from "./bilder.js";
import { STUFEN } from "../funnel/themen.js";

/* =========================================================================
   Karussell – Folien fuer Instagram-Beitraege (1080 x 1350, Hochformat 4:5).

   Ein Karussell ist ein Objekt { stil, datum, folien: [...] }; jede Folie
   hat eine "art" (cover, text, zahl, balken, liste, tabelle, stempel, cta).
   Die Komposition "karussell" (Root.jsx) zeigt je Frame eine Folie –
   Frame 0 ist die erste Folie, der Funnel rendert jeden Frame als JPEG.

   Vier Stile, damit nicht jedes Karussell gleich aussieht:
     fakt        Fakt des Tages – ruhig, redaktionell, Serifenschrift,
                 grosses Foto auf dem Titel, Fotokarten im Inneren
     zahl        Zahl des Tages – plakativ, fette Zahl, schraeg
                 angeschnittenes Foto, Aufkleber
     check       Mythos-Check – Sprechblase, Polaroid, Stempel
     steckbrief  Kanton-Steckbrief – Foto mit Karte, Tabelle

   Fotos: bild = Name aus src/bilder.js, Datei public/bilder/<name>-k.jpg
   (4:5-Zuschnitt, laedt funnel/bilder.js). Fehlt das Foto, bleibt die
   Flaeche farbig.
   ========================================================================= */

const { fontFamily: SERIF } = ladeFraunces("normal", { weights: ["300", "400", "600", "700"], subsets: ["latin", "latin-ext"] });
ladeFraunces("italic", { weights: ["300", "400"], subsets: ["latin", "latin-ext"] });

export const KARUSSELL_BREITE = 1080;
export const KARUSSELL_HOEHE = 1350;
const RAND = 72;

const FARBEN = {
  creme:  { flaeche: MARKE.creme,  text: MARKE.slate, akzent: MARKE.petrol, gold: MARKE.goldText, leise: "rgba(33,45,57,.62)",   linie: "rgba(33,45,57,.14)",   karte: "#ffffff",          dunkel: false },
  petrol: { flaeche: MARKE.petrol, text: MARKE.weiss, akzent: MARKE.gold,   gold: MARKE.gold,     leise: "rgba(255,255,255,.74)", linie: "rgba(255,255,255,.2)", karte: MARKE.petrolDunkel, dunkel: true },
  slate:  { flaeche: MARKE.slate,  text: MARKE.weiss, akzent: MARKE.gold,   gold: MARKE.gold,     leise: "rgba(255,255,255,.7)",  linie: "rgba(255,255,255,.16)", karte: "#2b3947",         dunkel: true },
  foto:   { flaeche: MARKE.slate,  text: MARKE.weiss, akzent: MARKE.gold,   gold: MARKE.gold,     leise: "rgba(255,255,255,.8)",  linie: "rgba(255,255,255,.24)", karte: "rgba(255,255,255,.1)", dunkel: true }
};

/* "**fett**" im Text: fett und in der Akzentfarbe. */
const Fett = ({ text, akzent, gewicht = 600 }) => (
  <>
    {String(text).split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
      t.startsWith("**") ? <span key={i} style={{ fontWeight: gewicht, color: akzent }}>{t.slice(2, -2)}</span> : <span key={i}>{t}</span>
    )}
  </>
);
const zeilen = (text) => (Array.isArray(text) ? text : [text]);

/* ------------------------------------------------------------- Bausteine */

const Foto = ({ name, verlauf = "oben" }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Img src={staticFile(bildDateiKarussell(name))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <AbsoluteFill style={{
      background: verlauf === "oben"
        ? "linear-gradient(180deg, rgba(0,68,106,.55) 0%, rgba(33,45,57,.25) 35%, rgba(33,45,57,.55) 60%, rgba(16,24,32,.92) 100%)"
        : "linear-gradient(180deg, rgba(0,68,106,.35) 0%, rgba(33,45,57,.2) 50%, rgba(16,24,32,.75) 100%)"
    }} />
  </AbsoluteFill>
);

/* Foto als gerahmte Karte, leicht gedreht – wie ein Abzug auf dem Tisch. */
const Fotokarte = ({ name, breite = 936, hoehe = 520, drehung = -1.5, rahmen = 14, polaroid = false, stil = {} }) => (
  <div style={{
    width: breite, height: hoehe + (polaroid ? 90 : 0), backgroundColor: "#fff", padding: rahmen, paddingBottom: polaroid ? rahmen + 90 : rahmen,
    boxShadow: "0 30px 60px rgba(16,24,32,.28), 0 4px 10px rgba(16,24,32,.12)", transform: `rotate(${drehung}deg)`, boxSizing: "border-box", ...stil
  }}>
    <div style={{ width: "100%", height: "100%", overflow: "hidden", backgroundColor: MARKE.slate }}>
      {name && <Img src={staticFile(bildDateiKarussell(name))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: breite > hoehe ? "50% 22%" : "50% 40%" }} />}
    </div>
  </div>
);

const Marke = ({ farben, gross = false, stil = {} }) => (
  <div style={{ display: "flex", alignItems: "center", gap: gross ? 18 : 14, ...stil }}>
    <Kreuz groesse={gross ? 56 : 42} farbe={farben.dunkel ? MARKE.gold : MARKE.petrol} kreuz={farben.dunkel ? MARKE.slate : MARKE.weiss} />
    <div style={{ fontFamily: SCHRIFT, fontSize: gross ? 30 : 24, letterSpacing: ".2em", textTransform: "uppercase", color: farben.leise, fontWeight: 500 }}>SwissPremia</div>
  </div>
);

const Etikett = ({ text, farben, voll = true, stil = {} }) => (
  <div style={{
    display: "inline-block", padding: "12px 24px", borderRadius: 999, fontFamily: SCHRIFT, fontSize: 24, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase",
    backgroundColor: voll ? (farben.dunkel ? MARKE.gold : MARKE.petrol) : "transparent", color: voll ? (farben.dunkel ? MARKE.slate : MARKE.weiss) : farben.akzent,
    border: voll ? "none" : `2px solid ${farben.akzent}`, ...stil
  }}>{text}</div>
);

const Kicker = ({ text, farben, stil = {} }) => (
  <div style={{ fontFamily: SCHRIFT, fontSize: 26, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: farben.gold, ...stil }}>{text}</div>
);

/* Punkte fuer die Folien, aktuelle hervorgehoben, plus Zaehler. */
const Fuss = ({ index, anzahl, farben, hinweis = null }) => (
  <div style={{ position: "absolute", left: RAND, right: RAND, bottom: 56, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: SCHRIFT }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {Array.from({ length: anzahl }, (_, i) => (
        <div key={i} style={{ width: i === index ? 34 : 10, height: 10, borderRadius: 999, backgroundColor: i === index ? farben.akzent : farben.linie, transition: "none" }} />
      ))}
      {hinweis && <div style={{ marginLeft: 18, fontSize: 24, color: farben.leise, letterSpacing: ".06em" }}>{hinweis}</div>}
    </div>
    <div style={{ fontSize: 24, color: farben.leise, letterSpacing: ".1em", fontVariantNumeric: "tabular-nums" }}>{String(index + 1).padStart(2, "0")} / {String(anzahl).padStart(2, "0")}</div>
  </div>
);

const Pfeil = ({ farbe, groesse = 36 }) => (
  <svg width={groesse * 1.6} height={groesse} viewBox="0 0 58 36" aria-hidden="true">
    <path d="M2 18h50M38 4l16 14-16 14" fill="none" stroke={farbe} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Grosse, blasse Folienzahl – Schmuck am oberen rechten Rand. */
const Ziffer = ({ index, farben }) => (
  <div style={{ position: "absolute", right: RAND - 10, top: 30, fontFamily: SERIF, fontWeight: 700, fontSize: 300, lineHeight: 1, color: farben.akzent, opacity: farben.dunkel ? .14 : .08, letterSpacing: "-0.04em" }}>
    {String(index + 1).padStart(2, "0")}
  </div>
);

/* Rahmen jeder Folie: Flaeche oder Foto, Marke oben links, Fuss unten. */
const Rahmen = ({ hintergrund = "creme", bild = null, verlauf = "oben", index, anzahl, hinweis = null, ohneMarke = false, ohneFuss = false, children }) => {
  const farben = bild ? FARBEN.foto : FARBEN[hintergrund] || FARBEN.creme;
  return (
    <AbsoluteFill style={{ backgroundColor: farben.flaeche, fontFamily: SCHRIFT, color: farben.text }}>
      {bild && <Foto name={bild} verlauf={verlauf} />}
      {!ohneMarke && <Marke farben={farben} stil={{ position: "absolute", left: RAND, top: RAND }} />}
      {children(farben)}
      {!ohneFuss && <Fuss index={index} anzahl={anzahl} farben={farben} hinweis={hinweis} />}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- Titel */

const STIL_ETIKETT = { fakt: "Fakt des Tages", zahl: "Zahl des Tages", check: "Mythos-Check", steckbrief: "Kanton-Steckbrief" };

const CoverFakt = ({ f, k, index, anzahl }) => {
  const z = zeilen(f.titel);
  const groesse = z.join(" ").length > 70 ? 72 : z.length > 3 ? 76 : 88;
  return (
    <Rahmen bild={f.bild} hintergrund="slate" index={index} anzahl={anzahl} ohneFuss>
      {(farben) => (
        <>
          <Etikett text={f.etikett || STIL_ETIKETT[k.stil]} farben={farben} stil={{ position: "absolute", right: RAND, top: 126 }} />
          <div style={{ position: "absolute", left: RAND, right: RAND, bottom: 150 }}>
            <Kicker text={f.ueber || k.datum} farben={farben} stil={{ marginBottom: 26 }} />
            {z.map((t, i) => (
              <div key={i} style={{ fontFamily: SERIF, fontWeight: 300, fontSize: groesse, lineHeight: 1.1, letterSpacing: "-0.015em", textShadow: "0 2px 30px rgba(0,0,0,.35)" }}>
                <Fett text={t} akzent={farben.akzent} gewicht={600} />
              </div>
            ))}
            {f.unten && <div style={{ marginTop: 26, fontSize: 32, color: farben.leise, lineHeight: 1.35 }}>{f.unten}</div>}
            <div style={{ marginTop: 40, height: 2, backgroundColor: farben.linie }} />
            <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 26, letterSpacing: ".14em", textTransform: "uppercase", color: farben.leise }}>
                Wischen <Pfeil farbe={farben.akzent} groesse={28} />
              </div>
              <div style={{ fontSize: 24, color: farben.leise, letterSpacing: ".1em" }}>01 / {String(anzahl).padStart(2, "0")}</div>
            </div>
          </div>
        </>
      )}
    </Rahmen>
  );
};

/* Zahl des Tages: Foto oben, schraeg angeschnitten; Zahl darunter. */
const CoverZahl = ({ f, k, index, anzahl }) => (
  <Rahmen hintergrund="petrol" index={index} anzahl={anzahl} ohneMarke hinweis="Wischen →">
    {(farben) => (
      <>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 720, overflow: "hidden", clipPath: "polygon(0 0, 100% 0, 100% 78%, 0 100%)", backgroundColor: MARKE.slate }}>
          {f.bild && <Img src={staticFile(bildDateiKarussell(f.bild))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,68,106,.45), rgba(33,45,57,.15) 60%, rgba(0,87,134,.5))" }} />
        </div>
        <Marke farben={FARBEN.foto} stil={{ position: "absolute", left: RAND, top: RAND }} />
        <div style={{
          position: "absolute", right: RAND - 10, top: 560, transform: "rotate(-7deg)", padding: "16px 30px", backgroundColor: MARKE.gold, color: MARKE.slate,
          fontSize: 30, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", boxShadow: "0 16px 40px rgba(0,0,0,.3)"
        }}>{f.etikett || STIL_ETIKETT.zahl}</div>
        <div style={{ position: "absolute", left: RAND, right: RAND, top: 760 }}>
          <Kicker text={f.ueber || k.datum} farben={farben} />
          <div style={{ marginTop: 14, fontSize: f.zahl.length > 9 ? 150 : 180, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: MARKE.weiss }}>
            {f.zahl}
          </div>
          {zeilen(f.titel).map((t, i) => (
            <div key={i} style={{ fontSize: 46, lineHeight: 1.22, fontWeight: 400, marginTop: i === 0 ? 24 : 0 }}><Fett text={t} akzent={farben.akzent} /></div>
          ))}
        </div>
      </>
    )}
  </Rahmen>
);

/* Mythos-Check: Sprechblase mit dem Satz, Polaroid, Frage unten. */
const CoverCheck = ({ f, k, index, anzahl }) => (
  <Rahmen hintergrund="creme" index={index} anzahl={anzahl} hinweis="Wischen →">
    {(farben) => (
      <>
        <Etikett text={f.etikett || STIL_ETIKETT.check} farben={farben} stil={{ position: "absolute", right: RAND, top: 126 }} />
        <div style={{ position: "absolute", left: RAND, top: 270, width: 820, transform: "rotate(-2deg)" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 36, padding: "54px 60px", boxShadow: "0 30px 60px rgba(33,45,57,.16)", position: "relative" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 120, lineHeight: .6, color: MARKE.gold, marginBottom: 18 }}>«</div>
            {zeilen(f.titel).map((t, i) => (
              <div key={i} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 62, lineHeight: 1.16, color: MARKE.slate }}>{t}</div>
            ))}
            <div style={{ position: "absolute", left: 90, bottom: -34, width: 0, height: 0, borderLeft: "0 solid transparent", borderRight: "48px solid transparent", borderTop: "40px solid #fff" }} />
          </div>
        </div>
        <div style={{ position: "absolute", right: RAND - 20, top: 760 }}>
          <Fotokarte name={f.bild} breite={400} hoehe={400} drehung={5} polaroid />
        </div>
        <div style={{ position: "absolute", left: RAND, bottom: 170, width: 520 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 84, lineHeight: 1, color: MARKE.petrol }}>Stimmt das?</div>
          <div style={{ marginTop: 20, fontSize: 30, color: farben.leise, lineHeight: 1.35 }}>{f.unten || "Die Antwort auf der nächsten Folie."}</div>
        </div>
      </>
    )}
  </Rahmen>
);

/* Kanton-Steckbrief: Foto, darueber eine Karte mit Namen und drei Werten. */
const CoverSteckbrief = ({ f, k, index, anzahl }) => (
  <Rahmen bild={f.bild} verlauf="unten" hintergrund="slate" index={index} anzahl={anzahl} ohneFuss>
    {(farben) => (
      <>
        <Etikett text={f.etikett || STIL_ETIKETT.steckbrief} farben={farben} stil={{ position: "absolute", right: RAND, top: 126 }} />
        <div style={{ position: "absolute", left: RAND, right: RAND, bottom: 72, backgroundColor: MARKE.creme, borderRadius: 30, padding: "48px 56px 44px", color: MARKE.slate, boxShadow: "0 30px 70px rgba(0,0,0,.35)" }}>
          <Kicker text={f.ueber || "Kanton"} farben={FARBEN.creme} />
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: zeilen(f.titel).join("").length > 14 ? 76 : 100, lineHeight: 1.02, letterSpacing: "-0.02em", marginTop: 10, color: MARKE.petrol }}>
            {zeilen(f.titel).map((t, i) => <div key={i}>{t}</div>)}
          </div>
          {f.unten && <div style={{ marginTop: 14, fontSize: 32, color: FARBEN.creme.leise }}>{f.unten}</div>}
          {f.werte && (
            <div style={{ display: "flex", gap: 24, marginTop: 36, paddingTop: 30, borderTop: `2px solid ${FARBEN.creme.linie}` }}>
              {f.werte.map((w, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 54, lineHeight: 1, color: MARKE.slate }}>{w.wert}</div>
                  <div style={{ marginTop: 10, fontSize: 23, color: FARBEN.creme.leise, lineHeight: 1.3 }}>{w.text}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 30, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, letterSpacing: ".14em", textTransform: "uppercase", color: FARBEN.creme.leise }}>Wischen <Pfeil farbe={MARKE.petrol} groesse={24} /></div>
            <div style={{ fontSize: 24, color: FARBEN.creme.leise, letterSpacing: ".1em" }}>01 / {String(anzahl).padStart(2, "0")}</div>
          </div>
        </div>
      </>
    )}
  </Rahmen>
);

const COVER = { fakt: CoverFakt, zahl: CoverZahl, check: CoverCheck, steckbrief: CoverSteckbrief };

/* --------------------------------------------------------- Innenfolien */

/* Text mit Fotokarte (oder ohne). "merke" = hervorgehobener Satz. */
const Text = ({ f, k, index, anzahl }) => {
  const hintergrund = f.hintergrund || "creme";
  const mitBild = Boolean(f.bild);
  const plakativ = k.stil === "zahl";
  return (
    <Rahmen hintergrund={hintergrund} index={index} anzahl={anzahl}>
      {(farben) => (
        <>
          {!mitBild && <Ziffer index={index} farben={farben} />}
          {mitBild && (
            <div style={{ position: "absolute", left: RAND, top: 160 }}>
              <Fotokarte name={f.bild} breite={936} hoehe={f.text && zeilen(f.text).join(" ").length > 260 ? 420 : 500} drehung={index % 2 ? 1.4 : -1.4} />
            </div>
          )}
          <div style={{ position: "absolute", left: RAND, right: RAND, top: mitBild ? (f.text && zeilen(f.text).join(" ").length > 260 ? 660 : 740) : 300 }}>
            {f.ueber && <Kicker text={f.ueber} farben={farben} stil={{ marginBottom: 18 }} />}
            {f.titel && zeilen(f.titel).map((t, i) => (
              <div key={i} style={{ fontFamily: plakativ ? SCHRIFT : SERIF, fontWeight: plakativ ? 800 : 600, fontSize: mitBild ? 58 : 72, lineHeight: 1.1, letterSpacing: plakativ ? "-0.02em" : "-0.01em" }}>
                <Fett text={t} akzent={farben.akzent} gewicht={plakativ ? 800 : 600} />
              </div>
            ))}
            {f.text && zeilen(f.text).map((t, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 26 : 18, fontSize: 38, lineHeight: 1.38, fontWeight: 400, color: farben.text }}>
                <Fett text={t} akzent={farben.akzent} />
              </div>
            ))}
            {f.merke && (
              <div style={{ marginTop: 36, paddingLeft: 30, borderLeft: `6px solid ${farben.akzent}`, fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 40, lineHeight: 1.3, color: farben.text }}>
                <Fett text={f.merke} akzent={farben.akzent} gewicht={400} />
              </div>
            )}
          </div>
        </>
      )}
    </Rahmen>
  );
};

/* Eine grosse Zahl mit Erklaerung. */
const Zahl = ({ f, k, index, anzahl }) => {
  const plakativ = k.stil === "zahl" || k.stil === "steckbrief";
  const lang = String(f.zahl).length;
  return (
    <Rahmen hintergrund={f.hintergrund || "petrol"} index={index} anzahl={anzahl}>
      {(farben) => (
        <>
          <div style={{ position: "absolute", right: -140, top: 180, width: 620, height: 620, borderRadius: "50%", border: `3px dashed ${farben.akzent}`, opacity: .35 }} />
          <div style={{ position: "absolute", right: -60, top: 260, width: 460, height: 460, borderRadius: "50%", border: `2px solid ${farben.linie}` }} />
          <div style={{ position: "absolute", left: RAND, right: RAND, top: 190, bottom: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {f.ueber && <Kicker text={f.ueber} farben={farben} stil={{ marginBottom: 22 }} />}
            <div style={{ fontFamily: plakativ ? SCHRIFT : SERIF, fontWeight: plakativ ? 800 : 600, fontSize: lang > 9 ? 136 : lang > 6 ? 168 : 210, lineHeight: 1, letterSpacing: plakativ ? "-0.04em" : "-0.02em", color: farben.text }}>
              {f.zahl}
            </div>
            {f.einheit && <div style={{ marginTop: 12, fontSize: 44, fontWeight: 500, color: farben.akzent }}>{f.einheit}</div>}
            <div style={{ marginTop: 40, width: 120, height: 6, backgroundColor: farben.akzent, borderRadius: 3 }} />
            {f.text && zeilen(f.text).map((t, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 34 : 16, fontSize: 38, lineHeight: 1.38, color: farben.text, maxWidth: 880 }}><Fett text={t} akzent={farben.akzent} /></div>
            ))}
            {f.quelle && <div style={{ marginTop: 30, fontSize: 24, color: farben.leise, lineHeight: 1.4, maxWidth: 880 }}>{f.quelle}</div>}
          </div>
        </>
      )}
    </Rahmen>
  );
};

/* Waagrechte Balken – guenstigstes Angebot je Modell, Altersklasse ... */
const Balken = ({ f, k, index, anzahl }) => {
  const max = Math.max(...f.balken.map((b) => b.wert));
  return (
    <Rahmen hintergrund={f.hintergrund || "slate"} index={index} anzahl={anzahl}>
      {(farben) => (
        <div style={{ position: "absolute", left: RAND, right: RAND, top: 200 }}>
          {f.ueber && <Kicker text={f.ueber} farben={farben} stil={{ marginBottom: 18 }} />}
          {f.titel && zeilen(f.titel).map((t, i) => (
            <div key={i} style={{ fontFamily: k.stil === "fakt" ? SERIF : SCHRIFT, fontWeight: k.stil === "fakt" ? 600 : 800, fontSize: 60, lineHeight: 1.1, letterSpacing: "-0.01em" }}><Fett text={t} akzent={farben.akzent} /></div>
          ))}
          <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 44 }}>
            {f.balken.map((b, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <div style={{ fontSize: 34, fontWeight: b.gold ? 700 : 500, color: b.gold ? farben.akzent : farben.text }}>{b.label}</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 46, color: b.gold ? farben.akzent : farben.text, fontVariantNumeric: "tabular-nums" }}>{b.text}</div>
                </div>
                <div style={{ height: 34, borderRadius: 999, backgroundColor: farben.linie, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(6, (b.wert / max) * 100)}%`, height: "100%", borderRadius: 999, backgroundColor: b.gold ? farben.akzent : (farben.dunkel ? "rgba(255,255,255,.55)" : "rgba(0,87,134,.55)") }} />
                </div>
                {b.unter && <div style={{ marginTop: 8, fontSize: 24, color: farben.leise }}>{b.unter}</div>}
              </div>
            ))}
          </div>
          {f.fuss && <div style={{ marginTop: 44, fontSize: 26, lineHeight: 1.4, color: farben.leise }}>{f.fuss}</div>}
        </div>
      )}
    </Rahmen>
  );
};

/* Nummerierte Punkte. */
const Liste = ({ f, k, index, anzahl }) => (
  <Rahmen hintergrund={f.hintergrund || "creme"} index={index} anzahl={anzahl}>
    {(farben) => (
      <div style={{ position: "absolute", left: RAND, right: RAND, top: 190 }}>
        {f.ueber && <Kicker text={f.ueber} farben={farben} stil={{ marginBottom: 18 }} />}
        {f.titel && zeilen(f.titel).map((t, i) => (
          <div key={i} style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 62, lineHeight: 1.1 }}><Fett text={t} akzent={farben.akzent} /></div>
        ))}
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 30 }}>
          {f.punkte.map((p, i) => {
            const titel = typeof p === "string" ? p : p.titel;
            return (
              <div key={i} style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
                <div style={{ flex: "none", width: 64, height: 64, borderRadius: "50%", backgroundColor: farben.akzent, color: farben.dunkel ? MARKE.slate : MARKE.weiss, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 34 }}>{i + 1}</div>
                <div style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.2 }}><Fett text={titel} akzent={farben.akzent} /></div>
                  {p.text && <div style={{ marginTop: 8, fontSize: 32, lineHeight: 1.35, color: farben.leise }}>{p.text}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {f.fuss && <div style={{ marginTop: 40, fontSize: 26, lineHeight: 1.4, color: farben.leise }}>{f.fuss}</div>}
      </div>
    )}
  </Rahmen>
);

/* Tabelle auf einer weissen Karte (Steckbrief). */
const Tabelle = ({ f, k, index, anzahl }) => (
  <Rahmen hintergrund={f.hintergrund || "creme"} index={index} anzahl={anzahl}>
    {(farben) => (
      <div style={{ position: "absolute", left: RAND, right: RAND, top: 180 }}>
        {f.ueber && <Kicker text={f.ueber} farben={farben} stil={{ marginBottom: 18 }} />}
        {f.titel && zeilen(f.titel).map((t, i) => (
          <div key={i} style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 60, lineHeight: 1.1 }}><Fett text={t} akzent={farben.akzent} /></div>
        ))}
        <div style={{ marginTop: 40, backgroundColor: farben.karte, borderRadius: 24, padding: "10px 34px 14px", boxShadow: farben.dunkel ? "none" : "0 24px 50px rgba(33,45,57,.12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `1.35fr repeat(${f.spalten.length - 1}, 1fr)`, borderBottom: `2px solid ${farben.linie}`, padding: "22px 0 16px" }}>
            {f.spalten.map((s, i) => (
              <div key={i} style={{ fontSize: 22, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: farben.leise, textAlign: i ? "right" : "left" }}>{s}</div>
            ))}
          </div>
          {f.zeilen.map((z, zi) => (
            <div key={zi} style={{ display: "grid", gridTemplateColumns: `1.35fr repeat(${f.spalten.length - 1}, 1fr)`, alignItems: "baseline", padding: "24px 0", borderBottom: zi < f.zeilen.length - 1 ? `1px solid ${farben.linie}` : "none" }}>
              {z.map((wert, i) => (
                <div key={i} style={{
                  textAlign: i ? "right" : "left", fontFamily: i ? SERIF : SCHRIFT, fontWeight: i ? 600 : 600, fontSize: i ? 40 : 32, lineHeight: 1.15,
                  color: i ? farben.akzent : farben.text, fontVariantNumeric: "tabular-nums"
                }}>{wert}</div>
              ))}
            </div>
          ))}
        </div>
        {f.fuss && <div style={{ marginTop: 34, fontSize: 25, lineHeight: 1.4, color: farben.leise }}>{f.fuss}</div>}
        {f.merke && (
          <div style={{ marginTop: 56, paddingLeft: 30, borderLeft: `6px solid ${farben.akzent}`, fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 40, lineHeight: 1.3, color: farben.text }}>
            <Fett text={f.merke} akzent={farben.akzent} gewicht={400} />
          </div>
        )}
      </div>
    )}
  </Rahmen>
);

/* Mythos durchgestrichen, Stempel darueber, darunter die Wahrheit. */
const Stempel = ({ f, k, index, anzahl }) => (
  <Rahmen hintergrund={f.hintergrund || "creme"} index={index} anzahl={anzahl}>
    {(farben) => (
      <>
        <div style={{ position: "absolute", left: RAND, right: RAND, top: 210 }}>
          {zeilen(f.zitat).map((t, i) => (
            <div key={i} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 60, lineHeight: 1.18, color: farben.leise, textDecoration: "line-through", textDecorationColor: farben.akzent, textDecorationThickness: 5 }}>{t}</div>
          ))}
        </div>
        <div style={{
          position: "absolute", right: RAND - 10, top: 330, transform: "rotate(-11deg)", padding: "18px 34px", border: `7px double ${farben.akzent}`, borderRadius: 14,
          color: farben.akzent, fontSize: 58, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", lineHeight: 1, opacity: .95, backgroundColor: farben.dunkel ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.55)"
        }}>{f.stempel || "Stimmt nicht"}</div>
        <div style={{ position: "absolute", left: RAND, right: RAND, top: f.wahrheitAb || 640 }}>
          <Kicker text={f.ueber || "Die Wahrheit"} farben={farben} stil={{ marginBottom: 20 }} />
          {zeilen(f.wahrheit).map((t, i) => (
            <div key={i} style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.18, letterSpacing: "-0.01em" }}><Fett text={t} akzent={farben.akzent} gewicht={700} /></div>
          ))}
          {f.text && zeilen(f.text).map((t, i) => (
            <div key={i} style={{ marginTop: i === 0 ? 28 : 14, fontSize: 36, lineHeight: 1.38, color: farben.text }}><Fett text={t} akzent={farben.akzent} /></div>
          ))}
        </div>
      </>
    )}
  </Rahmen>
);

/* Abbinder: Marke, Adresse, Aufforderung je Funnel-Stufe. */
const Symbol = ({ art, farbe }) => {
  const d = {
    speichern: "M14 6h20a2 2 0 0 1 2 2v32l-12-8-12 8V8a2 2 0 0 1 2-2z",
    teilen: "M24 30V8m0 0l-9 9m9-9l9 9M10 26v12a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V26",
    folgen: "M24 10v28M10 24h28"
  }[art];
  return <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d={d} fill="none" stroke={farbe} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const Cta = ({ f, k, index, anzahl }) => {
  const st = STUFEN[f.stufe] || STUFEN.mofu;
  return (
    <Rahmen hintergrund={f.hintergrund || "petrol"} index={index} anzahl={anzahl} ohneMarke>
      {(farben) => (
        <>
          <div style={{ position: "absolute", left: -260, top: -260, width: 760, height: 760, borderRadius: "50%", border: `2px dashed ${farben.akzent}`, opacity: .3 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: `0 ${RAND}px` }}>
            <Kreuz groesse={150} farbe={MARKE.gold} kreuz={MARKE.slate} />
            <div style={{ marginTop: 36, fontFamily: SCHRIFT, fontSize: 84, lineHeight: 1, color: farben.text, letterSpacing: "-0.01em" }}>Swiss<span style={{ fontWeight: 700 }}>Premia</span></div>
            <div style={{ marginTop: 54, fontFamily: SERIF, fontWeight: 300, fontSize: 60, lineHeight: 1.16, color: farben.text, maxWidth: 860 }}>
              <Fett text={f.titel || "Alle Kassen in **einer Minute** vergleichen."} akzent={farben.akzent} gewicht={600} />
            </div>
            <div style={{ marginTop: 44, fontSize: 52, fontWeight: 600, color: farben.akzent }}>{MARKE.url}</div>
            <div style={{ marginTop: 16, fontSize: 24, letterSpacing: ".14em", textTransform: "uppercase", color: farben.leise, whiteSpace: "nowrap" }}>Kostenlos · Offizielle BAG-Daten · Keine Anmeldung</div>
            <div style={{ marginTop: 52, padding: "22px 50px", borderRadius: 999, backgroundColor: farben.akzent, color: MARKE.slate, fontSize: 40, fontWeight: 700 }}>{f.aufforderung || st.ctaVideo}</div>
            <div style={{ marginTop: 60, display: "flex", gap: 54 }}>
              {[["speichern", "Speichern"], ["teilen", "Teilen"], ["folgen", "Folgen"]].map(([art, text]) => (
                <div key={art} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 24, letterSpacing: ".1em", textTransform: "uppercase", color: farben.leise }}>
                  <Symbol art={art} farbe={farben.akzent} />{text}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Rahmen>
  );
};

const FOLIEN = { text: Text, zahl: Zahl, balken: Balken, liste: Liste, tabelle: Tabelle, stempel: Stempel, cta: Cta };

/* --------------------------------------------------------------- Folie */

export const Karussell = ({ karussell }) => {
  const index = Math.min(useCurrentFrame(), karussell.folien.length - 1);
  const f = karussell.folien[index];
  const anzahl = karussell.folien.length;
  const Komponente = f.art === "cover" ? COVER[karussell.stil] || CoverFakt : FOLIEN[f.art] || Text;
  return <Komponente f={f} k={karussell} index={index} anzahl={anzahl} />;
};

/* Beispiel fuer das Studio und als Vorgabe der Komposition. */
export const KARUSSELL_BEISPIEL = {
  stil: "fakt", datum: "28. Oktober 2026", titel: "Beispiel",
  folien: [
    { art: "cover", bild: "praxis", titel: ["Die Grundversicherung", "leistet bei **jeder Kasse**", "exakt dasselbe."], unten: "Unterschiedlich ist nur der Preis." },
    { art: "zahl", ueber: "Ein Katalog", zahl: "1", einheit: "Leistungskatalog für alle", text: "Was die Grundversicherung bezahlt, steht im Krankenversicherungsgesetz. Keine Kasse darf mehr oder weniger leisten." },
    { art: "text", bild: "arzt", ueber: "Warum", titel: "Der Katalog steht im Gesetz.", text: "Arzt, Spital, Medikamente, Notfall: Der Umfang ist für alle Versicherer gleich. Eine teurere Kasse zahlt nicht mehr – sie kostet nur mehr." },
    { art: "text", ueber: "Was das heisst", titel: "Wer mehr zahlt, bekommt dafür nichts.", text: "Je nach Region, Alter und Modell liegen zwischen den Kassen mehrere hundert bis über tausend Franken im Jahr.", merke: "Vergleichen ist die einzige Stellschraube – und sie dauert eine Minute." },
    { art: "cta", stufe: "tofu" }
  ]
};
