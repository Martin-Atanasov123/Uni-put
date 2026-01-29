import { supabase } from '../lib/supabase';

const CACHE_KEY = 'universities_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Service for handling university data operations with caching and filtering.
 * Simulates a robust backend API service.
 */
export const universityService = {
    
    /**
     * Search for universities with filters.
     * @param {Object} params - Search parameters
     * @param {string} params.query - Search text (name or specialty)
     * @param {string} params.city - City filter
     * @returns {Promise<Array>} - List of matching universities
     */
    async searchUniversities({ query = '', city = 'Всички' }) {
        try {
            // 1. Check Cache
            const cached = this.getFromCache();
            let data = cached;

            // 2. Fetch if not cached or expired
            if (!data) {
                const { data: fetchedData, error } = await supabase
                    .from('university_admissions')
                    .select('*');
                
                if (error) throw error;
                
                // Enhance data (removed rating and coords)
                data = fetchedData.map(uni => ({
                    ...uni
                }));

                this.saveToCache(data);
            }

            // 3. Apply Filters (Client-side filtering to simulate complex API query)
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
     * Get unique cities from the dataset
     */
    async getCities() {
        const unis = await this.searchUniversities({});
        const cities = [...new Set(unis.map(u => u.city).filter(Boolean))];
        return ['Всички', ...cities.sort()];
    },

    // --- Caching Mechanisms ---

    saveToCache(data) {
        const cacheEntry = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
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
    }
};
