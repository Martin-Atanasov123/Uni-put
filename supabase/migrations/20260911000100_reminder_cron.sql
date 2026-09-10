-- Дневен cron за deadline-reminders Edge Function.
--
-- ⚠️ НЕ Е ПРИЛОЖЕНА автоматично — иска секрети. Приложи РЪЧНО след като имейл
-- изпращането е готово:
--   1. supabase secrets set RESEND_API_KEY=re_xxx CRON_SECRET=<дълъг случаен низ>
--   2. В Supabase Vault добави: service_role_key = <service role key на проекта>
--      и cron_secret = <същия CRON_SECRET>
--   3. Пусни този файл в SQL Editor.
--
-- Какво прави: всеки ден в 07:00 UTC (10:00 EEST) POST-ва {"action":"send"} към
-- функцията. Тя праща confirm имейлите на новите записвания и напомнянията за
-- срокове до 7 / 1 дни. Идемпотентна е — повторно пускане същия ден не дублира.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Махаме предишен график със същото име (за преприлагане).
SELECT cron.unschedule('deadline-reminders-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'deadline-reminders-daily');

SELECT cron.schedule(
    'deadline-reminders-daily',
    '0 7 * * *',
    $$
    SELECT net.http_post(
        url     := 'https://vryaoxncvtnpsngkqteq.supabase.co/functions/v1/deadline-reminders',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
            'x-cron-key',    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body    := '{"action":"send"}'::jsonb
    );
    $$
);

-- Проверка: SELECT jobname, schedule, active FROM cron.job;
