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

export const universityService = {
    
    /**
     * Търсене на университети със филтри
     * @param {{ query?: string, city?: string }} params - Параметри за търсене
     * @returns {Promise<Array<object>>} - Списък от съвпадащи записи
     * 
     * Логика:
     * 1) Проверява кеш (localStorage) и използва данните, ако са валидни.
     * 2) Ако няма валидни данни в кеша, чете от Supabase таблицата `university_admissions`.
     * 3) Прилага клиентски филтър: по текст (университет/специалност) и по град.
     * 
     * Edge случаи:
     * - При грешка от Supabase връща празен списък и логва грешката.
     * - Филтрирането е case-insensitive; ако city е „Всички“, град не се ограничава.
     */
    async searchUniversities({ query = '', city = 'Всички' }) {
        try {
            const normalizedQuery = normalize(query);
            const synonyms = SPECIALTY_SYNONYMS[normalizedQuery] || [normalizedQuery].filter(Boolean);

            // 1. Check Cache
            const cached = this.getFromCache();
            let data = cached;

            // 2. Fetch if not cached or expired
            if (!data) {
                const { data: fetchedData, error } = await supabase
                    .from('universities_duplicate')
                    .select('*');
                
                if (error) throw error;
                
                // Enhance data (removed rating and coords)
                data = fetchedData.map(uni => ({
                    ...uni
                }));

                this.saveToCache(data);
            }

            // 3. Прилагане на клиентски филтри
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

            // 4. Ако имаме текстово търсене, но резултатите са празни, опитай свеж fetch (fallback)
            if (normalizedQuery && filtered.length === 0) {
                const { data: fetchedData, error } = await supabase
                    .from('universities_duplicate')
                    .select('*');
                if (!error && fetchedData) {
                    const fresh = fetchedData.map(uni => ({ ...uni }));
                    this.saveToCache(fresh); // обнови кеша
                    filtered = fresh.filter(uni => {
                        const uName = normalize(uni.university_name);
                        const spec = normalize(uni.specialty);
                        const matchesQuery = !normalizedQuery || 
                            uName.includes(normalizedQuery) || 
                            spec.includes(normalizedQuery) ||
                            (synonyms.length > 0 && synonyms.some(s => spec.includes(s)));
                        const matchesCity = city === 'Всички' || uni.city === city;
                        return matchesQuery && matchesCity;
                    });
                }
            }

            return filtered;

        } catch (error) {
            console.error('Error fetching universities_duplicate:', error);
            return [];
        }
    },

    /**
     * Връща списък с уникални градове от набора данни
     * @returns {Promise<string[]>}
     */
    async getCities() {
        const unis = await this.searchUniversities({});
        const cities = [...new Set(unis.map(u => u.city).filter(Boolean))];
        return ['Всички', ...cities.sort()];
    },

    // --- Caching Mechanisms ---

    // Записване на данни в кеш (localStorage), заедно с времеви маркер.
    saveToCache(data) {
        const cacheEntry = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    },

    // Четене от кеш и проверка за изтичане (TTL = 1 час).
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
