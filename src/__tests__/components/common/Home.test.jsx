// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// Заявката за броя университети връща реални по форма редове: две за „Право“, един за „Медицина“.
vi.mock("@/lib/supabase", () => {
    const rows = [
        { specialty: "Право", university_name: "СУ" },
        { specialty: "Право", university_name: "ПУ" },
        { specialty: "Право", university_name: "ПУ" },
        { specialty: "Медицина", university_name: "МУ София" },
    ];
    const chain = { select: () => chain, eq: () => chain, in: () => Promise.resolve({ data: rows, error: null }) };
    return { supabase: { from: () => chain } };
});

import Home from "@/components/common/Home";
const POPULAR = ["Право", "Медицина", "Психология", "Софтуерно инженерство", "Маркетинг"];
import { SPECIALTIES, UNIVERSITIES } from "@/lib/siteStats";

function Where() {
    const l = useLocation();
    return <p data-testid="where">{l.pathname + l.search}</p>;
}
const renderHome = () =>
    render(
        <MemoryRouter>
            <Routes><Route path="*" element={<><Home /><Where /></>} /></Routes>
        </MemoryRouter>
    );

describe("Home (посока A — търсене първо)", () => {
    afterEach(cleanup);

    it("leads with the h1 and the search, with counts from siteStats", () => {
        renderHome();
        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Какво да уча и къде?");
        expect(screen.getByText(new RegExp(`${SPECIALTIES} специалности в ${UNIVERSITIES} университета`))).toBeTruthy();
        expect(screen.getByLabelText("Търси специалност или университет")).toBeTruthy();
    });

    it("sends the search query to the catalogue", () => {
        renderHome();
        fireEvent.change(screen.getByLabelText("Търси специалност или университет"), { target: { value: "право<script>" } });
        fireEvent.click(screen.getByRole("button", { name: "Търси" }));
        expect(screen.getByTestId("where").textContent).toBe("/universities/?q=" + encodeURIComponent("право script"));
    });

    it("offers the three routes", () => {
        renderHome();
        for (const t of ["Знам какво искам да уча", "Търся университет", "Не знам какво да избера"]) {
            expect(screen.getByText(t)).toBeTruthy();
        }
    });

    it("counts universities per popular specialty from the database, not from hard-coded numbers", async () => {
        renderHome();
        await waitFor(() => expect(screen.getByText("2 университета")).toBeTruthy());
        expect(screen.getByText("1 университет")).toBeTruthy();
        // Без данни от базата — без число.
        expect(screen.getByText("Психология").parentElement.querySelector("small")).toBeNull();
    });

    it("does not repeat popular specialties in the quick-search areas", () => {
        renderHome();
        const areas = [...screen.getByRole("navigation", { name: "Бързо търсене по област" }).querySelectorAll("a")].map((a) => a.textContent);
        expect(areas.some((a) => POPULAR.includes(a))).toBe(false);
    });

    it("computes the example score from the formula", () => {
        renderHome();
        // 3 × 5,50 + 2 × 5,75 + 1 × 6,00 = 34,00
        expect(screen.getByText("34,00")).toBeTruthy();
        expect(screen.getByText("22,74")).toBeTruthy();
        expect(screen.getByText(/не гарантират прием/)).toBeTruthy();
    });
});
