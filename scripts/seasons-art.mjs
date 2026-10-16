// Draws the seasonal art: Pico in a costume for each special date, three seasonal icons
// in the line style of scripts/art.mjs, and a hero garland built from those icons. Every
// drawing comes in a light and a dark variant.
//
//   node scripts/seasons-art.mjs
//
// Outputs assets/seasons/<id>/{pico,hero,icon-*}-{light,dark}.svg, copies them to
// docs/assets/seasons/, and writes a minified docs/seasons.js from assets/seasons/seasons.js.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { PICO_COLORS, pico } from "./pico.mjs";

// Palettes: `ink` draws lines, the rest fill costume parts. Dark variants are lighter so
// every prop keeps its contrast on the dark site.
const BASE = {
  light: { ink: "#1D2B3A", snow: "#DCE8F2", white: "#FFFFFF", gold: "#E9B949" },
  dark: { ink: "#E4EEF5", snow: "#F3F6F8", white: "#F3F6F8", gold: "#FFD25E" },
};
const SEASON = {
  halloween: {
    light: { a: "#E8833A", b: "#4B3A78", c: "#3E7B3A", d: "#2A1A0E" },
    dark: { a: "#F09A50", b: "#8A72CC", c: "#5BAF55", d: "#2A1A0E" },
  },
  christmas: {
    light: { a: "#D9443F", b: "#2F8F5B", c: "#E9B949", d: "#FFFFFF" },
    dark: { a: "#F06A63", b: "#4CC48A", c: "#FFD25E", d: "#F3F6F8" },
  },
  newyear: {
    light: { a: "#E9B949", b: "#7A62B8", c: "#3E7BD6", d: "#E46FA0" },
    dark: { a: "#FFD25E", b: "#A993E6", c: "#7FB0FF", d: "#F08DB8" },
  },
  carnival: {
    light: { a: "#C7428A", b: "#2BA6A0", c: "#E9B949", d: "#7A62B8" },
    dark: { a: "#EE76B4", b: "#5DD6CF", c: "#FFD25E", d: "#A993E6" },
  },
  valentine: {
    light: { a: "#E04E6E", b: "#F6B8C8", c: "#B8324F", d: "#FFFFFF" },
    dark: { a: "#FF7A95", b: "#F7A9BE", c: "#FF9DB0", d: "#F3F6F8" },
  },
  easter: {
    light: { a: "#F4B6C9", b: "#9EDDC2", c: "#F2D46B", d: "#C9894A" },
    dark: { a: "#F7C2D3", b: "#A9E8CC", c: "#F7E08A", d: "#D9A066" },
  },
  junina: {
    light: { a: "#E7C66B", b: "#D9443F", c: "#F08A2E", d: "#8A5A33" },
    dark: { a: "#F0D488", b: "#F06A63", c: "#FFA552", d: "#B07A4C" },
  },
};

