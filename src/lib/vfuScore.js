import { ADMISSION_YEAR } from "./siteStats.js";

const UNIVERSITY = 'Варненски свободен университет „Черноризец Храбър”';
const BASE = "https://ksp.vfu.bg/bakalavar/spetsialnosti";
const DEFAULT_BONUS = "Провери дали профилът на завършеното училище е сред посочените в официалните условия.";

const rule = (path, diplomaWeight = 1, bonus = DEFAULT_BONUS) => ({
    url: `${BASE}/${path}`,
    examWeight: 2,
    diplomaWeight,
    bonusPoints: 1,
    maxScore: 6 * (2 + diplomaWeight) + 1,
    bonus,
});

// Проверено по официалните страници на ВСУ за прием 2026/2027.
// Част от програмите използват общия успех веднъж (макс. 19), а творческите
// и инженерните програми — удвоен (макс. 25). Архитектура е отделна
// многокомпонентна формула и умишлено не е включена тук.
const programs = {
    "Администрация и управление": rule("200"),
    "Бизнес администрация и мениджмънт": rule("1"),
    "Защита на националната сигурност": rule("14?s=2026"),
    "Икономика": rule("ikonomika/"),
    "Информатика и компютърни науки": rule("informatika-i-kompyutarni-nauki/"),
    "Международен бизнес (на английски език)": rule("155"),
    "Международни икономически отношения": rule("mejdunarodni_ikonomicheski_otnosheniya/"),
    "Противодействие на престъпността и опазване на обществения ред": rule("13"),
    "Психология": rule("psihologiya/"),
    "Публична администрация и мениджмънт": rule("3"),
    "Финанси и счетоводство": rule("finansi-i-schetovodstvo/"),
    "Водоснабдяване и канализация": rule("vik/", 2),
    "Графичен дизайн": rule("grafichen-dizain/", 2),
    "Интериорен дизайн": rule("interioren-dizain/", 2),
    "Моден дизайн": rule("moden-dizain/", 2),
    "Пожарна и аварийна безопасност": rule("pab/", 2),
    "Строителен инженеринг": rule("stroitelen-inzhenering/", 2),
    "Строителство на сгради и съоръжения": rule("stroitelstvo_na_sgradi_i_saorajeniya/", 2),
    "Хореография - Български народни танци": rule("horeografiya/", 2),
    "Хореография - Съвременен танцов театър": rule("horeografiya/", 2),
};

export function vfuProgram(row) {
    if (row.university_name !== UNIVERSITY || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return programs[row.specialty] ?? null;
}

export function vfuScore(examInput, diplomaInput, hasBonus = false, program = {}) {
    const parse = value => {
        const text = String(value ?? "").trim().replace(",", ".");
        const number = Number(text);
        return /^\d+(?:\.\d+)?$/.test(text) && number >= 3 && number <= 6 ? number : null;
    };
    const exam = parse(examInput);
    const diploma = parse(diplomaInput);
    if (exam === null || diploma === null) return null;
    const examWeight = program.examWeight ?? 2;
    const diplomaWeight = program.diplomaWeight ?? 1;
    const bonusPoints = program.bonusPoints ?? 1;
    return examWeight * exam + diplomaWeight * diploma + (hasBonus ? bonusPoints : 0);
}
