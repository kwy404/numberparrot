// Generates the static documentation site in docs/ (GitHub Pages).
//
//   node scripts/build-docs.mjs
//
// Every page shares one template so titles, descriptions, canonical URLs,
// Open Graph, Twitter and JSON-LD tags stay complete and unique.
import { writeFileSync } from "node:fs";
import { playground } from "../docs/playground-model.js";

const SITE = "https://kwy404.github.io/numberparrot/";
const REPO = "https://github.com/kwy404/numberparrot";
const AUTHOR = { "@type": "Person", name: "Alexandre Kohler", url: "https://github.com/kwy404" };
const PUBLISHED = "2026-10-12";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/**
 * A code example. scripts/highlight-docs.mjs later turns every
 * <pre data-lang> block into a highlighted editor frame with a copy button.
 */
const code = (text, lang = "ts", title = lang === "sh" ? "Terminal" : `example.${lang}`) =>
  `<pre data-lang="${lang}" data-title="${esc(title)}"><code>${esc(text.trim())}</code></pre>`;

const MANAGERS = [
  ["npm", "npm install numberparrot"],
  ["pnpm", "pnpm add numberparrot"],
  ["yarn", "yarn add numberparrot"],
  ["bun", "bun add numberparrot"],
];
let tabSet = 0;
/** Install command tabs. Static HTML shows npm; Voodoo.js switches the panels. */
function installTabs() {
  tabSet++;
  const tabs = MANAGERS.map(
    ([name], i) =>
      `<button type="button" role="tab" id="pm-${tabSet}-${name}" aria-controls="pm-${tabSet}-${name}-panel" aria-selected="${i === 0}" :aria-selected="pm === '${name}' ? 'true' : 'false'" @click="setPm('${name}')">${name}</button>`,
  ).join("\n    ");
  const panels = MANAGERS.map(
    ([name, command], i) =>
      `<div role="tabpanel" id="pm-${tabSet}-${name}-panel" aria-labelledby="pm-${tabSet}-${name}"${i === 0 ? "" : ' style="display:none"'} v-show="pm === '${name}'">
${code(command, "sh", "Terminal")}
  </div>`,
  ).join("\n  ");
  return `<div class="install">
  <div class="tabs" role="tablist" aria-label="Package manager">
    ${tabs}
  </div>
  ${panels}
</div>`;
}

