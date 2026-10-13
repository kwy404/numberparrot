// The numberparrot travel line art: icons, a globe with number meridians,
// passport stamps with currency symbols and postcards. One set of shapes is used
// two ways:
//
//   - inline in the docs pages, colored with CSS custom properties so the same
//     markup follows the light and dark theme (see docs/site.css, --np-*);
//   - as standalone files with fixed colors, in a light and a dark variant, for
//     the README and anything outside the site (written by scripts/build-assets.mjs).
//
// Every drawing uses round caps and joins and one stroke weight per size, so the
// set reads as one family next to Pico, the mascot.

/** Colors for inline use: resolved by docs/site.css in both themes. */
export const INLINE = {
  ink: "var(--np-ink)",
  soft: "var(--np-soft)",
  paper: "var(--np-paper)",
  sun: "var(--np-sun)",
  leaf: "var(--np-leaf)",
  red: "var(--np-red)",
  sky: "var(--np-sky)",
};
/** Fixed palettes for the standalone files. */
export const LIGHT = {
  ink: "#17324A",
  soft: "#9DB0BF",
  paper: "#FFFDF6",
  sun: "#FFC83D",
  leaf: "#1C9A5B",
  red: "#E5484D",
  sky: "#D9F2E5",
};
export const DARK = {
  ink: "#E4EEF5",
  soft: "#5D7183",
  paper: "#13202B",
  sun: "#FFD25E",
  leaf: "#4ADE90",
  red: "#FF6B6B",
  sky: "#173A2B",
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Icons ---------------------------------------------------------------------------
// 24 x 24, stroke 1.75. `p` is the palette; most icons only use currentColor so they
// inherit the text color, a few add one accent fill.
const ICONS = {
  globe: () => `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3.2-3 14.8 0 18M12 3c3 3.2 3 14.8 0 18M4.6 7.5h14.8M4.6 16.5h14.8"/>`,
  coins: (p) => `<ellipse cx="12" cy="7" rx="7" ry="3" fill="${p.sun}" fill-opacity=".35"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><ellipse cx="12" cy="7" rx="7" ry="3"/>`,
  digits: () => `<rect x="2.5" y="5" width="8.5" height="14" rx="2"/><rect x="13" y="5" width="8.5" height="14" rx="2"/><path d="M5.5 9.5 7.2 8v8M16 9c.3-1 1.1-1.3 1.7-1.3 1 0 1.7.8 1.4 1.8-.3 1-2.9 3.2-3.2 6.5h3.4"/>`,
  parens: (p) => `<path d="M8 3.5c-3.3 4.8-3.3 12.2 0 17M16 3.5c3.3 4.8 3.3 12.2 0 17"/><path d="M9.5 12h5" stroke="${p.red}" stroke-width="2.25"/>`,
  detect: (p) => `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="M8.5 12.5c.8 0 1.2-.5 1.2-1.1v-.9M12.5 12.5c.8 0 1.2-.5 1.2-1.1v-.9" stroke="${p.leaf}" stroke-width="2"/>`,
  shield: (p) => `<path d="M12 2.8 19.5 5.6v5.9c0 4.7-3.2 8.2-7.5 9.7-4.3-1.5-7.5-5-7.5-9.7V5.6Z" fill="${p.sun}" fill-opacity=".3"/><path d="M12 2.8 19.5 5.6v5.9c0 4.7-3.2 8.2-7.5 9.7-4.3-1.5-7.5-5-7.5-9.7V5.6Z"/><path d="m8.8 12 2.2 2.2 4.4-4.6"/>`,
  input: (p) => `<rect x="2.5" y="6.5" width="19" height="11" rx="2.5"/><path d="M6 12h6"/><path d="M15.5 9v6" stroke="${p.leaf}" stroke-width="2"/>`,
  plane: () => `<path d="M10.2 13.8 3.5 12l-1-1.6 1.6-.6 6.6 1.2 4.8-4.9c.9-.9 2.6-1.4 3.3-.7.7.7.2 2.4-.7 3.3l-4.9 4.8 1.2 6.6-.6 1.6-1.6-1-1.8-6.7-3 2.9.3 2.3-1.2 1.2-1.2-2.8-2.8-1.2 1.2-1.2 2.3.3Z"/>`,
  ticket: () => `<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4Z"/><path d="M15 6v2.2M15 10.9v2.2M15 15.8V18"/>`,
  suitcase: () => `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.2C9 4.5 9.5 4 10.2 4h3.6c.7 0 1.2.5 1.2 1.2V7M7.5 7v13M16.5 7v13"/>`,
  compass: (p) => `<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z" fill="${p.sun}" fill-opacity=".45"/>`,
  clock: () => `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  stamp: (p) => `<path d="M4 4h16v16H4z" stroke-dasharray="1.6 2.2"/><rect x="7" y="7" width="10" height="10" rx="1" fill="${p.sun}" fill-opacity=".35"/><path d="M10 10.2c.3-.7 1-1 1.8-1 1.2 0 2 .6 2 1.4 0 1.9-3.8 1-3.8 2.9 0 .8.8 1.4 2 1.4.8 0 1.5-.3 1.8-1M12 8v1.2M12 14.9V16"/>`,
  postcard: () => `<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M12.5 8v8M5.5 9h4M5.5 12h4M5.5 15h3"/><rect x="15.5" y="8" width="3.5" height="4" rx=".5"/>`,
  search: () => `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`,
  copy: () => `<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M15 9V5.5A2 2 0 0 0 13 3.5H5.5a2 2 0 0 0-2 2V13a2 2 0 0 0 2 2H9"/>`,
  check: () => `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  cross: () => `<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/>`,
  sun: () => `<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>`,
  moon: () => `<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>`,
  monitor: () => `<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>`,
  arrow: () => `<path d="M4.5 12h15M13.5 6l6 6-6 6"/>`,
  external: () => `<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>`,
  menu: () => `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  book: () => `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>`,
  code: () => `<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>`,
  pin: (p) => `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10" r="2.3" fill="${p.sun}"/>`,
  terminal: () => `<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m6.5 9.5 3 2.5-3 2.5M12 15h5"/>`,
  github: () => `<path stroke="none" fill="currentColor" d="M12 1.6a10.4 10.4 0 0 0-3.3 20.3c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1.1a9.9 9.9 0 0 1 5.2 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.4.1 2.7.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.4 10.4 0 0 0 12 1.6Z"/>`,
  linkedin: () => `<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-6M11.5 13c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7v3.5"/>`,
  npm: () => `<path d="M12 2.8 20 7.3v9.4L12 21.2l-8-4.5V7.3Z"/><path d="M4 7.3 12 12l8-4.7M12 12v9.2"/>`,
};

export const ICON_NAMES = Object.keys(ICONS);

/** An inline icon. `cls` goes on the svg; icons are decorative unless `label` is set. */
export function icon(name, cls = "np-icon", label = "", p = INLINE) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon ${name}`);
  const a11y = label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true"`;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"${a11y}>${body(p)}</svg>`;
}

