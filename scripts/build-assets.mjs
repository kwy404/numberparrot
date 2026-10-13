// Generates every SVG image of the project from one set of shapes, so the
// mascot, banner, icons, demo and favicon always stay consistent.
//
//   node scripts/build-assets.mjs
//
// Outputs: assets/*.svg, assets/icons/*.svg, assets/art/{light,dark}/*.svg (the travel
// line art from scripts/art.mjs), docs/img/mascot.svg, docs/favicon.svg,
// plus .cache/*.html pages that are screenshotted into the PNG previews.
import { mkdirSync, writeFileSync } from "node:fs";
import { DARK, LIGHT, STAMPS, globe, iconFile, postcard, stamp, standalone } from "./art.mjs";

const C = {
  green: "#2FBF71",
  red: "#F25C54",
  yellow: "#FFC83D",
  ink: "#1D2B3A",
  white: "#FFFFFF",
};
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/** Pico the parrot, drawn in a 400 x 400 box. */
function pico() {
  return `
  <g id="pico">
    <path d="M150 318 L104 392 L146 384 L178 336 Z" fill="${C.red}"/>
    <path d="M178 330 L162 398 L204 378 L206 334 Z" fill="${C.green}"/>
    <path d="M184 34 C172 4 206 -2 214 24 C218 40 214 58 208 74 Z" fill="${C.red}"/>
    <path d="M214 60 C222 24 258 30 248 58 C242 72 230 80 218 86 Z" fill="${C.red}"/>
    <path d="M178 70 C150 46 132 74 152 90 C162 98 176 100 188 98 Z" fill="${C.red}"/>
    <ellipse cx="190" cy="248" rx="96" ry="116" fill="${C.green}"/>
    <circle cx="214" cy="146" r="82" fill="${C.green}"/>
    <ellipse cx="214" cy="270" rx="56" ry="76" fill="${C.yellow}"/>
    <path d="M118 196 C92 262 112 322 152 350 C186 316 196 262 184 214 C168 188 138 182 118 196 Z" fill="${C.red}"/>
    <path d="M128 236 C140 264 150 290 152 322" fill="none" stroke="${C.yellow}" stroke-width="9" stroke-linecap="round"/>
    <path d="M150 220 C162 248 168 274 166 300" fill="none" stroke="${C.yellow}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="246" cy="136" rx="44" ry="42" fill="${C.white}"/>
    <circle cx="250" cy="130" r="17" fill="${C.ink}"/>
    <circle cx="256" cy="123" r="6" fill="${C.white}"/>
    <path d="M282 112 C336 104 352 150 334 196 C324 172 306 162 284 164 Z" fill="${C.yellow}"/>
    <path d="M284 164 C304 162 320 172 326 190 C306 196 290 192 278 180 Z" fill="${C.ink}"/>
    <path d="M176 352 C176 368 168 376 160 380 M214 352 C214 368 222 376 230 380" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
  </g>`;
}

/** Just the head, for the favicon. Drawn in a 400 x 400 box. */
function picoHead() {
  return `
    <path d="M150 74 C130 10 190 0 204 50 Z" fill="${C.red}"/>
    <path d="M196 60 C214 0 276 18 250 80 Z" fill="${C.red}"/>
    <circle cx="190" cy="220" r="160" fill="${C.green}"/>
    <ellipse cx="236" cy="200" rx="92" ry="88" fill="${C.white}"/>
    <circle cx="242" cy="190" r="38" fill="${C.ink}"/>
    <circle cx="256" cy="174" r="13" fill="${C.white}"/>
    <path d="M300 170 C392 150 410 262 382 330 C362 290 330 274 300 278 Z" fill="${C.yellow}"/>
    <path d="M300 278 C332 274 360 292 372 322 C338 334 312 326 292 304 Z" fill="${C.ink}"/>`;
}

const svg = (w, h, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}\n</svg>\n`;

function write(path, content) {
  mkdirSync(path.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${path} (${Buffer.byteLength(content)} bytes)`);
}

// Mascot ----------------------------------------------------------------------
const mascot = svg(
  400,
  400,
  `\n  <title>Pico, the numberparrot mascot: a friendly green parrot</title>${pico()}`,
  ' role="img" aria-label="Pico the parrot"',
);
write("assets/mascot.svg", mascot);
write("docs/img/mascot.svg", mascot);

const favicon = svg(400, 400, `\n  <title>numberparrot</title>${picoHead()}`);
write("docs/favicon.svg", favicon);
write("assets/favicon.svg", favicon);