const GUIDES = [
  {
    file: "convert-string-with-comma-to-number-javascript.html",
    nav: "Comma to number",
    title: "Convert a String with a Comma to a Number in JavaScript",
    description:
      'How to convert "1,5" or "1.234,56" to a number in JavaScript. Why replace(",", ".") and parseFloat fail, and a locale aware fix that works in every locale.',
    summary: 'Turn "1.234,56" into 1234.56 without replace() hacks.',
    body: () => `
<p class="lead">Half the world writes decimals with a comma. JavaScript only understands a dot. Here is why the usual fixes break and how to convert comma strings reliably.</p>

<h2>The problem</h2>
<p>A user in Brazil, Germany or France types <code>1.234,56</code>. JavaScript reads it like this:</p>
${code(`parseFloat("1.234,56"); // 1.234   (stops at the second ".")
Number("1.234,56");     // NaN
parseFloat("1,5");      // 1       (stops at the ",")`)}

<h2>Why replace(",", ".") is not enough</h2>
<p>The most common answer online is to swap the comma for a dot. It works for <code>"1,5"</code> and breaks for everything else:</p>
<div class="table-wrap"><table>
<thead><tr><th>Input</th><th>Meaning</th><th><code>Number(s.replace(",", "."))</code></th></tr></thead>
<tbody>
<tr><td><code>1,5</code></td><td>1.5 (de-DE)</td><td class="good">1.5</td></tr>
<tr><td><code>1.234,56</code></td><td>1234.56 (pt-BR)</td><td class="bad">NaN</td></tr>
<tr><td><code>1,234</code></td><td>1234 (en-US)</td><td class="bad">1.234</td></tr>
<tr><td><code>1 234,56</code></td><td>1234.56 (fr-FR)</td><td class="bad">NaN</td></tr>
<tr><td><code>R$ 10,00</code></td><td>10 (pt-BR)</td><td class="bad">NaN</td></tr>
</tbody></table></div>
<p>Removing every dot first (<code>s.replace(/\\./g, "").replace(",", ".")</code>) fixes Brazilian input and silently corrupts English input, where the dot is the decimal separator. There is no character swap that is right for every locale, because the meaning of <code>.</code> and <code>,</code> depends on who wrote the number.</p>

<h2>The fix: parse with the locale</h2>
<p>numberparrot reads the decimal and group separators for the locale from <code>Intl.NumberFormat</code>, so it parses exactly what the locale writes, and returns <code>NaN</code> for anything else instead of guessing:</p>
${code(`import { parse } from "numberparrot";

parse("1,5", "de-DE");        // 1.5
parse("1.234,56", "pt-BR");   // 1234.56
parse("1 234,56", "fr-FR");   // 1234.56 (any kind of space)
parse("R$ 10,00", "pt-BR");   // 10
parse("1,234", "en-US");      // 1234
parse("1.234,56", "en-US");   // NaN, not an en-US number`)}

<h2>When you do not know the locale</h2>
<p>For CSV files or pasted values, <code>detect()</code> works out the decimal separator from the string itself and tells you when it cannot be sure:</p>
${code(`import { detect } from "numberparrot";

detect("1.234,56").value;  // 1234.56, confidence 0.95
detect("1,5").value;       // 1.5
detect("1,234");           // ambiguous: true, alternatives [1234, 1.234]`)}

<h2>In a form field</h2>
${code(`import { createParser } from "numberparrot";

const brl = createParser(navigator.language); // for example "pt-BR"
input.addEventListener("change", () => {
  const value = brl.parse(input.value);
  input.setCustomValidity(Number.isNaN(value) ? "Please enter a number" : "");
});`)}
`,
  },
  {
    file: "parsefloat-comma-decimal-separator.html",
    nav: "parseFloat and commas",
    title: "parseFloat with a Comma Decimal Separator: Why It Returns the Wrong Number",
    description:
      'parseFloat("1,5") returns 1 and parseFloat("1.234,56") returns 1.234. Learn why parseFloat ignores the comma decimal separator and how to parse it correctly.',
    summary: "Why parseFloat returns 1.234 for 1.234,56, and the fix.",
    body: () => `
<p class="lead"><code>parseFloat</code> does not fail on numbers written with a comma decimal separator. It does something worse: it returns a wrong number.</p>

<h2>What parseFloat actually does</h2>
<p><code>parseFloat</code> reads characters from the start of the string while they look like an English number, then stops and returns whatever it has. It never reports an error for the rest of the string.</p>
${code(`parseFloat("1,5");           // 1      (stops at ",")
parseFloat("1.234,56");      // 1.234  (stops at the second ".")
parseFloat("1'234.56");      // 1      (stops at "'")
parseFloat("12,34,567.89");  // 12     (stops at ",")
parseFloat("R$ 10,00");      // NaN    (starts with "R")`)}
<p class="callout warn">A wrong number is more dangerous than <code>NaN</code>: <code>1.234</code> passes every <code>isNaN</code> check and quietly ends up in your database, invoice or chart.</p>

<h2>Number() is stricter, but not smarter</h2>
${code(`Number("1,5");       // NaN
Number("1.234,56");  // NaN
Number("1 234");     // NaN`)}
<p><code>Number</code> rejects the whole string, which is safer, but it still only understands one format: a dot as the decimal separator and no grouping at all.</p>

<h2>The fix</h2>
<p>Parse with the locale the number was written in. numberparrot gets the separators from <code>Intl.NumberFormat</code> and validates the whole string:</p>
${code(`import { parse } from "numberparrot";

parse("1,5", "pt-BR");           // 1.5
parse("1.234,56", "pt-BR");      // 1234.56
parse("1'234.56", "de-CH");      // 1234.56
parse("12,34,567.89", "en-IN");  // 1234567.89

// Strict mode throws with a reason instead of returning NaN
parse("1,23", "en-US", { strict: true }); // NumberParseError: INVALID_GROUPING`)}

<h2>Comparison</h2>
<div class="table-wrap"><table>
<thead><tr><th>Input</th><th>Locale</th><th>parseFloat</th><th>Number</th><th>numberparrot</th></tr></thead>
<tbody>
<tr><td><code>1,5</code></td><td>pt-BR</td><td class="bad">1</td><td class="bad">NaN</td><td class="good">1.5</td></tr>
<tr><td><code>1.234,56</code></td><td>de-DE</td><td class="bad">1.234</td><td class="bad">NaN</td><td class="good">1234.56</td></tr>
<tr><td><code>1 234,56</code></td><td>fr-FR</td><td class="bad">1</td><td class="bad">NaN</td><td class="good">1234.56</td></tr>
<tr><td><code>-1.234,56</code></td><td>it-IT</td><td class="bad">-1.234</td><td class="bad">NaN</td><td class="good">-1234.56</td></tr>
</tbody></table></div>
`,
  },
  {
    file: "parse-localized-number-javascript.html",
    nav: "Localized numbers",
    title: "Parse a Localized Number in JavaScript (Any Locale, Using Intl)",
    description:
      "Parse numbers formatted with Intl.NumberFormat or toLocaleString back into JavaScript numbers for any locale: narrow no-break spaces, apostrophes, Indian grouping and non-Latin digits.",
    summary: "Read back what toLocaleString and Intl.NumberFormat write.",
    body: () => `
<p class="lead"><code>toLocaleString()</code> and <code>Intl.NumberFormat</code> can write a number in any locale. Nothing built in can read it back.</p>

<h2>The broken round trip</h2>
${code(`const text = (1234567.891).toLocaleString("fr-FR"); // "1 234 567,891"
parseFloat(text); // 1
Number(text);     // NaN`)}

<h2>Why a quick regex does not survive real locales</h2>
<p>A popular workaround asks <code>Intl.NumberFormat</code> for the group and decimal characters with <code>formatToParts</code> and replaces them. It is the right idea, but the details bite:</p>
<ul>
<li><strong>Invisible characters.</strong> fr-FR groups with a narrow no-break space (U+202F), ru-RU and sv-SE with a no-break space (U+00A0). Users type a normal space. A regex built from the Intl character will not match what people type.</li>
<li><strong>Apostrophes.</strong> de-CH groups with an apostrophe, printed as <code>'</code> or as a right single quotation mark depending on the ICU version.</li>
<li><strong>Indian grouping.</strong> en-IN and hi-IN write <code>12,34,567.89</code>: groups of two after the first three digits.</li>
<li><strong>Other digits.</strong> ar-EG prints Arabic-Indic digits with <code>٫</code> and <code>٬</code> separators, fa-IR Persian digits, and Intl inserts invisible bidi marks around the minus sign.</li>
<li><strong>Signs.</strong> sv-SE prints the minus sign U+2212, not a hyphen. Accounting formats use parentheses.</li>
</ul>

<h2>The fix</h2>
<p>numberparrot does the <code>formatToParts</code> work once per locale, caches it, and handles every case above:</p>
${code(`import { parse } from "numberparrot";

const locales = ["fr-FR", "de-CH", "en-IN", "ar-EG", "sv-SE", "ja-JP"];
for (const locale of locales) {
  const text = new Intl.NumberFormat(locale).format(-1234567.891);
  console.log(locale, text, parse(text, locale)); // always -1234567.891
}`)}
<p>The test suite runs this round trip for 17 locales and more than 80 values in decimal, scientific, percent, currency and accounting styles.</p>

<h2>Look at the locale data</h2>
${code(`import { getLocaleInfo } from "numberparrot";

getLocaleInfo("de-CH");
// { locale: "de-CH", decimal: ".", group: "'", minusSign: "-",
//   percentSign: "%", exponent: "E", digits: "0123456789", numberingSystem: "latn" }`)}

<h2>Parse many values fast</h2>
${code(`import { createParser } from "numberparrot";

const sv = createParser("sv-SE");
rows.map((row) => sv.parse(row.amount));`)}
`,
  },
  {
    file: "parse-currency-string-javascript.html",
    nav: "Currency strings",
    title: "Parse a Currency String to a Number in JavaScript (R$, €, ₹, CHF)",
    description:
      'Convert currency strings like "R$ 1.234,56", "1 234,56 €" or "($1,234.56)" to numbers and ISO codes in JavaScript, with exact integer cents for money.',
    summary: "Amount and ISO code from R$ 1.234,56, € and ₹ strings.",
    body: () => `
<p class="lead">Prices come with symbols, codes, spaces and parentheses. Here is how to get the amount and the currency out safely.</p>

<h2>The broken approach: strip everything that is not a digit</h2>
${code(`const toNumber = (s) => parseFloat(s.replace(/[^0-9.-]/g, ""));

toNumber("$1,234.56");     // 1234.56   fine
toNumber("R$ 1.234,56");   // 1.23456   wrong
toNumber("1 234,56 €");    // 123456    wrong
toNumber("($1,234.56)");   // 1234.56   wrong sign`)}
<p>The regex cannot know whether <code>.</code> and <code>,</code> are decimal or group separators, drops the accounting parentheses, and throws away the currency.</p>

<h2>The fix: parseCurrency</h2>
${code(`import { parseCurrency } from "numberparrot";

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

parseCurrency("1 234,56 €", "fr-FR");    // { amount: 1234.56, currency: "EUR", ... }
parseCurrency("₹12,34,567.89", "en-IN"); // { amount: 1234567.89, currency: "INR", ... }
parseCurrency("CHF 1'234.50", "de-CH");  // { amount: 1234.5, currency: "CHF", ... }
parseCurrency("($1,234.56)", "en-US");   // { amount: -1234.56, currency: "USD", ... }
parseCurrency("1.234,56 EUR", "de-DE");  // ISO codes work too`)}
<p>Symbols are resolved through <code>Intl</code> for the locale, so the same <code>$</code> means USD in en-US, CAD in en-CA and MXN in es-MX. Unknown currency text gives <code>currency: null</code>, or an error in strict mode.</p>

<h2>Exact cents for money</h2>
<p>Never multiply a float by 100 to get cents: <code>0.29 * 100</code> is <code>28.999999999999996</code>. Ask for minor units instead; numberparrot shifts the decimal digits as text:</p>
${code(`parseCurrency("0,29", "pt-BR", { toMinorUnits: true }).amount;    // 29
parseCurrency("R$ 19,99", "pt-BR", { toMinorUnits: true }).amount; // 1999
parseCurrency("¥1,235", "ja-JP", { toMinorUnits: true }).amount;   // 1235 (JPY has no minor unit)
parseCurrency("$1.005", "en-US", { toMinorUnits: true, strict: true });
// throws PRECISION_LOSS: USD has 2 decimals`)}

<h2>Default currency</h2>
${code(`parseCurrency("12,50", "pt-BR", { currency: "BRL" });
// { amount: 12.5, currency: "BRL", symbol: null, fractionDigits: 2 }`)}
`,
  },
  {
    file: "arabic-digits-to-number-javascript.html",
    nav: "Arabic digits",
    title: "Convert Arabic and Persian Digits to a Number in JavaScript",
    description:
      "Convert Arabic-Indic (٠١٢٣), Persian (۰۱۲۳), Devanagari, Thai and full width digits to JavaScript numbers, including the Arabic decimal and thousands separators.",
    summary: "١٬٢٣٤٫٥٦ and ۱۲۳٫۴۵ to real numbers.",
    body: () => `
<p class="lead">Arabic-Indic and Persian digits are real digits, and <code>Intl.NumberFormat</code> prints them by default for locales like ar-EG and fa-IR. JavaScript cannot read them back.</p>

<h2>The problem</h2>
${code(`const text = new Intl.NumberFormat("ar-EG").format(1234.56); // "١٬٢٣٤٫٥٦"
Number(text);     // NaN
parseFloat(text); // NaN
Number("١٢٣");    // NaN`)}

<h2>The usual trick and its gaps</h2>
<p>A common snippet maps each digit with its char code:</p>
${code(`const toLatin = (s) =>
  s.replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
   .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0);

Number(toLatin("١٢٣"));        // 123, fine
Number(toLatin("١٬٢٣٤٫٥٦"));   // NaN: ٬ and ٫ are still there`)}
<p>It also misses the Arabic decimal separator <code>٫</code> (U+066B), the Arabic thousands separator <code>٬</code> (U+066C), the invisible bidi marks that Intl places around the minus sign, the Arabic percent sign <code>٪</code>, and every other script: Devanagari, Bengali, Thai, full width and more.</p>

<h2>The fix</h2>
${code(`import { parse } from "numberparrot";

parse("١٬٢٣٤٫٥٦", "ar-EG");      // 1234.56
parse("۱۲۳٫۴۵", "fa-IR");         // 123.45
parse("١٥٪", "ar-EG");            // 0.15
parse("१२,३४,५६७.८९", "hi-IN");   // 1234567.89 (Devanagari)
parse("๑,๒๓๔.๕", "th-TH");       // 1234.5 (Thai)
parse("১,২৩৪.৫", "bn-BD");        // 1234.5 (Bengali)
parse("１２３４．５", "ja-JP");    // 1234.5 (full width)`)}
<p>Every Unicode decimal digit is supported, whatever locale you pass. Text with mixed scripts works too: <code>parse("١٢٣", "en-US")</code> is <code>123</code>.</p>

<h2>Normalize while the user types</h2>
${code(`import { normalizeInput } from "numberparrot";

normalizeInput("١٢٫٥", "ar-EG");
// { text: "12٫5", value: 12.5, valid: true, complete: true }`)}
`,
  },
  {
    file: "intl-numberformat-parse.html",
    nav: "Intl parse",
    title: "Intl.NumberFormat Parse: How to Reverse Intl Number Formatting",
    description:
      "Intl.NumberFormat can format numbers but has no parse method. How to parse Intl output back into numbers for any locale, style and numbering system.",
    summary: "The missing reverse of Intl.NumberFormat#format.",
    body: () => `
<p class="lead"><code>Intl.NumberFormat</code> has <code>format</code>, <code>formatToParts</code> and <code>formatRange</code>. There is no <code>parse</code>.</p>

<h2>What is missing</h2>
${code(`const nf = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const text = nf.format(-1234.5); // "-1.234,50 €"
nf.parse(text);                  // TypeError: nf.parse is not a function`)}

<h2>A parser built on the same data</h2>
<p>numberparrot asks <code>Intl.NumberFormat#formatToParts</code> for the decimal, group, minus, percent and exponent symbols and the digits of the numbering system, then parses with them. Whatever Intl writes, numberparrot reads:</p>
${code(`import { parse, parseCurrency } from "numberparrot";

parse(new Intl.NumberFormat("de-DE").format(1234.5), "de-DE");                       // 1234.5
parse(new Intl.NumberFormat("en-US", { style: "percent" }).format(0.25), "en-US");   // 0.25
parse(new Intl.NumberFormat("sv-SE", { notation: "scientific" }).format(1500), "sv-SE"); // 1500
parse(new Intl.NumberFormat("ar-EG").format(-42.5), "ar-EG");                         // -42.5

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencySign: "accounting" });
parseCurrency(usd.format(-1234.56), "en-US"); // { amount: -1234.56, currency: "USD", ... }`)}

<h2>Round trip guarantee</h2>
<p>For values printed with enough significant digits (17), parsing gives back exactly the same JavaScript number. The test suite checks this for 17 locales in decimal, scientific, percent, currency and accounting styles:</p>
${code(`const nf = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 17 });
const value = 0.1 + 0.2;
parse(nf.format(value), "fr-FR") === value; // true`)}

<h2>Numbering systems and extensions</h2>
${code(`parse(new Intl.NumberFormat("th-TH-u-nu-thai").format(1234.5), "th-TH-u-nu-thai"); // 1234.5
parse(new Intl.NumberFormat("hi-IN-u-nu-deva").format(1234.5), "hi-IN-u-nu-deva"); // 1234.5`)}
`,
  },
  {
    file: "numeral-js-alternative.html",
    nav: "numeral.js alternative",
    title: "numeral.js Alternative for Parsing Localized Numbers",
    description:
      "Looking for a numeral.js alternative? numeral's last release was 2.0.6 in March 2017. Parse localized numbers with Intl data, zero dependencies and TypeScript types.",
    summary: "Replace numeral().value() with locale aware parsing.",
    body: () => `
<p class="lead">numeral.js was the go to library for formatting and unformatting numbers. Its last release, 2.0.6, was published to npm in March 2017.</p>

<h2>Where numeral.js struggles today</h2>
<ul>
<li><strong>Locales are registered by hand.</strong> Only <code>en</code> is built in; other locales are separate definitions you load and select globally with <code>numeral.locale()</code>.</li>
<li><strong>Global state.</strong> The active locale is shared by the whole app, which makes mixed locale data (a CSV from Germany, a price from Brazil) awkward.</li>
<li><strong>Silent wrong values.</strong> With the default locale, <code>numeral("1.234,56").value()</code> returns <code>1.23456</code>.</li>
<li><strong>No non-Latin digits</strong> and no Unicode minus sign.</li>
</ul>
${code(`import numeral from "numeral";

numeral("1.234,56").value(); // 1.23456 with the default "en" locale
numeral("١٢٣").value();      // null`)}

<h2>The replacement for unformatting</h2>
<p>numberparrot takes the locale per call and reads its separators from <code>Intl</code>, so every locale your runtime supports works without registering anything:</p>
${code(`import { parse, parseCurrency } from "numberparrot";

parse("1.234,56", "pt-BR");             // 1234.56
parse("1.234,56", "de-DE");             // 1234.56
parse("(1,234.56)", "en-US");           // -1234.56
parse("15%", "en-US");                  // 0.15, same as numeral("15%").value()
parseCurrency("R$ 1.234,56", "pt-BR");  // { amount: 1234.56, currency: "BRL", ... }`)}

<h2>Migration table</h2>
<div class="table-wrap"><table>
<thead><tr><th>numeral.js</th><th>numberparrot or the platform</th></tr></thead>
<tbody>
<tr><td><code>numeral.locale("pt-br"); numeral(s).value()</code></td><td><code>parse(s, "pt-BR")</code></td></tr>
<tr><td><code>numeral(s).value()</code> on money</td><td><code>parseCurrency(s, locale).amount</code></td></tr>
<tr><td><code>numeral(n).format("0,0.00")</code></td><td><code>new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)</code></td></tr>
<tr><td><code>numeral(n).format("$0,0.00")</code></td><td><code>new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n)</code></td></tr>
<tr><td><code>numeral(n).format("0%")</code></td><td><code>new Intl.NumberFormat(locale, { style: "percent" }).format(n)</code></td></tr>
</tbody></table></div>
<p class="callout">numberparrot only parses. For formatting, the built in <code>Intl.NumberFormat</code> already covers what numeral did, for every locale, with no library at all.</p>

