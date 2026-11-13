// Модул: gymnasiaScore
// Описание: Чиста логика за бала след VII клас (Наредба №10): НВО точки × коефициент
//   + оценки от свидетелството, превърнати в точки. Работи върху gymnasium_classes.coefficients
//   (слотове като в universities) и подрежда желанията по сигурност спрямо минималния бал.
// Експорти: DIPLOMA_POINTS, DIPLOMA_SUBJECTS, ABILITY_EXAMS, MAX_BAL, computeBal, verdict,
//   wishStatus, wishesAdvice, labelForKey, normalizeName, historyForClass

export const MAX_BAL = 500; // 4 × 100 (НВО) + 2 × 50 (свидетелство)

/** Оценка от свидетелството → точки (чл. 57 от Наредба №10). */
export const DIPLOMA_POINTS = { 6: 50, 5: 39, 4: 26, 3: 15 };

export const DIPLOMA_SUBJECTS = [
    { key: "dipl_bel",  abbr: "БЕЛ",  label: "Български език и литература" },
    { key: "dipl_m",    abbr: "М",    label: "Математика" },
    { key: "dipl_chez", abbr: "ЧЕз",  label: "Чужд език" },
    { key: "dipl_kmit", abbr: "КМИТ", label: "Компютърно моделиране и ИТ" },
    { key: "dipl_it",   abbr: "ИТ",   label: "Информационни технологии" },
    { key: "dipl_gi",   abbr: "ГИ",   label: "География и икономика" },
    { key: "dipl_bzo",  abbr: "БЗО",  label: "Биология и здравно образование" },
    { key: "dipl_ii",   abbr: "ИИ",   label: "Изобразително изкуство" },
    { key: "dipl_fa",   abbr: "ФА",   label: "Физика и астрономия" },
    { key: "dipl_hoos", abbr: "ХООС", label: "Химия и опазване на околната среда" },
    { key: "dipl_ic",   abbr: "ИЦ",   label: "История и цивилизации" },
    { key: "dipl_tp",   abbr: "ТП",   label: "Технологии и предприемачество" },
    { key: "dipl_fvs",  abbr: "ФВС",  label: "Физическо възпитание и спорт" },
];

export const ABILITY_EXAMS = [
    { key: "ability_ii",      label: "Изобразително изкуство" },
    { key: "ability_muz",     label: "Музика" },
    { key: "ability_spo",     label: "Спорт" },
    { key: "ability_fvs",     label: "Физическо възпитание и спорт" },
    { key: "ability_muz_fvs", label: "Музика и ФВС" },
];

const LABELS = {
    nvo_bel: "НВО български език и литература",
    nvo_mat: "НВО математика",
    ...Object.fromEntries(DIPLOMA_SUBJECTS.map((s) => [s.key, `${s.label} (свидетелство)`])),
    ...Object.fromEntries(ABILITY_EXAMS.map((s) => [s.key, `Изпит за способности: ${s.label}`])),
};

export function labelForKey(key) {
    if (LABELS[key]) return LABELS[key];
    if (String(key).startsWith("olimp_")) return "Резултат от олимпиада/състезание";
    return key;
}

/**
 * Стойност в точки за ключ от входа. НВО/способности: 0–100. Свидетелство: оценка 3–6 → точки.
 * Олимпиади (olimp_*) не се въвеждат — вариантът с тях се пропуска.
 */
function pointsFor(key, inputs) {
    const v = inputs?.[key];
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (key.startsWith("dipl_")) return DIPLOMA_POINTS[Math.round(n)] ?? null;
    if (key.startsWith("nvo_") || key.startsWith("ability_")) return n < 0 ? 0 : n > 100 ? 100 : n;
    return null;
}

