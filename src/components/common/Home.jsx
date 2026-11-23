import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, ExternalLink } from "lucide-react";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { MORE_TOOLS } from "@/components/common/navItems";
import { UNIVERSITIES, SPECIALTIES, ADMISSION_YEAR, ADMISSION_YEAR_SHORT } from "@/lib/siteStats";

// Начална страница — посока A „Търсене първо“ (одобрена ноември 2026).
// Търсенето е центърът на първия екран; под него три пътя, популярни специалности
// с реалния брой университети от базата и компактна карта с примерен бал.

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

// Бързо търсене по област. Нарочно не повтаря специалностите от списъка по-долу.
const AREAS = ["Информатика", "Инженерство", "Педагогика", "Икономика"];

// Подбор от специалности, които се учат в много университети. Броят НЕ е написан
// на ръка — идва от базата (academic_year = ADMISSION_YEAR). Докато не дойде, редът
// се показва без число, а при грешка — също без число.
const POPULAR = ["Право", "Медицина", "Психология", "Софтуерно инженерство", "Маркетинг"];

const ROUTES = [
    { title: "Знам какво искам да уча", text: "Виж къде се учи и какъв бал трябва", to: "/specialnosti/" },
    { title: "Търся университет", text: "Специалности, град и условия за прием", to: "/universities/" },
    { title: "Не знам какво да избера", text: "Кратко ориентиране по интереси", to: "/career-advisor/" },
];

// ── Примерът е от базата на UniПът ───────────────────────────────────────────
// Пловдивски университет, „Математика, информатика и информационни технологии“:
// 3 × ДЗИ (мат./инф./ИТ) + 2 × математика (дипл.) + 1 × мат./инф./ИТ (дипл.), максимум 36.
// Минимален бал 22.74 — 2025 г., III класиране (uni-plovdiv.bg, Min-bal-k3-2025.pdf).
// Оценките са примерни; балът се смята от тях, не е написан наготово.
const EXAMPLE = {
    university: "Пловдивски университет",
    specialty: "Математика, информатика и информационни технологии",
    maxBall: 36,
    historical: { value: 22.74, label: "2025 г., III класиране" },
    terms: [
        { coef: 3, grade: 5.5 },
        { coef: 2, grade: 5.75 },
        { coef: 1, grade: 6 },
    ],
};
const exampleTotal = EXAMPLE.terms.reduce((s, t) => s + t.coef * t.grade, 0);

const fmt = (n) => n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uniWord = (n) => (n === 1 ? "университет" : "университета");

function usePopularCounts() {
    const [counts, setCounts] = useState(null);
    useEffect(() => {
        let alive = true;
        supabase
            .from("universities")
            .select("specialty, university_name")
            .eq("academic_year", ADMISSION_YEAR)
            .in("specialty", POPULAR)
            .then(({ data, error }) => {
                if (!alive || error || !Array.isArray(data)) return;
                const sets = {};
                for (const r of data) (sets[r.specialty] ||= new Set()).add(r.university_name);
                setCounts(Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, s.size])));
            }, () => {});
        return () => { alive = false; };
    }, []);
    return counts;
}

