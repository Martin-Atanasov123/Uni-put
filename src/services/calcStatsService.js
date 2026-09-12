// Модул: calcStatsService
// Описание: Анонимна статистика на баловете (таблица calc_score_samples и
//   RPC-тата record_calc_scores / get_calc_percentiles / forget_calc_scores).
//   Не праща user_id — само случаен токен на браузъра. Под 20 браузъра за
//   програма сървърът не връща нищо, затова UI-ят просто мълчи.
// Експорти: calcStatsService

import { supabase } from '@/lib/supabase';

const TOKEN_KEY = 'uniput_stats_token';
const OPTOUT_KEY = 'uniput_stats_optout';

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage недостъпен */ } };
const remove = (key) => { try { localStorage.removeItem(key); } catch { /* storage недостъпен */ } };

const isOptedOut = () => read(OPTOUT_KEY) === '1';

const getToken = ({ create = false } = {}) => {
    if (isOptedOut()) return null;
    let token = read(TOKEN_KEY);
    if (!token && create && typeof crypto?.randomUUID === 'function') {
        token = crypto.randomUUID();
        write(TOKEN_KEY, token);
    }
    return token;
};

export const calcStatsService = {
    isOptedOut,

    /** @param {{program_id: string, score: number}[]} items */
    async record(items) {
        const token = getToken({ create: true });
        if (!token || !items.length) return;
        const { error } = await supabase.rpc('record_calc_scores', { p_token: token, p_items: items });
        if (error) console.error('[calcStatsService.record]', error.message);
    },

    /** @returns {Promise<Record<string, {n: number, pctBelow: number}>>} само програми с ≥20 браузъра */
    async percentiles(items) {
        if (!items.length) return {};
        const { data, error } = await supabase.rpc('get_calc_percentiles', { p_token: getToken(), p_items: items });
        if (error) {
            console.error('[calcStatsService.percentiles]', error.message);
            return {};
        }
        return Object.fromEntries((data || []).map((r) => [r.program_id, { n: r.n, pctBelow: r.pct_below }]));
    },

    /** Отказ трие вече записаните балове на браузъра и спира новите. */
    async setOptOut(optOut) {
        if (!optOut) {
            remove(OPTOUT_KEY);
            return;
        }
        const token = read(TOKEN_KEY);
        write(OPTOUT_KEY, '1');
        remove(TOKEN_KEY);
        if (token) {
            const { error } = await supabase.rpc('forget_calc_scores', { p_token: token });
            if (error) console.error('[calcStatsService.setOptOut]', error.message);
        }
    },
};
