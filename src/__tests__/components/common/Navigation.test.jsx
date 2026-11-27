// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/useTheme", () => ({
    useTheme: () => ({ theme: "dark", toggle: vi.fn() }),
}));

afterEach(cleanup);

const renderInRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("site navigation", () => {
    it("keeps seventh-grade admission among the primary destinations", () => {
        renderInRouter(<Header />);

        const link = screen.getByRole("link", { name: "Прием след 7. клас", hidden: true });
        expect(link.getAttribute("href")).toBe("/priem-7-klas/");
    });

    it("exposes every secondary feature in the desktop dropdown", () => {
        renderInRouter(<Header />);
        fireEvent.click(screen.getByRole("button", { name: /Още функции/i, hidden: true }));

        const expectedLinks = new Map([
            ["ДЗИ стратег", "/dzi-strateg/"],
            ["Специалности", "/specialnosti/"],
            ["Календар", "/calendar/"],
            ["Общежития", "/dormitories/"],
            ["Любими", "/favorites/"],
            ["Моите оценки", "/my-grades/"],
            ["За нас", "/about/"],
        ]);

        for (const [name, href] of expectedLinks) {
            expect(screen.getByRole("menuitem", { name: new RegExp(`^${name}`), hidden: true }).getAttribute("href")).toBe(href);
        }
    });

    it("lists the complete product navigation in the footer", () => {
        renderInRouter(<Footer />);

        const expectedLinks = new Map([
            ["Прием след 7. клас", "/priem-7-klas/"],
            ["Университети", "/universities/"],
            ["Специалности", "/specialnosti/"],
            ["Калкулатор за бал", "/calculator/"],
            ["Кариерен тест", "/career-advisor/"],
            ["ДЗИ стратег", "/dzi-strateg/"],
            ["Календар", "/calendar/"],
            ["Общежития", "/dormitories/"],
            ["Любими", "/favorites/"],
            ["Моите оценки", "/my-grades/"],
            ["За нас", "/about/"],
        ]);

        for (const [name, href] of expectedLinks) {
            expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(href);
        }
    });
});
