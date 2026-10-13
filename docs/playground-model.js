// Pure playground logic shared by the browser (app.js) and the docs build
// (scripts/build-docs.mjs prerenders the first result into the static HTML).
import { detect, getLocaleInfo, parse, parseCurrency } from "./numberparrot.js";

const fmt = (n) => (Object.is(n, -0) ? "-0" : String(n));
const visible = (s) => (/^\s$/.test(s) ? `space U+${s.codePointAt(0).toString(16).toUpperCase()}` : s);

/** Everything the playground shows for one input. Pure: no DOM, no side effects. */
export function analyze(text, choice) {
  const value = String(text ?? "");
  const found = detect(value);
  const locale = choice === "auto" ? found.locales[0] || "en-US" : choice;
  const expected = parse(value, locale);
  const same = (n) => (Number.isNaN(n) && Number.isNaN(expected)) || n === expected;
  const native = (n) => ({
    value: fmt(n),
    state: same(n) ? "right" : "wrong",
    note: same(n) ? "matches" : "wrong number",
  });
  const info = getLocaleInfo(locale);
  const money = parseCurrency(value, locale);
  return {
    pf: native(parseFloat(value)),
    num: native(Number(value)),
    parse: {
      value: fmt(expected),
      state: Number.isNaN(expected) ? "wrong" : "right",
      note: `locale ${info.locale}: decimal "${visible(info.decimal)}", group "${visible(info.group)}"`,
    },
    currency: {
      value: money.currency ? `${fmt(money.amount)} ${money.currency}` : fmt(money.amount),
      state: Number.isNaN(money.amount) ? "wrong" : "right",
      note: money.symbol ? `symbol "${money.symbol}"` : "no currency in the input",
    },
    detect: {
      value: fmt(found.value),
      state: found.ambiguous || Number.isNaN(found.value) ? "wrong" : "right",
      note: `${found.ambiguous ? "ambiguous, " : ""}confidence ${found.confidence}. ${found.reason}`,
    },
    format: {
      value: Number.isFinite(expected)
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(expected)
        : "n/a",
      note: `Intl.NumberFormat("${locale}").format(result)`,
    },
  };
}

/** Initial state of a playground block. */
export function playground(text = "1.234,56", locale = "pt-BR") {
  return { text, locale, r: analyze(text, locale) };
}
