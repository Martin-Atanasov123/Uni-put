-- Затягане на сигурността по Supabase Security Advisor (18.11.2026).
--
-- 1) Тригерни функции не трябва да се извикват като RPC (/rest/v1/rpc/...).
--    PostgreSQL не проверява EXECUTE при изпълнение на тригер, затова тригерите
--    продължават да работят нормално.
revoke execute on function public.log_admin_action()                from public, anon, authenticated;
revoke execute on function public.update_updated_at_column()        from public, anon, authenticated;
revoke execute on function public.set_admission_events_updated_at() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()                 from public, anon, authenticated;

-- 2) Фиксиран search_path — защита от подмяна на обекти чрез друга схема.
alter function public.set_admission_events_updated_at() set search_path = public, pg_temp;
alter function public.dzi_subject_label(text)           set search_path = public, pg_temp;

-- Остават публични НАРОЧНО (без вход): confirm_reminder, unsubscribe_reminder (линк от имейл
-- с UUID токен), record_calc_scores / forget_calc_scores / get_calc_percentiles (анонимна
-- статистика с токен на браузъра, без потребителски идентификатор), get_dzi_strategy и
-- get_dzi_for_specialty (публични данни за ДЗИ стратег).
