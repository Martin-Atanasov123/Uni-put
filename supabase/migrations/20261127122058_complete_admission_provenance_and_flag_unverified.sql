-- Sources verified against current 2026/2027 official admission material.
update public.universities
set source_url = case
    when university_name ilike 'Минно-геоложки университет%' then 'https://mgu.bg/wp-content/uploads/2026/03/%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0-%D0%B7%D0%B0-%D0%BF%D1%80%D0%B8%D0%B5%D0%BC-%D0%9E%D0%9A%D0%A1-%D0%91%D0%B0%D0%BA%D0%B0%D0%BB%D0%B0%D0%B2%D1%8A%D1%80-2026-2027.pdf'
    when university_name ilike 'Международно висше бизнес училище%' then 'https://ibsedu.bg/obrazovanie/kandidatstvane-v-bakalavarski-prog/'
    when university_name ilike 'Технически университет – Варна%' then 'https://fs.tu-varna.bg/%D0%BF%D1%80%D0%B8%D0%B5%D0%BC-%D0%BD%D0%B0-%D0%BA%D0%B0%D0%BD%D0%B4%D0%B8%D0%B4%D0%B0%D1%82%D0%B8-%D0%BE%D1%82-%D0%B5%D1%81-%D0%B8-%D0%B5%D0%B8%D0%BF-%D0%B7%D0%B0-%D0%BE%D0%BA%D1%81-%D0%B1/'
    when university_name ilike 'Висше строително училище%' then 'https://priem.vsu.bg/'
    when university_name ilike 'Химикотехнологичен и металургичен университет%' then 'https://mmu2.uctm.edu/uctm/umo/priem/Spravochnik_26-27.pdf'
    when university_name ilike 'Висше военновъздушно училище%' then 'https://www.af-acad.bg/Documents/admission/cadets/2026/'
    when university_name ilike 'Колеж по туризъм%' then 'https://cotur.bg/%D1%83%D1%87%D0%B5%D0%B1%D0%BD%D0%B0-%D0%B4%D0%B5%D0%B9%D0%BD%D0%BE%D1%81%D1%82/%D0%BF%D1%80%D0%B8%D0%B5%D0%BC-2022-2023-%D0%B3/'
    when university_name ilike 'Военна академия%' then 'https://rndc.bg/priem-bakalavri/'
    when university_name ilike 'Театрален колеж%' then 'https://www.lgroys-college.com/new/assets/files/Pravilnik-priem.pdf'
  end,
  source_publisher = university_name,
  retrieved_at = coalesce(retrieved_at, now()),
  verified_at = now()
where academic_year='2026/2027'
and (
 university_name ilike 'Минно-геоложки университет%'
 or university_name ilike 'Международно висше бизнес училище%'
 or university_name ilike 'Технически университет – Варна%'
 or university_name ilike 'Висше строително училище%'
 or university_name ilike 'Химикотехнологичен и металургичен университет%'
 or university_name ilike 'Висше военновъздушно училище%'
 or university_name ilike 'Колеж по туризъм%'
 or university_name ilike 'Военна академия%'
 or university_name ilike 'Театрален колеж%'
);

-- Official provenance is available, but no current formula document was public.
-- Keep verified_at null so the UI and audits do not overstate certainty.
update public.universities
set source_url = case
    when university_name ilike 'Висше училище по телекомуникации%' then 'https://www.utp.bg/wp-content/uploads/2019/03/pravila-za-priem-profesionalen-bakalavur.pdf'
    when university_name ilike 'Университет по застраховане%' then 'https://vuzf.bg/priem'
    when university_name ilike 'Колеж по мениджмънт%' then 'https://mtmcollege.org/en/admissions/'
    when university_name ilike 'Европейски политехнически университет%' then 'https://epubg.eu/bulgaria/public/uploads/------.pdf'
  end,
  source_publisher = university_name,
  retrieved_at = coalesce(retrieved_at, now()),
  verified_at = null
where academic_year='2026/2027'
and (
 university_name ilike 'Висше училище по телекомуникации%'
 or university_name ilike 'Университет по застраховане%'
 or university_name ilike 'Колеж по мениджмънт%'
 or university_name ilike 'Европейски политехнически университет%'
);

update public.universities
set website_url = 'https://epubg.eu/bulgaria',
    accreditation_status = 'under_review'
where academic_year='2026/2027'
  and university_name ilike 'Европейски политехнически университет%';
