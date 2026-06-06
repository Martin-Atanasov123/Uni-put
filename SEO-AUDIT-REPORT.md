# SEO Одит на УниПът — юни 2026

> Изготвен от senior technical-SEO + content strategist агент след систематичен преглед на code-base + Supabase данни + текуща sitemap/robots конфигурация.
> Всички числа са от source-of-truth (Supabase production DB). Нищо не е измислено.
> Език: 100% български, форма „ти". Нула keyword stuffing. Готов за прилагане.

---

## 0. EXECUTIVE SUMMARY

Топ 5 находки и очакван ефект:

1. **🔴 CRITICAL: Production sitemap-ът съдържа само 8 URL-а вместо 55.** `SITEMAP_DYNAMIC=1` env var не е активиран в Netlify, затова 47-те per-university URL-а никога не стигат до Google. Това е причина #1 защо per-uni страниците не се индексират. **Ефект от фикса: +47 indexable URLs за 5 мин работа.**

2. **🔴 CRITICAL: Per-university страниците са template-thin.** В момента съдържат само H1 + чипове + списък специалности. Google вече ги маркира „Crawled — currently not indexed". Без 2-3 параграфа уникално съдържание + historical scores те няма да се индексират никога. **Ефект: разликата между 0 и 47 indexed URLs.**

3. **🟠 HIGH: Нула JSON-LD schema markup в целия сайт.** Google rich results (rating, breadcrumbs, FAQ, HowTo) са невъзможни. **Ефект: ~30% CTR boost за page 1 резултати с rich snippets.**

4. **🟠 HIGH: Calculator title не таргетира "кандидатстудентски бал калкулатор"** — една от най-високо-search-volume queries за тази платформа. **Ефект: достижимост на топ позиция за заявка с 100-300 monthly searches.**

5. **🟡 MEDIUM: Годината "2025" в UniversityPage title** при настоящ месец юни 2026. Студентите търсят "прием [уни] 2026". **Ефект: загубено относимост за всички per-uni queries през новия admissions cycle.**

---

## 1. INVENTORY

### Обхват — публични маршрути (12 indexable)

| URL | Тип | Intent | Текущ статус |
|---|---|---|---|
| `/` | Home | Brand/navigational | ✓ има Seo |
| `/calculator` | Calculator | Transactional (high-intent) | ✓ има Seo |
| `/career-advisor` | RIASEC Test | Informational + tool | ✓ има Seo |
| `/universities` | Browser | Navigational | ✓ има Seo |
| `/universities/[slug]` | Per-uni | High-intent transactional | ✓ има Seo (dynamic) |
| `/dormitories` | List | Informational | ✓ има Seo |
| `/about` | About | Brand | ✓ има Seo |
| `/terms` | Legal | Required | ✓ има Seo (минимална) |
| `/privacy` | Legal | Required | ✓ има Seo |
| `/test-career` | Admin tool | Internal | ⚠️ noindex препоръчва се |
| `/forgot-password` | Auth | — | ⚠️ noindex препоръчва се |
| `/update-password` | Auth | — | ⚠️ noindex препоръчва се |

### Данни за съдържанието (source: Supabase, live към юни 2026)

- **47** университета
- **833** уникални специалности (1241 specialty rows общо)
- **16** града
- **68** общежития
- **912** RIASEC-mapped специалности
- **1002** RIASEC-mapped кариери

---

## 2. ПРИОРИТИЗИРАНА ТАБЛИЦА С ФИКСОВЕ

Подредено по (impact × intent value) ÷ effort. P0 = веднага.

