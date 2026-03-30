-- PED_SIMPLE
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ) + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Социална педагогика$$, $$Предучилищна педагогика и педагогика на ранното детство$$, $$Предучилищна и начална училищна педагогика$$, $$Начална училищна педагогика и специална педагогика$$, $$Начална училищна педагогика и чужд (английски) език$$, $$Предучилищна педагогика и чужд (английски) език$$, $$Предучилищна педагогика и логопедия$$, $$Педагогика на обучението по български език и чужд език$$);

-- FILOL_SIMPLE
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ) + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Българска филология$$, $$Приложна лингвистика. Български и английски език с информационни технологии$$, $$Журналистика$$, $$Връзки с обществеността$$);

-- CHU_SLAV
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Чужд)/ДЗИ(БЕЛ/Чужд) + Диплома×2 или ДЗИ*(Чужд)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "exam_ispanski", "coef": 1}, {"key": "exam_nemski", "coef": 1}, {"key": "exam_frenski", "coef": 1}, {"key": "exam_ruski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_chu_ezik", "coef": 1}, {"key": "dzi_profil_chu", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Балканистика$$, $$Руска филология$$, $$Славянски езици и култури$$);

-- ANG
UPDATE universities
SET formula_description = $$Изпит(Англ)/ДЗИ(Англ) + Диплома×2 или ДЗИ*(Англ)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_angliiski", "coef": 1}, {"key": "dzi_angliiski", "coef": 1}, {"key": "dzi_profil_angliiski", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Английска филология$$, $$Приложна лингвистика с два чужди езика (английски и втори чужд език), преводачески профил$$, $$Приложна лингвистика с два чужди езика (английски и втори чужд език) с бизнес комуникации$$, $$Приложна лингвистика с два чужди езика (английски и втори чужд език) с международен туризъм$$, $$Приложна лингвистика с два чужди езика (английски и втори чужд език) с международни отношения$$, $$Приложна лингвистика. Английски и втори чужд език с информационни технологии$$);

-- IST
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/История) + Диплома×2 или ДЗИ*(История)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_profil_ist", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$История$$, $$Археология$$, $$Педагогика на обучението по български език и история$$, $$Педагогика на обучението по история и чужд език$$);

-- BEL_IT
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ) + Диплома×2 или ДЗИ*(Инф/ИТ)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_profil_inf", "coef": 2.4}, {"key": "dzi_profil_it", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Педагогика на обучението по български език и информационни технологии$$);

-- GEOGR
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/Геогр) + Диплома×2 или ДЗИ*(Геогр)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_geografiya", "coef": 1}, {"key": "dzi_profil_geografiya", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Педагогика на обучението по български език и география$$, $$География$$, $$Регионално развитие и геоикономика$$);

-- ETNOL
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/История/Геогр) + Диплома×2 или ДЗИ*(История/Геогр)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_geografiya", "coef": 1}, {"key": "dzi_profil_ist", "coef": 2.4}, {"key": "dzi_profil_geografiya", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Етнология$$, $$Културен туризъм$$, $$Педагогика на обучението по история и география$$);

-- IST_IT
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/История) + Диплома×2 или ДЗИ*(История/Инф/ИТ)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_profil_ist", "coef": 2.4}, {"key": "dzi_profil_inf", "coef": 2.4}, {"key": "dzi_profil_it", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Педагогика на обучението по история и информационни технологии$$);

-- GEOGR_IT
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/Геогр) + Диплома×2 или ДЗИ*(Геогр/Инф/ИТ)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_geografiya", "coef": 1}, {"key": "dzi_profil_geografiya", "coef": 2.4}, {"key": "dzi_profil_inf", "coef": 2.4}, {"key": "dzi_profil_it", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Педагогика на обучението по география и информационни технологии$$);

-- PSIH
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/История) + Диплома×2 или ДЗИ*(История/Чужд)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_profil_ist", "coef": 2.4}, {"key": "dzi_profil_chu", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Психология$$);

-- FILOS
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/Философия) + Диплома×2 или ДЗИ*(Философия)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_filosofiya", "coef": 1}, {"key": "dzi_profil_filosofiya", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Философия$$, $$Национална сигурност$$);

-- POLIT
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/Философия/История/Чужд) + Диплома×2 или ДЗИ*(Философия/История/Чужд)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_filosofiya", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_chu_ezik", "coef": 1}, {"key": "dzi_profil_filosofiya", "coef": 2.4}, {"key": "dzi_profil_ist", "coef": 2.4}, {"key": "dzi_profil_chu", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Политология$$, $$Дипломация и международни отношения$$);

