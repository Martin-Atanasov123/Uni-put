// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CalculatorPage from "@/components/Calculator/Calculator";

// Mock Supabase
const mockCoefs = [
  { alternatives: [{ key: "dzi_bel", coef: 3 }] },
  { alternatives: [{ key: "diploma", coef: 1 }] }
];
const mockDataByFaculty = {
  "Факултет A": [
    { id: 1, university_name: "Университет 1", city: "София", specialty: "Спец A1", faculty: "Факултет A", max_ball: 10, formula_description: "ДЗИ(БЕЛ)×3 + Диплома×1", coefficients: mockCoefs },
    { id: 2, university_name: "Университет 1", city: "София", specialty: "Спец A2", faculty: "Факултет A", max_ball: 12, formula_description: "ДЗИ(БЕЛ)×3 + Диплома×1", coefficients: mockCoefs }
  ],
  "Факултет B": [
    { id: 3, university_name: "Университет 2", city: "Пловдив", specialty: "Спец B1", faculty: "Факултет B", max_ball: 13, formula_description: "ДЗИ(БЕЛ)×3 + Диплома×1", coefficients: mockCoefs },
    { id: 4, university_name: "Университет 2", city: "Пловдив", specialty: "Спец B2", faculty: "Факултет B", max_ball: 11, formula_description: "ДЗИ(БЕЛ)×3 + Диплома×1", coefficients: mockCoefs }
  ]
};

vi.mock("@/lib/supabase", () => {
  const select = vi.fn((columns) => {
    if (columns === "faculty") {
      // return list of faculties
      return Promise.resolve({
        data: [
          { faculty: "Факултет A" },
          { faculty: "Факултет B" }
        ],
        error: null
      });
    }
    // for select("*"), return chainable with eq
    return {
      eq: vi.fn((col, val) => {
        return Promise.resolve({
          data: mockDataByFaculty[val] || [],
          error: null
        });
      })
    };
  });
  const from = vi.fn(() => ({ select }));
  return {
    supabase: {
      from
    }
  };
});

describe("Calculator specialties filtering by faculty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows different specialties when different faculties are selected", async () => {
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>
    );

    // Click into faculty search to open full list
    const input = screen.getByPlaceholderText(/Търси факултет/i);
    fireEvent.click(input);

    // Choose Факултет A
    const optionA = await screen.findByRole("button", { name: "Факултет A" });
    fireEvent.click(optionA);

    // Specialties select should list A specialties
    const specialtiesSelect = await screen.findByRole("combobox", { name: /Избери специалност/i });
    const optionsA = within(specialtiesSelect).getAllByRole("option").map(o => o.textContent);
    expect(optionsA).toContain("Спец A1");
    expect(optionsA).toContain("Спец A2");
    expect(optionsA).not.toContain("Спец B1");

    // Re-open list and choose Факултет B
    fireEvent.click(input);
    const optionB = await screen.findByRole("button", { name: "Факултет B" });
    fireEvent.click(optionB);

    const specialtiesSelectB = await screen.findByRole("combobox", { name: /Избери специалност/i });
    const optionsB = within(specialtiesSelectB).getAllByRole("option").map(o => o.textContent);
    expect(optionsB).toContain("Спец B1");
    expect(optionsB).toContain("Спец B2");
    expect(optionsB).not.toContain("Спец A1");
  });
});
