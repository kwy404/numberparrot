import { describe, expect, it } from "vitest";
import { getLocaleInfo, parse } from "../src";
import { LOCALES } from "./helpers";

/** Hand written inputs as people really type or paste them, per locale. */
const MATRIX: Record<(typeof LOCALES)[number], [string, number][]> = {
  "en-US": [
    ["1,234.56", 1234.56],
    ["-1,234.56", -1234.56],
    ["$1,234.56", 1234.56],
    ["1234.56", 1234.56],
    [".5", 0.5],
    ["1,234,567", 1234567],
  ],
  "pt-BR": [
    ["1.234,56", 1234.56],
    ["R$ 1.234,56", 1234.56],
    ["-R$ 1.234,56", -1234.56],
    ["1234,56", 1234.56],
    ["0,29", 0.29],
    ["1.000.000", 1000000],
  ],
  "de-DE": [
    ["1.234,56", 1234.56],
    ["1.234,56 \u20AC", 1234.56],
    ["-1.234,56\u00A0\u20AC", -1234.56],
    ["1234,56", 1234.56],
    ["1 234,56", 1234.56],
  ],
  "fr-FR": [
    ["1\u202F234,56", 1234.56],
    ["1\u00A0234,56", 1234.56],
    ["1 234,56", 1234.56],
    ["1\u202F234,56\u00A0\u20AC", 1234.56],
    ["-1\u202F234,56", -1234.56],
    ["1.234,56", 1234.56],
  ],
  "de-CH": [
    ["1\u2019234.56", 1234.56],
    ["1'234.56", 1234.56],
    ["CHF 1'234.56", 1234.56],
    ["CHF-1\u2019234.56", -1234.56],
    ["1\u2019000\u2019000", 1000000],
  ],
  "en-IN": [
    ["12,34,567.89", 1234567.89],
    ["\u20B912,34,567.89", 1234567.89],
    ["1,00,000", 100000],
    ["1,00,00,000", 10000000],
    ["Rs.500", 500],
    ["1,234,567.89", 1234567.89],
  ],
  "ar-EG": [
    ["\u0661\u066C\u0662\u0663\u0664\u066B\u0665\u0666", 1234.56],
    ["\u061C-\u0661\u066C\u0662\u0663\u0664\u066B\u0665\u0666", -1234.56],
    ["\u0661\u066C\u0662\u0663\u0664\u066B\u0665\u0666\u00A0\u062C.\u0645.\u200F", 1234.56],
    ["\u0661\u0665\u066A", 0.15],
    ["1,234.56", 1234.56],
  ],
  "fa-IR": [
    ["\u06F1\u066C\u06F2\u06F3\u06F4\u066B\u06F5\u06F6", 1234.56],
    ["\u200E\u2212\u06F1\u066C\u06F2\u06F3\u06F4\u066B\u06F5\u06F6", -1234.56],
    ["\u06F1\u06F2\u06F3", 123],
    ["\u06F5\u06F0\u066A", 0.5],
  ],
  "hi-IN": [
    ["12,34,567.89", 1234567.89],
    ["\u0967\u0968,\u0969\u096A,\u096B\u096C\u096D.\u096E\u096F", 1234567.89],
    ["\u20B9\u0967,\u0966\u0966,\u0966\u0966\u0966", 100000],
  ],
  "th-TH": [
    ["1,234.56", 1234.56],
    ["\u0E51,\u0E52\u0E53\u0E54.\u0E55\u0E56", 1234.56],
    ["\u0E3F1,234.56", 1234.56],
  ],
  "ja-JP": [
    ["1,234.56", 1234.56],
    ["\uFF11\uFF0C\uFF12\uFF13\uFF14\uFF0E\uFF15\uFF16", 1234.56],
    ["\uFFE51,234", 1234],
    ["\u00A51,234", 1234],
    ["\uFF0D\uFF15", -5],
  ],
  "es-ES": [
    ["1.234,56", 1234.56],
    ["12.345,67\u00A0\u20AC", 12345.67],
    ["1234,56", 1234.56],
  ],
  "it-IT": [
    ["1.234,56", 1234.56],
    ["1.234,56\u00A0\u20AC", 1234.56],
    ["-1.234,56", -1234.56],
  ],
  "ru-RU": [
    ["1\u00A0234,56", 1234.56],
    ["1 234,56\u00A0\u20BD", 1234.56],
    ["-1 234,56 \u0440\u0443\u0431.", -1234.56],
  ],
  "pl-PL": [
    ["1\u00A0234,56", 1234.56],
    ["1234,56 z\u0142", 1234.56],
    ["12\u00A0345,67\u00A0z\u0142", 12345.67],
  ],
  "sv-SE": [
    ["1\u00A0234,56", 1234.56],
    ["\u22121\u00A0234,56", -1234.56],
    ["1 234,56 kr", 1234.56],
  ],
  "tr-TR": [
    ["1.234,56", 1234.56],
    ["\u20BA1.234,56", 1234.56],
    ["%15", 0.15],
    ["-%15", -0.15],
  ],
};

describe.each(LOCALES)("locale %s", (locale) => {
  it.each(MATRIX[locale])("parses %j", (input, expected) => {
    expect(parse(input, locale)).toBe(expected);
  });

  it("parses its own Intl.NumberFormat output", () => {
    const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
    for (const value of [-1234567.891, 0.5, 42, 1e9, -0.001]) {
      expect(parse(nf.format(value), locale)).toBe(value);
    }
  });

  it("derives separators from Intl", () => {
    const info = getLocaleInfo(locale);
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
    expect(info.decimal).toBe(parts.find((p) => p.type === "decimal")?.value);
    expect(info.group).toBe(parts.find((p) => p.type === "group")?.value);
    expect(info.digits).toHaveLength(10);
  });

  it("rejects text that is not a number", () => {
    expect(parse("abc", locale)).toBeNaN();
    expect(parse("", locale)).toBeNaN();
    expect(parse("12 apples", locale)).toBeNaN();
  });
});

describe("numbering systems", () => {
  it.each([
    ["ar-EG-u-nu-latn", "1,234.56"],
    ["th-TH-u-nu-thai", "\u0E51,\u0E52\u0E53\u0E54.\u0E55\u0E56"],
    ["hi-IN-u-nu-deva", "\u0967,\u0968\u0969\u096A.\u096B\u096C"],
    ["bn-BD", "\u09E7,\u09E8\u09E9\u09EA.\u09EB\u09EC"],
  ])("%s", (locale, input) => {
    expect(parse(input, locale)).toBe(1234.56);
    expect(parse(new Intl.NumberFormat(locale).format(1234.56), locale)).toBe(1234.56);
  });

  it("accepts any script of digits regardless of locale", () => {
    expect(parse("\u0661\u0662\u0663", "en-US")).toBe(123);
    expect(parse("\uFF11\uFF12\uFF13", "de-DE")).toBe(123);
    expect(parse("\u{1D7CF}\u{1D7D0}", "en-US")).toBe(12); // mathematical bold digits
  });
});
