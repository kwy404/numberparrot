import { DEFAULT_CANDIDATES, detect } from "./detect";
import { type LocaleData, localeData } from "./locale";
import { parseWith } from "./parse";

/** Result of {@link parseColumn}. */
export interface ColumnResult {
  /** One number per input value, `NaN` for blank cells and cells that are not numbers. */
  readonly values: readonly number[];
  /** The candidate locale used to read every cell, or `null` when no cell is a number. */
  readonly locale: string | null;
  /** The decimal separator chosen for the whole column, or `null` when no cell is a number. */
  readonly decimal: string | null;
  /** True when no cell settles the format, so the candidate order decided (`["1,234", "5,678"]`). */
  readonly ambiguous: boolean;
  /** Between 0 and 1. Lower when cells disagree or only the candidate order decided. */
  readonly confidence: number;
  /** Short English explanation, naming the cell that decided the format. */
  readonly reason: string;
  /** Indexes of non blank cells that are not numbers in the chosen format. */
  readonly invalid: readonly number[];
}

const OTHER: Record<string, string> = { ".": ",", ",": "." };

const round = (n: number): number => Math.round(n * 100) / 100;

/** The decimal separator a cell's detect() result proves, or null when it proves nothing. */
function vote(decimal: string | null, group: string | null): string | null {
  if (decimal !== null) return decimal;
  if (group !== null && OTHER[group]) return OTHER[group] as string;
  return null;
}

/**
 * Reads a whole column of numbers written in one unknown format, such as a
 * CSV column, a pasted spreadsheet range or a list of scraped prices.
 *
 * A single `"1,234"` is ambiguous, but a column rarely is: if another cell is
 * `"12,5"` or `"1.000,00"`, the comma is the decimal separator for every cell.
 * `parseColumn` runs {@link detect} on each cell, lets the unambiguous cells
 * vote for the decimal separator, picks the first candidate locale that writes
 * it, and parses every cell with that one locale. Blank cells become `NaN` and
 * are not reported as invalid.
 *
 * @param values - The cells, in order.
 * @param candidates - Locales to consider, in order of preference. Defaults to {@link DEFAULT_CANDIDATES}.
 *
 * @example
 * ```ts
 * import { parseColumn } from "numberparrot";
 *
 * parseColumn(["1,234", "12,5", "1.000,00"]);
 * // { values: [1.234, 12.5, 1000], locale: "pt-BR", decimal: ",",
 * //   ambiguous: false, confidence: 0.93, invalid: [],
 * //   reason: "\"12,5\" (row 2) shows that \",\" is the decimal separator" }
 *
 * parseColumn(["1,234", "5,678"]).ambiguous; // true: read as 1234 and 5678
 * ```
 */
export function parseColumn(
  values: readonly string[],
  candidates: readonly string[] = DEFAULT_CANDIDATES,
): ColumnResult {
  const cells = Array.from(values, (v) => (typeof v === "string" ? v : v == null ? "" : String(v)));
  const datas: LocaleData[] = candidates.map((c) => localeData(c));
  const tally = new Map<string, { weight: number; count: number; first: number }>();
  const groups = new Map<string, number>();
  let anyNumber = false;
  let anyAmbiguous = false;

  cells.forEach((cell, i) => {
    if (cell.trim() === "") return;
    const found = detect(cell, candidates);
    if (Number.isNaN(found.value)) return;
    anyNumber = true;
    if (found.group !== null) groups.set(found.group, (groups.get(found.group) ?? 0) + 1);
    if (found.ambiguous) {
      anyAmbiguous = true;
      return;
    }
    const mark = vote(found.decimal, found.group);
    if (mark === null) return;
    const entry = tally.get(mark) ?? { weight: 0, count: 0, first: i };
    entry.weight += found.confidence;
    entry.count++;
    tally.set(mark, entry);
  });

  const blank = cells.map(() => NaN);
  if (!anyNumber) {
    return {
      values: blank,
      locale: null,
      decimal: null,
      ambiguous: false,
      confidence: 0,
      reason: "No cell is a number",
      invalid: cells.flatMap((c, i) => (c.trim() === "" ? [] : [i])),
    };
  }

  const first = datas[0] ?? localeData("en-US");
  let decimal = first.decimal;
  let confidence = anyAmbiguous ? 0.5 : 1;
  let reason = anyAmbiguous
    ? `No cell settles the format; ${candidates[0] ?? "en-US"} reads "${first.decimal}" as the decimal separator`
    : "Whole numbers only: every format reads them the same";
  let total = 0;
  for (const entry of tally.values()) total += entry.count;
  if (total > 0) {
    const ranked = [...tally.entries()].sort((a, b) => b[1].weight - a[1].weight || a[1].first - b[1].first);
    const [mark, best] = ranked[0] as [string, { weight: number; count: number; first: number }];
    decimal = mark;
    confidence = round((best.weight / best.count) * (best.count / total));
    const cell = JSON.stringify(cells[best.first]);
    reason =
      ranked.length > 1
        ? `${best.count} of ${total} cells use "${mark}" as the decimal separator, for example ${cell}`
        : `${cell} (row ${best.first + 1}) shows that "${mark}" is the decimal separator`;
  }

  // Among the candidates that accept this decimal separator, prefer the one that reads
  // the most cells, then one that prints this decimal separator, then one that prints
  // the group separator the cells use most.
  let group: string | null = null;
  let groupCount = 0;
  for (const [g, n] of groups) {
    if (n > groupCount && g !== decimal) {
      group = g;
      groupCount = n;
    }
  }
  let pick = -1;
  let pickScore = -1;
  datas.forEach((data, i) => {
    if (!data.loose.decimals.includes(decimal)) return;
    let read = 0;
    for (const cell of cells) if (cell.trim() !== "" && !Number.isNaN(parseWith(cell, data))) read++;
    const score = read * 4 + (data.decimal === decimal ? 2 : 0) + (data.group === group ? 1 : 0);
    if (score > pickScore) {
      pick = i;
      pickScore = score;
    }
  });
  const data = pick >= 0 ? (datas[pick] as LocaleData) : first;
  const locale = pick >= 0 ? (candidates[pick] as string) : (candidates[0] ?? data.info.locale);
  const out = cells.map((cell) => (cell.trim() === "" ? NaN : parseWith(cell, data)));
  const invalid = out.flatMap((v, i) => (Number.isNaN(v) && (cells[i] as string).trim() !== "" ? [i] : []));
  if (invalid.length > 0) {
    confidence = round(confidence * (1 - invalid.length / cells.filter((c) => c.trim() !== "").length));
  }
  return {
    values: out,
    locale,
    decimal: pick >= 0 ? decimal : data.decimal,
    ambiguous: total === 0 && anyAmbiguous,
    confidence,
    reason,
    invalid,
  };
}
