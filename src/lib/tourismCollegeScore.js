import { ADMISSION_YEAR } from "./siteStats.js";

export const TOURISM_COLLEGE_ADMISSION_URL = "https://ct-varna.com/bg/p/uslovia-za-priem-pu9dr8";

const specialties = new Set([
    "Мениджмънт на хотели и ресторанти",
    "Мениджмънт на туризма и развлекателния бизнес",
]);

export function tourismCollegeProgram(row) {
    if (row.university_name !== "Икономически университет – Варна" || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return specialties.has(row.specialty) ? { url: TOURISM_COLLEGE_ADMISSION_URL } : null;
}

export function tourismCollegeScore(bulgarianInput, firstLanguageInput, secondLanguageInput, examInput) {
    const parse = value => {
        const text = String(value ?? "").trim().replace(",", ".");
        const number = Number(text);
        return /^\d+(?:\.\d+)?$/.test(text) && number >= 3 && number <= 6 ? number : null;
    };
    const grades = [bulgarianInput, firstLanguageInput, secondLanguageInput, examInput].map(parse);
    return grades.includes(null) ? null : grades.reduce((sum, value) => sum + value, 0);
}
