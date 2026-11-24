// Кратко, четимо представяне на формулата за бал — САМО за показване.
// Не участва в изчисляването (то е в lib/scoring.js и остава непроменено).
//
// Подход: allowlist от проверени структури. Обобщение се прави само когато
//  1) коефициентите са в една от поддържаните форми (виж STRUCTURES), и
//  2) оригиналният текст на формулата (formula_description) потвърждава същата
//     структура — същият брой събираеми и същите множители във всяко от тях.
// Всичко друго (отмествания като „75×(Диплома–2)“, проценти, тестове с точки,
// несъответствие между текста и коефициентите) → { ok: false } и се показва
// оригиналната формула.
import { FIELD_LABELS } from "@/lib/coefficients_config";

// Етикети само за показване на ключове, които нямат запис в FIELD_LABELS.
// Нарочно НЕ са във FIELD_LABELS: калкулаторът извежда групирането на полетата
// от тези етикети, а то не бива да се променя.
const EXTRA_LABELS = {
    dzi_izkustvo: "ДЗИ Изкуство",
    exam_ikt: "Изпит по ИКТ",
    exam_risuvane: "Изпит по рисуване",
    filosofiq: "Диплома: Философия",
    frenski_ezik: "Диплома: Френски език",
    grajdansko_obrazovanie: "Диплома: Гражданско образование",
    ispanski_ezik: "Диплома: Испански език",
    italianski_ezik: "Диплома: Италиански език",
    nemski_ezik: "Диплома: Немски език",
    ruski_ezik: "Диплома: Руски език",
};

export const labelFor = key => FIELD_LABELS[key] || EXTRA_LABELS[key] || null;

// Общи ключове, които в базата се ползват за различни изпити (тест по специалността,
// изпит по актьорско майсторство и т.н.) — етикетът им не казва кой е изпитът,
// затова при тях не правим кратко представяне.
const GENERIC_KEYS = new Set([
    "obsht_tehnicheski_test", "obsht_prirodonauchen_test", "obshtoobrazovatelen_test",
    "exam_test", "stop_test", "subesedvane", "konkursen_izpit_1", "konkursen_izpit_2",
    "izpit_drugo_vu", "portfolio",
    // ползват се и за „изпит по изкуство/специалността“, не само за рисуване
    "exam_ris_1", "exam_ris_2", "dzi_ris",
]);

// „Диплома: Математика“ → „Математика (диплома)“; останалите — както са.
const readable = label => {
    if (label === "Диплома") return "Среден успех от дипломата";
    const m = /^Диплома:\s*(.+)$/.exec(label);
    return m ? `${m[1]} (диплома)` : label;
};

const MAX_SLOTS = 5;          // повече събираеми — показваме оригинала
const MAX_ALTS_PER_GROUP = 6; // повече алтернативи — списъкът спира да е „кратък“
const MAX_COEF = 10;          // по-големи множители са в точкови системи (напр. 75×)

const num = v => (typeof v === "number" ? v : Number(v));
const fmt = n => String(Number(n.toFixed(4))).replace(".", ",");

