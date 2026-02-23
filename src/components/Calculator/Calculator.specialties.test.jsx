// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CalculatorPage from "./Calculator";

// Mock Supabase
const mockDataByFaculty = {
  "Факултет A": [
    { id: 1, university_name: "Университет 1", city: "София", specialty: "Спец A1", faculty: "Факултет A", min_ball_2024: 10, coefficients: { dzi_bel: 3, geo: 1 } },
    { id: 2, university_name: "Университет 1", city: "София", specialty: "Спец A2", faculty: "Факултет A", min_ball_2024: 12, coefficients: { dzi_bel: 3, geo: 1 } }
  ],
  "Факултет B": [
    { id: 3, university_name: "Университет 2", city: "Пловдив", specialty: "Спец B1", faculty: "Факултет B", min_ball_2024: 13, coefficients: { dzi_bel: 3, geo: 1 } },
    { id: 4, university_name: "Университет 2", city: "Пловдив", specialty: "Спец B2", faculty: "Факултет B", min_ball_2024: 11, coefficients: { dzi_bel: 3, geo: 1 } }
  ]
};

vi.mock("../../lib/supabase", () => {
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
    render(<CalculatorPage />);

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
