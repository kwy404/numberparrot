import { describe, expect, it } from "vitest";
import { createParser, parseColumn, tryParse } from "../src";

describe("tryParse", () => {
  it("returns the value when the input is valid", () => {
    expect(tryParse("1.234,56", "pt-BR")).toEqual({ ok: true, value: 1234.56, code: null, message: null });
    expect(tryParse(42, "en-US")).toEqual({ ok: true, value: 42, code: null, message: null });
    expect(tryParse("15%", "en-US", { keepPercent: true }).value).toBe(15);
  });

  it("explains a rejection without throwing", () => {
    const result = tryParse("1,23", "en-US");
    expect(result.ok).toBe(false);
    expect(result.value).toBeNaN();
    expect(result.code).toBe("INVALID_GROUPING");
    expect(result.message).toMatch(/wrong places/);
    expect(tryParse("", "en-US").code).toBe("EMPTY");
    expect(tryParse("abc", "en-US").code).toBe("NO_DIGITS");
    expect(tryParse(NaN, "en-US").code).toBe("NO_DIGITS");
    expect(tryParse({} as unknown as string, "en-US").code).toBe("NOT_A_STRING");
  });

  it("keeps the strict rules without throwing", () => {
    expect(tryParse("1 234.5", "en-US", { strict: true }).code).toBe("INVALID_SEPARATOR");
    expect(tryParse("1 234.5", "en-US").ok).toBe(true);
    expect(tryParse(Infinity, "en-US", { strict: true }).code).toBe("OUT_OF_RANGE");
  });

  it("is available on a bound parser", () => {
    const de = createParser("de-DE");
    expect(de.tryParse("1.234,5").value).toBe(1234.5);
    expect(de.tryParse("1,2,3").ok).toBe(false);
  });
});

describe("parseColumn", () => {
  it("lets an unambiguous cell decide the whole column", () => {
    const result = parseColumn(["1,234", "12,5", "1.000,00"]);
    expect(result.values).toEqual([1.234, 12.5, 1000]);
    expect(result.decimal).toBe(",");
    expect(result.locale).toBe("pt-BR");
    expect(result.ambiguous).toBe(false);
    expect(result.invalid).toEqual([]);
    expect(result.confidence).toBeGreaterThan(0.85);
    expect(result.reason).toMatch(/"12,5" \(row 2\)/);
  });

  it("reads an English column the English way", () => {
    const result = parseColumn(["1,234", "1,234,567.5", "0.25"]);
    expect(result.values).toEqual([1234, 1234567.5, 0.25]);
    expect(result.decimal).toBe(".");
    expect(result.locale).toBe("en-US");
  });

  it("reports a column no cell can settle", () => {
    const result = parseColumn(["1,234", "5,678"]);
    expect(result.ambiguous).toBe(true);
    expect(result.confidence).toBe(0.5);
    expect(result.values).toEqual([1234, 5678]);
    expect(parseColumn(["1,234", "5,678"], ["pt-BR", "en-US"]).values).toEqual([1.234, 5.678]);
  });

  it("skips blank cells and lists the cells that are not numbers", () => {
    const result = parseColumn(["R$ 1.234,56", "", "  ", "n/a", "R$ 10,00"]);
    expect(result.values.slice(0, 1)).toEqual([1234.56]);
    expect(result.values[1]).toBeNaN();
    expect(result.values[4]).toBe(10);
    expect(result.invalid).toEqual([3]);
    expect(result.confidence).toBeLessThan(0.95);
  });

  it("counts votes when cells disagree and flags the odd one out", () => {
    const result = parseColumn(["1,5", "2,25", "3.75"]);
    expect(result.decimal).toBe(",");
    expect(result.reason).toMatch(/2 of 3 cells/);
    expect(result.values.slice(0, 2)).toEqual([1.5, 2.25]);
    expect(result.invalid).toEqual([2]);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("handles other scripts and spaces", () => {
    expect(parseColumn(["\u0661\u066C\u0662\u0663\u0664\u066B\u0665", "\u0667"]).locale).toBe("ar-EG");
    const fr = parseColumn(["1 234,5", "12 000"]);
    expect(fr.values).toEqual([1234.5, 12000]);
  });

  it("returns an empty result when nothing is a number", () => {
    const result = parseColumn(["abc", ""]);
    expect(result.locale).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.invalid).toEqual([0]);
    expect(parseColumn([]).values).toEqual([]);
  });

  it("treats whole numbers as certain", () => {
    expect(parseColumn(["1", "22", "333"])).toMatchObject({ values: [1, 22, 333], confidence: 1, ambiguous: false });
  });
});
