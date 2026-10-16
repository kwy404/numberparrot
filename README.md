<p align="right"><b>English</b> | <a href="https://github.com/kwy404/numberparrot/blob/main/i18n/README.pt-BR.md">Português (Brasil)</a></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner.svg" width="880" alt="numberparrot banner with Pico the parrot">
  </picture>
</p>

<h1 align="center">numberparrot</h1>

<p align="center">
  <b><code>parseFloat("1.234,56")</code> returns <code>1.234</code>. numberparrot returns <code>1234.56</code>.</b><br>
  Reads numbers and prices written in any locale back into JavaScript numbers, using the <code>Intl</code> data your runtime already has.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/v/numberparrot?color=2FBF71&label=npm" width="80" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/dm/numberparrot" alt="npm downloads per month"></a>
  <a href="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml"><img src="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml/badge.svg" width="92" alt="CI status"></a>
  <a href="https://github.com/kwy404/numberparrot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" width="78" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/numberparrot/"><b>Try it live: paste any number or column on the home page</b></a>
</p>

## Install

```sh
npm install numberparrot
```

Zero dependencies. ESM, CommonJS and TypeScript types. Node.js 18 and newer, Deno, Bun and modern browsers. About 6.9 kB gzipped for the whole library, 3.6 kB for `parse` alone.

## Quick start

```ts
import { parse, parseCurrency, parseColumn } from "numberparrot";

parse("1.234,56", "pt-BR");       // 1234.56
parse("1 234,56", "fr-FR");       // 1234.56 (any kind of space)
parse("1'234.56", "de-CH");       // 1234.56
parse("12,34,567.89", "en-IN");   // 1234567.89
parse("١٬٢٣٤٫٥٦", "ar-EG");       // 1234.56
parse("(1.234,56)", "de-DE");     // -1234.56
parse("1.234,56", "en-US");       // NaN: not an en-US number

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

parseColumn(["1,234", "12,5", "1.000,00"]).values;
// [1.234, 12.5, 1000]: "12,5" shows the comma is the decimal separator
```

`parse` never guesses. Input that does not fit the locale returns `NaN`, or throws a `NumberParseError` with a reason in `strict` mode.

## What it handles

- **Any locale** your runtime's `Intl` knows: separators, digits and symbols come from `Intl.NumberFormat`.
- **Prices** with symbols or ISO codes on either side, and exact integer cents with `toMinorUnits` (`"0,29"` is `29`, never `28.999999999999996`).
- **Any digits**: Arabic-Indic, Persian, Devanagari, Bengali, Thai, full width and every other Unicode digit.
- **Accounting negatives** in parentheses, a trailing minus and the Unicode minus sign.
- **Unknown formats**: `detect()` reads one value and flags real ambiguity like `"1,234"`; `parseColumn()` reads a whole column.
- **Form fields**: `normalizeInput()` cleans a field on every keystroke and keeps partial values like `"1.234,"` valid.

## API

| Function | What it does |
| --- | --- |
| `parse(input, locale?, options?)` | Reads a number. `NaN` when it is not a valid number in the locale. |
| `tryParse(input, locale?, options?)` | Like `parse`, but returns `{ ok, value, code, message }` and never throws. |
| `parseCurrency(input, locale?, options?)` | Amount, ISO code and symbol of a price. `toMinorUnits` gives integer cents. |
| `detect(input, candidates?)` | Works out the decimal separator of one unknown value, with a confidence and the other readings. |
| `parseColumn(values, candidates?)` | Reads a column in one unknown format. Clear cells decide for unclear ones; odd cells are listed in `invalid`. |
| `isValid(input, locale?, options?)` | `true` when `parse` would return a number. |
| `createParser(locale?, options?)` | The functions above bound to one locale, resolved once. |
| `normalizeInput(value, locale?, options?)` | Cleans what a user is typing and reports whether it is complete. |
| `getLocaleInfo(locale?)` | The decimal, group, minus and percent symbols and the digits of a locale. |

Options: `strict` (throw with a reason, exact separators only), `keepPercent` (`"15%"` is `15`), `looseGrouping` (accept groups anywhere). Every option and error code is in the [API reference](https://kwy404.github.io/numberparrot/api.html).

## Guides

- [Why parseFloat misreads comma decimals](https://kwy404.github.io/numberparrot/parsefloat-comma-decimal-separator.html)
- [Reading numbers back from Intl.NumberFormat](https://kwy404.github.io/numberparrot/parse-localized-number-javascript.html)
- [Currency strings and exact cents](https://kwy404.github.io/numberparrot/parse-currency-string-javascript.html)
- [Arabic, Persian and other digit scripts](https://kwy404.github.io/numberparrot/arabic-digits-to-number-javascript.html)

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](https://github.com/kwy404/numberparrot/blob/main/CONTRIBUTING.md) and the [CHANGELOG](https://github.com/kwy404/numberparrot/blob/main/CHANGELOG.md).

## More from kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): utility-first CSS with no build step
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): reactive HTML with no build step
- [breakhound](https://kwy404.github.io/breakhound/): finds bugs in JavaScript libraries automatically
- [vueleap](https://kwy404.github.io/vueleap/): moves Vue 2 code to Vue 3
- [graphemely](https://kwy404.github.io/graphemely/): truncates, slices and counts strings with emoji safely
- [edgegoat](https://kwy404.github.io/edgegoat/): edge case test inputs for dates, unicode and numbers
- [cookieowl](https://kwy404.github.io/cookieowl/): a cookie consent banner that blocks trackers until consent
- [installkite](https://kwy404.github.io/installkite/): makes a website installable and offline capable
- [a11ymedic](https://kwy404.github.io/a11ymedic/): an accessibility checker that explains each fix
- [fontsketch](https://kwy404.github.io/fontsketch/): turns your handwriting into a font in the browser
- [kastor](https://kwy404.github.io/kastor/): a TypeScript ORM for many databases

## Author

Made by Alexandre Kohler ([GitHub](https://github.com/kwy404), [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). The site is [built with Monsoon](https://kwy404.github.io/monsoon/) and its interactive parts are built with [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## License

[MIT](https://github.com/kwy404/numberparrot/blob/main/LICENSE) © 2026 Alexandre Kohler. Pico the parrot and the artwork in `assets/` are under the same license.
