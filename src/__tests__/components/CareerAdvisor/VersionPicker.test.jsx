// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import VersionPicker from "@/components/CareerAdvisor/VersionPicker";

afterEach(cleanup);

const VERSIONS = [
    { id: "short", name: "Кратка", questions: 30, time: "3–5 мин", desc: "Бърз ориентир по основните интереси" },
    { id: "standard", name: "Стандартна", questions: 60, time: "8–12 мин", desc: "По-стабилен профил — подходящ за повечето ученици", recommended: true },
    { id: "extended", name: "Разширена", questions: 90, time: "15–20 мин", desc: "Най-подробният профил, ако имаш повече време" },
];

describe("VersionPicker", () => {
    it("групата има име от legend", () => {
        render(<VersionPicker versions={VERSIONS} picked="standard" onPick={() => {}} />);
        expect(screen.getByRole("group", { name: "Избери колко време имаш" })).toBeTruthy();
    });

    it("името на всяка опция е само името на версията", () => {
        render(<VersionPicker versions={VERSIONS} picked="standard" onPick={() => {}} />);
        for (const n of ["Кратка", "Стандартна", "Разширена"]) {
            expect(screen.getByRole("radio", { name: n })).toBeTruthy();
        }
    });

    it("препоръката, броят въпроси, времето и описанието са в описанието", () => {
        render(<VersionPicker versions={VERSIONS} picked="standard" onPick={() => {}} />);
        const std = screen.getByRole("radio", { name: "Стандартна" });
        const ids = std.getAttribute("aria-describedby").split(" ");
        const text = ids.map(id => document.getElementById(id).textContent).join(" ");
        expect(ids[0]).toBe("ca-v-standard-rec");
        expect(text).toContain("Препоръчваме");
        expect(text).toContain("60 въпроса, 8–12 мин");
        expect(text).toContain("подходящ за повечето ученици");
        // непрепоръчаните нямат „Препоръчваме“
        const short = screen.getByRole("radio", { name: "Кратка" });
        expect(short.getAttribute("aria-describedby")).not.toContain("rec");
    });

    it("отбелязва избраната и съобщава за смяна", () => {
        const onPick = vi.fn();
        render(<VersionPicker versions={VERSIONS} picked="standard" onPick={onPick} />);
        expect(screen.getByRole("radio", { name: "Стандартна" }).checked).toBe(true);
        fireEvent.click(screen.getByRole("radio", { name: "Разширена" }));
        expect(onPick).toHaveBeenCalledWith("extended");
    });
});
