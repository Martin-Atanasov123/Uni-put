-- Прием след VII клас (гимназии): паралелки с балообразуване + минимални/максимални
-- балове по етапи на класиране. Източник: справките на РУО (Excel), една кампания = един ред
-- на паралелка. Импорт: scripts/import-gymnasia-sofia.py → SQL на партиди.

create table if not exists public.gymnasium_classes (
    id              uuid primary key default gen_random_uuid(),
    campaign_year   integer not null,                 -- 2026 = прием за учебната 2026/2027
    region          text    not null default 'София-град',
    school_code     text,                             -- код на училището от справката на РУО (стабилен между години)
    school_name     text    not null,
    district        text,                             -- РАЙОН (до 2025 г. в списъка)
    class_code      text    not null,                 -- код на паралелката без водещи нули
    class_name      text    not null,
    kind            text,                             -- профилирана / професионална
    formula_raw     text    not null,                 -- както е в списъка на РУО
    coefficients    jsonb   not null,                 -- слотове [{alternatives:[{key,coef}]}] — както в universities
    alt_formulas    jsonb,                            -- алтернативни пътища („… или …“), масив от слотови масиви
    nvo_bel_coef    numeric,
    nvo_mat_coef    numeric,
    ability_exam    text,                             -- ИИ / Муз. / СПО / ФВС, когато участва вместо част от НВО
    diploma_subjects text[],                          -- съкращения от свидетелството, напр. {М,ИТ}
    places          integer,
    places_m        integer,
    places_f        integer,
    quota           boolean not null default false,  -- прием по квоти (мъже/жени)
    study_form      text,
    first_language  text,
    language_mode   text,                             -- интензивно / разширено
    source_url      text,
    checked_at      date,
    created_at      timestamptz not null default now(),
    unique (campaign_year, region, class_code)
);

create table if not exists public.gymnasium_rankings (
    id              bigserial primary key,
    campaign_year   integer  not null,
    region          text     not null default 'София-град',
    class_code      text     not null,
    stage           smallint not null check (stage between 1 and 4),
    school_code     text,
    class_name      text,                             -- както е в справката (fallback за свързване между години)
    min_total       numeric,                          -- 0/NULL = няма класирани на този етап
    min_m           numeric,
    min_f           numeric,
    max_total       numeric,
    max_m           numeric,
    max_f           numeric,
    published_on    date,
    source_url      text,
    unique (campaign_year, region, class_code, stage)
);

create index if not exists gymnasium_classes_year_school_idx on public.gymnasium_classes (campaign_year, school_code);
create index if not exists gymnasium_rankings_year_code_idx  on public.gymnasium_rankings (campaign_year, class_code);
create index if not exists gymnasium_rankings_school_idx     on public.gymnasium_rankings (school_code, campaign_year);

alter table public.gymnasium_classes  enable row level security;
alter table public.gymnasium_rankings enable row level security;

drop policy if exists "gymnasium_classes public read"  on public.gymnasium_classes;
drop policy if exists "gymnasium_classes admin write"  on public.gymnasium_classes;
drop policy if exists "gymnasium_rankings public read" on public.gymnasium_rankings;
drop policy if exists "gymnasium_rankings admin write" on public.gymnasium_rankings;

create policy "gymnasium_classes public read"  on public.gymnasium_classes  for select using (true);
create policy "gymnasium_rankings public read" on public.gymnasium_rankings for select using (true);
create policy "gymnasium_classes admin write"  on public.gymnasium_classes  for all
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "gymnasium_rankings admin write" on public.gymnasium_rankings for all
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

comment on table public.gymnasium_classes  is 'Прием след VII клас: паралелки по кампания с балообразуване (РУО).';
comment on table public.gymnasium_rankings is 'Прием след VII клас: мин./макс. бал по паралелка и етап на класиране (РУО).';