<h2>Other options</h2>
<p><a href="https://www.npmjs.com/package/@internationalized/number">@internationalized/number</a> from Adobe React Aria also parses with Intl data and is actively maintained. It needs the exact format options of the value (for example <code>style: "currency"</code> and the currency code) to read currency or percent strings. numberparrot is aimed at strings whose format you do not control, adds <code>detect()</code> for unknown locales and <code>toMinorUnits</code> for money.</p>
`,
  },
];

const NAV = [
  { file: "index.html", nav: "Playground" },
  ...GUIDES.slice(0, 4),
];

function layout({ file, title, description, body, jsonld }) {
  const url = file === "index.html" ? SITE : SITE + file;
  const fullTitle = file === "index.html" ? title : `${title} | numberparrot`;
  const nav = NAV.map(
    (p) =>
      `<a href="${p.file === "index.html" ? "./" : p.file}"${p.file === file ? ' aria-current="page"' : ""}>${esc(p.nav)}</a>`,
  ).join("\n        ");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#2FBF71">
  <meta property="og:type" content="${file === "index.html" ? "website" : "article"}">
  <meta property="og:site_name" content="numberparrot">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="numberparrot: parse localized numbers and currency strings in JavaScript">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}og.png">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <script>try{var t=localStorage.getItem("np-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/voodoojs@0.13.0/dist/voodoo.full.min.js" data-manual defer></script>
  <script type="module" src="app.js"></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site">
    <div class="container">
      <a class="brand" href="./"><img src="favicon.svg" width="32" height="32" alt=""><span>number<b>parrot</b></span></a>
      <nav class="site" aria-label="Main">
        ${nav}
        <a href="${REPO}">GitHub</a>
        <button class="theme-toggle" type="button" :aria-pressed="theme === 'dark' ? 'true' : 'false'" @click="toggleTheme()" v-text="theme === 'dark' ? 'Light theme' : 'Dark theme'">Theme</button>
      </nav>
    </div>
  </header>
  <main id="main">
    <div class="container">
${body}
    </div>
  </main>
  <footer class="site">
    <div class="container">
      <img src="img/mascot.svg" width="32" height="32" alt="">
      <span>numberparrot is MIT licensed, made by <a href="https://github.com/kwy404">Alexandre Kohler</a>.</span>
      <a href="${REPO}">Source on GitHub</a>
      <a href="https://www.npmjs.com/package/numberparrot">npm</a>
      <span>Interactive parts built with <a href="https://github.com/kwy404/Voodoo.js">Voodoo.js</a>.</span>
    </div>
  </footer>
</body>
</html>
`;
}

