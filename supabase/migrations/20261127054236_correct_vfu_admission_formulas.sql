-- Align the 2026/2027 VFU rows with the university's current published rule:
-- 2 × the recognized competitive grade + the diploma average + optional
-- one-point bonus. The previous import doubled the diploma average and
-- therefore advertised a maximum of 25 instead of 19 for these programs.
update public.universities
set
  max_ball = 19,
  formula_description = '(Кандидатстудентски изпит × 2) + Общ успех + Бонификация',
  coefficients = jsonb_set(coefficients::jsonb, '{1,alternatives,0,coef}', '1'::jsonb, false)
where university_name = 'Варненски свободен университет „Черноризец Храбър"'
  and academic_year = '2026/2027'
  and specialty = any (array[
    'Администрация и управление',
    'Бизнес администрация и мениджмънт',
    'Защита на националната сигурност',
    'Икономика',
    'Информатика и компютърни науки',
    'Международен бизнес (на английски език)',
    'Международни икономически отношения',
    'Противодействие на престъпността и опазване на обществения ред',
    'Психология',
    'Публична администрация и мениджмънт',
    'Финанси и счетоводство'
  ]);