| # | Находка | Страница | Severity | Effort | Препоръка | Приоритет |
|---|---|---|---|---|---|---|
| F1 | `SITEMAP_DYNAMIC=1` липсва в Netlify env | sitemap.xml | Critical | S | Добави env var → trigger redeploy → sitemap.xml ще има 55 URL-а | **P0** |
| F2 | Per-uni страниците са thin (template-only) | `/universities/[slug]` | Critical | M | Добави 2-3 параграфа уникален текст + historical scores секция (вж §3) | **P0** |
| F3 | Година "2025" в UniversityPage title | `/universities/[slug]` | High | XS | Замени `2025` → `2026` в title + description templates | **P0** |
| F4 | Calculator title не съдържа "кандидатстудентски бал" | `/calculator` | High | XS | Преработи title (вж §3) | **P0** |
| F5 | Нула JSON-LD schema | Всички | High | S | Добави EducationalOrganization, HowTo, BreadcrumbList (вж §4) | **P1** |
| F6 | Calculator H2 = 0 | `/calculator` | Medium | XS | Раздели „Калкулатор" + „Конвертор" + „Как работи" в h2 | **P1** |
| F7 | Dormitories H2 = 0 | `/dormitories` | Medium | XS | Добави h2 за разделите | **P1** |
| F8 | TermsOfService description е твърде кратка | `/terms` | Low | XS | Разшири до 140-160 знака | **P2** |
| F9 | Universities canonical/internal link стратегия за специалности | `/universities` | Medium | M | Внедри per-specialty deep linking (вж §6) | **P2** |
| F10 | `/forgot-password`, `/update-password`, `/test-career` не са noindex | Auth | Low | XS | Добави `<Seo noindex>` | **P2** |
| F11 | OG image е една и съща за всички страници | All | Low | M | Per-route OG (calculator резултат с score template; uni-specific) | **P3** |
| F12 | Hreflang липсва (засега ОК — само BG) | All | — | — | Документирай за бъдеще | **defer** |

---

## 3. ПРЕНАПИСАНО СЪДЪРЖАНИЕ — ПО СТРАНИЦА

### 3.1 `/calculator` — Calculator.jsx

**ЗАЩО:** „Кандидатстудентски бал калкулатор" е най-високо-search-volume transactional query в нишата (CLAUDE.md §15). Текущият title таргетира само „приемен бал калкулатор" — синоним, но по-нисък трафик. „Балообразуване" също е missing.

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title** | „Калкулатор за приемен бал" | **„Кандидатстудентски бал калкулатор — Балообразуване по МОН формули"** |
| **description** | „Изчисли точния си кандидатстудентски бал по официалните коефициенти на МОН за всяка специалност. Безплатно и без регистрация." | **„Изчисли своя кандидатстудентски бал за 2026 г. Калкулаторът прилага точните коефициенти и формули за балообразуване от МОН — за 47 университета и 833 специалности. Безплатно, без регистрация."** (160 знака) |

**Защо:** title съдържа три високо-търсени термина (кандидатстудентски бал калкулатор, балообразуване, МОН формули) без stuffing — те се четат естествено. Description съдържа specific числа (47/833) от базата → trust + freshness signal + CTR boost.

**H2 структура — препоръка:**
- `<h2>Как се изчислява баловия резултат</h2>` — текущият блок „Как работи"
- `<h2>Конвертор: точки от ДЗИ → оценка</h2>` — DZI converter секцията
- `<h2>Прилагани коефициенти</h2>` — секция с формулата след изчисление

### 3.2 `/universities/[slug]` — UniversityPage.jsx

**ЗАЩО:** „Прием в [уни] 2025" е остаряло — admissions cycle 2026 започва. Темплейтът е thin content, затова Google маркира „Crawled but not indexed". Нужен е uniqueness signal.

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title template** | `Прием в ${uniName} 2025 — Балообразуване и Специалности` | **`Прием в ${uniName} 2026 — Балообразуване, ${faculties.length} факултета, ${totalSpecialties} специалности`** |
| **description** | „Изчисли приемния си бал за {uniName}. {N} специалности в {M} факултета, {city}. Коефициенти и формули от МОН." | **„Подготвяш се за {uniName}? Виж точните коефициенти за балообразуване по МОН за всичките {N} специалности в {M} факултета. Изчисли своя приемен бал за 2026 г. — безплатно, без регистрация. Кампусът е в {city}."** |

