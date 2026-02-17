// Сервизен модул за работа с данни за университети и специалности.
// Цел: Осигурява клиентско кеширане, филтриране и удобни абстракции за четене на данни от Supabase.
// Подходящ за публичните секции (търсене, списъци, градове) и симулира сложни API заявки от бекенд.
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'universities_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

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
            return data.filter(uni => {
                const matchesQuery = !query || 
                    uni.university_name.toLowerCase().includes(query.toLowerCase()) || 
                    uni.specialty.toLowerCase().includes(query.toLowerCase());
                
                const matchesCity = city === 'Всички' || uni.city === city;
                
                return matchesQuery && matchesCity;
            });

        } catch (error) {
            console.error('Error fetching universities:', error);
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
