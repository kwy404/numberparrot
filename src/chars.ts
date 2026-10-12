/**
 * Character level normalization shared by every parser.
 *
 * Everything that can vary between keyboards, operating systems and locales
 * without changing the meaning of a number is folded into one canonical form:
 * any Unicode decimal digit becomes an ASCII digit, every kind of space becomes
 * a plain space, every minus variant becomes "-", and so on. Separators that do
 * carry meaning ("." "," "'" and the Arabic decimal and group marks) are kept.
 *
 * @internal
 */

/** Invisible formatting characters: bidi marks, zero width chars, soft hyphen. */
const INVISIBLE = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** Every whitespace character, including NBSP (U+00A0) and narrow NBSP (U+202F). */
const SPACE = /\s+/g;

/**
 * Minus variants: hyphen, non breaking hyphen, figure dash, en dash, em dash,
 * horizontal bar, minus sign (U+2212), small and full width hyphen minus.
 */
const MINUS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/** Plus variants: Hebrew alternative plus, small plus, full width plus. */
const PLUS = /[\uFB29\uFE62\uFF0B]/g;

/** Apostrophe variants used as group separators (de-CH and friends). */
const APOSTROPHE = /[`\u00B4\u02B9\u02BC\u2018\u2019\u201B\u2032\uFF07]/g;

const SINGLE: Record<string, string> = {
  "\uFF0E": ".", // full width full stop
  "\uFE52": ".", // small full stop
  "\uFF0C": ",", // full width comma
  "\uFE50": ",", // small comma
  "\uFF05": "%", // full width percent
  "\uFE6A": "%", // small percent
  "\u066A": "%", // Arabic percent sign
  "\u0609": "\u2030", // Arabic per mille sign
  "\uFF04": "$", // full width dollar
  "\uFFE0": "\u00A2", // full width cent
  "\uFFE1": "\u00A3", // full width pound
  "\uFFE5": "\u00A5", // full width yen
  "\uFFE6": "\u20A9", // full width won
  "\uFF08": "(", // full width parenthesis
  "\uFE59": "(",
  "\uFF09": ")",
  "\uFE5A": ")",
};
const SINGLE_RE = /[\uFF04\uFFE0\uFFE1\uFFE5\uFFE6\uFF0E\uFE52\uFF0C\uFE50\uFF05\uFE6A\u066A\u0609\uFF08\uFE59\uFF09\uFE5A]/g;

const DECIMAL_DIGIT = /\p{Nd}/u;
const ANY_DIGIT = /\p{Nd}/gu;
const digitCache = new Map<string, string>();

/**
 * Converts one Unicode decimal digit (any script) to its ASCII value.
 * Unicode guarantees decimal digits come in contiguous runs of ten starting at
 * zero, so counting the digits directly before a code point gives its value.
 */
function toAsciiDigit(ch: string): string {
  const cp = ch.codePointAt(0) as number;
  if (cp >= 0x30 && cp <= 0x39) return ch;
  let cached = digitCache.get(ch);
  if (cached === undefined) {
    let n = 0;
    while (n < 64 && DECIMAL_DIGIT.test(String.fromCodePoint(cp - n - 1))) n++;
    cached = String(n % 10);
    digitCache.set(ch, cached);
  }
  return cached;
}

/** Converts every decimal digit in any script (Arabic-Indic, Devanagari, full width...) to ASCII. */
export function asciiDigits(input: string): string {
  return input.replace(ANY_DIGIT, toAsciiDigit);
}

/**
 * Canonical form of a raw string, without trimming. Used while typing, where a
 * trailing group space is meaningful.
 */
export function foldChars(input: string): string {
  return asciiDigits(
    input
      .replace(INVISIBLE, "")
      .replace(SPACE, " ")
      .replace(MINUS, "-")
      .replace(PLUS, "+")
      .replace(APOSTROPHE, "'")
      .replace(SINGLE_RE, (c) => SINGLE[c] as string),
  );
}

/** Canonical, trimmed form of a raw string. */
export function prepare(input: string): string {
  return foldChars(input).trim();
}

/** True for ASCII digits. */
export function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}
