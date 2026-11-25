import programs from "../data/nbu_2026.json" with { type: "json" };
import { ADMISSION_YEAR } from "./siteStats.js";

export const NBU_RULES_URL = "https://www.nbu.bg/bg/kandidat-studenti/priem-sled-sredno-obrazovanie/klasirane-i-baloobrazuvane";

// Each entry names a field and its weight after conversion to a 0–100 scale.
const weights = {
    standard: { top: 7, dzi: 3 },
    exam: { top: 5, dzi: 1, exam: 4 },
    law: { top: 6, dzi: 1, bulgarian: 1, literature: 1, history: 1 },
    architecture: { top: 5, dzi: 1, exam: 3, mathematics: 1 },
};

export const nbuFields = {
    top: { label: "Общ резултат от ТОП", min: 0, max: 100 },
    dzi: { label: "Средна оценка от матурите", min: 2, max: 6 },
    exam: { label: "Оценка от специализирания изпит", min: 2, max: 6 },
    bulgarian: { label: "Раздел Български език", min: 0, max: 10 },
    literature: { label: "Раздел Литература", min: 0, max: 10 },
    history: { label: "Раздел История", min: 0, max: 10 },
    mathematics: { label: "Раздел Математика", min: 0, max: 10 },
};

export function nbuProgram(row) {
    if (row.university_name !== "Нов български университет" || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    const entry = programs[row.specialty];
    if (!entry?.rule) return { url: NBU_RULES_URL };
    const faculty = ["law", "architecture"].includes(entry.rule) ? 4 : 3;
    return {
        weights: weights[entry.rule],
        officialName: entry.officialName,
        url: `https://ecatalog.nbu.bg/default.asp?V_Year=2026&PageShow=programpresent&P_Menu=admission&Fac_ID=${faculty}&M_PHD=0&P_ID=${entry.id}&TabIndex=${faculty === 4 ? 2 : 1}&l=0`,
    };
}

export function nbuScore(weights, values) {
    let score = 0;
    let sectionTotal = 0;
    let sectionCount = 0;
    for (const [key, weight] of Object.entries(weights)) {
        const text = String(values[key] ?? "").trim().replace(",", ".");
        if (!text) return { message: "Попълни всички полета за тази програма." };
        const value = Number(text);
        const { min, max, label } = nbuFields[key];
        if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(value) || value < min || value > max) {
            return { message: `${label} трябва да е между ${min} и ${max}.` };
        }
        if (max === 10) { sectionTotal += value; sectionCount++; }
        score += weight * 100 * (value - min) / (max - min);
    }
    const top = Number(String(values.top).replace(",", "."));
    if (sectionTotal > top || top - sectionTotal > 100 - 10 * sectionCount) {
        return { message: "Провери общия резултат и точките по раздели от същото явяване на ТОП." };
    }
    return { score };
}