// Banner (light and dark) ------------------------------------------------------
function banner(dark) {
  const bg = dark ? "#0F1722" : "#F6FBF8";
  const fg = dark ? "#F3F6FA" : C.ink;
  const muted = dark ? "#A9B6C6" : "#4A5A6C";
  const card = dark ? "#1A2533" : C.white;
  const border = dark ? "#2C3A4C" : "#DCE7E0";
  return svg(
    1280,
    400,
    `
  <title>numberparrot: parse localized numbers and currency strings in JavaScript</title>
  <rect width="1280" height="400" rx="28" fill="${bg}"/>
  <circle cx="1180" cy="40" r="140" fill="${C.green}" opacity="0.10"/>
  <circle cx="60" cy="380" r="110" fill="${C.yellow}" opacity="0.14"/>
  <g transform="translate(60 40) scale(0.8)">${pico()}</g>
  <text x="420" y="150" font-family="${SANS}" font-size="84" font-weight="800" fill="${fg}" letter-spacing="-2">number<tspan fill="${C.green}">parrot</tspan></text>
  <text x="424" y="204" font-family="${SANS}" font-size="30" fill="${muted}">Parse localized numbers and currency strings in JavaScript</text>
  <g font-family="${MONO}" font-size="26">
    <rect x="424" y="248" width="760" height="96" rx="18" fill="${card}" stroke="${border}" stroke-width="2"/>
    <text x="452" y="290" fill="${muted}">parseFloat("1.234,56")</text>
    <text x="900" y="290" fill="${C.red}" font-weight="700">// 1.234</text>
    <text x="452" y="326" fill="${fg}">parse("1.234,56", "pt-BR")</text>
    <text x="900" y="326" fill="${C.green}" font-weight="700">// 1234.56</text>
  </g>`,
    ' role="img" aria-label="numberparrot banner"',
  );
}
write("assets/banner.svg", banner(false));
write("assets/banner-dark.svg", banner(true));

// Feature icons ------------------------------------------------------------------
const ICON_STROKE = `fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const icons = {
  locales: {
    title: "Any locale",
    tint: "#E3F7EC",
    body: `<circle cx="32" cy="32" r="16" fill="${C.green}" opacity="0.35"/>
    <circle cx="32" cy="32" r="16" ${ICON_STROKE}/>
    <path d="M16 32 H48 M32 16 C24 24 24 40 32 48 M32 16 C40 24 40 40 32 48" ${ICON_STROKE}/>`,
  },
  currency: {
    title: "Currency",
    tint: "#FFF4D6",
    body: `<ellipse cx="32" cy="42" rx="16" ry="6" fill="${C.yellow}"/>
    <ellipse cx="32" cy="42" rx="16" ry="6" ${ICON_STROKE}/>
    <path d="M16 34 V42 M48 34 V42" ${ICON_STROKE}/>
    <ellipse cx="32" cy="34" rx="16" ry="6" fill="${C.yellow}"/>
    <ellipse cx="32" cy="34" rx="16" ry="6" ${ICON_STROKE}/>
    <path d="M16 26 V34 M48 26 V34" ${ICON_STROKE}/>
    <ellipse cx="32" cy="26" rx="16" ry="6" fill="${C.yellow}"/>
    <ellipse cx="32" cy="26" rx="16" ry="6" ${ICON_STROKE}/>
    <path d="M32 22 V30" ${ICON_STROKE}/>`,
  },
  digits: {
    title: "Any digits",
    tint: "#FDE6E4",
    body: `<rect x="12" y="18" width="18" height="28" rx="5" fill="${C.red}" opacity="0.35"/>
    <rect x="12" y="18" width="18" height="28" rx="5" ${ICON_STROKE}/>
    <rect x="34" y="18" width="20" height="28" rx="5" ${ICON_STROKE}/>
    <path d="M18 26 L22 23 V41" ${ICON_STROKE}/>
    <path d="M40 42 V25 M40 28 C41 23 43 23 44 27 C45 23 47 23 48 25" ${ICON_STROKE}/>`,
  },
  accounting: {
    title: "Accounting negatives",
    tint: "#FDE6E4",
    body: `<path d="M22 14 C12 24 12 40 22 50 M42 14 C52 24 52 40 42 50" ${ICON_STROKE}/>
    <path d="M24 32 H40" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>`,
  },
  detection: {
    title: "Detection",
    tint: "#E3F7EC",
    body: `<circle cx="28" cy="28" r="13" fill="${C.green}" opacity="0.35"/>
    <circle cx="28" cy="28" r="13" ${ICON_STROKE}/>
    <path d="M38 38 L50 50" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="28" cy="30" r="2.6" fill="${C.ink}"/>
    <path d="M29 33 C29 36 27 37 25 38" ${ICON_STROKE}/>`,
  },
  money: {
    title: "Money safety",
    tint: "#FFF4D6",
    body: `<path d="M32 12 L48 18 V30 C48 42 40 49 32 52 C24 49 16 42 16 30 V18 Z" fill="${C.yellow}"/>
    <path d="M32 12 L48 18 V30 C48 42 40 49 32 52 C24 49 16 42 16 30 V18 Z" ${ICON_STROKE}/>
    <path d="M25 31 L30 36 L40 26" ${ICON_STROKE}/>`,
  },
  input: {
    title: "Form input",
    tint: "#E3F7EC",
    body: `<rect x="10" y="20" width="44" height="24" rx="6" fill="${C.white}"/>
    <rect x="10" y="20" width="44" height="24" rx="6" ${ICON_STROKE}/>
    <path d="M18 32 H30" ${ICON_STROKE}/>
    <path d="M38 25 V39" fill="none" stroke="${C.green}" stroke-width="4" stroke-linecap="round"/>`,
  },
};
for (const [name, icon] of Object.entries(icons)) {
  const content = svg(
    64,
    64,
    `\n  <title>${icon.title}</title>\n  <rect width="64" height="64" rx="16" fill="${icon.tint}"/>\n  ${icon.body}`,
    ` role="img" aria-label="${icon.title} icon"`,
  );
  write(`assets/icons/${name}.svg`, content);
}

// Animated demo ------------------------------------------------------------------
// Four spellings of 1234567.89. parseFloat gets every one wrong; numberparrot does not.
const rows = [
  { input: "1.234.567,89", locale: "pt-BR", wrong: "1.234" },
  { input: "1'234'567.89", locale: "de-CH", wrong: "1" },
  { input: "12,34,567.89", locale: "en-IN", wrong: "12" },
  {
    input: "&#x0661;&#x066C;&#x0662;&#x0663;&#x0664;&#x066C;&#x0665;&#x0666;&#x0667;&#x066B;&#x0668;&#x0669;",
    locale: "ar-EG",
    wrong: "NaN",
  },
];
const PERIOD = 12; // seconds
const step = 1.1; // seconds between rows
const pct = (s) => ((s / PERIOD) * 100).toFixed(2);
let css = `
    text { font-family: ${MONO}; }
    .t { font-family: ${SANS}; }
    .r { opacity: 0; }
