// Модул: calendarService
// Описание: Публично четене на admission_events (календар за прием) от Supabase.
//   Връща събитията подредени по начална дата. Писането се прави през админ панела
//   (adminService + RLS: само админи), затова тук има само read-пътища.
// Експорти: getAdmissionEvents
// Бележки: Грешките се логват и връщат [] — страницата показва empty state вместо
//   да чупи (същият модел като getAllDormitories).

import { supabase } from '@/lib/supabase';

// Slim колони — не дърпаме created_at/updated_at освен updated_at (за "последна промяна").
const EVENT_COLS =
    'id,university_name,city,event_type,title,description,start_date,end_date,is_confirmed,source_url,updated_at';

export const calendarService = {
    /**
     * Всички събития от календара, подредени по начална дата (възходящо).
     * @param {{throwOnError?: boolean}} [opts] при true хвърля грешката (за UI със състояние за грешка)
     * @returns {Promise<Array>} масив от събития (или [] при грешка, ако throwOnError е false)
     */
    async getAdmissionEvents({ throwOnError = false } = {}) {
        const { data, error } = await supabase
            .from('admission_events')
            .select(EVENT_COLS)
            .order('start_date', { ascending: true })
            .limit(2000);

        if (error) {
            // Не поглъщай мълчаливо — ако таблицата липсва (миграцията не е пусната)
            // или колоните се разминат, искаме следа в конзолата, не безмълвно [].
            console.error('[getAdmissionEvents] Supabase error:', error.message);
            if (throwOnError) throw error;
            return [];
        }
        return data || [];
    },
};