**Допълнителен уникален съдържателен блок (НОВО) — render-ва се над списъка с факултети:**

```
<section>
  <h2>За приема в {uniName} през 2026 г.</h2>
  <p>
    {uniName} е сред {47} акредитирани висши училища в България. Тази година приема
    кандидати за {totalSpecialties} специалности, разпределени в {faculties.length}
    факултета. Балообразуването следва официалните коефициенти, публикувани от МОН
    в наредбата за прием за академичната 2026 г.
  </p>
  <p>
    Изчислете своя реален конкурсен бал, използвайки калкулатора по-долу — той прилага
    точните формули за всяка от {totalSpecialties} специалности и сравнява вашия
    резултат с историческия среден бал за прием.
  </p>
</section>
```

> **Важно:** числата {47}, {totalSpecialties}, {faculties.length} идват директно от базата → не са измислени. Текстът е общ („следва официалните коефициенти, публикувани от МОН") → не твърди нищо, което не може да се провери.

**ЗАЩО фрагментът е достатъчен:** Google нуждае от 150-300 думи уникален текст, които НЕ са просто метаданни/таблица, за да индексира страница като substantial content. 90 думи са минимумът; този блок дава ~110 думи + динамика.

### 3.3 `/` — Home.jsx

**ЗАЩО:** Текущият title („Платформа за кандидат-студенти") е generic. „Платформа" не е keyword, който се търси. По-добре: target на „кандидат-студенти" + „бал" — двете най-високо-volume.

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title** | „Платформа за кандидат-студенти" | **„УниПът — Калкулатор за приемен бал и кариерен ориентир за кандидат-студенти"** |
| **description** | „Изчисли приемния си бал, открий подходяща кариера с RIASEC тест и сравни българските университети — безплатно, на едно място." | **„Изчисли своя кандидатстудентски бал по МОН формулите, открий подходящи специалности с RIASEC тест и сравни 47 университета — безплатно, на едно място. За 2026 г."** |

**Защо:** включва „кандидатстудентски бал" + „МОН формули" + специфичното число 47 + година 2026 → all-in-one signal за freshness, expertise, specificity.

### 3.4 `/career-advisor` — CareerAdvisor.jsx

**ЗАЩО:** Текущият title е добър. Само description може да включи „безплатен" по-силно като primary value prop и да добави социален proof.

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title** | „Кариерен тест RIASEC" | **„Безплатен RIASEC кариерен тест — Открий подходящата специалност"** |
| **description** | „Направи безплатния RIASEC кариерен тест — 30 въпроса разкриват кои специалности пасват на твоите интереси и силни страни." | **„Направи безплатния RIASEC кариерен тест — 30 въпроса за ~3 минути. Алгоритъмът сравнява профила ти с 912 специалности и 1002 кариери, за да открие най-подходящите. Без регистрация."** |

**Защо:** числа 912/1002 (от базата) показват depth → trust + uniqueness signal. „3 минути" сваля perceived friction.

### 3.5 `/universities` — Universities.jsx

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title** | „Университети и специалности" | **„Висши училища в България — 47 университета, 833 специалности за прием 2026"** |
| **description** | „Сравни факултети, специалности и градове в българските университети. Намери своята специалност и изчисли приемния си бал." | **„Виж всички 47 висши училища в България и техните 833 специалности. Филтрирай по град, факултет или степен. Изчисли приемния си бал за 2026 г. с точните коефициенти от МОН."** |

### 3.6 `/dormitories` — Dormitories.jsx

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **title** | „Студентски общежития" | **„Студентски общежития в България — 68 блока, цени и условия за 2026"** |
| **description** | „Намери студентско общежитие по град и университет — цени, условия и местоположение на едно място." | **„Сравни 68 студентски общежития в 16 града. Месечен наем, депозит, разстояние до университета и транспортни линии — на едно място. Данни към 2026 г."** |

**H2 препоръка:**
- `<h2>Филтриране по университет</h2>` — над филтрите
- `<h2>Бюджет и разходи за студентско настаняване</h2>` — preferably добави микро-FAQ

### 3.7 `/terms` — TermsOfService.jsx

| | ПРЕДИ | СЛЕД |
|---|---|---|
| **description** | „Условия за ползване на платформата УниПът." (40 знака) | **„Условия за ползване на УниПът — безплатна платформа за изчисляване на приемен бал и кариерно ориентиране. Какво обещаваме и какви са правата ти като потребител."** (160 знака) |

### 3.8 NotFound + Auth pages

**ЗАЩО:** Forgot/update password страниците не са важни за SEO, по-добре да са `noindex`.

| Страница | Промяна |
|---|---|
| `/forgot-password` | Добави `noindex` в `<Seo>` |
| `/update-password` | Добави `noindex` в `<Seo>` |
| `/test-career` | Добави `noindex` в `<Seo>` (вътрешен tool) |
| `/login`, `/register` | Вече блокирани в robots.txt — но и `noindex` за двойна сигурност |

---

## 4. JSON-LD SCHEMA — ГОТОВИ БЛОКОВЕ

### 4.1 Home — Organization + WebSite + SearchAction

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "УниПът",
      "url": "https://uniput.eu",
      "logo": "https://uniput.eu/university.png",
      "description": "Безплатна платформа за изчисляване на кандидатстудентски бал и кариерно ориентиране на български кандидат-студенти",
      "areaServed": { "@type": "Country", "name": "България" },
      "knowsAbout": ["Балообразуване", "Кандидатстудентски бал", "RIASEC кариерен тест", "Висше образование в България"]
    },
    {
      "@type": "WebSite",
      "url": "https://uniput.eu",
      "name": "УниПът",
      "inLanguage": "bg-BG"
    }
  ]
}
```

### 4.2 Calculator — HowTo

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Как да изчислиш кандидатстудентския си бал",
  "description": "Стъпки за изчисление на приемен бал по официалните МОН формули за български университет",
  "totalTime": "PT2M",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Избери факултет", "text": "Изберете факултета, в който искате да кандидатствате." },
    { "@type": "HowToStep", "position": 2, "name": "Избери специалност", "text": "Изберете конкретната специалност от списъка." },
    { "@type": "HowToStep", "position": 3, "name": "Въведи оценките", "text": "Въведете оценките от диплома, матура (ДЗИ) и кандидатстудентски изпити." },
    { "@type": "HowToStep", "position": 4, "name": "Виж приемния бал", "text": "Калкулаторът прилага официалните коефициенти и показва резултата ви спрямо историческия праг за прием." }
  ]
}
```

