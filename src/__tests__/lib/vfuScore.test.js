import { describe, expect, it } from "vitest";
import { vfuProgram, vfuScore } from "../../lib/vfuScore";

const row = { university_name: 'Варненски свободен университет „Черноризец Храбър”', specialty: "Психология", academic_year: "2026/2027" };

describe("ВСУ 2026/2027", () => {
    it("избира потвърдените правила и отделя Архитектура", () => {
        expect(vfuProgram(row)?.url).toContain("psihologiya");
        expect(vfuProgram({ ...row, specialty: "Строителен инженеринг" })?.maxScore).toBe(25);
        expect(vfuProgram({ ...row, specialty: "Архитектура" })).toBeNull();
    });
    it("изчислява основния бал и бонификацията", () => {
        expect(vfuScore("5,50", "5", false)).toBe(16);
        expect(vfuScore(6, 6, true)).toBe(19);
        const construction = vfuProgram({ ...row, specialty: "Строителен инженеринг" });
        expect(vfuScore(6, 6, true, construction)).toBe(25);
    });
    it("отхвърля липсващи и невалидни оценки", () => {
        expect(vfuScore("", 5)).toBeNull();
        expect(vfuScore(2, 5)).toBeNull();
        expect(vfuScore(6.1, 5)).toBeNull();
    });
});
