-- Уникални стойности на колона от universities за дадена академична година.
--
-- Защо: PostgREST връща най-много 1000 реда на заявка. Преди клиентът теглеше
-- цялата колона и махаше дубликатите в браузъра — при 1299 реда това отрязваше
-- резултата (липсваха 10 от 114 факултета, град Шумен, 8 от 51 университета).
-- DISTINCT на сървъра връща само уникалните стойности (десетки, не хиляди).
--
-- security invoker: важат същите RLS политики като при директно четене.
create or replace function public.universities_distinct(p_column text, p_year text)
returns setof text
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_column not in ('faculty', 'city', 'university_name', 'specialty') then
    raise exception 'Невалидна колона: %', p_column;
  end if;
  return query execute format(
    'select distinct %1$I::text from public.universities where academic_year = $1 and %1$I is not null order by 1',
    p_column
  ) using p_year;
end;
$$;

grant execute on function public.universities_distinct(text, text) to anon, authenticated;
