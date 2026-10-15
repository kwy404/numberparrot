// Content of the guide pages. Each body is plain HTML; scripts/build-docs.mjs wraps it
// in the reference layout, adds heading anchors and a table of contents, and
// scripts/highlight-docs.mjs turns every <pre data-lang> block into a code frame.
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A code example, highlighted later by scripts/highlight-docs.mjs. */
export const code = (text, lang = "ts", title = lang === "sh" ? "Terminal" : `example.${lang}`) =>
  `<pre data-lang="${lang}" data-title="${esc(title)}"><code>${esc(text.trim())}</code></pre>`;

export const GUIDES = [
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
];
