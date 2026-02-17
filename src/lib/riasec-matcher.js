/**
 * Изчислява RIASEC резултатите на базата на отговорите на потребителя.
 * 
 * Логика на точкуване:
 * 
 * ИНТЕРЕСИ:
 * - Технологии (Technology) → +3 към I (Изследователски), +2 към C (Конвенционален)
 * - Изкуство (Art) → +3 към A (Артистичен), +2 към I (Изследователски)
 * - Наука (Science) → +3 към I (Изследователски), +2 към R (Реалистичен)
 * - Социални дейности (Social) → +3 към S (Социален), +2 към A (Артистичен)
 * - Бизнес (Business) → +3 към E (Предприемачески), +2 към C (Конвенционален)
 * - Природа (Nature) → +3 към R (Реалистичен), +2 към I (Изследователски)
 * 
 * УМЕНИЯ (СИЛНИ СТРАНИ):
 * - Логика (Logic) → +5 към I
 * - Креативност (Creativity) → +5 към A
 * - Комуникация (Communication) → +5 към S
 * - Математика (Math) → +5 към I, +2 към C
 * - Организация (Organization) → +5 към C
 * - Решаване на проблеми (Problem-solving) → +5 към I, +2 към R
 * 
 * ЦЕННОСТИ (НОВА КАТЕГОРИЯ):
 * - Алтруизъм/Помощ (Altruism) → +3 към S, +2 към A
 * - Творчество (Creativity_Val) → +5 към A
 * - Финансова сигурност (Money) → +5 към E
 * - Стабилност (Stability) → +3 към C, +2 към R
 * - Независимост (Independence) → +3 към I, +2 към R
 * - Иновации (Innovation) → +3 към E, +2 към I
 * 
 * @param {Object} answers - Отговорите на потребителя от анкетата
 * @returns {Object} - Изчислените резултати { R: number, I: number, ... }
 */
const EMPTY_SCORES = () => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });

// Базова помощна функция – използва се и от отделните канали, и от комбинирания профил.
export function calculateScores(answers) {
    const scores = EMPTY_SCORES();

    // Обработка на Интереси (answers.interests е масив от низове)
    if (answers.interests) {
        answers.interests.forEach(interest => {
            switch (interest) {
                case 'Technology':
                    scores.I += 3; scores.C += 2; break;
                case 'Art':
                    scores.A += 3; scores.I += 2; break;
                case 'Science':
                    scores.I += 3; scores.R += 2; break;
                case 'Social':
                    scores.S += 3; scores.A += 2; break;
                case 'Business':
                    scores.E += 3; scores.C += 2; break;
                case 'Nature':
                    scores.R += 3; scores.I += 2; break;
            }
        });
    }

    // Обработка на Силни страни (answers.strengths е масив от низове)
    if (answers.strengths) {
        answers.strengths.forEach(strength => {
            switch (strength) {
                case 'Logic':
                    scores.I += 5; break;
                case 'Creativity':
                    scores.A += 5; break;
                case 'Communication':
                    scores.S += 5; break;
                case 'Math':
                    scores.I += 5; scores.C += 2; break;
                case 'Organization':
                    scores.C += 5; break;
                case 'Problem-solving':
                    scores.I += 5; scores.R += 2; break;
            }
        });
    }

    // Обработка на Ценности (answers.values е масив от низове)
    if (answers.values) {
        answers.values.forEach(value => {
            switch (value) {
                case 'Altruism':
                    scores.S += 3; scores.A += 2; break;
                case 'Creativity_Val':
                    scores.A += 5; break;
                case 'Money':
                    scores.E += 5; break;
                case 'Stability':
                    scores.C += 3; scores.R += 2; break;
                case 'Independence':
                    scores.I += 3; scores.R += 2; break;
                case 'Innovation':
                    scores.E += 3; scores.I += 2; break;
            }
        });
    }

    return scores;
}

/**
 * Изчислява топ 3 буквения RIASEC код базиран на резултатите.
 * @param {Object} scores - Обектът с резултати { R: 5, I: 12, ... }
 * @returns {string} - 3-буквеният код (напр. "ICS")
 */
export function calculateRiasecCode(scores) {
    return Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Сортиране по резултат низходящо
        .slice(0, 3) // Вземане на топ 3
        .map(([letter]) => letter) // Извличане на буквата
        .join('');
}

// Преобразува RIASEC резултатите до нормализиран вектор (0..1) по всички букви.
export function riasecScoresToVector(scores) {
    const vec = { ...EMPTY_SCORES(), ...scores };
    const values = Object.values(vec);
    const max = Math.max(...values);
    if (!max || Number.isNaN(max)) return EMPTY_SCORES();
    const normalized = {};
    for (const key of Object.keys(vec)) {
        normalized[key] = vec[key] / max;
    }
    return normalized;
}

