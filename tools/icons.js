/* =========================================================================
   Icon-Erzeugung ohne Fremdpakete

   Erzeugt aus einer Farbangabe und einem Zeichen die komplette Favicon-
   Familie: SVG, PNG in vier Groessen, apple-touch-icon und ICO.

   Warum selbst gebaut: Fuer 20 Marken von Hand Icons zu exportieren waere
   Fleissarbeit mit Fehlerquellen. Node bringt zlib mit, mehr braucht ein
   PNG nicht.

   Das ICO enthaelt bewusst BMP-Daten und keine PNGs. Ein PNG im ICO ist
   zwar gueltig, aber einzelne Crawler kommen damit nicht zurecht – genau
   deshalb hat swisspremia.ch zusaetzlich ein reines PNG verlinkt.
   ========================================================================= */
"use strict";

var zlib = require("zlib");

/* ---------------------------------------------------------------- Farben */

function hexZuRgb(hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

/* ------------------------------------------------------------- Geometrie */

/* Abstand eines Punktes zu einer Strecke – daraus wird jeder Strich
   gezeichnet. Einfacher und robuster als ein Polygon je Zeichen. */
function abstandZuStrecke(px, py, ax, ay, bx, by) {
  var dx = bx - ax;
  var dy = by - ay;
  var laenge = dx * dx + dy * dy;
  var t = laenge === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / laenge;
  t = Math.max(0, Math.min(1, t));
  var qx = ax + t * dx;
  var qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}

/* Zeichen sind Strecken im Einheitsquadrat 0..1 mit einer Strichstaerke. */
var ZEICHEN = {
  haken: {
    staerke: 0.13,
    striche: [[0.24, 0.52, 0.42, 0.70], [0.42, 0.70, 0.78, 0.32]]
  },
  kreuz: {
    staerke: 0.16,
    striche: [[0.5, 0.2, 0.5, 0.8], [0.2, 0.5, 0.8, 0.5]]
  },
  pfeil: {
    staerke: 0.13,
    striche: [[0.24, 0.5, 0.76, 0.5], [0.55, 0.29, 0.78, 0.5], [0.55, 0.71, 0.78, 0.5]]
  }
};

function imAbgerundetenQuadrat(x, y, radius) {
  var cx = Math.min(Math.max(x, radius), 1 - radius);
  var cy = Math.min(Math.max(y, radius), 1 - radius);
  if (x >= radius && x <= 1 - radius) return y >= 0 && y <= 1;
  if (y >= radius && y <= 1 - radius) return x >= 0 && x <= 1;
  return Math.hypot(x - cx, y - cy) <= radius;
}

/* Zeichnet ein Icon als RGBA-Puffer. Vierfaches Ueberabtasten glaettet
   die Kanten – bei 16 px ist das der Unterschied zwischen lesbar und Brei. */
function zeichne(groesse, grundHex, zeichenHex, zeichenName) {
  var grund = hexZuRgb(grundHex);
  var vorn = hexZuRgb(zeichenHex);
  var zeichen = ZEICHEN[zeichenName] || ZEICHEN.haken;
  var radius = 0.18;
  var puffer = Buffer.alloc(groesse * groesse * 4);
  var proben = 4;

  for (var y = 0; y < groesse; y++) {
    for (var x = 0; x < groesse; x++) {
      var deckung = 0;
      var zeichenAnteil = 0;

      for (var sy = 0; sy < proben; sy++) {
        for (var sx = 0; sx < proben; sx++) {
          var fx = (x + (sx + 0.5) / proben) / groesse;
          var fy = (y + (sy + 0.5) / proben) / groesse;

          if (!imAbgerundetenQuadrat(fx, fy, radius)) continue;
          deckung++;

          var minAbstand = Infinity;
          zeichen.striche.forEach(function (s) {
            var d = abstandZuStrecke(fx, fy, s[0], s[1], s[2], s[3]);
            if (d < minAbstand) minAbstand = d;
          });
          if (minAbstand <= zeichen.staerke / 2) zeichenAnteil++;
        }
      }

      var gesamt = proben * proben;
      var alpha = deckung / gesamt;
      var anteil = deckung === 0 ? 0 : zeichenAnteil / deckung;
      var i = (y * groesse + x) * 4;

      puffer[i] = Math.round(grund[0] + (vorn[0] - grund[0]) * anteil);
      puffer[i + 1] = Math.round(grund[1] + (vorn[1] - grund[1]) * anteil);
      puffer[i + 2] = Math.round(grund[2] + (vorn[2] - grund[2]) * anteil);
      puffer[i + 3] = Math.round(alpha * 255);
    }
  }

  return puffer;
}

/* ------------------------------------------------------------------ PNG */

var CRC_TABELLE = (function () {
  var t = new Int32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(puffer) {
  var c = 0xffffffff;
  for (var i = 0; i < puffer.length; i++) {
    c = CRC_TABELLE[(c ^ puffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ, daten) {
  var laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length, 0);
  var inhalt = Buffer.concat([Buffer.from(typ, "ascii"), daten]);
  var pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(inhalt), 0);
  return Buffer.concat([laenge, inhalt, pruef]);
}

function png(groesse, rgba) {
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(groesse, 0);
  ihdr.writeUInt32BE(groesse, 4);
  ihdr[8] = 8;    // Bittiefe
  ihdr[9] = 6;    // Farbtyp RGBA
  ihdr[10] = 0;   // Kompression
  ihdr[11] = 0;   // Filter
  ihdr[12] = 0;   // kein Interlace

  // Jede Bildzeile bekommt ein fuehrendes Filterbyte 0 (keine Vorhersage).
  var roh = Buffer.alloc(groesse * (groesse * 4 + 1));
  for (var y = 0; y < groesse; y++) {
    roh[y * (groesse * 4 + 1)] = 0;
    rgba.copy(roh, y * (groesse * 4 + 1) + 1, y * groesse * 4, (y + 1) * groesse * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(roh, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

/* ------------------------------------------------------------------ ICO */

/* Ein Bild als BMP im ICO: Kopf, Pixel von unten nach oben in BGRA,
   danach die AND-Maske. Die Maske bleibt leer, weil die Transparenz
   bereits im Alphakanal steckt. */
function bmp(groesse, rgba) {
  var kopf = Buffer.alloc(40);
  kopf.writeUInt32LE(40, 0);
  kopf.writeInt32LE(groesse, 4);
  kopf.writeInt32LE(groesse * 2, 8);   // Hoehe doppelt: Bild plus Maske
  kopf.writeUInt16LE(1, 12);
  kopf.writeUInt16LE(32, 14);
  kopf.writeUInt32LE(0, 16);
  kopf.writeUInt32LE(groesse * groesse * 4, 20);

  var pixel = Buffer.alloc(groesse * groesse * 4);
  for (var y = 0; y < groesse; y++) {
    for (var x = 0; x < groesse; x++) {
      var q = ((groesse - 1 - y) * groesse + x) * 4;
      var z = (y * groesse + x) * 4;
      pixel[z] = rgba[q + 2];
      pixel[z + 1] = rgba[q + 1];
      pixel[z + 2] = rgba[q];
      pixel[z + 3] = rgba[q + 3];
    }
  }

  var maskenZeile = Math.ceil(groesse / 32) * 4;
  return Buffer.concat([kopf, pixel, Buffer.alloc(maskenZeile * groesse)]);
}

function ico(bilder) {
  var kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0);
  kopf.writeUInt16LE(1, 2);
  kopf.writeUInt16LE(bilder.length, 4);

  var eintraege = [];
  var daten = [];
  var versatz = 6 + bilder.length * 16;

  bilder.forEach(function (b) {
    var block = bmp(b.groesse, b.rgba);
    var e = Buffer.alloc(16);
    e[0] = b.groesse >= 256 ? 0 : b.groesse;
    e[1] = b.groesse >= 256 ? 0 : b.groesse;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(block.length, 8);
    e.writeUInt32LE(versatz, 12);
    versatz += block.length;
    eintraege.push(e);
    daten.push(block);
  });

  return Buffer.concat([kopf].concat(eintraege).concat(daten));
}

/* ------------------------------------------------------------------ SVG */

function svg(grundHex, zeichenHex, zeichenName) {
  var zeichen = ZEICHEN[zeichenName] || ZEICHEN.haken;
  var striche = zeichen.striche.map(function (s) {
    return '<line x1="' + (s[0] * 100).toFixed(1) + '" y1="' + (s[1] * 100).toFixed(1) +
           '" x2="' + (s[2] * 100).toFixed(1) + '" y2="' + (s[3] * 100).toFixed(1) + '"/>';
  }).join("\n  ");

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n' +
         '  <rect width="100" height="100" rx="18" fill="' + grundHex + '"/>\n' +
         '  <g stroke="' + zeichenHex + '" stroke-width="' + (zeichen.staerke * 100).toFixed(0) +
         '" stroke-linecap="round" stroke-linejoin="round" fill="none">\n  ' +
         striche + '\n  </g>\n</svg>\n';
}

/* --------------------------------------------------------------- Ausgabe */

function alleIcons(marke) {
  var grund = marke.iconGrund;
  var vorn = marke.iconZeichen;
  var zeichen = marke.iconMarke;

  function bild(g) { return zeichne(g, grund, vorn, zeichen); }

  return {
    "favicon.svg": Buffer.from(svg(grund, vorn, zeichen), "utf8"),
    "favicon-48.png": png(48, bild(48)),
    "favicon-96.png": png(96, bild(96)),
    "favicon-192.png": png(192, bild(192)),
    "favicon-512.png": png(512, bild(512)),
    "apple-touch-icon.png": png(180, bild(180)),
    "favicon.ico": ico([
      { groesse: 16, rgba: bild(16) },
      { groesse: 32, rgba: bild(32) },
      { groesse: 48, rgba: bild(48) }
    ])
  };
}

module.exports = { alleIcons: alleIcons, zeichne: zeichne, png: png, ico: ico, svg: svg };
