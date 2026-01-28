import { supabase } from './supabase';
import { calculateRiasecCode, sortByMatch } from './riasec-matcher';

/**
 * Fetch careers that loosely match the RIASEC code (e.g., same first letter).
 * @param {string} riasecCode - The 3-letter code
 * @returns {Promise<Array>}
 */
export async function getCareersByRiasec(riasecCode) {
    if (!riasecCode) return [];
    const firstLetter = riasecCode.charAt(0);
    
    // Fetch careers where the RIASEC code starts with the same dominant letter
    // This is a good optimization to avoid fetching everything
    const { data, error } = await supabase
        .from('career_profiles')
        .select('*')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Error fetching careers:', error);
        return [];
    }
    return data;
}

/**
 * Fetch universities matching the RIASEC code.
 * @param {string} riasecCode 
 * @returns {Promise<Array>}
 */
export async function getUniversitiesByRiasec(riasecCode) {
    if (!riasecCode) return [];
    
    // For universities, we might want exact match or first letter match
    // Let's try first letter match for broader results, then sort
    const firstLetter = riasecCode.charAt(0);

    const { data, error } = await supabase
        .from('university_admissions')
        .select('*')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Error fetching universities:', error);
        return [];
    }
    return data;
}

/**
 * Get career recommendations based on full scores.
 * @param {Object} riasecScores - { R: 10, I: 5, ... }
 * @returns {Promise<Array>} - Top matched careers
 */
export async function getCareerRecommendations(riasecScores) {
    const userCode = calculateRiasecCode(riasecScores);
    
    // 1. Get candidates (broad search)
    // If we want to be very thorough, we could fetch all and sort, 
    // but fetching by first letter is usually sufficient for "Best matches"
    let candidates = await getCareersByRiasec(userCode);
    
    // If no candidates found by first letter (rare), try fetching all?
    if (candidates.length === 0) {
        const { data } = await supabase.from('career_profiles').select('*').limit(100);
        candidates = data || [];
    }

    // 2. Rank them
    const ranked = sortByMatch(userCode, candidates);
    
    // 3. Return top results (e.g. top 10)
    return ranked.slice(0, 10);
}

/**
 * Get university recommendations based on code.
 * @param {string} riasecCode 
 * @returns {Promise<Array>}
 */
export async function getUniversityRecommendations(riasecCode) {
    // 1. Get candidates
    let candidates = await getUniversitiesByRiasec(riasecCode);
    
    // 2. Rank them
    const ranked = sortByMatch(riasecCode, candidates);
    
    // 3. Return top results
    return ranked.slice(0, 10);
}

/**
 * Helper to get all RIASEC codes for testing
 */
export async function getAllRiasecCodes() {
    const { data, error } = await supabase
        .from('career_profiles')
        .select('riasec_code')
        .not('riasec_code', 'is', null);
        
    if (error) return [];
    
    // Unique codes
    const codes = [...new Set(data.map(item => item.riasec_code))].sort();
    return codes;
}
