// Модул: universityService
// Описание: Server-side филтриране на университети/специалности през Supabase.
//   Заявките се правят с .ilike() / .or() / .eq() на сървъра, не в браузъра.
// Експорти: searchUniversities, getByIds, getCities
// Бележки: getCities кешира за 24h (рядко се мени). Грешките се хвърлят нагоре,
//   за да може UI слоят да покаже error state.

import { supabase } from '@/lib/supabase';
import { ADMISSION_YEAR } from '@/lib/siteStats';

const SLIM_COLS = 'id,university_name,specialty,faculty,city,education_level,max_ball,accreditation_status';
const PAGE_SIZE_DEFAULT = 200;

const CITIES_CACHE_KEY = 'uniput_cities_cache_v2';
const CITIES_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h
const UNI_NAMES_CACHE_KEY = 'uniput_uni_names_cache_v2';
const SPEC_NAMES_CACHE_KEY = 'uniput_spec_names_cache_v2';
const SPEC_INDEX_CACHE_KEY = 'uniput_spec_index_cache_v1';

/**
 * Уникални стойности на колона (faculty/city/university_name/specialty) за текущата
 * академична година — DISTINCT на сървъра (RPC universities_distinct).
 * Преди това се теглеше цялата колона и се махаха дубликатите в браузъра, а
 * PostgREST отрязва отговора на 1000 реда (губеха се факултети, градове, университети).
 * @param {'faculty'|'city'|'university_name'|'specialty'} column
 * @returns {Promise<string[]>} подредени по българска азбука
 */
export async function fetchDistinct(column) {
    const { data, error } = await supabase.rpc('universities_distinct', {
        p_column: column,
        p_year: ADMISSION_YEAR,
    });
    if (error) throw error;
    return (data || []).filter(Boolean).sort((a, b) => a.localeCompare(b, 'bg'));
}

// Синоними на дума от заявката — търсят се като алтернативи на самата дума.
const SPECIALTY_SYNONYMS = {
    'право': ['юридически науки', 'правни науки'],
    'стоматология': ['дентална медицина'],
    'стоматолог': ['дентална медицина'],
    'айти': ['информати', 'компютър', 'софтуер', 'информационни технологии'],
    'ит': ['информати', 'компютър', 'софтуер', 'информационни технологии'],
    'it': ['информати', 'компютър', 'софтуер', 'информационни технологии'],
    'програмиране': ['софтуер', 'информати', 'компютър'],
    'лекар': ['медицина'],
    'учител': ['педагог'],
};

// Съкращение (цялата дума) → началото на официалното име в базата (търси се
// като префикс, иначе „ТУ" хваща и „Лесотехнически университет").
// Откъсите са без запетаи — запетаята разделя условията в PostgREST .or().
const UNIVERSITY_ABBREVIATIONS = {
    'су': 'Софийски университет',
    'пу': 'Пловдивски университет',
    'унсс': 'Университет за национално и световно стопанство',
    'ту': 'Технически университет',
    'нбу': 'Нов български университет',
    'вту': 'Великотърновски университет',
    'юзу': 'Югозападен университет',
    'шу': 'Шуменски университет',
    'ру': 'Русенски университет',
    'тру': 'Тракийски университет',
    'лту': 'Лесотехнически университет',
    'хтму': 'Химикотехнологичен и металургичен университет',
    'уасг': 'Университет по архитектура',
    'мгу': 'Минно-геоложки университет',
    'ухт': 'Университет по хранителни технологии',
    'ау': 'Аграрен университет',
    'иу': 'Икономически университет',
    'му': 'Медицински университет',
    'бсу': 'Бургаски свободен университет',
    'всу': 'Варненски свободен университет',
    'бду': 'Бургаски държавен университет',
    'ауб': 'Американски университет',
    'аубг': 'Американски университет',
    'нса': 'Национална спортна академия',
    'натфиз': 'Национална академия за театрално',
    'нма': 'Национална музикална академия',
    'нха': 'Национална художествена академия',
    'нву': 'Национален военен университет',
    'амтии': 'Академия за музикално',
    'унибит': 'Университет по библиотекознание',
    'узф': 'Университет по застраховане',
    'ввму': 'Висше военноморско училище',
    'мвр': 'Академия на Министерството на вътрешните работи',
};

const STOPWORDS = new Set(['в', 'и', 'на', 'по', 'за', 'от', 'с', 'със', 'към', 'the', 'and']);

