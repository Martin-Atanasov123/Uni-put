import { ADMISSION_YEAR } from "./siteStats.js";

export const NMA_ADMISSION_URL = "https://nma.bg/wp-content/uploads/SPRAVOCHNIK_2026-2027-priem-I-kurs-durjdvna-poruchka-sled_sredno_obr-3.pdf";

const specialties = new Set([
    "Поп и джаз изкуство - вид инструмент",
    "Инструментално изкуство",
    "Фолклорни инструменти",
    "Фолклорно пеене",
]);

export function nmaProgram(row) {
    if (row.university_name !== 'Национална музикална академия „Проф. Панчо Владигеров"' || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return specialties.has(row.specialty) ? { url: NMA_ADMISSION_URL } : null;
}

export function nmaScore(examInput, theoryPassed) {
    const text = String(examInput ?? "").trim().replace(",", ".");
    const exam = Number(text);
    if (!/^\d+(?:\.\d+)?$/.test(text) || exam < 4 || exam > 6 || typeof theoryPassed !== "boolean") return null;
    const score = 3 * exam - (theoryPassed ? 0 : 1);
    return { score, eligible: score >= 12 };
}
