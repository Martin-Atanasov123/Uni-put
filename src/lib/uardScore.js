import { ADMISSION_YEAR } from "./siteStats.js";

export const UARD_ADMISSION_URL = "https://uard.bg/bg/pages/view/104";

const UNIVERSITY = "Висше училище по агробизнес и развитие на регионите – Пловдив";
const verifiedSpecialties = new Set([
    "Аграрна икономика",
    "Бизнес и предприемачество",
    "Икономика на туризма",
    "Счетоводство",
    "Стопанско управление",
    "Управление на агробизнеса",
    "Управление на информационните системи",
    "Управление на човешките ресурси",
    "Финанси",
]);

export function uardProgram(row) {
    if (row.university_name !== UNIVERSITY || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return verifiedSpecialties.has(row.specialty) ? { url: UARD_ADMISSION_URL } : null;
}

export function uardScore(bulgarianInput, choiceInput, examInput) {
    const parse = value => {
        const text = String(value ?? "").trim().replace(",", ".");
        const number = Number(text);
        return /^\d+(?:\.\d+)?$/.test(text) && number >= 3 && number <= 6 ? number : null;
    };
    const grades = [bulgarianInput, choiceInput, examInput].map(parse);
    return grades.includes(null) ? null : grades.reduce((sum, value) => sum + value, 0) / 3;
}
