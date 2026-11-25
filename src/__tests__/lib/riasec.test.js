import { describe, expect, it, vi } from "vitest";
import { calculateScores, calculateRiasecCode, calculateHybridCompatibility } from "../../lib/riasec-matcher";
import { getRiasecMatches } from "../../lib/api";
import { supabase } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }));

describe("RIASEC", () => {
    it("normalizes numeric and stored string answers identically and keeps absent dimensions at zero", () => {
        expect(calculateScores({ a: "5", b: 3 }, [{ id: "a", type: "I" }, { id: "b", type: "I" }]))
            .toEqual({ R: 0, I: 75, A: 0, S: 0, E: 0, C: 0 });
    });
    it("breaks ties consistently and handles a missing vector", () => {
        const scores = { A: 100, I: 100, R: 100, C: 0, E: 0, S: 0 };
        expect(calculateRiasecCode(scores)).toBe("RIA");
        expect(calculateHybridCompatibility(scores, { riasec_code: "RIA" })).toBe(100);
    });
    it("includes careers beyond the first thousand rows", async () => {
        supabase.from.mockImplementation(table => {
            const query = {
                select: () => query, order: () => query,
                range: async (start, end) => ({ data: table.startsWith("specialty") ? [] :
                    Array.from({ length: Math.max(0, Math.min(end + 1, 1002) - start) }, (_, i) =>
                        ({ id: start + i, career_name_bg: String(start + i), riasec_code: "RIA" })) }),
            };
            return query;
        });
        const { careers } = await getRiasecMatches({ R: 100, I: 90, A: 80, S: 0, E: 0, C: 0 });
        expect(careers).toHaveLength(1002);
        expect(careers.at(-1).id).toBe(1001);
    });
});
