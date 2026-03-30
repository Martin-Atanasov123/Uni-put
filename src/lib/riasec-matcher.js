/**
 * Изчислява RIASEC резултатите на базата на отговорите на потребителя.
 * 
 * Логика на точкуване (базирана на docs/SCORING_METHODOLOGY.md):
 * - Всеки тип (R, I, A, S, E, C) има N въпроса.
 * - Отговорите са от 1 до 5.
 * - Raw Score = Сума от всички отговори за даден тип.
 * - Normalized Score = ((raw - min) / (max - min)) * 100
 * 
 * @param {Object} answers - Обект с отговори { questionId: value }
 * @param {Array} questions - Масив от въпроси от src/data/riasec_questions.json
 * @returns {Object} - Изчислените нормализирани резултати { R: number, I: number, ... }
 */
const EMPTY_SCORES = () => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });

export function calculateScores(answers, questions = []) {
    const rawScores = EMPTY_SCORES();
    const questionsPerType = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Ако нямаме въпроси, връщаме нулеви резултати
    if (!questions || questions.length === 0) {
        return rawScores;
    }

    // Нова логика на базата на въпроси
    questions.forEach(q => {
        const val = answers[q.id] || 3; // 3 е неутрален
        if (Object.prototype.hasOwnProperty.call(rawScores, q.type)) {
            rawScores[q.type] += val;
            questionsPerType[q.type] += 1;
        }
    });

    // Нормализация (0-100)
    const normalizedScores = {};
    Object.keys(rawScores).forEach(type => {
        const count = questionsPerType[type] || 1;
        const min = count * 1;
        const max = count * 5;
        const raw = rawScores[type];
        
        // Формула: ((raw - min) / (max - min)) * 100
        const normalized = max === min ? 0 : ((raw - min) / (max - min)) * 100;
        normalizedScores[type] = Math.round(normalized);
    });

    return normalizedScores;
}

/**
 * Изчислява топ 3 буквения RIASEC код базиран на резултатите.
 * @param {Object} scores - Обектът с нормализирани резултати { R: 75, I: 90, ... }
 * @returns {string} - 3-буквеният код (напр. "ICS")
 */
export function calculateRiasecCode(scores) {
    if (!scores) return "";
    
    return Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => {
            // Първо по резултат
            if (scoreB !== scoreA) return scoreB - scoreA;
            // При равенство - по азбучен ред (детерминистично)
            return 0; 
        })
        .slice(0, 3)
        .map(([letter]) => letter)
        .join('');
}

/**
 * Хибридно изчисляване на съвместимост.
 * Комбинира Евклидово разстояние (векторна близост) с Позиционен мач (Holland Code).
 * 
 * @param {Object} userScores - Нормализирани потребителски резултати (0-100)
 * @param {Object} item - Обект от базата (специалност или кариера)
 */
export function calculateHybridCompatibility(userScores, item) {
    if (!userScores || !item) return 0;
    
    // 1. Евклидова съвместимост (базирана на вектора)
    let euclideanScore = 0;
    if (item.riasec_scores_normalized) {
        euclideanScore = calculateEuclideanCompatibility(userScores, item.riasec_scores_normalized);
    }
    
    // 2. Позиционна съвместимост (базирана на кода)
    let codeScore = 0;
    if (item.riasec_code) {
        const userCode = calculateRiasecCode(userScores);
        codeScore = calculateMatchScore(userCode, item.riasec_code);
    }
    
    // Тегла: 70% Евклидово (прецизно), 30% Код (структурно)
    // Ако липсва едното, другото поема тежестта
    if (euclideanScore > 0 && codeScore > 0) {
        return Math.round(euclideanScore * 0.7 + codeScore * 0.3);
    }
    
    return Math.max(euclideanScore, codeScore);
}

/**
 * Изчислява процент на съвпадение между два RIASEC вектора чрез Експоненциално затихване.
 * Това позволява по-добра диференциация между близки резултати.
 * 
 * Формула: e^(-k * d) * 100
 */
export function calculateEuclideanCompatibility(userScores, itemScores) {
    if (!userScores || !itemScores) return 0;
    
    const letters = ['R', 'I', 'A', 'S', 'E', 'C'];
    let sumSquaredDiff = 0;
    
    // Нормализираме векторите до 0-1 за разстоянието
    for (const l of letters) {
        const u = (userScores[l] || 0) / 100;
        const i = (itemScores[l] || 0) / 100;
        sumSquaredDiff += Math.pow(u - i, 2);
    }
    
    const distance = Math.sqrt(sumSquaredDiff);
    
    // k е коефициент на чувствителност. 
    // k = 1.2 дава добра диференциация (80% съвпадение при малко разстояние).
    const k = 1.2;
    const compatibility = Math.exp(-k * distance) * 100;
    
    return Math.round(Math.max(0, Math.min(100, compatibility)));
}

/**
 * Позиционно сравнение на Holland кодове.
 * Прилага тегла за всяка позиция.
 */
export function calculateMatchScore(userCode, itemCode) {
    if (!userCode || !itemCode) return 0;
    
    const u = userCode.toUpperCase().split('');
    const i = itemCode.toUpperCase().split('');
    
    let score = 0;
    
    // Тегла за позиции: 35/20/15 за точен мач на позиция + 10 за наличие на буквата
    const positionWeights = [35, 20, 15];
    
    // 1. Проверка за точни съвпадения на позиции
    for (let pos = 0; pos < 3; pos++) {
        if (u[pos] && i[pos] && u[pos] === i[pos]) {
            score += positionWeights[pos];
        }
    }
    
    // 2. Бонус за наличие на буквата в кода (но на грешна позиция)
    u.forEach(letter => {
        if (i.includes(letter)) {
            score += 10;
        }
    });

    // Максималният резултат може да е над 100, затова го ограничаваме
    return Math.min(100, score);
}
