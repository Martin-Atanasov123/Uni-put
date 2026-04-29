// Модул: universityService
// Описание: Server-side филтриране на университети/специалности през Supabase.
//   Заявките се правят с .ilike() / .or() / .eq() на сървъра, не в браузъра.
// Експорти: searchUniversities, getByIds, getCities
// Бележки: getCities кешира за 24h (рядко се мени). Грешките се хвърлят нагоре,
//   за да може UI слоят да покаже error state.

import { supabase } from '@/lib/supabase';

const SLIM_COLS = 'id,university_name,specialty,faculty,city,education_level,max_ball';
const PAGE_SIZE_DEFAULT = 200;

const CITIES_CACHE_KEY = 'uniput_cities_cache_v1';
const CITIES_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// Синоними — когато потребителят пише "право" искаме да хване и "юридически науки" и т.н.
const SPECIALTY_SYNONYMS = {
    'право': ['право', 'юридически науки', 'правни науки'],
};

const normalize = (s) => (s || '').toLowerCase().trim();

// Премахва PostgREST мета-символи от user input преди да се вгради в .ilike() pattern.
// Това НЕ замества параметризация — Supabase прави proper escaping на стойностите —
// но защитава срещу .or() injection (запетаи и кавички).
const sanitizeForIlike = (s) =>
    (s || '').replace(/[%_\\,()'"]/g, '').slice(0, 80);

export const universityService = {

    /**
     * Server-side търсене на университети/специалности.
     * @param {Object} opts
     * @param {string} [opts.query=''] - текст за търсене (specialty/university_name/faculty)
     * @param {string} [opts.city='Всички'] - филтър по град
     * @param {string} [opts.level='Всички'] - филтър по степен (бакалавър/магистър)
     * @param {number} [opts.limit=PAGE_SIZE_DEFAULT] - брой резултати
     * @param {number} [opts.offset=0] - изместване (за пагинация)
     * @returns {Promise<Array>} - масив записи (back-compat за съществуващи компоненти)
     */
    async searchUniversities({
        query = '',
        city = 'Всички',
        level = 'Всички',
        limit = PAGE_SIZE_DEFAULT,
        offset = 0,
    } = {}) {
        const normalizedQuery = normalize(query);
        let q = supabase.from('universities').select(SLIM_COLS);

        if (normalizedQuery) {
            const synonyms = SPECIALTY_SYNONYMS[normalizedQuery] || [normalizedQuery];
            // Изграждаме .or() условие — всеки synonym се търси в specialty/university_name/faculty
            const orParts = [];
            synonyms.forEach((term) => {
                const safe = sanitizeForIlike(term);
                if (!safe) return;
                orParts.push(`specialty.ilike.%${safe}%`);
                orParts.push(`university_name.ilike.%${safe}%`);
                orParts.push(`faculty.ilike.%${safe}%`);
            });
            if (orParts.length) q = q.or(orParts.join(','));
        }

        if (city && city !== 'Всички') q = q.eq('city', city);
        if (level && level !== 'Всички') q = q.eq('education_level', level);

        q = q.order('university_name', { ascending: true })
             .range(offset, offset + limit - 1);

        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    },

    /**
     * Дърпа само записите със зададени ID-та (за Favorites/Profile).
     * @param {Array<string|number>} ids
     * @returns {Promise<Array>}
     */
    async getByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return [];
        // Нормализираме към числа (PostgreSQL bigint), филтрираме невалидни
        const numericIds = ids
            .map((id) => Number(id))
            .filter((n) => Number.isFinite(n) && n > 0);
        if (numericIds.length === 0) return [];

        const { data, error } = await supabase
            .from('universities')
            .select(SLIM_COLS)
            .in('id', numericIds);

        if (error) throw error;
        return data || [];
    },

    /**
     * Връща списък с уникални градове. Кешира се в localStorage за 24h.
     * @returns {Promise<Array<string>>}
     */
    async getCities() {
        // 1. Опит за cache
        try {
            const raw = localStorage.getItem(CITIES_CACHE_KEY);
            if (raw) {
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts < CITIES_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch {
            // corrupt cache — игнорираме
        }

        // 2. Fetch — само колоната `city`, малък payload
        const { data, error } = await supabase
            .from('universities')
            .select('city');
        if (error) throw error;

        const unique = [...new Set((data || []).map((d) => d.city).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'bg'));
        const result = ['Всички', ...unique];

        try {
            localStorage.setItem(
                CITIES_CACHE_KEY,
                JSON.stringify({ ts: Date.now(), data: result })
            );
        } catch {
            // localStorage full / unavailable — без проблем
        }
        return result;
    },
};
