// Pure logic of the world board, the departures board and the locale picker.
// Shared by the browser (app.js) and the docs build (scripts/build-docs.mjs), which
// prerenders the first state of every widget into the static HTML.
import { detect, getLocaleInfo, parse, parseCurrency } from "./numberparrot.js";

/** 39 locales grouped by region: [locale, airport code, city, currency]. */
export const REGIONS = [
  {
    id: "americas",
    name: "The Americas",
    places: [
      ["en-US", "JFK", "New York", "USD"],
      ["en-CA", "YYZ", "Toronto", "CAD"],
      ["fr-CA", "YUL", "Montréal", "CAD"],
      ["es-MX", "MEX", "Mexico City", "MXN"],
      ["pt-BR", "GRU", "São Paulo", "BRL"],
      ["es-AR", "EZE", "Buenos Aires", "ARS"],
      ["es-CO", "BOG", "Bogotá", "COP"],
      ["es-CL", "SCL", "Santiago", "CLP"],
    ],
  },
  {
    id: "europe",
    name: "Europe",
    places: [
      ["en-GB", "LHR", "London", "GBP"],
      ["de-DE", "BER", "Berlin", "EUR"],
      ["fr-FR", "CDG", "Paris", "EUR"],
      ["es-ES", "MAD", "Madrid", "EUR"],
      ["it-IT", "FCO", "Rome", "EUR"],
      ["nl-NL", "AMS", "Amsterdam", "EUR"],
      ["pt-PT", "LIS", "Lisbon", "EUR"],
      ["de-CH", "ZRH", "Zürich", "CHF"],
      ["sv-SE", "ARN", "Stockholm", "SEK"],
      ["pl-PL", "WAW", "Warsaw", "PLN"],
      ["cs-CZ", "PRG", "Prague", "CZK"],
      ["uk-UA", "KBP", "Kyiv", "UAH"],
      ["ru-RU", "SVO", "Moscow", "RUB"],
      ["tr-TR", "IST", "Istanbul", "TRY"],
    ],
  },
  {
    id: "mea",
    name: "Middle East and Africa",
    places: [
      ["ar-EG", "CAI", "Cairo", "EGP"],
      ["ar-SA", "RUH", "Riyadh", "SAR"],
      ["fa-IR", "IKA", "Tehran", "IRR"],
      ["he-IL", "TLV", "Tel Aviv", "ILS"],
      ["sw-KE", "NBO", "Nairobi", "KES"],
      ["en-ZA", "JNB", "Johannesburg", "ZAR"],
    ],
  },
  {
    id: "south-asia",
    name: "South Asia",
    places: [
      ["en-IN", "BOM", "Mumbai", "INR"],
      ["hi-IN", "DEL", "Delhi", "INR"],
      ["bn-BD", "DAC", "Dhaka", "BDT"],
      ["ur-PK", "KHI", "Karachi", "PKR"],
    ],
  },
  {
    id: "asia-pacific",
    name: "East Asia and Pacific",
    places: [
      ["ja-JP", "HND", "Tokyo", "JPY"],
      ["zh-CN", "PVG", "Shanghai", "CNY"],
      ["ko-KR", "ICN", "Seoul", "KRW"],
      ["th-TH", "BKK", "Bangkok", "THB"],
      ["vi-VN", "HAN", "Hanoi", "VND"],
      ["id-ID", "CGK", "Jakarta", "IDR"],
      ["en-AU", "SYD", "Sydney", "AUD"],
    ],
  },
];

export const PLACES = REGIONS.flatMap((region) =>
  region.places.map(([locale, iata, city, currency]) => ({ locale, iata, city, currency, region: region.id })),
);

export const MODES = {
  number: { a: "parseFloat", b: "numberparrot", hint: "Type a number in any format. Every tile writes it the local way, then reads it back." },
  currency: { a: "parseFloat", b: "parseCurrency", hint: "Every tile prints the amount in its own currency, then reads the price back." },
  detect: { a: "Written back", b: "Reading", hint: "Type a string as you found it. Every tile reads it the way its locale would." },
};

export const EXAMPLES = {
  number: ["1234567.891", "-98765.4321", "0.5", "1.234,56"],
  currency: ["1234.56", "19.99", "-250", "1000000"],
  detect: ["1,234", "1.234,56", "1 234,5", "12,34,567.89", "١٬٢٣٤٫٥٦", "(1.234,56)", "1'234.5"],
};

