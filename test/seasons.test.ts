import { beforeAll, describe, expect, it } from "vitest";

interface Seasons {
  IDS: string[];
  easter(year: number): Date;
  seasonFor(date: Date, br: boolean): string | null;
  pick(search: string, date: Date, br: boolean, store: { getItem(key: string): string | null } | null): { id: string; on: boolean } | null;
  label(id: string, br: boolean): string;
}

let S: Seasons;
beforeAll(async () => {
  // @ts-expect-error: plain browser script without type declarations
  await import("../assets/seasons/seasons.js");
  S = (globalThis as unknown as { numberparrotSeasons: Seasons }).numberparrotSeasons;
});

const day = (y: number, m: number, d: number): Date => new Date(y, m - 1, d, 12);
const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("seasons", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2029, "2029-04-01"],
    [2030, "2030-04-21"],
  ])("finds Easter %i", (year, date) => {
    expect(iso(S.easter(year))).toBe(date);
  });

  it.each([
    [day(2026, 12, 29), null],
    [day(2026, 12, 30), "newyear"],
    [day(2027, 1, 2), "newyear"],
    [day(2027, 1, 3), null],
    [day(2026, 12, 17), null],
    [day(2026, 12, 18), "christmas"],
    [day(2026, 12, 26), "christmas"],
    [day(2026, 12, 27), null],
    [day(2026, 10, 23), null],
    [day(2026, 10, 24), "halloween"],
    [day(2026, 10, 31), "halloween"],
    [day(2026, 11, 1), null],
    [day(2026, 2, 13), null],
    [day(2026, 2, 14), "carnival"],
    [day(2026, 2, 18), "carnival"],
    [day(2026, 2, 19), null],
    [day(2027, 2, 14), "valentine"],
    [day(2026, 4, 2), null],
    [day(2026, 4, 3), "easter"],
    [day(2026, 4, 5), "easter"],
    [day(2026, 4, 6), null],
    [day(2026, 6, 12), null],
    [day(2026, 6, 13), "junina"],
    [day(2026, 6, 29), "junina"],
    [day(2026, 6, 30), null],
  ])("%s is %s", (date, season) => {
    expect(S.seasonFor(date as Date, false)).toBe(season);
  });

  it("computes Carnival from Easter every year", () => {
    // 2025: Easter April 20, Ash Wednesday March 5, so Carnival runs March 1 to 5.
    expect(S.seasonFor(day(2025, 2, 28), false)).toBeNull();
    expect(S.seasonFor(day(2025, 3, 1), false)).toBe("carnival");
    expect(S.seasonFor(day(2025, 3, 5), false)).toBe("carnival");
    expect(S.seasonFor(day(2025, 3, 6), false)).toBeNull();
    // 2025 Good Friday is April 18.
    expect(S.seasonFor(day(2025, 4, 18), false)).toBe("easter");
    expect(S.seasonFor(day(2025, 4, 17), false)).toBeNull();
  });

  it("adds the Brazilian Valentine's Day and names Junina for pt-BR", () => {
    expect(S.seasonFor(day(2026, 6, 12), true)).toBe("valentine");
    expect(S.seasonFor(day(2026, 6, 12), false)).toBeNull();
    expect(S.seasonFor(day(2026, 6, 20), false)).toBe("junina");
    expect(S.label("junina", true)).toBe("Festa Junina");
    expect(S.label("junina", false)).toBe("Midsummer");
    expect(S.label("halloween", false)).toBe("Halloween");
  });

  it("follows the overrides and the stored off switch", () => {
    const july = day(2026, 7, 10);
    const none = { getItem: () => null };
    expect(S.pick("", july, false, none)).toBeNull();
    expect(S.pick("?season=christmas", july, false, none)).toEqual({ id: "christmas", on: true });
    expect(S.pick("?a=1&season=easter", july, false, none)).toEqual({ id: "easter", on: true });
    expect(S.pick("?season=off", day(2026, 10, 30), false, none)).toBeNull();
    expect(S.pick("?season=nope", day(2026, 10, 30), false, none)).toEqual({ id: "halloween", on: true });
    const off = { getItem: (k: string) => (k === "numberparrot:season-off:halloween" ? "1" : null) };
    expect(S.pick("", day(2026, 10, 30), false, off)).toEqual({ id: "halloween", on: false });
    expect(S.pick("?season=halloween", day(2026, 10, 30), false, off)).toEqual({ id: "halloween", on: true });
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(S.pick("", day(2026, 10, 30), false, broken)).toEqual({ id: "halloween", on: true });
  });

  it("knows every season", () => {
    expect(S.IDS).toEqual(["newyear", "carnival", "easter", "valentine", "junina", "halloween", "christmas"]);
  });
});
