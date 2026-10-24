import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { MARKE } from "./reels.js";
import { Buehne, Unterzeilen, useEinblenden, useAnteil, useFeder, useSchweben, usePuls, Haken } from "./Bausteine.jsx";
import { chf } from "./Marke.jsx";

/* =========================================================================
   Grafikszenen. Jede zeichnet eine animierte SVG-Grafik und darunter die
   Textzeilen aus s.text. Keine Bilddateien – alles sind Formen, damit
   Farben und Schrift exakt zur Marke passen.
   ========================================================================= */

/* Jede Grafik schwebt leicht und kommt mit einem weichen Einzug. */
const Rahmen = ({ w = 820, h = 560, children }) => {
  const y = useSchweben(9, 3.4);
  const ein = useEinblenden(0, 16);
  return (
    <div style={ein}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", transform: `translateY(${y}px)` }}>{children}</svg>
    </div>
  );
};

/* 1 Kalender: Monatsraster, der 30. bekommt einen goldenen Kreis. */
export const Kalender = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const kreis = useFeder(44) * usePuls(1.4);
  const tage = 30;
  const zelle = 104, luft = 10;
  return (
    <Buehne farben={farben}>
      <div style={{ fontSize: 48, letterSpacing: ".2em", textTransform: "uppercase", color: farben.leise, marginBottom: 26, ...useEinblenden(0) }}>{s.monat || "November"}</div>
      <Rahmen w={7 * zelle + 6 * luft} h={5 * zelle + 4 * luft}>
        {Array.from({ length: tage }, (_, i) => {
          const spalte = i % 7, reihe = Math.floor(i / 7);
          const o = interpolate(frame, [i * 1.2, i * 1.2 + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const letzter = i === tage - 1;
          return (
            <g key={i} transform={`translate(${spalte * (zelle + luft)} ${reihe * (zelle + luft)})`} opacity={o}>
              <rect width={zelle} height={zelle} rx="14" fill={letzter ? "transparent" : "rgba(128,128,128,.14)"} />
              {letzter && <circle cx={zelle / 2} cy={zelle / 2} r={zelle / 2 - 4} fill="none" stroke={farben.akzent} strokeWidth="7" transform={`scale(${kreis})`} style={{ transformOrigin: `${zelle / 2}px ${zelle / 2}px` }} />}
              <text x={zelle / 2} y={zelle / 2 + 16} textAnchor="middle" fontSize="42" fontWeight={letzter ? 700 : 400} fill={letzter ? farben.akzent : farben.text}>{i + 1}</text>
            </g>
          );
        })}
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={56} />
    </Buehne>
  );
};

/* 2 Brief: Umschlag fliegt zur Kasse, Stempel schlaegt auf, Haken. */
export const Brief = ({ s, farben }) => {
  const flug = useAnteil(10, 50);
  const stempel = useFeder(26, { damping: 10, stiffness: 160 });
  const x = interpolate(flug, [0, 1], [40, 350]);
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={420}>
        {/* Gebaeude der Kasse */}
        <rect x="600" y="80" width="200" height="300" rx="10" fill="rgba(128,128,128,.18)" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
          <rect key={r + "-" + c} x={624 + c * 56} y={110 + r * 70} width="36" height="44" rx="4" fill={farben.akzent} opacity=".7" />
        )))}
        <text x="700" y="410" textAnchor="middle" fontSize="30" fill={farben.leise}>Ihre Kasse</text>
        {/* Umschlag */}
        <g transform={`translate(${x} ${200 - Math.sin(flug * Math.PI) * 60})`}>
          <rect x="0" y="0" width="220" height="140" rx="10" fill={MARKE.creme} stroke={farben.akzent} strokeWidth="4" />
          <path d="M0 0 L110 80 L220 0" fill="none" stroke={farben.akzent} strokeWidth="4" />
          <g transform={`rotate(-14 110 70) scale(${stempel})`} style={{ transformOrigin: "110px 70px" }}>
            <rect x="30" y="40" width="160" height="60" rx="8" fill="none" stroke="#b4462a" strokeWidth="5" />
            <text x="110" y="82" textAnchor="middle" fontSize="26" fontWeight="700" fill="#b4462a" letterSpacing="2">EINGESCHRIEBEN</text>
          </g>
        </g>
        <g transform="translate(425 10)" opacity={flug > .98 ? 1 : 0}><Haken groesse={70} farbe={farben.akzent} ab={52} /></g>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={30} />
    </Buehne>
  );
};

