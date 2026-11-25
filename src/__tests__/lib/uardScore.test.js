import { expect, it } from "vitest";
import { uardProgram, uardScore } from "@/lib/uardScore";

it("calculates the official six-point average", () => {
    expect(uardScore("6", "5,50", "4")).toBeCloseTo(5.1666666667);
    expect(uardScore(6, 6, 6)).toBe(6);
    expect(uardScore("", 5, 6)).toBeNull();
    expect(uardScore(2, 5, 6)).toBeNull();
    expect(uardScore("5x", 5, 6)).toBeNull();
});

it("only handles the nine verified programs in the supported year", () => {
    expect(uardProgram({ university_name: "Висше училище по агробизнес и развитие на регионите – Пловдив", specialty: "Финанси" })).toBeTruthy();
    expect(uardProgram({ university_name: "Висше училище по агробизнес и развитие на регионите – Пловдив", specialty: "Непроверена програма" })).toBeNull();
    expect(uardProgram({ university_name: "Висше училище по агробизнес и развитие на регионите – Пловдив", specialty: "Финанси", academic_year: "2027/2028" })).toBeNull();
});
