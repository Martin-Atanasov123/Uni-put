import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, BookOpen, GraduationCap, Compass, ExternalLink } from "lucide-react";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { UNIVERSITIES, SPECIALTIES, ADMISSION_YEAR_SHORT } from "@/lib/siteStats";

// Начална страница по design.md (раздел 12): входна точка, не брошура.
// За секунди отговаря на: какво прави UniПът, с какво да започна, защо да вярвам на данните.

const HOME_SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            name: "УниПът",
            url: "https://uniput.eu",
            logo: "https://uniput.eu/university.png",
            description: "Независим образователен навигатор: специалности, университети и приемен бал в България",
            areaServed: { "@type": "Country", name: "България" },
        },
        { "@type": "WebSite", url: "https://uniput.eu", name: "УниПът", inLanguage: "bg-BG" },
    ],
};

// Дължина и специални символи се чистят — стойността отива в URL и в заявка към каталога.
const cleanQuery = (v) => v.replace(/[%_\\'";<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

// ── Пример с реален интерфейс ────────────────────────────────────────────────
// Формулата и минималният бал са от базата на UniПът: Пловдивски университет, „Математика,
// информатика и информационни технологии“ (максимум 36; минимален бал 22.74, 2025 г., III класиране).
// Оценките са примерни и се редактират — затова картата носи етикет „Пример с примерни оценки“.
const EXAMPLE = {
    university: "Пловдивски университет „Паисий Хилендарски“",
    specialty: "Математика, информатика и информационни технологии",
    maxBall: 36,
    historical: { value: 22.74, label: "2025 г., III класиране" },
    terms: [
        { key: "dzi", coef: 3, label: "ДЗИ по математика", hint: "или по информатика, или по ИТ" },
        { key: "mat", coef: 2, label: "Математика от дипломата" },
        { key: "inf", coef: 1, label: "Информатика от дипломата", hint: "или математика, или ИТ" },
    ],
};

const fmt = (n) => n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toNum = (v) => Number(String(v).replace(",", "."));

function ScoreExample() {
    const [grades, setGrades] = useState({ dzi: "5,50", mat: "5,75", inf: "6,00" });
    const parsed = Object.fromEntries(Object.entries(grades).map(([k, v]) => [k, toNum(v)]));
    const valid = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, Number.isFinite(v) && v >= 2 && v <= 6]));
    const allValid = Object.values(valid).every(Boolean);
    const total = allValid ? EXAMPLE.terms.reduce((s, t) => s + t.coef * parsed[t.key], 0) : null;
    const diff = total !== null ? total - EXAMPLE.historical.value : null;

    return (
        <div className="hp-calc">
            <div>
                <p className="hp-tag">Пример с примерни оценки</p>
                <h3 className="hp-calc__title">{EXAMPLE.specialty}</h3>
                <p className="hp-calc__uni">{EXAMPLE.university}</p>
            </div>

            <div className="hp-calc__fields">
                {EXAMPLE.terms.map((t) => (
                    <div className="hp-field" key={t.key}>
                        <label htmlFor={`hp-${t.key}`}>{t.label}</label>
                        {t.hint && <span className="hp-field__hint">{t.hint}</span>}
                        <input
                            id={`hp-${t.key}`}
                            inputMode="decimal"
                            autoComplete="off"
                            value={grades[t.key]}
                            aria-invalid={!valid[t.key]}
                            aria-describedby={!valid[t.key] ? `hp-${t.key}-err` : undefined}
                            onChange={(e) => setGrades((g) => ({ ...g, [t.key]: e.target.value.slice(0, 4) }))}
                        />
                        {!valid[t.key] && <p className="hp-field__err" id={`hp-${t.key}-err`}>Въведи оценка между 2,00 и 6,00.</p>}
                    </div>
                ))}
            </div>

            <div>
                <p className="hp-calc__label">Как го сметнахме</p>
                <ol className="hp-calc__steps">
                    {EXAMPLE.terms.map((t) => (
                        <li key={t.key}>
                            <span>{t.coef} × {t.label.charAt(0).toLowerCase() + t.label.slice(1)}</span>
                            <span>{valid[t.key] ? `${t.coef} × ${fmt(parsed[t.key])} = ${fmt(t.coef * parsed[t.key])}` : "—"}</span>
                        </li>
                    ))}
                </ol>
                <p className="hp-calc__total" aria-live="polite">
                    <span>Твоят изчислен бал</span>
                    <strong>{total !== null ? fmt(total) : "—"}</strong>
                    <span className="hp-calc__of">от {EXAMPLE.maxBall}</span>
                </p>
                <p className="hp-calc__hist">
                    Минимален бал, {EXAMPLE.historical.label}: <strong>{fmt(EXAMPLE.historical.value)}</strong>
                    {diff !== null && <> · {diff >= 0 ? "+" : "−"}{fmt(Math.abs(diff))} т. спрямо него</>}
                </p>
                <p className="hp-calc__caveat">Исторически ориентир — не гарантира прием.</p>
            </div>

            <Link to="/calculator/" className="hp-btn hp-btn--primary hp-calc__cta">
                Изчисли за своята специалност <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
        </div>
    );
}

