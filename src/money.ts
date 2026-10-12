import { type Scan, toNumber } from "./core";
import { currencyDigits, resolveCurrency } from "./currency";
import { NumberParseError } from "./errors";
import { type LocaleData, type LocaleInput, localeData } from "./locale";
import { type ParseOptions, run } from "./parse";

/** Options accepted by {@link parseCurrency}. */
export interface CurrencyOptions extends Omit<ParseOptions, "keepPercent"> {
  /**
   * Return the amount as an integer number of minor units (cents for USD,
   * yen for JPY, fils for BHD) instead of a floating point amount. The
   * conversion is done on the decimal digits, never with `* 100`.
   * Extra digits are rounded half away from zero; in `strict` mode they throw.
   */
  readonly toMinorUnits?: boolean | undefined;
  /**
   * ISO 4217 code to assume when the input has no currency, for example `"BRL"`.
   * In `strict` mode a different currency in the input throws `CURRENCY_MISMATCH`.
   */
  readonly currency?: string | undefined;
}

/** Result of {@link parseCurrency}. */
export interface CurrencyResult {
  /** The amount, or an integer of minor units with `toMinorUnits`. `NaN` when invalid. */
  readonly amount: number;
  /** ISO 4217 code, or `null` when no currency was found or recognized. */
  readonly currency: string | null;
  /** The currency text exactly as found in the input (canonical form), or `null`. */
  readonly symbol: string | null;
  /** Minor unit digits of the currency (2 for USD, 0 for JPY), or `null` when unknown. */
  readonly fractionDigits: number | null;
}

/** Converts the scanned decimal digits to an integer amount of minor units without floating point math. */
function minorUnits(scan: Scan, digits: number, strict: boolean, input: unknown, locale: string): number {
  if (scan.infinite) {
    if (strict) throw new NumberParseError("OUT_OF_RANGE", "Amount is not finite", input, locale);
    return NaN;
  }
  const all = scan.int + scan.frac;
  const point = scan.int.length + scan.exp - scan.percent + digits;
  let whole: string;
  let rest: string;
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
      locale,
    );
  }
  let value = BigInt(whole || "0");
  if (rest !== "" && (rest[0] as string) >= "5") value += 1n;
  const out = Number(value);
  if (!Number.isSafeInteger(out)) {
    if (strict) throw new NumberParseError("OUT_OF_RANGE", "Amount is not a safe integer", input, locale);
    return NaN;
  }
  return scan.negative && out !== 0 ? -out : out;
}

/** Builds a scan from a JavaScript number, using its shortest round trip string. */
function scanNumber(value: number): Scan {
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
    infinite: !Number.isFinite(value),
  };
}

/** @internal */
export function parseCurrencyWith(input: unknown, data: LocaleData, options?: CurrencyOptions): CurrencyResult {
  const strict = options?.strict === true;
  const locale = data.info.locale;
  const fallback = options?.currency ? options.currency.toUpperCase() : null;
  const empty: CurrencyResult = {
    amount: NaN,
    currency: fallback,
    symbol: null,
    fractionDigits: fallback ? currencyDigits(fallback) : null,
  };
  if (typeof input === "number") {
    const digits = empty.fractionDigits ?? 2;
    const amount =
      options?.toMinorUnits && !Number.isNaN(input)
        ? minorUnits(scanNumber(input), digits, strict, input, locale)
        : input;
    return { ...empty, amount };
  }
  const scan = run(input, data, options);
  if (!scan) return empty;

  let currency = fallback;
  if (scan.currencyText !== null) {
    const found = resolveCurrency(scan.currencyText, data);
    if (strict && found === null) {
      throw new NumberParseError("UNKNOWN_CURRENCY", `Unknown currency "${scan.currencyText}"`, input, locale);
    }
    if (strict && fallback && found && found !== fallback) {
      throw new NumberParseError(
        "CURRENCY_MISMATCH",
        `Expected ${fallback} but found ${found}`,
        input,
        locale,
      );
    }
    currency = found ?? fallback;
  }
  const fractionDigits = currency ? currencyDigits(currency) : null;
  const amount = options?.toMinorUnits
    ? minorUnits(scan, fractionDigits ?? 2, strict, input, locale)
    : toNumber(scan);
  return { amount, currency, symbol: scan.currencyText, fractionDigits };
}

/**
 * Parses a money string into an amount and an ISO 4217 currency code.
 *
 * The currency can be a symbol (`"$"`, `"R$"`, `"\u20AC"`, `"\u20B9"`), an ISO code
 * (`"EUR"`, `"CHF"`) or a local abbreviation (`"kr"`, `"z\u0142"`), before or after
 * the number. Symbols are resolved with `Intl` for the given locale, so `"$"`
 * means CAD in `en-CA` and USD in `en-US`.
 *
 * With `toMinorUnits: true` the amount is an integer of minor units computed
 * from the decimal digits, so `"0,29"` becomes exactly `29` cents and never
 * `28.999999999999996`.
 *
 * @param input - The money string, e.g. `"R$ 1.234,56"`.
 * @param locale - BCP 47 tag; defaults to the runtime locale.
 * @param options - See {@link CurrencyOptions}.
 *
 * @example
 * ```ts
 * import { parseCurrency } from "numberparrot";
 *
 * parseCurrency("R$ 1.234,56", "pt-BR");
 * // { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }
 *
 * parseCurrency("1.234,56 \u20AC", "de-DE", { toMinorUnits: true });
 * // { amount: 123456, currency: "EUR", symbol: "\u20AC", fractionDigits: 2 }
 *
 * parseCurrency("\u00A51,235", "ja-JP", { toMinorUnits: true }).amount; // 1235 (JPY has no minor unit)
 * parseCurrency("($1,234.56)", "en-US").amount; // -1234.56
 * parseCurrency("12,50", "pt-BR", { currency: "BRL" }).currency; // "BRL"
 * ```
 */
export function parseCurrency(
  input: string | number,
  locale?: LocaleInput,
  options?: CurrencyOptions,
): CurrencyResult {
  return parseCurrencyWith(input, localeData(locale), options);
}
