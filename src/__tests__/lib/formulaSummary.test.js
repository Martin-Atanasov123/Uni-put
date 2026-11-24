import { describe, it, expect } from "vitest";
import { summarizeFormula, termToText, termSyntaxOk } from "@/lib/formulaSummary";
import { calculateScore } from "@/lib/scoring";

// Реални записи от public.universities (formula_description + coefficients), ноември 2026.
const A = (key, coef) => ({ key, coef });
const REAL = {
    // ── поддържани структури ──
    puInformatika: {
        formula_description: "3×Изпит(Мат/Инф)/ДЗИ(Мат/Инф/ИТ) + 2×Мат(дипл.) + Мат/Инф/ИТ(дипл.)",
        coefficients: [
            { alternatives: [A("exam_mat", 3), A("exam_informatika", 3), A("dzi_mat", 3), A("dzi_informatika", 3), A("dzi_it", 3)] },
            { alternatives: [A("mat", 2)] },
            { alternatives: [A("mat", 1), A("dzi_informatika", 1), A("dzi_it", 1)] },
        ],
    },
    suInformatika: {
        formula_description: "3.25×Изпит(Мат)/3.25×ДЗИ¹(Мат)/3.25×ДЗИ¹(Инф)/3.25×Олимпиада(Мат/Инф)/2.75×ДЗИ¹(ИТ)/2.75×ДЗИ²(Мат)/2.75×Олимпиада(ИТ) + Мат(д)",
        coefficients: [
            { alternatives: [A("exam_mat", 3.25), A("dzi1_mat", 3.25), A("dzi1_informatika", 3.25), A("olympiad_winner_mat_inf", 3.25), A("olympiad_laureate_mat_inf", 3.25), A("dzi1_it", 2.75), A("dzi2_mat", 2.75), A("olympiad_winner_it", 2.75), A("olympiad_laureate_it", 2.75)] },
            { alternatives: [A("mat", 1)] },
        ],
    },
    trakiaMedicine: {
        formula_description: "ДЗИ(БЕЛ) + 3×Изпит(Био) + 3×Изпит(Хим)",
        coefficients: [{ alternatives: [A("dzi_bel", 1)] }, { alternatives: [A("exam_bio", 3)] }, { alternatives: [A("exam_him", 3)] }],
    },
    bel3: {
        formula_description: "3×Изпит(БЕЛ)/ДЗИ(БЕЛ) + БЕЛ(д) + Ист(д)",
        coefficients: [{ alternatives: [A("exam_bel", 3), A("dzi_bel", 3)] }, { alternatives: [A("bel", 1)] }, { alternatives: [A("ist", 1)] }],
    },
    french6: {
        formula_description: "6×Изпит(Фр)/ДЗИ(Фр)",
        coefficients: [{ alternatives: [A("exam_frenski", 6), A("dzi_frenski", 6)] }],
    },
    // ── неподдържани / нееднозначни → оригиналът ──
    nbu: {
        formula_description: "7×ТОП + 75×(Диплома–2) + 75×(СредДЗИ–2)",
        coefficients: [{ alternatives: [A("obsht_tehnicheski_test", 1)] }, { alternatives: [A("diploma", 1)] }, { alternatives: [A("dzi_bel", 1), A("dzi_mat", 1)] }],
    },
    englishThreshold: {
        formula_description: "Минимум 78% от Изпит(Англ.) или ДЗИ(Англ.) ≥ 5.00 или IELTS 6.0+ + Диплома",
        coefficients: [{ alternatives: [A("exam_angliiski", 1), A("dzi_angliiski", 1)] }, { alternatives: [A("diploma", 1)] }],
    },
    threeCoefsInSlot: {
        formula_description: "3×Изпит(Мат)/3×ДЗИ(Мат)/3×ДЗИ(Физ)/2.5×ЗДИППК/1.5×ДЗИ(БЕЛ) + Мат(д) + Физ(д)",
        coefficients: [
            { alternatives: [A("exam_mat", 3), A("dzi_mat", 3), A("dzi_fiz", 3), A("profesionalna_kvalifikaciq", 2.5), A("dzi_bel", 1.5)] },
            { alternatives: [A("mat", 1)] },
            { alternatives: [A("fiz", 1)] },
        ],
    },
    textMismatch: {
        // текстът казва едно събираемо, коефициентите — три
        formula_description: "4×О1",
        coefficients: [{ alternatives: [A("exam_ris", 4), A("dzi_ris", 4)] }, { alternatives: [A("bel", 1)] }, { alternatives: [A("diploma", 1)] }],
    },
    vsuCyrillicX: {
        formula_description: "(Кандидатстудентски изпит х 2) + (Общ успех х 2) + Бонификация",
        coefficients: [{ alternatives: [A("ese_obsht_tema", 2), A("dzi_chu_ezik", 2)] }, { alternatives: [A("obsht_uspeh", 2)] }, { alternatives: [A("bonifikaciq", 1)] }],
    },
    prose: {
        formula_description: "Конкурсен изпит: събеседване с комисия върху портфолио; може да включва практически задачи по рисуване и анимация",
        coefficients: [{ alternatives: [A("subesedvane", 1)] }],
    },
    genericActorExam: {
        // „Изпит(Актьор)“ е записан с общия ключ subesedvane → етикетът би бил грешен
        formula_description: "Изпит(Актьор)/ЗДИППК + СО + БЕЛ/ЧЕ(д)",
        coefficients: [{ alternatives: [A("subesedvane", 1), A("profesionalna_kvalifikaciq", 1)] }, { alternatives: [A("diploma", 1)] }, { alternatives: [A("bel", 1), A("chu_ezik", 1)] }],
    },
    navyGenericTest: {
        formula_description: "СО + ДЗИ(БЕЛ) + 3×Изпит(тест)/3×ДЗИ(Мат)/3×ДЗИ(Физ)/3×Изпит(Мат,др.ВУ)/2×втори ДЗИ",
        coefficients: [
            { alternatives: [A("diploma", 1)] }, { alternatives: [A("dzi_bel", 1)] },
            { alternatives: [A("obsht_tehnicheski_test", 3), A("dzi_mat", 3), A("dzi_fiz", 3), A("izpit_drugo_vu", 3), A("dzi_him", 2), A("dzi_bio", 2)] },
        ],
    },
    yuzuManyAlternatives: {
        formula_description: "2×Изпит(Мат)/ДЗИ(Мат/Инф/ИТ) или 1× КИ/ЗДЗИ + СО + Мат(д) + Инф/ИТ(д)",
        coefficients: [
            { alternatives: [A("exam_bel", 1), A("exam_mat", 2), A("exam_ist", 1), A("exam_geo", 1), A("exam_bio", 1), A("dzi_bel", 1), A("dzi_mat", 2), A("dzi_ist", 1), A("dzi_geo", 1), A("dzi_bio", 1), A("dzi_informatika", 2), A("dzi_it", 2)] },
            { alternatives: [A("diploma", 1)] }, { alternatives: [A("mat", 1)] }, { alternatives: [A("informatika", 1), A("it", 1)] },
        ],
    },
};