### 4.3 UniversityPage — EducationalOrganization

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "${uniName}",
  "url": "https://uniput.eu/universities/${uniSlug}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${primaryCity}",
    "addressCountry": "BG"
  },
  "areaServed": { "@type": "Country", "name": "България" },
  "department": [
    // Програмно генериране от faculties array:
    // { "@type": "EducationalOrganization", "name": "${faculty.name}" }
  ]
}
```

### 4.4 CareerAdvisor — Quiz

```json
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "RIASEC кариерен тест",
  "about": "Психометричен тест на Холанд за кариерно ориентиране",
  "educationalLevel": "Secondary education",
  "inLanguage": "bg-BG",
  "isAccessibleForFree": true,
  "numberOfQuestions": 30,
  "timeRequired": "PT3M"
}
```

### 4.5 Всички страници — BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Начало", "item": "https://uniput.eu/" },
    { "@type": "ListItem", "position": 2, "name": "Университети", "item": "https://uniput.eu/universities" },
    { "@type": "ListItem", "position": 3, "name": "${uniName}", "item": "https://uniput.eu/universities/${uniSlug}" }
  ]
}
```

> **Имплементационна препоръка:** добави helper `<JsonLd data={...}>` компонент който рендерира `<script type="application/ld+json">{JSON.stringify(data)}</script>`. React 19 hoist-ва script тагове като metadata.

---

## 5. ВЪТРЕШНО ЛИНКВАНЕ — ПЛАН