/** A standalone icon file. */
export function iconFile(name, p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${p.ink}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" color="${p.ink}">${ICONS[name](p)}</svg>\n`;
}

// Globe with number meridians ----------------------------------------------------------
// The meridians are not lines: they are numbers written in different locales, set on
// the curve with textPath. One sunny orbit carries a tiny plane around the globe.
let uid = 0;
export function globe(p = INLINE, { id = `g${++uid}`, size = 360 } = {}) {
  const cx = 180;
  const cy = 196;
  const r = 128;
  const meridians = [
    [r * 0.88, "1.234.567,89   12,34,567.89   1 234 567,89   1'234'567.89   "],
    [r * 0.42, "١٬٢٣٤٫٥٦   1,234.56   ۱۲۳٫۴۵   1.234,56   "],
  ];
  const paths = [];
  const texts = [];
  meridians.forEach(([rx, label], i) => {
    for (const side of [1, -1]) {
      const pid = `${id}-m${i}${side > 0 ? "e" : "w"}`;
      const sweep = side > 0 ? 1 : 0;
      paths.push(`<path id="${pid}" d="M${cx} ${cy - r} A${rx.toFixed(1)} ${r} 0 0 ${sweep} ${cx} ${cy + r}" fill="none"/>`);
      texts.push(
        `<text font-family="${MONO}" font-size="12" font-weight="600" fill="${i === 1 ? p.ink : p.leaf}" fill-opacity="${i === 1 ? 0.8 : 1}"><textPath href="#${pid}" startOffset="${side > 0 ? 3 : 9}%">${label.repeat(2)}</textPath></text>`,
      );
    }
  });
  const lat = [-80, -40, 0, 40, 80]
    .map((dy) => {
      const ry = Math.sqrt(r * r - dy * dy);
      return `<ellipse cx="${cx}" cy="${cy + dy}" rx="${ry.toFixed(1)}" ry="${(ry * 0.16).toFixed(1)}" fill="none" stroke="${p.soft}" stroke-width="1.25" stroke-dasharray="${dy === 0 ? "0" : "2 5"}"/>`;
    })
    .join("");
  return `<svg class="np-art" viewBox="0 0 360 380" width="${size}" height="${Math.round((size * 380) / 360)}" role="img" aria-label="A globe whose meridians are made of numbers written in different locales">
  <defs>${paths.join("")}<clipPath id="${id}-clip"><circle cx="${cx}" cy="${cy}" r="${r - 1}"/></clipPath></defs>
  <circle cx="276" cy="86" r="50" fill="${p.sun}"/>
  <path d="M276 18v-10M276 164v-8M208 86h-10M354 86h-8M228 38l-7-7M324 134l6 6M324 38l7-7" stroke="${p.sun}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.paper}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.sky}" fill-opacity=".55"/>
  <g clip-path="url(#${id}-clip)">${lat}${texts.join("")}</g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.ink}" stroke-width="2.5"/>
  <ellipse cx="${cx}" cy="${cy + 6}" rx="172" ry="46" transform="rotate(-14 ${cx} ${cy})" fill="none" stroke="${p.sun}" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round"/>
  <g transform="translate(330 140) rotate(-38) scale(1.35)" fill="${p.paper}" stroke="${p.ink}" stroke-width="1.6" stroke-linejoin="round">
    <path d="M-2 4-9 2-10 .5-8.4-.1-1.8 1.1 3-3.8C3.9-4.7 5.6-5.2 6.3-4.5 7-3.8 6.5-2.1 5.6-1.2L.7 3.6 1.9 10.2 1.3 11.8-.3 10.8-2.1 4.1-5.1 7-4.8 9.3-6 10.5-7.2 7.7-10 6.5-8.8 5.3-6.5 5.6Z"/>
  </g>
  <path d="M${cx - 34} ${cy + r + 4} h68" stroke="${p.ink}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M${cx} ${cy + r + 4} v18 M${cx - 46} ${cy + r + 22} h92" stroke="${p.ink}" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

// Passport stamps ---------------------------------------------------------------------
// shape: "circle", "rect" or "oval". The rim text runs on a path, the symbol sits in
// the middle, and a short date line makes it read as a border stamp.
export const STAMPS = {
  brl: { sym: "R$", top: "BRASIL", bottom: "GRU · SÃO PAULO", shape: "circle", tone: "leaf", rot: -8 },
  eur: { sym: "€", top: "EUROPA", bottom: "CDG · BER · MAD", shape: "rect", tone: "ink", rot: 6 },
  inr: { sym: "₹", top: "BHARAT", bottom: "BOM · DEL", shape: "oval", tone: "red", rot: -4 },
  jpy: { sym: "¥", top: "NIPPON", bottom: "HND · TOKYO", shape: "circle", tone: "red", rot: 10 },
  chf: { sym: "CHF", top: "SCHWEIZ", bottom: "ZRH · ZÜRICH", shape: "rect", tone: "leaf", rot: -6 },
  gbp: { sym: "£", top: "UNITED KINGDOM", bottom: "LHR · LONDON", shape: "oval", tone: "ink", rot: 5 },
  egp: { sym: "ج.م", top: "MISR", bottom: "CAI · CAIRO", shape: "circle", tone: "ink", rot: -10 },
  usd: { sym: "$", top: "UNITED STATES", bottom: "JFK · NEW YORK", shape: "rect", tone: "red", rot: 4 },
  krw: { sym: "₩", top: "KOREA", bottom: "ICN · SEOUL", shape: "oval", tone: "leaf", rot: -7 },
  try: { sym: "₺", top: "TÜRKİYE", bottom: "IST · ISTANBUL", shape: "circle", tone: "leaf", rot: 7 },
};

export function stamp(key, p = INLINE, { id = `s${++uid}`, size = 120, date = "13 OCT 2026" } = {}) {
  const s = STAMPS[key];
  const c = p[s.tone];
  const symSize = s.sym.length > 2 ? 26 : s.sym.length > 1 ? 34 : 44;
  let frame;
  let rim;
  if (s.shape === "circle") {
    frame = `<circle cx="60" cy="60" r="52" fill="none" stroke="${c}" stroke-width="3.2"/><circle cx="60" cy="60" r="37" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    rim = `<path id="${id}-t" d="M17 60a43 43 0 0 1 86 0" fill="none"/><path id="${id}-b" d="M14 60a46 46 0 0 0 92 0" fill="none"/>`;
  } else if (s.shape === "oval") {
    frame = `<ellipse cx="60" cy="60" rx="56" ry="44" fill="none" stroke="${c}" stroke-width="3.2"/><ellipse cx="60" cy="60" rx="42" ry="30" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    rim = `<path id="${id}-t" d="M11 60a49 37 0 0 1 98 0" fill="none"/><path id="${id}-b" d="M8 60a52 40 0 0 0 104 0" fill="none"/>`;
  } else {
    frame = `<rect x="6" y="14" width="108" height="92" rx="8" fill="none" stroke="${c}" stroke-width="3.2"/><rect x="13" y="30" width="94" height="60" rx="4" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    rim = "";
  }
  const label =
    s.shape === "rect"
      ? `<text x="60" y="25.5" text-anchor="middle" font-family="${SANS}" font-size="8.5" font-weight="800" letter-spacing="1.6" fill="${c}">${s.top}</text>
  <text x="60" y="101" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700" letter-spacing="1.2" fill="${c}">${s.bottom}</text>`
      : `<text font-family="${SANS}" font-size="8.5" font-weight="800" letter-spacing="1.6" fill="${c}"><textPath href="#${id}-t" startOffset="50%" text-anchor="middle">${s.top}</textPath></text>
  <text font-family="${SANS}" font-size="7.5" font-weight="700" letter-spacing="1.2" fill="${c}"><textPath href="#${id}-b" startOffset="50%" text-anchor="middle" side="left">${s.bottom}</textPath></text>`;
  return `<svg class="np-stamp" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
  <defs>${rim}</defs>
  <g transform="rotate(${s.rot} 60 60)" opacity=".92">
  ${frame}
  ${label}
  <text x="60" y="${s.shape === "rect" ? 66 : 64}" text-anchor="middle" font-family="${SANS}" font-size="${symSize}" font-weight="800" fill="${c}">${s.sym}</text>
  <text x="60" y="${s.shape === "rect" ? 82 : 80}" text-anchor="middle" font-family="${MONO}" font-size="7" font-weight="700" letter-spacing=".8" fill="${c}">${date}</text>
  </g>
</svg>`;
}

