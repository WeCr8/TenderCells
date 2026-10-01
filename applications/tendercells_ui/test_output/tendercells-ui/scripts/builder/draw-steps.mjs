#!/usr/bin/env node
// draw-steps.mjs - LEGO-style instruction drawings for Builder hardware steps and the
// WHEN / IF / DO rule cards, written as SVG to public/builder-assets/steps/<item>/<step>.svg.
// Each breadboard picture is the whole build so far; the part added in this step glows gold
// and is called out. Pin names follow the Seeed XIAO ESP32-S3 (same mapping as
// firmware/starter-node: D0 = GPIO1 ... D10 = GPIO9), drawn with the USB-C end to the left.
//   node scripts/builder/draw-steps.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../../public/builder-assets/steps");
const W = 960, H = 660;
const C = { paper: "#F6F2E9", ink: "#1E2A22", soft: "#6B6650", board: "#FBFAF6", hole: "#B9B2A1", red: "#D23B2E", blue: "#2F5FB3", gold: "#F2B92C", green: "#147C38", pcb: "#1F5FA8", yellow: "#E9B400", black: "#222", orange: "#E8762C" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── breadboard geometry ───────────────────────────────────────────────────────
const P = 27, X0 = 208, COLS = 25;
const ROWS = { tp: 206, tm: 233, a: 278, b: 305, c: 332, d: 359, e: 386, f: 438, g: 465, h: 492, i: 519, j: 546, bm: 586, bp: 613 };
const hx = (col) => X0 + (col - 1) * P;
const hole = (col, row) => [hx(col), ROWS[row]];

function breadboard() {
  let s = `<rect x="${X0 - 40}" y="${ROWS.tp - 26}" width="${(COLS - 1) * P + 80}" height="${ROWS.bp - ROWS.tp + 52}" rx="14" fill="${C.board}" stroke="#CFC8B6" stroke-width="2"/>`;
  s += `<rect x="${X0 - 20}" y="${(ROWS.e + ROWS.f) / 2 - 6}" width="${(COLS - 1) * P + 40}" height="12" rx="3" fill="#E7E1D3"/>`;
  for (const [r, col] of [["tp", C.red], ["tm", C.blue], ["bm", C.blue], ["bp", C.red]]) {
    s += `<line x1="${X0 - 18}" y1="${ROWS[r] + (r.endsWith("p") ? (r === "tp" ? -13 : 13) : (r === "tm" ? 13 : -13))}" x2="${hx(COLS) + 18}" y2="${ROWS[r] + (r.endsWith("p") ? (r === "tp" ? -13 : 13) : (r === "tm" ? 13 : -13))}" stroke="${col}" stroke-width="2"/>`;
    s += `<text x="${X0 - 28}" y="${ROWS[r] + 5}" font-size="15" font-weight="800" fill="${col}" text-anchor="middle">${r.endsWith("p") ? "+" : "−"}</text>`;
  }
  for (let c = 1; c <= COLS; c++) {
    for (const r of Object.keys(ROWS)) s += `<rect x="${hx(c) - 5}" y="${ROWS[r] - 5}" width="10" height="10" rx="2" fill="${C.hole}"/>`;
    if (c === 1 || c % 5 === 0) s += `<text x="${hx(c)}" y="${ROWS.a - 18}" font-size="13" fill="${C.soft}" text-anchor="middle">${c}</text><text x="${hx(c)}" y="${ROWS.j + 26}" font-size="13" fill="${C.soft}" text-anchor="middle">${c}</text>`;
  }
  for (const r of "abcdefghij") s += `<text x="${X0 - 24}" y="${ROWS[r] + 5}" font-size="13" fill="${C.soft}" text-anchor="middle">${r}</text>`;
  return s;
}

const glow = (on) => (on ? `filter="url(#glow)"` : "");

// XIAO across columns 1-7, USB-C to the left; top pins in row d, bottom pins in row g.
const TOP_PINS = ["5V", "GND", "3V3", "D10", "D9", "D8", "D7"];
const BOTTOM_PINS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6"];
function xiao(isNew, { labels = true } = {}) {
  const x = hx(1) - 18, y = ROWS.d - 16, w = hx(7) - hx(1) + 36, h = ROWS.g - ROWS.d + 32;
  let s = `<g ${glow(isNew)}><rect x="${x - 26}" y="${(ROWS.d + ROWS.g) / 2 - 16}" width="34" height="32" rx="6" fill="#B8BCC2" stroke="#555" stroke-width="2"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.pcb}" stroke="#123" stroke-width="2"/>`;
  s += `<rect x="${x + 40}" y="${y + 40}" width="${w - 64}" height="${h - 80}" rx="4" fill="#C9CDD2" stroke="#7A8088"/><text x="${x + w / 2 + 8}" y="${y + h / 2 + 5}" font-size="15" font-weight="800" fill="#334" text-anchor="middle">XIAO ESP32-S3</text>`;
  for (let i = 0; i < 7; i++) {
    s += `<circle cx="${hx(i + 1)}" cy="${ROWS.d}" r="7" fill="${C.gold}" stroke="#7a5a00"/><circle cx="${hx(i + 1)}" cy="${ROWS.g}" r="7" fill="${C.gold}" stroke="#7a5a00"/>`;
  }
  s += `</g>`;
  if (labels) {
    for (let i = 0; i < 7; i++) {
      s += `<text x="${hx(i + 1)}" y="${ROWS.d + 25}" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">${TOP_PINS[i]}</text>`;
      s += `<text x="${hx(i + 1)}" y="${ROWS.g - 14}" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">${BOTTOM_PINS[i]}</text>`;
    }
    s += `<text x="${x - 9}" y="${(ROWS.d + ROWS.g) / 2 + 30}" font-size="11" fill="${C.ink}" text-anchor="middle">USB-C</text>`;
  }
  return s;
}

function wire([c1, r1], [c2, r2], color, isNew) {
  const [x1, y1] = hole(c1, r1), [x2, y2] = hole(c2, r2);
  const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 26 - Math.abs(x2 - x1) * 0.12;
  return `<g ${glow(isNew)}><path d="M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="5" fill="#333"/><circle cx="${x2}" cy="${y2}" r="5" fill="#333"/></g>`;
}
function led([cl, r], [cs], isNew) {
  const [x1, y] = hole(cl, r), [x2] = hole(cs, r), cx = (x1 + x2) / 2, top = y - 62;
  return `<g ${glow(isNew)}><line x1="${x1}" y1="${y}" x2="${cx - 5}" y2="${top + 30}" stroke="#888" stroke-width="3"/><line x1="${x2}" y1="${y}" x2="${cx + 5}" y2="${top + 30}" stroke="#888" stroke-width="3"/>
  <path d="M${cx - 14} ${top + 30} V${top + 12} a14 14 0 0 1 28 0 V${top + 30} Z" fill="${C.red}" opacity=".92" stroke="#7b1a12" stroke-width="2"/><rect x="${cx - 17}" y="${top + 28}" width="34" height="6" rx="2" fill="#b8302a"/></g>
  <text x="${x1 - 6}" y="${y + 20}" font-size="12" font-weight="800" fill="${C.ink}" text-anchor="end">+ long</text><text x="${x2 + 6}" y="${y + 20}" font-size="12" font-weight="800" fill="${C.ink}">− short</text>`;
}
function resistor([c1, r1], [c2, r2], isNew) {
  const [x1, y1] = hole(c1, r1), [x2, y2] = hole(c2, r2), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return `<g ${glow(isNew)}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#888" stroke-width="3"/><g transform="translate(${mx} ${my}) rotate(${ang})"><rect x="-22" y="-8" width="44" height="16" rx="7" fill="#D8C79A" stroke="#7a6a3a"/>
  <rect x="-14" y="-8" width="4" height="16" fill="${C.red}"/><rect x="-6" y="-8" width="4" height="16" fill="${C.red}"/><rect x="2" y="-8" width="4" height="16" fill="#7B4B2A"/><rect x="12" y="-8" width="4" height="16" fill="#C9A227"/></g></g>`;
}
function usb(isNew) {
  const y = (ROWS.d + ROWS.g) / 2, x = hx(1) - 42;
  return `<g ${glow(isNew)}><rect x="${x - 70}" y="${y - 11}" width="64" height="22" rx="5" fill="#333"/><path d="M${x - 70} ${y} C ${x - 150} ${y}, ${x - 150} ${y + 120}, ${x - 220} ${y + 120}" stroke="#333" stroke-width="10" fill="none"/></g>`;
}

/** A gold label at (x, y) with an arrow to (tx, ty); the box is kept inside the page. */
const callout = (x, y, tx, ty, text) => {
  const bw = Math.round(text.length * 10.2) + 24, bh = 32;
  const bx = Math.max(12, Math.min(x, W - bw - 12)), by = Math.max(70, Math.min(y - bh, H - bh - 26));
  const cx = bx + bw / 2, cy = by + bh / 2;
  return `<line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="${C.ink}" stroke-width="2.5" marker-end="url(#arr)"/>` +
    `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="8" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.5"/><text x="${bx + 11}" y="${by + 22}" font-size="16" font-weight="800" fill="${C.ink}">${esc(text)}</text>`;
};

// ── page frame: step badge, parts box, title, footnote ───────────────────────
function page({ n, title, parts = [], body, note = "Illustration - not to scale. Match it to your real parts." }) {
  const partsBox = parts.length
    ? `<g><rect x="20" y="70" width="230" height="${28 + parts.length * 30}" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="2"/><text x="34" y="92" font-size="13" font-weight="800" fill="${C.soft}">NEW PARTS</text>${parts.map((p, i) => `<text x="34" y="${120 + i * 30}" font-size="16" font-weight="800" fill="${C.ink}">${esc(p)}</text>`).join("")}</g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" role="img" aria-label="${esc(`Step ${n}: ${title}`)}">
<defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${C.gold}" flood-opacity="1"/><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${C.gold}" flood-opacity="1"/></filter>
<marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker></defs>
<rect width="${W}" height="${H}" fill="${C.paper}"/>
<circle cx="52" cy="40" r="28" fill="${C.green}"/><text x="52" y="50" font-size="28" font-weight="900" fill="#fff" text-anchor="middle">${n}</text>
<text x="94" y="50" font-size="26" font-weight="800" fill="${C.ink}">${esc(title)}</text>
${partsBox}${body}
<text x="${W - 16}" y="${H - 12}" font-size="12" fill="${C.soft}" text-anchor="end">${esc(note)}</text></svg>`;
}

// ── Blink build: cumulative breadboard scenes ────────────────────────────────
const BUILD = {
  xiao: (n) => xiao(n),
  gnd: (n) => wire([2, "a"], [2, "tm"], C.black, n),
  rail: (n) => wire([24, "tm"], [24, "bm"], C.black, n),
  sig: (n) => wire([1, "j"], [12, "j"], C.yellow, n),
  led: (n) => led([12, "h"], [13, "h"], n),
  res: (n) => resistor([13, "j"], [16, "bm"], n),
  usb: (n) => usb(n),
};
const scene = (have, fresh, extra = "") => breadboard() + have.map((k) => BUILD[k](k === fresh)).join("") + extra;

const blink = {
  "b001-power-off": page({ n: 1, title: "Unplug the USB cable", body: `<g transform="translate(330 150)"><rect x="0" y="80" width="140" height="90" rx="12" fill="${C.pcb}"/><text x="70" y="132" font-size="16" font-weight="800" fill="#fff" text-anchor="middle">XIAO</text><rect x="-60" y="112" width="60" height="26" rx="6" fill="#B8BCC2" stroke="#555" stroke-width="2"/><rect x="-200" y="110" width="80" height="30" rx="6" fill="#333"/><path d="M-200 125 C -260 125 -260 260 -320 260" stroke="#333" stroke-width="12" fill="none"/><path d="M-110 125 h40" stroke="${C.red}" stroke-width="6" marker-end="url(#arr)"/><text x="-150" y="95" font-size="20" font-weight="900" fill="${C.red}" text-anchor="middle">⏻ unplugged</text><text x="180" y="40" font-size="18" font-weight="800" fill="${C.ink}">No power while you wire.</text><text x="180" y="66" font-size="16" fill="${C.soft}">Plug in again only at step 12.</text></g>` }),
  "b002-breadboard": page({ n: 2, title: "Meet the breadboard", parts: ["1× half-size breadboard"], body: breadboard() + callout(560, 112, 560, ROWS.tp - 4, "+ / − rails run the whole length") + callout(560, 652, 600, ROWS.j + 4, "rows a–e and f–j, columns 1–25") }),
  "b003-columns": page({ n: 3, title: "Five holes in a column are joined", body: breadboard() + `<rect x="${hx(10) - 10}" y="${ROWS.a - 12}" width="20" height="${ROWS.e - ROWS.a + 24}" rx="8" fill="none" stroke="${C.green}" stroke-width="4"/><rect x="${hx(10) - 10}" y="${ROWS.f - 12}" width="20" height="${ROWS.j - ROWS.f + 24}" rx="8" fill="none" stroke="${C.orange}" stroke-width="4"/><rect x="${X0 - 14}" y="${ROWS.tm - 12}" width="${(COLS - 1) * P + 28}" height="24" rx="8" fill="none" stroke="${C.blue}" stroke-width="3"/>` + callout(520, 300, hx(10) + 14, ROWS.c, "a–e in column 10: joined") + callout(520, 470, hx(10) + 14, ROWS.h, "f–j: joined separately (gap!)") }),
  "b004-place-xiao": page({ n: 4, title: "Press the XIAO across the centre gap", parts: ["1× Seeed XIAO ESP32-S3"], body: scene(["xiao"], "xiao") + callout(470, 112, hx(4), ROWS.d - 20, "top: 5V GND 3V3 D10 D9 D8 D7") + callout(470, 652, hx(4), ROWS.g + 20, "bottom: D0 D1 D2 D3 D4 D5 D6") }),
  "b005-gnd-wire": page({ n: 5, title: "Black wire: GND → top − rail", parts: ["1× black jumper wire"], body: scene(["xiao", "gnd"], "gnd") + callout(330, 112, hx(2) + 8, ROWS.b, "GND column, above the board → − rail") }),
  "b006-rail-wire": page({ n: 6, title: "Black wire: join the two − rails", parts: ["1× black jumper wire"], body: scene(["xiao", "gnd", "rail"], "rail") + callout(560, 120, hx(24) - 6, ROWS.c, "column 24: top − rail to bottom − rail") }),
  "b007-led-legs": page({ n: 7, title: "Find the LED's long leg (+)", parts: ["1× 5 mm red LED"], body: `<g transform="translate(480 330)"><line x1="-20" y1="0" x2="-20" y2="150" stroke="#888" stroke-width="6"/><line x1="20" y1="0" x2="20" y2="110" stroke="#888" stroke-width="6"/><path d="M-50 0 V-60 a50 50 0 0 1 100 0 V0 Z" fill="${C.red}" stroke="#7b1a12" stroke-width="3"/><rect x="-58" y="-6" width="116" height="16" rx="4" fill="#b8302a"/><path d="M50 -6 v16" stroke="#7b1a12" stroke-width="4"/></g>` + callout(140, 470, 456, 470, "LONG leg = + (anode)") + callout(640, 420, 504, 430, "short leg = − (cathode)") + callout(640, 270, 532, 332, "flat edge on the rim = − side") }),
  "b008-yellow-wire": page({ n: 8, title: "Yellow wire: D0 → column 12", parts: ["1× yellow jumper wire"], body: scene(["xiao", "gnd", "rail", "sig"], "sig") + callout(150, 652, hx(1) + 4, ROWS.j + 4, "D0 column, below the board") + callout(560, 652, hx(12), ROWS.j + 8, "column 12, row j") }),
  "b009-place-led": page({ n: 9, title: "LED: long leg column 12, short leg column 13", body: scene(["xiao", "gnd", "rail", "sig", "led"], "led") + callout(560, 300, hx(12) + 4, ROWS.h - 40, "long leg: column 12 · short leg: 13") }),
  "b010-resistor": page({ n: 10, title: "Resistor: column 13 → bottom − rail", parts: ["1× 220 Ω resistor (red-red-brown)"], body: scene(["xiao", "gnd", "rail", "sig", "led", "res"], "res") + callout(560, 652, hx(15), ROWS.bm - 8, "either way round is fine") }),
  "b011-check": page({ n: 11, title: "Check the whole path before power", body: scene(["xiao", "gnd", "rail", "sig", "led", "res"], null) + `<g transform="translate(470 74)"><rect width="470" height="40" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="2"/><text x="14" y="26" font-size="15" font-weight="800" fill="${C.ink}">D0 → yellow → LED + … − → resistor → − rail → GND</text></g>` }),
  "b012-plug-in": page({ n: 12, title: "Now plug in the USB data cable", parts: ["1× USB-C data cable"], body: scene(["xiao", "gnd", "rail", "sig", "led", "res", "usb"], "usb") + callout(40, 652, hx(1) - 150, (ROWS.d + ROWS.g) / 2 + 40, "a DATA cable (some only charge)") }),
  "b013-code": page({ n: 13, title: "The blink program", note: "Arduino sketch - board: XIAO_ESP32S3", body: `<g transform="translate(150 110)"><rect width="660" height="330" rx="14" fill="#14261B"/><text font-family="ui-monospace, Menlo, monospace" font-size="21" fill="#E8F0E8">
<tspan x="28" y="52" fill="#9FD3A8">// blink - D0 is the pin with the yellow wire</tspan><tspan x="28" y="92">const int LED = D0;</tspan><tspan x="28" y="132">void setup() {</tspan><tspan x="60" y="166">pinMode(LED, OUTPUT);</tspan><tspan x="28" y="200">}</tspan><tspan x="28" y="236">void loop() {</tspan><tspan x="60" y="270">digitalWrite(LED, HIGH); delay(500);  <tspan fill="${C.gold}">// on</tspan></tspan><tspan x="60" y="304">digitalWrite(LED, LOW);  delay(500);  <tspan fill="${C.gold}">// off</tspan></tspan></text><text x="28" y="326" font-family="ui-monospace, monospace" font-size="21" fill="#E8F0E8">}</text></g>` }),
  "b014-upload": page({ n: 14, title: "Arduino IDE: pick the board, port, Upload", note: "Menu names from the Arduino IDE 2 with the esp32 boards package", body: `<g transform="translate(110 90)"><rect width="740" height="420" rx="12" fill="#fff" stroke="${C.ink}" stroke-width="2"/><rect width="740" height="44" rx="12" fill="#E8EDEA"/><circle cx="34" cy="22" r="14" fill="${C.green}"/><path d="M28 22 h12 M34 16 l6 6 -6 6" stroke="#fff" stroke-width="3" fill="none"/><circle cx="70" cy="22" r="14" fill="${C.green}"/><path d="M70 14 v14 M63 22 l7 7 7-7" stroke="#fff" stroke-width="3" fill="none"/>
  <rect x="104" y="8" width="250" height="28" rx="6" fill="#fff" stroke="#999"/><text x="116" y="27" font-size="15">XIAO_ESP32S3 · COM/tty port</text>
  <text x="30" y="96" font-size="17" font-weight="800" fill="${C.ink}">Tools → Board → esp32 → XIAO_ESP32S3</text><text x="30" y="132" font-size="17" font-weight="800" fill="${C.ink}">Tools → USB CDC On Boot → Enabled</text><text x="30" y="168" font-size="17" font-weight="800" fill="${C.ink}">Tools → Port → the new port that appeared</text><text x="30" y="204" font-size="17" font-weight="800" fill="${C.ink}">Click Upload (→) and wait for “Done uploading”</text></g>` + callout(330, 160, 180, 112, "Upload") }),
  "b015-blink": page({ n: 15, title: "Watch it blink", body: scene(["xiao", "gnd", "rail", "sig", "led", "res", "usb"], null) + `<circle cx="${(hx(12) + hx(13)) / 2}" cy="${ROWS.h - 46}" r="34" fill="${C.gold}" opacity=".55"/><text x="${(hx(12) + hx(13)) / 2 + 60}" y="${ROWS.h - 70}" font-size="22" font-weight="900" fill="${C.ink}">on ½ s · off ½ s</text>` }),
  "b016-troubleshoot": page({ n: 16, title: "Not blinking? Check these three", body: `<g font-size="20" font-weight="800" fill="${C.ink}"><text x="110" y="170">1  LED backwards? Long leg must be in column 12.</text><text x="110" y="250">2  Resistor in column 13 AND the bottom − rail?</text><text x="110" y="330">3  Both black wires in place (GND → rail, rail → rail)?</text><text x="110" y="410" fill="${C.soft}" font-weight="600">Still nothing? Unplug, re-seat each part firmly, try again.</text></g>` }),
};

// ── Starter Node scenes ──────────────────────────────────────────────────────
const bigXiao = (extra = "") => `<g transform="translate(330 180)"><rect x="-58" y="104" width="62" height="56" rx="8" fill="#B8BCC2" stroke="#555" stroke-width="3"/><rect x="0" y="40" width="300" height="184" rx="16" fill="${C.pcb}" stroke="#123" stroke-width="3"/><rect x="92" y="70" width="180" height="124" rx="8" fill="#C9CDD2" stroke="#7A8088"/><text x="182" y="138" font-size="18" font-weight="800" fill="#334" text-anchor="middle">XIAO ESP32-S3</text>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${40 + i * 38}" cy="54" r="8" fill="${C.gold}"/><circle cx="${40 + i * 38}" cy="210" r="8" fill="${C.gold}"/>`).join("")}<rect x="22" y="84" width="22" height="22" rx="4" fill="#ddd" stroke="#333"/><text x="33" y="100" font-size="12" font-weight="900" text-anchor="middle">B</text><rect x="22" y="158" width="22" height="22" rx="4" fill="#ddd" stroke="#333"/><text x="33" y="174" font-size="12" font-weight="900" text-anchor="middle">R</text><circle cx="62" cy="132" r="7" fill="${C.orange}"/>${extra}</g>`;
const phone = (inner) => `<g transform="translate(330 100)"><rect width="300" height="500" rx="36" fill="#222"/><rect x="14" y="40" width="272" height="430" rx="16" fill="#fff"/>${inner}</g>`;
const field = (y, label, value, hi) => `<text x="34" y="${y}" font-size="14" fill="${C.soft}">${esc(label)}</text><rect x="30" y="${y + 8}" width="240" height="34" rx="6" fill="${hi ? "#FFF6D6" : "#fff"}" stroke="${hi ? C.gold : "#aaa"}" stroke-width="${hi ? 3 : 1.5}"/><text x="40" y="${y + 31}" font-size="15" font-weight="700" fill="${C.ink}">${esc(value)}</text>`;
const starter = {
  "s001-board": page({ n: 1, title: "This is your coop brain", parts: ["1× Seeed XIAO ESP32-S3"], body: bigXiao() + callout(110, 560, 360, 300, "tiny computer with Wi-Fi") }),
  "s002-usb": page({ n: 2, title: "Find the USB-C port and the B / R buttons", body: bigXiao() + callout(110, 140, 296, 280, "USB-C port") + callout(560, 140, 362, 244, "B = boot") + callout(560, 470, 362, 318, "R = reset") + callout(110, 470, 390, 282, "user LED") }),
  "s003-cable": page({ n: 3, title: "Plug in a USB data cable", parts: ["1× USB-C data cable"], body: bigXiao(`<g filter="url(#glow)"><rect x="-150" y="110" width="92" height="44" rx="8" fill="#333"/><path d="M-150 132 C -230 132 -230 330 -300 330" stroke="#333" stroke-width="14" fill="none"/></g>`) + callout(80, 120, 190, 270, "charge-only cables don't work") }),
  "s004-flasher": null, // OS/website screenshot (capture-steps)
  "s005-restart": page({ n: 5, title: "It restarts on its own", body: bigXiao(`<circle cx="62" cy="132" r="18" fill="${C.orange}" opacity=".5"/>`) + callout(600, 520, 400, 290, "LED blinks fast = setup mode") }),
  "s006-join": page({ n: 6, title: "Join the TenderNode-Setup Wi-Fi", body: phone(`<text x="34" y="80" font-size="18" font-weight="800">Wi-Fi</text>${["HomeNetwork", "TenderNode-Setup", "Neighbour-5G"].map((n, i) => `<rect x="24" y="${100 + i * 56}" width="252" height="46" rx="8" fill="${i === 1 ? "#FFF6D6" : "#f4f4f4"}" stroke="${i === 1 ? C.gold : "#ddd"}" stroke-width="${i === 1 ? 3 : 1}"/><text x="40" y="${130 + i * 56}" font-size="16" font-weight="${i === 1 ? 900 : 500}">${n}</text>`).join("")}<text x="34" y="320" font-size="14" fill="${C.soft}">A setup page opens by itself.</text><text x="34" y="342" font-size="14" fill="${C.soft}">If not, browse to 192.168.4.1</text>`) + callout(660, 220, 610, 248, "this one") }),
  "s007-wifi": page({ n: 7, title: "Choose your 2.4 GHz Wi-Fi and password", body: phone(`<text x="34" y="78" font-size="16" font-weight="800">TenderNode-Setup</text>${field(110, "SSID", "YourHomeWiFi (2.4 GHz)", true)}${field(180, "Password", "••••••••••", true)}`) + callout(660, 200, 600, 200, "not a 5 GHz network") }),
  "s008-broker": page({ n: 8, title: "Broker, port, device ID, product type", body: phone(`${field(70, "Broker IP (leave blank to auto-find)", "192.168.1.50", true)}${field(140, "Broker port", "1883", true)}${field(210, "Device ID", "node_ab12", false)}${field(280, "Product type", "chicken-tender", true)}<rect x="30" y="370" width="240" height="40" rx="8" fill="${C.green}"/><text x="150" y="396" font-size="16" font-weight="800" fill="#fff" text-anchor="middle">Save</text>`) + callout(660, 140, 600, 118, "the IP your hub printed") + callout(660, 330, 600, 360, "starter, chicken-tender, …") }),
  "s009-alive": page({ n: 9, title: "Slow blink = online", body: bigXiao(`<circle cx="62" cy="132" r="18" fill="${C.orange}" opacity=".5"/>`) + `<g transform="translate(150 470)">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 110}" y="0" width="100" height="34" rx="6" fill="${i % 2 ? "#ddd" : C.orange}"/><text x="${i * 110 + 50}" y="23" font-size="14" font-weight="800" text-anchor="middle">${i % 2 ? "off ½ s" : "on ½ s"}</text>`).join("")}</g>` }),
  "s010-dashboard": null, // OS screenshot
};

// ── Mission 04 rule cards ────────────────────────────────────────────────────
const ruleCard = (n, title, focus) => page({ n, title, note: "WHEN · IF · DO - one automation rule", body: `<g transform="translate(120 170)">${[["WHEN", ["🌅", "Sunset"], "when"], ["IF", ["🐔", "All chickens", "inside"], "if"], ["DO", ["🚪", "Close the", "door"], "do"]].map(([k, v, id], i) => {
  const on = focus === id, done = ["when", "if", "do"].indexOf(focus) > i || focus === "all";
  return `<g transform="translate(${i * 250} 0)"><rect width="220" height="300" rx="18" fill="${on ? "#FFF6D6" : "#fff"}" stroke="${on ? C.gold : C.ink}" stroke-width="${on ? 6 : 2}" ${on ? 'filter="url(#glow)"' : ""}/><text x="110" y="56" font-size="30" font-weight="900" fill="${C.green}" text-anchor="middle">${k}</text>${on || done ? v.map((line, li) => `<text x="110" y="${li === 0 ? 140 : 160 + li * 30}" font-size="${li === 0 ? 44 : 22}" font-weight="800" fill="${C.ink}" text-anchor="middle">${line}</text>`).join("") : `<text x="110" y="170" font-size="40" font-weight="800" fill="#bbb" text-anchor="middle">?</text>`}${i < 2 ? `<text x="236" y="160" font-size="36" fill="${C.soft}">→</text>` : ""}</g>`;
}).join("")}</g>` });
const rules = { "when": ruleCard(1, "Choose WHEN: sunset", "when"), "if": ruleCard(2, "Choose IF: all chickens inside", "if"), "do": ruleCard(3, "Choose DO: close the door", "do") };

const write = (dir, files) => {
  mkdirSync(join(OUT, dir), { recursive: true });
  let n = 0;
  for (const [name, svg] of Object.entries(files)) if (svg) { writeFileSync(join(OUT, dir, `${name}.svg`), svg); n++; }
  return n;
};
const total = write("electronics-blink-xiao", blink) + write("starter-node-first-coop-brain", starter) + write("04-build-a-coop-brain", rules);
console.log(`${total} drawings → public/builder-assets/steps/`);