const cache = new Map();
function nf(locale, options) {
  const key = locale + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}

/** A number as JavaScript prints it, keeping -0 and NaN visible. */
export const show = (n) => (Object.is(n, -0) ? "-0" : String(n));
// Intl wraps some signs and currencies in invisible bidi marks; they do not belong on screen.
const clean = (s) => s.replace(/[؜‎‏]/g, "");

/** The number the visitor means, whatever format they typed it in. */
export function readNumber(text) {
  const t = String(text ?? "").trim();
  if (t === "") return { value: NaN, note: "Type a number to fill the board." };
  const n = Number(t);
  if (Number.isFinite(n)) return { value: n, note: "" };
  const d = detect(t);
  if (Number.isFinite(d.value)) return { value: d.value, note: `Read "${t}" as ${show(d.value)} first.` };
  return { value: NaN, note: `"${t}" is not a number in any locale on the board.` };
}

function numberTile(place, value) {
  const s = clean(nf(place.locale, { maximumFractionDigits: 20 }).format(value));
  const pf = parseFloat(s);
  const np = parse(s, place.locale);
  return { s, a: show(pf), as: pf === value ? "ok" : "bad", b: show(np), bs: np === value ? "ok" : "bad" };
}

function currencyTile(place, value) {
  const f = nf(place.locale, { style: "currency", currency: place.currency });
  const digits = f.resolvedOptions().maximumFractionDigits;
  const expected = Number(value.toFixed(digits));
  const s = clean(f.format(value));
  const pf = parseFloat(s);
  const money = parseCurrency(s, place.locale);
  const right = money.amount === expected && money.currency === place.currency;
  return {
    s,
    a: show(pf),
    as: pf === expected ? "ok" : "bad",
    b: Number.isNaN(money.amount) ? "NaN" : `${show(money.amount)} ${money.currency ?? ""}`.trim(),
    bs: right ? "ok" : "bad",
  };
}

function detectTile(place, text, best) {
  const value = parse(text, place.locale);
  if (Number.isNaN(value)) return { s: "NaN", a: "not a number here", as: "muted", b: "Rejected", bs: "bad" };
  const back = clean(nf(place.locale, { maximumFractionDigits: 20 }).format(value));
  const same = value === best;
  return { s: show(value), a: back, as: "muted", b: same ? "Best guess" : "Other reading", bs: same ? "ok" : "alt" };
}

/** Everything the world board shows for one input and mode. Pure. */
export function computeBoard(text, mode = "number") {
  const m = MODES[mode] ? mode : "number";
  const out = { mode: m, labels: MODES[m], note: "", tiles: [], wrong: 0, right: 0, total: PLACES.length, summary: "", bubble: "", detect: null };
  if (m === "detect") {
    const t = String(text ?? "");
    const d = detect(t);
    out.tiles = PLACES.map((place) => detectTile(place, t, d.value));
    const readings = new Map();
    out.tiles.forEach((tile) => {
      if (tile.s !== "NaN") readings.set(tile.s, (readings.get(tile.s) || 0) + 1);
    });
    out.right = out.tiles.filter((x) => x.bs === "ok").length;
    out.wrong = out.tiles.filter((x) => x.bs === "alt").length;
    const confidence = Number.isNaN(d.value) ? 0 : Math.round(d.confidence * 100);
    out.detect = {
      value: show(d.value),
      ambiguous: d.ambiguous,
      confidence,
      reason: d.reason,
      verdict: Number.isNaN(d.value) ? "Not a number" : d.ambiguous ? "Ambiguous" : "Clear",
      readings: [...readings].map(([value, count]) => ({ value, count, best: value === show(d.value) })),
      decimal: d.decimal ?? "none",
      group: d.group ?? "none",
    };
    out.bubble = Number.isNaN(d.value) ? "NaN?" : d.ambiguous ? `${show(d.value)}?` : `${show(d.value)}!`;
    out.summary = Number.isNaN(d.value)
      ? "No locale on the board reads this as a number."
      : d.ambiguous
        ? `Ambiguous: ${out.right} locales read ${show(d.value)}, ${out.wrong} read something else.`
        : `${out.right} of ${out.total} locales read ${show(d.value)}.`;
    return out;
  }
  const { value, note } = readNumber(text);
  out.note = note;
  if (Number.isNaN(value)) {
    out.tiles = PLACES.map(() => ({ s: "...", a: "", as: "muted", b: "", bs: "muted" }));
    out.summary = note;
    out.bubble = "NaN?";
    return out;
  }
  out.tiles = PLACES.map((place) => (m === "currency" ? currencyTile(place, value) : numberTile(place, value)));
  out.bubble = `${show(value)}!`;
  out.wrong = out.tiles.filter((x) => x.as === "bad").length;
  out.right = out.tiles.filter((x) => x.bs === "ok").length;
  out.summary = `parseFloat is wrong in ${out.wrong} of ${out.total} locales. ${m === "currency" ? "parseCurrency" : "numberparrot"} reads ${out.right === out.total ? "every one" : `${out.right}`} back.`;
  return out;
}

