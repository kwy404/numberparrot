import { isDigit, prepare } from "./chars";
import { resolveCurrency } from "./currency";
import { type Failure, fail } from "./errors";
import type { LocaleData, SeparatorSet } from "./locale";

/** @internal Successful scan of a numeric string. */
export interface Scan {
  readonly ok: true;
  readonly negative: boolean;
  /** Integer digits, without separators (may be empty for ".5"). */
  readonly int: string;
  /** Fraction digits (may be empty). */
  readonly frac: string;
  /** Power of ten applied to int.frac (exponent, minus percent shift). */
  readonly exp: number;
  /** 0 = none, 2 = percent, 3 = per mille. */
  readonly percent: 0 | 2 | 3;
  /** Currency text found next to the number, in canonical form. */
  readonly currencyText: string | null;
  /** Decimal separator actually used, or null. */
  readonly decimal: string | null;
  /** Group separator actually used, or null. */
  readonly group: string | null;
  /** True for "\u221E" (Intl output for Infinity). */
  readonly infinite: boolean;
}

/** @internal */
export type ScanResult = Scan | Failure;

/** @internal */
export interface ScanOptions {
  readonly strict?: boolean | undefined;
  readonly looseGrouping?: boolean | undefined;
}

const DEFAULT_EXPONENTS = ["e", "E", "\u00D710^", "x10^", "*10^"];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const exponentCache = new Map<string, RegExp>();
function exponentRe(exponent: string): RegExp {
  let re = exponentCache.get(exponent);
  if (!re) {
    const alts = [...new Set([exponent, ...DEFAULT_EXPONENTS])].map(escapeRe).join("|");
    re = new RegExp(`^(.*\\d) ?(?:${alts}) ?([+-]?)(\\d+)$`);
    exponentCache.set(exponent, re);
  }
  return re;
}

const LETTER_OR_SYMBOL = /^[\p{L}\p{M}\p{Sc}.]+$/u;
const HAS_SYMBOL = /\p{Sc}/u;
const LETTERS = /[\p{L}\p{M}]/gu;

/**
 * Checks that the integer digit groups are positioned like a real number:
 * the last group has 3 digits, middle groups have 3 (Western) or 2 (Indian
 * lakh/crore) digits, and the first group is not longer than the middle ones.
 */
export function validGrouping(groups: readonly string[]): boolean {
  if (groups.length < 2) return true;
  const first = (groups[0] as string).length;
  const last = (groups[groups.length - 1] as string).length;
  if (last !== 3 || first < 1) return false;
  if (groups.length === 2) return first <= 3;
  const size = (groups[1] as string).length;
  if (size !== 2 && size !== 3) return false;
  for (let i = 1; i < groups.length - 1; i++) if ((groups[i] as string).length !== size) return false;
  return first <= size;
}

function currencyLike(text: string, data: LocaleData, strict: boolean): boolean {
  if (strict) return resolveCurrency(text, data) !== null;
  if (!LETTER_OR_SYMBOL.test(text) || text === "e" || text === "E") return false;
  if (HAS_SYMBOL.test(text)) return true;
  const letters = text.match(LETTERS)?.length ?? 0;
  if (letters === 0) return false;
  return letters <= 5 || resolveCurrency(text, data) !== null;
}

interface AffixState {
  negative: boolean;
  plus: boolean;
  paren: 0 | 1 | 2;
  percent: 0 | 2 | 3;
  currency: string | null;
}

function scanAffix(
  text: string,
  isPrefix: boolean,
  state: AffixState,
  data: LocaleData,
  strict: boolean,
): Failure | null {
  let token = "";
  const flush = (): Failure | null => {
    if (token === "") return null;
    if (state.currency !== null) return fail("INVALID_AFFIX", `Unexpected text "${token}"`);
    if (!currencyLike(token, data, strict)) {
      return fail(
        strict ? "UNKNOWN_CURRENCY" : "INVALID_AFFIX",
        strict ? `Unknown currency "${token}"` : `Unexpected text "${token}"`,
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

/**
 * Scans a string with the given separator set. This is the heart of every
 * public function: it never guesses, it only accepts what the locale allows.
 * @internal
 */
export function scan(
  raw: string,
  data: LocaleData,
  options: ScanOptions = {},
  seps: SeparatorSet = options.strict ? data.strict : data.loose,
): ScanResult {
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
    const state: AffixState = { negative: false, plus: false, paren: 0, percent: 0, currency: null };
    const f =
      scanAffix(s.slice(0, inf), true, state, data, strict) ??
      scanAffix(s.slice(inf + 1), false, state, data, strict);
    if (f) return f;
    if (state.paren === 1) return fail("INVALID_SIGN", "Unbalanced parentheses");
    return {
      ok: true,
      negative: state.negative || state.paren === 2,
      int: "",
      frac: "",
      exp: 0,
      percent: state.percent,
      currencyText: state.currency,
      decimal: null,
      group: null,
      infinite: true,
    };
  }

  // A leading decimal (".5", ",5") belongs to the number unless it ends a word ("Rs.500").
  const before = s[start - 1];
  if (before !== undefined && seps.decimals.includes(before)) {
    const prev = s[start - 2];
    if (prev === undefined || !/[\p{L}\p{M}]/u.test(prev)) start--;
  }
  // A trailing decimal ("5,") belongs to the number too.
  const after = s[end];
  if (after !== undefined && seps.decimals.includes(after)) end++;

  let body = s.slice(start, end);
  const prefix = s.slice(0, start);
  const suffix = s.slice(end);

  let exp = 0;
  const em = exponentRe(data.exponent).exec(body);
  if (em) {
    body = em[1] as string;
    exp = Number(em[3]) * (em[2] === "-" ? -1 : 1);
  }

  // Walk the mantissa: digit runs separated by single separator characters.
  const runs: string[] = [];
  const marks: string[] = [];
  let run = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i] as string;
    if (isDigit(ch)) {
      run += ch;
      continue;
    }
    if (!seps.decimals.includes(ch) && !seps.groups.includes(ch)) {
      const known = data.loose.decimals.includes(ch) || data.loose.groups.includes(ch);
      return known && strict
        ? fail("INVALID_SEPARATOR", `"${ch}" is not a separator of this locale`)
        : fail("INVALID_CHARACTER", `Unexpected character "${ch}"`);
    }
    if (run === "" && i > 0) return fail("INVALID_SEPARATOR", "Two separators in a row");
    runs.push(run);
    marks.push(ch);
    run = "";
  }
  runs.push(run);

  let decimalAt = -1;
  let group: string | null = null;
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i] as string;
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

  const state: AffixState = { negative: false, plus: false, paren: 0, percent: 0, currency: null };
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
    decimal: decimalAt >= 0 ? (marks[decimalAt] as string) : null,
    group,
    infinite: false,
  };
}

/**
 * Turns a successful scan into a correctly rounded JavaScript number.
 * The digits are handed to `Number()` as a canonical string, so the result is
 * exactly what `Number("1234.56")` would give: no floating point drift from
 * manual multiplication.
 * @internal
 */
export function toNumber(scan: Scan, keepPercent = false): number {
  if (scan.infinite) return scan.negative ? -Infinity : Infinity;
  const shift = keepPercent ? 0 : scan.percent;
  const text = `${scan.negative ? "-" : ""}${scan.int || "0"}.${scan.frac || "0"}e${scan.exp - shift}`;
  return Number(text);
}