function guideList(exclude) {
  return `<ul class="guides">
${GUIDES.filter((g) => g.file !== exclude)
  .map((g) => `  <li><a href="${g.file}"><strong>${esc(g.title)}</strong><span>${esc(g.summary)}</span></a></li>`)
  .join("\n")}
</ul>`;
}

// Guide pages ----------------------------------------------------------------------
for (const guide of GUIDES) {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.description,
    url: SITE + guide.file,
    image: SITE + "og.png",
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    inLanguage: "en",
    author: AUTHOR,
    publisher: AUTHOR,
    mainEntityOfPage: SITE + guide.file,
    about: { "@type": "SoftwareSourceCode", name: "numberparrot", codeRepository: REPO, programmingLanguage: "TypeScript" },
  };
  const body = `
<p class="breadcrumb"><a href="./">numberparrot</a> / Guides</p>
<article>
<h1>${esc(guide.title)}</h1>
${guide.body()}
<h2>Install</h2>
${installTabs()}
<p>Zero dependencies, ESM and CommonJS, TypeScript types included. Works in Node.js 18+, Deno, Bun and browsers. <a href="./">Try it in the playground</a>.</p>
</article>
<h2>More guides</h2>
${guideList(guide.file)}`;
  writeFileSync(`docs/${guide.file}`, layout({ ...guide, body, jsonld }));
  console.log(`wrote docs/${guide.file}`);
}

