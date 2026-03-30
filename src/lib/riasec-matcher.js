/**
 * @typedef {Object} RiasecScores
 * @property {number} R - Realistic score (0-100)
 * @property {number} I - Investigative score (0-100)
 * @property {number} A - Artistic score (0-100)
 * @property {number} S - Social score (0-100)
 * @property {number} E - Enterprising score (0-100)
 * @property {number} C - Conventional score (0-100)
 */

/**
 * @typedef {Object} RiasecQuestion
 * @property {string|number} id - Unique identifier for the question
 * @property {string} type - RIASEC type (R, I, A, S, E, or C)
 * @property {string} text - The question text in Bulgarian
 * @property {string} [category] - Optional category label
 */

/**
 * Изчислява RIASEC резултатите на базата на отговорите на потребителя.
 * 
 * Логика на точкуване (базирана на docs/SCORING_METHODOLOGY.md):
 * - Всеки тип (R, I, A, S, E, C) има N въпроса.
 * - Отговорите са по 5-степенна скала на Лайкерт (1 до 5).
 * - Raw Score = Сума от всички отговори за даден тип.
 * - Normalized Score = ((raw - min) / (max - min)) * 100
 * 
 * @example
 * const answers = { "q1": 5, "q2": 4 };
 * const questions = [{ id: "q1", type: "R", text: "..." }, { id: "q2", type: "R", text: "..." }];
 * const results = calculateScores(answers, questions); // { R: 88, I: 0, ... }
 * 
 * @param {Object.<string, number>} answers - Обект с отговори { questionId: value }
 * @param {RiasecQuestion[]} questions - Масив от въпроси от src/data/riasec_questions.json
 * @returns {RiasecScores} - Изчислените нормализирани резултати { R: number, I: number, ... }
 */
const EMPTY_SCORES = () => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });

export function calculateScores(answers, questions = []) {
    const rawScores = EMPTY_SCORES();
    const questionsPerType = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Ако нямаме въпроси (fallback към старата логика за съвместимост)
    if (!questions || questions.length === 0) {
        // Стара логика от CareerAdvisor.jsx стъпките
        if (answers && answers.interests && Array.isArray(answers.interests)) {
            answers.interests.forEach(interest => {
                switch (interest) {
                    case 'Technology': rawScores.I += 3; rawScores.C += 2; break;
                    case 'Art': rawScores.A += 3; rawScores.I += 2; break;
                    case 'Science': rawScores.I += 3; rawScores.R += 2; break;
                    case 'Social': rawScores.S += 3; rawScores.A += 2; break;
                    case 'Business': rawScores.E += 3; rawScores.C += 2; break;
                    case 'Nature': rawScores.R += 3; rawScores.I += 2; break;
                }
            });
            // За старата логика приемаме фиксиран брой "въпроси" за нормализация, 
            // ако искаме да връщаме 0-100. Но тук връщаме rawScores за съвместимост.
            return rawScores;
        }
        return rawScores;
    }

    // Нова логика на базата на въпроси
    questions.forEach(q => {
        const val = answers[q.id] || 3; // 3 е неутрален (middle of 1-5 scale)
        if (Object.prototype.hasOwnProperty.call(rawScores, q.type)) {
            rawScores[q.type] += val;
            questionsPerType[q.type] += 1;
        }
    });

    // Нормализация към скала 0-100 за по-лесно сравнение
    const normalizedScores = {};
    Object.keys(rawScores).forEach(type => {
        const count = questionsPerType[type] || 1;
        const min = count * 1; // Минимален възможен резултат (всички отговори са 1)
        const max = count * 5; // Максимален възможен резултат (всички отговори са 5)
        const raw = rawScores[type];
        
        // Формула: ((raw - min) / (max - min)) * 100
        const normalized = max === min ? 0 : ((raw - min) / (max - min)) * 100;
        normalizedScores[type] = Math.round(normalized);
    });

    return normalizedScores;
}

/**
 * Изчислява топ 3 буквения RIASEC код базиран на резултатите.
 * Сортира резултатите низходящо и взема първите три букви.
 * При равни резултати се запазва детерминистичен ред.
 * 
 * @example
 * calculateRiasecCode({ R: 75, I: 90, A: 30, S: 20, E: 50, C: 80 }); // "ICR"
 * 
 * @param {RiasecScores} scores - Обектът с нормализирани резултати
 * @returns {string} - 3-буквеният Holland код (напр. "ICS")
 */
export function calculateRiasecCode(scores) {
    if (!scores) return "";
    
    return Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => {
            // Първо по резултат (descending)
            if (scoreB !== scoreA) return scoreB - scoreA;
            // При равенство - запазваме консистентен ред (R > I > A > S > E > C)
            return 0; 
        })
        .slice(0, 3)
        .map(([letter]) => letter)
        .join('');
}

