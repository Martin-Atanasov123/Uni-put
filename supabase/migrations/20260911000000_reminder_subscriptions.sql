-- Email напомняния за срокове за кандидатстване.
-- CLAUDE.md §12/§18: единствената retention механика, която работи за 12. клас —
-- „До края на кандидатстването в ПУ остават 5 дни" 7 дни преди края.
--
-- GDPR за непълнолетни (аудиторията е 11.–12. клас): минимум данни (само имейл),
-- double opt-in (confirmed_at), unsubscribe с един клик, източник + дата на всеки ред.
--
-- Всички записи/потвърждения минават през Edge Function `deadline-reminders`
-- (service role). Затова таблицата е заключена: публично четене НЯМА, публично
-- писане НЯМА. Логнат потребител вижда само своите записвания.
--
-- Apply: Supabase Dashboard → SQL Editor, или `supabase db push`.
-- Verify: SELECT count(*) FROM reminder_subscriptions;

CREATE TABLE IF NOT EXISTS reminder_subscriptions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email              text NOT NULL,
    university_name    text,                     -- NULL = всички университети
    user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    confirmed_at       timestamptz,              -- NULL до потвърждение по имейл
    unsubscribed_at    timestamptz,
    confirm_token      uuid NOT NULL DEFAULT gen_random_uuid(),
    unsubscribe_token  uuid NOT NULL DEFAULT gen_random_uuid(),
    confirm_sent_at    timestamptz,              -- кога е пратен confirm имейл (rate-limit)
    last_notified_at   timestamptz,              -- кога последно е пратено напомняне
    notified_event_ids uuid[] NOT NULL DEFAULT '{}',  -- за кои събития вече е известено (dedup)
    CONSTRAINT reminder_email_format CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- Едно активно записване на (имейл × университет). NULL university_name е
-- отделен ключ през coalesce. Отписаните редове не блокират ново записване.
CREATE UNIQUE INDEX IF NOT EXISTS reminder_sub_unique
    ON reminder_subscriptions (lower(email), coalesce(university_name, ''))
    WHERE unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS reminder_sub_confirmed_idx
    ON reminder_subscriptions (confirmed_at)
    WHERE unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS reminder_sub_pending_idx
    ON reminder_subscriptions (created_at)
    WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE reminder_subscriptions ENABLE ROW LEVEL SECURITY;

-- Логнат потребител вижда САМО своите записвания (за екран „моите напомняния").
DROP POLICY IF EXISTS "reminder_sub_owner_read" ON reminder_subscriptions;
CREATE POLICY "reminder_sub_owner_read"
    ON reminder_subscriptions FOR SELECT
    USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Админ — пълен достъп (преглед, чистене).
DROP POLICY IF EXISTS "reminder_sub_admin_all" ON reminder_subscriptions;
CREATE POLICY "reminder_sub_admin_all"
    ON reminder_subscriptions FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Публично писане НЯМА policy → блокирано. Записване минава през Edge Function
-- (service role bypass-ва RLS).

-- ── Токен-flow-ове (public, но само по неотгатваем uuid токен) ───────────────

-- Потвърждаване по confirm_token. Връща имейла при успех, NULL иначе.
CREATE OR REPLACE FUNCTION confirm_reminder(p_token uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
    UPDATE reminder_subscriptions
       SET confirmed_at = now()
     WHERE confirm_token = p_token
       AND confirmed_at IS NULL
       AND unsubscribed_at IS NULL
    RETURNING email INTO v_email;
    RETURN v_email;
END $$;

-- Отписване по unsubscribe_token. Идемпотентно.
CREATE OR REPLACE FUNCTION unsubscribe_reminder(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_found boolean;
BEGIN
    UPDATE reminder_subscriptions
       SET unsubscribed_at = now()
     WHERE unsubscribe_token = p_token
       AND unsubscribed_at IS NULL
    RETURNING true INTO v_found;
    RETURN COALESCE(v_found, false);
END $$;

REVOKE ALL ON FUNCTION confirm_reminder(uuid) FROM public;
REVOKE ALL ON FUNCTION unsubscribe_reminder(uuid) FROM public;
GRANT EXECUTE ON FUNCTION confirm_reminder(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_reminder(uuid) TO anon, authenticated;
