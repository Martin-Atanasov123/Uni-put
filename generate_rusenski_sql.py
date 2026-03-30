#!/usr/bin/env python3
"""Generate SQL INSERT for Русенски университет specialties."""
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

UNI = 'Русенски университет "Ангел Кънчев"'
CITY = 'Русе'

# ── Coefficient templates (slot-based array format) ──

# TYPE 1: О1(Ист/БЕЛ)×2 + Диплома(БЕЛ)×2
T1 = [
    {"alternatives": [{"key":"exam_ist","coef":2},{"key":"exam_bel","coef":2},{"key":"dzi_ist","coef":2},{"key":"dzi_bel","coef":2}]},
    {"alternatives": [{"key":"bel","coef":2}]}
]

# TYPE 2: О1(Англ/БЕЛ)×2 + Диплома(БЕЛ) + Диплома(Чужд език)
T2 = [
    {"alternatives": [{"key":"exam_angliiski","coef":2},{"key":"exam_bel","coef":2},{"key":"dzi_angliiski","coef":2},{"key":"dzi_bel","coef":2}]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"chu_ezik","coef":1}]}
]

# TYPE 3: О1(БЕЛ/Инф/Мат/ОТП/ДЗИ/ДИППК)×2 + Диплома(БЕЛ) + Диплома(Мат)
T3 = [
    {"alternatives": [
        {"key":"exam_bel","coef":2},{"key":"exam_informatika","coef":2},{"key":"exam_mat","coef":2},
        {"key":"obsht_tehnicheski_test","coef":2},
        {"key":"dzi_bel","coef":2},{"key":"dzi_informatika","coef":2},{"key":"dzi_mat","coef":2},
        {"key":"dzi_it","coef":2},{"key":"profesionalna_kvalifikaciq","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 4: О1(Ист/Био/БЕЛ)×2 + Диплома(БЕЛ)×2
T4 = [
    {"alternatives": [
        {"key":"exam_ist","coef":2},{"key":"exam_bio","coef":2},{"key":"exam_bel","coef":2},
        {"key":"dzi_ist","coef":2},{"key":"dzi_bio","coef":2},{"key":"dzi_bel","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":2}]}
]

# TYPE 5: ДЗИ(БЕЛ)×2 + Изпит(Ист)×2 + Диплома(БЕЛ)  (Право)
T5 = [
    {"alternatives": [{"key":"dzi_bel","coef":2}]},
    {"alternatives": [{"key":"exam_ist","coef":2}]},
    {"alternatives": [{"key":"bel","coef":1}]}
]

# TYPE 6: О1(широк)×3 + Диплома(БЕЛ) + Диплома(Мат)  (макс бал 30)
T6 = [
    {"alternatives": [
        {"key":"exam_bel","coef":3},{"key":"exam_angliiski","coef":3},{"key":"exam_ist","coef":3},
        {"key":"exam_geo","coef":3},{"key":"exam_informatika","coef":3},{"key":"exam_mat","coef":3},
        {"key":"obsht_tehnicheski_test","coef":3},
        {"key":"dzi_bel","coef":3},{"key":"dzi_angliiski","coef":3},{"key":"dzi_ist","coef":3},
        {"key":"dzi_geo","coef":3},{"key":"dzi_informatika","coef":3},{"key":"dzi_mat","coef":3},
        {"key":"dzi_it","coef":3},{"key":"profesionalna_kvalifikaciq","coef":3}
    ]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 7: О1(широк)×2 + Диплома(БЕЛ) + Диплома(Мат)  (макс бал 24)
T7 = [
    {"alternatives": [
        {"key":"exam_bel","coef":2},{"key":"exam_angliiski","coef":2},{"key":"exam_ist","coef":2},
        {"key":"exam_geo","coef":2},{"key":"exam_informatika","coef":2},{"key":"exam_mat","coef":2},
        {"key":"obsht_tehnicheski_test","coef":2},
        {"key":"dzi_bel","coef":2},{"key":"dzi_angliiski","coef":2},{"key":"dzi_ist","coef":2},
        {"key":"dzi_geo","coef":2},{"key":"dzi_informatika","coef":2},{"key":"dzi_mat","coef":2},
        {"key":"dzi_it","coef":2},{"key":"profesionalna_kvalifikaciq","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 8: О1(Мат/Инф)×2 + Диплома(БЕЛ) + Диплома(Мат)
T8 = [
    {"alternatives": [
        {"key":"exam_mat","coef":2},{"key":"exam_informatika","coef":2},
        {"key":"dzi_mat","coef":2},{"key":"dzi_informatika","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 9: О1(Био/Хим/техн)×2 + Диплома(БЕЛ)×2
T9 = [
    {"alternatives": [
        {"key":"exam_bel","coef":2},{"key":"exam_bio","coef":2},{"key":"exam_him","coef":2},
        {"key":"exam_informatika","coef":2},{"key":"exam_mat","coef":2},
        {"key":"obsht_tehnicheski_test","coef":2},
        {"key":"dzi_bel","coef":2},{"key":"dzi_bio","coef":2},{"key":"dzi_him","coef":2},
        {"key":"dzi_informatika","coef":2},{"key":"dzi_mat","coef":2},
        {"key":"dzi_it","coef":2},{"key":"profesionalna_kvalifikaciq","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":2}]}
]

# TYPE 10: Рисуване + Моделиране + Диплома(БЕЛ) + Диплома(Мат)  (Дизайн)
T10 = [
    {"alternatives": [{"key":"exam_ris","coef":1}]},
    {"alternatives": [{"key":"konkursen_izpit_2","coef":1}]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 11: О1(Био/Хим/техн)×2 + Диплома(БЕЛ) + Диплома(Мат)
T11 = [
    {"alternatives": [
        {"key":"exam_bel","coef":2},{"key":"exam_bio","coef":2},{"key":"exam_him","coef":2},
        {"key":"exam_informatika","coef":2},{"key":"exam_mat","coef":2},
        {"key":"obsht_tehnicheski_test","coef":2},
        {"key":"dzi_bel","coef":2},{"key":"dzi_bio","coef":2},{"key":"dzi_him","coef":2},
        {"key":"dzi_informatika","coef":2},{"key":"dzi_mat","coef":2},
        {"key":"dzi_it","coef":2},{"key":"profesionalna_kvalifikaciq","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"mat","coef":1}]}
]

# TYPE 13: О1(широк)×2 + Диплома(БЕЛ)×2
T13 = [
    {"alternatives": [
        {"key":"exam_bel","coef":2},{"key":"exam_angliiski","coef":2},{"key":"exam_ist","coef":2},
        {"key":"exam_geo","coef":2},{"key":"exam_informatika","coef":2},{"key":"exam_mat","coef":2},
        {"key":"obsht_tehnicheski_test","coef":2},
        {"key":"dzi_bel","coef":2},{"key":"dzi_angliiski","coef":2},{"key":"dzi_ist","coef":2},
        {"key":"dzi_geo","coef":2},{"key":"dzi_informatika","coef":2},{"key":"dzi_mat","coef":2},
        {"key":"dzi_it","coef":2},{"key":"profesionalna_kvalifikaciq","coef":2}
    ]},
    {"alternatives": [{"key":"bel","coef":2}]}
]

# TYPE 14: Кинезитерапия — Изпит(Био)×2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био) + Диплома(Физ.възп.)
T14 = [
    {"alternatives": [{"key":"exam_bio","coef":2}]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"bio","coef":1},{"key":"exam_bio","coef":1}]},
    {"alternatives": [{"key":"fiz_vazpitanie","coef":1}]}
]

# TYPE 15: Ерготерапия — Изпит(Био)/ДЗИ(Био)×2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био) + Диплома(Чужд)
T15 = [
    {"alternatives": [{"key":"exam_bio","coef":2},{"key":"dzi_bio","coef":2}]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"bio","coef":1},{"key":"exam_bio","coef":1}]},
    {"alternatives": [{"key":"chu_ezik","coef":1}]}
]

# TYPE 16: Медицински — Изпит(Био)×2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био)
T16 = [
    {"alternatives": [{"key":"exam_bio","coef":2}]},
    {"alternatives": [{"key":"bel","coef":1}]},
    {"alternatives": [{"key":"bio","coef":1},{"key":"exam_bio","coef":1}]}
]

# ── Formula descriptions ──
FD1 = "Изпит(Ист/БЕЛ)/ДЗИ(Ист/БЕЛ)x2 + Диплома(БЕЛ)x2"
FD2 = "Изпит(Англ/БЕЛ)/ДЗИ(Англ/БЕЛ)x2 + Диплома(БЕЛ) + Диплома(Чужд език)"
FD3 = "Изпит(БЕЛ/Инф/Мат/ОТП)/ДЗИ/ДИППКx2 + Диплома(БЕЛ) + Диплома(Мат)"
FD4 = "Изпит(Ист/Био/БЕЛ)/ДЗИ(Ист/Био/БЕЛ)x2 + Диплома(БЕЛ)x2"
FD5 = "ДЗИ(БЕЛ)x2 + Изпит(Ист)x2 + Диплома(БЕЛ)"
FD6 = "Изпит/ДЗИ(БЕЛ/Англ/Ист/Геогр/Инф/Мат/ОТП)/ДИППКx3 + Диплома(БЕЛ) + Диплома(Мат)"
FD7 = "Изпит/ДЗИ(БЕЛ/Англ/Ист/Геогр/Инф/Мат/ОТП)/ДИППКx2 + Диплома(БЕЛ) + Диплома(Мат)"
FD8 = "Изпит(Мат/Инф)/ДЗИ(Мат/Инф)x2 + Диплома(БЕЛ) + Диплома(Мат)"
FD9 = "Изпит(БЕЛ/Био/Хим/Инф/Мат/ОТП)/ДЗИ/ДИППКx2 + Диплома(БЕЛ)x2"
FD10 = "Изпит(Рисуване) + Изпит(Моделиране) + Диплома(БЕЛ) + Диплома(Мат)"
FD11 = "Изпит(БЕЛ/Био/Хим/Инф/Мат/ОТП)/ДЗИ/ДИППКx2 + Диплома(БЕЛ) + Диплома(Мат)"
FD13 = "Изпит/ДЗИ(БЕЛ/Англ/Ист/Геогр/Инф/Мат/ОТП)/ДИППКx2 + Диплома(БЕЛ)x2"
FD14 = "Изпит(Био)x2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био) + Диплома(Физ.възп.)"
FD15 = "Изпит(Био)/ДЗИ(Био)x2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био) + Диплома(Чужд език)"
FD16 = "Изпит(Био)x2 + Диплома(БЕЛ) + Диплома(Био)/Изпит(Био)"

# ── All 46 specialties ──
# (faculty, specialty, education_level, max_ball, coefficients, formula_description)
specialties = [
    # 1-2: Педагогика — TYPE 1
    ("Педагогика", "Предучилищна и начална училищна педагогика", "Бакалавър", 24, T1, FD1),
    ("Педагогика", "Социална педагогика", "Бакалавър", 24, T1, FD1),
    # 3-4: TYPE 2 (английски/БЕЛ + чужд език от диплома)
    ("Педагогика", "Начална училищна педагогика и чужд език", "Бакалавър", 24, T2, FD2),
    ("Педагогика на обучението", "Педагогика на обучението по български език и чужд език", "Бакалавър", 24, T2, FD2),
    # 5: TYPE 1
    ("Педагогика на обучението", "Български език и история", "Бакалавър", 24, T1, FD1),
    # 6-7: TYPE 3 (техническа)
    ("Педагогика на обучението", "Педагогика на обучението по математика и информатика", "Бакалавър", 24, T3, FD3),
    ("Педагогика на обучението", "Педагогика на обучението по физика и информатика", "Бакалавър", 24, T3, FD3),
    # 8: TYPE 4 (история/биология/БЕЛ)
    ("Социални дейности", "Социални дейности", "Бакалавър", 24, T4, FD4),
    # 9: TYPE 5 (Право)
    ("Право", "Право", "Магистър", 30, T5, FD5),
    # 10: TYPE 6 (широк ×3, бал 30)
    ("Администрация и управление", "Бизнес мениджмънт", "Бакалавър", 30, T6, FD6),
    # 11-12: TYPE 7 (широк ×2, бал 24)
    ("Администрация и управление", "Публична администрация", "Бакалавър", 24, T7, FD7),
    ("Администрация и управление", "Дигитален мениджмънт и иновации", "Бакалавър", 24, T7, FD7),
    # 13: TYPE 6 (×3, бал 30)
    ("Икономика", "Икономика", "Бакалавър", 30, T6, FD6),
    # 14: TYPE 8 (Мат/Инф)
    ("Математика", "Финансова математика", "Бакалавър", 24, T8, FD8),
    # 15-16: TYPE 3
    ("Информатика и компютърни науки", "Компютърни науки", "Бакалавър", 24, T3, FD3),
    ("Информатика и компютърни науки", "Софтуерно инженерство", "Бакалавър", 24, T3, FD3),
    # 17-20: Машинно инженерство — TYPE 3
    ("Машинно инженерство", "Земеделска техника и технологии", "Бакалавър", 24, T3, FD3),
    ("Машинно инженерство", "Мениджмънт и сервиз на техниката", "Бакалавър", 24, T3, FD3),
    ("Машинно инженерство", "Климатизация, хидравлика и газификация", "Бакалавър", 24, T3, FD3),
    ("Машинно инженерство", "Машинно инженерство", "Бакалавър", 24, T3, FD3),
    # 21-24: Електротехника — TYPE 3
    ("Електротехника, електроника и автоматика", "Електроенергетика и електрообзавеждане", "Бакалавър", 24, T3, FD3),
    ("Електротехника, електроника и автоматика", "Компютърно управление и автоматизация", "Бакалавър", 24, T3, FD3),
    ("Електротехника, електроника и автоматика", "Електроника", "Бакалавър", 24, T3, FD3),
    ("Електротехника, електроника и автоматика", "Електроинженерство", "Бакалавър", 24, T3, FD3),
    # 25-26: Комуникационна техника — TYPE 3
    ("Комуникационна и компютърна техника", "Компютърни системи и технологии", "Бакалавър", 24, T3, FD3),
    ("Комуникационна и компютърна техника", "Интернет и мобилни комуникации", "Бакалавър", 24, T3, FD3),
    # 27-29: Транспорт — TYPE 3
    ("Транспорт, корабоплаване и авиация", "Автомобилно инженерство", "Бакалавър", 24, T3, FD3),
    ("Транспорт, корабоплаване и авиация", "Транспортна техника и технологии", "Бакалавър", 24, T3, FD3),
    ("Транспорт, корабоплаване и авиация", "Технология и управление на транспорта", "Бакалавър", 24, T3, FD3),
    # 30: Материалознание — TYPE 3
    ("Материали и материалознание", "Материалознание и технологии", "Бакалавър", 24, T3, FD3),
    # 31: Архитектура — TYPE 3
    ("Архитектура, строителство и геодезия", "Строително инженерство", "Бакалавър", 24, T3, FD3),
    # 32-34: Хим/Био/Хран технологии — TYPE 9
    ("Химични технологии", "Химични технологии", "Бакалавър", 24, T9, FD9),
    ("Биотехнологии", "Биотехнологии", "Бакалавър", 24, T9, FD9),
    ("Хранителни технологии", "Технология на храните", "Бакалавър", 24, T9, FD9),
    # 35: Дизайн — TYPE 10
    ("Общо инженерство", "Дизайн", "Бакалавър", 24, T10, FD10),
    # 36: Аграрно инженерство — TYPE 11
    ("Общо инженерство", "Аграрно инженерство", "Бакалавър", 24, T11, FD11),
    # 37: Екология — TYPE 9 (same as chem/bio)
    ("Общо инженерство", "Екология и техника за опазване на околната среда", "Бакалавър", 24, T9, FD9),
    # 38: Индустриално инженерство — TYPE 3
    ("Общо инженерство", "Индустриално инженерство", "Бакалавър", 24, T3, FD3),
    # 39: Индустриален мениджмънт — TYPE 7 (широк ×2)
    ("Общо инженерство", "Индустриален мениджмънт", "Бакалавър", 24, T7, FD7),
    # 40: Растениевъдство — TYPE 13 (широк ×2 + БЕЛ×2)
    ("Растениевъдство", "Растениевъдство", "Бакалавър", 24, T13, FD13),
    # 41: Кинезитерапия — TYPE 14
    ("Обществено здраве", "Кинезитерапия", "Бакалавър", 30, T14, FD14),
    # 42: Ерготерапия — TYPE 15
    ("Обществено здраве", "Ерготерапия", "Бакалавър", 30, T15, FD15),
    # 43-45: Здравни грижи — TYPE 16
    ("Здравни грижи", "Медицинска сестра", "Бакалавър", 24, T16, FD16),
    ("Здравни грижи", "Акушерка", "Бакалавър", 24, T16, FD16),
    ("Здравни грижи", "Лекарски асистент", "Бакалавър", 24, T16, FD16),
    # 46: Национална сигурност — TYPE 13
    ("Национална сигурност", "Противодействие на престъпността и опазване на обществения ред", "Бакалавър", 24, T13, FD13),
]

# ── Generate SQL ──
uni_e = UNI.replace("'", "''")
city_e = CITY.replace("'", "''")

rows_sql = []
for fac, spec, edu, mb, coefs, fd in specialties:
    fac_e = fac.replace("'", "''")
    spec_e = spec.replace("'", "''")
    fd_e = fd.replace("'", "''")
    coef_json = json.dumps(coefs, ensure_ascii=False)
    rows_sql.append(
        f"  ('{uni_e}', '{city_e}', '{fac_e}', '{spec_e}', '{edu}', {mb}, '{fd_e}', '{coef_json}'::jsonb)"
    )

sql = "INSERT INTO universities (university_name, city, faculty, specialty, education_level, max_ball, formula_description, coefficients)\nVALUES\n"
sql += ",\n".join(rows_sql)
sql += ";"

print(sql)
print(f"-- Total: {len(specialties)} specialties", file=sys.stderr)