`;
rows.forEach((_, i) => {
  for (const [part, offset] of [
    ["in", 0],
    ["pf", 0.45],
    ["np", 0.9],
  ]) {
    const start = i * step + offset;
    css += `    @keyframes k${i}${part} { 0%, ${pct(start)}% { opacity: 0; transform: translateY(6px); } ${pct(start + 0.35)}%, 88% { opacity: 1; transform: translateY(0); } 95%, 100% { opacity: 0; } }
    .k${i}${part} { animation: k${i}${part} ${PERIOD}s ease-out infinite; }\n`;
  }
});
const total = rows.length * step + 1;
css += `    @keyframes done { 0%, ${pct(total)}% { opacity: 0; } ${pct(total + 0.4)}%, 88% { opacity: 1; } 95%, 100% { opacity: 0; } }
    .done { animation: done ${PERIOD}s ease-out infinite; }
    @media (prefers-reduced-motion: reduce) { .r { animation: none !important; opacity: 1; } }
`;
let rowsSvg = "";
rows.forEach((row, i) => {
  const y = 150 + i * 62;
  rowsSvg += `
  <g>
    <rect x="24" y="${y - 36}" width="852" height="52" rx="12" fill="#FFFFFF" stroke="#E2E8E4"/>
    <g class="r k${i}in"><text x="44" y="${y - 3}" font-size="22" fill="${C.ink}" font-weight="700">${row.input}</text>
    <text x="270" y="${y - 3}" font-size="16" fill="#6B7A8C">${row.locale}</text></g>
    <g class="r k${i}pf"><text x="370" y="${y - 3}" font-size="22" fill="${C.red}" font-weight="700">${row.wrong}</text></g>
    <g class="r k${i}np"><text x="620" y="${y - 3}" font-size="22" fill="#1E9E5A" font-weight="700">1234567.89</text></g>
  </g>`;
});
const demo = svg(
  900,
  420,
  `
  <title>numberparrot demo: 1.234.567,89 in pt-BR, 1'234'567.89 in de-CH, 12,34,567.89 in en-IN and Arabic-Indic digits in ar-EG all parse to 1234567.89, while parseFloat returns 1.234, 1, 12 and NaN</title>
  <style>${css}  </style>
  <rect width="900" height="420" rx="22" fill="#F6FBF8"/>
  <g transform="translate(26 14) scale(0.17)">${pico().replace('id="pico"', "")}</g>
  <text class="t" x="100" y="50" font-size="24" font-weight="800" fill="${C.ink}">One number, four spellings</text>
  <text class="t" x="100" y="76" font-size="15" fill="#4A5A6C">The same value written in pt-BR, de-CH, en-IN and ar-EG</text>
  <text class="t" x="44" y="106" font-size="14" font-weight="700" fill="#6B7A8C">INPUT</text>
  <text class="t" x="370" y="106" font-size="14" font-weight="700" fill="${C.red}">parseFloat(input)</text>
  <text class="t" x="620" y="106" font-size="14" font-weight="700" fill="#1E9E5A">parse(input, locale)</text>
  ${rowsSvg}
  <g class="r done"><rect x="24" y="372" width="852" height="34" rx="10" fill="${C.green}" opacity="0.15"/>
  <text class="t" x="450" y="395" font-size="16" font-weight="700" text-anchor="middle" fill="${C.ink}">Every spelling becomes the same JavaScript number: 1234567.89</text></g>`,
  ' role="img" aria-label="Animated comparison of parseFloat and numberparrot"',
);
write("assets/demo.svg", demo);

// Travel line art, light and dark ----------------------------------------------------
// The docs site inlines the same drawings with CSS custom properties; these files carry
// fixed colors for the README and anything outside the site.
const ART_ICONS = ["globe", "coins", "digits", "parens", "detect", "shield", "input", "plane", "ticket", "stamp", "postcard", "compass"];
for (const [mode, palette] of [["light", LIGHT], ["dark", DARK]]) {
  for (const name of ART_ICONS) write(`assets/art/${mode}/icon-${name}.svg`, iconFile(name, palette));
  write(`assets/art/${mode}/globe.svg`, standalone(globe(palette, { id: "globe", size: 360 })));
  write(`assets/art/${mode}/postcard.svg`, standalone(postcard(palette, { id: "card", number: "1.234,56", place: "SÃO PAULO", stampKey: "brl" })));
  for (const key of Object.keys(STAMPS)) write(`assets/art/${mode}/stamp-${key}.svg`, standalone(stamp(key, palette, { id: key, size: 120 })));
}

// Social preview pages (screenshotted with a headless browser) ---------------------
function socialPage(w, h) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
  body { font-family: ${SANS}; background: #F6FBF8; color: ${C.ink}; display: flex; align-items: center; }
  .wrap { display: flex; align-items: center; gap: 48px; padding: 0 80px; }
  .pico { width: ${Math.round(h * 0.62)}px; height: ${Math.round(h * 0.62)}px; flex: none; }
  h1 { font-size: ${Math.round(w / 13)}px; margin: 0; letter-spacing: -3px; font-weight: 800; }
  h1 span { color: ${C.green}; }
  p { font-size: ${Math.round(w / 40)}px; margin: 12px 0 32px; color: #4A5A6C; max-width: 760px; line-height: 1.3; }
  code { font-family: ${MONO}; font-size: ${Math.round(w / 48)}px; display: block; background: #fff; border: 2px solid #DCE7E0; border-radius: 16px; padding: 18px 24px; line-height: 1.6; }
  .bad { color: ${C.red}; font-weight: 700; } .good { color: #1E9E5A; font-weight: 700; }
  .blob { position: absolute; border-radius: 50%; }
</style></head><body>
<div class="blob" style="width:420px;height:420px;right:-120px;top:-160px;background:${C.green};opacity:.12"></div>
<div class="blob" style="width:300px;height:300px;left:-100px;bottom:-140px;background:${C.yellow};opacity:.18"></div>
<div class="wrap">
  <svg class="pico" viewBox="0 0 400 400">${pico()}</svg>
  <div>
    <h1>number<span>parrot</span></h1>
    <p>Parse localized numbers and currency strings in JavaScript. Any locale, zero dependencies.</p>
    <code>parseFloat("1.234,56") <span class="bad">// 1.234</span><br>parse("1.234,56", "pt-BR") <span class="good">// 1234.56</span></code>
  </div>
</div>
</body></html>
`;
}
write(".cache/social-preview.html", socialPage(1280, 640));
write(".cache/og.html", socialPage(1200, 630));
