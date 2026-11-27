-- Обобщение на каталога по факултет — за /universities.
-- Преди страницата теглеше всички програми (≈1300 реда) само за да преброи
-- специалности, университети и градове по направления в браузъра. Сега
-- PostgreSQL връща по един ред на факултет (≈115 реда) с готовите бройки.
--
-- security_invoker: изгледът се чете с правата на потребителя, т.е. важат
-- RLS политиките на public.universities (публично четене е разрешено).

create or replace view public.catalog_faculty_summary
with (security_invoker = true) as
with per_specialty as (
    select academic_year, faculty, specialty, count(*)::int as programs
    from public.universities
    where specialty is not null
    group by academic_year, faculty, specialty
)
select
    u.academic_year,
    u.faculty,
    count(*)::int as programs,
    coalesce(array_agg(distinct u.university_name) filter (where u.university_name is not null), '{}') as universities,
    coalesce(array_agg(distinct u.city) filter (where u.city is not null), '{}') as cities,
    coalesce((
        select jsonb_object_agg(s.specialty, s.programs)
        from per_specialty s
        where s.academic_year = u.academic_year
          and s.faculty is not distinct from u.faculty
    ), '{}'::jsonb) as specialty_counts
from public.universities u
group by u.academic_year, u.faculty;

comment on view public.catalog_faculty_summary is
    'Брой програми, университети, градове и специалности по факултет и учебна година (за каталога /universities).';

grant select on public.catalog_faculty_summary to anon, authenticated;