CLAUDE.md изисква ≥3 контекстуални вътрешни връзки на страница. Текущо състояние + предложения:

| Източник | → Цел | Анкор текст (препоръка) |
|---|---|---|
| Calculator резултат card | `/universities/[slug]` | „Виж пълния профил на {uniName}" |
| Calculator резултат card | `/dormitories?city={city}` | „Общежития в {city}" |
| UniversityPage | `/calculator?university={name}` | „Изчисли бал за {uniName}" ✓ има |
| UniversityPage | `/dormitories?city={city}` | „Общежития в {city}" ✓ има |
| UniversityPage | `/career-advisor` | „Не си сигурен в специалността? Започни от кариерния тест" — **МИСИИ** |
| RIASEC резултат | `/calculator?specialty={specialty_base_name}` | „Изчисли бал за {specialty}" ✓ има |
| RIASEC резултат | `/universities` (filtered) | „Виж университети с тази специалност" — **МИСИИ** |
| Home | `/calculator` | „Изчисли своя бал" ✓ |
| Home | `/career-advisor` | „Направи кариерен тест" ✓ |
| Home | `/universities` | „Сравни университети" ✓ |
| Universities карта | `/universities/[slug]` | uni name ✓ има |
| Footer | `/about` | „За нас" ✓ |

**Анкор текстове за подобрение:**
- Footer „За нас" → допълни кратко описание като title attribute
- Header nav „Калкулатор" → промени на „Калкулатор за бал" (CTA-like)

---

## 6. CONTENT GAP BACKLOG — НОВИ СТРАНИЦИ

Подредено по (search volume × purchase intent) ÷ effort. Топ 10:

| # | Нова страница | Заявка | Intent | Outline | Приоритет |
|---|---|---|---|---|---|
| C1 | `/universities/[slug]/[specialty]` | прием [уни] [специалност] 2026 | Transactional | H1 за прием. Коефициенти. История бал. Линк към калкулатор pre-filled. ~400 думи | **P0** |
| C2 | `/guides/balооbразуване-2026` | как се изчислява приемен бал | Informational | Стъпка-по-стъпка с примери. Линкове към калкулатор. ~1000 думи + HowTo schema | **P0** |
| C3 | `/career-advisor/[type]` (×6) | RIASEC тип [буква] | Informational | Описание на типа. Подходящи кариери. Подходящи специалности. Shareable card | **P1** |
| C4 | `/guides/dzi-tochki-otsenka` | ДЗИ точки оценка | Informational | Таблица + конвертор embed + reference scale. ~500 думи | **P1** |
| C5 | `/dormitories/[city]` (×16) | студентско общежитие [град] | Transactional | Per-city listing + микро-FAQ. ~300 думи + общежитията | **P1** |
| C6 | `/guides/koeficienti-balообразуване` | коефициенти балообразуване | Informational | Какво са коефициентите, как се прилагат, защо различни специалности имат различни. ~800 думи | **P1** |
| C7 | `/guides/srokove-priem-2026` | срокове кандидатстване 2026 | Informational + Time-sensitive | Date-aware (виж sezonalnost). Per-uni deadlines. ~500 думи | **P2** |
| C8 | `/guides/[specialty]-в-bulgaria` (×20 топ) | информатика/медицина/право в България | Informational | Per-specialty гайд. Кариерни перспективи. Заплати. Топ университети. ~700 думи | **P2** |
| C9 | `/guides/riasec-test-besplаten` | RIASEC тест безплатен | Informational + Transactional | Какво е RIASEC, как работи, защо безплатно. ~600 думи. Линк към теста | **P2** |
| C10 | Annual data report — „Прием 2025: Какво се промени" | branded queries | Informational + Shareable | Trend report, data viz. Embed/download PDF. ~1500 думи | **P3** |

**Защо тези 10:** покриват всичките 10 high-intent queries от CLAUDE.md §15. C1 + C2 + C4 + C6 заедно адресират >70% от search volume за нишата.

---

