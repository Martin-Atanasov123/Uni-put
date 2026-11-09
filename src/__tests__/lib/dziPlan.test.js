import { describe, it, expect } from "vitest";
import { classifyKey, evaluateRow, rankSecondDzi, DZI_SUBJECTS } from "@/lib/dziPlan";

// Реални редове от таблица universities (2026/2027). Очакванията са сметнати на ръка.
const SU_MEDICINA = [
    { alternatives: [{ key: "exam_bio", coef: 3 }] },
    { alternatives: [{ key: "exam_him", coef: 3 }] },
    { alternatives: [{ key: "dzi_bel", coef: 1 }] },
];
const PU_INFORMATIKA = [
    { alternatives: [{ key: "exam_mat", coef: 3 }, { key: "exam_informatika", coef: 3 }, { key: "dzi_mat", coef: 3 }, { key: "dzi_informatika", coef: 3 }, { key: "dzi_it", coef: 3 }] },
    { alternatives: [{ key: "mat", coef: 2 }] },
    { alternatives: [{ key: "mat", coef: 1 }, { key: "dzi_informatika", coef: 1 }, { key: "dzi_it", coef: 1 }] },
];
const BSU_PRAVO = [
    { alternatives: [{ key: "exam_bel", coef: 3 }, { key: "dzi_bel", coef: 3 }] },
    { alternatives: [{ key: "bel", coef: 1 }] },
    { alternatives: [{ key: "ist", coef: 1 }] },
];
const MAT_ONLY = [{ alternatives: [{ key: "dzi_mat", coef: 2 }] }];

const pick = (...ids) => ({ subjects: new Set(ids) });

describe("classifyKey", () => {
    it("разпознава ДЗИ предметите и синонимите им", () => {
        expect(classifyKey("dzi_mat")).toEqual({ kind: "dzi", subject: "mat" });
        expect(classifyKey("dzi1_mat")).toEqual({ kind: "dzi", subject: "mat" });
        expect(classifyKey("dzi2_bio")).toEqual({ kind: "dzi", subject: "bio" });
        expect(classifyKey("dzi_profil_geografiya")).toEqual({ kind: "dzi", subject: "geo" });
        expect(classifyKey("dzi_bio_profil")).toEqual({ kind: "dzi", subject: "bio" });
        expect(classifyKey("dzi_angliyski_b2")).toEqual({ kind: "dzi", subject: "angliiski" });
        expect(classifyKey("dzi_profil_predp")).toEqual({ kind: "dzi", subject: "predpriemachestvo" });
        expect(classifyKey("dzi_ris")).toEqual({ kind: "dzi", subject: "izobrazitelno" });
    });
    it("БЕЛ е винаги наличен, чужд език е джокер, редките ДЗИ са 'other'", () => {
        expect(classifyKey("dzi_bel").subject).toBe("bel");
        expect(classifyKey("zrelosten_bel").subject).toBe("bel");
        expect(classifyKey("dzi_chu_ezik").subject).toBe("lang");
        expect(classifyKey("dzi_obshtoobrazovatelen_predmet").subject).toBe("any");
        expect(classifyKey("dzi_rumunski").subject).toBe("other");
        expect(classifyKey("dzi_iztochno_hrist").subject).toBe("other");
    });
    it("разделя ЗДИППК, изпити и оценки от дипломата", () => {
        expect(classifyKey("profesionalna_kvalifikaciq").kind).toBe("zdippk");
        expect(classifyKey("dzi_profesiq").kind).toBe("zdippk");
        expect(classifyKey("zdippk_muzika").kind).toBe("zdippk");
        expect(classifyKey("exam_mat").kind).toBe("exam");
        expect(classifyKey("obsht_tehnicheski_test").kind).toBe("exam");
        expect(classifyKey("subesedvane").kind).toBe("exam");
        expect(classifyKey("olympiad_winner_it").kind).toBe("exam");
        expect(classifyKey("diploma").kind).toBe("free");
        expect(classifyKey("mat").kind).toBe("free");
        expect(classifyKey("angliiski_ezik").kind).toBe("free");
    });
});

describe("evaluateRow", () => {
    it("медицина иска изпити независимо от ДЗИ избора", () => {
        for (const s of DZI_SUBJECTS) expect(evaluateRow(SU_MEDICINA, pick(s.id))).toBe("exam");
    });
    it("информатика в ПУ: математика или ИТ я отварят без изпит, биология — само с изпит", () => {
        expect(evaluateRow(PU_INFORMATIKA, pick("mat"))).toBe("open");
        expect(evaluateRow(PU_INFORMATIKA, pick("it"))).toBe("open");
        expect(evaluateRow(PU_INFORMATIKA, pick("bio"))).toBe("exam");
    });
    it("право с БЕЛ и дипломни оценки е отворено при всеки избор", () => {
        expect(evaluateRow(BSU_PRAVO, pick("fil"))).toBe("open");
        expect(evaluateRow(BSU_PRAVO, pick())).toBe("open");
    });
    it("слот само с ДЗИ без алтернатива затваря програмата", () => {
        expect(evaluateRow(MAT_ONLY, pick("bio"))).toBe("closed");
        expect(evaluateRow(MAT_ONLY, pick("mat"))).toBe("open");
    });
    it("ЗДИППК отваря слот само при включен превключвател", () => {
        const row = [{ alternatives: [{ key: "profesionalna_kvalifikaciq", coef: 1 }, { key: "dzi_mat", coef: 1 }] }];
        expect(evaluateRow(row, { subjects: new Set(["bio"]), zdippk: false })).toBe("closed");
        expect(evaluateRow(row, { subjects: new Set(["bio"]), zdippk: true })).toBe("open");
    });
    it("„чужд език“ се покрива от който и да е езиков ДЗИ", () => {
        const row = [{ alternatives: [{ key: "dzi_chu_ezik", coef: 1 }] }];
        expect(evaluateRow(row, pick("nemski"))).toBe("open");
        expect(evaluateRow(row, pick("mat"))).toBe("closed");
    });
    it("липсващи/счупени коефициенти не затварят програмата", () => {
        expect(evaluateRow(null, pick("mat"))).toBe("open");
        expect(evaluateRow([{ alternatives: [] }], pick("mat"))).toBe("open");
    });
});

describe("rankSecondDzi", () => {
    const rows = [
        { coefficients: PU_INFORMATIKA },
        { coefficients: SU_MEDICINA },
        { coefficients: MAT_ONLY },
    ];
    it("математиката е първа и печели 2 програми спрямо само БЕЛ", () => {
        const { baseline, candidates } = rankSecondDzi(rows);
        expect(baseline.counts).toEqual({ open: 0, exam: 2, closed: 1 });
        expect(candidates[0].id).toBe("mat");
        expect(candidates[0].counts).toEqual({ open: 2, exam: 1, closed: 0 });
        expect(candidates[0].gain).toBe(2);
        expect(candidates[0].statuses).toEqual(["open", "exam", "open"]);
    });
    it("връща всички официални предмети", () => {
        expect(rankSecondDzi(rows).candidates).toHaveLength(DZI_SUBJECTS.length);
    });
});
