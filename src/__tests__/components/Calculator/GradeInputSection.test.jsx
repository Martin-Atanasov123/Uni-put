// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import GradeInputSection from "@/components/Calculator/GradeInputSection";

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({ user: null })
}));

vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            updateUser: vi.fn().mockResolvedValue({ data: null, error: null })
        }
    }
}));

describe("GradeInputSection", () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        localStorage.clear();
    });

    const coefficients = {
        exam_bio: 0.5,
        dzi_bio: 0.5
    };

    it("рендерира карти за нужните SLOT-ове", () => {
        render(
            <GradeInputSection
                coefficients={coefficients}
                faculty="Биологически факултет"
                specialty="Екология"
                onGradesChange={mockOnChange}
            />
        );

        const inputs = screen.getAllByPlaceholderText("0.00");
        expect(inputs.length).toBeGreaterThan(0);
    });

    it("валидира и показва грешка извън 2.00–6.00", () => {
        render(
            <GradeInputSection
                coefficients={coefficients}
                faculty="Биологически факултет"
                specialty="Екология"
                onGradesChange={mockOnChange}
            />
        );

        const input = screen.getAllByPlaceholderText("0.00")[0];
        fireEvent.change(input, { target: { value: "7.00" } });
        fireEvent.blur(input);

        expect(
            screen.getByText(/Моля въведете валидна оценка/i)
        ).toBeTruthy();
    });

    it("форматира до две десетични при blur", () => {
        render(
            <GradeInputSection
                coefficients={coefficients}
                faculty="Биологически факултет"
                specialty="Екология"
                onGradesChange={mockOnChange}
            />
        );

        const input = screen.getAllByPlaceholderText("0.00")[0];
        fireEvent.change(input, { target: { value: "5" } });
        fireEvent.blur(input);

        expect(input.value).toBe("5.00");
    });

    it("позволява смяна на алтернатива със 'Смени'", () => {
        render(
            <GradeInputSection
                coefficients={coefficients}
                faculty="Биологически факултет"
                specialty="Екология"
                onGradesChange={mockOnChange}
            />
        );

        const changeBtn = screen.getByText(/Смени/i);
        fireEvent.click(changeBtn);
        const items = screen.getAllByRole("button");
        expect(items.length).toBeGreaterThan(1);
    });
});
