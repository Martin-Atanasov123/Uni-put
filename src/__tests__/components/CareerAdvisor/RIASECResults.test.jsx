// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RIASECResults from "@/components/CareerAdvisor/RIASECResults";

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({ user: { id: "logged-user" } }),
}));

afterEach(cleanup);

const specialties = Array.from({ length: 7 }, (_, index) => ({
    id: index + 1,
    name: `Специалност ${index + 1}`,
    category: "Тестова категория",
    riasec_code: "IAS",
    compatibility: 90 - index,
    universities_count: 0,
    universities: [],
}));

describe("RIASECResults", () => {
    it("показва останалите специалности за логнат потребител", async () => {
        render(
            <MemoryRouter>
                <RIASECResults
                    results={{
                        scores: { R: 20, I: 90, A: 80, S: 70, E: 30, C: 40 },
                        riasecCode: "IAS",
                        specialties,
                        careers: [],
                    }}
                    onRestart={() => {}}
                />
            </MemoryRouter>
        );

        expect(screen.queryByText("Специалност 6")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Покажи останалите 2" }));

        expect(screen.getByText("Специалност 6")).toBeTruthy();
        expect(screen.getByText("Специалност 7")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Скрий останалите" })).toBeTruthy();
        await waitFor(() => {
            expect(screen.getByTestId("riasec-specialty-6").style.opacity).not.toBe("0");
        });
    });
});
