import { supabase } from './supabase';
import { buildRiasecProfile, riasecScoresToVector, riasecCodeToVector, cosineSimilarity } from './riasec-matcher';

/**
 * Извлича професии, които частично съвпадат с RIASEC кода (напр. същата първа буква).
 * @param {string} riasecCode - 3-буквеният код
 * @returns {Promise<Array>}
 */
export async function getCareersByRiasec(riasecCode) {
    if (!riasecCode) return [];
    const firstLetter = riasecCode.charAt(0);
    
    // Извличане на професии, където RIASEC кодът започва със същата доминантна буква.
    // Това е добра оптимизация, за да се избегне изтеглянето на всички записи.
    const { data, error } = await supabase
        .from('career_profiles')
        .select('*')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Грешка при извличане на професии:', error);
        return [];
    }
    return data;
}

/**
 * Извлича университети, съвпадащи с RIASEC кода.
 * @param {string} riasecCode 
 * @returns {Promise<Array>}
 */
export async function getUniversitiesByRiasec(riasecCode) {
    if (!riasecCode) return [];
    
    // За университетите също използваме съвпадение по първа буква за по-широк кръг резултати,
    // след което ще ги сортираме.
    const firstLetter = riasecCode.charAt(0);

    const { data, error } = await supabase
        .from('universities_duplicate')
        .select('*')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Грешка при извличане на университети:', error);
        return [];
    }
    return data;
}

/**
 * Получава препоръки за кариера на базата на пълните резултати.
 * @param {Object} riasecScores - { R: 10, I: 5, ... }
 * @returns {Promise<Array>} - Топ съвпадащи професии
 */
export async function getCareerRecommendations(answers) {
    const profile = buildRiasecProfile(answers);
    const userVector = riasecScoresToVector(profile.scores);
    const userCode = profile.riasecCode;
    
    // 1. Вземане на кандидати (широко търсене)
    let candidates = await getCareersByRiasec(userCode);
    
    // Ако не са намерени кандидати по първа буква (рядко), опитваме да изтеглим произволни/всички
    if (candidates.length === 0) {
        const { data } = await supabase.from('career_profiles').select('*').limit(100);
        candidates = data || [];
    }

    // 2. Класиране (Ранжиране) – използваме cosine similarity като психологически мач
    const ranked = candidates
        .map((item) => {
            const itemVector = riasecCodeToVector(item.riasec_code || '');
            const psychologicalMatch = cosineSimilarity(userVector, itemVector);

            // За професии нямаме академичен бал, затова го оставяме неутрален.
            const academicMatch = 0.5;

            // При липса на специфични данни за среда/стил – умерено неутрално съвпадение.
            const environmentFit = 0.5;

            const admissionProbability = 0.5;

            const finalScore =
                0.5 * psychologicalMatch +
                0.25 * academicMatch +
                0.15 * environmentFit +
                0.10 * admissionProbability;

            return {
                ...item,
                matchScore: Math.round(finalScore * 100),
                _details: {
                    psychologicalMatch,
                    academicMatch,
                    environmentFit,
                    admissionProbability,
                    confidence: profile.confidence
                }
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    
    // 3. Връщане на топ резултатите (напр. топ 10)
    return ranked.slice(0, 10);
}

/**
 * Получава препоръки за университети на базата на код.
 * @param {string} riasecCode 
 * @returns {Promise<Array>}
 */
export async function getUniversityRecommendations(answers, userScore) {
    const profile = buildRiasecProfile(answers);
    const userVector = riasecScoresToVector(profile.scores);
    const riasecCode = profile.riasecCode;

    // 1. Вземане на кандидати – първо по доминантна буква
    let candidates = await getUniversitiesByRiasec(riasecCode);

    // 2. Ако резултатите са малко, разширяваме търсенето
    if (candidates.length < 20) {
        const secondLetter = riasecCode.charAt(1);
        if (secondLetter) {
            const { data: secondary } = await supabase
                .from('universities_duplicate')
                .select('*')
                .ilike('riasec_code', `%${secondLetter}%`)
                .limit(200);
            if (secondary) {
                const byId = new Map();
                [...candidates, ...secondary].forEach((c) => {
                    if (!byId.has(c.id)) byId.set(c.id, c);
                });
                candidates = Array.from(byId.values());
            }
        }
    }

    if (candidates.length < 10) {
        const { data: fallback } = await supabase
            .from('universities_duplicate')
            .select('*')
            .limit(300);
        if (fallback) {
            const byId = new Map();
            [...candidates, ...fallback].forEach((c) => {
                if (!byId.has(c.id)) byId.set(c.id, c);
            });
            candidates = Array.from(byId.values());
        }
    }

    const ranked = candidates
        .map((item) => {
            const itemVector = riasecCodeToVector(item.riasec_code || '');
            const psychologicalMatch = cosineSimilarity(userVector, itemVector);

            const minScore = typeof item.min_score === 'number' ? item.min_score : null;
            const avgScore = typeof item.avg_score === 'number' ? item.avg_score : null;

            let academicMatch = 0.5;
            let admissionProbability = 0.5;

            if (typeof userScore === 'number' && minScore !== null) {
                if (userScore < minScore) {
                    academicMatch = 0;
                    admissionProbability = 0.05;
                } else {
                    const target = avgScore || minScore;
                    const ratio = userScore / target;
                    if (ratio >= 1.1) {
                        academicMatch = 1;
                    } else if (ratio >= 1.0) {
                        academicMatch = 0.8 + 0.2 * ((ratio - 1) / 0.1);
                    } else if (ratio >= 0.9) {
                        academicMatch = 0.4 + 0.4 * ((ratio - 0.9) / 0.1);
                    } else {
                        academicMatch = 0.1 + 0.3 * (ratio / 0.9);
                    }

                    const x = userScore - target;
                    const k = 0.8;
                    const prob = 1 / (1 + Math.exp(-k * x));
                    admissionProbability = userScore < minScore ? Math.min(prob, 0.1) : prob;
                }
            }

            const environmentFit = 0.5;

            const finalScore =
                0.5 * psychologicalMatch +
                0.25 * academicMatch +
                0.15 * environmentFit +
                0.10 * admissionProbability;

            return {
                ...item,
                matchScore: Math.round(finalScore * 100),
                _details: {
                    psychologicalMatch,
                    academicMatch,
                    environmentFit,
                    admissionProbability,
                    confidence: profile.confidence,
                    userScore
                }
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

    // 3. Връщане на топ резултатите
    return ranked.slice(0, 10);
}

/**
 * Помощна функция за вземане на всички RIASEC кодове за тестване
 */
export async function getAllRiasecCodes() {
    const { data, error } = await supabase
        .from('career_profiles')
        .select('riasec_code')
        .not('riasec_code', 'is', null);
        
    if (error) return [];
    
    // Уникални кодове
    const codes = [...new Set(data.map(item => item.riasec_code))].sort();
    return codes;
}

/**
 * Извлича всички общежития.
 * @returns {Promise<Array>}
 */
export async function getAllDormitories() {
    const { data, error } = await supabase
        .from('dormitories')
        .select('*');

    if (error) {
        console.error('Грешка при извличане на общежития:', error);
        return [];
    }
    return data;
}
