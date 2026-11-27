import { describe, expect, it } from "vitest";
import { admissionSource, hasSpecialSelectionAdmissions } from "@/lib/admissionSources";

describe("specialized military admissions", () => {
    it("keeps multi-stage selection out of the generic 2–6 calculator", () => {
        const amvr = {
            university_name: "Академия на Министерството на вътрешните работи",
            specialty: "Гранична полиция",
        };
        const nvu = {
            university_name: 'Национален военен университет „Васил Левски” – Велико Търново',
            specialty: "Организация и управление на военни формирования на тактическо ниво",
        };

        expect(hasSpecialSelectionAdmissions(amvr)).toBe(true);
        expect(hasSpecialSelectionAdmissions(nvu)).toBe(true);
        expect(admissionSource(amvr).url).toContain("mvr.bg");
        expect(admissionSource(nvu).url).toContain("nvu.bg");
    });

    it("does not classify ordinary university formulas as military selection", () => {
        expect(hasSpecialSelectionAdmissions({ university_name: "Софийски университет", specialty: "Право" })).toBe(false);
    });

    it("prefers the verified database source over a generic fallback", () => {
        const source = admissionSource({
            university_name: "Висше училище по мениджмънт – Варна",
            source_url: "https://vum.bg/official-2026.pdf",
            source_publisher: "Висше училище по мениджмънт – Варна",
            verified_at: "2026-11-27T12:00:00Z",
        });

        expect(source.url).toBe("https://vum.bg/official-2026.pdf");
        expect(source.label).toContain("Официален източник");
        expect(source.verifiedAt).toBe("2026-11-27T12:00:00Z");
    });
});