/** Initial state of the world board. */
export function boardState(text = EXAMPLES.number[0], mode = "number") {
  return { text, mode, b: computeBoard(text, mode) };
}

// Departures board --------------------------------------------------------------------
// Flights: a number leaves its locale written the local way. Status is what parseFloat
// did with it: ON TIME (right), DIVERTED (a wrong number) or CANCELLED (NaN).
const FLIGHTS = [
  ["pt-BR", 1234.56, "decimal"],
  ["de-CH", 1234567.89, "decimal"],
  ["en-IN", 1234567.89, "decimal"],
  ["fr-FR", 1234.5, "currency"],
  ["ar-EG", 1234.56, "decimal"],
  ["en-US", 1234.56, "currency"],
  ["sv-SE", -42.5, "decimal"],
  ["ja-JP", 1235, "currency"],
  ["en-AU", 42.5, "decimal"],
  ["de-DE", -1234.56, "decimal"],
  ["en-GB", 0.25, "percent"],
  ["fa-IR", 123.45, "decimal"],
  ["es-AR", 98765.43, "decimal"],
  ["tr-TR", 0.15, "percent"],
  ["ru-RU", 1500000, "decimal"],
  ["th-TH", 1234.5, "decimal"],
  ["it-IT", 19.99, "currency"],
  ["en-CA", 1234.56, "decimal"],
  ["pl-PL", 2500.75, "decimal"],
];

export function departures() {
  return FLIGHTS.map(([locale, value, style], i) => {
    const place = PLACES.find((p) => p.locale === locale);
    const options =
      style === "currency"
        ? { style: "currency", currency: place.currency }
        : style === "percent"
          ? { style: "percent" }
          : { maximumFractionDigits: 20 };
    const s = clean(nf(locale, options).format(value));
    const pf = parseFloat(s);
    const np = style === "currency" ? parseCurrency(s, locale).amount : parse(s, locale);
    const hh = String(6 + Math.floor((i * 37) / 60)).padStart(2, "0");
    const mm = String((i * 37) % 60).padStart(2, "0");
    return {
      time: `${hh}:${mm}`,
      flight: `${place.iata} ${String(100 + i * 47).slice(-3)}`,
      from: place.city.toUpperCase(),
      locale,
      written: s,
      pf: show(pf),
      np: show(np),
      status: pf === value ? "ON TIME" : Number.isNaN(pf) ? "CANCELLED" : "DIVERTED",
    };
  });
}

// Locale picker ---------------------------------------------------------------------------
const NAMES = { " ": "space", " ": "no-break space", " ": "narrow no-break space", "'": "apostrophe", "’": "apostrophe", "−": "minus sign U+2212" };
const nice = (ch) => (NAMES[ch] ? `${NAMES[ch]}` : ch);

/** What the locale picker card shows for one locale and one test string. */
export function localeCard(locale, text = "") {
  const place = PLACES.find((p) => p.locale === locale) || PLACES[0];
  const info = getLocaleInfo(place.locale);
  const t = String(text ?? "");
  const value = t.trim() === "" ? NaN : parse(t, place.locale);
  return {
    locale: place.locale,
    title: `${place.city} (${place.iata})`,
    decimal: nice(info.decimal),
    group: nice(info.group),
    minus: info.minusSign === "-" ? "hyphen minus" : nice(info.minusSign),
    digits: info.digits.slice(0, 10),
    system: info.numberingSystem,
    sample: clean(nf(place.locale, { maximumFractionDigits: 2 }).format(1234567.89)),
    money: clean(nf(place.locale, { style: "currency", currency: place.currency }).format(-1234.5)),
    example: clean(nf(place.locale, { maximumFractionDigits: 2 }).format(1234.56)),
    result: t.trim() === "" ? "Type a number" : show(value),
    ok: t.trim() !== "" && !Number.isNaN(value),
  };
}
