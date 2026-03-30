// Модул: Университети (сервизен слой)
// Описание: Предоставя API за търсене и извличане на данни за университети/специалности
//   с клиентско кеширане в localStorage и защитено четене от Supabase.
// Вход: параметри за търсене { query?: string, city?: string }
// Изход: масив от записи (университет/факултет/специалност/град/коефициенти и др.)
// Бележки: Използва TTL кеш (1 час) и fallback свеж fetch при празен резултат.
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'universities_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const SEARCH_LIMIT_REFRESH_MS = 1000 * 60 * 10; // 10 minutes

const SPECIALTY_SYNONYMS = {
    "право": ["право", "юридически науки", "правни науки", "law"]
};

const normalize = (s) => (s || "").toLowerCase().trim();

/**
 * @typedef {Object} UniversitySearchParam
 * @property {string} [query] - Текст за търсене (университет или специалност)
 * @property {string} [city] - Град за филтриране (по подразбиране "Всички")
 */

/**
 * Сервизен слой за управление на данни за университети.
 * Осигурява абстракция над Supabase с вградено клиентско кеширане (TTL).
 */
export const universityService = {
    
    /**
     * Търсене на университети и специалности с филтри и синоними.
     * 
     * Алгоритъм:
     * 1. Опит за четене от локален кеш (localStorage).
     * 2. При липса на кеш - извличане на пълния набор от Supabase.
     * 3. Прилагане на текстови филтри (case-insensitive) и поддръжка на синоними.
     * 4. Fallback: Ако филтрираните резултати са празни, опитва нов fetch за опресняване.
     * 
     * @async
     * @param {UniversitySearchParam} params - Параметри за търсене
     * @returns {Promise<Array<Object>>} - Масив от съвпадащи обекти на университети
     */
    async searchUniversities({ query = '', city = 'Всички' }) {
        try {
            const normalizedQuery = normalize(query);
            const synonyms = SPECIALTY_SYNONYMS[normalizedQuery] || [normalizedQuery].filter(Boolean);

            // 1. Проверка на кеша
            const cached = this.getFromCache();
            let data = cached;

            // 2. Fetch ако няма кеш или е изтекъл
            if (!data) {
                const { data: fetchedData, error } = await supabase
                    .from('universities_duplicate')
                    .select('*');
                
                if (error) throw error;
                
                data = fetchedData;
                this.saveToCache(data);
            }

            // 3. Клиентско филтриране
            let filtered = data.filter(uni => {
                const uName = normalize(uni.university_name);
                const spec = normalize(uni.specialty);
                
                const matchesQuery = !normalizedQuery || 
                    uName.includes(normalizedQuery) || 
                    spec.includes(normalizedQuery) ||
                    (synonyms.length > 0 && synonyms.some(s => spec.includes(s)));
                
                const matchesCity = city === 'Всички' || uni.city === city;
                
                return matchesQuery && matchesCity;
            });

            // 4. Fallback при празен резултат (възможно остарял кеш)
            if (normalizedQuery && filtered.length === 0) {
                const { data: fetchedData, error } = await supabase
                    .from('universities_duplicate')
                    .select('*');
                
                if (!error && fetchedData) {
                    this.saveToCache(fetchedData);
                    filtered = fetchedData.filter(uni => {
                        const uName = normalize(uni.university_name);
                        const spec = normalize(uni.specialty);
                        const matchesQuery = !normalizedQuery || uName.includes(normalizedQuery) || spec.includes(normalizedQuery);
                        const matchesCity = city === 'Всички' || uni.city === city;
                        return matchesQuery && matchesCity;
                    });
                }
            }

            return filtered;

        } catch (error) {
            console.error('universityService critical error:', error);
            return [];
        }
    },

    /**
     * Извлича всички уникални градове от наличните университети.
     * @async
     * @returns {Promise<string[]>} - Сортиран масив от градове, започващ с "Всички"
     */
    async getCities() {
        const unis = await this.searchUniversities({});
        const cities = [...new Set(unis.map(u => u.city).filter(Boolean))];
        return ['Всички', ...cities.sort()];
    },

    /**
     * Записва данни в localStorage кеш с времеви маркер.
     * @param {Array} data - Данните за кеширане
     */
    saveToCache(data) {
        const cacheEntry = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    },

    /**
     * Чете данни от кеша и проверява за изтичане на TTL (1 час).
     * @returns {Array|null} - Данните или null, ако кешът е празен/невалиден
     */
    getFromCache() {
        const json = localStorage.getItem(CACHE_KEY);
        if (!json) return null;

        try {
            const cacheEntry = JSON.parse(json);
            if (Date.now() - cacheEntry.timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return cacheEntry.data;
        } catch {
            return null;
        }
    }
};