// Icons ---------------------------------------------------------------------------------
// 24 x 24, stroke 1.75, round caps, one translucent accent fill: the family of art.mjs.
const f = (c, o = 0.35) => `fill="${c}" fill-opacity="${o}"`;
const ICONS = {
  halloween: {
    pumpkin: (p) => `<path d="M12 7c-4.5 0-8 2.6-8 6.5S7.5 20 12 20s8-2.6 8-6.5S16.5 7 12 7Z" ${f(p.a)}/><path d="M12 7c-1.8 0-3 2.9-3 6.5S10.2 20 12 20M12 7c1.8 0 3 2.9 3 6.5S13.8 20 12 20M12 7c0-1.6.6-2.8 2-3.5"/>`,
    bat: (p) => `<path d="M12 9.6c-1 0-1.6-.9-1.6-.9l-.9 1.4C7.6 8.7 5 8.9 2.5 10.6c2 .4 3 1.6 3.2 3.2 1.4-1 3-1 4 .3.6-.6 1.4-.9 2.3-.9s1.7.3 2.3.9c1-1.3 2.6-1.3 4-.3.2-1.6 1.2-2.8 3.2-3.2-2.5-1.7-5.1-1.9-7-.5l-.9-1.4s-.6.9-1.6.9Z" ${f(p.b)}/>`,
    "witch-hat": (p) => `<path d="M6.2 18 10.6 5.6c.4-1.2 2-1.5 3-.7L17 7.6l-2.2.4L17.8 18Z" ${f(p.b)}/><path d="M3 18.5c3 1.3 15 1.3 18 0"/><path d="M7.6 14.6h9" stroke="${p.a}" stroke-width="2"/>`,
  },
  christmas: {
    snowflake: () => `<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>`,
    gift: (p) => `<rect x="4" y="10" width="16" height="10" rx="1.5" ${f(p.a)}/><rect x="3" y="7" width="18" height="3.5" rx="1"/><path d="M12 7v13M12 7c-1.5-3-5-2.7-4.2-.7.5 1 4.2.7 4.2.7Zm0 0c1.5-3 5-2.7 4.2-.7-.5 1-4.2.7-4.2.7Z"/>`,
    tree: (p) => `<path d="M12 3 6.5 10h3l-4 5.5h4L5 20h14l-4.5-4.5h4L14.5 10h3Z" ${f(p.b)}/><path d="M12 20v1.5"/>`,
  },
  newyear: {
    firework: (p) => `<circle cx="12" cy="11" r="1.8" fill="${p.a}"/><path d="M12 3.5v3M12 15.5v5M4.5 11h3M16.5 11h3M6.7 5.7l2.1 2.1M15.2 14.2l2.1 2.1M6.7 16.3l2.1-2.1M15.2 7.8l2.1-2.1"/>`,
    sparkle: (p) => `<path d="M12 3.5 13.9 10l6.6 2-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2Z" ${f(p.a)}/>`,
    "party-hat": (p) => `<path d="M12 4.5 5.5 20h13Z" ${f(p.b)}/><path d="M8.3 13.2 14.6 11M7 16.8l9.8-3.3" stroke="${p.a}" stroke-width="2"/><circle cx="12" cy="3.6" r="1.4" fill="${p.d}"/>`,
  },
  carnival: {
    mask: (p) => `<path d="M3 9.5c2.5-1.5 6-1.5 9 0 3-1.5 6.5-1.5 9 0 0 4-2.4 6.5-5 6.5-1.8 0-2.8-1.4-4-1.4s-2.2 1.4-4 1.4c-2.6 0-5-2.5-5-6.5Z" ${f(p.a)}/><ellipse cx="8" cy="11.6" rx="1.8" ry="1.2"/><ellipse cx="16" cy="11.6" rx="1.8" ry="1.2"/>`,
    popper: (p) => `<path d="M4 20 8 9l7 7Z" ${f(p.c)}/><path d="M13 5.5v.01M18.5 7v.01M16 3.5l.5 1.5M19 11l1.5.5M11 8.5c.5-1.5 2-2 3-1.5M15.5 13c1.5-.5 3 0 3.5 1"/>`,
    streamer: (p) => `<path d="M3 5c4 0 4 4 8 4s4-4 8-4" stroke="${p.a}"/><path d="M5 12c3 0 3 3 6 3s3-3 6-3" stroke="${p.b}"/><path d="M7 19c2 0 2-2 4-2s2 2 4 2"/>`,
  },
  valentine: {
    heart: (p) => `<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.4c0 5.4-7.5 10-7.5 10Z" ${f(p.a)}/>`,
    letter: (p) => `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/><path d="M12 17.4s-2.3-1.3-2.3-2.8a1.2 1.2 0 0 1 2.3-.6 1.2 1.2 0 0 1 2.3.6c0 1.5-2.3 2.8-2.3 2.8Z" fill="${p.a}" stroke="none"/>`,
    balloon: (p) => `<path d="M12 3c-3.3 0-5.5 2.6-5.5 5.7 0 3.6 3 6.8 5.5 6.8s5.5-3.2 5.5-6.8C17.5 5.6 15.3 3 12 3Z" ${f(p.a)}/><path d="M11 15.5h2l-.4 1.3h-1.2ZM12 16.8c0 2-2 2.4-1 4.7"/>`,
  },
  easter: {
    egg: (p) => `<path d="M12 3c-3.5 0-6 5.5-6 10a6 6 0 0 0 12 0c0-4.5-2.5-10-6-10Z" ${f(p.a, 0.5)}/><path d="M6.4 11.5 9 10l3 2 3-2 2.6 1.5" stroke="${p.c}" stroke-width="2"/>`,
    basket: (p) => `<path d="M3.5 11h17l-2 9h-13Z" ${f(p.d)}/><path d="M6.5 11a5.5 5.5 0 0 1 11 0M5 14.5h14M12 11v9M8 11l.8 9M16 11l-.8 9"/>`,
    flower: (p) => `<circle cx="12" cy="5.8" r="2.3" ${f(p.a, 0.5)}/><circle cx="15.2" cy="8.2" r="2.3" ${f(p.a, 0.5)}/><circle cx="14" cy="11.8" r="2.3" ${f(p.a, 0.5)}/><circle cx="10" cy="11.8" r="2.3" ${f(p.a, 0.5)}/><circle cx="8.8" cy="8.2" r="2.3" ${f(p.a, 0.5)}/><circle cx="12" cy="9.2" r="1.5" fill="${p.c}" stroke="none"/><path d="M12 14.2v6.8M12 18.2c-1.5-1.5-3.5-1.5-4.5-1"/>`,
  },
  junina: {
    bonfire: (p) => `<path d="M12 3.5c1 3 4.5 4.6 4.5 8.5a4.5 4.5 0 0 1-9 0c0-2 1-3 2-4 0 1.5.8 2.4 1.6 2.6C10.6 8.6 11 6 12 3.5Z" ${f(p.c, 0.45)}/><path d="M4 20.5 20 16.5M4 16.5l16 4"/>`,
    flags: (p) => `<path d="M2.5 5.5c6 3 13 3 19 0"/><path d="M5 6.8 6.5 12 8.5 7.6Z" ${f(p.b)}/><path d="M10.5 8.1l1.5 5 1.5-5Z" ${f(p.a, 0.6)}/><path d="M15.5 7.6l2 4.4 1.2-5Z" ${f(p.c)}/>`,
    "straw-hat": (p) => `<ellipse cx="12" cy="15.5" rx="9.5" ry="3" ${f(p.a, 0.5)}/><path d="M7.5 14.5c0-4 1.8-7 4.5-7s4.5 3 4.5 7" ${f(p.a, 0.5)}/><path d="M7.7 12.8c2.8.9 5.8.9 8.6 0" stroke="${p.b}" stroke-width="2"/>`,
  },
};

