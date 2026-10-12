import { isDigit, prepare } from "./chars";
import { scan, toNumber, validGrouping } from "./core";
import { type LocaleData, type SeparatorSet, localeData } from "./locale";

/**
 * Locales tried by {@link detect} when no candidates are given.
 * The order breaks ties: with the default list, `"1,234"` is read as 1234.
 */
export const DEFAULT_CANDIDATES: readonly string[] = [
  "en-US",
  "en-GB",
  "en-IN",
  "pt-BR",
  "es-ES",
  "es-MX",
  "de-DE",
  "de-CH",
  "fr-FR",
  "it-IT",
  "nl-NL",
  "ru-RU",
  "pl-PL",
  "sv-SE",
  "tr-TR",
  "ja-JP",
  "zh-CN",
  "ko-KR",
  "hi-IN",
  "th-TH",
  "id-ID",
  "ar-EG",
  "fa-IR",
];

/** Result of {@link detect}. */
export interface DetectResult {
  /** Best guess for the value, `NaN` when the input is not a number in any convention. */
  readonly value: number;
  /** The decimal separator found or assumed, `null` for whole numbers without one. */
  readonly decimal: string | null;
  /** The group separator found or assumed, `null` when none. */
  readonly group: string | null;
  /** True when the input reads as two different numbers depending on the locale (`"1,234"`). */
  readonly ambiguous: boolean;
  /** Between 0 and 1. 1 means only one reading is possible. */
  readonly confidence: number;
  /** Short English explanation of the decision. */
  readonly reason: string;
  /** Candidate locales that read the input as `value`, best match first. */
  readonly locales: readonly string[];
  /** Every distinct value the input can mean, `value` first. */
  readonly alternatives: readonly number[];
}

const NATIVE: Record<string, readonly string[]> = {
  ".": [","],
  ",": ["."],
};

function separators(decimal: string | null, group: string | null): SeparatorSet {
  const decimals = decimal ? [decimal] : [];
  const groups = group ? [group] : [];
  return { decimals, groups };
}

function valueFor(text: string, data: LocaleData, decimal: string | null, group: string | null): number {
  const result = scan(text, data, {}, separators(decimal, group));
  return result.ok ? toNumber(result) : NaN;
}

/** Whether a candidate locale reads numbers with this decimal and group separator. */
function compatible(data: LocaleData, decimal: string | null, group: string | null): 0 | 1 | 2 {
  if (decimal !== null && !data.loose.decimals.includes(decimal)) return 0;
  if (group !== null && !data.loose.groups.includes(group)) return 0;
  // 2 = the locale prints exactly these separators, 1 = it merely tolerates them.
  const exactDecimal = decimal === null || data.decimal === decimal;
  const exactGroup = group === null || data.group === group;
  return exactDecimal && exactGroup ? 2 : 1;
}

function result(
  value: number,
  decimal: string | null,
  group: string | null,
  ambiguous: boolean,
  confidence: number,
  reason: string,
  locales: string[],
  alternatives: number[],
): DetectResult {
  return { value, decimal, group, ambiguous, confidence, reason, locales, alternatives };
}

/**
 * Guesses how a number string was written when the locale is unknown, for
 * example in CSV imports, scraped prices or pasted spreadsheet cells.
 *
 * It finds the decimal separator from the structure of the string and lists
 * the candidate locales that agree. When the string honestly means two
 * different numbers (`"1,234"` is 1234 in en-US and 1.234 in pt-BR) it says
 * so with `ambiguous: true`, a lower `confidence`, both `alternatives`, and
 * breaks the tie with the order of `candidates`.
 *
 * @param input - The string to inspect.
 * @param candidates - Locales to consider, in order of preference. Defaults to {@link DEFAULT_CANDIDATES}.
 *
 * @example
 * ```ts
 * import { detect } from "numberparrot";
 *
 * detect("1.234,56");
 * // { value: 1234.56, decimal: ",", group: ".", ambiguous: false, confidence: 0.95,
 * //   locales: ["pt-BR", "es-ES", "de-DE", ...], ... }
 *
 * detect("1,234");
 * // { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234], ... }
 *
 * detect("1,234", ["pt-BR", "en-US"]).value; // 1.234
 * ```
 */
