<p align="right"><b>English</b> | <a href="https://github.com/kwy404/numberparrot/blob/main/i18n/README.pt-BR.md">Português (Brasil)</a></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner.svg" width="880" alt="numberparrot banner: Pico the parrot mascot next to the text parse localized numbers and currency strings in JavaScript, showing parseFloat('1.234,56') returning 1.234 and parse('1.234,56', 'pt-BR') returning 1234.56">
  </picture>
</p>

<h1 align="center">numberparrot: parse localized numbers and currency strings in JavaScript</h1>

<p align="center">
  <b><code>parseFloat("1.234,56")</code> returns <code>1.234</code>. numberparrot returns <code>1234.56</code>.</b><br>
  The missing parser for <code>Intl.NumberFormat</code>: turn numbers written in any locale back into real JavaScript numbers.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/v/numberparrot?color=2FBF71&label=npm" width="80" alt="numberparrot npm version"></a>
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/dm/numberparrot" alt="numberparrot npm downloads per month"></a>
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/dt/numberparrot" alt="numberparrot total npm downloads"></a>
  <a href="https://bundlephobia.com/package/numberparrot"><img src="https://img.shields.io/bundlephobia/minzip/numberparrot?label=minzip" width="96" alt="numberparrot bundle size minified and gzipped"></a>
  <a href="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml"><img src="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml/badge.svg" width="92" alt="numberparrot CI status for Node 18, 20 and 22"></a>
  <a href="https://github.com/kwy404/numberparrot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" width="78" alt="MIT license"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript&logoColor=white" width="112" alt="written in TypeScript with bundled type definitions"></a>
</p>

<table align="center">
  <tr>
    <td width="64"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-globe.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-globe.svg" width="40" alt="globe icon: parse numbers in any locale"></picture></td>
    <td><b>Any locale</b></td>
    <td>Separators, digits and symbols come from <code>Intl.NumberFormat</code>, so every locale your runtime knows works.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-coins.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-coins.svg" width="40" alt="coin stack icon: parse currency strings to numbers"></picture></td>
    <td><b>Currency</b></td>
    <td>Symbols and ISO codes before or after the amount: <code>R$ 1.234,56</code>, <code>1 234,56 €</code>, <code>CHF 1'234.50</code>.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-digits.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-digits.svg" width="40" alt="digit tiles icon: Arabic-Indic, Persian, Devanagari and Thai digits"></picture></td>
    <td><b>Any digits</b></td>
    <td>Arabic-Indic, Persian, Devanagari, Bengali, Thai, full width and every other Unicode digit.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-parens.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-parens.svg" width="40" alt="parentheses icon: accounting negative numbers"></picture></td>
    <td><b>Accounting negatives</b></td>
    <td><code>(1.234,56)</code>, trailing minus, the Unicode minus sign and its look alikes.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-detect.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-detect.svg" width="40" alt="magnifier icon: detect decimal separator and locale"></picture></td>
    <td><b>Detection</b></td>
    <td>Unknown locale? <code>detect()</code> finds the decimal separator and flags real ambiguity like <code>1,234</code>.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-shield.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-shield.svg" width="40" alt="shield icon: money safety with integer cents"></picture></td>
    <td><b>Money safety</b></td>
    <td><code>toMinorUnits</code> gives integer cents from the decimal digits: <code>"0,29"</code> is <code>29</code>, never <code>28.999999999999996</code>.</td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/dark/icon-input.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/art/light/icon-input.svg" width="40" alt="text field icon: validate number input fields while typing"></picture></td>
    <td><b>Form input</b></td>
    <td><code>normalizeInput()</code> cleans fields on every keystroke and keeps partial values like <code>1.234,</code> valid.</td>
  </tr>
</table>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/demo.svg" width="820" alt="Animated demo: parse localized number strings in JavaScript. 1.234.567,89 (pt-BR), 1'234'567.89 (de-CH), 12,34,567.89 (en-IN) and Arabic-Indic digits (ar-EG) all become 1234567.89 with numberparrot, while parseFloat returns 1.234, 1, 12 and NaN">
</p>

<p align="center">
  <a href="https://kwy404.github.io/numberparrot/"><b>Documentation, API reference and the live world board</b></a>
