-- Календар за прием: таблица admission_events
-- Съхранява ключовите дати от кандидатстудентските кампании на университетите:
--   приемни изпити, срокове за кандидатстване, класирания и записвания.
--
-- Apply: paste в Supabase Dashboard → SQL Editor (или `supabase db push`).
-- Verify after: SELECT count(*) FROM admission_events;
--
-- Модел на данните:
--   event_type ∈ {exam, application, ranking, enrollment}
--   start_date  — задължителна (за еднодневно събитие end_date е NULL)
--   end_date    — NULL за еднодневни; попълва се за периоди (напр. записване 7–12 юли)
--   is_confirmed — true = потвърдено от официален източник; false = предстои/провери
--   source_url   — официалният източник (за проверка от потребителя)
--
-- university_name трябва да СЪВПАДА точно с universities.university_name,
-- за да се резолва слъгът и линкът към /universities/[slug] в UI слоя.

-- ── 1. Таблица ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admission_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    university_name text NOT NULL,
    city            text,
    event_type      text NOT NULL CHECK (event_type IN ('exam', 'application', 'ranking', 'enrollment')),
    title           text NOT NULL,
    description     text,
    start_date      date NOT NULL,
    end_date        date,
    is_confirmed    boolean NOT NULL DEFAULT true,
    source_url      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admission_events_start_date_idx  ON admission_events (start_date);
CREATE INDEX IF NOT EXISTS admission_events_university_idx  ON admission_events (university_name);
CREATE INDEX IF NOT EXISTS admission_events_type_idx        ON admission_events (event_type);

-- updated_at trigger — за да работи "Последна промяна в данните" в UI.
CREATE OR REPLACE FUNCTION set_admission_events_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admission_events_set_updated_at ON admission_events;
CREATE TRIGGER admission_events_set_updated_at
    BEFORE UPDATE ON admission_events
    FOR EACH ROW EXECUTE FUNCTION set_admission_events_updated_at();

-- ── 2. RLS ────────────────────────────────────────────────────────────────────
-- Публично четене (календарът е публичен), писане само за админи —
-- същият модел като reports / admin_audit_log.

ALTER TABLE admission_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admission_events_public_read" ON admission_events;
CREATE POLICY "admission_events_public_read"
    ON admission_events FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "admission_events_admin_write" ON admission_events;
CREATE POLICY "admission_events_admin_write"
    ON admission_events FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- ── 3. Seed — потвърдени дати от официалните сайтове (КСК 2026/2027) ──────────
-- Идемпотентно: изчистваме предишен seed за тези университети, за да не дублираме
-- при повторно пускане. (Ръчно добавените през админ панела остават, ако са за
-- други университети.)

DELETE FROM admission_events WHERE source_url LIKE 'https://%' AND university_name IN (
    'Софийски университет „Св. Климент Охридски"',
    'Технически университет – София',
    'Университет за национално и световно стопанство',
    'Пловдивски университет „Паисий Хилендарски"',
    'Медицински университет – София',
    'Медицински университет – Пловдив',
    'Медицински университет „Проф. д-р Параскев Стоянов" – Варна',
    'Икономически университет – Варна',
    'Великотърновски университет „Св. св. Кирил и Методий"'
);

INSERT INTO admission_events
    (university_name, city, event_type, title, description, start_date, end_date, is_confirmed, source_url)
VALUES
-- Софийски университет „Св. Климент Охридски"
('Софийски университет „Св. Климент Охридски"', 'София', 'exam', 'Кандидатстудентски изпити — I сесия', '18, 19 и 26 април 2026 г.', '2026-04-18', '2026-04-26', true, 'https://www.uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026'),
('Софийски университет „Св. Климент Охридски"', 'София', 'exam', 'Кандидатстудентски изпити — II сесия', '6, 7, 13, 14, 20 и 21 юни 2026 г.', '2026-06-06', '2026-06-21', true, 'https://www.uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026'),
('Софийски университет „Св. Климент Охридски"', 'София', 'application', 'Регистрация за класиране', 'Онлайн, такса за участие 25 €.', '2026-06-12', '2026-07-02', true, 'https://www.uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026'),
('Софийски университет „Св. Климент Охридски"', 'София', 'ranking', 'Първи етап на класиране', NULL, '2026-07-09', NULL, true, 'https://www.uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026'),
('Софийски университет „Св. Климент Охридски"', 'София', 'ranking', 'Втори (окончателен) етап на класиране', NULL, '2026-07-21', NULL, true, 'https://www.uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026'),

-- Технически университет – София
('Технически университет – София', 'София', 'application', 'Подаване на документи', NULL, '2026-06-22', '2026-07-05', true, 'https://priem.tu-sofia.bg/'),
('Технически университет – София', 'София', 'enrollment', 'Записване (I класиране)', 'По специалности във факултетите, 8:30–16:30 ч.', '2026-07-07', '2026-07-12', true, 'https://priem.tu-sofia.bg/'),

