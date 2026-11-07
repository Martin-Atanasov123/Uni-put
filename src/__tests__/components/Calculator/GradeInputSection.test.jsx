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

    it("дипломната оценка, която е отделен член във формулата, получава собствено поле", () => {
        const withDiploma = { exam_mat: 3.25, dzi1_mat: 3.25, mat: 1 };
        const { rerender } = render(
            <GradeInputSection coefficients={withDiploma} faculty="Ф" specialty="С" onGradesChange={mockOnChange} />
        );
        // без отделяне: ДЗИ и диплома са алтернативи в едно поле
        expect(screen.getAllByPlaceholderText("0.00")).toHaveLength(1);

        rerender(
            <GradeInputSection coefficients={withDiploma} separateKeys={new Set(["mat"])} faculty="Ф" specialty="С" onGradesChange={mockOnChange} />
        );
        expect(screen.getAllByPlaceholderText("0.00")).toHaveLength(2);
        expect(screen.getByText(/Диплома: Математика/i)).toBeTruthy();
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
            screen.getByText(/Оценка между 2\.00 и 6\.00/i)
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
