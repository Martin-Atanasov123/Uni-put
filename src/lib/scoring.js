// Модул: Изчисляване на конкурсен бал (чиста логика, без React и без мрежа)
// Описание: Формулата на всяка специалност е масив от „слотове“. Слотът има
//   алтернативи ({ key, coef }) — от тях се взема най-добрият резултат
//   (оценка × коефициент); балът е сумата от слотовете.
// Вход:  coefficients — [{ alternatives: [{ key, coef }] }], grades — { [key]: "5.50" }
// Изход: { score, missingSlots } — missingSlots са ключовете на слотовете без валидна оценка
// Бележки: Валидна оценка е число между 2 и 6. Слот без валидна оценка не добавя нищо
//   към бала и се връща в missingSlots (UI казва точно какво липсва).
import { FIELD_LABELS, SLOT_GROUPS } from "@/lib/coefficients_config";

export const MIN_GRADE = 2;
export const MAX_GRADE = 6;

export function isValidGradeValue(value) {
    const n = parseFloat(value);
    return !Number.isNaN(n) && n >= MIN_GRADE && n <= MAX_GRADE;
}

export function calculateScore(coefficients, grades) {
    if (!Array.isArray(coefficients) || !coefficients.length) return { score: 0, missingSlots: [] };
    let total = 0;
    const missingSlots = [];
    coefficients.forEach(slot => {
        const alts = slot.alternatives || [];
        let best = null;
        const keys = [];
        alts.forEach(alt => {
            if (!alt?.key) return;
            keys.push(alt.key);
            const val = parseFloat(grades?.[alt.key]);
            if (!Number.isNaN(val) && val >= MIN_GRADE && val <= MAX_GRADE) {
                const product = val * Number(alt.coef);
                if (best === null || product > best) best = product;
            }
        });
        if (best === null) missingSlots.push(keys);
        else total += best;
    });
    return { score: total, missingSlots };
}

const isDiplomaKey = key => /^Диплома:/.test(FIELD_LABELS[key] || "");

const groupOfKey = key => {
    for (const [master, members] of Object.entries(SLOT_GROUPS)) if (members.includes(key)) return master;
    return key;
};

/**
 * Дипломна оценка, която формулата събира като ОТДЕЛЕН член (напр. „3.25×ДЗИ(Мат) + Мат(д)“),
 * не бива да се слива с изпитните алтернативи — иначе няма поле, в което да се въведе.
 * @param {Array<{coefficients: Array}>} rows - програмите (редове от universities) за избраната специалност
 * @returns {Set<string>} ключовете, които получават собствено поле
 */
export function findSeparateDiplomaKeys(rows) {
    const out = new Set();
    (rows || []).forEach(row => {
        const slots = Array.isArray(row?.coefficients) ? row.coefficients : [];
        const keysOf = slot => (slot.alternatives || []).map(a => a?.key).filter(Boolean);
        const examGroups = new Set();
        slots.forEach(slot => {
            const keys = keysOf(slot);
            if (keys.length && !keys.every(isDiplomaKey)) keys.forEach(k => examGroups.add(groupOfKey(k)));
        });
        slots.forEach(slot => {
            const keys = keysOf(slot);
            if (keys.length && keys.every(isDiplomaKey)) {
                keys.forEach(k => { if (examGroups.has(groupOfKey(k))) out.add(k); });
            }
        });
    });
    return out;
}