function evaluateSlots(slots, inputs) {
    let total = 0;
    const missing = [];
    for (const slot of slots || []) {
        const alt = slot?.alternatives?.[0];
        if (!alt?.key) continue;
        const p = pointsFor(alt.key, inputs);
        if (p === null) { missing.push(alt.key); continue; }
        total += Number(alt.coef || 1) * p;
    }
    return { total: Math.round(total * 100) / 100, missing };
}

/**
 * Бал за паралелка. При алтернативни формули („… или …“) взима най-високия пълен вариант.
 * @returns {{bal:number|null, missing:string[]}} missing = липсващи входове на основната формула
 */
export function computeBal(cls, inputs) {
    const variants = [cls.coefficients, ...(Array.isArray(cls.alt_formulas) ? cls.alt_formulas : [])];
    const results = variants.map((v) => evaluateSlots(v, inputs));
    const complete = results.filter((r) => r.missing.length === 0);
    if (complete.length) return { bal: Math.max(...complete.map((r) => r.total)), missing: [] };
    return { bal: null, missing: results[0].missing };
}

/** Разлика спрямо минимален бал. */
export function verdict(bal, min) {
    if (bal === null || bal === undefined || min === null || min === undefined || Number(min) <= 0) return null;
    const diff = Math.round((bal - Number(min)) * 100) / 100;
    return { diff, above: diff >= 0 };
}

// Средната годишна промяна на минималните балове в София е ~8 т. (РУО, 2026).
export const SAFE_MARGIN = 15;
export const RISK_MARGIN = -5;

/** 'safe' | 'possible' | 'risky' | 'unknown' спрямо минималния бал от последния 1-ви етап. */
export function wishStatus(bal, min) {
    const v = verdict(bal, min);
    if (!v) return "unknown";
    if (v.diff >= SAFE_MARGIN) return "safe";
    if (v.diff >= RISK_MARGIN) return "possible";
    return "risky";
}

/** Съвет за списъка с желания. Не пренарежда — РУО: класирането е по реда на желанията. */
export function wishesAdvice(statuses) {
    if (!statuses.length) return null;
    const n = (s) => statuses.filter((x) => x === s).length;
    if (n("safe") === 0 && n("unknown") < statuses.length) {
        return "Всичките ти желания са на ръба или над бала ти. Добави и паралелки, в които влизаш със запас — иначе рискуваш да не бъдеш класиран на първи етап.";
    }
    if (statuses[0] === "safe" && statuses.some((s) => s === "possible" || s === "risky")) {
        return "Първото ти желание е сигурно, а по-рискови идват след него. Класирането започва от желание №1 — ако там влизаш, по-надолу няма да те гледат. Сложи мечтаните паралелки по-напред, сигурните — след тях.";
    }
    if (statuses.length < 3) return "Добави още желания — няма ограничение в броя им, а всяко добавено увеличава шанса да бъдеш класиран.";
    return null;
}

export function normalizeName(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/[„“"]/g, "").trim();
}

/**
 * Минимален бал от 1-ви етап по години за дадена паралелка: първо по код, иначе по училище + име.
 * @param {object} cls  ред от gymnasium_classes
 * @param {Array} stage1  редове от gymnasium_rankings (stage 1, няколко години)
 * @returns {Array<{year:number, min:number|null, matched:'code'|'name'|null}>} по низходяща година
 */
export function historyForClass(cls, stage1) {
    const years = [...new Set(stage1.map((r) => r.campaign_year))].sort((a, b) => b - a);
    const nm = normalizeName(cls.class_name);
    return years.map((year) => {
        const rows = stage1.filter((r) => r.campaign_year === year);
        let hit = rows.find((r) => r.class_code === cls.class_code);
        if (hit) return { year, min: hit.min_total > 0 ? Number(hit.min_total) : null, matched: "code" };
        hit = cls.school_code ? rows.find((r) => r.school_code === cls.school_code && normalizeName(r.class_name) === nm) : null;
        if (hit) return { year, min: hit.min_total > 0 ? Number(hit.min_total) : null, matched: "name" };
        return { year, min: null, matched: null };
    });
}
