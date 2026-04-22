import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'universities_cache_v2';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const SEARCH_LIMIT_REFRESH_MS = 1000 * 60 * 10; // 10 minutes

const SLIM_COLS = 'id,university_name,specialty,faculty,city,education_level,max_ball';

const SPECIALTY_SYNONYMS = {
    "право": ["право", "юридически науки", "правни науки", "law"]
};

const normalize = (s) => (s || "").toLowerCase().trim();

export const universityService = {

    async searchUniversities({ query = '', city = 'Всички' }) {
        try {
            const normalizedQuery = normalize(query);
            const synonyms = SPECIALTY_SYNONYMS[normalizedQuery] || [normalizedQuery].filter(Boolean);

            // 1. Check cache
            const cached = this.getFromCache();
            let data = cached;

            // 2. Fetch if not cached; silently refresh in background if cache is getting stale
            if (!data) {
                const { data: fetchedData, error } = await supabase
                    .from('universities')
                    .select(SLIM_COLS);
                if (error) throw error;
                data = fetchedData;
                this.saveToCache(data);
            } else if (Date.now() - this.getCacheTimestamp() > SEARCH_LIMIT_REFRESH_MS) {
                this.refreshCacheInBackground();
            }

            // 3. Apply client-side filters
            return data.filter(uni => {
                const uName = normalize(uni.university_name);
                const spec = normalize(uni.specialty);
                const matchesQuery = !normalizedQuery ||
                    uName.includes(normalizedQuery) ||
                    spec.includes(normalizedQuery) ||
                    (synonyms.length > 0 && synonyms.some(s => spec.includes(s)));
                const matchesCity = city === 'Всички' || uni.city === city;
                return matchesQuery && matchesCity;
            });

        } catch {
            return [];
        }
    },

    async getCities() {
        const unis = await this.searchUniversities({});
        const cities = [...new Set(unis.map(u => u.city).filter(Boolean))];
        return ['Всички', ...cities.sort()];
    },

    async refreshCacheInBackground() {
        try {
            const { data, error } = await supabase
                .from('universities')
                .select(SLIM_COLS);
            if (!error && data) this.saveToCache(data);
        } catch {}
    },

    saveToCache(data) {
        const cacheEntry = { timestamp: Date.now(), data };
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }
    },

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
    },

    getCacheTimestamp() {
        const json = localStorage.getItem(CACHE_KEY);
        if (!json) return 0;
        try {
            return JSON.parse(json).timestamp || 0;
        } catch {
            return 0;
        }
    },
};
