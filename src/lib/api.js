import { supabase } from './supabase';
import {
    calculateScores,
    calculateHybridCompatibility
} from './riasec-matcher';

const SPECIALTY_RIASEC_COLS =
    'id,specialty_base_name,riasec_code,category';
// Bug fix: премахната `growth_outlook` (не съществува в схемата). Поради нея
// careers_riasec_mapping query-то връщаше 400, което чупеше RIASEC резултатите
// — потребителят завършваше теста и не виждаше нищо.
const CAREERS_COLS =
    'id,career_name_bg,career_name_en,riasec_code,category,salary_range_bgn,required_education';
const DORMITORIES_COLS =
    'id,university_id,city,block_number,application_period,monthly_rent_avg,deposit_amount,' +
    'condition_rating,commute_minutes,distance_to_uni_km,google_maps_url,' +
    'has_private_bathroom,is_renovated,transport_lines';

/**
 * Matching за специалности и професии на базата на RIASEC резултати.
 * Използва новите таблици specialty_riasec_mapping и careers_riasec_mapping.
 */
export async function getRiasecMatches(userScores) {
    if (!userScores) return { specialties: [], careers: [] };

    try {
        let { data: specialtiesData, error: specError } = await supabase
            .from('specialty_riasec_mapping')
            .select(`${SPECIALTY_RIASEC_COLS}, universities(id, university_name, city, max_ball)`);

        if (specError && specError.code === 'PGRST200') {
            const { data: standaloneSpecs, error: standaloneError } = await supabase
                .from('specialty_riasec_mapping')
                .select(SPECIALTY_RIASEC_COLS);

            if (standaloneError) throw standaloneError;
            specialtiesData = standaloneSpecs;
        } else if (specError) {
            throw specError;
        }

        const { data: careersData, error: careerError } = await supabase
            .from('careers_riasec_mapping')
            .select(CAREERS_COLS);

        if (careerError) {
            throw careerError;
        }

        // Strip study-form suffixes like (Р), (Р, З), (Д) (ЦДО - София) from display names
        const stripStudyForm = (name) =>
            name.replace(/(\s*\(([РЗД][^)]*|ЦДО[^)]*|РЦДО[^)]*)\))+\s*$/, '').trim();

        // 3. Изчисляване на съвместимост (Hybrid Logic)
        const specialties = (specialtiesData || [])
            .map(item => {
                const compatibility = calculateHybridCompatibility(userScores, item);
                return {
                    id: item.id,
                    name: stripStudyForm(item.specialty_base_name),
                    riasec_code: item.riasec_code,
                    category: item.category,
                    compatibility: compatibility,
                    universities_count: item.universities?.length || 0,
                    universities: item.universities || []
                };
            })
            .filter(item => item.compatibility >= 50)
            .sort((a, b) => b.compatibility - a.compatibility)
            .filter((item, idx, arr) => arr.findIndex(x => x.name === item.name) === idx);

        const careers = (careersData || [])
            .map(item => ({
                id: item.id,
                name: item.career_name_bg,
                career_name_en: item.career_name_en,
                riasec_code: item.riasec_code,
                category: item.category,
                salary: item.salary_range_bgn,
                required_education: item.required_education,
                compatibility: calculateHybridCompatibility(userScores, item)
            }))
            .filter(item => item.compatibility >= 50)
            .sort((a, b) => b.compatibility - a.compatibility);

        return { specialties, careers };

    } catch (err) {
        return { specialties: [], careers: [], error: err?.message || 'Грешка при зареждане на данните.' };
    }
}

/**
 * Извлича професии, които частично съвпадат с RIASEC кода (напр. същата първа буква).
 * Използва новата таблица careers_riasec_mapping.
 */
export async function getCareersByRiasec(riasecCode) {
    if (!riasecCode) return [];
    const firstLetter = riasecCode.charAt(0);

    const { data, error } = await supabase
        .from('careers_riasec_mapping')
        .select(CAREERS_COLS)
        .ilike('riasec_code', `${firstLetter}%`)
        .limit(50);

    if (error) {
        return [];
    }
    return data;
}

/**
 * Извлича специалности, съвпадащи с RIASEC кода.
 * Използва новата таблица specialty_riasec_mapping.
 */
export async function getSpecialtiesByRiasec(riasecCode) {
    if (!riasecCode) return [];
    const firstLetter = riasecCode.charAt(0);

    const { data, error } = await supabase
        .from('specialty_riasec_mapping')
        .select(`${SPECIALTY_RIASEC_COLS}, universities(id)`)
        .ilike('riasec_code', `${firstLetter}%`)
        .limit(100);

    if (error) {
        return [];
    }
    return data;
}

/**
 * Получава препоръки за кариера на базата на пълните резултати.
 * @param {Object} answers - Отговори на потребителя
 * @returns {Promise<Array>} - Топ съвпадащи професии
 */
export async function getCareerRecommendations(answers) {
    const rawScores = calculateScores(answers);
    const { careers } = await getRiasecMatches(rawScores);

    return careers.map(c => ({
        ...c,
        matchScore: c.compatibility // Унифициране на именуването за обратна съвместимост
    }));
}

/**
 * Получава препоръки за университети/специалности на базата на отговори.
 * @param {Object} answers - Отговори на потребителя
 * @returns {Promise<Array>}
 */
export async function getUniversityRecommendations(answers) {
    const rawScores = calculateScores(answers);
    const { specialties } = await getRiasecMatches(rawScores);

    // Преобразуваме структурата за обратна съвместимост с калкулатора
    const results = [];
    specialties.forEach(spec => {
        spec.universities.forEach(uni => {
            results.push({
                ...uni,
                specialty: spec.name,
                matchScore: spec.compatibility,
                riasec_code: spec.riasec_code
            });
        });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 15);
}

/**
 * Помощна функция за вземане на всички RIASEC кодове за тестване
 */
export async function getAllRiasecCodes() {
    const { data, error } = await supabase
        .from('careers_riasec_mapping')
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
        .select(DORMITORIES_COLS)
        .limit(200);

    if (error) {
        // Не поглъщай мълчаливо — в миналото DORMITORIES_COLS се разминаваше
        // със схемата и страницата показваше „0 резултата" без следа за причината.
        console.error('[getAllDormitories] Supabase error:', error.message);
        return [];
    }
    return data;
}
// Alias to fix the import mismatch in TestCareer.jsx
export const getUniversitiesByRiasec = getSpecialtiesByRiasec;