// Index ----------------------------------------------------------------------------
const LOCALES = [
  ["auto", "Detect automatically"],
  ["en-US", "en-US English (US)"],
  ["pt-BR", "pt-BR Portuguese (Brazil)"],
  ["de-DE", "de-DE German"],
  ["fr-FR", "fr-FR French"],
  ["de-CH", "de-CH German (Switzerland)"],
  ["en-IN", "en-IN English (India)"],
  ["hi-IN", "hi-IN Hindi"],
  ["ar-EG", "ar-EG Arabic (Egypt)"],
  ["fa-IR", "fa-IR Persian"],
  ["th-TH", "th-TH Thai"],
  ["ja-JP", "ja-JP Japanese"],
  ["es-ES", "es-ES Spanish"],
  ["it-IT", "it-IT Italian"],
  ["ru-RU", "ru-RU Russian"],
  ["pl-PL", "pl-PL Polish"],
  ["sv-SE", "sv-SE Swedish"],
  ["tr-TR", "tr-TR Turkish"],
  ["en-CA", "en-CA English (Canada)"],
  ["es-MX", "es-MX Spanish (Mexico)"],
];
const EXAMPLES = [
  ["1.234,56", "pt-BR"],
  ["R$ 1.234,56", "pt-BR"],
  ["1 234,56 €", "fr-FR"],
  ["CHF 1'234.50", "de-CH"],
  ["₹12,34,567.89", "en-IN"],
  ["١٬٢٣٤٫٥٦", "ar-EG"],
  ["۱۲۳٫۴۵", "fa-IR"],
  ["(1.234,56)", "de-DE"],
  ["−1 234,56 kr", "sv-SE"],
  ["%15", "tr-TR"],
  ["1,234", "auto"],
];
const PG = playground();
const RESULTS = [
  ["pf", "parseFloat(text)"],
  ["num", "Number(text)"],
  ["parse", "parse(text, locale)"],
  ["currency", "parseCurrency(text, locale)"],
  ["detect", "detect(text)"],
  ["format", "round trip with Intl"],
];
const FEATURES = [
  ["locales", "Any locale", "Separators, digits and symbols come from Intl.NumberFormat for every locale your runtime knows."],
  ["currency", "Currency", "Symbols and ISO codes on either side: R$ 1.234,56, 1 234,56 €, CHF 1'234.50."],
  ["digits", "Any digits", "Arabic-Indic, Persian, Devanagari, Bengali, Thai, full width and every Unicode digit."],
  ["accounting", "Accounting negatives", "(1.234,56), trailing minus and every minus sign look alike."],
  ["detection", "Detection", "detect() finds the decimal separator and flags real ambiguity like 1,234."],
  ["money", "Money safety", "toMinorUnits gives exact integer cents: 0,29 is 29, never 28.999999999999996."],
  ["input", "Form input", "normalizeInput() cleans fields while typing and keeps partial values like 1.234, valid."],
];
const indexBody = `
<section class="hero" aria-labelledby="title">
  <div>
    <h1 id="title">Parse localized numbers and currency strings in JavaScript</h1>
    <p class="lead"><code>parseFloat("1.234,56")</code> returns <code class="bad">1.234</code>. numberparrot returns <code class="good">1234.56</code>. It is the missing parser for <code>Intl.NumberFormat</code>: zero dependencies, every locale.</p>
    <div class="cta">
      <a class="button primary" href="#playground">Try it</a>
      <a class="button" href="${REPO}#readme">Read the docs</a>
      <a class="button" href="https://www.npmjs.com/package/numberparrot">npm install numberparrot</a>
    </div>
  </div>
  <img src="img/mascot.svg" width="180" height="180" alt="Pico, the numberparrot mascot: a friendly green parrot that repeats numbers in any language">
</section>

<section id="playground" class="card playground" aria-labelledby="pg-title" v-data="playground()" v-effect="r = analyze(text, locale)">
  <h2 id="pg-title" style="margin-top:0">Playground: parseFloat vs numberparrot</h2>
  <form id="pg-form" @submit.prevent="">
    <div>
      <label for="pg-value">Number as text</label>
      <input id="pg-value" value="${esc(PG.text)}" v-model="text" autocomplete="off" spellcheck="false">
    </div>
    <div>
      <label for="pg-locale">Locale</label>
      <select id="pg-locale" v-model="locale">
${LOCALES.map(([v, l]) => `        <option value="${v}"${v === PG.locale ? " selected" : ""}>${esc(l)}</option>`).join("\n")}
      </select>
    </div>
  </form>
  <div class="examples" aria-label="Examples">
${EXAMPLES.map(([v, l]) => `    <button type="button" data-example="${esc(v)}" data-locale="${l}" @click="text = $el.dataset.example; locale = $el.dataset.locale">${esc(v)}</button>`).join("\n")}
  </div>
  <div class="results" aria-live="polite">
${RESULTS.map(([key, label]) => {
  const r = PG.r[key];
  const state = r.state ? ` data-state="${r.state}" :data-state="r.${key}.state"` : "";
  return `    <div class="result"${state}><span class="label">${esc(label)}</span><output v-text="r.${key}.value">${esc(r.value)}</output><small v-text="r.${key}.note">${esc(r.note)}</small></div>`;
}).join("\n")}
  </div>
</section>

<h2>Features</h2>
<div class="features">
${FEATURES.map(
  ([icon, title, text]) => `  <div class="feature"><img src="img/icons/${icon}.svg" width="48" height="48" alt=""><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>`,
).join("\n")}
</div>

<h2>parseFloat vs numberparrot, side by side</h2>
<img class="demo" src="img/demo.svg" width="900" height="420" loading="lazy" alt="Animated comparison: 1.234.567,89 in pt-BR, 1'234'567.89 in de-CH, 12,34,567.89 in en-IN and Arabic-Indic digits in ar-EG all parse to 1234567.89 with numberparrot, while parseFloat returns 1.234, 1, 12 and NaN">

<h2>Install</h2>
${installTabs()}
${code(`import { parse, parseCurrency, detect, normalizeInput } from "numberparrot";

