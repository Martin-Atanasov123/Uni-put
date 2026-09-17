// История на калкулатора: един запис на специалност (faculty+specialty) с
// поредица от точки { score, date, university } — за „+X т. спрямо предишното
// изчисление" в профила.

export const CALC_HISTORY_KEY = "calculator_history";
export const HISTORY_CAP = 10;
const POINTS_CAP = 8;
// Докато ученикът пише оценките, междинните балове не са отделни точки:
// в рамките на 30 минути новият бал замества последната точка.
const SAME_SESSION_MS = 30 * 60 * 1000;

export const historyKey = (h) => `${h.faculty}||${h.specialty}`;

// Общи етикети за „шанс за прием" (виж admissionChanceBand в Calculator.jsx) —
// историята пази само ключа (`high`/`good`/...), затова етикет+цвят живеят тук,
// на едно място, за да не се разминат Калкулаторът и сравнението в Любими.
export const CHANCE_BAND_META = {
    high:       { label: "Много добър шанс", tone: "green" },
    good:       { label: "Добър шанс", tone: "green" },
    realistic:  { label: "Реалистичен шанс", tone: "amber" },
    borderline: { label: "Граничен шанс", tone: "amber" },
    low:        { label: "Малък шанс", tone: "red" },
};
export const CHANCE_TONES = {
    green: { text: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
    amber: { text: "#FBBF24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)" },
    red:   { text: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
};

export const historyPoints = (h) => {
    if (Array.isArray(h?.points) && h.points.length) return h.points;
    return h?.score != null ? [{ score: h.score, date: h.date || 0, university: h.university }] : [];
};

/**
 * Точките след ново изчисление. Връща същия масив, ако нищо не е променено
 * (иначе калкулаторът влиза в безкраен render). Смяна на университета започва
 * поредицата отначало — балове за различни университети не се сравняват.
 */
export function nextHistoryPoints(existing, score, university, now = Date.now()) {
    const points = existing ? historyPoints(existing) : [];
    const last = points[points.length - 1];
    if (last && last.score === score && last.university === university) return points;
    const point = { score, date: now, university };
    if (!last || last.university !== university) return [point];
    if (now - last.date < SAME_SESSION_MS) return [...points.slice(0, -1), point];
    return [...points, point].slice(-POINTS_CAP);
}

export function readLocalHistory() {
    try {
        const arr = JSON.parse(localStorage.getItem(CALC_HISTORY_KEY) || "[]");
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

// Слива история от акаунта с локалната по специалност; при конфликт печели
// по-новият запис, най-новите HISTORY_CAP отгоре.
export function mergeCalculatorHistory(accountHistory, localHistory) {
    const byKey = new Map();
    for (const h of [...(accountHistory || []), ...(localHistory || [])]) {
        if (!h?.faculty || !h?.specialty) continue;
        const key = historyKey(h);
        const existing = byKey.get(key);
        if (!existing || (h.date || 0) > (existing.date || 0)) byKey.set(key, h);
    }
    return [...byKey.values()]
        .sort((a, b) => (b.date || 0) - (a.date || 0))
        .slice(0, HISTORY_CAP);
}
