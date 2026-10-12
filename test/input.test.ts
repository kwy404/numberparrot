import { describe, expect, it } from "vitest";
import { normalizeInput } from "../src";

describe("normalizeInput", () => {
  it("keeps partial values valid while typing", () => {
    expect(normalizeInput("1.234,", "pt-BR")).toEqual({ text: "1.234,", value: 1234, valid: true, complete: false });
    expect(normalizeInput("1.2", "pt-BR")).toEqual({ text: "1.2", value: 12, valid: true, complete: false });
    expect(normalizeInput("-", "en-US")).toMatchObject({ text: "-", valid: true, complete: false });
    expect(normalizeInput("", "en-US").value).toBeNaN();
    expect(normalizeInput("1 ", "fr-FR")).toMatchObject({ text: "1 ", value: 1, valid: true, complete: false });
  });

  it("reports complete values", () => {
    expect(normalizeInput("1.234,56", "pt-BR")).toEqual({
      text: "1.234,56",
      value: 1234.56,
      valid: true,
      complete: true,
    });
  });

  it("simulates typing a number key by key", () => {
    const typed = "1.234.567,89";
    for (let i = 1; i <= typed.length; i++) {
      const state = normalizeInput(typed.slice(0, i), "pt-BR");
      expect(state.valid, typed.slice(0, i)).toBe(true);
    }
  });

  it("drops letters, currency symbols and extra decimals", () => {
    expect(normalizeInput("R$ 1.234,56", "pt-BR").text).toBe("1.234,56");
    expect(normalizeInput("12,3,4", "pt-BR").text).toBe("12,34");
    expect(normalizeInput("1a2b3", "en-US").text).toBe("123");
    expect(normalizeInput("5-", "en-US").text).toBe("5");
  });

  it("limits fraction digits", () => {
    expect(normalizeInput("R$ 1.234,567", "pt-BR", { maxFractionDigits: 2 })).toEqual({
      text: "1.234,56",
      value: 1234.56,
      valid: true,
      complete: true,
    });
    expect(normalizeInput("12.5", "en-US", { maxFractionDigits: 0 }).text).toBe("125");
  });

  it("can forbid negatives", () => {
    expect(normalizeInput("-5", "en-US", { allowNegative: false }).text).toBe("5");
  });

  it("converts any digit script to ASCII", () => {
    expect(normalizeInput("\u0661\u0662\u066B\u0665", "ar-EG")).toEqual({
      text: "12\u066B5",
      value: 12.5,
      valid: true,
      complete: true,
    });
    expect(normalizeInput("\uFF11\uFF12\uFF13", "ja-JP").text).toBe("123");
  });

  it("flags input that can never become a number", () => {
    expect(normalizeInput("1,2,3", "en-US").valid).toBe(false);
  });
});
