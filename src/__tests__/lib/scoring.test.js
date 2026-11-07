import { describe, it, expect } from "vitest";
import { calculateScore, findSeparateDiplomaKeys, isValidGradeValue } from "@/lib/scoring";

// Формулите са копирани от реални редове в таблица universities (коефициенти по МОН
// правилниците). Очакваните стойности са смятани на ръка, не с кода под тест.
const SU_MEDICINA = {
    max_ball: 42, // 3×6 + 3×6 + 6
    coefficients: [
        { alternatives: [{ key: "exam_bio", coef: 3 }] },
        { alternatives: [{ key: "exam_him", coef: 3 }] },
        { alternatives: [{ key: "dzi_bel", coef: 1 }] },
    ],
};

const SU_PRAVO = {
    max_ball: 24, // 3×6 + 6
    coefficients: [
        { alternatives: [{ key: "dzi_bel", coef: 3 }] },
        { alternatives: [{ key: "diploma", coef: 1 }] },
    ],
};

const SU_INFORMATIKA = {
    max_ball: 25.5, // 3.25×6 + 6
    coefficients: [
        {
            alternatives: [
                { key: "exam_mat", coef: 3.25 }, { key: "dzi1_mat", coef: 3.25 },
                { key: "dzi1_informatika", coef: 3.25 }, { key: "dzi1_it", coef: 2.75 },
                { key: "dzi2_mat", coef: 2.75 },
            ],
        },
        { alternatives: [{ key: "mat", coef: 1 }] },
    ],
};

const TU_KST = {
    max_ball: 30, // 6 + 6 + 3×6
    coefficients: [
        { alternatives: [{ key: "mat", coef: 1 }] },
        { alternatives: [{ key: "fiz", coef: 1 }, { key: "informatika", coef: 1 }, { key: "it", coef: 1 }] },
        {
            alternatives: [
                { key: "exam_mat", coef: 3 }, { key: "dzi_mat", coef: 3 }, { key: "dzi_fiz", coef: 3 },
                { key: "dzi_bel", coef: 2.5 },
            ],
        },
    ],
};

describe("calculateScore — реални формули", () => {
    it("СУ Медицина: 3×Био + 3×Хим + БЕЛ", () => {
        const { score, missingSlots } = calculateScore(SU_MEDICINA.coefficients, {
            exam_bio: "6", exam_him: "5.50", dzi_bel: "5",
        });
        expect(score).toBeCloseTo(3 * 6 + 3 * 5.5 + 5, 10); // 39.5
        expect(missingSlots).toEqual([]);
    });

    it("СУ Право: 3×БЕЛ + диплома", () => {
        expect(calculateScore(SU_PRAVO.coefficients, { dzi_bel: "5.50", diploma: "5" }).score).toBeCloseTo(21.5, 10);
    });

    it("СУ Информатика: най-добрата алтернатива + диплома по математика (отделен член)", () => {
        // 3.25×5.50 = 17.875 печели срещу 2.75×6 = 16.50; + диплома 5
        const { score } = calculateScore(SU_INFORMATIKA.coefficients, { dzi1_mat: "5.50", dzi1_it: "6", mat: "5" });
        expect(score).toBeCloseTo(22.875, 10);
    });

    it("взима по-високото произведение, не по-високата оценка", () => {
        // ДЗИ-ИТ 6.00 × 2.75 = 16.50 печели срещу Мат 5.00 × 3.25 = 16.25
        const { score } = calculateScore(SU_INFORMATIKA.coefficients, { dzi1_mat: "5", dzi1_it: "6", mat: "2" });
        expect(score).toBeCloseTo(16.5 + 2, 10);
        // а при Мат 5.50 (17.875) срещу ИТ 6.00 (16.50) печели математиката
        const { score: s2 } = calculateScore(SU_INFORMATIKA.coefficients, { dzi1_mat: "5.50", dzi1_it: "6", mat: "2" });
        expect(s2).toBeCloseTo(17.875 + 2, 10);
    });

    it("ТУ-София КСТ: три слота, БЕЛ×2.5 като алтернатива на 3×ДЗИ", () => {
        // слот 3: max(3×5.5 = 16.5; 2.5×6 = 15) = 16.5; слот 2: Физ 4.5; слот 1: Мат 5
        const { score } = calculateScore(TU_KST.coefficients, { mat: "5", fiz: "4.5", dzi_mat: "5.5", dzi_bel: "6" });
        expect(score).toBeCloseTo(26, 10);
    });

    it.each([
        ["СУ Медицина", SU_MEDICINA],
        ["СУ Право", SU_PRAVO],
        ["СУ Информатика", SU_INFORMATIKA],
        ["ТУ КСТ", TU_KST],
    ])("%s: с шестици навсякъде се получава точно max_ball", (_n, f) => {
        const grades = {};
        f.coefficients.forEach(s => s.alternatives.forEach(a => { grades[a.key] = "6"; }));
        expect(calculateScore(f.coefficients, grades).score).toBeCloseTo(f.max_ball, 10);
    });
});