parse("1.234,56", "pt-BR");             // 1234.56
parse("1'234.56", "de-CH");             // 1234.56
parse("12,34,567.89", "en-IN");         // 1234567.89
parse("١٬٢٣٤٫٥٦", "ar-EG");             // 1234.56
parse("(1.234,56)", "de-DE");           // -1234.56
parse("15%", "en-US");                  // 0.15

parseCurrency("R$ 1.234,56", "pt-BR");  // { amount: 1234.56, currency: "BRL", ... }
parseCurrency("0,29", "pt-BR", { toMinorUnits: true }).amount; // 29

detect("1,234");                        // { ambiguous: true, alternatives: [1234, 1.234], ... }
normalizeInput("1.234,", "pt-BR");      // { text: "1.234,", value: 1234, valid: true, complete: false }`)}
<p>Works in Node.js 18+, Deno, Bun and every modern browser. ESM and CommonJS builds, TypeScript types, about 6 kB gzipped for the whole library. The full API reference is in the <a href="${REPO}#api-reference">README</a>.</p>

<h2>Guides</h2>
${guideList(null)}`;

const indexJsonld = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "numberparrot",
  description:
    "Parse localized number and currency strings into JavaScript numbers for any locale, using Intl.NumberFormat data. Zero dependencies.",
  url: SITE,
  codeRepository: REPO,
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: ["Node.js", "Deno", "Bun", "Web browsers"],
  license: "https://opensource.org/licenses/MIT",
  author: AUTHOR,
  version: "0.1.0",
  image: SITE + "og.png",
  keywords: "parse localized number javascript, convert string with comma to number javascript, parse currency string to number javascript, parseFloat comma decimal, intl number parse, numeral.js alternative",
};
writeFileSync(
  "docs/index.html",
  layout({
    file: "index.html",
    title: "numberparrot: parse localized numbers and currency strings in JavaScript",
    description:
      'parseFloat("1.234,56") returns 1.234. numberparrot returns 1234.56. Parse numbers and currency strings written in any locale, with Intl data and zero dependencies.',
    body: indexBody,
    jsonld: indexJsonld,
  }),
);
console.log("wrote docs/index.html");

// 404 ------------------------------------------------------------------------------
const notFound = layout({
  file: "404.html",
  title: "Page not found",
  description: "This numberparrot documentation page does not exist.",
  jsonld: { "@context": "https://schema.org", "@type": "WebPage", name: "Page not found" },
  body: `
