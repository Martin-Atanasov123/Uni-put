// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/common/Home";

describe("Home landing page", () => {
    it("renders the hero section", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByTestId("hero-section")).toBeTruthy();
    });

    it("renders the main headline", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Открий своя/i)).toBeTruthy();
    });

    it("renders RIASEC CTA button", () => {
        render(<MemoryRouter><Home /></MemoryRouter>);
        expect(screen.getByText(/Направи своя RIASEC профил/i)).toBeTruthy();
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