/* 3 Selbstbehalt: Balken aus Franchise + 10 % bis zum Deckel. */
export const Selbstbehalt = ({ s, farben }) => {
  const a = useAnteil(8, 40), b = useAnteil(44, 80);
  const fr = 420, sb = 240;
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={300}>
        <rect x="0" y="100" width="820" height="90" rx="14" fill="rgba(128,128,128,.16)" />
        <rect x="0" y="100" width={fr * a} height="90" rx="14" fill={farben.akzent} />
        <rect x={fr} y="100" width={sb * b} height="90" fill={farben.text} opacity=".55" />
        <text x={fr / 2} y="70" textAnchor="middle" fontSize="34" fill={farben.text} opacity={a}>Franchise</text>
        <text x={fr + sb / 2} y="70" textAnchor="middle" fontSize="34" fill={farben.text} opacity={b}>+ 10 % Selbstbehalt</text>
        <text x={fr + sb} y="250" textAnchor="middle" fontSize="38" fontWeight="600" fill={farben.akzent} opacity={b}>max. CHF 700</text>
        <line x1={fr + sb} y1="90" x2={fr + sb} y2="205" stroke={farben.akzent} strokeWidth="4" strokeDasharray="8 8" opacity={b} />
        <text x="760" y="160" textAnchor="middle" fontSize="36" fill={farben.leise} opacity={b}>Kasse</text>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={50} />
    </Buehne>
  );
};

