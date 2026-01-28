import { supabase } from './supabase';
import { calculateRiasecCode, sortByMatch } from './riasec-matcher';

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
        .from('university_admissions')
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
export async function getCareerRecommendations(riasecScores) {
    const userCode = calculateRiasecCode(riasecScores);
    
    // 1. Вземане на кандидати (широко търсене)
    let candidates = await getCareersByRiasec(userCode);
    
    // Ако не са намерени кандидати по първа буква (рядко), опитваме да изтеглим произволни/всички
    if (candidates.length === 0) {
        const { data } = await supabase.from('career_profiles').select('*').limit(100);
        candidates = data || [];
    }

    // 2. Класиране (Ранжиране)
    const ranked = sortByMatch(userCode, candidates);
    
    // 3. Връщане на топ резултатите (напр. топ 10)
    return ranked.slice(0, 10);
}

/**
 * Получава препоръки за университети на базата на код.
 * @param {string} riasecCode 
 * @returns {Promise<Array>}
 */
export async function getUniversityRecommendations(riasecCode) {
    // 1. Вземане на кандидати
    let candidates = await getUniversitiesByRiasec(riasecCode);
    
    // 2. Класиране
    const ranked = sortByMatch(riasecCode, candidates);
    
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