describe("summarizeFormula — поддържани структури", () => {
    it("ПУ Информатика: три събираеми с един множител", () => {
        const s = summarizeFormula(REAL.puInformatika);
        expect(s.ok).toBe(true);
        expect(s.terms.map(termToText)).toEqual([
            "3 × най-високата оценка от Изпит по математика, Изпит по информатика, ДЗИ Математика, ДЗИ Информатика, ДЗИ ИТ",
            "2 × Математика (диплома)",
            "1 × най-високата оценка от Математика (диплома), ДЗИ Информатика, ДЗИ ИТ",
        ]);
    });

    it("СУ Информатика: събираемо с два множителя (3,25 или 2,75)", () => {
        const s = summarizeFormula(REAL.suInformatika);
        expect(s.ok).toBe(true);
        expect(s.terms[0].groups.map(g => g.coef)).toEqual([3.25, 2.75]);
        expect(termToText(s.terms[0])).toMatch(/^3,25 × най-високата оценка от .+ или 2,75 × най-високата оценка от /);
        expect(termToText(s.terms[1])).toBe("1 × Математика (диплома)");
    });

    it("Медицина (Тракийски): прости събираеми", () => {
        const s = summarizeFormula(REAL.trakiaMedicine);
        expect(s.terms.map(termToText)).toEqual(["1 × ДЗИ БЕЛ", "3 × Изпит по биология", "3 × Изпит по химия"]);
    });

    it("„3×Изпит(БЕЛ)/ДЗИ(БЕЛ) + БЕЛ(д) + Ист(д)“", () => {
        expect(summarizeFormula(REAL.bel3).terms.map(termToText)).toEqual([
            "3 × най-високата оценка от Изпит по БЕЛ, ДЗИ БЕЛ", "1 × БЕЛ (диплома)", "1 × История (диплома)",
        ]);
    });

    it("едно събираемо с множител 6", () => {
        expect(summarizeFormula(REAL.french6).ok).toBe(true);
    });
});