/**
 * Хибридно изчисляване на съвместимост между потребител и елемент (специалност/кариера).
 * Комбинира Евклидово разстояние (прецизност на вектора) с Позиционен мач (структура на интересите).
 * 
 * @param {RiasecScores} userScores - Нормализирани потребителски резултати (0-100)
 * @param {Object} item - Обект от базата данни
 * @param {RiasecScores} [item.riasec_scores_normalized] - Нормализиран вектор на елемента
 * @param {string} [item.riasec_code] - Holland код на елемента (напр. "RIA")
 * @returns {number} - Процент съвместимост (0-100)
 */
export function calculateHybridCompatibility(userScores, item) {
    if (!userScores || !item) return 0;
    
    // 1. Евклидова съвместимост (базирана на геометрична близост в 6D пространство)
    let euclideanScore = 0;
    if (item.riasec_scores_normalized) {
        euclideanScore = calculateEuclideanCompatibility(userScores, item.riasec_scores_normalized);
    }
    
    // 2. Позиционна съвместимост (базирана на приоритета на топ интересите)
    let codeScore = 0;
    if (item.riasec_code) {
        const userCode = calculateRiasecCode(userScores);
        codeScore = calculateMatchScore(userCode, item.riasec_code);
    }
    
    // Тегла на алгоритмите:
    // - 70% Евклидово: отчита общата интензивност на всички 6 типа интереси.
    // - 30% Код: отчита точното подреждане на водещите 3 интереса.
    if (euclideanScore > 0 && codeScore > 0) {
        return Math.round(euclideanScore * 0.7 + codeScore * 0.3);
    }
    
    // Fallback ако липсва една от двете метрики в базата
    return Math.max(euclideanScore, codeScore);
}

/**
 * Изчислява процент на съвпадение между два RIASEC вектора чрез Експоненциално затихване.
 * Това позволява по-добра диференциация между близки резултати в 6-измерното пространство.
 * 
 * Формула: e^(-k * d) * 100, където d е Евклидовото разстояние.
 * 
 * @param {RiasecScores} userScores - Вектор на потребителя
 * @param {RiasecScores} itemScores - Вектор на обекта (специалност/професия)
 * @returns {number} - Нормализиран процент съвпадение (0-100)
 */
export function calculateEuclideanCompatibility(userScores, itemScores) {
    if (!userScores || !itemScores) return 0;
    
    const letters = ['R', 'I', 'A', 'S', 'E', 'C'];
    let sumSquaredDiff = 0;
    
    // 1. Нормализираме векторите до диапазон 0-1 за изчисляване на разстоянието
    for (const l of letters) {
        const u = (userScores[l] || 0) / 100;
        const i = (itemScores[l] || 0) / 100;
        sumSquaredDiff += Math.pow(u - i, 2);
    }
    
    const distance = Math.sqrt(sumSquaredDiff);
    
    // 2. Коефициент k определя колко "строго" е сравнението. 
    // k = 1.2 дава балансирана диференциация.
    const k = 1.2;
    const compatibility = Math.exp(-k * distance) * 100;
    
    return Math.round(Math.max(0, Math.min(100, compatibility)));
}

/**
 * Позиционно сравнение на два 3-буквени Holland кода.
 * Прилага специфични тегла според позицията на буквите.
 * 
 * @example
 * calculateMatchScore("RIA", "RAI"); // 35 (R на 1-ва поз) + 10 (I) + 10 (A) = 55
 * 
 * @param {string} userCode - 3-буквен код на потребителя
 * @param {string} itemCode - 3-буквен код на обекта
 * @returns {number} - Точки съвпадение (0-100)
 */
export function calculateMatchScore(userCode, itemCode) {
    if (!userCode || !itemCode) return 0;
    
    const u = userCode.toUpperCase().split('');
    const i = itemCode.toUpperCase().split('');
    
    let score = 0;
    
    // Тегла за позиции: 
    // - 35 за съвпадение на 1-ва позиция (водещ интерес)
    // - 20 за съвпадение на 2-ра позиция
    // - 15 за съвпадение на 3-та позиция
    const positionWeights = [35, 20, 15];
    
    // 1. Проверка за точни съвпадения на позиции
    for (let pos = 0; pos < 3; pos++) {
        if (u[pos] && i[pos] && u[pos] === i[pos]) {
            score += positionWeights[pos];
        }
    }
    
    // 2. Бонус за наличие на буквата в кода (но на различна позиция)
    u.forEach(letter => {
        if (i.includes(letter)) {
            score += 10;
        }
    });

    // Резултатът се ограничава до 100 за консистентност с другите метрики
    return Math.min(100, score);
}
