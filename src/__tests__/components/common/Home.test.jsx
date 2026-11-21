// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/common/Home";

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

describe("Home (design.md, раздел 12)", () => {
    afterEach(cleanup);

    it("renders the hero with the h1", () => {
        renderHome();
        expect(screen.getByTestId("hero-section")).toBeTruthy();
        expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Изборът на специалност/);
    });

    it("offers both entry points and the search", () => {
        renderHome();
        expect(screen.getAllByText(/Разгледай специалности/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Още не знам какво да избера/)).toBeTruthy();
        expect(screen.getByLabelText(/Търсене в каталога/)).toBeTruthy();
    });

    it("renders the sections in order", () => {
        renderHome();
        const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
        expect(h2).toEqual(["Избери откъде да започнеш", "Как работи", "Как се образува балът", "Откъде са данните", "Въпроси"]);
    });

    it("recomputes the example score from the real formula", () => {
        renderHome();
        // 3 × 5,50 + 2 × 5,75 + 6,00 = 34,00
        expect(screen.getByText("34,00")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("ДЗИ по математика"), { target: { value: "6" } });
        expect(screen.getByText("35,50")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("ДЗИ по математика"), { target: { value: "9" } });
        expect(screen.getByText(/Въведи оценка между 2,00 и 6,00/)).toBeTruthy();
    });
});
