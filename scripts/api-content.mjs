// The API reference, one entry per export. Used by api.html and the home page.

const opt = (rows) => `<div class="table-wrap"><table>
<thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
<tbody>
${rows.map(([name, type, def, text]) => `<tr><td><code>${name}</code></td><td><code>${type}</code></td><td>${def}</td><td>${text}</td></tr>`).join("\n")}
</tbody></table></div>`;

export const API = [
  {
    id: "parse",
    name: "parse",
    signature: "parse(input, locale?, options?): number",
    summary: "Read a number written in a locale. NaN when it is not a valid number there.",
    example: `import { parse } from "numberparrot";

parse("1.234,56", "pt-BR");      // 1234.56
parse("1'234.56", "de-CH");      // 1234.56
parse("12,34,567.89", "en-IN");  // 1234567.89
parse("(1.234,56)", "de-DE");    // -1234.56
parse("15%", "en-US");           // 0.15
parse("1.234,56", "en-US");      // NaN, not an en-US number`,
    body: () => `
<p>Returns a <code>number</code>, or <code>NaN</code> when <code>input</code> is not a valid number for the locale. Numbers are returned unchanged. The locale is a BCP 47 tag (<code>"pt-BR"</code>), a list of tags, or nothing for the runtime default.</p>
${opt([
  ["strict", "boolean", "<code>false</code>", "Throw <code>NumberParseError</code> instead of returning <code>NaN</code>. Only the exact separators of the locale and recognized currencies are accepted, and a decimal separator needs digits on both sides."],
  ["keepPercent", "boolean", "<code>false</code>", "Return <code>15</code> for <code>\"15%\"</code> instead of <code>0.15</code>."],
  ["looseGrouping", "boolean", "<code>false</code>", "Accept group separators anywhere (<code>\"1,23,4\"</code>). By default they must sit where thousands, or Indian lakh and crore, groups go."],
])}
<p>Besides the locale's own format, the default lenient mode accepts any whitespace (including U+00A0 and U+202F) or apostrophe as a group separator, the other one of <code>.</code> and <code>,</code> as a group separator, a leading (<code>.5</code>) or trailing (<code>5.</code>) decimal separator, signs and currency on either side, exponents (<code>E</code>, <code>e</code>, <code>×10^</code>), <code>∞</code>, and digits in any script.</p>`,
  },
  {
    id: "parse-currency",
    name: "parseCurrency",
    signature: "parseCurrency(input, locale?, options?): CurrencyResult",
    summary: "Amount, ISO code and symbol from a price, with exact integer cents on request.",
    example: `import { parseCurrency } from "numberparrot";

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

parseCurrency("1 234,56 €", "fr-FR").currency;  // "EUR"
parseCurrency("($1,234.56)", "en-US").amount;   // -1234.56
parseCurrency("R$ 19,99", "pt-BR", { toMinorUnits: true }).amount; // 1999`,
    body: () => `
<p>Returns <code>{ amount, currency, symbol, fractionDigits }</code>:</p>
<ul>
<li><code>amount</code>: the number, or integer minor units with <code>toMinorUnits</code>. <code>NaN</code> when invalid.</li>
<li><code>currency</code>: the ISO 4217 code, or <code>null</code> when none was found or recognized.</li>
<li><code>symbol</code>: the currency text as written (normalized), or <code>null</code>.</li>
<li><code>fractionDigits</code>: minor unit digits of the currency (2 for USD, 0 for JPY, 3 for BHD), or <code>null</code>.</li>
</ul>
${opt([
  ["toMinorUnits", "boolean", "<code>false</code>", "Return an integer of minor units, computed on the decimal digits as text."],
  ["currency", "string", "none", "ISO code to assume when none is written. In <code>strict</code> mode a different currency throws <code>CURRENCY_MISMATCH</code>."],
  ["strict", "boolean", "<code>false</code>", "As in <code>parse</code>; unknown currencies throw <code>UNKNOWN_CURRENCY</code> and rounding throws <code>PRECISION_LOSS</code>."],
  ["looseGrouping", "boolean", "<code>false</code>", "As in <code>parse</code>."],
])}
<p>Symbols are resolved through <code>Intl</code> for the locale, so the same <code>$</code> means USD in en-US, CAD in en-CA and MXN in es-MX.</p>`,
  },
  {
    id: "detect",
    name: "detect",
    signature: "detect(input, candidates?): DetectResult",
    summary: "Work out the decimal separator of an unknown string, and say when it cannot be sure.",
    example: `import { detect } from "numberparrot";

detect("1.234,56");
// { value: 1234.56, decimal: ",", group: ".", ambiguous: false, confidence: 0.95, ... }

detect("1,234");
// { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234], ... }`,
    body: () => `
<p>Guesses how a number string was written. <code>candidates</code> defaults to <code>DEFAULT_CANDIDATES</code> (23 common locales, <code>en-US</code> first); their order breaks ties.</p>
<div class="table-wrap"><table>
<thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>value</code></td><td><code>number</code></td><td>Best guess, <code>NaN</code> when the string is not a number in any convention.</td></tr>
<tr><td><code>decimal</code></td><td><code>string | null</code></td><td>Decimal separator found or assumed.</td></tr>
<tr><td><code>group</code></td><td><code>string | null</code></td><td>Group separator found or assumed.</td></tr>
<tr><td><code>ambiguous</code></td><td><code>boolean</code></td><td>True when the string means two different numbers depending on the locale.</td></tr>
<tr><td><code>confidence</code></td><td><code>number</code></td><td>0 to 1. <code>1</code> means only one reading is possible, <code>0.5</code> means a coin flip.</td></tr>
<tr><td><code>reason</code></td><td><code>string</code></td><td>Short English explanation.</td></tr>
<tr><td><code>locales</code></td><td><code>string[]</code></td><td>Candidates that read the string as <code>value</code>, best match first.</td></tr>
<tr><td><code>alternatives</code></td><td><code>number[]</code></td><td>Every distinct reading, <code>value</code> first.</td></tr>
</tbody></table></div>
<p>Switch the world board on the <a href="./#board">home page</a> to Detect mode to see every reading of a string across 39 locales.</p>`,
  },
  {
    id: "is-valid",
    name: "isValid",
    signature: "isValid(input, locale?, options?): boolean",
    summary: "True when parse would return a number. Never throws.",
    example: `import { isValid } from "numberparrot";

isValid("1.234,56", "pt-BR");                 // true
isValid("1,23", "en-US");                     // false, misplaced group
isValid("1,23", "en-US", { strict: true });   // false, no exception`,
    body: () => `
<p><code>true</code> when <code>parse</code> would return a number. Never throws, even with <code>strict: true</code>.</p>`,
  },
  {
    id: "create-parser",
    name: "createParser",
    signature: "createParser(locale?, options?): Parser",
    summary: "Resolve a locale once and get every function bound to it.",
    example: `import { createParser } from "numberparrot";

const brl = createParser("pt-BR");
["1.234,56", "R$ 10,00", "(5,25)"].map(brl.parse); // [1234.56, 10, -5.25]
brl.info.decimal; // ","`,
    body: () => `
<p>Resolves the locale once and returns <code>{ info, parse, isValid, parseCurrency, normalizeInput }</code> bound to it. The fastest way to parse many values, for example every row of a CSV file.</p>`,
  },
  {
    id: "normalize-input",
    name: "normalizeInput",
    signature: "normalizeInput(value, locale?, options?): InputState",
    summary: "Clean a form field on every keystroke and keep partial values valid.",
    example: `import { normalizeInput } from "numberparrot";

normalizeInput("1.234,", "pt-BR");
// { text: "1.234,", value: 1234, valid: true, complete: false }

normalizeInput("١٢٫٥", "ar-EG");
// { text: "12٫5", value: 12.5, valid: true, complete: true }`,
    body: () => `
<p>Returns <code>{ text, value, valid, complete }</code> for a form field. <code>text</code> is the cleaned field text and <code>complete</code> is <code>false</code> while the user is still typing, for example right after a decimal separator. Options: <code>maxFractionDigits</code> (drop extra fraction digits) and <code>allowNegative</code> (default <code>true</code>).</p>`,
  },
  {
    id: "get-locale-info",
    name: "getLocaleInfo",
    signature: "getLocaleInfo(locale?): LocaleInfo",
    summary: "The symbols numberparrot uses for a locale, straight from Intl.",
    example: `import { getLocaleInfo } from "numberparrot";

getLocaleInfo("de-CH");
// { locale: "de-CH", decimal: ".", group: "'", minusSign: "-",
//   percentSign: "%", exponent: "E", digits: "0123456789", numberingSystem: "latn" }`,
    body: () => `
<p>Returns <code>{ locale, numberingSystem, decimal, group, minusSign, plusSign, percentSign, exponent, digits }</code>, read from <code>Intl.NumberFormat#formatToParts()</code> once and cached. The locale picker on every docs page is built on it.</p>`,
  },
  {
    id: "number-parse-error",
    name: "NumberParseError",
    signature: "class NumberParseError extends Error",
    summary: "Thrown in strict mode, with a machine readable code.",
    example: `import { parse, NumberParseError } from "numberparrot";

try {
  parse("1,23", "en-US", { strict: true });
} catch (error) {
  if (error instanceof NumberParseError) console.log(error.code); // "INVALID_GROUPING"
}`,
    body: () => `
<p>Thrown in <code>strict</code> mode. Has <code>code</code>, <code>input</code> and <code>locale</code>.</p>
<div class="table-wrap"><table>
<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>EMPTY</code></td><td>The input is empty or only whitespace.</td></tr>
<tr><td><code>NOT_A_STRING</code></td><td>The input is not a string or a number.</td></tr>
<tr><td><code>NO_DIGITS</code></td><td>The input contains no digits.</td></tr>
<tr><td><code>INVALID_CHARACTER</code></td><td>An unexpected character appears inside the number.</td></tr>
<tr><td><code>INVALID_SEPARATOR</code></td><td>A separator is not valid for the locale (strict mode) or appears twice in a row.</td></tr>
<tr><td><code>MULTIPLE_DECIMALS</code></td><td>More than one decimal separator.</td></tr>
<tr><td><code>MIXED_GROUPS</code></td><td>Two different group separators in one number.</td></tr>
<tr><td><code>INVALID_GROUPING</code></td><td>Group separators in the wrong place, like <code>1,23</code> in en-US.</td></tr>
<tr><td><code>INVALID_SIGN</code></td><td>Duplicated or conflicting signs or parentheses.</td></tr>
<tr><td><code>INVALID_AFFIX</code></td><td>Text before or after the number that is not a sign, percent or currency.</td></tr>
<tr><td><code>UNKNOWN_CURRENCY</code></td><td>Strict mode found a currency it cannot identify.</td></tr>
<tr><td><code>CURRENCY_MISMATCH</code></td><td>The written currency differs from the <code>currency</code> option.</td></tr>
<tr><td><code>PRECISION_LOSS</code></td><td>Converting to minor units would need rounding (strict mode).</td></tr>
<tr><td><code>OUT_OF_RANGE</code></td><td>The value is not finite, or not a safe integer where one is required.</td></tr>
</tbody></table></div>`,
  },
];