</p>

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [How do I convert a string with a comma to a number in JavaScript?](#how-do-i-convert-a-string-with-a-comma-to-a-number-in-javascript)
- [Why does parseFloat get comma decimals wrong?](#why-does-parsefloat-get-comma-decimals-wrong)
- [How do I parse a currency string to a number in JavaScript?](#how-do-i-parse-a-currency-string-to-a-number-in-javascript)
- [How do I parse money into integer cents?](#how-do-i-parse-money-into-integer-cents)
- [How do I parse Arabic, Persian or Devanagari digits?](#how-do-i-parse-arabic-persian-or-devanagari-digits)
- [How do I parse accounting negatives and percentages?](#how-do-i-parse-accounting-negatives-and-percentages)
- [How do I detect the decimal separator of a number string?](#how-do-i-detect-the-decimal-separator-of-a-number-string)
- [How do I validate a number input while the user types?](#how-do-i-validate-a-number-input-while-the-user-types)
- [API reference](#api-reference)
- [Supported locales](#supported-locales)
- [Comparison with parseFloat, numeral.js and @internationalized/number](#comparison-with-parsefloat-numeraljs-and-internationalizednumber)
- [Runtime support and bundle size](#runtime-support-and-bundle-size)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [More from kwy404](#more-from-kwy404)
- [Author](#author)
- [License](#license)

## Install

```sh
npm install numberparrot
```

```sh
pnpm add numberparrot    # pnpm
yarn add numberparrot    # yarn
bun add numberparrot     # Bun
```

Deno: `import { parse } from "npm:numberparrot";`

numberparrot has zero runtime dependencies, ships ESM and CommonJS builds with TypeScript definitions, and is tree-shakeable (`sideEffects: false`).

## Quick start

```ts
import { parse, parseCurrency, detect } from "numberparrot";

parse("1.234,56", "pt-BR");        // 1234.56
parse("1 234,56", "fr-FR");        // 1234.56 (normal, no-break or narrow no-break space)
parse("1'234.56", "de-CH");        // 1234.56
parse("12,34,567.89", "en-IN");    // 1234567.89
parse("١٬٢٣٤٫٥٦", "ar-EG");        // 1234.56
parse("(1.234,56)", "de-DE");      // -1234.56
parse("15%", "en-US");             // 0.15

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

detect("1,234");
// { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234], ... }
```

CommonJS works too: `const { parse } = require("numberparrot");`

## How do I convert a string with a comma to a number in JavaScript?

Tell numberparrot which locale the string was written in. It reads the decimal and group separators from `Intl.NumberFormat` for that locale and converts the string to a number:

```ts
import { parse } from "numberparrot";

parse("1,5", "de-DE");          // 1.5
parse("1.234,56", "pt-BR");     // 1234.56
parse("1,234.56", "en-US");     // 1234.56
parse("1.234,56", "en-US");     // NaN: not a valid en-US number
```

The common workaround `Number(value.replace(",", "."))` breaks as soon as a thousands separator appears (`"1.234,56"` becomes `NaN`) and silently corrupts English input (`"1,234"` becomes `1.234`). numberparrot never guesses: when the string does not fit the locale you get `NaN` (or an error in `strict` mode). If you do not know the locale, use [`detect()`](#detectinput-candidates).

## Why does parseFloat get comma decimals wrong?

`parseFloat` and `Number` only understand one format: `.` as the decimal separator and no grouping. `parseFloat` also stops at the first character it does not understand, so it returns a wrong number instead of failing:

| Input | Locale | `parseFloat` | `Number` | numberparrot |
| --- | --- | --- | --- | --- |
| `1.234,56` | pt-BR | `1.234` | `NaN` | `1234.56` |
| `1'234.56` | de-CH | `1` | `NaN` | `1234.56` |
| `12,34,567.89` | en-IN | `12` | `NaN` | `1234567.89` |
| `1 234,56` | fr-FR | `1` | `NaN` | `1234.56` |
| `١٢٣٫٤٥` | ar-EG | `NaN` | `NaN` | `123.45` |
| `R$ 10,00` | pt-BR | `NaN` | `NaN` | `10` |
| `(1,234.56)` | en-US | `NaN` | `NaN` | `-1234.56` |

## How do I parse a currency string to a number in JavaScript?

Use `parseCurrency` to get the amount and the ISO 4217 code. The currency can be a symbol, an ISO code or a local abbreviation, before or after the number, with or without spaces. Symbols are resolved through `Intl` for the locale, so `$` is CAD in `en-CA`, MXN in `es-MX` and USD in `en-US`.

```ts
import { parseCurrency } from "numberparrot";

parseCurrency("R$ 1.234,56", "pt-BR");   // { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }
parseCurrency("1.234,56 €", "de-DE");    // { amount: 1234.56, currency: "EUR", ... }
parseCurrency("CHF 1'234.50", "de-CH");  // { amount: 1234.5,  currency: "CHF", ... }
parseCurrency("₹12,34,567.89", "en-IN"); // { amount: 1234567.89, currency: "INR", ... }
parseCurrency("$1,234.56", "en-CA");     // { amount: 1234.56, currency: "CAD", ... }
parseCurrency("12,50", "pt-BR", { currency: "BRL" }); // fallback currency when none is written
```

If you only need the number, `parse()` accepts currency text too: `parse("R$ 1.234,56", "pt-BR")` is `1234.56`.

## How do I parse money into integer cents?

Floating point multiplication is not safe for money: `0.29 * 100` is `28.999999999999996` and `19.99 * 100` is `1998.9999999999998`. With `toMinorUnits: true` numberparrot shifts the decimal digits as text, so the result is always the exact integer:

```ts
parseCurrency("0,29", "pt-BR", { toMinorUnits: true }).amount;      // 29
parseCurrency("R$ 19,99", "pt-BR", { toMinorUnits: true }).amount;  // 1999
parseCurrency("¥1,235", "ja-JP", { toMinorUnits: true }).amount;    // 1235 (JPY has no minor unit)
parseCurrency("BHD 1.234", "en-US", { toMinorUnits: true }).amount; // 1234 (BHD has 3)
```

The number of minor unit digits comes from `Intl` for the detected currency (or the `currency` option, or 2 when unknown). Extra digits are rounded half away from zero; in `strict` mode they throw `PRECISION_LOSS` instead. Amounts beyond `Number.MAX_SAFE_INTEGER` minor units return `NaN`.

## How do I parse Arabic, Persian or Devanagari digits?

Every Unicode decimal digit is converted, whatever the locale: Arabic-Indic (`٠١٢٣٤٥٦٧٨٩`), Persian (`۰۱۲۳۴۵۶۷۸۹`), Devanagari (`०१२३४५६७८९`), Bengali, Thai, full width (`０１２３`) and the rest. The Arabic decimal separator `٫` and thousands separator `٬` are understood, and invisible bidi marks that `Intl` inserts are ignored.

```ts
parse("١٬٢٣٤٫٥٦", "ar-EG");     // 1234.56
parse("۱۲۳٫۴۵", "fa-IR");        // 123.45
parse("१२,३४,५६७.८९", "hi-IN");  // 1234567.89
parse("๑,๒๓๔.๕", "th-TH");      // 1234.5
parse("１２３４．５", "ja-JP");   // 1234.5
```

## How do I parse accounting negatives and percentages?

```ts
parse("(1.234,56)", "pt-BR");    // -1234.56
parse("($1,234.56)", "en-US");   // -1234.56
parse("1.234,56-", "de-DE");     // -1234.56 (trailing minus)
parse("−1 234,56", "sv-SE");    // -1234.56 (U+2212 minus sign, as Intl prints it)
parse("+42", "en-US");           // 42
parse("15%", "en-US");           // 0.15
parse("%15", "tr-TR");           // 0.15
parse("15%", "en-US", { keepPercent: true }); // 15
parse("5‰", "en-US");            // 0.005
parse("1,5E3", "de-DE");         // 1500
```

All minus look alikes (hyphen, U+2212 minus sign, figure dash, the typographic dashes, small and full width hyphen minus) are read as a minus sign.

## How do I detect the decimal separator of a number string?

When the locale is unknown (CSV imports, scraped prices, pasted spreadsheet cells) use `detect`. It reads the structure of the string, returns the most likely value and the candidate locales that agree, and is honest about real ambiguity:

```ts
import { detect } from "numberparrot";

detect("1.234,56");
// { value: 1234.56, decimal: ",", group: ".", ambiguous: false, confidence: 0.95,
//   reason: 'Both "." and "," appear; the last one, ",", is the decimal separator',
//   locales: ["pt-BR", "es-ES", "de-DE", ...], alternatives: [1234.56] }

detect("1,234");
// { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234],
//   reason: '"," followed by exactly 3 digits can be a thousands or a decimal separator; en-US reads it as thousands', ... }

detect("1,234", ["pt-BR", "en-US"]).value; // 1.234: your candidate order breaks the tie
detect("1'234.56").locales[0];             // "de-CH"
detect("١٢٣").locales[0];                  // "ar-EG"
```

## How do I validate a number input while the user types?

`normalizeInput` is built for `input` events. It converts any digits to ASCII, drops letters and symbols, keeps one decimal separator and tells you whether the text is still on its way to a valid number:

```ts
import { normalizeInput } from "numberparrot";

normalizeInput("1.234,", "pt-BR");
// { text: "1.234,", value: 1234, valid: true, complete: false }

normalizeInput("R$ 1.234,567", "pt-BR", { maxFractionDigits: 2 });
// { text: "1.234,56", value: 1234.56, valid: true, complete: true }

normalizeInput("1,2,3", "en-US").valid; // false
```

```ts
const field = document.querySelector("input")!;
field.addEventListener("input", () => {
  const state = normalizeInput(field.value, "pt-BR", { maxFractionDigits: 2 });
  field.value = state.text;
  field.setCustomValidity(state.valid ? "" : "Invalid number");
});
```

## API reference

All functions take an optional `locale`: a BCP 47 tag (`"pt-BR"`), a list of tags, or nothing for the runtime default. Locale data is read from `Intl.NumberFormat#formatToParts()` once and cached.

### `parse(input, locale?, options?)`

Returns a `number`, or `NaN` when `input` is not a valid number for the locale. Numbers are returned unchanged.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `strict` | `boolean` | `false` | Throw `NumberParseError` instead of returning `NaN`. Only the exact separators of the locale and recognized currencies are accepted, and a decimal separator needs digits on both sides. |
| `keepPercent` | `boolean` | `false` | Return `15` for `"15%"` instead of `0.15`. |
| `looseGrouping` | `boolean` | `false` | Accept group separators anywhere (`"1,23,4"`). By default they must sit where thousands (or Indian lakh and crore) groups go. |

What the default (lenient) mode accepts besides the locale's own format: any whitespace (including U+00A0 and U+202F) or apostrophe as a group separator, the other one of `.` and `,` as a group separator, a leading (`.5`) or trailing (`5.`) decimal separator, signs and currency on either side, exponents (`E`, `e`, `×10^`), `∞`, and digits in any script.

### `parseCurrency(input, locale?, options?)`

Returns `{ amount, currency, symbol, fractionDigits }`:

- `amount`: the number, or integer minor units with `toMinorUnits`. `NaN` when invalid.
- `currency`: ISO 4217 code, or `null` when none was found or recognized.
- `symbol`: the currency text as written (normalized), or `null`.
- `fractionDigits`: minor unit digits of the currency (2 for USD, 0 for JPY, 3 for BHD), or `null`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `toMinorUnits` | `boolean` | `false` | Return an integer of minor units, computed on the decimal digits. |
| `currency` | `string` | none | ISO code to assume when none is written. In `strict` mode a different currency throws `CURRENCY_MISMATCH`. |
| `strict` | `boolean` | `false` | As in `parse`; unknown currencies throw `UNKNOWN_CURRENCY` and rounding throws `PRECISION_LOSS`. |
| `looseGrouping` | `boolean` | `false` | As in `parse`. |

### `detect(input, candidates?)`

Guesses how a number string was written. `candidates` defaults to `DEFAULT_CANDIDATES` (23 common locales, `en-US` first); their order breaks ties. Returns:

| Field | Type | Description |
| --- | --- | --- |
| `value` | `number` | Best guess, `NaN` when the string is not a number in any convention. |
| `decimal` | `string \| null` | Decimal separator found or assumed. |
| `group` | `string \| null` | Group separator found or assumed. |
| `ambiguous` | `boolean` | True when the string means two different numbers depending on the locale. |
| `confidence` | `number` | 0 to 1. `1` means only one reading is possible, `0.5` means a coin flip. |
| `reason` | `string` | Short English explanation. |
| `locales` | `string[]` | Candidates that read the string as `value`, best match first. |
| `alternatives` | `number[]` | Every distinct reading, `value` first. |

### `isValid(input, locale?, options?)`

`true` when `parse` would return a number. Never throws, even with `strict: true`.

### `createParser(locale?, options?)`

Resolves the locale once and returns `{ info, parse, isValid, parseCurrency, normalizeInput }` bound to it. The fastest way to parse many values:

```ts
const brl = createParser("pt-BR");
["1.234,56", "R$ 10,00", "(5,25)"].map(brl.parse); // [1234.56, 10, -5.25]
```

### `normalizeInput(value, locale?, options?)`

Returns `{ text, value, valid, complete }` for a form field. Options: `maxFractionDigits` (drop extra fraction digits) and `allowNegative` (default `true`).

### `getLocaleInfo(locale?)`

The symbols numberparrot uses for a locale, straight from `Intl`: `{ locale, numberingSystem, decimal, group, minusSign, plusSign, percentSign, exponent, digits }`.

### `NumberParseError`

Thrown in `strict` mode. Has `code`, `input` and `locale`. Codes: `EMPTY`, `NOT_A_STRING`, `NO_DIGITS`, `INVALID_CHARACTER`, `INVALID_SEPARATOR`, `MULTIPLE_DECIMALS`, `MIXED_GROUPS`, `INVALID_GROUPING`, `INVALID_SIGN`, `INVALID_AFFIX`, `UNKNOWN_CURRENCY`, `CURRENCY_MISMATCH`, `PRECISION_LOSS`, `OUT_OF_RANGE`.

```ts
import { parse, NumberParseError } from "numberparrot";

try {
  parse("1,23", "en-US", { strict: true });
} catch (error) {
  if (error instanceof NumberParseError) console.log(error.code); // "INVALID_GROUPING"
}
```

## Supported locales

Every locale supported by your runtime's `Intl` works, because nothing is hard coded. These are covered by the test suite, both with hand written input and with a round trip (format with `Intl.NumberFormat`, parse, compare) over 80+ values in decimal, scientific, percent, currency and accounting styles:

| Locale | Language | Example | Decimal | Group | Digits |
| --- | --- | --- | --- | --- | --- |
| `en-US` | English (US) | `-$1,234,567.89` | `.` | `,` | Latin |
| `pt-BR` | Portuguese (Brazil) | `-R$ 1.234.567,89` | `,` | `.` | Latin |
| `de-DE` | German (Germany) | `-1.234.567,89 €` | `,` | `.` | Latin |
| `fr-FR` | French (France) | `-1 234 567,89 €` | `,` | narrow no-break space (U+202F) | Latin |
| `de-CH` | German (Switzerland) | `CHF-1'234'567.89` | `.` | apostrophe (`'` or U+2019) | Latin |
| `en-IN` | English (India) | `-₹12,34,567.89` | `.` | `,` in lakh and crore groups | Latin |
| `ar-EG` | Arabic (Egypt) | `-١٬٢٣٤٬٥٦٧٫٨٩ ج.م.` | `٫` (U+066B) | `٬` (U+066C) | Arabic-Indic |
| `fa-IR` | Persian (Iran) | `−ریال ۱٬۲۳۴٬۵۶۸` | `٫` (U+066B) | `٬` (U+066C) | Persian |
| `hi-IN` | Hindi (India) | `-₹12,34,567.89` | `.` | `,` in lakh and crore groups | Latin or Devanagari |
| `th-TH` | Thai (Thailand) | `-฿1,234,567.89` | `.` | `,` | Latin or Thai |
| `ja-JP` | Japanese (Japan) | `-￥1,234,568` | `.` | `,` | Latin or full width |
| `es-ES` | Spanish (Spain) | `-1.234.567,89 €` | `,` | `.` | Latin |
| `it-IT` | Italian (Italy) | `-1.234.567,89 €` | `,` | `.` | Latin |
| `ru-RU` | Russian (Russia) | `-1 234 567,89 ₽` | `,` | no-break space (U+00A0) | Latin |
| `pl-PL` | Polish (Poland) | `-1 234 567,89 zł` | `,` | no-break space (U+00A0) | Latin |
| `sv-SE` | Swedish (Sweden) | `−1 234 567,89 kr` | `,` | no-break space (U+00A0) | Latin |
| `tr-TR` | Turkish (Turkey) | `-₺1.234.567,89` | `,` | `.` | Latin |

Numbering system extensions work as well: `th-TH-u-nu-thai`, `hi-IN-u-nu-deva`, `ar-EG-u-nu-latn`, `bn-BD`.

## Comparison with parseFloat, numeral.js and @internationalized/number

Facts checked against the npm registry and each library's behavior in October 2026.

| | `parseFloat` / `Number` | numeral.js | @internationalized/number | numberparrot |
| --- | --- | --- | --- | --- |
| Latest release | built in | 2.0.6 (March 2017) | 3.6.9 (October 2026) | 1.0.0 |
| Runtime dependencies | none | none | 1 (`@swc/helpers`) | none |
| License | built in | MIT | Apache-2.0 | MIT |
| Locale data | none | `en` built in, others registered by hand | `Intl` | `Intl` |
| `"1.234,56"` in pt-BR | `1.234` | `1.23456` with the default locale | `1234.56` | `1234.56` |
| Non-Latin digits | no | no | yes | yes, every Unicode digit |
| Currency text without format options | no | only the symbol of the active locale | `NaN` unless you pass the matching currency options | yes, and returns the ISO code |
| Rejects misplaced groups (`"1,23"` in en-US) | returns `1` | returns `123` | returns `123` | `NaN` (`INVALID_GROUPING` in strict mode) |
| Detect an unknown locale or ambiguity | no | no | no | `detect()` |
| Integer minor units for money | no | no | no | `toMinorUnits` |
| Partial input while typing | no | no | `isValidPartialNumber` | `normalizeInput()` |

@internationalized/number (from Adobe React Aria) is a solid choice when you already know the exact format options of the value, for example inside a React Aria number field. numberparrot is aimed at strings from the outside world: pasted values, CSV files, scraped prices and user input whose currency and format you do not control.

## Runtime support and bundle size

- Node.js 18 and newer, Deno, Bun, and all modern browsers. Requires `Intl.NumberFormat` with `formatToParts` (available everywhere since 2019) and full ICU locale data, which Node ships by default since version 13.
- Bundle size measured with esbuild (`npm run size`): the whole library is 14.3 kB minified, **6.1 kB gzipped**. Importing only `parse` costs 3.6 kB gzipped.
- ESM (`dist/index.js`), CommonJS (`dist/index.cjs`) and type definitions for both.

## Documentation

The guides, the API reference and the interactive world board live at **[kwy404.github.io/numberparrot](https://kwy404.github.io/numberparrot/)**:

- [World board: one number written and parsed in 39 locales](https://kwy404.github.io/numberparrot/)
- [API reference](https://kwy404.github.io/numberparrot/api.html)
- [Convert a string with a comma to a number in JavaScript](https://kwy404.github.io/numberparrot/convert-string-with-comma-to-number-javascript.html)
- [parseFloat with a comma decimal separator](https://kwy404.github.io/numberparrot/parsefloat-comma-decimal-separator.html)
- [Parse a localized number in JavaScript](https://kwy404.github.io/numberparrot/parse-localized-number-javascript.html)
- [Parse a currency string to a number in JavaScript](https://kwy404.github.io/numberparrot/parse-currency-string-javascript.html)
- [Convert Arabic and Persian digits to numbers in JavaScript](https://kwy404.github.io/numberparrot/arabic-digits-to-number-javascript.html)
- [Intl.NumberFormat parse: the missing reverse of format](https://kwy404.github.io/numberparrot/intl-numberformat-parse.html)
- [A maintained numeral.js alternative for parsing](https://kwy404.github.io/numberparrot/numeral-js-alternative.html)

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](https://github.com/kwy404/numberparrot/blob/main/CONTRIBUTING.md) for the setup, the test matrix and the project rules. Changes are listed in [CHANGELOG.md](https://github.com/kwy404/numberparrot/blob/main/CHANGELOG.md).

## More from kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): utility-first CSS with no build step
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): reactive HTML with no build step
- [breakhound](https://kwy404.github.io/breakhound/)
- [vueleap](https://kwy404.github.io/vueleap/)
- [graphemely](https://kwy404.github.io/graphemely/)
- [edgegoat](https://kwy404.github.io/edgegoat/)

## Author

Made by Alexandre Kohler ([GitHub](https://github.com/kwy404), [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). The documentation site is [built with Monsoon](https://kwy404.github.io/monsoon/), and its interactive parts are built with [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## License

[MIT](https://github.com/kwy404/numberparrot/blob/main/LICENSE) © 2026 Alexandre Kohler. Mascot Pico and all artwork in `assets/` are part of the project under the same license.
