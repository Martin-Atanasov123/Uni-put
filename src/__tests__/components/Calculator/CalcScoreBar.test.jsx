// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
afterEach(cleanup);
import CalcScoreBar from "@/components/Calculator/CalcScoreBar";
import { summarizeResults } from "@/lib/calcSummary";

// Лентата се показва само на телефон → емулираме (max-width: 767px).
beforeAll(() => {
    window.matchMedia = (q) => ({ matches: q.includes("max-width: 767px"), media: q, addEventListener() {}, removeEventListener() {} });
});

const row = (name, { missing = 0, score = "0.00", max = 36 } = {}) => ({
    item: { id: name, university_name: name },
    formatted: score,
    maxBall: max,
    hasStarted: true,
    hasMissing: missing > 0,
    missingSlots: Array.from({ length: missing }, (_, i) => [`k${i}`]),
});

describe("summarizeResults", () => {
    it("брои пълните резултати и най-малкия брой липсващи", () => {
        const s = summarizeResults([row("A", { missing: 2 }), row("B", { missing: 1 }), row("C", { score: "30.00" })]);
        expect(s).toMatchObject({ total: 3, complete: 1, fewestMissing: 1, single: null });
    });
});

describe("CalcScoreBar", () => {
    it("при липсващи оценки не показва число, а колко остават", () => {
        render(<CalcScoreBar results={[row("A", { missing: 2, score: "12.00" }), row("B", { missing: 3 })]} targetId="x" active />);
        expect(screen.getByText("Още 2 оценки до пълен бал")).toBeTruthy();
        expect(screen.getByText("За най-близкия от 2 университета")).toBeTruthy();
        expect(screen.queryByText(/12\.00/)).toBeNull();
    });

    it("при няколко университета показва броя с пълен бал, не бала на първия", () => {
        render(<CalcScoreBar results={[row("A", { score: "31.00" }), row("B", { score: "29.00" }), row("C", { missing: 1 })]} targetId="x" active />);
        expect(screen.getByText("Пълен бал: 2 от 3 университета")).toBeTruthy();
        expect(screen.queryByText(/31\.00/)).toBeNull();
        expect(screen.getByRole("button", { name: /Резултати/ })).toBeTruthy();
    });

    it("при един университет с пълен бал показва бала с контекст", () => {
        render(<CalcScoreBar results={[row("Пловдивски университет", { score: "34.00" })]} targetId="x" active />);
        expect(screen.getByText("34.00 от 36")).toBeTruthy();
        expect(screen.getByText("Пловдивски университет")).toBeTruthy();
    });

    it("не се показва преди първата оценка", () => {
        const { container } = render(<CalcScoreBar results={[row("A", { missing: 2 })]} targetId="x" active={false} />);
        expect(container.querySelector(".csb")).toBeNull();
    });
});
