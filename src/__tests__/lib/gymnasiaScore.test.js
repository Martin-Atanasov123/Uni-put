import { describe, it, expect } from "vitest";
import { computeBal, verdict, wishStatus, wishesAdvice, historyForClass, MAX_BAL } from "@/lib/gymnasiaScore";

// Реални формули от списъка на РУО – София-град 2026. Очакванията са сметнати на ръка.
const slots = (...pairs) => pairs.map(([key, coef]) => ({ alternatives: [{ key, coef }] }));
const SMG = { class_code: "3909", school_code: "2216306", class_name: "Математически (математика и информатика) - НЕ (РИЧЕ)",
    coefficients: slots(["nvo_bel", 1], ["nvo_mat", 3], ["dipl_bel", 1], ["dipl_m", 1]) };
const SU1 = { coefficients: slots(["nvo_bel", 3], ["nvo_mat", 1], ["dipl_bel", 1], ["dipl_chez", 1]) };
const ART = { coefficients: slots(["nvo_bel", 1], ["nvo_mat", 1], ["ability_ii", 2], ["dipl_ii", 1], ["dipl_kmit", 1]) };
const NPMG = {
    coefficients: slots(["nvo_bel", 1], ["nvo_mat", 2], ["olimp_npmg_f", 1], ["dipl_m", 1], ["dipl_fa", 1]),
    alt_formulas: [slots(["nvo_bel", 1], ["nvo_mat", 2], ["olimp_fiz_ok", 1], ["dipl_m", 1], ["dipl_fa", 1])],
};

describe("computeBal", () => {
    it("СМГ: 1×БЕЛ + 3×МАТ + БЕЛ(6) + М(6) = 100 + 300 + 50 + 50 = 500", () => {
        expect(computeBal(SMG, { nvo_bel: 100, nvo_mat: 100, dipl_bel: 6, dipl_m: 6 })).toEqual({ bal: MAX_BAL, missing: [] });
    });
    it("1. СУ: 3×85 + 1×60 + БЕЛ(5)=39 + ЧЕз(4)=26 → 380", () => {
        expect(computeBal(SU1, { nvo_bel: 85, nvo_mat: 60, dipl_bel: 5, dipl_chez: 4 }).bal).toBe(380);
    });
    it("дробни точки от НВО се пазят", () => {
        expect(computeBal(SU1, { nvo_bel: 85.5, nvo_mat: 60.25, dipl_bel: 5, dipl_chez: 4 }).bal).toBe(381.75);
    });
    it("липсващ вход → bal null и изброени липси", () => {
        expect(computeBal(SU1, { nvo_bel: 85, nvo_mat: 60, dipl_bel: 5 })).toEqual({ bal: null, missing: ["dipl_chez"] });
    });
    it("изпит за способности участва с коефициент", () => {
        // 1×80 + 1×70 + 2×90 + ИИ(6)=50 + КМИТ(5)=39 = 419
        expect(computeBal(ART, { nvo_bel: 80, nvo_mat: 70, ability_ii: 90, dipl_ii: 6, dipl_kmit: 5 }).bal).toBe(419);
    });
    it("НПМГ: без олимпиаден резултат нито един вариант не е пълен", () => {
        const r = computeBal(NPMG, { nvo_bel: 90, nvo_mat: 95, dipl_m: 6, dipl_fa: 6 });
        expect(r.bal).toBeNull(); expect(r.missing).toEqual(["olimp_npmg_f"]);
    });
    it("оценка 2 от свидетелството не носи точки → липса", () => {
        expect(computeBal(SU1, { nvo_bel: 85, nvo_mat: 60, dipl_bel: 2, dipl_chez: 4 }).bal).toBeNull();
    });
    it("НВО над 100 се ограничава до 100", () => {
        expect(computeBal(SMG, { nvo_bel: 120, nvo_mat: 100, dipl_bel: 6, dipl_m: 6 }).bal).toBe(500);
    });
});

describe("verdict / wishStatus", () => {
    it("над и под минимума", () => {
        expect(verdict(420, 412.5)).toEqual({ diff: 7.5, above: true });
        expect(verdict(400, 412.5)).toEqual({ diff: -12.5, above: false });
        expect(verdict(null, 400)).toBeNull();
        expect(verdict(400, 0)).toBeNull(); // 0 = няма класирани
    });
    it("сигурно / възможно / рисково / неизвестно", () => {
        expect(wishStatus(430, 412)).toBe("safe");
        expect(wishStatus(415, 412)).toBe("possible");
        expect(wishStatus(409, 412)).toBe("possible");
        expect(wishStatus(400, 412)).toBe("risky");
        expect(wishStatus(400, null)).toBe("unknown");
    });
});

describe("wishesAdvice", () => {
    it("без сигурно желание → предупреждение", () => {
        expect(wishesAdvice(["risky", "possible"])).toMatch(/запас/);
    });
    it("сигурно първо, рисково после → обяснява реда на класиране", () => {
        expect(wishesAdvice(["safe", "risky"])).toMatch(/желание №1/);
    });
    it("добър списък → без съвет; къс списък → добави още", () => {
        expect(wishesAdvice(["risky", "possible", "safe"])).toBeNull();
        expect(wishesAdvice(["possible", "safe"])).toMatch(/още желания/);
        expect(wishesAdvice([])).toBeNull();
    });
});

describe("historyForClass", () => {
    const stage1 = [
        { campaign_year: 2026, class_code: "3909", school_code: "2216306", class_name: "x", min_total: 485.75 },
        { campaign_year: 2025, class_code: "3909", school_code: "2216306", class_name: "x", min_total: 480 },
        { campaign_year: 2024, class_code: "7777", school_code: "2216306", class_name: "Математически (математика и информатика) - НЕ (РИЧЕ)", min_total: 470 },
        { campaign_year: 2023, class_code: "1111", school_code: "9999", class_name: "друго", min_total: 300 },
    ];
    it("по код, после по училище+име, накрая няма", () => {
        expect(historyForClass(SMG, stage1)).toEqual([
            { year: 2026, min: 485.75, matched: "code" },
            { year: 2025, min: 480, matched: "code" },
            { year: 2024, min: 470, matched: "name" },
            { year: 2023, min: null, matched: null },
        ]);
    });
});
