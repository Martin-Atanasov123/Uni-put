# УниПът — Платформа за Кандидат-Студенти

Безплатна платформа, която помага на български ученици да изчислят приемния си бал, да открият подходяща кариера и да сравнят университети — всичко на едно място.

---

## Функционалности

- **Калкулатор** — изчислява точния приемен бал по официалната формула за всяка специалност, като автоматично избира най-добрата оценка за всеки слот
- **Кариерен съветник** — 30-въпросен RIASEC тест, свързващ личностния профил с подходящи специалности (O*NET база)
- **Университети** — търсене и филтриране по университет, факултет, специалност и град
- **Общежития** — карта с общежития, цени и условия
- **Любими** — запазване и сравнение на специалности
- **Моите оценки** — управление на оценки за повторно изчисление
- **Профил** — аватар, RIASEC тип, история

---

## Технологии

| Компонент | Технология |
|---|---|
| Frontend | React 19 + Vite 6 |
| Routing | React Router 7 (всички маршрути lazy-loaded) |
| Styling | Tailwind CSS 4 + DaisyUI (dark / nord теми) |
| Animations | Framer Motion (`motion/react`) — `LazyMotion + domAnimation` |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Icons | Lucide React (`strokeWidth={1.5}`) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Tests | Vitest + @testing-library/react |

---

## Маршрути

| Маршрут | Достъп | Описание |
|---|---|---|
| `/` | Публичен | Начална страница |
| `/calculator` | Публичен | Калкулатор на приемен бал |
| `/universities` | Публичен | Търсачка на специалности |
| `/career-advisor` | Публичен | RIASEC въведение |
| `/test-career` | Публичен | RIASEC тест |
| `/dormitories` | Публичен | Общежития |
| `/my-grades` | Публичен | Управление на оценки |
| `/about` | Публичен | За проекта |
| `/login` / `/register` | Публичен | Автентикация |
| `/forgot-password` / `/update-password` | Публичен | Смяна на парола |
| `/favorites` | Изисква вход | Запазени специалности |
| `/profile` | Изисква вход | Потребителски профил |
| `/admin` | Изисква админ роля | Управление на данни |
| `/admin/reports` | Изисква админ роля | Доклади |

---

## База данни

Основната таблица е `public.universities` в Supabase:

| Колона | Тип | Описание |
|---|---|---|
| `id` | uuid | Първичен ключ |
| `university_name` | text | Пълно официално название |
| `city` | text | Град |
| `faculty` | text | Факултет / направление |
| `specialty` | text | Специалност (с вид обучение) |
| `education_level` | text | `бакалавър` / `магистър` / `проф. бакалавър` |
| `formula_description` | text | Четима формула (показва се в UI) |
| `coefficients` | jsonb | Формула като JSONB масив от слотове |
| `max_ball` | numeric | Максимален бал |

### Формат на `coefficients`

Масив от слотове — калкулаторът избира най-добрата алтернатива за всеки слот:

```json
[
  {"alternatives": [{"key": "exam_mat", "coef": 3}, {"key": "dzi_mat", "coef": 3}]},
  {"alternatives": [{"key": "mat", "coef": 1}]},
  {"alternatives": [{"key": "diploma", "coef": 1}]}
]
```

Ключовете са дефинирани в [`src/lib/coefficients_config.js`](src/lib/coefficients_config.js) — `exam_*` за приемни изпити, `dzi_*` за ДЗИ, без префикс за оценки от диплома.

---

## Инсталация

Изисквания: Node.js 18+

```bash
git clone <repo-url>
cd Uni-put
npm install
```

Създай `.env` в корена:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev        # http://localhost:5173
npm run build      # продукционен build
npx vitest run     # тестове
```

---

## Структура на проекта

```
src/
├── app/              # App.jsx (рутер), main.jsx
├── components/
│   ├── Auth/         # Login, Register, Profile, ForgotPassword, UpdatePassword
│   ├── Calculator/   # Calculator, GradeInputSection, ReportButton
│   ├── CareerAdvisor/# CareerAdvisor, TestCareer, RIASECResults
│   ├── Dormitories/
│   ├── Favorites/
│   ├── MyGrades/
│   ├── Universities/
│   ├── admin/        # AdminDashboard, AdminReports
│   ├── common/       # Header, Footer, Home, About, NotFound, ...
│   └── landing/      # AnoAI, GlobeScene (3D)
├── hooks/            # AuthContext.jsx, useTheme.js
├── lib/              # supabase.js, coefficients_config.js
├── routes/           # ProtectedRoute.jsx, AdminRoute.jsx
└── services/         # universityService.js
```

---

## Алгоритъм на калкулатора

1. Потребителят избира специалност → зарежда се `coefficients` JSON от Supabase
2. За всеки слот калкулаторът взима всички въведени оценки, съответстващи на алтернативите в слота
3. Избира се максималната и се умножава по `coef`
4. Сумата от всички слотове е крайният бал
5. Сравнява се с `max_ball` — показва се процент и индикатор "Над/Под средното"

---

## Среда и конвенции

- CSS: само `var(--brand-*)` custom properties — никога hardcoded цветове
- Теми: `dark` (data-theme="dark") и `light` (data-theme="nord")
- Анимации: `motion/react` с `LazyMotion` — винаги `prefers-reduced-motion`
- Supabase заявки: никога `select("*")` — само необходимите колони
- Icons: `strokeWidth={1.5}` навсякъде

Виж [`CLAUDE.md`](CLAUDE.md) за пълния design system, brand guidelines и архитектурни решения.