/* 4 Modelle: drei Karten mit Piktogramm, goldenes Etikett springt auf. */
export const Modelle = ({ s, farben }) => {
  const karten = [
    { name: "Hausarzt", bild: (f) => <path d="M30 70 L70 35 L110 70 V110 H30 Z M60 110 V85 H80 V110" fill="none" stroke={f} strokeWidth="6" strokeLinejoin="round" /> },
    { name: "HMO", bild: (f) => <g fill="none" stroke={f} strokeWidth="6"><circle cx="50" cy="60" r="16" /><circle cx="90" cy="60" r="16" /><circle cx="70" cy="95" r="16" /></g> },
    { name: "Telmed", bild: (f) => <g fill="none" stroke={f} strokeWidth="6"><rect x="48" y="30" width="44" height="90" rx="10" /><line x1="62" y1="104" x2="78" y2="104" /></g> }
  ];
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", gap: 34 }}>
        {karten.map((k, i) => {
          const e = useEinblenden(i * 10);
          const badge = useFeder(34 + i * 8, { damping: 9, stiffness: 180 });
          const schweb = useSchweben(8, 3, i * 1.2);
          return (
            <div key={k.name} style={{ width: 250, height: 330, borderRadius: 22, border: `3px solid ${farben.leise}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, position: "relative", ...e, transform: `${e.transform} translateY(${schweb}px)` }}>
              <svg width="140" height="140" viewBox="0 0 140 140">{k.bild(farben.akzent)}</svg>
              <div style={{ fontSize: 40, fontWeight: 500 }}>{k.name}</div>
              <div style={{ position: "absolute", top: -22, right: -16, padding: "8px 18px", borderRadius: 999, backgroundColor: farben.akzent, color: farben.fläche, fontSize: 30, fontWeight: 700, transform: `scale(${badge})` }}>günstiger</div>
            </div>
          );
        })}
      </div>
      <Unterzeilen text={s.text} farben={farben} ab={40} />
    </Buehne>
  );
};

/* 5 Karte: stilisierte Schweiz, Nadel faellt, drei Ringe fuer die Regionen. */
export const Karte = ({ s, farben }) => {
  const umriss = useAnteil(0, 30);
  const nadel = useFeder(26, { damping: 12, stiffness: 140 });
  const frame = useCurrentFrame();
  const pfad = "M12,215 L28,185 L40,160 L62,135 L85,112 L105,95 L125,82 L150,62 L168,58 L185,55 L205,38 L225,42 L245,50 L270,48 L290,58 L300,72 L318,85 L335,100 L352,118 L380,135 L386,155 L372,175 L355,190 L335,205 L318,215 L300,225 L288,250 L270,258 L255,240 L245,222 L225,220 L205,232 L185,238 L165,230 L145,232 L125,240 L105,236 L85,228 L60,230 L40,232 L22,226 Z";
  const px = s.nadel ? s.nadel[0] : 245, py = s.nadel ? s.nadel[1] : 85;
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={540}>
        <g transform="scale(2.05) translate(0 0)">
          <path d={pfad} fill="rgba(128,128,128,.16)" stroke={farben.akzent} strokeWidth="2.5" strokeDasharray="1400" strokeDashoffset={1400 * (1 - umriss)} />
          {[1, 2, 3].map((r) => {
            const o = interpolate(frame, [40 + r * 10, 60 + r * 10], [0, .9 - r * .22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const atem = 1 + Math.sin(frame / 9 + r) * 0.05;
            return <circle key={r} cx={px} cy={py} r={r * 22 * atem} fill="none" stroke={farben.akzent} strokeWidth="2" opacity={o * (0.8 + Math.sin(frame / 7 + r) * 0.2)} />;
          })}
          <g transform={`translate(${px} ${py - 30 * (1 - nadel)})`} opacity={nadel}>
            <path d="M0 0 L-9 -18 A9 9 0 1 1 9 -18 Z" fill={farben.akzent} />
            <circle cx="0" cy="-18" r="3.5" fill={farben.fläche} />
          </g>
          {[1, 2, 3].map((r) => (
            <text key={"t" + r} x={px + r * 22 + 4} y={py + 5} fontSize="11" fontWeight="700" fill={farben.akzent} opacity={interpolate(frame, [50 + r * 10, 66 + r * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>{r}</text>
          ))}
        </g>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={60} />
    </Buehne>
  );
};

/* 6 Familie: Piktogramme erscheinen nacheinander, ab dem dritten ein Etikett. */
export const Familie = ({ s, farben }) => {
  const figuren = s.figuren || [1, 1, .72, .72];
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 420 }}>
        {figuren.map((g, i) => {
          const f = useFeder(i * 9, { damping: 13, stiffness: 120 });
          const badge = useFeder(60 + (i - 2) * 6, { damping: 9, stiffness: 180 });
          return (
            <div key={i} style={{ position: "relative", transform: `scale(${f})`, transformOrigin: "bottom center" }}>
              <svg width={170 * g} height={400 * g} viewBox="0 0 170 400">
                <circle cx="85" cy="70" r="58" fill={farben.text} opacity=".92" />
                <path d="M20 400 V220 A65 65 0 0 1 150 220 V400 Z" fill={farben.text} opacity=".92" />
              </svg>
              {i >= 2 && s.etikett && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: `translateX(-50%) scale(${badge})`, padding: "8px 18px", borderRadius: 999, backgroundColor: farben.akzent, color: farben.fläche, fontSize: 30, fontWeight: 700, whiteSpace: "nowrap" }}>{s.etikett}</div>
              )}
            </div>
          );
        })}
      </div>
      <Unterzeilen text={s.text} farben={farben} ab={46} />
    </Buehne>
  );
};

/* 7 Zeitstrahl: Punkt wandert von links nach rechts, Bogen zurueck zum Start. */
export const Zeitstrahl = ({ s, farben }) => {
  const lauf = useAnteil(10, 56);
  const zurueck = useAnteil(62, 92);
  const x = 60 + 700 * lauf;
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={360}>
        <line x1="60" y1="200" x2="760" y2="200" stroke={farben.leise} strokeWidth="6" strokeLinecap="round" />
        <circle cx="60" cy="200" r="16" fill={farben.akzent} />
        <circle cx="760" cy="200" r="16" fill="none" stroke={farben.akzent} strokeWidth="6" />
        <text x="60" y="260" textAnchor="middle" fontSize="34" fill={farben.text}>{s.links || "Geburt"}</text>
        <text x="760" y="260" textAnchor="middle" fontSize="34" fill={farben.text}>{s.rechts || "3 Monate"}</text>
        <circle cx={x} cy="200" r="22" fill={farben.akzent} stroke={farben.fläche} strokeWidth="6" />
        <path d="M760 170 C 700 40, 120 40, 60 170" fill="none" stroke={farben.akzent} strokeWidth="6" strokeDasharray="1100" strokeDashoffset={1100 * (1 - zurueck)} markerEnd="url(#pf)" />
        <defs><marker id="pf" markerUnits="userSpaceOnUse" markerWidth="26" markerHeight="26" refX="13" refY="13" orient="auto"><path d="M0 0 L26 13 L0 26 Z" fill={farben.akzent} /></marker></defs>
        <text x="410" y="34" textAnchor="middle" fontSize="36" fontWeight="600" fill={farben.akzent} opacity={zurueck}>{s.bogen || "rückwirkend ab Tag 1"}</text>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={40} />
    </Buehne>
  );
};

/* 8 Schalter: Kippschalter von links nach rechts, Preis zaehlt runter. */
export const Schalter = ({ s, farben }) => {
  const kipp = useAnteil(30, 48);
  const wert = interpolate(kipp, [0, 1], [s.von || 0, s.bis || 0]);
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", alignItems: "center", gap: 40, fontSize: 44, fontWeight: 500 }}>
        <span style={{ opacity: 1 - kipp * .6 }}>{s.aus || "mit Unfall"}</span>
        <div style={{ width: 240, height: 120, borderRadius: 60, backgroundColor: kipp > .5 ? farben.akzent : "rgba(128,128,128,.3)", position: "relative", transition: "none" }}>
          <div style={{ position: "absolute", top: 12, left: 12 + kipp * 120, width: 96, height: 96, borderRadius: 48, backgroundColor: farben.fläche }} />
        </div>
        <span style={{ opacity: .4 + kipp * .6, color: kipp > .5 ? farben.akzent : farben.text }}>{s.an || "ohne Unfall"}</span>
      </div>
      {s.von !== undefined && (
        <div style={{ marginTop: 60, fontSize: 150, fontWeight: 600, color: farben.akzent, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: 60, fontWeight: 300, color: farben.text, marginRight: 18 }}>CHF</span>{chf(wert)}
          <span style={{ fontSize: 44, fontWeight: 300, color: farben.leise, marginLeft: 16 }}>/ Mt.</span>
        </div>
      )}
      <Unterzeilen text={s.text} farben={farben} ab={56} />
    </Buehne>
  );
};

/* 9 Tacho: Halbkreis mit Zeiger, schwingt auf einen Wert ein. */
export const Tacho = ({ s, farben }) => {
  const z = useFeder(16, { damping: 11, stiffness: 60 });
  const frame = useCurrentFrame();
  const winkel = -90 + 180 * (s.anteil ?? .7) * z + (z > .9 ? Math.sin(frame / 4) * 1.4 : 0);
  const r = 330;
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={420}>
        <path d={`M ${410 - r} 400 A ${r} ${r} 0 0 1 ${410 + r} 400`} fill="none" stroke="rgba(128,128,128,.22)" strokeWidth="46" strokeLinecap="round" />
        <path d={`M ${410 - r} 400 A ${r} ${r} 0 0 1 ${410 + r} 400`} fill="none" stroke={farben.akzent} strokeWidth="46" strokeLinecap="round" strokeDasharray={Math.PI * r} strokeDashoffset={Math.PI * r * (1 - (s.anteil ?? .7) * z)} />
        <g transform={`rotate(${winkel} 410 400)`}>
          <line x1="410" y1="400" x2="410" y2="120" stroke={farben.text} strokeWidth="12" strokeLinecap="round" />
        </g>
        <circle cx="410" cy="400" r="26" fill={farben.text} />
        <text x="90" y="395" textAnchor="middle" fontSize="30" fill={farben.leise}>{s.links || "kein Anspruch"}</text>
        <text x="730" y="395" textAnchor="middle" fontSize="30" fill={farben.leise}>{s.rechts || "voller Beitrag"}</text>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={40} />
    </Buehne>
  );
};

/* 10 Schloss: zwei Karten; auf der zweiten rastet ein Schloss ein. */
export const Schloss = ({ s, farben }) => {
  const schloss = useFeder(36, { damping: 9, stiffness: 170 });
  const Karte = ({ name, nr, zu }) => (
    <div style={{ width: 340, height: 300, borderRadius: 22, border: `3px solid ${zu ? farben.akzent : farben.leise}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, position: "relative", ...useEinblenden(nr * 10) }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: farben.akzent, color: farben.fläche, fontSize: 38, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{nr}</div>
      <div style={{ fontSize: 40, fontWeight: 500, textAlign: "center", lineHeight: 1.15 }}>{name}</div>
      {zu && (
        <svg width="110" height="110" viewBox="0 0 60 60" style={{ position: "absolute", top: -40, right: -30, transform: `scale(${schloss})` }}>
          <rect x="10" y="26" width="40" height="30" rx="6" fill={farben.akzent} />
          <path d="M18 26 V18 A12 12 0 0 1 42 18 V26" fill="none" stroke={farben.akzent} strokeWidth="6" />
          <circle cx="30" cy="41" r="4" fill={farben.fläche} />
        </svg>
      )}
    </div>
  );
  return (
    <Buehne farben={farben}>
      <div style={{ display: "flex", gap: 40 }}>
        <Karte name={s.erst || "Neue Zusage schriftlich"} nr={1} />
        <Karte name={s.dann || "Alte Zusatzversicherung kündigen"} nr={2} zu />
      </div>
      <Unterzeilen text={s.text} farben={farben} ab={50} />
    </Buehne>
  );
};

/* 11 Muenzen: Muenzen fallen ins Glas, Betrag zaehlt mit. */
export const Muenzen = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = 12;
  const gefallen = Math.min(n, Math.floor(frame / 5));
  const wert = interpolate(gefallen, [0, n], [0, s.bis || 0]);
  return (
    <Buehne farben={farben}>
      <Rahmen w={520} h={520}>
        <path d="M80 120 H440 V480 A30 30 0 0 1 410 510 H110 A30 30 0 0 1 80 480 Z" fill="rgba(128,128,128,.12)" stroke={farben.leise} strokeWidth="6" />
        <rect x="150" y="60" width="220" height="60" rx="12" fill="none" stroke={farben.leise} strokeWidth="6" />
        {Array.from({ length: n }, (_, i) => {
          const t = interpolate(frame, [i * 5, i * 5 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
          const y = interpolate(t, [0, 1], [-60, 470 - Math.floor(i / 3) * 26]);
          const x = 160 + (i % 3) * 100;
          const glanz = 0.85 + Math.sin(frame / 5 + i) * 0.15;
          return <ellipse key={i} cx={x} cy={y} rx="44" ry="13" fill={MARKE.gold} stroke="#b7a06a" strokeWidth="3" opacity={frame >= i * 5 ? glanz : 0} />;
        })}
      </Rahmen>
      <div style={{ marginTop: 20, fontSize: 150, fontWeight: 600, color: farben.akzent, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: 60, fontWeight: 300, color: farben.text, marginRight: 18 }}>CHF</span>{chf(wert)}
      </div>
      <Unterzeilen text={s.text} farben={farben} ab={Math.round(fps * 2.2)} groesse={64} />
    </Buehne>
  );
};

/* 12 Checkliste: Zeilen mit aufgezogenem Haken. */
export const Checkliste = ({ s, farben }) => (
  <Buehne farben={farben} ausrichtung="flex-start">
    {s.punkte.map((p, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 34, ...useEinblenden(6 + i * 16) }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, border: `3px solid ${farben.akzent}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Haken groesse={56} farbe={farben.akzent} ab={14 + i * 16} />
        </div>
        <div style={{ fontSize: 54, lineHeight: 1.18, fontWeight: 300 }}>{p}</div>
      </div>
    ))}
  </Buehne>
);

/* 13 Treppe: drei Stufen, eine Figur steigt hinauf, Stufen tragen Etiketten. */
export const Treppe = ({ s, farben }) => {
  const stufen = s.stufen || ["Kinder", "19–25", "ab 26"];
  const lauf = useAnteil(20, 80);
  const stufe = Math.min(2, Math.floor(lauf * 3));
  const fx = 110 + stufe * 240, fy = 520 - (stufe + 1) * 130;
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={560}>
        {stufen.map((t, i) => (
          <g key={i} opacity={useAnteil(i * 8, i * 8 + 12)}>
            <rect x={30 + i * 240} y={520 - (i + 1) * 130} width="240" height={(i + 1) * 130} fill={i === stufe ? farben.akzent : "rgba(128,128,128,.2)"} />
            <text x={150 + i * 240} y="498" textAnchor="middle" fontSize="36" fontWeight="600" fill={farben.text}>{t}</text>
          </g>
        ))}
        <g transform={`translate(${fx} ${fy})`}>
          <circle cx="40" cy="-146" r="32" fill={farben.text} />
          <path d="M2 0 V-70 A38 38 0 0 1 78 -70 V0 Z" fill={farben.text} />
        </g>
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={50} />
    </Buehne>
  );
};

/* 14 Raster: vier Leistungen als Piktogramm mit Haken. */
export const Raster = ({ s, farben }) => {
  const felder = [
    { name: "Arzt", bild: (f) => <g fill="none" stroke={f} strokeWidth="6" strokeLinecap="round"><path d="M40 30 V60 A30 30 0 0 0 100 60 V30" /><path d="M70 90 V105 A25 25 0 0 0 120 105 V85" /><circle cx="120" cy="80" r="10" /></g> },
    { name: "Spital", bild: (f) => <g fill="none" stroke={f} strokeWidth="6"><rect x="30" y="30" width="80" height="90" rx="6" /><line x1="70" y1="55" x2="70" y2="95" /><line x1="50" y1="75" x2="90" y2="75" /></g> },
    { name: "Medikamente", bild: (f) => <g fill="none" stroke={f} strokeWidth="6"><rect x="30" y="55" width="80" height="40" rx="20" transform="rotate(-30 70 75)" /><line x1="70" y1="54" x2="70" y2="96" transform="rotate(-30 70 75)" /></g> },
    { name: "Notfall", bild: (f) => <g fill="none" stroke={f} strokeWidth="6" strokeLinejoin="round"><path d="M70 30 L95 70 L75 70 L80 110 L45 65 L65 65 Z" /></g> }
  ];
  return (
    <Buehne farben={farben}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {felder.map((f, i) => (
          <div key={f.name} style={{ width: 420, height: 240, borderRadius: 22, border: `3px solid ${farben.leise}`, display: "flex", alignItems: "center", gap: 18, padding: "0 22px", ...useEinblenden(i * 9) }}>
            <svg width="96" height="96" viewBox="0 0 140 140" style={{ flex: "none" }}>{f.bild(farben.akzent)}</svg>
            <div style={{ flex: 1, fontSize: f.name.length > 8 ? 29 : 38, fontWeight: 500 }}>{f.name}</div>
            <div style={{ flex: "none" }}><Haken groesse={54} farbe={farben.akzent} ab={30 + i * 8} /></div>
          </div>
        ))}
      </div>
      <Unterzeilen text={s.text} farben={farben} ab={56} />
    </Buehne>
  );
};

/* 15 Jahresring: zwoelf Monate im Kreis, zwei Fenster leuchten gold auf. */
export const Jahresring = ({ s, farben }) => {
  const frame = useCurrentFrame();
  const r = 260, cx = 410, cy = 290;
  const monate = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const bogen = (von, bis, t) => {
    const a0 = (von / 12) * 2 * Math.PI - Math.PI / 2, a1 = a0 + ((bis - von) / 12) * 2 * Math.PI * t;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${bis - von > 6 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const t1 = useAnteil(20, 50), t2 = useAnteil(56, 86);
  return (
    <Buehne farben={farben}>
      <Rahmen w={820} h={580}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(128,128,128,.25)" strokeWidth="26" />
        {(s.fenster || [[2, 6], [10, 12]]).map((f, i) => (
          <path key={i} d={bogen(f[0], f[1], i === 0 ? t1 : t2)} fill="none" stroke={farben.akzent} strokeWidth="26" strokeLinecap="round" />
        ))}
        {monate.map((m, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2 + Math.PI / 12;
          return <text key={i} x={cx + (r - 2) * Math.cos(a)} y={cy + (r - 2) * Math.sin(a) + 11} textAnchor="middle" fontSize="30" fontWeight="600" fill={farben.text} opacity=".8">{m}</text>;
        })}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="40" fill={farben.text} opacity={t1}>{s.erst || "bis 31. März"}</text>
        <text x={cx} y={cy + 44} textAnchor="middle" fontSize="40" fill={farben.akzent} fontWeight="600" opacity={t2}>{s.zweit || "bis 30. November"}</text>
        <circle cx={cx} cy={cy} r="0" opacity={frame} />
      </Rahmen>
      <Unterzeilen text={s.text} farben={farben} ab={60} />
    </Buehne>
  );
};

export const GRAFIK = {
  kalender: Kalender, brief: Brief, selbstbehalt: Selbstbehalt, modelle: Modelle, karte: Karte,
  familie: Familie, zeitstrahl: Zeitstrahl, schalter: Schalter, tacho: Tacho, schloss: Schloss,
  muenzen: Muenzen, checkliste: Checkliste, treppe: Treppe, raster: Raster, jahresring: Jahresring
};
