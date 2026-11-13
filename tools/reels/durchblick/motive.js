/* =========================================================================
   Serie «Durchblick» – Bildregie je Reel.

   Skript, Stimme und Zeiten kommen aus der Serie «Echt» (real/skripte.js,
   public/real/ton, real/zeiten); hier steht nur, WAS jede der vier Szenen
   zeigt. Die Bausteine (src/Durchblick.jsx):

     bogenfoto   Foto (schwarzweiss) im Bogen, Sonne dahinter      { foto, seite }
     durchgang   ineinanderliegende Boegen, Foto im innersten       { foto }
     zahl        Zahl der Szene (aus dem Skript) im Bogen, rollt    –
     kennzahl    grosse Angabe in der Sonne                         { wert, einheit }
     saeulen     zwei oder drei Boegen nebeneinander                { saeulen: [{ h, farbe, gross, klein }] }
     landschaft  Flaechenlandschaft mit Sonne und Lichtkeil         –
     tisch       Draufsicht: Brief, Umschlag, Stift, Tasse          –

   Fotos: Pixabay (Pixabay-Inhaltslizenz), geladen von durchblick/fotos.js
   nach public/durchblick/. Erkennbare Personen nur in neutralem oder
   freundlichem Zusammenhang, nie bei Verzug, Fehler oder Ablehnung.
   ========================================================================= */
export const FOTOS = {
  baby: 3303937, buero: 2583442, sparen: 6688955, koffer: 823296, senioren: 4997796, unterschrift: 4491416,
  rechnung: 256305, laptop: 2937206, kirche: 4675789, gasse: 7276467, berg: 1756308, umschlag: 7348722,
  familie: 7111505, aerztin: 7261805, hausarzt: 5710159
};

const S = (h, farbe, gross, klein) => ({ h, farbe, gross, klein });

export const MOTIVE = {
  baby: [
    { art: "bogenfoto", foto: "baby" },
    { art: "kennzahl", wert: "3", einheit: "Monate" },
    { art: "saeulen", saeulen: [S(0.9, "petrol", "Eltern", "Kasse A"), S(0.5, "orange", "Kind", "Kasse B")] },
    { art: "durchgang", foto: "familie" }
  ],
  unfall: [
    { art: "bogenfoto", foto: "buero", seite: "rechts" },
    { art: "kennzahl", wert: "8", einheit: "Stunden pro Woche" },
    { art: "tisch" },
    { art: "zahl" }
  ],
  franchise: [
    { art: "landschaft" },
    { art: "zahl" },
    { art: "saeulen", saeulen: [S(0.2, "petrol", "300", "Franchise"), S(1, "orange", "2'500", "Franchise")] },
    { art: "bogenfoto", foto: "sparen" }
  ],
  hausarzt: [
    { art: "bogenfoto", foto: "hausarzt" },
    { art: "durchgang", foto: "aerztin" },
    { art: "zahl" },
    { art: "landschaft" }
  ],
  neu: [
    { art: "bogenfoto", foto: "koffer", seite: "rechts" },
    { art: "kennzahl", wert: "3", einheit: "Monate" },
    { art: "tisch" },
    { art: "durchgang", foto: "kirche" }
  ],
  verbilligung: [
    { art: "bogenfoto", foto: "sparen", seite: "rechts" },
    { art: "landschaft" },
    { art: "tisch" },
    { art: "durchgang", foto: "familie" }
  ],
  treue: [
    { art: "kennzahl", wert: "20", einheit: "Jahre" },
    { art: "bogenfoto", foto: "senioren" },
    { art: "saeulen", saeulen: [S(0.45, "petrol", "damals", "günstig"), S(0.95, "orange", "heute", "oft nicht mehr")] },
    { art: "durchgang", foto: "berg" }
  ],
  zusatz: [
    { art: "tisch" },
    { art: "saeulen", saeulen: [S(0.9, "petrol", "Grund", "muss Sie nehmen"), S(0.9, "orange", "Zusatz", "darf ablehnen")] },
    { art: "bogenfoto", foto: "unterschrift", seite: "rechts" },
    { art: "durchgang", foto: "gasse" }
  ],
  schritte: [
    { art: "landschaft" },
    { art: "saeulen", saeulen: [S(0.35, "petrol", "1", "vergleichen"), S(0.65, "petrolhell", "2", "anmelden"), S(0.95, "orange", "3", "kündigen")] },
    { art: "kennzahl", wert: "30.", einheit: "November" },
    { art: "bogenfoto", foto: "laptop" }
  ],
  offen: [
    { art: "tisch" },
    { art: "bogenfoto", foto: "rechnung", seite: "rechts" },
    { art: "saeulen", saeulen: [S(0.6, "petrol", "haken", "Prämien"), S(0.6, "petrolhell", "haken", "Franchise"), S(0.6, "orange", "haken", "Selbstbehalt")] },
    { art: "durchgang", foto: "berg" }
  ]
};

/* Foto im Abbinder (im Bogen, die Sonne geht dahinter auf). */
export const ABBINDER_FOTO = "berg";
