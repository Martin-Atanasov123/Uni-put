-- RLS Policies for УниПът
-- Apply via: supabase db push  (or paste in Supabase Dashboard → SQL Editor)
-- Verify after: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ── 1. Enable RLS on every table ──────────────────────────────────────────────

ALTER TABLE universities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_riasec_mapping  ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers_riasec_mapping    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log           ENABLE ROW LEVEL SECURITY;

-- ── 2. Public read-only tables (no auth needed) ───────────────────────────────
-- universities

CREATE POLICY "universities_public_read"
    ON universities FOR SELECT
    USING (true);

-- faculties

CREATE POLICY "faculties_public_read"
    ON faculties FOR SELECT
    USING (true);

-- specialty_riasec_mapping

CREATE POLICY "specialty_riasec_public_read"
    ON specialty_riasec_mapping FOR SELECT
    USING (true);

-- careers_riasec_mapping

CREATE POLICY "careers_riasec_public_read"
    ON careers_riasec_mapping FOR SELECT
    USING (true);

-- dormitories

CREATE POLICY "dormitories_public_read"
    ON dormitories FOR SELECT
    USING (true);

-- ── 3. saved_favorites — own rows only ───────────────────────────────────────

CREATE POLICY "favorites_select_own"
    ON saved_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
    ON saved_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_update_own"
    ON saved_favorites FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
    ON saved_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- ── 4. reports — anyone can INSERT, only admins can SELECT/UPDATE ─────────────
-- Students submit error reports anonymously; admins triage them.

CREATE POLICY "reports_insert_anon"
    ON reports FOR INSERT
    WITH CHECK (true);

CREATE POLICY "reports_select_admin"
    ON reports FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "reports_update_admin"
    ON reports FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- ── 5. admin_audit_log — admins only ─────────────────────────────────────────

CREATE POLICY "audit_log_admin_all"
    ON admin_audit_log FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- ── 6. Verification query ─────────────────────────────────────────────────────
-- Run this after applying — every row must show rowsecurity = true:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
