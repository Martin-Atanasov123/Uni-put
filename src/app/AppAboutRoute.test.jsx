// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import About from "../components/common/About";

describe("Routing to About page", () => {
    it("renders About page on /about route", () => {
        render(
            <MemoryRouter initialEntries={["/about"]}>
                <Routes>
                    <Route path="/about" element={<About />} />
                </Routes>
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", { name: /за нас/i, level: 1 })
        ).toBeTruthy();
    });
});