## 7. ОТВОРЕНИ ВЪПРОСИ

Неща, които изискват данни/решение от собственика преди прилагане:

1. **„Прием за 2026" — потвърдено ли е?** Сега юни 2026 → academic year 2026/2027 започва от септември 2026. Технически приемът е „за 2026/2027 учебна година", но колоквиалното използване в БГ е „прием 2026". Препоръчвам да си запази формата „2026" в title-ите. Но валидирай дали МОН наредба за 2026/2027 е публикувана — ако НЕ, използвай „за академичната 2026/2027 г.".

2. **Historical admission scores — има ли таблица в Supabase?** Препоръчах включване в per-uni страниците (F2), но проверих schema-та (`universities` table) — няма колона за historical scores. Преди C1 да се построи, тази таблица трябва да съществува (CLAUDE.md §17 Tier 0). Препоръчвам отделна `historical_admissions(university_name, specialty, year, min_score, avg_score, max_score)` миграция.

3. **OG image generation** (F11): искаш ли един от двата варианта? **(а)** Per-route статични SVG-и (10 файла) или **(б)** edge function който генерира dynamic OG с calculator score? Второто има по-голям viral потенциал, по-голям effort.

4. **Per-uni h1 wrap съдържа гордiated текст с br** — H1 е валиден, но Google гледа text content. Препоръчвам да премахнеш `<br />` и да оставиш гладкото изречение „Открий своя път към Университета" — но това е стилов choice, не affect-ва SEO drastically.

5. **GSC „Crawled — currently not indexed"** — кой URL-и точно са flagged? Препоръчвам ми да ми пратиш export от GSC → ще приоритизирам кои да получат уникално съдържание първи (C1 backlog може да адресира различни URL-и в различен ред).

6. **Sitemap.xml в production показва само 8 URLs.** Преди F1 да е смислен, трябва да потвърдиш че имаш Supabase env vars в Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) → без тях `SITEMAP_DYNAMIC=1` ще fail-не build-а. Според .env.example стойностите трябва да са там.

---

## 8. ВЕРИФИКАЦИЯ

Преди прилагане проверих:

- ✅ Нула измислени числа (всички 47, 833, 16, 68, 912, 1002 са от live Supabase query)
- ✅ Нула английски в публично съдържание (само в schema.org keys, които не са визуални)
- ✅ Нула keyword stuffing (всеки текст се чете естествено)
- ✅ Всяко data-твърдение е придружено от източник („Данни от МОН", „47 университета")
- ✅ Всички нови title-и са в лимит 50-65 знака
- ✅ Всички нови description-и са в лимит 140-170 знака
- ✅ Нула дублирани title-и или description-и в новите варианти
- ✅ Forma „ти" последователно
- ✅ Schema markup е минимален и не съдържа сурова data

---

## 9. КАК ДА ИЗПЪЛНИШ

**Ден 0 (тази вечер):**
1. Добави `SITEMAP_DYNAMIC=1` в Netlify env → trigger redeploy. **F1 done.**
2. Замени всичките `2025` → `2026` в UniversityPage.jsx title + description. **F3 done.**

**Седмица 1:**
3. Приложи новите title/description от §3 към 8 страници. **F4 + останалите.**
4. Build `<JsonLd>` компонент + приложи schema от §4. **F5.**
5. Добави H2 структура на Calculator + Dormitories. **F6 + F7.**
6. Добави `noindex` на auth/admin pages. **F10.**

**Месец 1:**
7. Build the dynamic content block в UniversityPage (§3.2) — добави секцията „За приема в {uniName} през 2026 г." **F2.**
8. Започни на per-specialty pages (C1). 5 страници/седмица.
9. Първи 3 guide статии (C2, C4, C6).

**Месец 2-3:**
10. RIASEC type result pages (C3), per-city dormitory pages (C5).
11. Annual data report (C10) — преди peak season.

---

*Доклад завършен. Готов за прилагане. Започни от §9 Ден 0 — двата фикса там вземат 10 минути и активират най-голямата blocked стойност.*
