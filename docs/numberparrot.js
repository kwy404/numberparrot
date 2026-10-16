// src/chars.ts
var INVISIBLE = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
var SPACE = /\s+/g;
var MINUS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;
var PLUS = /[\uFB29\uFE62\uFF0B]/g;
var APOSTROPHE = /[`\u00B4\u02B9\u02BC\u2018\u2019\u201B\u2032\uFF07]/g;
var SINGLE = {
  "\uFF0E": ".",
  // full width full stop
  "\uFE52": ".",
  // small full stop
  "\uFF0C": ",",
  // full width comma
  "\uFE50": ",",
  // small comma
  "\uFF05": "%",
  // full width percent
  "\uFE6A": "%",
  // small percent
  "\u066A": "%",
  // Arabic percent sign
  "\u0609": "\u2030",
  // Arabic per mille sign
  "\uFF04": "$",
  // full width dollar
  "\uFFE0": "\xA2",
  // full width cent
  "\uFFE1": "\xA3",
  // full width pound
  "\uFFE5": "\xA5",
  // full width yen
  "\uFFE6": "\u20A9",
  // full width won
  "\uFF08": "(",
  // full width parenthesis
  "\uFE59": "(",
  "\uFF09": ")",
  "\uFE5A": ")"
};
var SINGLE_RE = /[\uFF04\uFFE0\uFFE1\uFFE5\uFFE6\uFF0E\uFE52\uFF0C\uFE50\uFF05\uFE6A\u066A\u0609\uFF08\uFE59\uFF09\uFE5A]/g;
var DECIMAL_DIGIT = /\p{Nd}/u;
var ANY_DIGIT = /\p{Nd}/gu;
var digitCache = /* @__PURE__ */ new Map();
function toAsciiDigit(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 48 && cp <= 57) return ch;
  let cached = digitCache.get(ch);
  if (cached === void 0) {
    let n = 0;
    while (n < 64 && DECIMAL_DIGIT.test(String.fromCodePoint(cp - n - 1))) n++;
    cached = String(n % 10);
    digitCache.set(ch, cached);
  }
  return cached;
}
function asciiDigits(input) {
  return input.replace(ANY_DIGIT, toAsciiDigit);
}
function foldChars(input) {
  return asciiDigits(
    input.replace(INVISIBLE, "").replace(SPACE, " ").replace(MINUS, "-").replace(PLUS, "+").replace(APOSTROPHE, "'").replace(SINGLE_RE, (c) => SINGLE[c])
  );
}
function prepare(input) {
  return foldChars(input).trim();
}
function isDigit(ch) {
  return ch !== void 0 && ch >= "0" && ch <= "9";
}

// src/currency.ts
var COMMON = "USD EUR GBP JPY CNY INR BRL CHF CAD AUD MXN RUB TRY PLN SEK NOK DKK CZK HUF EGP SAR AED IRR THB KRW HKD SGD NZD ZAR ILS ARS CLP COP PEN UAH IDR MYR PHP VND NGN KES PKR BDT TWD QAR KWD BHD OMR JOD MAD RON BGN ISK KZT".split(" ");
var tables = /* @__PURE__ */ new Map();
var digitsCache = /* @__PURE__ */ new Map();
function symbolOf(locale, code, display) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: display
    }).formatToParts(1);
    for (const p of parts) if (p.type === "currency") return prepare(p.value);
  } catch {
  }
  return null;
}
function addCodes(table, locale, codes) {
  for (const display of ["symbol", "narrowSymbol"]) {
    for (const code of codes) {
      const symbol = symbolOf(locale, code, display);
      if (symbol && !table.bySymbol.has(symbol)) table.bySymbol.set(symbol, code);
    }
  }
}
function tableFor(data) {
  const locale = data.info.locale;
  let table = tables.get(locale);
  if (!table) {
    table = { bySymbol: /* @__PURE__ */ new Map(), full: false };
    addCodes(table, locale, COMMON);
    tables.set(locale, table);
  }
  return table;
}
function allCurrencies() {
  const intl = Intl;
  try {
    return intl.supportedValuesOf ? intl.supportedValuesOf("currency") : COMMON;
  } catch {
    return COMMON;
  }
}
function isKnownCode(code) {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  if (COMMON.includes(code)) return true;
  return allCurrencies().includes(code);
}
function resolveCurrency(text, data) {
  const upper = text.toUpperCase();
  if (isKnownCode(upper)) return upper;
  const table = tableFor(data);
  const candidates = text.endsWith(".") ? [text, text.slice(0, -1)] : [text, text + "."];
  const lookup = () => {
    for (const c of candidates) {
      const code2 = table.bySymbol.get(c);
      if (code2) return code2;
    }
    return null;
  };
  let code = lookup();
  if (!code && !table.full) {
    table.full = true;
    addCodes(
      table,
      data.info.locale,
      allCurrencies().filter((c) => !COMMON.includes(c))
    );
    code = lookup();
  }
  return code;
}
function currencyDigits(code) {
  let digits = digitsCache.get(code);
  if (digits === void 0) {
    digits = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits;
    digitsCache.set(code, digits);
  }
  return digits;
}

// src/errors.ts
var NumberParseError = class extends Error {
  constructor(code, message, input, locale) {
    super(`${message} (input: ${JSON.stringify(String(input))}, locale: ${locale})`);
    this.name = "NumberParseError";
    this.code = code;
    this.input = input;
    this.locale = locale;
  }
};
function fail(code, message) {
  return { ok: false, code, message };
}

// src/core.ts
var DEFAULT_EXPONENTS = ["e", "E", "\xD710^", "x10^", "*10^"];
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var exponentCache = /* @__PURE__ */ new Map();
function exponentRe(exponent) {
  let re = exponentCache.get(exponent);
  if (!re) {
    const alts = [.../* @__PURE__ */ new Set([exponent, ...DEFAULT_EXPONENTS])].map(escapeRe).join("|");
    re = new RegExp(`^(.*\\d) ?(?:${alts}) ?([+-]?)(\\d+)$`);
    exponentCache.set(exponent, re);
  }
  return re;
}
var LETTER_OR_SYMBOL = /^[\p{L}\p{M}\p{Sc}.]+$/u;
var HAS_SYMBOL = /\p{Sc}/u;
var LETTERS = /[\p{L}\p{M}]/gu;
function validGrouping(groups) {
  if (groups.length < 2) return true;
  const first = groups[0].length;
  const last = groups[groups.length - 1].length;
  if (last !== 3 || first < 1) return false;
  if (groups.length === 2) return first <= 3;
  const size = groups[1].length;
  if (size !== 2 && size !== 3) return false;
  for (let i = 1; i < groups.length - 1; i++) if (groups[i].length !== size) return false;
  return first <= size;
}
function currencyLike(text, data, strict) {
  if (strict) return resolveCurrency(text, data) !== null;
  if (!LETTER_OR_SYMBOL.test(text) || text === "e" || text === "E") return false;
  if (HAS_SYMBOL.test(text)) return true;
  const letters = text.match(LETTERS)?.length ?? 0;
  if (letters === 0) return false;
  return letters <= 5 || resolveCurrency(text, data) !== null;
}
function scanAffix(text, isPrefix, state, data, strict) {
  let token = "";
  const flush = () => {
    if (token === "") return null;
    if (state.currency !== null) return fail("INVALID_AFFIX", `Unexpected text "${token}"`);
    if (!currencyLike(token, data, strict)) {
      return fail(
        strict ? "UNKNOWN_CURRENCY" : "INVALID_AFFIX",
        strict ? `Unknown currency "${token}"` : `Unexpected text "${token}"`
      );
    }
    state.currency = token;
    token = "";
    return null;
  };
  for (const ch of text) {
    if (ch === " " || ch === "(" || ch === ")" || ch === "-" || ch === "+" || ch === "%" || ch === "\u2030") {
      const f = flush();
      if (f) return f;
      if (ch === " ") continue;
      if (ch === "(" || ch === ")") {
        const opening = ch === "(";
        if (isPrefix !== opening || state.paren !== (opening ? 0 : 1)) {
          return fail("INVALID_SIGN", "Unbalanced parentheses");
        }
        state.paren = opening ? 1 : 2;
      } else if (ch === "-" || ch === "+") {
        if (state.negative || state.plus) return fail("INVALID_SIGN", "More than one sign");
        if (ch === "-") state.negative = true;
        else state.plus = true;
      } else {
        if (state.percent) return fail("INVALID_AFFIX", "More than one percent sign");
        state.percent = ch === "%" ? 2 : 3;
      }
    } else {
      token += ch;
    }
  }
  return flush();
}
function scan(raw, data, options = {}, seps = options.strict ? data.strict : data.loose) {
  const strict = options.strict === true;
  const s = prepare(raw);
  if (s === "") return fail("EMPTY", "Empty input");
  let start = -1;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    if (isDigit(s[i])) {
      if (start < 0) start = i;
      end = i + 1;
    }
  }
  if (start < 0) {
    const inf = s.indexOf("\u221E");
    if (inf < 0) return fail("NO_DIGITS", "No digits found");
    const state2 = { negative: false, plus: false, paren: 0, percent: 0, currency: null };
    const f2 = scanAffix(s.slice(0, inf), true, state2, data, strict) ?? scanAffix(s.slice(inf + 1), false, state2, data, strict);
    if (f2) return f2;
    if (state2.paren === 1) return fail("INVALID_SIGN", "Unbalanced parentheses");
    return {
      ok: true,
      negative: state2.negative || state2.paren === 2,
      int: "",
      frac: "",
      exp: 0,
      percent: state2.percent,
      currencyText: state2.currency,
      decimal: null,
      group: null,
      infinite: true
    };
  }
  const before = s[start - 1];
  if (before !== void 0 && seps.decimals.includes(before)) {
    const prev = s[start - 2];
    if (prev === void 0 || !/[\p{L}\p{M}]/u.test(prev)) start--;
  }
  const after = s[end];
  if (after !== void 0 && seps.decimals.includes(after)) end++;
  let body = s.slice(start, end);
  const prefix = s.slice(0, start);
  const suffix = s.slice(end);
  let exp = 0;
  const em = exponentRe(data.exponent).exec(body);
  if (em) {
    body = em[1];
    exp = Number(em[3]) * (em[2] === "-" ? -1 : 1);
  }
  const runs = [];
  const marks = [];
  let run2 = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (isDigit(ch)) {
      run2 += ch;
      continue;
    }
    if (!seps.decimals.includes(ch) && !seps.groups.includes(ch)) {
      const known = data.loose.decimals.includes(ch) || data.loose.groups.includes(ch);
      return known && strict ? fail("INVALID_SEPARATOR", `"${ch}" is not a separator of this locale`) : fail("INVALID_CHARACTER", `Unexpected character "${ch}"`);
    }
    if (run2 === "" && i > 0) return fail("INVALID_SEPARATOR", "Two separators in a row");
    runs.push(run2);
    marks.push(ch);
    run2 = "";
  }
  runs.push(run2);
  let decimalAt = -1;
  let group = null;
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    if (seps.decimals.includes(m)) {
      if (decimalAt >= 0) return fail("MULTIPLE_DECIMALS", "More than one decimal separator");
      decimalAt = i;
    } else {
      if (decimalAt >= 0) return fail("INVALID_GROUPING", "Group separator after the decimal separator");
      if (group !== null && group !== m) return fail("MIXED_GROUPS", "Different group separators mixed");
      group = m;
    }
  }
  const intRuns = decimalAt >= 0 ? runs.slice(0, decimalAt + 1) : runs;
  const frac = decimalAt >= 0 ? runs.slice(decimalAt + 1).join("") : "";
  if (group !== null && !options.looseGrouping && !validGrouping(intRuns)) {
    return fail("INVALID_GROUPING", "Group separators are in the wrong places");
  }
  if (strict && decimalAt >= 0 && (intRuns.join("") === "" || frac === "")) {
    return fail("INVALID_SEPARATOR", "Decimal separator without digits on both sides");
  }
  const state = { negative: false, plus: false, paren: 0, percent: 0, currency: null };
  const f = scanAffix(prefix, true, state, data, strict) ?? scanAffix(suffix, false, state, data, strict);
  if (f) return f;
  if (state.paren === 1) return fail("INVALID_SIGN", "Unbalanced parentheses");
  if (state.paren === 2 && (state.negative || state.plus)) {
    return fail("INVALID_SIGN", "Parentheses combined with a sign");
  }
  return {
    ok: true,
    negative: state.negative || state.paren === 2,
    int: intRuns.join(""),
    frac,
    exp,
    percent: state.percent,
    currencyText: state.currency,
    decimal: decimalAt >= 0 ? marks[decimalAt] : null,
    group,
    infinite: false
  };
}
function toNumber(scan2, keepPercent = false) {
  if (scan2.infinite) return scan2.negative ? -Infinity : Infinity;
  const shift = keepPercent ? 0 : scan2.percent;
  const text = `${scan2.negative ? "-" : ""}${scan2.int || "0"}.${scan2.frac || "0"}e${scan2.exp - shift}`;
  return Number(text);
}

// src/locale.ts
var cache = /* @__PURE__ */ new Map();
function partsOf(nf, value) {
  return nf.formatToParts(value);
}
function part(parts, type, fallback) {
  for (const p of parts) if (p.type === type) return p.value;
  return fallback;
}
function cacheKey(locale) {
  if (locale === void 0) return "";
  return typeof locale === "string" ? locale : locale.join(",");
}
function unique(values) {
  return values.filter((v, i) => v !== "" && values.indexOf(v) === i);
}
function localeData(locale) {
  const key = cacheKey(locale);
  const hit = cache.get(key);
  if (hit) return hit;
  const tags = locale === void 0 ? void 0 : typeof locale === "string" ? locale : [...locale];
  const nf = new Intl.NumberFormat(tags, { useGrouping: true });
  const resolved = nf.resolvedOptions();
  const main = partsOf(nf, -1234567.891);
  const plus = partsOf(new Intl.NumberFormat(tags, { signDisplay: "always" }), 1);
  const percent = partsOf(new Intl.NumberFormat(tags, { style: "percent" }), 0.5);
  const sci = partsOf(new Intl.NumberFormat(tags, { notation: "scientific" }), 12345);
  const plain = new Intl.NumberFormat(tags, { useGrouping: false, maximumFractionDigits: 0 });
  let digits = "";
  for (let d = 0; d < 10; d++) digits += plain.format(d);
  const info = {
    locale: resolved.locale,
    numberingSystem: resolved.numberingSystem,
    decimal: part(main, "decimal", "."),
    group: part(main, "group", ","),
    minusSign: part(main, "minusSign", "-"),
    plusSign: part(plus, "plusSign", "+"),
    percentSign: part(percent, "percentSign", "%"),
    exponent: part(sci, "exponentSeparator", "E"),
    digits
  };
  const decimal = prepare(info.decimal) || ".";
  const group = prepare(info.group) || " ";
  const exponent = prepare(info.exponent) || "E";
  const altDecimal = decimal === "\u066B" ? ["."] : [];
  const decimals = unique([decimal, ...altDecimal]);
  const altGroup = decimal === "," ? ["."] : decimal === "." ? [","] : ["\u066C", ","];
  const groups = unique([group, " ", "'", ...altGroup]).filter((g) => !decimals.includes(g));
  const data = {
    info,
    decimal,
    group,
    exponent,
    strict: { decimals: [decimal], groups: [group] },
    loose: { decimals, groups }
  };
  cache.set(key, data);
  return data;
}
function getLocaleInfo(locale) {
  return localeData(locale).info;
}

// src/parse.ts
function run(input, data, options) {
  const strict = options?.strict === true;
  if (typeof input !== "string") {
    if (strict) {
      throw new NumberParseError("NOT_A_STRING", "Expected a string or a number", input, data.info.locale);
    }
    return null;
  }
  const result2 = scan(input, data, options);
  if (!result2.ok) {
    if (strict) throw new NumberParseError(result2.code, result2.message, input, data.info.locale);
    return null;
  }
  return result2;
}
function parseWith(input, data, options) {
  if (typeof input === "number") {
    if (options?.strict && !Number.isFinite(input)) {
      throw new NumberParseError("OUT_OF_RANGE", "Number is not finite", input, data.info.locale);
    }
    return input;
  }
  const result2 = run(input, data, options);
  if (!result2) return NaN;
  const value = toNumber(result2, options?.keepPercent);
  if (options?.strict && !result2.infinite && !Number.isFinite(value)) {
    throw new NumberParseError("OUT_OF_RANGE", "Number is too large", input, data.info.locale);
  }
  return value;
}
function parse(input, locale, options) {
  return parseWith(input, localeData(locale), options);
}
function isValid(input, locale, options) {
  try {
    return !Number.isNaN(parseWith(input, localeData(locale), options));
  } catch {
    return false;
  }
}
var failed = (code, message) => ({ ok: false, value: NaN, code, message });
function tryParseWith(input, data, options) {
  if (typeof input === "number") {
    if (Number.isNaN(input)) return failed("NO_DIGITS", "The input is NaN");
    if (options?.strict && !Number.isFinite(input)) return failed("OUT_OF_RANGE", "Number is not finite");
    return { ok: true, value: input, code: null, message: null };
  }
  if (typeof input !== "string") return failed("NOT_A_STRING", "Expected a string or a number");
  const result2 = scan(input, data, options);
  if (!result2.ok) return failed(result2.code, result2.message);
  const value = toNumber(result2, options?.keepPercent);
  if (options?.strict && !result2.infinite && !Number.isFinite(value)) {
    return failed("OUT_OF_RANGE", "Number is too large");
  }
  return { ok: true, value, code: null, message: null };
}
function tryParse(input, locale, options) {
  return tryParseWith(input, localeData(locale), options);
}

// src/money.ts
function minorUnits(scan2, digits, strict, input, locale) {
  if (scan2.infinite) {
    if (strict) throw new NumberParseError("OUT_OF_RANGE", "Amount is not finite", input, locale);
    return NaN;
  }
  const all = scan2.int + scan2.frac;
  const point = scan2.int.length + scan2.exp - scan2.percent + digits;
  let whole;
  let rest;
  if (point <= 0) {
    whole = "0";
    rest = "0".repeat(-point) + all;
  } else if (point >= all.length) {
    whole = all + "0".repeat(point - all.length);
    rest = "";
  } else {
    whole = all.slice(0, point);
    rest = all.slice(point);
  }
  if (strict && /[1-9]/.test(rest)) {
    throw new NumberParseError(
      "PRECISION_LOSS",
      `More than ${digits} fraction digits for this currency`,
      input,
      locale
    );
  }
  let value = BigInt(whole || "0");
  if (rest !== "" && rest[0] >= "5") value += 1n;
  const out = Number(value);
  if (!Number.isSafeInteger(out)) {
    if (strict) throw new NumberParseError("OUT_OF_RANGE", "Amount is not a safe integer", input, locale);
    return NaN;
  }
  return scan2.negative && out !== 0 ? -out : out;
}
function scanNumber(value) {
  const m = /^(-?)(\d*)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(value));
  return {
    ok: true,
    negative: value < 0,
    int: m?.[2] ?? "",
    frac: m?.[3] ?? "",
    exp: m?.[4] ? Number(m[4]) : 0,
    percent: 0,
    currencyText: null,
    decimal: null,
    group: null,
    infinite: !Number.isFinite(value)
  };
}
function parseCurrencyWith(input, data, options) {
  const strict = options?.strict === true;
  const locale = data.info.locale;
  const fallback = options?.currency ? options.currency.toUpperCase() : null;
  const empty = {
    amount: NaN,
    currency: fallback,
    symbol: null,
    fractionDigits: fallback ? currencyDigits(fallback) : null
  };
  if (typeof input === "number") {
    const digits = empty.fractionDigits ?? 2;
    const amount2 = options?.toMinorUnits && !Number.isNaN(input) ? minorUnits(scanNumber(input), digits, strict, input, locale) : input;
    return { ...empty, amount: amount2 };
  }
  const scan2 = run(input, data, options);
  if (!scan2) return empty;
  let currency = fallback;
  if (scan2.currencyText !== null) {
    const found = resolveCurrency(scan2.currencyText, data);
    if (strict && found === null) {
      throw new NumberParseError("UNKNOWN_CURRENCY", `Unknown currency "${scan2.currencyText}"`, input, locale);
    }
    if (strict && fallback && found && found !== fallback) {
      throw new NumberParseError(
        "CURRENCY_MISMATCH",
        `Expected ${fallback} but found ${found}`,
        input,
        locale
      );
    }
    currency = found ?? fallback;
  }
  const fractionDigits = currency ? currencyDigits(currency) : null;
  const amount = options?.toMinorUnits ? minorUnits(scan2, fractionDigits ?? 2, strict, input, locale) : toNumber(scan2);
  return { amount, currency, symbol: scan2.currencyText, fractionDigits };
}
function parseCurrency(input, locale, options) {
  return parseCurrencyWith(input, localeData(locale), options);
}

// src/detect.ts
var DEFAULT_CANDIDATES = [
  "en-US",
  "en-GB",
  "en-IN",
  "pt-BR",
  "es-ES",
  "es-MX",
  "de-DE",
  "de-CH",
  "fr-FR",
  "it-IT",
  "nl-NL",
  "ru-RU",
  "pl-PL",
  "sv-SE",
  "tr-TR",
  "ja-JP",
  "zh-CN",
  "ko-KR",
  "hi-IN",
  "th-TH",
  "id-ID",
  "ar-EG",
  "fa-IR"
];
var NATIVE = {
  ".": [","],
  ",": ["."]
};
function separators(decimal, group) {
  const decimals = decimal ? [decimal] : [];
  const groups = group ? [group] : [];
  return { decimals, groups };
}
function valueFor(text, data, decimal, group) {
  const result2 = scan(text, data, {}, separators(decimal, group));
  return result2.ok ? toNumber(result2) : NaN;
}
function compatible(data, decimal, group) {
  if (decimal !== null && !data.loose.decimals.includes(decimal)) return 0;
  if (group !== null && !data.loose.groups.includes(group)) return 0;
  const exactDecimal = decimal === null || data.decimal === decimal;
  const exactGroup = group === null || data.group === group;
  return exactDecimal && exactGroup ? 2 : 1;
}
function result(value, decimal, group, ambiguous, confidence, reason, locales, alternatives) {
  return { value, decimal, group, ambiguous, confidence, reason, locales, alternatives };
}
function detect(input, candidates = DEFAULT_CANDIDATES) {
  const datas = candidates.map((c) => localeData(c));
  const first = datas[0] ?? localeData("en-US");
  const text = typeof input === "string" ? input : String(input);
  const s = prepare(text);
  const firstDigit = s.search(/\d/);
  if (firstDigit < 0) {
    return result(NaN, null, null, false, 0, "No digits found", [], []);
  }
  let lastDigit = s.length - 1;
  while (!isDigit(s[lastDigit])) lastDigit--;
  let body = s.slice(firstDigit, lastDigit + 1).replace(/ ?(?:[eE]|\u00D710\^) ?[+-]?\d+$/, "");
  body = body.replace(/ ?\u0623\u0633 ?[+-]?\d+$/, "");
  const marks = [];
  const runs = body.split(/[^\d]/);
  const seps = body.replace(/\d/g, "");
  for (let i = 0; i < seps.length; i++) {
    marks.push({ ch: seps[i], after: runs[i + 1].length });
  }
  const kinds = [...new Set(seps)];
  const allowed = [".", ",", "'", " ", "\u066B", "\u066C"];
  const invalid = kinds.find((k) => !allowed.includes(k));
  if (invalid !== void 0 || runs.some((r, i) => r === "" && i > 0)) {
    return result(NaN, null, null, false, 0, `"${invalid ?? seps}" cannot appear inside a number`, [], []);
  }
  const script = [...new Set(text.match(/\p{Nd}/gu) ?? [])].filter((d) => !isDigit(d));
  const rank = (decimal, group2) => datas.map((d, i) => ({
    locale: candidates[i],
    score: compatible(d, decimal, group2),
    native: script.length > 0 && script.every((ch) => d.info.digits.includes(ch)) ? 1 : 0,
    i
  })).filter((r) => r.score > 0).sort((a, b) => b.native - a.native || b.score - a.score || a.i - b.i).map((r) => r.locale);
  const finish = (decimal, group2, confidence, reason) => {
    const value = valueFor(text, first, decimal, group2);
    if (Number.isNaN(value)) {
      return result(NaN, decimal, group2, false, 0, "Separators are not positioned like any number format", [], []);
    }
    const ranked = rank(decimal, group2);
    return result(value, decimal, group2, false, confidence, reason, ranked, [value]);
  };
  if (kinds.length === 0) return finish(null, null, 1, "No separators: a whole number");
  if (kinds.includes("\u066B") || kinds.includes("\u066C")) {
    return finish(
      kinds.includes("\u066B") ? "\u066B" : null,
      kinds.includes("\u066C") ? "\u066C" : null,
      1,
      "Arabic decimal and group separators are unambiguous"
    );
  }
  const dots = kinds.filter((k) => k === "." || k === ",");
  const others = kinds.filter((k) => k === " " || k === "'");
  const lastMark = marks[marks.length - 1];
  if (dots.length === 2) {
    const decimal = [...seps].reverse().find((c) => c === "." || c === ",");
    const group2 = NATIVE[decimal][0];
    return finish(
      decimal,
      others.length ? null : group2,
      0.95,
      `Both "." and "," appear; the last one, "${decimal}", is the decimal separator`
    );
  }
  if (dots.length === 1) {
    const c = dots[0];
    const count = [...seps].filter((x) => x === c).length;
    const otherGroup = others.length === 1 ? others[0] : null;
    if (others.length > 1) return finish(c, null, 0, "Mixed group separators");
    if (otherGroup !== null) {
      return finish(c, otherGroup, 0.95, `"${otherGroup}" groups digits, so "${c}" is the decimal separator`);
    }
    if (count > 1) {
      return finish(
        NATIVE[c][0],
        c,
        0.9,
        `"${c}" repeats, so it separates groups of digits`
      );
    }
    const intDigits = runs[0].length;
    const after = lastMark.after;
    if (after !== 3) {
      return finish(c, null, 0.9, `"${c}" is followed by ${after} digit${after === 1 ? "" : "s"}, so it is the decimal separator`);
    }
    if (intDigits === 0 || runs[0] === "0" || intDigits > 3) {
      return finish(
        c,
        null,
        0.85,
        intDigits > 3 ? `"${c}" follows more than 3 digits, so it cannot separate thousands` : `"${c}" follows a zero, so it is the decimal separator`
      );
    }
    const asDecimal = valueFor(text, first, c, null);
    const asGroup = valueFor(text, first, NATIVE[c][0], c);
    const groupFirst = first.decimal !== c;
    const best = groupFirst ? asGroup : asDecimal;
    const decimal = groupFirst ? NATIVE[c][0] : c;
    const group2 = groupFirst ? c : null;
    const ranked = rank(decimal, group2);
    return result(
      best,
      groupFirst ? null : c,
      group2,
      true,
      0.5,
      `"${c}" followed by exactly 3 digits can be a thousands or a decimal separator; ${candidates[0] ?? "en-US"} reads it as ${groupFirst ? "thousands" : "decimal"}`,
      ranked,
      [best, groupFirst ? asDecimal : asGroup]
    );
  }
  if (others.length > 1) return finish(null, null, 0, "Mixed group separators");
  const group = others[0];
  const runsOk = validGrouping(runs);
  return finish(null, group, runsOk ? 0.9 : 0, `"${group}" separates groups of digits in a whole number`);
}

// src/column.ts
var OTHER = { ".": ",", ",": "." };
var round = (n) => Math.round(n * 100) / 100;
function vote(decimal, group) {
  if (decimal !== null) return decimal;
  if (group !== null && OTHER[group]) return OTHER[group];
  return null;
}
function parseColumn(values, candidates = DEFAULT_CANDIDATES) {
  const cells = Array.from(values, (v) => typeof v === "string" ? v : v == null ? "" : String(v));
  const datas = candidates.map((c) => localeData(c));
  const tally = /* @__PURE__ */ new Map();
  const groups = /* @__PURE__ */ new Map();
  let anyNumber = false;
  let anyAmbiguous = false;
  cells.forEach((cell, i) => {
    if (cell.trim() === "") return;
    const found = detect(cell, candidates);
    if (Number.isNaN(found.value)) return;
    anyNumber = true;
    if (found.group !== null) groups.set(found.group, (groups.get(found.group) ?? 0) + 1);
    if (found.ambiguous) {
      anyAmbiguous = true;
      return;
    }
    const mark = vote(found.decimal, found.group);
    if (mark === null) return;
    const entry = tally.get(mark) ?? { weight: 0, count: 0, first: i };
    entry.weight += found.confidence;
    entry.count++;
    tally.set(mark, entry);
  });
  const blank = cells.map(() => NaN);
  if (!anyNumber) {
    return {
      values: blank,
      locale: null,
      decimal: null,
      ambiguous: false,
      confidence: 0,
      reason: "No cell is a number",
      invalid: cells.flatMap((c, i) => c.trim() === "" ? [] : [i])
    };
  }
  const first = datas[0] ?? localeData("en-US");
  let decimal = first.decimal;
  let confidence = anyAmbiguous ? 0.5 : 1;
  let reason = anyAmbiguous ? `No cell settles the format; ${candidates[0] ?? "en-US"} reads "${first.decimal}" as the decimal separator` : "Whole numbers only: every format reads them the same";
  let total = 0;
  for (const entry of tally.values()) total += entry.count;
  if (total > 0) {
    const ranked = [...tally.entries()].sort((a, b) => b[1].weight - a[1].weight || a[1].first - b[1].first);
    const [mark, best] = ranked[0];
    decimal = mark;
    confidence = round(best.weight / best.count * (best.count / total));
    const cell = JSON.stringify(cells[best.first]);
    reason = ranked.length > 1 ? `${best.count} of ${total} cells use "${mark}" as the decimal separator, for example ${cell}` : `${cell} (row ${best.first + 1}) shows that "${mark}" is the decimal separator`;
  }
  let group = null;
  let groupCount = 0;
  for (const [g, n] of groups) {
    if (n > groupCount && g !== decimal) {
      group = g;
      groupCount = n;
    }
  }
  let pick = -1;
  let pickScore = -1;
  datas.forEach((data2, i) => {
    if (!data2.loose.decimals.includes(decimal)) return;
    let read = 0;
    for (const cell of cells) if (cell.trim() !== "" && !Number.isNaN(parseWith(cell, data2))) read++;
    const score = read * 4 + (data2.decimal === decimal ? 2 : 0) + (data2.group === group ? 1 : 0);
    if (score > pickScore) {
      pick = i;
      pickScore = score;
    }
  });
  const data = pick >= 0 ? datas[pick] : first;
  const locale = pick >= 0 ? candidates[pick] : candidates[0] ?? data.info.locale;
  const out = cells.map((cell) => cell.trim() === "" ? NaN : parseWith(cell, data));
  const invalid = out.flatMap((v, i) => Number.isNaN(v) && cells[i].trim() !== "" ? [i] : []);
  if (invalid.length > 0) {
    confidence = round(confidence * (1 - invalid.length / cells.filter((c) => c.trim() !== "").length));
  }
  return {
    values: out,
    locale,
    decimal: pick >= 0 ? decimal : data.decimal,
    ambiguous: total === 0 && anyAmbiguous,
    confidence,
    reason,
    invalid
  };
}

// src/input.ts
var COMPLETIONS = ["", "0", "00", "000"];
function normalizeInputWith(value, data, options) {
  const { decimals, groups } = data.loose;
  const allowNegative = options?.allowNegative !== false;
  const maxFraction = options?.maxFractionDigits;
  const chars = foldChars(String(value ?? "")).replace(/^ +/, "");
  let text = "";
  let negative = false;
  let seenDecimal = false;
  let fractionDigits = 0;
  let digits = "";
  let fraction = "";
  for (const ch of chars) {
    const last = text[text.length - 1];
    if (isDigit(ch)) {
      if (seenDecimal) {
        if (maxFraction !== void 0 && fractionDigits >= maxFraction) continue;
        fractionDigits++;
        fraction += ch;
      } else {
        digits += ch;
      }
      text += ch;
    } else if (ch === "-") {
      if (allowNegative && text === "") {
        text = "-";
        negative = true;
      }
    } else if (decimals.includes(ch)) {
      if (!seenDecimal && (maxFraction === void 0 || maxFraction > 0)) {
        seenDecimal = true;
        text += ch;
      }
    } else if (groups.includes(ch)) {
      if (!seenDecimal && isDigit(last)) text += ch;
    }
  }
  const sign = negative ? "-" : "";
  const partialValue = digits === "" && fraction === "" ? NaN : Number(`${sign}${digits || "0"}.${fraction || "0"}`);
  if (text === "" || text === "-") {
    return { text, value: NaN, valid: true, complete: false };
  }
  const done = scan(text, data);
  if (done.ok && !/[^\d]$/.test(text)) {
    return { text, value: toNumber(done), valid: true, complete: true };
  }
  const valid = COMPLETIONS.some((tail) => scan(text + tail, data).ok);
  return { text, value: partialValue, valid, complete: false };
}
function normalizeInput(value, locale, options) {
  return normalizeInputWith(value, localeData(locale), options);
}

// src/parser.ts
function createParser(locale, options) {
  const data = localeData(locale);
  return {
    info: data.info,
    parse: (input) => parseWith(input, data, options),
    tryParse: (input) => tryParseWith(input, data, options),
    isValid: (input) => {
      try {
        return !Number.isNaN(parseWith(input, data, options));
      } catch {
        return false;
      }
    },
    parseCurrency: (input, extra) => parseCurrencyWith(input, data, {
      strict: options?.strict,
      looseGrouping: options?.looseGrouping,
      ...extra
    }),
    normalizeInput: (value, extra) => normalizeInputWith(value, data, extra)
  };
}

export { DEFAULT_CANDIDATES, NumberParseError, createParser, detect, getLocaleInfo, isValid, normalizeInput, parse, parseColumn, parseCurrency, tryParse };
