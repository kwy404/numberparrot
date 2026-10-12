/**
 * Machine readable reason why an input could not be parsed.
 *
 * - `EMPTY`: the input is empty or only whitespace.
 * - `NOT_A_STRING`: the input is not a string or a number.
 * - `NO_DIGITS`: the input contains no digits.
 * - `INVALID_CHARACTER`: an unexpected character appears inside the number.
 * - `INVALID_SEPARATOR`: a separator is not valid for the locale (strict mode) or appears twice in a row.
 * - `MULTIPLE_DECIMALS`: more than one decimal separator.
 * - `MIXED_GROUPS`: different group separators are mixed in one number.
 * - `INVALID_GROUPING`: group separators are in the wrong places (for example `"1,23"`).
 * - `INVALID_SIGN`: duplicated or conflicting signs or parentheses.
 * - `INVALID_AFFIX`: text before or after the number that is not a sign, percent or currency.
 * - `UNKNOWN_CURRENCY`: strict mode found a currency it cannot identify.
 * - `CURRENCY_MISMATCH`: the currency differs from the one requested.
 * - `PRECISION_LOSS`: converting to minor units would need rounding (strict mode).
 * - `OUT_OF_RANGE`: the value is not finite or not a safe integer where one is required.
 */
export type ParseErrorCode =
  | "EMPTY"
  | "NOT_A_STRING"
  | "NO_DIGITS"
  | "INVALID_CHARACTER"
  | "INVALID_SEPARATOR"
  | "MULTIPLE_DECIMALS"
  | "MIXED_GROUPS"
  | "INVALID_GROUPING"
  | "INVALID_SIGN"
  | "INVALID_AFFIX"
  | "UNKNOWN_CURRENCY"
  | "CURRENCY_MISMATCH"
  | "PRECISION_LOSS"
  | "OUT_OF_RANGE";

/**
 * Error thrown by the parsers in `strict` mode.
 *
 * @example
 * ```ts
 * import { parse, NumberParseError } from "numberparrot";
 *
 * try {
 *   parse("1,23", "en-US", { strict: true });
 * } catch (error) {
 *   if (error instanceof NumberParseError) error.code; // "INVALID_GROUPING"
 * }
 * ```
 */
export class NumberParseError extends Error {
  /** Machine readable reason. */
  readonly code: ParseErrorCode;
  /** The original input. */
  readonly input: unknown;
  /** The resolved locale that was used. */
  readonly locale: string;

  constructor(code: ParseErrorCode, message: string, input: unknown, locale: string) {
    super(`${message} (input: ${JSON.stringify(String(input))}, locale: ${locale})`);
    this.name = "NumberParseError";
    this.code = code;
    this.input = input;
    this.locale = locale;
  }
}

/** @internal A failure produced by the scanner before it is turned into NaN or an error. */
export interface Failure {
  readonly ok: false;
  readonly code: ParseErrorCode;
  readonly message: string;
}

/** @internal */
export function fail(code: ParseErrorCode, message: string): Failure {
  return { ok: false, code, message };
}
