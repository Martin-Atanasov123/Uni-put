-- Refresh legacy NBU labels against the official 2026 catalogue. Two biology
-- programs that are absent from the current catalogue are retained as history
-- instead of being deleted. The joint York programs do not publish one common
-- numeric score, so the old generic 1000-point formula must not be shown.
update public.universities
set
  academic_year = '2025/2026',
  source_url = 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&PageShow=listprograms&TabIndex=1&V_Year=2026&l=0',
  source_publisher = 'Нов български университет',
  verified_at = now()
where university_name = 'Нов български университет'
  and academic_year = '2026/2027'
  and specialty in ('Биология и обща медицина', 'Клинична биология и вирусология');

update public.universities
set
  specialty = case specialty
    when 'Режисура' then 'Кино и телевизия'
    when 'Кино и реклама' then 'Реклама'
    when 'Счетоводство и контрол' then 'Счетоводство и контролинг'
    when 'Начална училищна педагогика и чужд език' then 'Предучилищна и начална училищна педагогика'
    when 'Английски език и професионална комуникация' then 'Английски език и професионална комуникация (Съвместна програма с университета Йорк)'
    when 'Бизнес икономика (на английски език)' then 'Бизнес икономика (съвместна програма с университета в Йорк)'
  end,
  source_url = case specialty
    when 'Режисура' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=1829&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
    when 'Кино и реклама' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=1832&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
    when 'Счетоводство и контрол' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=2882&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
    when 'Начална училищна педагогика и чужд език' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=3384&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
    when 'Английски език и професионална комуникация' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=3238&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
    when 'Бизнес икономика (на английски език)' then 'https://ecatalog.nbu.bg/default.asp?Fac_ID=3&M_PHD=0&P_ID=3185&P_Menu=admission&PageShow=programpresent&TabIndex=1&V_Year=2026&l=0'
  end,
  source_publisher = 'Нов български университет',
  verified_at = now(),
  max_ball = case when specialty in (
    'Английски език и професионална комуникация',
    'Бизнес икономика (на английски език)'
  ) then null else max_ball end,
  formula_description = case when specialty in (
    'Английски език и професионална комуникация',
    'Бизнес икономика (на английски език)'
  ) then 'Отделен прием по условията на НБУ и University of York Europe Campus' else formula_description end,
  coefficients = case when specialty in (
    'Английски език и професионална комуникация',
    'Бизнес икономика (на английски език)'
  ) then '[]'::jsonb else coefficients end
where university_name = 'Нов български университет'
  and academic_year = '2026/2027'
  and specialty in (
    'Режисура',
    'Кино и реклама',
    'Счетоводство и контрол',
    'Начална училищна педагогика и чужд език',
    'Английски език и професионална комуникация',
    'Бизнес икономика (на английски език)'
  );
