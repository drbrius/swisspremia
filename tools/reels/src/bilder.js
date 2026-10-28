/* =========================================================================
   Fotos fuer die Reels – Unsplash (Unsplash-Lizenz: kostenlos, auch
   kommerziell, ohne Namensnennung; keine Unsplash+-Bilder).

   Ausgewaehlt am 25.10.2026. Die Dateien werden nicht im Repository
   abgelegt, sondern von funnel/bilder.js nach public/bilder/<name>.jpg
   geladen (npm run bilder; tag.js und render.js tun es selbst).

   Verwendung in einer Szene:  { art: "titel", bild: "alpen", ... }
   Die Szene bekommt dann das Foto mit Ken-Burns-Bewegung und dunkler
   Ueberlagerung als Hintergrund, die Schrift wird hell.
   ========================================================================= */
export const BILDER = {
  alpen: "photo-1618648324286-5c087d9419b8",        // verschneiter Gipfel
  flagge: "photo-1565993740284-6fb68e4f2a67",       // Schweizerfahne ueber dem Tal
  gipfel: "photo-1627551885247-f9301e1d6101",       // zwei Wanderer auf dem Gipfel
  zuerich: "photo-1659389952410-59fc1f039d27",      // Kirchturm mit Fahne, Zuerichsee
  bern: "photo-1723006273476-ead2eda4cbc9",         // Altstadt Bern
  genf: "photo-1742649266524-f9be3b7c9b97",         // Genfersee, Quai
  lugano: "photo-1599179875607-a0a4758bfb9c",       // San Salvatore, Lupinen
  lausanne: "photo-1660934995857-1404302a7fb0",     // Lavaux, Rebberge
  dorf: "photo-1688675596071-75a259b1f674",         // Bergdorf mit Chalets
  bahn: "photo-1615235976643-71351b5716ad",         // Landwasserviadukt
  arzt: "photo-1622253692010-333f2da6031d",         // Arzt, laechelnd
  stethoskop: "photo-1638202993928-7267aad84c31",   // Aerztin mit Stethoskop
  praxis: "photo-1524758870432-af57e54afa26",       // helles Wartezimmer
  spital: "photo-1628372095387-017d1099fc19",       // Spitalgang
  medikamente: "photo-1512069772995-ec65ed45afd6",  // Tabletten
  brief: "photo-1572006458450-9cbc976bdd35",        // Brief im Briefschlitz
  kalender: "photo-1560420025-9453f02b4751",        // Kalenderblatt (Juni!)
  umzug: "photo-1566576721346-d4a3b4eaeb55",        // Umzugskarton
  baby: "photo-1582212742235-a2500f31cb39",         // schlafendes Baby
  eltern: "photo-1543342384-1f1350e27861",          // Eltern mit Neugeborenem
  jung: "photo-1644945581764-66b9e8ed4893",         // zwei junge Frauen lachen
  kinder: "photo-1607453998774-d533f65dac99",       // drei Kinder
  laptop: "photo-1587614382231-d1590f0039e7",       // Frau mit Laptop
  muenzen: "photo-1583902340377-052b7159b97b",      // Glas mit Muenzen
  muenzstapel: "photo-1583902340370-6a3fc847d373",  // Muenzstapel
  rechner: "photo-1642043175009-5997b3a078d8"       // Taschenrechner auf Rechnungen
};

export const bildDatei = (name) => `bilder/${name}.jpg`;
/* 4:5-Zuschnitt fuer die Karussell-Folien (src/Karussell.jsx). */
export const bildDateiKarussell = (name) => `bilder/${name}-k.jpg`;

/* Foto je Kanton fuer regionale Reels; sonst Schweiz allgemein. */
export const KANTON_BILD = { ZH: "zuerich", BE: "bern", GE: "genf", TI: "lugano", VD: "lausanne", GR: "bahn" };
export const kantonBild = (kanton, ersatz = "alpen") => KANTON_BILD[kanton] || ersatz;