// Costumes ------------------------------------------------------------------------------
// Pico lives in a 400 x 400 box; costumes may reach above and around it, so the files use
// a wider view box. `back` is drawn behind Pico, `front` over it.
const COSTUMES = {
  halloween: (p) => ({
    back: `<g fill="${p.b}" opacity=".8"><path d="M40 40c-6 0-9-5-9-5l-5 8c-12-8-27-7-41 3 11 2 17 9 18 18 8-6 17-6 23 2 3-3 8-5 13-5s10 2 13 5c6-8 15-8 23-2 1-9 7-16 18-18-14-10-29-11-41-3l-5-8s-3 5-9 5Z" transform="translate(30 -20) scale(.7)"/></g>`,
    front: `<g transform="rotate(10 214 78)"><path d="M160 76 Q 196 30 214 -26 Q 222 -50 244 -46 Q 252 -44 250 -36 Q 232 -30 236 0 Q 244 40 268 76 Z" fill="${p.b}"/><ellipse cx="214" cy="80" rx="92" ry="17" fill="${p.b}"/><path d="M168 54 L260 54 L266 72 Q 214 80 162 72 Z" fill="${p.a}"/></g>
  <g transform="translate(318 340)"><ellipse cx="-24" cy="0" rx="30" ry="40" fill="${p.a}"/><ellipse cx="24" cy="0" rx="30" ry="40" fill="${p.a}"/><ellipse cx="0" cy="0" rx="30" ry="42" fill="${p.a}"/><path d="M0 -40 C0 -52 6 -60 16 -64" fill="none" stroke="${p.c}" stroke-width="8" stroke-linecap="round"/><path d="M-26 -10 L-14 -22 L-4 -8 Z M26 -10 L14 -22 L4 -8 Z" fill="${p.d}"/><path d="M-30 10 L-20 22 L-10 12 L0 24 L10 12 L20 22 L30 10 Q 0 34 -30 10 Z" fill="${p.d}"/></g>`,
  }),
  christmas: (p, q) => ({
    back: `<ellipse cx="200" cy="392" rx="190" ry="20" fill="${q.snow}"/><g fill="${q.snow}"><circle cx="40" cy="60" r="7"/><circle cx="90" cy="150" r="5"/><circle cx="380" cy="250" r="6"/><circle cx="60" cy="260" r="4"/><circle cx="400" cy="90" r="5"/></g>`,
    front: `<g transform="rotate(8 214 80)"><path d="M150 84 Q 176 -6 270 -6 Q 330 0 344 56 Q 300 42 290 84 Z" fill="${p.a}"/><rect x="142" y="64" width="156" height="30" rx="15" fill="${p.d}"/><circle cx="344" cy="60" r="18" fill="${p.d}"/></g>
  <path d="M136 206 Q 214 240 296 200 L 302 228 Q 214 268 134 234 Z" fill="${p.a}"/><path d="M168 220 l10 30 M206 228 l6 34 M246 224 l2 32" stroke="${p.d}" stroke-width="9" opacity=".9"/><path d="M252 226 L 284 228 L 286 312 L 258 312 Z" fill="${p.a}"/><path d="M256 260 h28 M256 286 h30" stroke="${p.d}" stroke-width="8"/><path d="M258 312 v14 M268 312 v14 M278 312 v14" stroke="${p.a}" stroke-width="5" stroke-linecap="round"/>`,
  }),
  newyear: (p) => ({
    back: [[60, 40, p.a], [384, 10, p.b], [380, 250, p.c]]
      .map(
        ([x, y, c]) =>
          `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315]
            .map((d) => `<path d="M0 -18 V -42" transform="rotate(${d})"/>`)
            .join("")}<circle r="6" fill="${c}" stroke="none"/></g>`,
      )
      .join(""),
    front: `<g transform="rotate(14 214 70)"><path d="M170 76 L 214 -40 L 258 76 Z" fill="${p.b}"/><path d="M186 34 L 248 50 M 176 60 L 254 76 M 198 4 L 236 14" stroke="${p.a}" stroke-width="10"/><circle cx="214" cy="-44" r="14" fill="${p.d}"/><path d="M168 76 Q 214 92 260 76" fill="none" stroke="${p.a}" stroke-width="8" stroke-linecap="round"/></g>`,
  }),
  carnival: (p) => ({
    back: [[50, 30, p.a, 20], [110, 90, p.b, -30], [380, 30, p.c, 40], [400, 200, p.d, -10], [40, 220, p.c, 60], [330, 110, p.a, -50], [70, 330, p.b, 15]]
      .map(([x, y, c, r]) => `<rect x="${x}" y="${y}" width="22" height="9" rx="2" fill="${c}" transform="rotate(${r} ${x + 11} ${y + 4})"/>`)
      .join("") + `<path d="M-10 160 C 30 120 60 200 100 160 S 150 120 170 170" fill="none" stroke="${p.b}" stroke-width="7" stroke-linecap="round"/>`,
    front: `<path fill-rule="evenodd" d="M188 126 Q 200 92 246 102 Q 292 92 312 120 Q 306 166 256 158 Q 244 156 232 162 Q 194 172 188 126 Z M250 108 a24 22 0 1 0 0.1 0 Z" fill="${p.a}"/><path d="M196 140 Q 216 150 232 162" fill="none" stroke="${p.c}" stroke-width="5" stroke-linecap="round"/><g transform="translate(190 118)"><path d="M0 0 C -20 -30 -14 -70 6 -90 C 8 -60 10 -30 0 0 Z" fill="${p.b}"/><path d="M0 0 C -34 -16 -52 -50 -46 -76 C -26 -56 -12 -30 0 0 Z" fill="${p.c}"/><path d="M0 0 C 6 -32 26 -60 44 -66 C 30 -40 16 -18 0 0 Z" fill="${p.d}"/><circle r="8" fill="${p.c}"/></g>`,
  }),
  valentine: (p, q) => ({
    back: `<path d="M118 268 C 90 220 140 160 96 96" fill="none" stroke="${q.ink}" stroke-width="3" opacity=".7"/><path d="M96 98 C 96 98 30 62 30 12 A 36 36 0 0 1 96 -8 A 36 36 0 0 1 162 12 C 162 62 96 98 96 98 Z" fill="${p.a}"/><path d="M60 0 C 54 10 54 22 60 32" fill="none" stroke="${p.d}" stroke-width="7" stroke-linecap="round" opacity=".7"/><path d="M90 98 h12 l-3 9 h-6 Z" fill="${p.c}"/>
  <g fill="${p.b}"><path d="M360 60 c0 0 -18 -10 -18 -22 a9 9 0 0 1 18 -4 a9 9 0 0 1 18 4 c0 12 -18 22 -18 22 Z"/><path d="M392 170 c0 0 -12 -7 -12 -15 a6 6 0 0 1 12 -3 a6 6 0 0 1 12 3 c0 8 -12 15 -12 15 Z"/></g>`,
    front: "",
  }),
  easter: (p) => ({
    back: `<path d="M20 394 q 12 -30 20 0 q 10 -26 18 0 q 12 -32 22 0 Z M330 394 q 12 -30 20 0 q 10 -26 18 0 q 12 -32 22 0 Z" fill="${p.b}"/>`,
    front: `<g transform="translate(318 330)"><path d="M-62 -40 A 62 70 0 0 1 62 -40" fill="none" stroke="${p.d}" stroke-width="9" stroke-linecap="round"/><ellipse cx="-30" cy="-18" rx="18" ry="24" fill="${p.a}"/><ellipse cx="2" cy="-26" rx="18" ry="25" fill="${p.c}"/><ellipse cx="32" cy="-16" rx="17" ry="23" fill="${p.b}"/><path d="M-12 -30 l6 -5 6 5 6 -5 6 5" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" opacity=".8"/><path d="M-70 -14 H 70 L 56 56 H -56 Z" fill="${p.d}"/><path d="M-64 8 H 64 M-60 32 H 60 M-30 -14 L -26 56 M0 -14 V 56 M30 -14 L 26 56" stroke="#000" stroke-opacity=".18" stroke-width="5"/></g>`,
  }),
  junina: (p, q) => ({
    back: `<path d="M-30 -40 Q 200 20 430 -40" fill="none" stroke="${q.ink}" stroke-width="3" opacity=".6"/>${[[0, p.b], [1, p.a], [2, p.c], [3, p.b], [4, p.a], [5, p.c], [6, p.b]]
      .map(([i, c]) => {
        const x = -10 + i * 66;
        const y = -36 + Math.sin((i / 6) * Math.PI) * 30;
        return `<path d="M${x} ${y} L ${x + 40} ${y + 2} L ${x + 20} ${y + 40} Z" fill="${c}"/>`;
      })
      .join("")}
  <g transform="translate(60 360)"><path d="M-40 30 L 40 6 M -40 6 L 40 30" stroke="${p.d}" stroke-width="12" stroke-linecap="round"/><path d="M0 -70 C 14 -40 40 -26 34 4 C 30 20 -30 20 -34 4 C -38 -14 -20 -24 -16 -36 C -10 -24 -6 -18 0 -16 C -6 -34 -6 -50 0 -70 Z" fill="${p.c}"/><path d="M0 -34 C 8 -18 18 -10 14 4 C 10 12 -10 12 -14 4 C -16 -6 -6 -12 0 -34 Z" fill="${q.gold}"/></g>`,
    front: `<g transform="rotate(6 214 76)"><ellipse cx="214" cy="80" rx="112" ry="22" fill="${p.a}"/><path d="M160 80 Q 162 12 214 10 Q 266 12 268 80 Z" fill="${p.a}"/><path d="M162 62 Q 214 74 266 62 L 268 78 Q 214 90 160 78 Z" fill="${p.b}"/><path d="M110 82 Q 214 112 318 82" fill="none" stroke="${p.d}" stroke-width="3" opacity=".5"/><rect x="226" y="26" width="18" height="16" rx="2" fill="${p.c}" transform="rotate(12 235 34)"/><path d="M190 30 l14 4 M196 44 l12 2" stroke="${p.d}" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>`,
  }),
};

