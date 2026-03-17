import { supabase } from './supabase';
import { 
    calculateScores,
    calculateHybridCompatibility
} from './riasec-matcher';

/**
 * Matching за специалности и професии на базата на RIASEC резултати.
 * Използва новите таблици specialty_riasec_mapping и careers_riasec_mapping.
 */
export async function getRiasecMatches(userScores) {
    if (!userScores) return { specialties: [], careers: [] };
    console.log('RIASEC Matching: Start matching for scores:', userScores);

    try {
        // 1. Извличане на специалности с RIASEC mapping
        // Използваме два отделни обръщения, ако JOIN-ът се провали поради липсващ Foreign Key
        console.log('RIASEC Matching: Fetching specialties from specialty_riasec_mapping...');
        let { data: specialtiesData, error: specError } = await supabase
            .from('specialty_riasec_mapping')
            .select('*, universities_duplicate(id, university_name, city, min_ball_2024)');

        // Ако JOIN заявката се провали (напр. PGRST200), опитваме без JOIN
        if (specError && specError.code === 'PGRST200') {
            console.warn('RIASEC Matching: Join failed, falling back to separate queries.');
            const { data: standaloneSpecs, error: standaloneError } = await supabase
                .from('specialty_riasec_mapping')
                .select('*');
            
            if (standaloneError) throw standaloneError;
            specialtiesData = standaloneSpecs;
        } else if (specError) {
            throw specError;
        }

        console.log(`RIASEC Matching: Found ${specialtiesData?.length || 0} specialties in DB.`);

        // 2. Извличане на професии с RIASEC mapping
        console.log('RIASEC Matching: Fetching careers from careers_riasec_mapping...');
        const { data: careersData, error: careerError } = await supabase
            .from('careers_riasec_mapping')
            .select('*');

        if (careerError) {
            console.error('RIASEC Matching Error (careers):', careerError);
            throw careerError;
        }
        console.log(`RIASEC Matching: Found ${careersData?.length || 0} careers in DB.`);

        // 3. Изчисляване на съвместимост (Hybrid Logic)
        const specialties = (specialtiesData || [])
            .map(item => {
                const compatibility = calculateHybridCompatibility(userScores, item);
                return {
                    id: item.id,
                    name: item.specialty_base_name,
                    riasec_code: item.riasec_code,
                    category: item.category,
                    compatibility: compatibility,
                    universities_count: item.universities_duplicate?.length || 0,
                    universities: item.universities_duplicate || []
                };
            })
            .filter(item => item.compatibility >= 50) // Намаляваме прага до 50% за повече резултати
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 20);

        console.log(`RIASEC Matching: Filtered to ${specialties.length} matching specialties (>=50%).`);

        const careers = (careersData || [])
            .map(item => ({
                id: item.id,
                name: item.career_name_bg,
                career_name_en: item.career_name_en,
                riasec_code: item.riasec_code,
                category: item.category,
                salary: item.salary_range_bgn,
                required_education: item.required_education,
                growth_outlook: item.growth_outlook,
                compatibility: calculateHybridCompatibility(userScores, item)
            }))
            .filter(item => item.compatibility >= 50)
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 20);

        console.log(`RIASEC Matching: Found ${careers.length} matching careers.`);

        return { specialties, careers };

    } catch (error) {
        console.error('RIASEC matching final error:', error);
        return { specialties: [], careers: [] };
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
        .select('*')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Грешка при извличане на професии:', error);
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
        .select('*, universities_duplicate(id)')
        .ilike('riasec_code', `${firstLetter}%`);

    if (error) {
        console.error('Грешка при извличане на специалности:', error);
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
        .select('*');

    if (error) {
        console.error('Грешка при извличане на общежития:', error);
        return [];
    }
    return data;
}