export default function Home() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const counts = usePopularCounts();

    const onSearch = (e) => {
        e.preventDefault();
        const q = cleanQuery(query);
        navigate(q ? `/universities/?q=${encodeURIComponent(q)}` : "/specialnosti/");
    };

    return (
        <div className="hp">
            <Seo
                title="Специалности, университети и приемен бал"
                description={`Потърси специалност или университет, виж формулата за бал и минималния бал от миналите години. ${SPECIALTIES} специалности в ${UNIVERSITIES} университета. Прием ${ADMISSION_YEAR_SHORT} г.`}
                path="/"
            />
            <JsonLd data={HOME_SCHEMA} />
            <style>{CSS}</style>

            <div className="hp-wrap hp-grid">
                {/* ── Първи екран: търсенето е главното действие ── */}
                <section className="hp-intro" data-testid="hero-section" aria-labelledby="hp-h1">
                    <h1 id="hp-h1" className="hp-h1">Какво да уча и къде?</h1>
                    <p className="hp-lead">{SPECIALTIES} специалности в {UNIVERSITIES} университета, с формулата за бал за всяка.</p>
                    <form className="hp-search" role="search" onSubmit={onSearch}>
                        <label htmlFor="hp-q" className="sr-only">Търси специалност или университет</label>
                        <div className="hp-search__box">
                            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
                            <input
                                id="hp-q"
                                type="search"
                                value={query}
                                maxLength={80}
                                autoComplete="off"
                                placeholder="Напр. медицина"
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button type="submit" className="hp-search__go">Търси</button>
                        </div>
                    </form>
                    <nav className="hp-areas" aria-label="Бързо търсене по област">
                        {AREAS.map((a) => (
                            <Link key={a} to={`/universities/?q=${encodeURIComponent(a)}`}>{a}</Link>
                        ))}
                    </nav>
                </section>

                {/* ── Три пътя ── */}
                <nav className="hp-routes" aria-label="Откъде да започнеш">
                    {ROUTES.map((r) => (
                        <Link key={r.to} to={r.to} className="hp-route">
                            <span>
                                <b>{r.title}</b>
                                <small>{r.text}</small>
                            </span>
                            <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
                        </Link>
                    ))}
                </nav>

                {/* ── Популярни специалности (броят е от базата) ── */}
                <section className="hp-popular" aria-labelledby="hp-pop">
                    <h2 id="hp-pop" className="hp-kicker">Популярни специалности</h2>
                    <ul>
                        {POPULAR.map((name) => (
                            <li key={name}>
                                <Link to={`/specialnosti/${slugify(name)}/`}>
                                    <span>{name}</span>
                                    {counts?.[name] ? <small>{counts[name]} {uniWord(counts[name])}</small> : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link to="/specialnosti/" className="hp-more">Всички специалности <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
                </section>

                {/* ── Компактна карта с примерен бал ── */}
                <section className="hp-score" aria-labelledby="hp-score-title">
                    <p className="hp-score__tag">Примерно изчисление</p>
                    <h2 id="hp-score-title" className="hp-score__title">{EXAMPLE.specialty}</h2>
                    <p className="hp-score__uni">{EXAMPLE.university}</p>
                    <dl className="hp-score__nums">
                        <div>
                            <dt>примерен бал от {EXAMPLE.maxBall}</dt>
                            <dd>{fmt(exampleTotal)}</dd>
                        </div>
                        <div>
                            <dt>минимален бал, {EXAMPLE.historical.label}</dt>
                            <dd>{fmt(EXAMPLE.historical.value)}</dd>
                        </div>
                    </dl>
                    <p className="hp-score__note">Историческите минимуми не гарантират прием.</p>
                    <Link to="/calculator/" className="hp-score__cta">
                        Изчисли своя бал <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                    </Link>
                </section>
                {/* ── Още инструменти: видими, не само в менюто ── */}
                <section className="hp-tools" aria-labelledby="hp-tools">
                    <h2 id="hp-tools" className="hp-kicker">Още инструменти</h2>
                    <ul>
                        {MORE_TOOLS.map(({ name, desc, path, icon: Icon }) => (
                            <li key={path}>
                                <Link to={path}>
                                    <span className="hp-tools__icon"><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
                                    <span><b>{name}</b><small>{desc}</small></span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* ── Как работи: една компактна линия ── */}
            <section className="hp-how" aria-labelledby="hp-how">
                <div className="hp-wrap">
                    <h2 id="hp-how" className="sr-only">Как работи</h2>
                    <ol>
                        <li><b>Открий</b><span>специалност или университет</span></li>
                        <li><b>Сравни</b><span>предмети, формула и минимален бал</span></li>
                        <li><b>Планирай</b><span>бала и сроковете за прием</span></li>
                    </ol>
                </div>
            </section>

            {/* ── Доверие и източници ── */}
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
                                <a href="https://www.mon.bg/visshe-obrazovanie/" className="hp-link">МОН<ExternalLink size={14} aria-hidden="true" /></a>
                                {" "}и{" "}
                                <a href="https://www.neaa.government.bg/akreditirani-institucii/visshi-uchilischa" className="hp-link">НАОА<ExternalLink size={14} aria-hidden="true" /></a>.
                            </dd>
                        </div>
                        <div><dt>Прием след 7. клас</dt><dd>Данните на РУО – София за паралелките и класиранията.</dd></div>
                    </dl>
                </div>
            </section>

            {/* ── Въпроси ── */}
            <section className="hp-section" aria-labelledby="hp-faq">
                <div className="hp-wrap hp-split">
                    <div>
                        <h2 id="hp-faq" className="hp-h2">Въпроси</h2>
                        <p className="hp-side">Не намираш отговор? <a href="mailto:uniput1000@gmail.com" className="hp-link">Пиши ни</a></p>
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

const FAQ = [
    { q: "Безплатен ли е UniПът?", a: "Да. Каталогът, калкулаторът и ориентирането са безплатни. Без акаунт изчисляваш първите три специалности; с безплатен акаунт пазиш списъка си и продължаваш без ограничение." },
    { q: "Откъде идват формулите и баловете?", a: "Формулите са от правилниците за прием на университетите. Минималните балове са от класиранията, които те публикуват — винаги с година и етап." },
    { q: "Минималният бал от миналата година гарантира ли прием?", a: "Не. Той е исторически ориентир. Минимумът се мени всяка година според броя кандидати и местата." },
    { q: "Кариерното ориентиране казва ли ми какво да уча?", a: "Не. Показва кои области отговарят на интересите, които посочи. Решението остава твое." },
    { q: "Какво да направя, ако липсва моята специалност?", a: "Пиши ни и ще я добавим. Някои университети още не са в базата и работим по тях." },
];

const CSS = `
.hp { background: var(--canvas); color: var(--ink); }
.hp .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.hp-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 64px); }

/* Подредба: мобилно — един поток; desktop — търсене + карта горе, пътища + списък долу */
.hp-grid { display: grid; gap: 28px; padding-top: calc(var(--header-h) + 20px); padding-bottom: 40px;
  grid-template-areas: "intro" "routes" "popular" "score" "tools"; }
.hp-intro { grid-area: intro; } .hp-routes { grid-area: routes; } .hp-popular { grid-area: popular; } .hp-score { grid-area: score; } .hp-tools { grid-area: tools; }
@media (min-width: 768px) {
  .hp-grid { gap: 40px; padding-top: calc(var(--header-h) + 48px); grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: "intro intro" "routes popular" "score score" "tools tools"; }
}
@media (min-width: 1100px) {
  .hp-grid { column-gap: 64px; row-gap: 56px; padding-top: calc(var(--header-h) + 72px); padding-bottom: 72px;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); grid-template-areas: "intro score" "routes popular" "tools tools"; align-items: start; }
}

.hp-h1 { margin: 0; font-size: clamp(32px, 4.6vw, 60px); line-height: 1.06; font-weight: 740; letter-spacing: -0.03em; text-wrap: balance; }
.hp-lead { margin: 10px 0 0; max-width: 52ch; font-size: clamp(16px, 1.4vw, 19px); line-height: 1.5; color: var(--ink-muted); }

.hp-search { margin-top: 20px; max-width: 640px; }
.hp-search__box { display: flex; align-items: center; gap: 10px; padding: 0 6px 0 14px; min-height: 60px; background: var(--surface); border: 2px solid var(--ink); border-radius: var(--radius-control); }
.hp-search__box:focus-within { border-color: var(--brand); outline: 2px solid var(--focus); outline-offset: 2px; }
.hp-search__box svg { flex-shrink: 0; color: var(--ink-muted); }
.hp-search__box input { flex: 1; min-width: 0; height: 52px; border: 0; background: transparent; font: inherit; font-size: 17px; color: var(--ink); outline: none; }
.hp-search__box input::placeholder { color: var(--ink-muted); opacity: 1; }
.hp-search__go { flex-shrink: 0; min-height: 48px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--brand); color: #fff; font: inherit; font-weight: 700; cursor: pointer; transition: background-color 0.14s ease; }
.hp-search__go:hover { background: var(--brand-hover); }

/* Бързо търсене: пренасят се на нов ред, нищо не се отрязва */
.hp-areas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.hp-areas a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border: 1px solid var(--border-strong); border-radius: 999px; background: var(--surface); font-size: 15px; font-weight: 600; color: var(--ink); text-decoration: none; transition: border-color 0.14s ease, color 0.14s ease; }
.hp-areas a:hover { border-color: var(--brand); color: var(--brand); }

/* Три пътя: редове, не карти */
.hp-routes { display: flex; flex-direction: column; border-top: 1px solid var(--border); }
.hp-route { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; padding: 12px 0; border-bottom: 1px solid var(--border); color: var(--ink); text-decoration: none; }
.hp-route b { display: block; font-size: 17px; font-weight: 700; }
.hp-route small { display: block; margin-top: 2px; font-size: 14px; color: var(--ink-muted); }
.hp-route svg { flex-shrink: 0; color: var(--brand); transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.hp-route:hover b { color: var(--brand); }
.hp-route:hover svg { transform: translateX(3px); }

/* Популярни специалности: справочен списък */
.hp-kicker { margin: 0 0 4px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); }
.hp-popular ul { list-style: none; margin: 0; padding: 0; }
.hp-popular li a { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid var(--border); color: var(--ink); text-decoration: none; font-size: 16px; font-weight: 650; }
.hp-popular li a:hover span { color: var(--brand); }
.hp-popular small { font-size: 14px; font-weight: 600; color: var(--ink-muted); white-space: nowrap; }
.hp-more { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin-top: 6px; font-weight: 700; color: var(--brand); }

/* Още инструменти: икона + име + какво прави */
.hp-tools ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
@media (min-width: 768px) { .hp-tools ul { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } }
@media (min-width: 1100px) { .hp-tools ul { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.hp-tools a { display: flex; align-items: flex-start; gap: 12px; height: 100%; min-height: 64px; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-feature); background: var(--surface); color: var(--ink); text-decoration: none; transition: border-color 0.14s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.hp-tools a:hover { border-color: var(--brand); transform: translateY(-2px); }
.hp-tools__icon { display: inline-flex; flex-shrink: 0; padding: 8px; border-radius: 10px; background: var(--surface-subtle); color: var(--brand); }
.hp-tools b { display: block; font-size: 16px; font-weight: 700; }
.hp-tools small { display: block; margin-top: 2px; font-size: 14px; line-height: 1.4; color: var(--ink-muted); }
.hp-tools a:hover b { color: var(--brand); }

/* Компактна тъмна карта */
.hp-score { background: var(--ink); color: #fff; border-radius: var(--radius-feature); padding: 20px; }
@media (min-width: 768px) { .hp-score { padding: 28px; } }
.hp-score__tag { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--signal); }
.hp-score__title { margin: 8px 0 0; font-size: 18px; line-height: 1.3; font-weight: 700; }
.hp-score__uni { margin: 2px 0 0; font-size: 14px; color: #C7D3CF; }
.hp-score__nums { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 18px 0 0; padding-top: 16px; border-top: 1px solid #3A5552; }
.hp-score__nums div { display: flex; flex-direction: column-reverse; }
.hp-score__nums dd { margin: 0; font-size: clamp(30px, 3vw, 40px); font-weight: 780; letter-spacing: -0.02em; line-height: 1.1; }
.hp-score__nums dt { margin-top: 4px; font-size: 13px; line-height: 1.35; color: #C7D3CF; }
.hp-score__note { margin: 14px 0 0; font-size: 14px; color: #E4ECE8; }
.hp-score__cta { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; margin-top: 16px; border-radius: var(--radius-control); background: var(--signal); color: var(--ink); font-weight: 750; text-decoration: none; transition: background-color 0.14s ease; }
.hp-score__cta:hover { background: #DDF8A9; color: var(--ink); }
.hp-score__cta:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* Как работи: една линия */
.hp-how { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--surface); }
/* Мотивът ●──●──●: три спирки, свързани с линия (вертикално на телефон, хоризонтално на широк екран) */
.hp-how ol { list-style: none; margin: 0; padding: 20px 0; display: grid; gap: 14px; }
.hp-how li { position: relative; padding-left: 26px; font-size: 15px; line-height: 1.45; }
.hp-how li::before { content: ""; position: absolute; left: 0; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--surface); border: 2px solid var(--ink); z-index: 1; }
.hp-how li:not(:last-child)::after { content: ""; position: absolute; left: 7px; top: 18px; bottom: -14px; width: 2px; background: var(--ink); }
.hp-how li:last-child::before { background: var(--signal); }
.hp-how b { margin-right: 8px; }
@media (min-width: 1100px) {
  .hp-how ol { grid-template-columns: repeat(3, 1fr); gap: 32px; padding: 26px 0 24px; }
  .hp-how li { padding-left: 0; padding-top: 24px; }
  .hp-how li::before { top: 0; }
  .hp-how li:not(:last-child)::after { left: 16px; right: -28px; top: 7px; bottom: auto; width: auto; height: 2px; }
}
.hp-how b { font-weight: 750; }
.hp-how span { color: var(--ink-muted); }

.hp-section { padding: clamp(48px, 7vw, 96px) 0; }
.hp-section--subtle { background: var(--surface-subtle); }
.hp-h2 { margin: 0; font-size: clamp(25px, 2.6vw, 36px); line-height: 1.2; font-weight: 650; letter-spacing: -0.015em; text-wrap: balance; }
.hp-side { margin: 16px 0 0; font-size: 17px; line-height: 1.55; color: var(--ink-muted); max-width: 46ch; }
.hp-link { display: inline-flex; align-items: center; gap: 3px; font-weight: 650; color: var(--brand); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.hp-link:hover { color: var(--brand-hover); }
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

@media (prefers-reduced-motion: reduce) { .hp-route svg, .hp-tools a { transition: none; } .hp-tools a:hover { transform: none; } }
`;
