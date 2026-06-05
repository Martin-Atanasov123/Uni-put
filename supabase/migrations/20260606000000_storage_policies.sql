-- Storage RLS политики за bucket-ите avatars и reports-screenshots.
-- Без тях logged-in потребители получават 403 при качване на снимка
-- (което чупеше Profile аватар + Report screenshot upload).
--
-- Apply: `supabase db push` локално, или paste в Supabase SQL Editor.
--
-- Convention: всеки потребител пише в собствена папка с името на UUID-то си:
--   avatars/{user.id}/avatar.png
--   reports-screenshots/{user.id}/{timestamp}.png

-- ── 1. avatars bucket ────────────────────────────────────────────────────────

-- Read: всеки (публично, защото профилните снимки се показват в UI)
CREATE POLICY "avatars_read_public"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Insert: само logged-in user-и в собствената си папка
CREATE POLICY "avatars_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Update: само собственика на файла
CREATE POLICY "avatars_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Delete: само собственика
CREATE POLICY "avatars_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ── 2. reports-screenshots bucket ────────────────────────────────────────────

-- Read: само админи (или собственика — за preview в Report модала)
-- Опростено: разрешаваме на authenticated users да четат свои screenshots.
-- Admin-ите ги виждат през service_role в AdminReports.
CREATE POLICY "report_screenshots_read_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'reports-screenshots'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Insert: само logged-in user-и в собствена папка
CREATE POLICY "report_screenshots_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'reports-screenshots'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