// Създава вектор от 3-буквен RIASEC код, като първата буква тежи най-много.
export function riasecCodeToVector(code) {
    const vec = EMPTY_SCORES();
    if (!code) return vec;
    const weights = [0.6, 0.3, 0.1];
    const letters = code.toUpperCase().split('').slice(0, 3);
    letters.forEach((letter, index) => {
        if (vec[letter] !== undefined && weights[index] !== undefined) {
            vec[letter] += weights[index];
        }
    });
    return riasecScoresToVector(vec);
}

// Косинусова близост между два RIASEC вектора – 0..1 (колкото по-близко до 1, толкова по-сходни).
export function cosineSimilarity(userVec, itemVec) {
    const letters = ['R', 'I', 'A', 'S', 'E', 'C'];
    let dot = 0;
    let normU = 0;
    let normI = 0;
    for (const l of letters) {
        const u = userVec[l] || 0;
        const i = itemVec[l] || 0;
        dot += u * i;
        normU += u * u;
        normI += i * i;
    }
    if (!normU || !normI) return 0;
    return dot / (Math.sqrt(normU) * Math.sqrt(normI));
}

// Изгражда обогатен RIASEC профил – комбиниран вектор, код и confidence.
export function buildRiasecProfile(answers) {
    const rawScores = calculateScores(answers);

    const totalSelections =
        (answers?.interests?.length || 0) +
        (answers?.strengths?.length || 0) +
        (answers?.values?.length || 0);

    let normalizedScores = riasecScoresToVector(rawScores);

    // Леко коригиране според предпочитана среда и стил на работа.
    if (answers?.environment || answers?.style) {
        const s = { ...normalizedScores };
        switch (answers.environment) {
            case 'На терен':
                s.R += 0.1; s.C -= 0.05; break;
            case 'Офис':
                s.C += 0.1; s.E += 0.05; break;
            case 'Дистанционно':
                s.I += 0.1; s.C += 0.05; break;
            default:
                break;
        }
        switch (answers.style) {
            case 'В екип':
                s.S += 0.1; s.E += 0.05; s.I -= 0.05; break;
            case 'Самостоятелно':
                s.I += 0.1; s.R += 0.05; break;
            default:
                break;
        }
        normalizedScores = riasecScoresToVector(s);
    }

    // Confidence: комбинация от яснота на профила и обем на отговорите.
    const values = Object.values(normalizedScores);
    const sorted = [...values].sort((a, b) => b - a);
    const top = sorted[0] || 0;
    const second = sorted[1] || 0;
    const gap = top - second;
    const clarity = Math.max(0, Math.min(gap / 0.3, 1)); // при gap≈0.3 считаме профила за достатъчно ясен
    const volume = Math.max(0, Math.min(totalSelections / 10, 1)); // 10+ избора → макс. принос
    const confidence = 0.6 * clarity + 0.4 * volume;

    const riasecCode = calculateRiasecCode(rawScores);

    return {
        rawScores,
        scores: normalizedScores,
        riasecCode,
        confidence
    };
}

/**
 * Изчислява процент на съвпадение между кода на потребителя и кода на професията/университета.
 * 
 * Логика на алгоритъма:
 * Алгоритъмът сравнява позицията на всяка буква в RIASEC кода.
 * - Съвпадение на първа буква (Доминантна черта): 50 точки
 *   Това е най-важният фактор, тъй като определя основната личностна характеристика.
 * - Съвпадение на втора буква: 30 точки
 *   Поддържаща характеристика, която нюансира профила.
 * - Съвпадение на трета буква: 20 точки
 *   Допълнителна характеристика за по-голяма прецизност.
 * 
 * Максимален възможен резултат: 100% (при пълно съвпадение, напр. ISC срещу ISC).
 * 
 * @param {string} userCode - 3-буквеният код на потребителя
 * @param {string} itemCode - RIASEC кодът на кариерата или университета
 * @returns {number} - Процент на съвпадение (0-100)
 */
export function calculateMatchScore(userCode, itemCode) {
    if (!userCode || !itemCode) return 0;
    
    // Нормализиране на кодовете
    const u = userCode.toUpperCase();
    const i = itemCode.toUpperCase();
    
    let score = 0;
    
    // Стриктно позиционно сравнение
    // Проверка за първа позиция
    if (u[0] === i[0]) score += 50;
    
    // Проверка за втора позиция
    if (u[1] === i[1]) score += 30;
    
    // Проверка за трета позиция
    if (u[2] === i[2]) score += 20;
    
    return score;
}

/**
 * Сортира елементите според процента на съвпадение.
 * @param {string} userCode - Кодът на потребителя
 * @param {Array} items - Масив от професии или университети
 * @returns {Array} - Сортиран масив с добавено свойство matchScore
 */
export function sortByMatch(userCode, items) {
    if (!items) return [];
    
    return items.map(item => {
        // Обработка на случаи, където елементът може да няма riasec_code
        const itemCode = item.riasec_code || "";
        const matchScore = calculateMatchScore(userCode, itemCode);
        return { ...item, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Низходящ ред
}
