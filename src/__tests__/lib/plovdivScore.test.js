import { describe, expect, it } from "vitest";
import { plovdivProgram, plovdivVariantScores } from "@/lib/plovdivScore";

const row = { university_name: 'Пловдивски университет „Паисий Хилендарски"', city: "Пловдив", specialty: "Биология" };

describe("Пловдивски университет, отделни начини за балообразуване", () => {
    it("събира само съставките вътре в един вариант", () => {
        const rule = plovdivProgram(row);
        expect(plovdivVariantScores(rule, { science: 5, bulgarian: "5,75", biology: 5.5 })).toEqual([30, 34]);
        expect(plovdivVariantScores(rule, { science: 6, biology: 6 })).toEqual([36, null]);
        expect(plovdivVariantScores(rule, { science: 2, biology: 5 })).toEqual([null, null]);
    });
    it("пази теглата и задължителния допълнителен изпит за психология", () => {
        const rule = plovdivProgram({ ...row, specialty: "Психология" });
        expect(rule.note).toMatch(/говорните/);
        expect(plovdivVariantScores(rule, { exam: 5, bel: 6, second: 5 })).toEqual([30, 32]);
        expect(plovdivVariantScores(rule, { exam: 5, bel: 6, second: "5x" })).toEqual([30, null]);
    });
    it("прилага правилата само към потвърдената година, специалност и кампус", () => {
        expect(plovdivProgram({ ...row, city: "Смолян" })).toBeNull();
        expect(plovdivProgram({ ...row, academic_year: "2027/2028" })).toBeNull();
        expect(plovdivProgram({ ...row, university_name: "Друг университет" })).toBeNull();
        const music = plovdivProgram({ ...row, specialty: "Музика" });
        expect(plovdivVariantScores(music, { exam: 5, dzi: 5, instrument: 6 })).toEqual([30, 34]);
        const teaching = plovdivProgram({ ...row, specialty: "Педагогика на обучението по музика" });
        expect(plovdivVariantScores(teaching, { instrument: 6 })).toEqual([null, null, 36]);
    });
});
