import { prepare } from "./chars";
import type { LocaleData } from "./locale";

/**
 * Currencies probed first when mapping a symbol back to an ISO 4217 code.
 * Order matters: an ambiguous narrow symbol such as "$" resolves to the first
 * currency in this list whose symbol matches, unless the locale itself prints
 * another currency with exactly that symbol (for example "$" is CAD in en-CA).
 */
const COMMON = (
  "USD EUR GBP JPY CNY INR BRL CHF CAD AUD MXN RUB TRY PLN SEK NOK DKK CZK HUF EGP " +
  "SAR AED IRR THB KRW HKD SGD NZD ZAR ILS ARS CLP COP PEN UAH IDR MYR PHP VND NGN " +
  "KES PKR BDT TWD QAR KWD BHD OMR JOD MAD RON BGN ISK KZT"
).split(" ");

interface CurrencyTable {
  /** Symbol (canonical form) to ISO code, filled with the common list. */
  readonly bySymbol: Map<string, string>;
  /** True once every currency known to the runtime has been added. */
  full: boolean;
}

const tables = new Map<string, CurrencyTable>();
const digitsCache = new Map<string, number>();

function symbolOf(locale: string, code: string, display: "symbol" | "narrowSymbol"): string | null {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: display,
    }).formatToParts(1);
    for (const p of parts) if (p.type === "currency") return prepare(p.value);
  } catch {
    // narrowSymbol is missing on very old engines; ignore.
  }
  return null;
}

function addCodes(table: CurrencyTable, locale: string, codes: readonly string[]): void {
  for (const display of ["symbol", "narrowSymbol"] as const) {
    for (const code of codes) {
      const symbol = symbolOf(locale, code, display);
      if (symbol && !table.bySymbol.has(symbol)) table.bySymbol.set(symbol, code);
    }
  }
}

function tableFor(data: LocaleData): CurrencyTable {
  const locale = data.info.locale;
  let table = tables.get(locale);
  if (!table) {
    table = { bySymbol: new Map(), full: false };
    addCodes(table, locale, COMMON);
    tables.set(locale, table);
  }
  return table;
}

function allCurrencies(): readonly string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  try {
    return intl.supportedValuesOf ? intl.supportedValuesOf("currency") : COMMON;
  } catch {
    return COMMON;
  }
}

/** True when `code` looks like an ISO 4217 code known to the runtime. */
function isKnownCode(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  if (COMMON.includes(code)) return true;
  return allCurrencies().includes(code);
}

/**
 * Maps currency text found next to a number ("R$", "\u20AC", "CHF", "kr.")
 * to an ISO 4217 code for the given locale, or `null` when unknown.
 * @internal
 */
export function resolveCurrency(text: string, data: LocaleData): string | null {
  const upper = text.toUpperCase();
  if (isKnownCode(upper)) return upper;
  const table = tableFor(data);
  const candidates = text.endsWith(".") ? [text, text.slice(0, -1)] : [text, text + "."];
  const lookup = (): string | null => {
    for (const c of candidates) {
      const code = table.bySymbol.get(c);
      if (code) return code;
    }
    return null;
  };
  let code = lookup();
  if (!code && !table.full) {
    table.full = true;
    addCodes(
      table,
      data.info.locale,
      allCurrencies().filter((c) => !COMMON.includes(c)),
    );
    code = lookup();
  }
  return code;
}

/**
 * Number of minor unit digits for a currency (2 for USD, 0 for JPY, 3 for BHD).
 * @internal
 */
export function currencyDigits(code: string): number {
  let digits = digitsCache.get(code);
  if (digits === undefined) {
    digits = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions()
      .maximumFractionDigits as number;
    digitsCache.set(code, digits);
  }
  return digits;
}
