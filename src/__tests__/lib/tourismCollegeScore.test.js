import { expect, it } from "vitest";
import { tourismCollegeProgram, tourismCollegeScore } from "@/lib/tourismCollegeScore";

it("sums the four official components", () => {
    expect(tourismCollegeScore("5,5", 5, 4, 6)).toBe(20.5);
    expect(tourismCollegeScore(6, 6, 6, 6)).toBe(24);
    expect(tourismCollegeScore(6, "", 6, 6)).toBeNull();
    expect(tourismCollegeScore(6, 7, 6, 6)).toBeNull();
});

it("recognizes only the two professional bachelor specialties", () => {
    expect(tourismCollegeProgram({ university_name: "Икономически университет – Варна", specialty: "Мениджмънт на хотели и ресторанти" })).toBeTruthy();
    expect(tourismCollegeProgram({ university_name: "Икономически университет – Варна", specialty: "Финанси" })).toBeNull();
});
