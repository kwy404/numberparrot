// Pico the parrot, shared by the project art (scripts/build-assets.mjs) and the
// seasonal costumes (scripts/seasons-art.mjs).

export const PICO_COLORS = {
  green: "#2FBF71",
  red: "#F25C54",
  yellow: "#FFC83D",
  ink: "#1D2B3A",
  white: "#FFFFFF",
};

/** Pico the parrot, drawn in a 400 x 400 box. */
export function pico(C) {
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

