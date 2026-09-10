// Модул: reminderService
// Описание: Клиентски слой за имейл напомнянията за срокове за кандидатстване.
//   Записването минава през Edge Function `deadline-reminders` (service role —
//   таблицата `reminder_subscriptions` няма публично писане). Потвърждаване и
//   отписване са security-definer RPC-та по неотгатваем uuid токен.
// Експорти: subscribe, confirm, unsubscribe
// Бележки: Без RESEND_API_KEY на функцията всичко се записва, но имейли не се
//   пращат — subscribe връща { emailPending: true }. UI слоят го комуникира.

import { supabase } from '@/lib/supabase';

export const reminderService = {
    /**
     * Записва имейл за напомняния. universityName = null → всички университети.
     * @returns {Promise<{ ok: boolean, emailPending?: boolean, alreadyConfirmed?: boolean, error?: string }>}
     */
    async subscribe({ email, universityName = null, userId = null }) {
        const clean = String(email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
            return { ok: false, error: 'invalid_email' };
        }
        const { data, error } = await supabase.functions.invoke('deadline-reminders', {
            body: {
                action: 'subscribe',
                email: clean,
                university_name: universityName || undefined,
                user_id: userId || undefined,
            },
        });
        if (error) {
            console.error('[reminderService.subscribe]', error.message);
            return { ok: false, error: 'network' };
        }
        return data;
    },

    /** Потвърждава записване по confirm_token. Връща имейла или null. */
    async confirm(token) {
        const { data, error } = await supabase.rpc('confirm_reminder', { p_token: token });
        if (error) {
            console.error('[reminderService.confirm]', error.message);
            return null;
        }
        return data; // email string | null
    },

    /** Отписва по unsubscribe_token. Идемпотентно. Връща true при промяна. */
    async unsubscribe(token) {
        const { data, error } = await supabase.rpc('unsubscribe_reminder', { p_token: token });
        if (error) {
            console.error('[reminderService.unsubscribe]', error.message);
            return false;
        }
        return !!data;
    },
};