describe("calculateScore — липсващи и невалидни оценки", () => {
    it("връща липсващия слот с ключовете му и не го брои в бала", () => {
        const { score, missingSlots } = calculateScore(SU_PRAVO.coefficients, { dzi_bel: "5.50" });
        expect(score).toBeCloseTo(16.5, 10);
        expect(missingSlots).toEqual([["diploma"]]);
    });

    it("оценки извън 2.00–6.00 и нечислови се третират като липсващи", () => {
        for (const bad of ["7", "1.99", "6.01", "abc", "", null, undefined]) {
            const { score, missingSlots } = calculateScore(SU_PRAVO.coefficients, { dzi_bel: bad, diploma: "5" });
            expect(score).toBeCloseTo(5, 10);
            expect(missingSlots).toEqual([["dzi_bel"]]);
        }
    });

    it("границите 2.00 и 6.00 са валидни", () => {
        expect(calculateScore(SU_PRAVO.coefficients, { dzi_bel: "2", diploma: "2" }).score).toBeCloseTo(8, 10);
        expect(calculateScore(SU_PRAVO.coefficients, { dzi_bel: "6.00", diploma: "6.00" }).score).toBeCloseTo(24, 10);
    });

    it("празна или липсваща формула → 0 без грешка", () => {
        expect(calculateScore([], { a: "5" })).toEqual({ score: 0, missingSlots: [] });
        expect(calculateScore(undefined, {})).toEqual({ score: 0, missingSlots: [] });
        expect(calculateScore(SU_PRAVO.coefficients, undefined).score).toBe(0);
    });

    it("isValidGradeValue", () => {
        expect(isValidGradeValue("5.5")).toBe(true);
        expect(isValidGradeValue("1.5")).toBe(false);
        expect(isValidGradeValue("")).toBe(false);
    });
});

describe("findSeparateDiplomaKeys", () => {
    it("СУ Информатика: дипломата по математика е отделен член", () => {
        expect(findSeparateDiplomaKeys([SU_INFORMATIKA]).has("mat")).toBe(true);
    });

    it("ТУ-София КСТ: дипломните предмети до изпитния слот са отделни", () => {
        const keys = findSeparateDiplomaKeys([TU_KST]);
        expect(keys.has("mat")).toBe(true);
        expect(keys.has("fiz")).toBe(true);
        expect(keys.has("dzi_mat")).toBe(false);
    });

    it("формула без дипломен предмет до изпит от същата група → празно", () => {
        expect(findSeparateDiplomaKeys([SU_MEDICINA]).size).toBe(0);
        expect(findSeparateDiplomaKeys([]).size).toBe(0);
        expect(findSeparateDiplomaKeys(undefined).size).toBe(0);
    });
});
