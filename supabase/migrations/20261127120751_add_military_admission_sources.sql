update public.universities
set
  source_url = 'https://www.mvr.bg/academy/прием/учебна-дейност/окс-бакалавър/baloobr_2021',
  source_publisher = 'Академия на Министерството на вътрешните работи',
  verified_at = now()
where academic_year = '2026/2027'
  and university_name ilike 'Академия на Министерството%';

update public.universities
set
  source_url = 'https://www.nvu.bg/bg/priem-kursanti/baloobrazuvane-i-klasirane',
  source_publisher = 'Национален военен университет „Васил Левски“',
  verified_at = now()
where academic_year = '2026/2027'
  and university_name ilike 'Национален военен университет%';

update public.universities
set
  source_url = 'https://www.naval-acad.bg/application',
  source_publisher = 'Висше военноморско училище „Н. Й. Вапцаров“',
  verified_at = now()
where academic_year = '2026/2027'
  and university_name ilike 'Висше военноморско училище%';
