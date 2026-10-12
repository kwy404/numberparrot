import { foldChars, isDigit } from "./chars";
import { scan, toNumber } from "./core";
import { type LocaleData, type LocaleInput, localeData } from "./locale";

/** Options accepted by {@link normalizeInput}. */
export interface InputOptions {
  /** Keep a leading minus sign. Default `true`. */
  readonly allowNegative?: boolean | undefined;
  /** Drop fraction digits beyond this count, e.g. `2` for money fields. */
  readonly maxFractionDigits?: number | undefined;
}

/** Result of {@link normalizeInput}. */
export interface InputState {
  /** Cleaned text to show back in the field. */
  readonly text: string;
  /** Numeric value of what was typed so far, `NaN` when there are no digits yet. */
  readonly value: number;
  /** False when the text can never become a valid number by typing more digits. */
  readonly valid: boolean;
  /** True when `text` is a finished number; false for partial input such as `"1.234,"`. */
  readonly complete: boolean;
}

const COMPLETIONS = ["", "0", "00", "000"];

/** @internal */
export function normalizeInputWith(value: string, data: LocaleData, options?: InputOptions): InputState {
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
        if (maxFraction !== undefined && fractionDigits >= maxFraction) continue;
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
      if (!seenDecimal && (maxFraction === undefined || maxFraction > 0)) {
        seenDecimal = true;
        text += ch;
      }
    } else if (groups.includes(ch)) {
      // Keep a group separator only after a digit, and only in the integer part.
      if (!seenDecimal && isDigit(last)) text += ch;
    }
    // Anything else (letters, currency, percent) is dropped.
  }

  const sign = negative ? "-" : "";
  const partialValue =
    digits === "" && fraction === "" ? NaN : Number(`${sign}${digits || "0"}.${fraction || "0"}`);

  if (text === "" || text === "-") {
    return { text, value: NaN, valid: true, complete: false };
  }

  const done = scan(text, data);
  if (done.ok && !/[^\d]$/.test(text)) {
    return { text, value: toNumber(done), valid: true, complete: true };
  }
  // Partial: valid if appending a few digits can complete it ("1.2" -> "1.200").
  const valid = COMPLETIONS.some((tail) => scan(text + tail, data).ok);
  return { text, value: partialValue, valid, complete: false };
}

/**
 * Cleans what a user is typing into a number field and reports its state.
 *
 * Designed to run on every keystroke: it converts any script of digits to ASCII,
 * drops letters and symbols, keeps one decimal separator, and accepts partial
 * values such as `"1.234,"` or `"-"` as valid while they can still become a
 * number. `value` is always the best numeric reading of the current text.
 *
 * @param value - The raw field value.
 * @param locale - BCP 47 tag; defaults to the runtime locale.
 * @param options - See {@link InputOptions}.
 *
 * @example
 * ```ts
 * import { normalizeInput } from "numberparrot";
 *
 * normalizeInput("1.234,", "pt-BR");
 * // { text: "1.234,", value: 1234, valid: true, complete: false }
 *
 * normalizeInput("R$ 1.234,567", "pt-BR", { maxFractionDigits: 2 });
 * // { text: "1.234,56", value: 1234.56, valid: true, complete: true }
 *
 * normalizeInput("\u0661\u0662\u066B\u0665", "ar-EG");
 * // { text: "12\u066B5", value: 12.5, valid: true, complete: true }
 * ```
 */
export function normalizeInput(value: string, locale?: LocaleInput, options?: InputOptions): InputState {
  return normalizeInputWith(value, localeData(locale), options);
}
