/* Erfundener Stand fuer den lokalen Test (dev.js --beispiel): drei Wochen
   Funnel-Betrieb mit 10-15 Reels am Tag, ein Tagesplan bis zum Abend,
   ein Fehler, ein verpasstes Reel gestern. Zahlen sind ausgedacht. */

function zufall(saat) {
  let s = saat >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const FORMATE = ["franchise", "modelle", "alter", "unfall", "flexibel", "regionen", "kantone", "mythos", "stamm"];
const STAERKE = { franchise: 1.5, modelle: 1.2, alter: .8, unfall: 1.1, flexibel: 1.7, regionen: .7, kantone: 1.3, mythos: .9, stamm: .6, countdown: 1 };
const ORTE = ["Zürich", "Bern", "Genf", "Luzern", "Basel", "St. Gallen", "Aargau", "Tessin", "Waadt", "Wallis", "Zug", "Thurgau"];
const TITEL = {
  franchise: (o) => `${o}: Franchise 2'500 statt 300`, modelle: (o) => `${o}: Standard vs. HMO`, alter: (o) => `${o}: Sprung mit 26`,
  unfall: (o) => `${o}: Unfalldeckung weglassen`, flexibel: (o) => `${o}: Sparpotenzial für Gesunde`, regionen: (o) => `${o}: Region gegen Region`,
  kantone: (o) => `Kantone: ${o} im Vergleich`, mythos: () => "Mythos: Wechseln ist kompliziert", stamm: () => "Kündigungsfrist erklärt", countdown: (o, t) => `Countdown: ${t} Tage`
};

const tag = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(d);
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function beispielStand(jetzt = new Date()) {
  const rnd = zufall(42);
  const medien = [], plan = [];
  const heute = tag(jetzt);
  const minJetzt = jetzt.getHours() * 60 + jetzt.getMinutes();

  for (let d = 20; d >= -1; d--) {
    const datumObj = new Date(jetzt.getTime() - d * 86_400_000);
    const datum = tag(datumObj);
    const anzahl = 10 + Math.floor(rnd() * 6);
    for (let i = 0; i < anzahl; i++) {
      const min = 420 + Math.round((i * (1290 - 420)) / (anzahl - 1));
      const format = i === 0 ? "countdown" : FORMATE[Math.floor(rnd() * FORMATE.length)];
      const ort = ORTE[Math.floor(rnd() * ORTE.length)];
      const titel = TITEL[format](ort, 36 + d);
      const zeit = hhmm(min);
      const zeitpunkt = new Date(`${datum}T${zeit}:00`);
      let status = "veroeffentlicht", fehler = null;
      if (d < 0 || (d === 0 && min > minJetzt)) status = d < 0 ? "geplant" : "hochgeladen";
      if (d === 0 && i === 3) { status = "fehler"; fehler = "Container 18437…: ERROR – Video konnte nicht verarbeitet werden"; }
      if (d === 1 && i === anzahl - 1) status = "hochgeladen";
      if (d === 0 && min > minJetzt && i === anzahl - 1) status = "gerendert";
      const id = `1800000${String(d + 1).padStart(2, "0")}${String(i).padStart(3, "0")}`;
      const p = {
        datum, nr: i + 1, zeit, titel, format, gruppe: format === "countdown" ? "saison" : ["mythos", "stamm"].includes(format) ? "wissen" : "daten",
        sprache: "de", status, fehler, versuche: fehler ? 1 : 0, mediaId: status === "veroeffentlicht" ? id : null, permalink: null,
        veroeffentlicht: status === "veroeffentlicht" ? zeitpunkt.toISOString() : null, cover: null, video: null, dauer: 18 + Math.round(rnd() * 80) / 10,
        text: `${titel}\n\nBeispieltext für den lokalen Test.\n\n#krankenkasse #schweiz`
      };
      if (d <= 13) plan.push(p);
      if (status === "veroeffentlicht") {
        const alterTage = Math.max(0.05, (jetzt - zeitpunkt) / 86_400_000);
        const views = Math.round(STAERKE[format] * (40 + rnd() * 160) * Math.min(1, alterTage / 2));
        const reach = Math.round(views * (0.7 + rnd() * 0.2));
        const likes = Math.round(views * (0.01 + rnd() * 0.04)), comments = Math.round(rnd() * 3), shares = Math.round(rnd() * 3), saved = Math.round(rnd() * 4);
        medien.push({
          id, typ: "REELS", art: "VIDEO", zeit: zeitpunkt.toISOString(), permalink: null, bild: null, text: p.text, likes, kommentare: comments,
          zahlen: { views, reach, likes, comments, shares, saved, total_interactions: likes + comments + shares + saved, ig_reels_avg_watch_time: Math.round(2000 + rnd() * 3000), ig_reels_video_view_total_time: views * 3000 },
          funnel: { datum, nr: p.nr, zeit, titel, format, gruppe: p.gruppe, video: null, dauer: p.dauer }
        });
      }
    }
  }
  medien.push({
    id: "17900000000000001", typ: "FEED", art: "CAROUSEL_ALBUM", zeit: new Date(jetzt.getTime() - 9 * 86_400_000).toISOString(), permalink: null, bild: null,
    text: "Von Hand gepostet: fünf Fragen zur Grundversicherung", likes: 6, kommentare: 7,
    zahlen: { views: 67, reach: 21, likes: 6, comments: 7, shares: 2, saved: 0, total_interactions: 18 }, funnel: null
  });
  medien.sort((a, b) => b.zeit.localeCompare(a.zeit));

  const reichweiteTage = [];
  for (let d = 28; d >= 1; d--) {
    const datum = tag(new Date(jetzt.getTime() - d * 86_400_000));
    reichweiteTage.push({ datum, wert: d > 21 ? Math.round(rnd() * 15) : Math.round(400 + rnd() * 900 + (21 - d) * 40) });
  }
  const followerTage = [];
  for (let d = 14; d >= 0; d--) followerTage.push({ datum: tag(new Date(jetzt.getTime() - d * 86_400_000)), wert: 71 + (14 - d) * 6 + Math.round(rnd() * 4) });

  return {
    version: 1, stand: new Date(jetzt.getTime() - 12 * 60_000).toISOString(), zeitzone: "Europe/Zurich",
    einstellungen: { reelsProTag: "10-20", postVon: "07:00", postBis: "21:30", mindestabstandMinuten: 30 },
    konto: { username: "swisspremia", name: "Swisspremia", follower: followerTage[followerTage.length - 1].wert, folgt: null, beitraege: medien.length },
    kontingent: { genutzt: 13, gesamt: 100, sekunden: 86400 },
    token: { aufgefrischt: new Date(jetzt.getTime() - 3 * 86_400_000).toISOString(), tage: 60 },
    kontoZahlen: {
      heute: { reach: 812, views: 1460, accounts_engaged: 41, total_interactions: 96, profile_views: 38, website_clicks: 7, profile_links_taps: 0 },
      7: { reach: 9120, views: 15800, accounts_engaged: 310, total_interactions: 702, profile_views: 260, website_clicks: 41, profile_links_taps: 0 },
      28: { reach: 21400, views: 39800, accounts_engaged: 790, total_interactions: 1810, profile_views: 640, website_clicks: 97, profile_links_taps: 0 }
    },
    reichweiteTage, followerTage, medien, plan,
    protokoll: [
      `${heute} 05:30:02  Plan ${heute} erstellt: 14 Reels (gewuenscht 14), Fenster 07:00–21:30.`,
      `${heute} 05:41:17  Tag ${heute} nach 11.2 Min.: 14 hochgeladen`,
      `${heute} 07:00:41  Veroeffentlicht #1 Countdown (07:00) -> 18000001000`,
      `${heute} 08:15:12  FEHLER #4 Beispiel (08:15), Versuch 1: Container 18437…: ERROR`
    ],
    hinweise: []
  };
}
