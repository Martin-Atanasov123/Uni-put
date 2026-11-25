import { ADMISSION_YEAR } from "./siteStats.js";

const UNIVERSITY = 'Варненски свободен университет „Черноризец Храбър"';

const programs = {
    "Международни икономически отношения": {
        url: "https://ksp.vfu.bg/bakalavar/spetsialnosti/mejdunarodni_ikonomicheski_otnosheniya/",
        bonus: "Завършилите езикова, хуманитарна, математическа, търговска или икономическа гимназия, или гимназия с езиков, информационен или бизнес профил, получават 1 точка.",
    },
    "Психология": {
        url: "https://ksp.vfu.bg/bakalavar/spetsialnosti/psihologiya/",
        bonus: "Завършилите езикова, хуманитарна, математическа, търговска или икономическа гимназия, или гимназия с езиков профил, получават 1 точка.",
    },
};

export function vfuProgram(row) {
    if (row.university_name !== UNIVERSITY || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return programs[row.specialty] ?? null;
}

export function vfuScore(examInput, diplomaInput, hasBonus = false) {
    const parse = value => {
        const text = String(value ?? "").trim().replace(",", ".");
        const number = Number(text);
        return /^\d+(?:\.\d+)?$/.test(text) && number >= 3 && number <= 6 ? number : null;
    };
    const exam = parse(examInput);
    const diploma = parse(diplomaInput);
    return exam === null || diploma === null ? null : 2 * exam + diploma + (hasBonus ? 1 : 0);
}
