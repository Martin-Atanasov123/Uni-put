import { describe, it, expect } from "vitest";
import { assessFormula } from "../../lib/formulaIntegrity";

const row = { max_ball: 24, coefficients: [
    { alternatives: [{ key: "exam", coef: 3 }, { key: "dzi", coef: 2.5 }] },
    { alternatives: [{ key: "diploma", coef: 1 }] },
] };

describe("Проверка на скалата на университетския бал", () => {
    it("избира най-високата допустима тежест за всеки слот", () => {
        expect(assessFormula(row)).toEqual({ maximum: 24, issue: null });
    });
    it("отделя програма с различна скала", () => {
        expect(assessFormula({ ...row, max_ball: 1000 }).issue).toBe("scale");
    });
    it("третира бонификацията като фиксирана точка, а не оценка до 6", () => {
        const withBonus = {
            max_ball: 25,
            coefficients: [
                { alternatives: [{ key: "exam", coef: 2 }] },
                { alternatives: [{ key: "obsht_uspeh", coef: 2 }] },
                { alternatives: [{ key: "bonifikaciq", coef: 1 }] },
            ],
        };
        expect(assessFormula(withBonus)).toEqual({ maximum: 25, issue: null });
    });
    it("отхвърля липсващи слотове и повредени тежести", () => {
        for (const coefficients of [[], [null], [{ alternatives: [] }], [{ alternatives: [{ key: "exam", coef: "abc" }] }]]) {
            expect(assessFormula({ ...row, coefficients }).issue).toBeTruthy();
        }
    });
});
