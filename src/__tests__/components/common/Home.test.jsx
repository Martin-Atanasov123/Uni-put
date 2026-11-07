// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/common/Home";

describe("Home landing page", () => {
    afterEach(cleanup);

    it("renders the hero section", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByTestId("hero-section")).toBeTruthy();
    });

    it("renders the main headline", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getAllByText(/Открий своя/i).length).toBeGreaterThan(0);
    });

    it("renders RIASEC CTA button", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Направи кариерен тест/i)).toBeTruthy();
    });

    it("renders the how it works section", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Три стъпки до правилния избор/i)).toBeTruthy();
    });

    it("renders the features section", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Създаден за сериозни избори/i)).toBeTruthy();
    });
});