describe("summarizeFormula — неподдържани или нееднозначни → оригиналът", () => {
    const cases = [
        ["НБУ: отместване 75×(Диплома–2)", REAL.nbu, "unsupported-text"],
        ["праг ≥ 5.00, минимум 78%, IELTS", REAL.englishThreshold, "unsupported-text"],
        ["три различни множителя в едно събираемо", REAL.threeCoefsInSlot, "too-many-coefs-in-slot"],
        ["„4×О1“ (текстът и коефициентите не съвпадат; ключът за рисуване е общ)", REAL.textMismatch, "generic-key"],
        ["„х 2“ с кирилско х в скоби", REAL.vsuCyrillicX, "unsupported-syntax"],
        ["описание в свободен текст (общ ключ „събеседване“)", REAL.prose, "generic-key"],
        ["общ ключ за различни изпити (Актьор)", REAL.genericActorExam, "generic-key"],
        ["общ ключ „тест“ във военните училища", REAL.navyGenericTest, "generic-key"],
        ["твърде много алтернативи", REAL.yuzuManyAlternatives, "too-many-alternatives"],
    ];
    for (const [name, row, reason] of cases) {
        it(name, () => {
            const s = summarizeFormula(row);
            expect(s.ok).toBe(false);
            expect(s.reason.split(":")[0]).toBe(reason);
        });
    }

    it("несъвпадение в броя събираеми (изкуствен случай)", () => {
        const row = { formula_description: "3×Изпит(БЕЛ)/ДЗИ(БЕЛ) + БЕЛ(д)", coefficients: REAL.bel3.coefficients };
        expect(summarizeFormula(row)).toMatchObject({ ok: false, reason: "term-count-mismatch" });
    });

    it("несъвпадение в множителите (изкуствен случай)", () => {
        const row = { formula_description: "2×Изпит(БЕЛ)/ДЗИ(БЕЛ) + БЕЛ(д) + Ист(д)", coefficients: REAL.bel3.coefficients };
        expect(summarizeFormula(row)).toMatchObject({ ok: false, reason: "coef-mismatch" });
    });

    it("свободен текст се отказва и без общ ключ (изкуствен случай)", () => {
        const row = { formula_description: "Конкурсен изпит: тест по специалността", coefficients: REAL.french6.coefficients };
        expect(summarizeFormula(row)).toMatchObject({ ok: false, reason: "unsupported-syntax" });
    });

    it("липсващи данни", () => {
        expect(summarizeFormula({ coefficients: [], formula_description: "x" }).ok).toBe(false);
        expect(summarizeFormula({ coefficients: REAL.bel3.coefficients, formula_description: "" }).ok).toBe(false);
        expect(summarizeFormula(null).ok).toBe(false);
    });
});

describe("граматика на събираемото", () => {
    it("приема нормалните записи и отказва останалото", () => {
        expect(termSyntaxOk("3×Изпит(Мат/Инф)/ДЗИ(Мат/Инф/ИТ)")).toBe(true);
        expect(termSyntaxOk("СО")).toBe(true);
        expect(termSyntaxOk("6×ДЗИ(Рус/БЕЛ) или 6×Изпит(Рус)")).toBe(true);
        expect(termSyntaxOk("Конкурсен изпит: събеседване")).toBe(false);
        expect(termSyntaxOk("(Общ успех х 2)")).toBe(false);
    });
});

describe("обобщението не пипа изчисляването", () => {
    it("съответства на calculateScore: максималният бал е сумата на най-високия множител по 6", () => {
        for (const row of [REAL.puInformatika, REAL.suInformatika, REAL.trakiaMedicine, REAL.bel3, REAL.french6]) {
            const s = summarizeFormula(row);
            const grades = Object.fromEntries(row.coefficients.flatMap(sl => sl.alternatives.map(a => [a.key, 6])));
            const expected = s.terms.reduce((sum, t) => sum + Math.max(...t.coefs) * 6, 0);
            expect(calculateScore(row.coefficients, grades).score).toBeCloseTo(expected, 6);
        }
    });

    it("не променя входните данни", () => {
        const copy = JSON.parse(JSON.stringify(REAL.suInformatika));
        summarizeFormula(REAL.suInformatika);
        expect(REAL.suInformatika).toEqual(copy);
    });
});
