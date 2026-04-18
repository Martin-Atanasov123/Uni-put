// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/common/Home";

describe("Home ReviewsSlider", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders the reviews section title", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        expect(screen.getByText(/Доволни клиенти и ревюта/i)).toBeTruthy();
    });

    it("handles manual navigation clicks", async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const sliderContainers = screen.getAllByTestId('reviews-slider');
        const sliderContainer = sliderContainers[0];
        const initialStyle = sliderContainer.getAttribute('style');

        // Find next button (it has ChevronRight)
        const buttons = screen.getAllByRole('button');
        const nextBtn = buttons.find(btn => 
            btn.innerHTML.includes('lucide-chevron-right')
        );

        await act(async () => {
            fireEvent.click(nextBtn);
        });

        expect(sliderContainer.getAttribute('style')).not.toBe(initialStyle);
    });
});
