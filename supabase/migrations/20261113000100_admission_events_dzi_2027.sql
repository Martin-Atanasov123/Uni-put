-- Национални дати за ДЗИ 2027 в календара (и в имейл напомнянията).
-- Източник: Заповед № РД09-3343/31.08.2026 г. на министъра на образованието и науката
-- https://www.mon.bg/nfs/2026/08/grafik-dzi-2026-2027-27082026-31082026.pdf
-- „university_name“ е с префикс „МОН —“ — календарът по него разпознава, че не е университет
-- (без линк към /universities/…). Идемпотентно: не вкарва повторно същото събитие.

insert into public.admission_events (university_name, city, event_type, title, description, start_date, end_date, is_confirmed, source_url)
select v.university_name, null, v.event_type, v.title, v.description, v.start_date::date, v.end_date::date, true,
       'https://www.mon.bg/nfs/2026/08/grafik-dzi-2026-2027-27082026-31082026.pdf'
from (values
    ('МОН — държавни зрелостни изпити', 'application', 'Заявления за допускане до ДЗИ',
     'Подаваш заявлението в своето училище. Без него не можеш да се явиш на матурите през май.',
     '2027-02-04', '2027-02-19'),
    ('МОН — държавни зрелостни изпити', 'exam', 'ДЗИ по български език и литература',
     'Задължителен ДЗИ, начало 08:30 ч. Резултатите от майската сесия се обявяват до 10 юни 2027 г.',
     '2027-05-19', null),
    ('МОН — държавни зрелостни изпити', 'exam', 'Втори задължителен ДЗИ',
     'Профилиращ предмет по избор или ЗДИППК (теория на професията), начало 08:30 ч.',
     '2027-05-21', null),
    ('МОН — държавни зрелостни изпити', 'exam', 'Допълнителни ДЗИ по желание',
     'Явяваш се, ако университетът, който искаш, приема бал от друг предмет.',
     '2027-05-26', '2027-06-02')
) as v(university_name, event_type, title, description, start_date, end_date)
where not exists (
    select 1 from public.admission_events e
    where e.university_name = v.university_name and e.title = v.title and e.start_date = v.start_date::date
);
