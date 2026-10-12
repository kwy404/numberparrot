import { describe, expect, it } from "vitest";
import { detect } from "../src";

describe("detect", () => {
  it("finds the decimal when both separators appear", () => {
    const result = detect("1.234,56");
    expect(result).toMatchObject({ value: 1234.56, decimal: ",", group: ".", ambiguous: false });
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.locales.slice(0, 3)).toEqual(["pt-BR", "es-ES", "de-DE"]);
    expect(result.locales).not.toContain("en-US");
  });

  it("reports '1,234' as ambiguous with both readings", () => {
    const result = detect("1,234");
    expect(result.ambiguous).toBe(true);
    expect(result.confidence).toBe(0.5);
    expect(result.value).toBe(1234);
    expect(result.alternatives).toEqual([1234, 1.234]);
    expect(result.reason).toMatch(/thousands or a decimal/);
  });

  it("breaks ties with the candidate order", () => {
    expect(detect("1,234", ["pt-BR", "en-US"]).value).toBe(1.234);
    expect(detect("1.234", ["de-DE"]).value).toBe(1234);
    expect(detect("1.234", ["en-US"]).value).toBe(1.234);
  });

  it.each([
    ["1,5", 1.5, ","],
    ["12.50", 12.5, "."],
    ["0,123", 0.123, ","],
    ["1234,567", 1234.567, ","],
    ["1 234,56", 1234.56, ","],
    ["1'234.56", 1234.56, "."],
    ["12,34,567.89", 1234567.89, "."],
    ["1.234.567", 1234567, ","],
    ["\u0661\u066C\u0662\u0663\u0664\u066B\u0665", 1234.5, "\u066B"],
  ])("%j is unambiguous", (input, value, decimal) => {
    const result = detect(input);
    expect(result.value).toBe(value);
    expect(result.decimal).toBe(decimal);
    expect(result.ambiguous).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("ranks locales by group separator and digit script", () => {
    expect(detect("1'234.56").locales[0]).toBe("de-CH");
    expect(detect("1 234,56").locales[0]).toBe("fr-FR");
    expect(detect("\u06F1\u06F2\u06F3").locales[0]).toBe("fa-IR");
    expect(detect("\u0661\u0662\u0663").locales[0]).toBe("ar-EG");
  });

  it("handles whole numbers and currency", () => {
    expect(detect("42")).toMatchObject({ value: 42, decimal: null, confidence: 1, ambiguous: false });
    expect(detect("R$ 1.234,56").value).toBe(1234.56);
  });

  it("gives zero confidence for non numbers", () => {
    for (const input of ["abc", "1,2,3.4.5", "1;5", "1.234,567.8"]) {
      const result = detect(input);
      expect(result.value, input).toBeNaN();
      expect(result.confidence).toBe(0);
      expect(result.locales).toEqual([]);
    }
  });
});
