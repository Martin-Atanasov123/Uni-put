// Модул: dziPlan
// Описание: Чиста логика за „обратния калкулатор“ на ДЗИ — при избран втори
//   държавен зрелостен изпит кои програми (специалност × университет) остават
//   отворени без кандидатстудентски изпит, кои само с изпит и кои се затварят.
//   Работи върху `universities.coefficients` (слотове с алтернативи).
// Експорти: DZI_SUBJECTS, classifyKey, evaluateRow, rankSecondDzi

// Официалният избор за втори ДЗИ (профилиращ предмет). БЕЛ е задължителен и
// се смята за винаги наличен. ЗДИППК е отделен превключвател (професионални гимназии).
export const DZI_SUBJECTS = [
    { id: "mat",              label: "Математика" },
    { id: "fiz",              label: "Физика и астрономия" },
    { id: "him",              label: "Химия и опазване на околната среда" },
    { id: "bio",              label: "Биология и здравно образование" },
    { id: "ist",              label: "История и цивилизации" },
    { id: "geo",              label: "География и икономика" },
    { id: "fil",              label: "Философия" },
    { id: "angliiski",        label: "Английски език", lang: true },
    { id: "nemski",           label: "Немски език", lang: true },
    { id: "frenski",          label: "Френски език", lang: true },
    { id: "ispanski",         label: "Испански език", lang: true },
    { id: "italianski",       label: "Италиански език", lang: true },
    { id: "ruski",            label: "Руски език", lang: true },
    { id: "informatika",      label: "Информатика" },
    { id: "it",               label: "Информационни технологии" },
    { id: "predpriemachestvo", label: "Предприемачество" },
    { id: "muz",              label: "Музика" },
    { id: "izobrazitelno",    label: "Изобразително изкуство" },
];

const LANG_IDS = new Set(DZI_SUBJECTS.filter((s) => s.lang).map((s) => s.id));
const SUBJECT_IDS = new Set(DZI_SUBJECTS.map((s) => s.id));

// Синоними в ключовете на базата → id на предмет
const DZI_ALIASES = {
    geografiya: "geo", filosofiya: "fil", predp: "predpriemachestvo", inf: "informatika",
    angliyski: "angliiski", ris: "izobrazitelno", izkustvo: "izobrazitelno",
};

const EXAM_LIKE = /^(exam_|olympiad_|konkursen_|izpit_)|(test|subesedvane|ese_|portfolio)/;

/**
 * Класифицира ключ от coefficients.
 * @returns {{kind:'dzi', subject:string}|{kind:'zdippk'}|{kind:'exam'}|{kind:'free'}}
 *   subject: id от DZI_SUBJECTS | 'bel' (винаги) | 'any' (кой да е ДЗИ) |
 *   'lang' (кой да е чужд език) | 'other' (рядък ДЗИ извън стандартния избор)
 */
export function classifyKey(key) {
    const k = String(key || "").toLowerCase();
    if (/^(dzi[12]?_|zrelosten_)bel$/.test(k)) return { kind: "dzi", subject: "bel" };
    if (k === "dzi_obshtoobrazovatelen_predmet") return { kind: "dzi", subject: "any" };
    if (/^(dzi[12]?_chu_ezik(_b2)?|dzi_profil_chu)$/.test(k)) return { kind: "dzi", subject: "lang" };
    if (/^(dzi_profesiq|profesionalna_kvalifikaciq|zdippk_)/.test(k)) return { kind: "zdippk" };

    const m = k.match(/^dzi(?:[12])?_(?:profil_)?([a-z]+?)(?:_profil|_b2)?$/);
    if (m) {
        const raw = m[1];
        const id = DZI_ALIASES[raw] || raw;
        return { kind: "dzi", subject: SUBJECT_IDS.has(id) ? id : "other" };
    }
    if (k.startsWith("dzi")) return { kind: "dzi", subject: "other" };
    if (EXAM_LIKE.test(k)) return { kind: "exam" };
    // Оценка от дипломата, среден успех, бонификации — всеки ги има.
    return { kind: "free" };
}

function dziSatisfied(subject, chosen) {
    if (subject === "bel" || subject === "any") return true;
    if (subject === "other") return false;
    if (subject === "lang") return [...chosen.subjects].some((s) => LANG_IDS.has(s));
    return chosen.subjects.has(subject);
}

/**
 * Статус на една програма при даден избор.
 * @param {Array} coefficients  слотове [{alternatives:[{key,coef}]}]
 * @param {{subjects:Set<string>, zdippk?:boolean}} chosen  избрани втори ДЗИ (без БЕЛ)
 * @returns {'open'|'exam'|'closed'}  open = без кандидатстудентски изпит
 */
export function evaluateRow(coefficients, chosen) {
    if (!Array.isArray(coefficients) || coefficients.length === 0) return "open";
    let needsExam = false;
    for (const slot of coefficients) {
        const alts = Array.isArray(slot?.alternatives) ? slot.alternatives : [];
        if (alts.length === 0) continue;
        let ok = false;
        let hasExam = false;
        for (const alt of alts) {
            const c = classifyKey(alt?.key);
            if (c.kind === "free") { ok = true; break; }
            if (c.kind === "dzi" && dziSatisfied(c.subject, chosen)) { ok = true; break; }
            if (c.kind === "zdippk" && chosen.zdippk) { ok = true; break; }
            if (c.kind === "exam") hasExam = true;
        }
        if (ok) continue;
        if (hasExam) needsExam = true;
        else return "closed";
    }
    return needsExam ? "exam" : "open";
}

function countStatuses(rows, chosen) {
    const counts = { open: 0, exam: 0, closed: 0 };
    const statuses = rows.map((r) => {
        const s = evaluateRow(r.coefficients, chosen);
        counts[s]++;
        return s;
    });
    return { counts, statuses };
}

/**
 * Ранкира кандидатите за втори ДЗИ спрямо списък програми.
 * @param {Array<{coefficients:Array}>} rows
 * @param {{zdippk?:boolean}} [opts]
 * @returns {{baseline:{counts,statuses}, candidates:Array<{id,label,counts,statuses,gain}>}}
 *   gain = програми без изпит в повече спрямо само БЕЛ
 */
export function rankSecondDzi(rows, opts = {}) {
    const zdippk = !!opts.zdippk;
    const baseline = countStatuses(rows, { subjects: new Set(), zdippk });
    const candidates = DZI_SUBJECTS.map((s) => {
        const r = countStatuses(rows, { subjects: new Set([s.id]), zdippk });
        return { id: s.id, label: s.label, ...r, gain: r.counts.open - baseline.counts.open };
    });
    candidates.sort((a, b) =>
        b.counts.open - a.counts.open ||
        b.counts.exam - a.counts.exam ||
        a.label.localeCompare(b.label, "bg")
    );
    return { baseline, candidates };
}