// Postcards -----------------------------------------------------------------------------
// A front with a sunny landscape and a number painted across the sky, and a back half
// with a stamp, a wavy postmark and address lines.
export function postcard(p = INLINE, { number = "1.234,56", place = "SÃO PAULO", stampKey = "brl", id = `p${++uid}`, width = 320 } = {}) {
  const st = stamp(stampKey, p, { id: `${id}-s`, size: 58 }).replace('class="np-stamp"', 'x="236" y="18"');
  return `<svg class="np-art" viewBox="0 0 320 210" width="${width}" height="${Math.round((width * 210) / 320)}" aria-hidden="true">
  <rect x="4" y="4" width="312" height="202" rx="10" fill="${p.paper}" stroke="${p.ink}" stroke-width="2"/>
  <clipPath id="${id}-f"><rect x="14" y="14" width="150" height="182" rx="6"/></clipPath>
  <g clip-path="url(#${id}-f)">
    <rect x="14" y="14" width="150" height="182" fill="${p.sky}"/>
    <circle cx="142" cy="70" r="15" fill="${p.sun}"/>
    <path d="M14 150c22-26 40-36 60-26s30-22 52-30 30 10 38 18v84H14Z" fill="${p.leaf}" fill-opacity=".85"/>
    <path d="M14 172c26-14 52-16 78-6s46 6 72-4v34H14Z" fill="${p.leaf}"/>
    <path d="M24 186c10-4 20-4 30 0s20 4 30 0M98 190c8-3 16-3 24 0" fill="none" stroke="${p.paper}" stroke-width="2" stroke-linecap="round"/>
    <text x="24" y="104" font-family="${SANS}" font-size="11" font-weight="800" letter-spacing="2" fill="${p.ink}">GREETINGS FROM</text>
    <text x="24" y="126" font-family="${SANS}" font-size="19" font-weight="800" fill="${p.ink}">${place}</text>
  </g>
  <rect x="14" y="14" width="150" height="182" rx="6" fill="none" stroke="${p.ink}" stroke-width="1.5"/>
  <text x="24" y="44" font-family="${MONO}" font-size="20" font-weight="800" fill="${p.ink}">${number}</text>
  <path d="M178 26v160" stroke="${p.soft}" stroke-width="1.5" stroke-dasharray="3 4"/>
  ${st}
  <g fill="none" stroke="${p.ink}" stroke-width="1.4" stroke-linecap="round" opacity=".55">
    <circle cx="232" cy="52" r="20"/>
    <path d="M196 84c8-5 16-5 24 0s16 5 24 0 16-5 24 0 16 5 24 0M196 94c8-5 16-5 24 0s16 5 24 0 16-5 24 0 16 5 24 0"/>
  </g>
  <path d="M194 130h108M194 152h108M194 174h72" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  <text x="196" y="125" font-family="${MONO}" font-size="9.5" font-weight="700" fill="${p.leaf}">parse(text, locale)</text>
</svg>`;
}

/** Wrap an inline drawing as a standalone file with fixed colors. */
export function standalone(inner) {
  return `${inner.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')}\n`;
}
