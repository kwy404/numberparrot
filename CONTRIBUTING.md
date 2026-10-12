# Contributing to numberparrot

Thanks for helping Pico learn more ways to write numbers.

## Setup

```sh
git clone https://github.com/kwy404/numberparrot.git
cd numberparrot
npm install
npm test
```

Node.js 18 or newer is required.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Builds `dist/` with tsup and copies the ESM bundle to `docs/numberparrot.js` for the playground. |
| `npm run typecheck` | Runs the TypeScript compiler without emitting. |
| `npm run lint` | Runs ESLint and checks that no file contains emoji or typographic dash characters. |
| `npm test` | Runs the Vitest suite once. |
| `npm run size` | Prints the minified, gzip and brotli size of the bundle. |
| `node scripts/build-assets.mjs` | Regenerates the SVG artwork in `assets/` and `docs/img/`. |

## How the parser works

1. `src/locale.ts` reads the decimal, group, minus, percent and exponent symbols
   of a locale from `Intl.NumberFormat#formatToParts()` and caches them.
2. `src/chars.ts` folds equivalent characters into one form: any digit script to
   ASCII, every space to a plain space, every minus look alike to `-`.
3. `src/core.ts` splits the string into prefix, number and suffix, validates the
   separators and grouping for the locale, and builds a canonical decimal string
   that is handed to `Number()`, so results are correctly rounded.

`parse` never guesses. Guessing belongs in `detect`.

## Adding a locale or a case

- Add hand written inputs to `MATRIX` in `test/locales.test.ts`.
- If the locale has a currency, add it to `CURRENCY` in `test/helpers.ts` so it
  joins the round trip tests.
- Every bug fix needs a test that fails without the fix.

## Project rules

- Zero runtime dependencies.
- No emoji and no typographic dash characters in any file. Write such characters
  as escapes in code, for example `"\u2212"` for the minus sign.
- Keep the public API documented with TSDoc examples.
- Keep commits small and focused, with messages in English.

## Releasing

1. Update `CHANGELOG.md` and the version in `package.json`.
2. `npm publish` runs `prepublishOnly`, which builds and tests the package.