// ── Мотив „път → точки → възможности“: една точка, разклонение, избран маршрут ──
function WayfindingVisual() {
    return (
        <figure className="hp-way" aria-hidden="true">
            <svg viewBox="0 0 360 420" focusable="false">
                <path d="M170 40 V140" className="hp-way__line" />
                <path d="M170 140 C170 190 260 190 260 250" className="hp-way__line hp-way__line--muted" />
                <path d="M170 140 C170 190 335 180 335 250" className="hp-way__line hp-way__line--muted" />
                <path d="M170 140 V380" className="hp-way__line hp-way__line--on" />
                <circle cx="170" cy="40" r="9" className="hp-way__dot" />
                <circle cx="170" cy="140" r="9" className="hp-way__dot" />
                <circle cx="260" cy="250" r="7" className="hp-way__dot hp-way__dot--muted" />
                <circle cx="335" cy="250" r="7" className="hp-way__dot hp-way__dot--muted" />
                <circle cx="170" cy="240" r="9" className="hp-way__dot hp-way__dot--on" />
                <circle cx="170" cy="380" r="13" className="hp-way__dot hp-way__dot--goal" />
            </svg>
            <ol className="hp-way__labels">
                <li style={{ top: "9.5%" }}>Интереси</li>
                <li style={{ top: "33.3%" }}>Специалности</li>
                <li style={{ top: "57%" }}>Университет</li>
                <li style={{ top: "90.5%" }}><b>Бал и срокове</b></li>
            </ol>
        </figure>
    );
}

const START = [
    { icon: BookOpen, title: "Търся специалност", text: `${SPECIALTIES} специалности с формула за бал — по име, град или област.`, to: "/specialnosti/", cta: "Разгледай специалности" },
    { icon: GraduationCap, title: "Търся университет", text: `${UNIVERSITIES} университета: какво предлагат и при какви условия.`, to: "/universities/", cta: "Разгледай университети" },
    { icon: Compass, title: "Не съм сигурен", text: "Започни от интересите си. Резултатът е отправна точка, не присъда.", to: "/career-advisor/", cta: "Започни ориентиране" },
];

const STEPS = [
    { title: "Открий", text: "Търси по име, град или област. Ако още нямаш посока, започни от интересите си." },
    { title: "Сравни", text: "Запази специалностите, които те интересуват, и провери за всяка предметите, формулата и минималния бал." },
    { title: "Планирай", text: "Изчисли бала по формулата на университета и следи сроковете за приема в календара." },
];

const FAQ = [
    { q: "Безплатен ли е UniПът?", a: "Да. Каталогът, калкулаторът и ориентирането са безплатни. Без акаунт изчисляваш първите три специалности; с безплатен акаунт пазиш списъка си и продължаваш без ограничение." },
    { q: "Откъде идват формулите и баловете?", a: "Формулите са от правилниците за прием на университетите. Минималните балове са от класиранията, които те публикуват — винаги с година и етап." },
    { q: "Минималният бал от миналата година гарантира ли прием?", a: "Не. Той е исторически ориентир. Минимумът се мени всяка година според броя кандидати и местата." },
    { q: "Кариерното ориентиране казва ли ми какво да уча?", a: "Не. Показва кои области отговарят на интересите, които посочи. Решението остава твое." },
    { q: "Какво да направя, ако липсва моята специалност?", a: "Пиши ни и ще я добавим. Някои университети още не са в базата и работим по тях." },
];