-- ECON
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/Мат) + Диплома×2 или ДЗИ*(Мат/Геогр/Предпр)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_mat", "coef": 1}, {"key": "dzi_profil_mat", "coef": 2.4}, {"key": "dzi_profil_geografiya", "coef": 2.4}, {"key": "dzi_profil_predp", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Публична администрация$$, $$Стопанско управление$$, $$Финанси$$, $$Маркетинг$$, $$Международни икономически отношения$$, $$Счетоводство и контрол$$);

-- SOCIAL
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ) + Диплома×2 или ДЗИ*(Геогр/Предпр)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_profil_geografiya", "coef": 2.4}, {"key": "dzi_profil_predp", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Социални дейности$$, $$Предприемачество в социалната сфера$$, $$Туризъм$$, $$Туризъм и дигитализация$$);

-- IST_FILOS
UPDATE universities
SET formula_description = $$Изпит(БЕЛ/История/Англ)/ДЗИ(БЕЛ/История/Философия) + Диплома×2 или ДЗИ*(История/Философия)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_bel", "coef": 1}, {"key": "exam_ist", "coef": 1}, {"key": "exam_angliiski", "coef": 1}, {"key": "dzi_bel", "coef": 1}, {"key": "dzi_ist", "coef": 1}, {"key": "dzi_filosofiya", "coef": 1}, {"key": "dzi_profil_ist", "coef": 2.4}, {"key": "dzi_profil_filosofiya", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Педагогика на обучението по история и философия$$);

-- NEMSKI
UPDATE universities
SET formula_description = $$Изпит(Нем)/ДЗИ(Нем) + Диплома×2 или ДЗИ*(Нем)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_nemski", "coef": 1}, {"key": "dzi_nemski", "coef": 1}, {"key": "dzi_profil_nemski", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Германистика (немски език и култура)$$, $$Приложна лингвистика с два чужди езика (немски и втори чужд език), преводачески профил$$, $$Приложна лингвистика с два чужди езика (немски и втори чужд език) с бизнес комуникации$$, $$Приложна лингвистика с два чужди езика (немски и втори чужд език) с международен туризъм$$, $$Приложна лингвистика с два чужди езика (немски и втори чужд език) с международни отношения$$);

-- FRENSKI
UPDATE universities
SET formula_description = $$Изпит(Фр)/ДЗИ(Фр) + Диплома×2 или ДЗИ*(Фр)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_frenski", "coef": 1}, {"key": "dzi_frenski", "coef": 1}, {"key": "dzi_profil_frenski", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Романистика (френски език и култура)$$, $$Приложна лингвистика с два чужди езика (френски и втори чужд език), преводачески профил$$, $$Приложна лингвистика с два чужди езика (френски и втори чужд език) с бизнес комуникации$$, $$Приложна лингвистика с два чужди езика (френски и втори чужд език) с международен туризъм$$, $$Приложна лингвистика с два чужди езика (френски и втори чужд език) с международни отношения$$);

-- ISPANSKI
UPDATE universities
SET formula_description = $$Изпит(Исп)/ДЗИ(Исп) + Диплома×2 или ДЗИ*(Исп)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_ispanski", "coef": 1}, {"key": "dzi_ispanski", "coef": 1}, {"key": "dzi_profil_ispanski", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Приложна лингвистика с два чужди езика (испански и втори чужд език), преводачески профил$$, $$Приложна лингвистика с два чужди езика (испански и втори чужд език) с бизнес комуникации$$, $$Приложна лингвистика с два чужди езика (испански и втори чужд език) с международен туризъм$$, $$Приложна лингвистика с два чужди езика (испански и втори чужд език) с международни отношения$$);

-- RUSKI
UPDATE universities
SET formula_description = $$Изпит(Рус)/ДЗИ(Рус) + Диплома×2 или ДЗИ*(Рус)×2.4 + Диплома×2$$,
    coefficients = $$[{"alternatives": [{"key": "exam_ruski", "coef": 1}, {"key": "dzi_ruski", "coef": 1}, {"key": "dzi_profil_ruski", "coef": 2.4}]}, {"alternatives": [{"key": "diploma", "coef": 2}]}]$$::jsonb
WHERE university_name = $$Великотърновски университет "Св. св. Кирил и Методий"$$
  AND specialty IN ($$Приложна лингвистика с два чужди езика (руски и втори чужд език), преводачески профил$$, $$Приложна лингвистика с два чужди езика (руски и втори чужд език) с бизнес комуникации$$, $$Приложна лингвистика с два чужди езика (руски и втори чужд език) с международен туризъм$$, $$Приложна лингвистика с два чужди езика (руски и втори чужд език) с международни отношения$$);