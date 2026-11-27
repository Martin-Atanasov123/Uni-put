-- Normalize Bulgarian closing quotation marks in university names.
update public.universities
set university_name = replace(university_name, '"', '”')
where university_name like '%"%';

-- Preserve one copy of the duplicated 2025 minimum score for Plovdiv University Marketing.
delete from public.admission_min_scores
where id = 184
  and university_id = '9ba15b84-f6ea-44b0-bb74-7692bdedcc3c';

-- Remove only byte-for-byte equivalent 2026/2027 program rows.
delete from public.universities
where id in (
  '4744cd10-b47d-4e98-9192-8c9bd668091b',
  '585d81dc-9714-40cf-a7f3-62626396f78d',
  '74601024-bc27-41be-962a-6e7e2ffeceae',
  '74ff150d-2a05-4596-8be5-fae490cf1919',
  'a243204a-d9ef-47e1-9e4a-88f2d3b32528',
  '9ba15b84-f6ea-44b0-bb74-7692bdedcc3c'
);

-- Attach verified 2026/2027 official admission sources.
update public.universities
set source_url = case
    when university_name ilike 'Аграрен университет%' then 'https://www.au-plovdiv.bg/docs/ksk/2026/Pravilnik-2026-2027.pdf'
    when university_name ilike 'Академия за музикално%' then 'https://www.artacademyplovdiv.com/priem/KSS-AMTII.pdf'
    when university_name ilike 'Академия по национална%' then 'https://www.anis.bg/admissions/bachelor-programs/'
    when university_name ilike 'Американски университет%' then 'https://www.aubg.edu/admissions/bachelors/how-to-apply/?region=bulgaria'
    when university_name ilike 'Бургаски държавен университет%' then 'https://btu.bg/images/Priem/2026/pravilnik_za_priem_bak_profbak_2026_2.pdf'
    when university_name ilike 'Великотърновски университет%' then 'https://www.uni-vt.bg/res/22136/%D1%80%D0%B5%D0%B4._%D0%A0%D0%95%D0%A8%D0%95%D0%9D%D0%98%D0%AF-%D0%90%D0%A1-13-17.11.2025_website.pdf'
    when university_name ilike 'Икономически университет%' then 'https://ue-varna.bg/bg/p/8455/uslovia-za-kandidatstvane'
    when university_name ilike 'Нов български университет%' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&PageShow=listprograms&TabIndex=1&V_Year=2026&l=0'
    when university_name ilike 'Пловдивски университет%' then 'https://accessibility.uni-plovdiv.bg/pages/index/2264/'
    when university_name ilike 'Русенски университет%' then 'https://www.uni-ruse.bg/admission/bachelors/guide/regulations/formation-of-competitive-score'
    when university_name ilike 'Софийски университет%' then 'https://uni-sofia.bg/index.php/bul/priem/priem_za_obrazovatelno_kvalifikacionna_stepen_bakalav_r_i_magist_r_sled_sredno_obrazovanie/kandidatstudentska_kampaniya_2026/baloobrazuvane'
    when university_name ilike 'Технически университет – София%' then 'https://priem.tu-sofia.bg/documents/AC_KSK_Pravilnik_2026_12012026_v2.pdf'
    when university_name ilike 'Тракийски университет%' then 'https://trakia-uni.bg/wp-content/uploads/2026/05/SPRAV_2026-2027_OK.pdf'
    when university_name ilike 'Университет за национално%' then 'https://priem.unwe.bg/bg/pages/19476/%D0%B1%D0%B0%D0%BB%D0%BE%D0%BE%D0%B1%D1%80%D0%B0%D0%B7%D1%83%D0%B2%D0%B0%D0%BD%D0%B5.html'
    when university_name ilike 'Шуменски университет%' then 'https://www.shu.bg/admission/spravochniczi-za-kandidat-studenti/'
    when university_name ilike 'Югозападен университет%' then 'https://swu.bg/images/documents/regular/Spravochnik_26-27__WEB_new.pdf'
  end,
  source_publisher = university_name,
  retrieved_at = coalesce(retrieved_at, now()),
  verified_at = now()
where academic_year = '2026/2027'
  and (
    university_name ilike 'Аграрен университет%'
    or university_name ilike 'Академия за музикално%'
    or university_name ilike 'Академия по национална%'
    or university_name ilike 'Американски университет%'
    or university_name ilike 'Бургаски държавен университет%'
    or university_name ilike 'Великотърновски университет%'
    or university_name ilike 'Икономически университет%'
    or university_name ilike 'Нов български университет%'
    or university_name ilike 'Пловдивски университет%'
    or university_name ilike 'Русенски университет%'
    or university_name ilike 'Софийски университет%'
    or university_name ilike 'Технически университет – София%'
    or university_name ilike 'Тракийски университет%'
    or university_name ilike 'Университет за национално%'
    or university_name ilike 'Шуменски университет%'
    or university_name ilike 'Югозападен университет%'
  );