const LATIN_TO_CYRILLIC = [
    ['sht', 'щ'], ['zh', 'ж'], ['ch', 'ч'], ['sh', 'ш'], ['yu', 'ю'], ['ya', 'я'], ['ts', 'ц'], ['ia', 'ия'],
    ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'], ['i', 'и'],
    ['y', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'],
    ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['c', 'ц'], ['w', 'в'], ['x', 'кс'],
    ['q', 'к'], ['j', 'й'],
];
const transliterate = (word) =>
    LATIN_TO_CYRILLIC.reduce((acc, [lat, cyr]) => acc.split(lat).join(cyr), word);

// Дълги думи се търсят без последните 2 букви, за да хванат и други форми
// („психологии" → „психолог"). Къси думи (градове, „право") остават цели.
const stem = (word) => (word.length >= 7 ? word.slice(0, -2) : word);

const normalize = (s) => (s || '').toLowerCase().trim();

// Разбива заявката на думи; всяка дума става списък алтернативи (стебло,
// синоними, кирилица от латиница) или съкращение на университет.
const parseQuery = (query) =>
    normalize(query)
        .split(/[\s,.;:–—-]+/)
        .map((w) => sanitizeForIlike(w))
        .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
        .slice(0, 6)
        .map((word) => {
            if (UNIVERSITY_ABBREVIATIONS[word]) return { word, university: UNIVERSITY_ABBREVIATIONS[word] };
            const variants = new Set([stem(word), ...(SPECIALTY_SYNONYMS[word] || [])]);
            if (/^[a-z]+$/.test(word)) variants.add(stem(transliterate(word)));
            return { word, variants: [...variants].map(sanitizeForIlike).filter(Boolean) };
        });

const SEARCH_COLUMNS = ['specialty', 'university_name', 'faculty', 'city'];

// Първо програмите, чието име на специалност съдържа думите от заявката.
const relevance = (row, terms) => {
    const specialty = normalize(row.specialty);
    let score = 0;
    for (const t of terms) {
        if (t.university) continue;
        if (t.variants.some((v) => specialty.startsWith(normalize(v)))) score += 2;
        else if (t.variants.some((v) => specialty.includes(normalize(v)))) score += 1;
    }
    return score;
};

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
        const terms = parseQuery(query);
        let q = supabase.from('universities').select(SLIM_COLS)
            .eq('academic_year', ADMISSION_YEAR);

        // Всяка дума е отделно .or() (PostgREST ги свързва с AND): „информатика
        // софия" намира програми, които съдържат и двете думи в някоя колона.
        for (const t of terms) {
            if (t.university) {
                q = q.or(`university_name.ilike.${t.university}%`);
                continue;
            }
            const orParts = t.variants.flatMap((v) => SEARCH_COLUMNS.map((col) => `${col}.ilike.%${v}%`));
            if (orParts.length) q = q.or(orParts.join(','));
        }

        if (city && city !== 'Всички') q = q.eq('city', city);
        if (level && level !== 'Всички') q = q.eq('education_level', level);

        q = q.order('university_name', { ascending: true })
             .range(offset, offset + limit - 1);

        const { data, error } = await q;
        if (error) throw error;
        const rows = data || [];
        if (!terms.length) return rows;
        return rows
            .map((row, i) => ({ row, i, score: relevance(row, terms) }))
            .sort((a, b) => b.score - a.score || a.i - b.i)
            .map((x) => x.row);
    },

    /**
     * Дърпа само записите със зададени ID-та (за Favorites/Profile).
     * Bug fix: universities.id е UUID (string), не bigint. Старият код
     * правеше Number(uuid) → NaN → filter изхвърляше всичко → връщаше [].
     * Затова Favorites винаги изглеждаше празна. Сега валидираме UUID-и.
     * @param {Array<string>} ids - UUID strings
     * @returns {Promise<Array>}
     */
    async getByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return [];
        // Валидираме като UUID v4-style strings (8-4-4-4-12 hex chars).
        // Това предпазва и от SQL injection в `.in()` clause-а.
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validIds = ids.filter(
            (id) => typeof id === 'string' && UUID_RE.test(id)
        );
        if (validIds.length === 0) return [];

        const { data, error } = await supabase
            .from('universities')
            .select(SLIM_COLS)
            .eq('academic_year', ADMISSION_YEAR)
            .in('id', validIds);

        if (error) throw error;
        return data || [];
    },

    /**
     * Връща списък с уникални градове. Кешира се в localStorage за 24h.
     * @returns {Promise<Array<string>>}
     */
    /**
     * Списък с уникалните имена на университети. Малък payload (~24 записа),
     * кешира се 24h. Използва се за резолване на /universities/[slug] → name.
     * @returns {Promise<Array<string>>}
     */
    async getUniversityNames() {
        try {
            const raw = localStorage.getItem(UNI_NAMES_CACHE_KEY);
            if (raw) {
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts < CITIES_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch { /* corrupt cache */ }

        const unique = await fetchDistinct('university_name');

        try {
            localStorage.setItem(UNI_NAMES_CACHE_KEY,
                JSON.stringify({ ts: Date.now(), data: unique }));
        } catch { /* localStorage full */ }
        return unique;
    },

    /**
     * Всички записи за конкретен университет — групирани по факултет в UI слоя.
     * @param {string} name - точно име на университета (от getUniversityNames)
     * @returns {Promise<Array>}
     */
    async getByUniversityName(name) {
        if (!name) return [];
        const { data, error } = await supabase
            .from('universities')
            .select(SLIM_COLS)
            .eq('academic_year', ADMISSION_YEAR)
            .eq('university_name', name)
            .order('faculty', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    /**
     * Списък с уникалните имена на специалности (за резолване на
     * /specialnosti/[slug] → име). Кешира се 24h.
     * @returns {Promise<Array<string>>}
     */
    async getSpecialtyNames() {
        try {
            const raw = localStorage.getItem(SPEC_NAMES_CACHE_KEY);
            if (raw) {
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts < CITIES_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch { /* corrupt cache */ }

        const unique = await fetchDistinct('specialty');

        try {
            localStorage.setItem(SPEC_NAMES_CACHE_KEY,
                JSON.stringify({ ts: Date.now(), data: unique }));
        } catch { /* localStorage full */ }
        return unique;
    },

    /**
     * Всички програми (университети) за дадена специалност + RIASEC съответствие
     * и историческите минимални балове. Всичко от базата — за per-specialty
     * SEO страницата. Nothing invented.
     * @param {string} name - точно име на специалността (от getSpecialtyNames)
     * @returns {Promise<{ programs: Array, riasec: object|null, minScores: object }>}
     */
    async getBySpecialty(name) {
        if (!name) return { programs: [], riasec: null, minScores: {} };
        const { data: programs, error } = await supabase
            .from('universities')
            .select('id,university_name,specialty,faculty,city,education_level,max_ball,coefficients,formula_description,website_url,accreditation_status')
            .eq('academic_year', ADMISSION_YEAR)
            .eq('specialty', name)
            .order('university_name', { ascending: true });
        if (error) throw error;
        if (!programs || !programs.length) return { programs: [], riasec: null, minScores: {} };

        // RIASEC съответствие за специалността (за връзка към кариерния тест).
        const { data: riasecRows } = await supabase
            .from('specialty_riasec_mapping')
            .select('riasec_code, category')
            .eq('specialty_base_name', name)
            .limit(1);
        const riasec = riasecRows?.[0] || null;

        // Исторически минимални балове за тези програми (където има).
        const ids = programs.map((p) => p.id);
        const minScores = {};
        if (ids.length) {
            const { data: ms } = await supabase
                .from('admission_min_scores')
                .select('university_id, year, round, min_ball, quota')
                .in('university_id', ids);
            if (ms?.length) {
                const byId = {};
                ms.forEach((r) => { (byId[r.university_id] ||= []).push(r); });
                Object.entries(byId).forEach(([id, rows]) => {
                    // Последна година, най-ранно класиране — същата логика като калкулатора.
                    const latestYear = Math.max(...rows.map((r) => r.year));
                    const yearRows = rows.filter((r) => r.year === latestYear);
                    const roundRank = (r) => (r.round === null ? 99 : r.round);
                    const bestRound = Math.min(...yearRows.map(roundRank));
                    const finalRows = yearRows.filter((r) => roundRank(r) === bestRound);
                    const vals = finalRows.map((r) => Number(r.min_ball)).filter((v) => !Number.isNaN(v));
                    if (vals.length) minScores[id] = { minBall: Math.min(...vals), year: latestYear };
                });
            }
        }
        return { programs, riasec, minScores };
    },

    /**
     * Индекс за хъб страницата /specialnosti/: всяка специалност, предлагана в
     * поне 2 университета (същият праг като prerender.mjs и sitemap-а — под него
     * няма агрегатна страница), с броя университети. Кешира се 24h.
     * @returns {Promise<Array<{ name: string, unis: number }>>}
     */
    async getSpecialtyIndex() {
        try {
            const raw = localStorage.getItem(SPEC_INDEX_CACHE_KEY);
            if (raw) {
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts < CITIES_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch { /* corrupt cache */ }

        // PostgREST реже на 1000 реда → странираме, иначе специалности изпадат.
        const PAGE = 1000;
        const bySpec = new Map();
        for (let from = 0; ; from += PAGE) {
            const { data, error } = await supabase
                .from('universities')
                .select('university_name,specialty')
                .eq('academic_year', ADMISSION_YEAR)
                .order('id', { ascending: true })
                .range(from, from + PAGE - 1);
            if (error) throw error;
            if (!data || !data.length) break;
            for (const row of data) {
                if (!row.specialty) continue;
                if (!bySpec.has(row.specialty)) bySpec.set(row.specialty, new Set());
                bySpec.get(row.specialty).add(row.university_name);
            }
            if (data.length < PAGE) break;
        }

        const index = [...bySpec.entries()]
            .filter(([, unis]) => unis.size >= 2)
            .map(([name, unis]) => ({ name, unis: unis.size }))
            .sort((a, b) => a.name.localeCompare(b.name, 'bg'));

        try {
            localStorage.setItem(SPEC_INDEX_CACHE_KEY,
                JSON.stringify({ ts: Date.now(), data: index }));
        } catch { /* localStorage full */ }
        return index;
    },

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

        // 2. Уникалните градове — DISTINCT на сървъра
        const unique = await fetchDistinct('city');
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