// Разделя по „ + “ на най-горно ниво (не вътре в скоби).
function splitTopLevel(desc) {
    const out = []; let depth = 0; let cur = "";
    for (let i = 0; i < desc.length; i++) {
        const c = desc[i];
        if (c === "(") depth++;
        if (c === ")") depth = Math.max(0, depth - 1);
        if (c === "+" && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
        cur += c;
    }
    out.push(cur.trim());
    return out.filter(Boolean);
}

// Множителите в едно събираемо от текста („3×…“, „2.75×…“); без множител → 1.
function termCoefs(term) {
    const ms = [...term.matchAll(/(\d+(?:[.,]\d+)?)\s*[×x*]/g)].map(m => Number(m[1].replace(",", ".")));
    return ms.length ? [...new Set(ms)].sort((a, b) => a - b) : [1];
}

// Неща в текста, които коефициентите не могат да изразят.
const UNSUPPORTED_TEXT = [
    /[×x*]\s*\(/,               // множител пред скоба: 75×(Диплома–2)
    /\(\s*[^()]*[–-]\s*\d/,     // изваждане на число: (Диплома – 2)
    /%/,                        // проценти
    /\bточки\b|\bт\.\s*$/i,     // точкови системи
    /[÷]/,
    /[≥≤<>]/,                   // прагове: „ДЗИ ≥ 5.00“ — условие, не събираемо
    /минимум|мин\.\s|ielts|toefl|cambridge|сертификат/i,  // условия за допускане
    /[а-яё]{3,}\s+[а-яё]{3,}\s+[а-яё]{3,}\s+[а-яё]{3,}/i,      // описание в свободен текст
];

const key = arr => arr.map(n => Number(n.toFixed(4))).join("|");

// Граматика на едно събираемо (allowlist на текста):
//   събираемо := алтернатива ( („/“ | „ или “) алтернатива )*
//   алтернатива := [число „×“] име [„(“ уточнение „)“]
// Без „:“ и „;“ — те се срещат само в описания на изпити с етапи, условия и т.н.
const ALT_RE = /^(\d+(?:[.,]\d+)?\s*×\s*)?[A-Za-zА-Яа-яЁё¹²][A-Za-zА-Яа-яЁё¹²0-9 .-]*(\([^():;]*\))?$/;
function splitAlternatives(term) {
    const out = []; let depth = 0; let cur = "";
    for (let i = 0; i < term.length; i++) {
        const c = term[i];
        if (c === "(") depth++;
        if (c === ")") depth = Math.max(0, depth - 1);
        if (depth === 0 && c === "/") { out.push(cur.trim()); cur = ""; continue; }
        if (depth === 0 && term.startsWith(" или ", i)) { out.push(cur.trim()); cur = ""; i += 4; continue; }
        cur += c;
    }
    out.push(cur.trim());
    return out;
}
export const termSyntaxOk = term => !/[:;]/.test(term) && splitAlternatives(term).every(a => ALT_RE.test(a));

/**
 * @param {{ coefficients: Array, formula_description?: string }} row
 * @returns {{ ok: true, terms: Array<{coefs:number[], groups:Array<{coef:number, items:string[]}>}> } | { ok: false, reason: string }}
 */
export function summarizeFormula(row) {
    const slots = row?.coefficients;
    const desc = (row?.formula_description || "").trim();
    if (!Array.isArray(slots) || slots.length === 0) return { ok: false, reason: "no-coefficients" };
    if (!desc) return { ok: false, reason: "no-description" };
    if (slots.length > MAX_SLOTS) return { ok: false, reason: "too-many-slots" };
    if (UNSUPPORTED_TEXT.some(re => re.test(desc))) return { ok: false, reason: "unsupported-text" };

    const terms = [];
    for (const slot of slots) {
        const alts = Array.isArray(slot?.alternatives) ? slot.alternatives : [];
        if (!alts.length) return { ok: false, reason: "empty-slot" };
        const byCoef = new Map();
        for (const a of alts) {
            const c = num(a?.coef);
            const label = a?.key ? labelFor(a.key) : null;
            if (!label) return { ok: false, reason: `unknown-key:${a?.key}` };
            if (GENERIC_KEYS.has(a.key)) return { ok: false, reason: `generic-key:${a.key}` };
            if (!Number.isFinite(c) || c <= 0 || c > MAX_COEF) return { ok: false, reason: "coef-out-of-range" };
            if (!byCoef.has(c)) byCoef.set(c, []);
            const text = readable(label);
            if (!byCoef.get(c).includes(text)) byCoef.get(c).push(text);
        }
        // Поддържани структури: един множител за събираемото, или два („3.25× … или 2.75× …“).
        if (byCoef.size > 2) return { ok: false, reason: "too-many-coefs-in-slot" };
        const groups = [...byCoef.entries()].sort((a, b) => b[0] - a[0]).map(([coef, items]) => ({ coef, items }));
        if (groups.some(g => g.items.length > MAX_ALTS_PER_GROUP)) return { ok: false, reason: "too-many-alternatives" };
        terms.push({ coefs: groups.map(g => g.coef).sort((a, b) => a - b), groups });
    }

    // Кръстосана проверка с оригиналния текст: същият брой събираеми и същите множители.
    const descTerms = splitTopLevel(desc);
    if (!descTerms.every(termSyntaxOk)) return { ok: false, reason: "unsupported-syntax" };
    if (descTerms.length !== terms.length) return { ok: false, reason: "term-count-mismatch" };
    const fromText = descTerms.map(t => key(termCoefs(t))).sort();
    const fromCoefs = terms.map(t => key(t.coefs)).sort();
    if (fromText.join(" ; ") !== fromCoefs.join(" ; ")) return { ok: false, reason: "coef-mismatch" };

    return { ok: true, terms };
}

// Текстов вид на едно събираемо — за екранни четци и тестове.
export function termToText(term) {
    return term.groups
        .map(g => {
            const list = g.items.length === 1 ? g.items[0] : `най-високата оценка от ${g.items.join(", ")}`;
            return `${fmt(g.coef)} × ${list}`;
        })
        .join(" или ");
}

export { fmt as formatCoef };
