// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/common/Home";

describe("Home landing page (taste-skill)", () => {
    afterEach(cleanup);

    it("renders the hero section", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByTestId("hero-section")).toBeTruthy();
    });

    it("names the category in the h1", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText("Калкулатор за приемен бал", { selector: "h1" })).toBeTruthy();
    });

    it("offers the main action and the career test", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getAllByText(/Изчисли моя бал/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Направи кариерния тест/i)).toBeTruthy();
    });

    it("renders the calculator, tools and FAQ sections", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Балът по формулата на всяка специалност/i)).toBeTruthy();
        expect(screen.getByText(/Още четири инструмента/i)).toBeTruthy();
        expect(screen.getByText(/Въпроси за калкулатора/i)).toBeTruthy();
    });
});