export function detect(input: string, candidates: readonly string[] = DEFAULT_CANDIDATES): DetectResult {
  const datas = candidates.map((c) => localeData(c));
  const first = datas[0] ?? localeData("en-US");
  const text = typeof input === "string" ? input : String(input);
  const s = prepare(text);

  // Collect separators between digit runs, ignoring any exponent part.
  const firstDigit = s.search(/\d/);
  if (firstDigit < 0) {
    return result(NaN, null, null, false, 0, "No digits found", [], []);
  }
  let lastDigit = s.length - 1;
  while (!isDigit(s[lastDigit])) lastDigit--;
  let body = s.slice(firstDigit, lastDigit + 1).replace(/ ?(?:[eE]|\u00D710\^) ?[+-]?\d+$/, "");
  body = body.replace(/ ?\u0623\u0633 ?[+-]?\d+$/, "");
  const marks: { ch: string; after: number }[] = [];
  const runs = body.split(/[^\d]/);
  const seps = body.replace(/\d/g, "");
  for (let i = 0; i < seps.length; i++) {
    marks.push({ ch: seps[i] as string, after: (runs[i + 1] as string).length });
  }
  const kinds = [...new Set(seps)];
  const allowed = [".", ",", "'", " ", "\u066B", "\u066C"];
  const invalid = kinds.find((k) => !allowed.includes(k));
  if (invalid !== undefined || runs.some((r, i) => r === "" && i > 0)) {
    return result(NaN, null, null, false, 0, `"${invalid ?? seps}" cannot appear inside a number`, [], []);
  }

  // Non-Latin digits point at the locales that print them (Arabic-Indic, Devanagari...).
  const script = [...new Set(text.match(/\p{Nd}/gu) ?? [])].filter((d) => !isDigit(d));
  const rank = (decimal: string | null, group: string | null): string[] =>
    datas
      .map((d, i) => ({
        locale: candidates[i] as string,
        score: compatible(d, decimal, group),
        native: script.length > 0 && script.every((ch) => d.info.digits.includes(ch)) ? 1 : 0,
        i,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.native - a.native || b.score - a.score || a.i - b.i)
      .map((r) => r.locale);

  const finish = (
    decimal: string | null,
    group: string | null,
    confidence: number,
    reason: string,
  ): DetectResult => {
    const value = valueFor(text, first, decimal, group);
    if (Number.isNaN(value)) {
      return result(NaN, decimal, group, false, 0, "Separators are not positioned like any number format", [], []);
    }
    const ranked = rank(decimal, group);
    return result(value, decimal, group, false, confidence, reason, ranked, [value]);
  };

  if (kinds.length === 0) return finish(null, null, 1, "No separators: a whole number");

  if (kinds.includes("\u066B") || kinds.includes("\u066C")) {
    return finish(
      kinds.includes("\u066B") ? "\u066B" : null,
      kinds.includes("\u066C") ? "\u066C" : null,
      1,
      "Arabic decimal and group separators are unambiguous",
    );
  }

  const dots = kinds.filter((k) => k === "." || k === ",");
  const others = kinds.filter((k) => k === " " || k === "'");
  const lastMark = marks[marks.length - 1] as { ch: string; after: number };

  if (dots.length === 2) {
    const decimal = [...seps].reverse().find((c) => c === "." || c === ",") as string;
    const group = (NATIVE[decimal] as string[])[0] as string;
    return finish(
      decimal,
      others.length ? null : group,
      0.95,
      `Both "." and "," appear; the last one, "${decimal}", is the decimal separator`,
    );
  }

  if (dots.length === 1) {
    const c = dots[0] as string;
    const count = [...seps].filter((x) => x === c).length;
    const otherGroup = others.length === 1 ? (others[0] as string) : null;
    if (others.length > 1) return finish(c, null, 0, "Mixed group separators");
    if (otherGroup !== null) {
      // "1 234,56" or "1'234.56": the space or apostrophe groups, so c is the decimal.
      return finish(c, otherGroup, 0.95, `"${otherGroup}" groups digits, so "${c}" is the decimal separator`);
    }
    if (count > 1) {
      return finish(
        (NATIVE[c] as string[])[0] as string,
        c,
        0.9,
        `"${c}" repeats, so it separates groups of digits`,
      );
    }
    const intDigits = (runs[0] as string).length;
    const after = lastMark.after;
    if (after !== 3) {
      return finish(c, null, 0.9, `"${c}" is followed by ${after} digit${after === 1 ? "" : "s"}, so it is the decimal separator`);
    }
    if (intDigits === 0 || runs[0] === "0" || intDigits > 3) {
      return finish(
        c,
        null,
        0.85,
        intDigits > 3
          ? `"${c}" follows more than 3 digits, so it cannot separate thousands`
          : `"${c}" follows a zero, so it is the decimal separator`,
      );
    }
    // Truly ambiguous: "1,234" or "1.234".
    const asDecimal = valueFor(text, first, c, null);
    const asGroup = valueFor(text, first, (NATIVE[c] as string[])[0] as string, c);
    const groupFirst = first.decimal !== c;
    const best = groupFirst ? asGroup : asDecimal;
    const decimal = groupFirst ? ((NATIVE[c] as string[])[0] as string) : c;
    const group = groupFirst ? c : null;
    const ranked = rank(decimal, group);
    return result(
      best,
      groupFirst ? null : c,
      group,
      true,
      0.5,
      `"${c}" followed by exactly 3 digits can be a thousands or a decimal separator; ` +
        `${candidates[0] ?? "en-US"} reads it as ${groupFirst ? "thousands" : "decimal"}`,
      ranked,
      [best, groupFirst ? asDecimal : asGroup],
    );
  }

  // Only spaces or apostrophes: a grouped whole number.
  if (others.length > 1) return finish(null, null, 0, "Mixed group separators");
  const group = others[0] as string;
  const runsOk = validGrouping(runs);
  return finish(null, group, runsOk ? 0.9 : 0, `"${group}" separates groups of digits in a whole number`);
}
