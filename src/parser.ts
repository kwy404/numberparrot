import { type InputOptions, type InputState, normalizeInputWith } from "./input";
import { type LocaleInfo, type LocaleInput, localeData } from "./locale";
import { type CurrencyOptions, type CurrencyResult, parseCurrencyWith } from "./money";
import { type ParseOptions, parseWith } from "./parse";

/** A parser bound to one locale and one set of options. Returned by {@link createParser}. */
export interface Parser {
  /** Number symbols of the bound locale. */
  readonly info: LocaleInfo;
  /** Same as {@link parse} with the bound locale and options. */
  parse(input: string | number): number;
  /** Same as {@link isValid} with the bound locale and options. */
  isValid(input: string | number): boolean;
  /** Same as {@link parseCurrency} with the bound locale; options are merged. */
  parseCurrency(input: string | number, options?: CurrencyOptions): CurrencyResult;
  /** Same as {@link normalizeInput} with the bound locale. */
  normalizeInput(value: string, options?: InputOptions): InputState;
}

/**
 * Creates a parser bound to a locale. The locale is resolved once, so this is
 * the fastest way to parse many values (CSV rows, table cells, form fields).
 *
 * @param locale - BCP 47 tag such as `"de-DE"`; defaults to the runtime locale.
 * @param options - Default {@link ParseOptions} for every call.
 *
 * @example
 * ```ts
 * import { createParser } from "numberparrot";
 *
 * const brl = createParser("pt-BR");
 * ["1.234,56", "R$ 10,00", "(5,25)"].map(brl.parse); // [1234.56, 10, -5.25]
 *
 * const strictDe = createParser("de-DE", { strict: true });
 * strictDe.parse("1.234,56"); // 1234.56
 * strictDe.parse("1,234.56"); // throws NumberParseError
 * ```
 */
export function createParser(locale?: LocaleInput, options?: ParseOptions): Parser {
  const data = localeData(locale);
  return {
    info: data.info,
    parse: (input) => parseWith(input, data, options),
    isValid: (input) => {
      try {
        return !Number.isNaN(parseWith(input, data, options));
      } catch {
        return false;
      }
    },
    parseCurrency: (input, extra) =>
      parseCurrencyWith(input, data, {
        strict: options?.strict,
        looseGrouping: options?.looseGrouping,
        ...extra,
      }),
    normalizeInput: (value, extra) => normalizeInputWith(value, data, extra),
  };
}
