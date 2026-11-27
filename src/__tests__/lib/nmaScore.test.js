import { expect, it } from "vitest";
import { nmaProgram, nmaScore } from "@/lib/nmaScore";

it("triples the specialty grade and applies the theory penalty and threshold", () => {
    expect(nmaScore(6, true)).toEqual({ score: 18, eligible: true });
    expect(nmaScore("4,5", false)).toEqual({ score: 12.5, eligible: true });
    expect(nmaScore(4, false)).toEqual({ score: 11, eligible: false });
    expect(nmaScore(3.9, true)).toBeNull();
    expect(nmaScore(6, null)).toBeNull();
});

it("handles only the four documented programs", () => {
    expect(nmaProgram({ university_name: 'Национална музикална академия „Проф. Панчо Владигеров”', specialty: "Фолклорно пеене" })).toBeTruthy();
    expect(nmaProgram({ university_name: 'Национална музикална академия „Проф. Панчо Владигеров”', specialty: "Поп и джаз пеене" })).toBeNull();
});