const svg = (vb, w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}"${title ? ` role="img" aria-label="${title}"><title>${title}</title>` : ' aria-hidden="true">'}${body}\n</svg>\n`;

const iconSvg = (draw, p, size = 48) =>
  svg("0 0 24 24", size, size, `<g fill="none" stroke="${p.ink}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${draw(p)}</g>`);

const NAMES = {
  halloween: "a witch hat and a carved pumpkin",
  christmas: "a Santa hat, a striped scarf and snow",
  newyear: "a party hat and fireworks",
  carnival: "a feathered carnival mask and confetti",
  valentine: "a heart balloon",
  easter: "a basket of painted eggs",
  junina: "a straw hat, paper flags and a bonfire",
};

/** A garland across the hero: a sagging string with the season's icons hanging from it. */
function garland(id, p) {
  const icons = Object.values(ICONS[id]);
  const W = 1200;
  const n = 11;
  const sag = (x) => 14 + Math.sin((x / W) * Math.PI) * 38;
  let body = `<path d="M0 14 Q ${W / 2} ${14 + 76} ${W} 14" fill="none" stroke="${p.ink}" stroke-opacity=".35" stroke-width="1.5"/>`;
  for (let i = 0; i < n; i++) {
    const x = 60 + i * ((W - 120) / (n - 1));
    const y = sag(x);
    const drop = 10 + (i % 3) * 8;
    const draw = icons[i % icons.length];
    body += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} v${drop}" stroke="${p.ink}" stroke-opacity=".35" stroke-width="1.5"/><g transform="translate(${(x - 18).toFixed(1)} ${(y + drop).toFixed(1)}) scale(1.5) rotate(${i % 2 ? 6 : -6} 12 12)" fill="none" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${draw(p)}</g>`;
  }
  return svg(`0 0 ${W} 120`, W, 120, body);
}

