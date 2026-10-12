import { type Scan, scan, toNumber } from "./core";
import { NumberParseError } from "./errors";
import { type LocaleData, type LocaleInput, localeData } from "./locale";

/** Options accepted by {@link parse}, {@link isValid} and {@link createParser}. */
export interface ParseOptions {
  /**
   * Throw a {@link NumberParseError} instead of returning `NaN`, and only accept
   * the exact separators of the locale, recognized currencies, and digits on
   * both sides of the decimal separator. Default `false`.
   */
  readonly strict?: boolean | undefined;
  /**
   * Return `15` for `"15%"` instead of `0.15`. Default `false`.
   */
  readonly keepPercent?: boolean | undefined;
  /**
   * Accept group separators anywhere in the integer part (`"1,23,4"`).
   * By default groups must be placed like real thousands or Indian lakh groups.
   */
  readonly looseGrouping?: boolean | undefined;
}

/** @internal Resolves input into a scan or throws/returns failure. */
export function run(
  input: unknown,
  data: LocaleData,
  options: ParseOptions | undefined,
): Scan | null {
  const strict = options?.strict === true;
  if (typeof input !== "string") {
    if (strict) {
      throw new NumberParseError("NOT_A_STRING", "Expected a string or a number", input, data.info.locale);
    }
    return null;
  }
  const result = scan(input, data, options);
  if (!result.ok) {
    if (strict) throw new NumberParseError(result.code, result.message, input, data.info.locale);
    return null;
  }
  return result;
}

/** @internal */
export function parseWith(input: unknown, data: LocaleData, options?: ParseOptions): number {
  if (typeof input === "number") {
    if (options?.strict && !Number.isFinite(input)) {
      throw new NumberParseError("OUT_OF_RANGE", "Number is not finite", input, data.info.locale);
    }
    return input;
  }
  const result = run(input, data, options);
  if (!result) return NaN;
  const value = toNumber(result, options?.keepPercent);
  if (options?.strict && !result.infinite && !Number.isFinite(value)) {
    throw new NumberParseError("OUT_OF_RANGE", "Number is too large", input, data.info.locale);
  }
  return value;
}

/**
 * Parses a number written in any locale into a JavaScript number.
 *
 * Separators, digits and symbols come from `Intl.NumberFormat` for `locale`.
 * Handles NBSP and narrow NBSP groups, apostrophes, Indian grouping, non-Latin
 * digits, currency symbols and codes, percent, accounting parentheses, every
 * minus variant, a leading plus, exponents and surrounding whitespace.
 *
 * `parse` never guesses: input that does not fit the locale returns `NaN`
 * (or throws in `strict` mode). Use {@link detect} when the locale is unknown.
 *
 * @param input - The string to parse. Numbers are returned unchanged.
 * @param locale - BCP 47 tag such as `"pt-BR"`; defaults to the runtime locale.
 * @param options - See {@link ParseOptions}.
 * @returns The number, or `NaN` when the input is not a valid number for the locale.
 * @throws {@link NumberParseError} in `strict` mode.
 *
 * @example
 * ```ts
 * import { parse } from "numberparrot";
 *
 * parse("1.234,56", "pt-BR");       // 1234.56
 * parse("1\u202F234,56", "fr-FR");  // 1234.56 (narrow no-break space)
 * parse("1'234.56", "de-CH");       // 1234.56
 * parse("12,34,567.89", "en-IN");   // 1234567.89
 * parse("\u0661\u0662\u0663\u066B\u0664\u0665", "ar-EG"); // 123.45
 * parse("(1.234,56)", "de-DE");     // -1234.56
 * parse("R$ 1.234,56", "pt-BR");    // 1234.56
 * parse("15%", "en-US");            // 0.15
 * parse("15%", "en-US", { keepPercent: true }); // 15
 * parse("1,5E3", "de-DE");          // 1500
 * parse("1,23", "en-US");           // NaN (misplaced group separator)
 * ```
 */
export function parse(input: string | number, locale?: LocaleInput, options?: ParseOptions): number {
  return parseWith(input, localeData(locale), options);
}

/**
 * Tells whether `input` is a valid number for `locale`. Never throws.
 *
 * @example
 * ```ts
 * import { isValid } from "numberparrot";
 *
 * isValid("1.234,56", "pt-BR"); // true
 * isValid("1.234,56", "en-US"); // false
 * isValid("12 apples", "en-US"); // false
 * ```
 */
export function isValid(input: string | number, locale?: LocaleInput, options?: ParseOptions): boolean {
  try {
    return !Number.isNaN(parseWith(input, localeData(locale), options));
  } catch {
    return false;
  }
}