<section class="hero">
  <div>
    <h1>404: this page flew away</h1>
    <p class="lead">Pico looked everywhere and could only find <code>NaN</code>. Try the <a href="./">playground</a> or one of the guides below.</p>
  </div>
  <img src="img/mascot.svg" width="180" height="180" alt="Pico the parrot">
</section>
<h2>Guides</h2>
${guideList(null)}`,
}).replace('<link rel="canonical" href="https://kwy404.github.io/numberparrot/404.html">\n', '<meta name="robots" content="noindex">\n');
// GitHub Pages serves 404.html from any path, so links must be absolute.
writeFileSync(
  "docs/404.html",
  notFound.replace(/(href|src)="(?!https?:|#|\/)([^"]*)"/g, (_, attr, path) => `${attr}="/numberparrot/${path.replace(/^\.\//, "")}"`),
);
console.log("wrote docs/404.html");

// sitemap and robots ---------------------------------------------------------------
const urls = [SITE, ...GUIDES.map((g) => SITE + g.file)];
writeFileSync(
  "docs/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${PUBLISHED}</lastmod></url>`).join("\n")}
</urlset>
`,
);
writeFileSync("docs/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
writeFileSync("docs/.nojekyll", "");
console.log("wrote docs/sitemap.xml, docs/robots.txt, docs/.nojekyll");