function write(path, content) {
  mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(path, content);
}

let files = 0;
for (const id of Object.keys(SEASON)) {
  for (const mode of ["light", "dark"]) {
    const p = { ...BASE[mode], ...SEASON[id][mode] };
    const q = BASE[mode];
    const c = COSTUMES[id](p, q);
    const out = {
      [`pico-${mode}.svg`]: svg("-30 -70 460 470", 460, 470, `${c.back}${pico(PICO_COLORS)}${c.front}`, `Pico the parrot with ${NAMES[id]}`),
      [`hero-${mode}.svg`]: garland(id, p),
    };
    for (const [name, draw] of Object.entries(ICONS[id])) out[`icon-${name}-${mode}.svg`] = iconSvg(draw, p);
    for (const [name, content] of Object.entries(out)) {
      write(`assets/seasons/${id}/${name}`, content);
      write(`docs/assets/seasons/${id}/${name}`, content);
      files++;
    }
  }
}
const script = readFileSync("assets/seasons/seasons.js", "utf8");
const min = transformSync(script, { minify: true, target: "es2017" }).code;
writeFileSync("docs/seasons.js", `/* numberparrot seasons: source in assets/seasons/seasons.js */\n${min}`);
console.log(`wrote ${files} seasonal SVG files twice and docs/seasons.js (${min.length} bytes)`);
