// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import About from "@/components/common/About";

const renderWithRouter = () => {
    return render(
        <MemoryRouter>
            <About />
        </MemoryRouter>
    );
};

describe("About page", () => {
    afterEach(cleanup);

    it("renders main heading and intro text", () => {
        renderWithRouter();
        const heading = screen.getByRole("heading", { name: /Хората зад УниПът/i, level: 1 });
        expect(heading).toBeTruthy();
        expect(
            screen.getByText(/УниПът е създаден, за да помогне/i)
        ).toBeTruthy();
    });

    it("renders sections for both creators with names", () => {
        renderWithRouter();
        expect(screen.getAllByText(/Мартин/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Ивън/i).length).toBeGreaterThan(0);
    });

    it("has contact links and GitHub links for each creator", () => {
        renderWithRouter();
        const emailLinks = screen.getAllByRole("link", { name: /Имейл/i });
        expect(emailLinks.length).toBeGreaterThanOrEqual(2);

        const githubLinks = screen.getAllByRole("link", { name: /GitHub/i });
        expect(githubLinks.length).toBeGreaterThanOrEqual(2);
    });

    it("uses main landmark for semantic structure", () => {
        const { container } = renderWithRouter();
        const main = container.querySelector("main");
        expect(main).not.toBeNull();
    });
});
