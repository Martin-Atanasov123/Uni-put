// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ErrorState from "@/components/common/ErrorState";
import Dormitories from "@/components/Dormitories/Dormitories";
import { getAllDormitories } from "@/lib/api";

vi.mock("@/lib/api", () => ({ getAllDormitories: vi.fn() }));

describe("ErrorState", () => {
    afterEach(cleanup);

    it("показва съобщение като alert и повиква onRetry", () => {
        const onRetry = vi.fn();
        render(<ErrorState message="Проблем" onRetry={onRetry} />);
        expect(screen.getByRole("alert").textContent).toContain("Проблем");
        fireEvent.click(screen.getByRole("button", { name: /Опитай пак/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

describe("Общежития при грешка в заредбата", () => {
    afterEach(cleanup);

    it("показва грешка с бутон за повторение, не празен списък", async () => {
        getAllDormitories.mockRejectedValueOnce(new Error("мрежа"));
        render(<MemoryRouter><Dormitories /></MemoryRouter>);
        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(screen.queryByText(/0 резултата/i)).toBeNull();

        // повторен опит успява
        getAllDormitories.mockResolvedValueOnce([
            { id: 1, university_id: "Тест университет", city: "София", block_number: "1" },
        ]);
        fireEvent.click(screen.getByRole("button", { name: /Опитай пак/i }));
        await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
        expect(getAllDormitories).toHaveBeenCalledTimes(2);
        expect(getAllDormitories).toHaveBeenCalledWith({ throwOnError: true });
    });
});
