import { prepare } from "./chars";

/** A BCP 47 locale tag, a list of tags in priority order, or `undefined` for the runtime default. */
export type LocaleInput = string | readonly string[] | undefined;

/**
 * Number symbols of a locale, read from `Intl.NumberFormat#formatToParts()`.
 *
 * @example
 * ```ts
 * getLocaleInfo("de-CH");
 * // { locale: "de-CH", decimal: ".", group: "'", digits: "0123456789", ... }
 * // (older ICU data prints a right single quotation mark instead; both parse)
 * ```
 */
export interface LocaleInfo {
  /** The locale actually resolved by `Intl`, e.g. `"pt-BR"`. */
  readonly locale: string;
  /** Numbering system resolved by `Intl`, e.g. `"latn"`, `"arab"`, `"arabext"`. */
  readonly numberingSystem: string;
  /** Decimal separator exactly as `Intl` prints it. */
  readonly decimal: string;
  /** Group (thousands) separator exactly as `Intl` prints it. */
  readonly group: string;
  /** Minus sign exactly as `Intl` prints it. */
  readonly minusSign: string;
  /** Plus sign exactly as `Intl` prints it. */
  readonly plusSign: string;
  /** Percent sign exactly as `Intl` prints it. */
  readonly percentSign: string;
  /** Exponent separator used by scientific notation, e.g. `"E"`. */
  readonly exponent: string;
  /** The ten digits of the locale numbering system, zero first. */
  readonly digits: string;
}

/** Separator sets used by the scanner. All values are in canonical (prepared) form. */
export interface SeparatorSet {
  readonly decimals: readonly string[];
  readonly groups: readonly string[];
}

/** @internal Locale data plus canonical separator sets. */
export interface LocaleData {
  readonly info: LocaleInfo;
  /** Canonical decimal separator. */
  readonly decimal: string;
  /** Canonical group separator. */
  readonly group: string;
  /** Canonical exponent separator. */
  readonly exponent: string;
  /** Separators accepted in strict mode. */
  readonly strict: SeparatorSet;
  /** Separators accepted in the default, lenient mode. */
  readonly loose: SeparatorSet;
}

const cache = new Map<string, LocaleData>();

function partsOf(nf: Intl.NumberFormat, value: number): Intl.NumberFormatPart[] {
  return nf.formatToParts(value);
}

function part(parts: Intl.NumberFormatPart[], type: string, fallback: string): string {
  for (const p of parts) if (p.type === type) return p.value;
  return fallback;
}

function cacheKey(locale: LocaleInput): string {
  if (locale === undefined) return "";
  return typeof locale === "string" ? locale : locale.join(",");
}

function unique(values: string[]): string[] {
  return values.filter((v, i) => v !== "" && values.indexOf(v) === i);
}

/**
 * Builds (or returns from cache) the locale data for `locale`.
 * @internal
 */
export function localeData(locale?: LocaleInput): LocaleData {
  const key = cacheKey(locale);
  const hit = cache.get(key);
  if (hit) return hit;

  const tags = locale === undefined ? undefined : typeof locale === "string" ? locale : [...locale];
  const nf = new Intl.NumberFormat(tags, { useGrouping: true });
  const resolved = nf.resolvedOptions();
  const main = partsOf(nf, -1234567.891);
  const plus = partsOf(new Intl.NumberFormat(tags, { signDisplay: "always" }), 1);
  const percent = partsOf(new Intl.NumberFormat(tags, { style: "percent" }), 0.5);
  const sci = partsOf(new Intl.NumberFormat(tags, { notation: "scientific" }), 12345);
  const plain = new Intl.NumberFormat(tags, { useGrouping: false, maximumFractionDigits: 0 });
  let digits = "";
  for (let d = 0; d < 10; d++) digits += plain.format(d);

  const info: LocaleInfo = {
    locale: resolved.locale,
    numberingSystem: resolved.numberingSystem,
    decimal: part(main, "decimal", "."),
    group: part(main, "group", ","),
    minusSign: part(main, "minusSign", "-"),
    plusSign: part(plus, "plusSign", "+"),
    percentSign: part(percent, "percentSign", "%"),
    exponent: part(sci, "exponentSeparator", "E"),
    digits,
  };

  const decimal = prepare(info.decimal) || ".";
  // A group separator made of whitespace (fr-FR, ru-RU, sv-SE) is canonically " ".
  const group = prepare(info.group) || " ";
  const exponent = prepare(info.exponent) || "E";

  const altDecimal = decimal === "\u066B" ? ["."] : [];
  const decimals = unique([decimal, ...altDecimal]);
  const altGroup =
    decimal === "," ? ["."] : decimal === "." ? [","] : ["\u066C", ","];
  const groups = unique([group, " ", "'", ...altGroup]).filter((g) => !decimals.includes(g));

  const data: LocaleData = {
    info,
    decimal,
    group,
    exponent,
    strict: { decimals: [decimal], groups: [group] },
    loose: { decimals, groups },
  };
  cache.set(key, data);
  return data;
}

/**
 * Returns the number symbols `numberparrot` uses for a locale. Values come
 * straight from `Intl.NumberFormat#formatToParts()` and are cached per locale.
 *
 * @param locale - BCP 47 tag such as `"pt-BR"`, a list of tags, or nothing for the runtime default.
 *
 * @example
 * ```ts
 * import { getLocaleInfo } from "numberparrot";
 *
 * getLocaleInfo("pt-BR").decimal; // ","
 * getLocaleInfo("fr-FR").group;   // "\u202F" (narrow no-break space)
 * getLocaleInfo("ar-EG").digits;  // Arabic-Indic digits
 * ```
 */
export function getLocaleInfo(locale?: LocaleInput): LocaleInfo {
  return localeData(locale).info;
}
