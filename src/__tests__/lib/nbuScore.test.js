import { expect, it } from "vitest";
import { nbuProgram, nbuScore } from "@/lib/nbuScore";

function rule(specialty) {
    return nbuProgram({ university_name: "Нов български университет", specialty }).weights;
}

it("matches hand-calculated ordinary, specialized, law and architecture examples", () => {
    expect(nbuScore(rule("Философия"), { top: "80", dzi: "5,50" }).score).toBe(822.5);
    expect(nbuScore(rule("Театър"), { top: 80, dzi: 5, exam: 5.5 }).score).toBe(825);
    expect(nbuScore(rule("Право"), { top: 80, dzi: 5, bulgarian: 7, history: 8, literature: 9 }).score).toBe(795);
    expect(nbuScore(rule("Архитектура"), { top: 80, dzi: 5, mathematics: 9, exam: 5 }).score).toBe(790);
});

it("requires complete scores from the same sitting and keeps a legitimate zero", () => {
    const standard = rule("Философия");
    expect(nbuScore(standard, { top: "", dzi: 5 }).score).toBeUndefined();
    expect(nbuScore(standard, { top: 101, dzi: 5 }).score).toBeUndefined();
    expect(nbuScore(standard, { top: 0, dzi: 2 }).score).toBe(0);
    expect(nbuScore(rule("Архитектура"), { top: 100, dzi: 6, exam: 6, mathematics: 1 }).score).toBeUndefined();
    expect(nbuScore(rule("Архитектура"), { top: 100, dzi: 6, exam: 6, mathematics: 10 }).score).toBe(1000);
});

it("applies only the verified program and year", () => {
    expect(nbuProgram({ university_name: "СУ", specialty: "Право" })).toBeNull();
    expect(nbuProgram({ university_name: "Нов български университет", specialty: "Право", academic_year: "2027/2028" })).toBeNull();
    expect(rule("Клинична биология и вирусология")).toBeUndefined();
    const renamed = nbuProgram({ university_name: "Нов български университет", specialty: "Политика и общество (на английски език)" });
    expect(renamed.officialName).toBe("Политиката и обществото (на английски език)");
    expect(renamed.weights.exam).toBe(4);
    expect(rule("Приложени чужди езици за администрация и управление (английски и втори чужд)").top).toBe(7);
    expect(rule("Управление на бизнес и предприемачество").top).toBe(7);
    expect(rule("Кино и телевизия").top).toBe(7);
    expect(rule("Счетоводство и контролинг").top).toBe(7);
    const jointProgram = nbuProgram({
        university_name: "Нов български университет",
        specialty: "Английски език и професионална комуникация (Съвместна програма с университета Йорк)",
    });
    expect(jointProgram.externalAdmission).toBe(true);
    expect(jointProgram.weights).toBeUndefined();
});
