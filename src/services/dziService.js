// Модул: dziService
// Описание: ДЗИ Стратег — кой втори държавен зрелостен изпит отваря най-много
//   специалности. Данните се смятат на живо от public.universities през RPC
//   функции (public.get_dzi_strategy / get_dzi_for_specialty) — винаги актуални,
//   нула външни източници.
// Експорти: getDziStrategy, getDziForSpecialty

import { supabase } from '@/lib/supabase';
import { ADMISSION_YEAR } from '@/lib/siteStats';

// Ранкирането се мени само при промяна на коефициентите в базата → кешираме за 24h.
const STRATEGY_CACHE_KEY = 'uniput_dzi_strategy_v1';
const STRATEGY_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h
const SPECIALTIES_CACHE_KEY = 'uniput_specialty_names_v1';
const SPECIALTIES_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

export const dziService = {
    /**
     * Ранкиране на ДЗИ предметите по брой специалности, в които участват.
     * @returns {Promise<Array<{subject:string, specialties:number, samples:string[]}>>}
     */
    async getDziStrategy() {
        // Опит за кеш (издържа на липсващ/счупен localStorage).
        try {
            const cached = localStorage.getItem(STRATEGY_CACHE_KEY);
            if (cached) {
                const { ts, data } = JSON.parse(cached);
                if (Date.now() - ts < STRATEGY_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch {
            // счупен кеш — игнорираме, ще се презапише
        }

        const { data, error } = await supabase.rpc('get_dzi_strategy');
        if (error) throw error;
        const rows = data || [];

        try {
            localStorage.setItem(STRATEGY_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }));
        } catch {
            // localStorage недостъпен/пълен — не е фатално
        }
        return rows;
    },

    /**
     * Кои ДЗИ предмети участват в балообразуването на конкретна специалност.
     * @param {string} specialty
     * @returns {Promise<string[]>} - имена на предмети
     */
    async getDziForSpecialty(specialty) {
        const clean = (specialty || '').trim().slice(0, 120);
        if (!clean) return [];
        const { data, error } = await supabase.rpc('get_dzi_for_specialty', { p_specialty: clean });
        if (error) throw error;
        return (data || []).map(r => r.subject).filter(Boolean);
    },

    /**
     * Сортиран списък с уникални имена на специалности (за autocomplete).
     * @returns {Promise<string[]>}
     */
    async getSpecialtyNames() {
        try {
            const cached = localStorage.getItem(SPECIALTIES_CACHE_KEY);
            if (cached) {
                const { ts, data } = JSON.parse(cached);
                if (Date.now() - ts < SPECIALTIES_CACHE_TTL && Array.isArray(data) && data.length) {
                    return data;
                }
            }
        } catch {
            // счупен кеш — игнорираме
        }

        const { data, error } = await supabase.from('universities')
            .select('specialty').eq('academic_year', ADMISSION_YEAR).limit(3000);
        if (error) throw error;
        const names = [...new Set((data || []).map(r => r.specialty).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'bg'));

        try {
            localStorage.setItem(SPECIALTIES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: names }));
        } catch {
            // localStorage недостъпен/пълен
        }
        return names;
    },
};