export default function Home() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const onSearch = (e) => {
        e.preventDefault();
        const q = cleanQuery(query);
        navigate(q ? `/universities/?q=${encodeURIComponent(q)}` : "/specialnosti/");
    };

    return (
        <div className="hp">
            <Seo
                title="Специалности, университети и приемен бал"
                description={`Открий специалности, сравни ${UNIVERSITIES} университета и разбери как се образува балът — с източник и година за всяка стойност. Прием ${ADMISSION_YEAR_SHORT} г.`}
                path="/"
            />
            <JsonLd data={HOME_SCHEMA} />
            <style>{CSS}</style>

            {/* ── Above the fold: 8/12 текст + 4/12 мотив ── */}
            <section className="hp-hero" data-testid="hero-section" aria-labelledby="hp-h1">
                <div className="hp-wrap hp-hero__grid">
                    <div>
                        <p className="hp-eyebrow">Ориентир за бъдещото ти</p>
                        <h1 id="hp-h1" className="hp-h1">Изборът на специалност не трябва да е на сляпо.</h1>
                        <p className="hp-lead">Открий специалности, сравни университети и разбери как да кандидатстваш — на едно място.</p>
                        <div className="hp-actions">
                            <Link to="/specialnosti/" className="hp-btn hp-btn--primary">
                                Разгледай специалности <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                            </Link>
                            <Link to="/career-advisor/" className="hp-btn hp-btn--secondary">Още не знам какво да избера</Link>
                        </div>
                        <form className="hp-search" role="search" onSubmit={onSearch}>
                            <label htmlFor="hp-q" className="hp-search__label">Търсене в каталога</label>
                            <div className="hp-search__box">
                                <Search size={20} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="hp-q"
                                    type="search"
                                    value={query}
                                    maxLength={80}
                                    autoComplete="off"
                                    placeholder="Специалност, университет или област…"
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button type="submit" className="hp-search__go">Търси</button>
                            </div>
                        </form>
                    </div>
                    <div className="hp-hero__visual">
                        <WayfindingVisual />
                    </div>
                </div>
            </section>

            {/* ── 1. Откъде да започнеш ── */}
            <section className="hp-section" aria-labelledby="hp-start">
                <div className="hp-wrap">
                    <h2 id="hp-start" className="hp-h2">Избери откъде да започнеш</h2>
                    <ul className="hp-start">
                        {START.map(({ icon: Icon, title, text, to, cta }) => (
                            <li key={to}>
                                <Icon size={22} strokeWidth={1.75} aria-hidden="true" className="hp-start__icon" />
                                <h3>{title}</h3>
                                <p>{text}</p>
                                <Link to={to} className="hp-link">{cta} <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── 2. Как работи ── */}
            <section className="hp-section hp-section--subtle" aria-labelledby="hp-how">
                <div className="hp-wrap">
                    <h2 id="hp-how" className="hp-h2">Как работи</h2>
                    <ol className="hp-steps">
                        {STEPS.map((s, i) => (
                            <li key={s.title}>
                                <span className="hp-steps__dot" aria-hidden="true" />
                                <span className="hp-steps__num">Стъпка {i + 1}</span>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ── 3. Демонстрация с реален интерфейс (асиметричната editorial секция) ── */}
            <section className="hp-section" aria-labelledby="hp-demo">
                <div className="hp-wrap hp-demo">
                    <div className="hp-demo__text">
                        <h2 id="hp-demo" className="hp-h2">Как се образува балът</h2>
                        <p>Всяка специалност има своя формула: кои оценки влизат и с какъв коефициент. Калкулаторът я показва стъпка по стъпка, а до резултата — миналогодишния минимален бал, отбелязан като исторически.</p>
                        <p>Промени оценките в примера и виж как се мени балът.</p>
                    </div>
                    <ScoreExample />
                </div>
            </section>

            {/* ── 4. Доверие и източници ── */}
            <section className="hp-section hp-section--subtle" aria-labelledby="hp-trust">
                <div className="hp-wrap hp-split">
                    <div>
                        <h2 id="hp-trust" className="hp-h2">Откъде са данните</h2>
                        <p className="hp-side">UniПът е независим проект. Не сме част от МОН и не представляваме университетите — събираме публикуваната от тях информация и показваме откъде е.</p>
                    </div>
                    <dl className="hp-sources">
                        <div><dt>Формули за бал</dt><dd>Правилниците за прием на университетите.</dd></div>
                        <div><dt>Минимални балове</dt><dd>Публикуваните класирания — винаги с година и етап. Исторически, не гаранция за прием.</dd></div>
                        <div>
                            <dt>Университети и акредитация</dt>
                            <dd>
                                Регистрите на{" "}
                                <a href="https://www.mon.bg/visshe-obrazovanie/" className="hp-link hp-link--inline">МОН<ExternalLink size={14} aria-hidden="true" /></a>
                                {" "}и{" "}
                                <a href="https://www.neaa.government.bg/akreditirani-institucii/visshi-uchilischa" className="hp-link hp-link--inline">НАОА<ExternalLink size={14} aria-hidden="true" /></a>.
                            </dd>
                        </div>
                        <div><dt>Прием след 7. клас</dt><dd>Данните на РУО – София за паралелките и класиранията.</dd></div>
                    </dl>
                </div>
            </section>

            {/* ── 5. FAQ: отговорите са отворени ── */}
            <section className="hp-section" aria-labelledby="hp-faq">
                <div className="hp-wrap hp-split">
                    <div>
                        <h2 id="hp-faq" className="hp-h2">Въпроси</h2>
                        <p className="hp-side">Не намираш отговор? <a href="mailto:uniput1000@gmail.com" className="hp-link hp-link--inline">Пиши ни</a></p>
                    </div>
                    <div>
                        {FAQ.map((f) => (
                            <div className="hp-faq__item" key={f.q}>
                                <h3>{f.q}</h3>
                                <p>{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

const CSS = `
.hp { background: var(--canvas); color: var(--ink); }
.hp-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 64px); }
.hp-section { padding: clamp(56px, 8vw, 112px) 0; }
.hp-section--subtle { background: var(--surface-subtle); }
.hp-h2 { margin: 0; font-size: clamp(25px, 2.6vw, 36px); line-height: 1.2; font-weight: 650; letter-spacing: -0.015em; text-wrap: balance; }
.hp-side { margin: 16px 0 0; font-size: 17px; line-height: 1.55; color: var(--ink-muted); max-width: 46ch; }

.hp-link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-weight: 650; color: var(--brand); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; transition: color 0.14s ease; }
.hp-link:hover { color: var(--brand-hover); }
.hp-link--inline { min-height: 0; gap: 3px; }

.hp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 24px; border-radius: var(--radius-control); font-size: 16px; font-weight: 650; text-decoration: none; transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease; }
.hp-btn--primary { background: var(--brand); color: #fff; border: 1px solid var(--brand); }
.hp-btn--primary:hover { background: var(--brand-hover); border-color: var(--brand-hover); color: #fff; }
.hp-btn--secondary { background: var(--surface); color: var(--ink); border: 1px solid var(--border-strong); }
.hp-btn--secondary:hover { border-color: var(--ink); color: var(--ink); }

/* Hero */
.hp-hero { padding: calc(var(--header-h) + clamp(40px, 7vw, 96px)) 0 clamp(56px, 7vw, 96px); }
.hp-hero__grid { display: grid; gap: 48px; align-items: center; }
@media (min-width: 1000px) { .hp-hero__grid { grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: 64px; } }
.hp-eyebrow { margin: 0 0 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-muted); }
.hp-h1 { margin: 0; font-size: clamp(39px, 5.2vw, 68px); line-height: 1.06; font-weight: 720; letter-spacing: -0.03em; text-wrap: balance; max-width: 19ch; }
.hp-lead { margin: 24px 0 0; max-width: 60ch; font-size: 18px; line-height: 1.55; color: var(--ink-muted); }
.hp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
@media (max-width: 559px) { .hp-actions .hp-btn { width: 100%; } }

.hp-search { margin-top: 28px; max-width: 640px; }
.hp-search__label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
.hp-search__box { display: flex; align-items: center; gap: 10px; padding: 0 6px 0 14px; min-height: 56px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-control); transition: border-color 0.14s ease; }
.hp-search__box:focus-within { border-color: var(--brand); outline: 2px solid var(--focus); outline-offset: 2px; }
.hp-search__box svg { flex-shrink: 0; color: var(--ink-muted); }
.hp-search__box input { flex: 1; min-width: 0; height: 52px; border: 0; background: transparent; font: inherit; font-size: 16px; color: var(--ink); outline: none; }
.hp-search__box input::placeholder { color: var(--ink-muted); opacity: 1; }
.hp-search__go { flex-shrink: 0; min-height: 44px; padding: 0 18px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; font: inherit; font-weight: 650; cursor: pointer; transition: background-color 0.14s ease; }
.hp-search__go:hover { background: #0B1A18; }

/* Мотив */
.hp-way { position: relative; margin: 0; max-width: 340px; justify-self: center; width: 100%; }
.hp-way svg { display: block; width: 100%; height: auto; }
.hp-way__line { fill: none; stroke: var(--ink); stroke-width: 3; stroke-linecap: round; }
.hp-way__line--muted { stroke: #A9BAB1; stroke-dasharray: 2 8; }
.hp-way__line--on { stroke: var(--brand); }
.hp-way__dot { fill: var(--canvas); stroke: var(--ink); stroke-width: 3; }
.hp-way__dot--muted { stroke: #A9BAB1; }
.hp-way__dot--on { stroke: var(--brand); }
.hp-way__dot--goal { fill: var(--signal); stroke: var(--ink); }
.hp-way__labels { list-style: none; margin: 0; padding: 0; position: absolute; inset: 0; }
.hp-way__labels li { position: absolute; left: 0; width: calc(170 / 360 * 100% - 22px); text-align: right; transform: translateY(-50%); font-size: 16px; font-weight: 600; white-space: nowrap; }
.hp-way__labels b { font-weight: 760; }
@media (max-width: 999px) { .hp-hero__visual { display: none; } }

/* Три пътя: колони с линия, не карти */
.hp-start { list-style: none; margin: 40px 0 0; padding: 0; display: grid; gap: 32px; }
@media (min-width: 768px) { .hp-start { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; } }
@media (min-width: 1200px) { .hp-start { gap: 48px; } }
.hp-start li { border-top: 2px solid var(--ink); padding-top: 24px; display: flex; flex-direction: column; }
.hp-start__icon { color: var(--brand); }
.hp-start h3 { margin: 16px 0 8px; font-size: clamp(20px, 2vw, 24px); font-weight: 650; line-height: 1.25; }
.hp-start p { margin: 0 0 8px; font-size: 16px; line-height: 1.55; color: var(--ink-muted); max-width: 40ch; flex: 1; }
.hp-start .hp-link { align-self: flex-start; }

/* Как работи: точки по една линия */
.hp-steps { list-style: none; margin: 48px 0 0; padding: 0; display: grid; gap: 32px; position: relative; }
@media (min-width: 768px) {
  .hp-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hp-steps::before { content: ""; position: absolute; left: 9px; right: 9px; top: 8px; height: 2px; background: var(--ink); }
}
.hp-steps li { position: relative; padding-top: 40px; }
.hp-steps__dot { position: absolute; left: 0; top: 0; width: 18px; height: 18px; border-radius: 50%; background: var(--surface-subtle); border: 3px solid var(--ink); }
.hp-steps li:last-child .hp-steps__dot { background: var(--signal); }
.hp-steps__num { font-size: 14px; font-weight: 700; color: var(--ink-muted); }
.hp-steps h3 { margin: 4px 0 8px; font-size: clamp(22px, 2.2vw, 26px); font-weight: 650; }
.hp-steps p { margin: 0; font-size: 16px; line-height: 1.55; color: var(--ink-muted); max-width: 42ch; }

/* Демонстрация */
.hp-demo { display: grid; gap: 40px; align-items: start; }
@media (min-width: 1000px) { .hp-demo { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; } }
.hp-demo__text p { margin: 20px 0 0; font-size: 18px; line-height: 1.55; color: var(--ink-muted); max-width: 52ch; }
.hp-calc { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-feature); padding: clamp(20px, 3vw, 36px); display: grid; gap: 28px; }
.hp-tag { display: inline-block; margin: 0 0 12px; padding: 4px 10px; border-radius: 999px; background: var(--surface-subtle); font-size: 13px; font-weight: 600; }
.hp-calc__title { margin: 0; font-size: clamp(20px, 2vw, 24px); font-weight: 650; line-height: 1.25; }
.hp-calc__uni { margin: 6px 0 0; font-size: 15px; color: var(--ink-muted); }
/* Полетата като редове: етикет и пояснение вляво, оценката вдясно */
.hp-calc__fields { display: grid; gap: 0; border-top: 1px solid var(--border); }
.hp-field { display: grid; grid-template-columns: minmax(0, 1fr) 112px; grid-template-areas: "label input" "hint input" "err err"; column-gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
.hp-field label { grid-area: label; font-size: 15px; font-weight: 600; }
.hp-field__hint { grid-area: hint; font-size: 13px; color: var(--ink-muted); }
.hp-field__hint:empty { display: none; }
.hp-field__err { grid-area: err; }
.hp-field input { grid-area: input; width: 100%; height: 48px; padding: 0 12px; text-align: right; border: 1px solid var(--border-strong); border-radius: var(--radius-control); font: inherit; font-size: 18px; font-weight: 650; color: var(--ink); background: var(--surface); transition: border-color 0.14s ease; }
.hp-field input:hover { border-color: var(--ink-muted); }
.hp-field input:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; border-color: var(--brand); }
.hp-field input[aria-invalid="true"] { border-color: var(--danger); }
.hp-field__err { margin: 4px 0 0; font-size: 13px; color: var(--danger); }
.hp-calc__label { margin: 0 0 8px; font-size: 14px; font-weight: 700; }
.hp-calc__steps { list-style: none; margin: 0; padding: 0; }
.hp-calc__steps li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 15px; }
.hp-calc__steps li span:first-child { color: var(--ink-muted); }
.hp-calc__steps li span:last-child { font-weight: 600; white-space: nowrap; }
.hp-calc__total { display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; margin: 16px 0 0; }
.hp-calc__total span:first-child { font-size: 15px; font-weight: 600; }
.hp-calc__total strong { font-size: clamp(34px, 4vw, 44px); font-weight: 760; letter-spacing: -0.02em; }
.hp-calc__of { color: var(--ink-muted); }
.hp-calc__hist { margin: 12px 0 0; font-size: 15px; line-height: 1.55; }
.hp-calc__caveat { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: var(--warning); }
.hp-calc__cta { justify-self: start; }
@media (max-width: 559px) {
  .hp-calc__cta { width: 100%; }
  .hp-calc__steps li { flex-direction: column; gap: 2px; }
}

/* Доверие и FAQ: един split */
.hp-split { display: grid; gap: 32px; }
@media (min-width: 1000px) { .hp-split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; } }
.hp-sources { margin: 0; }
.hp-sources > div { padding: 18px 0; border-bottom: 1px solid var(--border-strong); }
.hp-sources > div:first-child { padding-top: 0; }
.hp-sources dt { font-size: 17px; font-weight: 650; }
.hp-sources dd { margin: 6px 0 0; font-size: 16px; line-height: 1.55; color: var(--ink-muted); }
.hp-faq__item { padding: 20px 0; border-bottom: 1px solid var(--border); }
.hp-faq__item:first-child { padding-top: 0; }
.hp-faq__item h3 { margin: 0; font-size: 18px; font-weight: 650; line-height: 1.35; }
.hp-faq__item p { margin: 8px 0 0; font-size: 16px; line-height: 1.6; color: var(--ink-muted); max-width: 65ch; }
`;