-- Университет за национално и световно стопанство (УНСС)
('Университет за национално и световно стопанство', 'София', 'application', 'Краен срок за подаване на документи (онлайн)', 'На място — до 27 юни 2026 г.', '2026-06-28', NULL, true, 'https://priem.unwe.bg/'),
('Университет за национално и световно стопанство', 'София', 'exam', 'Единен приемен изпит (ЕПИ)', NULL, '2026-07-01', '2026-07-03', true, 'https://priem.unwe.bg/'),
('Университет за национално и световно стопанство', 'София', 'enrollment', 'Записване (I класиране)', NULL, '2026-07-08', '2026-07-12', true, 'https://priem.unwe.bg/'),
('Университет за национално и световно стопанство', 'София', 'ranking', 'Второ класиране', NULL, '2026-07-14', NULL, true, 'https://priem.unwe.bg/'),
('Университет за национално и световно стопанство', 'София', 'enrollment', 'Записване (II класиране)', NULL, '2026-07-15', '2026-07-17', true, 'https://priem.unwe.bg/'),

-- Пловдивски университет „Паисий Хилендарски"
('Пловдивски университет „Паисий Хилендарски"', 'Пловдив', 'application', 'Подаване на документи', 'Онлайн — до 24 юни; на място — до 3 юли.', '2026-06-01', '2026-07-03', true, 'https://uni-plovdiv.bg/pages/index/1184/'),
('Пловдивски университет „Паисий Хилендарски"', 'Пловдив', 'exam', 'Редовни конкурсни изпити', 'По график на предметите (28 юни – 2 юли).', '2026-06-28', '2026-07-02', true, 'https://uni-plovdiv.bg/pages/index/1184/'),
('Пловдивски университет „Паисий Хилендарски"', 'Пловдив', 'enrollment', 'Записване (I класиране)', NULL, '2026-07-08', '2026-07-10', true, 'https://uni-plovdiv.bg/pages/index/1184/'),

-- Медицински университет – София
('Медицински университет – София', 'София', 'application', 'Прием на документи (онлайн)', NULL, '2026-06-10', '2026-06-24', true, 'https://mu-sofia.bg/priem/ksk/grafik/'),
('Медицински университет – София', 'София', 'exam', 'Конкурсен изпит по биология', NULL, '2026-06-27', NULL, true, 'https://mu-sofia.bg/priem/ksk/grafik/'),
('Медицински университет – София', 'София', 'exam', 'Конкурсен изпит по химия', NULL, '2026-06-28', NULL, true, 'https://mu-sofia.bg/priem/ksk/grafik/'),
('Медицински университет – София', 'София', 'ranking', 'Класиране', NULL, '2026-07-10', NULL, true, 'https://mu-sofia.bg/priem/ksk/grafik/'),

-- Медицински университет – Пловдив
('Медицински университет – Пловдив', 'Пловдив', 'application', 'Подаване на документи', NULL, '2026-06-01', '2026-06-26', true, 'https://mu-plovdiv.bg/priem/priem-v-spetsialnosti-s-obuchenie-na-bal/'),
('Медицински университет – Пловдив', 'Пловдив', 'exam', 'Изпити по биология и химия', '30 юни и 1 юли 2026 г.', '2026-06-30', '2026-07-01', true, 'https://mu-plovdiv.bg/priem/priem-v-spetsialnosti-s-obuchenie-na-bal/'),

-- Медицински университет „Проф. д-р Параскев Стоянов" – Варна
('Медицински университет „Проф. д-р Параскев Стоянов" – Варна', 'Варна', 'exam', 'Предварителни изпити (биология и химия)', NULL, '2026-04-18', NULL, true, 'https://www.mu-varna.bg/BG/Admission/pages/kandidatstudentski-priem.aspx'),
('Медицински университет „Проф. д-р Параскев Стоянов" – Варна', 'Варна', 'application', 'Подаване на документи за редовна сесия', NULL, '2026-06-15', '2026-06-29', true, 'https://www.mu-varna.bg/BG/Admission/pages/kandidatstudentski-priem.aspx'),
('Медицински университет „Проф. д-р Параскев Стоянов" – Варна', 'Варна', 'exam', 'Редовни изпити', NULL, '2026-07-02', NULL, true, 'https://www.mu-varna.bg/BG/Admission/pages/kandidatstudentski-priem.aspx'),

-- Икономически университет – Варна
('Икономически университет – Варна', 'Варна', 'exam', 'Приемен изпит по математика (I дата)', NULL, '2026-03-29', NULL, true, 'https://ue-varna.bg/bg/p/7746/priem/bakalavar'),
('Икономически университет – Варна', 'Варна', 'exam', 'Приемен изпит по математика (II дата)', NULL, '2026-04-26', NULL, true, 'https://ue-varna.bg/bg/p/7746/priem/bakalavar'),
('Икономически университет – Варна', 'Варна', 'exam', 'Приемен изпит по математика (III дата)', NULL, '2026-06-14', NULL, true, 'https://ue-varna.bg/bg/p/7746/priem/bakalavar'),

-- Великотърновски университет „Св. св. Кирил и Методий"
('Великотърновски университет „Св. св. Кирил и Методий"', 'Велико Търново', 'application', 'Заявления за конкурсен изпит', NULL, '2026-01-26', '2026-06-09', true, 'https://priemunivt.bg/'),
('Великотърновски университет „Св. св. Кирил и Методий"', 'Велико Търново', 'application', 'Документи за участие в класиране', NULL, '2026-06-16', '2026-07-01', true, 'https://priemunivt.bg/'),
('Великотърновски университет „Св. св. Кирил и Методий"', 'Велико Търново', 'enrollment', 'Попълване на свободни места — краен срок', NULL, '2026-09-30', NULL, true, 'https://priemunivt.bg/');

-- ── 4. Проверка ───────────────────────────────────────────────────────────────
-- SELECT university_name, count(*) FROM admission_events GROUP BY 1 ORDER BY 1;
