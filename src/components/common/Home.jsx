import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { UNIVERSITIES, SPECIALTIES, CAREERS, RIASEC_SPECIALTIES, ADMISSION_YEAR_SHORT, DATA_FRESHNESS_NOTE } from "@/lib/siteStats";
import {
    Brain, ArrowRight, Calculator, TrendingUp, Building2, Check,
    BarChart3, Shield, BookMarked, Plus,
} from "lucide-react";

// Schema.org structured data — описание на УниПът като организация и сайт.
// Помага на Google + AI Overview да разберат scope-а на платформата.
const HOME_SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            name: "УниПът",
            url: "https://uniput.eu",
            logo: "https://uniput.eu/university.png",
            description: "Безплатна платформа за изчисляване на кандидатстудентски бал и кариерно ориентиране на български кандидат-студенти",
            areaServed: { "@type": "Country", name: "България" },
            knowsAbout: [
                "Балообразуване",
                "Кандидатстудентски бал",
                "RIASEC кариерен тест",
                "Висше образование в България",
            ],
        },
        {
            "@type": "WebSite",
            url: "https://uniput.eu",
            name: "УниПът",
            inLanguage: "bg-BG",
        },
    ],
};

// ── Анимационни примитиви ───────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };

function Reveal({ children, delay = 0, className, style }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <m.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={fadeUp}
            transition={{ duration: 0.55, ease: EASE, delay }}
            className={className}
            style={style}
        >
            {children}
        </m.div>
    );
}

function useCountUp(end, duration = 1400, trigger) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!trigger) return;
        let startTime = null;
        const raf = (ts) => {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(raf);
            else setValue(end);
        };
        requestAnimationFrame(raf);
    }, [trigger, end, duration]);
    return value;
}

// ── Общи парчета ─────────────────────────────────────────────────────────────

function SectionHead({ eyebrow, title, sub, light = false, align = "left" }) {
    return (
        <div style={{ maxWidth: "40rem", textAlign: align, margin: align === "center" ? "0 auto" : 0 }}>
            {eyebrow && (
                <p style={{ margin: "0 0 0.875rem", fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: light ? "var(--brand-mint)" : "var(--brand-accent-text)" }}>
                    {eyebrow}
                </p>
            )}
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.875rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: light ? "#fff" : "var(--brand-text)", textWrap: "balance" }}>
                {title}
            </h2>
            {sub && (
                <p style={{ margin: "1rem 0 0", fontSize: "1.0625rem", lineHeight: 1.65, color: light ? "rgba(255,255,255,0.82)" : "var(--brand-muted)" }}>
                    {sub}
                </p>
            )}
        </div>
    );
}

const BTN_BASE = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
    minHeight: "3.25rem", padding: "0.875rem 1.625rem", borderRadius: "0.75rem",
    fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none",
    transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), background 0.2s ease, color 0.2s ease",
};

// ── HERO ────────────────────────────────────────────────────────────────────
// Индиго хиро: вляво заглавие + бутони + „къде си сега“, вдясно плочки с примерни резултати.

const STAGES = [
    { label: "7. клас", hint: "избор на гимназия", to: "/priem-7-klas/" },
    { label: "10.–11. клас", hint: "кой втори ДЗИ", to: "/dzi-strateg/" },
    { label: "12. клас", hint: "приемен бал", to: "/calculator/" },
];

function HeroVisual() {
    return (
        <div className="hm-visual" aria-label="Примери за резултати">
            <div className="hm-col">
                <m.div className="hm-tile hm-tile--mint" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}>
                    <span className="hm-tile-label">Приемен бал</span>
                    <span className="hm-tile-score">512.40</span>
                    <span className="hm-pill">
                        <TrendingUp size={14} strokeWidth={2} aria-hidden="true" /> Над средното с 32 т.
                    </span>
                    <span className="hm-tile-note">примерни данни</span>
                </m.div>
                <m.div className="hm-badge" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}>
                    <span className="hm-badge-num">{UNIVERSITIES}</span>
                    <span className="hm-badge-text">университета<br />{SPECIALTIES} специалности</span>
                </m.div>
            </div>
            <div className="hm-col hm-col--shift">
                <m.div className="hm-bubble" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
                    <b>Данни</b> от официалните наредби на МОН
                </m.div>
                <m.div className="hm-tile hm-tile--peach" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}>
                    <span className="hm-tile-label">Твоят кариерен тип</span>
                    <span className="hm-tile-letter">I</span>
                    <span className="hm-tile-type">Изследовател</span>
                    <span className="hm-tile-note">примерни данни</span>
                </m.div>
            </div>
        </div>
    );
}

function HeroSection() {
    return (
        <section data-testid="hero-section" className="hm-hero">
            <div className="hm-hero-dots" aria-hidden="true" />
            <div className="hm-wrap hm-hero-grid">
                <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                    <p className="hm-chip">Готови за прием {ADMISSION_YEAR_SHORT} г.</p>
                    <h1 className="hm-h1">
                        Открий своя
                        <br /> път към Университета
                    </h1>
                    <p className="hm-lead">
                        Забрави за сложните таблици и неясните критерии. Ние използваме реални данни, за да ти покажем къде имаш шанс.
                    </p>

                    <div className="hm-cta-row">
                        <Link to="/calculator/" className="hm-btn hm-btn--mint" style={BTN_BASE}>
                            <Calculator size={18} strokeWidth={1.75} /> Изчисли моя бал <ArrowRight size={16} strokeWidth={1.75} />
                        </Link>
                        <Link to="/career-advisor/" className="hm-btn hm-btn--ghost" style={BTN_BASE}>
                            <Brain size={18} strokeWidth={1.75} /> Направи кариерен тест
                        </Link>
                    </div>

                    <div className="hm-stage">
                        <p className="hm-stage-title">Къде си в момента?</p>
                        <ul className="hm-stage-list">
                            {STAGES.map((s) => (
                                <li key={s.to}>
                                    <Link to={s.to} className="hm-stage-link">
                                        <strong>{s.label}</strong>
                                        <span>{s.hint}</span>
                                        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </m.div>

                <HeroVisual />
            </div>
        </section>
    );
}

// ── ЛЕНТА С ДОВЕРИЕ ──────────────────────────────────────────────────────────

const TRUST = [
    "Напълно безплатно",
    "Формули по наредбите на МОН",
    `${UNIVERSITIES} университета`,
    "Без реклами",
];

function TrustBar() {
    return (
        <section className="hm-trust">
            <ul className="hm-wrap hm-trust-list">
                {TRUST.map((t) => (
                    <li key={t}>
                        <Check size={16} strokeWidth={2.25} aria-hidden="true" /> {t}
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ── ТРИТЕ ВХОДА ──────────────────────────────────────────────────────────────
// Три големи входа, всеки води до инструмент. Цветът е разликата — не иконите.

const ENTRIES = [
    {
        tone: "indigo", icon: Calculator, title: "Калкулатор на бала",
        desc: "Въведи оценките си и виж точния бал по формулата на всяка специалност.",
        to: "/calculator/", cta: "Изчисли бал",
    },
    {
        tone: "mint", icon: Brain, title: "Кариерен тест",
        desc: "30 въпроса за 3 минути показват кои специалности пасват на интересите ти.",
        to: "/career-advisor/", cta: "Направи теста",
    },
    {
        tone: "navy", icon: Building2, title: "Каталог на университетите",
        desc: `${UNIVERSITIES} университета и ${SPECIALTIES} специалности по град, направление и степен.`,
        to: "/universities/", cta: "Разгледай",
    },
];

function EntriesSection() {
    return (
        <section className="hm-section" style={{ background: "var(--brand-bg)" }}>
            <div className="hm-wrap">
                <Reveal>
                    <SectionHead eyebrow="Започни оттук" title="Три входа — избери този, който ти трябва сега" />
                </Reveal>
                <m.div className="hm-entries" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
                    {ENTRIES.map((e) => {
                        const Icon = e.icon;
                        return (
                            <m.div key={e.to} variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
                                <Link to={e.to} className={`hm-entry hm-entry--${e.tone}`}>
                                    <span className="hm-entry-icon"><Icon size={26} strokeWidth={1.5} aria-hidden="true" /></span>
                                    <h3>{e.title}</h3>
                                    <p>{e.desc}</p>
                                    <span className="hm-entry-cta">{e.cta} <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" /></span>
                                </Link>
                            </m.div>
                        );
                    })}
                </m.div>
            </div>
        </section>
    );
}

// ── ЦЕЛИЯТ ПЪТ (7. клас → ДЗИ → университет) ─────────────────────────────────

const PATH_STAGES = [
    {
        grade: "7. клас", title: "Избери гимназия",
        desc: "Балът ти за всяка паралелка в София, минималните балове от 4 години и помощник за подреждане на желанията.",
        to: "/priem-7-klas/", cta: "Прием след 7. клас",
    },
    {
        grade: "10.–11. клас", title: "Избери втори ДЗИ",
        desc: "Добави специалностите, които те привличат, и виж коя матура ги държи отворени без изпит.",
        to: "/dzi-strateg/", cta: "Кой ДЗИ да избера",
    },
    {
        grade: "12. клас", title: "Влез в университет",
        desc: "Точният приемен бал по формулата на всяка специалност и сравнение с минимумите.",
        to: "/calculator/", cta: "Изчисли бала си",
    },
];

function PathSection() {
    return (
        <section className="hm-section" style={{ background: "var(--brand-bg-alt)" }}>
            <div className="hm-wrap">
                <Reveal className="hm-split-head">
                    <SectionHead eyebrow="Целият път" title="От седми клас до студентската скамейка" />
                    <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--brand-muted)", maxWidth: "26rem" }}>
                        Три решения, които определят образованието ти. УниПът помага за всяко от тях.
                    </p>
                </Reveal>
                <m.ol className="hm-path" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
                    {PATH_STAGES.map((s, i) => (
                        <m.li key={s.to} variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="hm-path-item">
                            <span className="hm-path-num">{String(i + 1).padStart(2, "0")}</span>
                            <p className="hm-path-grade">{s.grade}</p>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                            <Link to={s.to} className="hm-link">{s.cta} <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" /></Link>
                        </m.li>
                    ))}
                </m.ol>
            </div>
        </section>
    );
}

// ── ЧИСЛА ─────────────────────────────────────────────────────────────────────

const STATS = [
    { value: SPECIALTIES, label: "специалности", sub: "с формула за бал" },
    { value: UNIVERSITIES, label: "университета", sub: "от цяла България" },
    { value: CAREERS, label: "професии", sub: "с RIASEC профил" },
];

function StatItem({ value, label, sub, trigger }) {
    const n = useCountUp(value, 1400, trigger);
    return (
        <div className="hm-stat">
            <div className="hm-stat-num">{n.toLocaleString("bg-BG")}</div>
            <div className="hm-stat-label">{label}</div>
            <div className="hm-stat-sub">{sub}</div>
        </div>
    );
}

function StatsSection() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <section ref={ref} className="hm-stats">
            <div className="hm-wrap hm-stats-grid">
                {STATS.map((s) => <StatItem key={s.label} {...s} trigger={inView} />)}
            </div>
        </section>
    );
}

// ── ЗАЩО УНИПЪТ ──────────────────────────────────────────────────────────────

const FEATURES = [
    { icon: BarChart3, title: "Реалистични шансове", desc: "Показваме реални приемни балове от официалните данни на МОН — без приукрасяване." },
    { icon: Brain, title: "RIASEC психометрия", desc: "Научно-валидирана методология (Holland Codes), използвана от O*NET — открий кариерния си тип." },
    { icon: Shield, title: "Официални данни", desc: DATA_FRESHNESS_NOTE },
    { icon: BookMarked, title: "Запази и сравни", desc: "Добавяй специалности в любими и сравнявай шансовете си в различни университети и градове." },
];

function WhySection() {
    return (
        <section className="hm-section" style={{ background: "var(--brand-bg)" }}>
            <div className="hm-wrap">
                <Reveal>
                    <SectionHead eyebrow="Защо УниПът" title="Създаден за сериозни избори" sub="Не просто калкулатор. Цялостна платформа за информирано кандидатстване." />
                </Reveal>
                <m.div className="hm-why" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <m.div key={f.title} variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="hm-why-item">
                                <span className="hm-why-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </m.div>
                        );
                    })}
                </m.div>
            </div>
        </section>
    );
}

// ── ТРИ СТЪПКИ (редуващи се редове) ─────────────────────────────────────────

const RIASEC_DEMO = [
    { k: "R", w: 38 }, { k: "I", w: 92 }, { k: "A", w: 55 },
    { k: "S", w: 47 }, { k: "E", w: 30 }, { k: "C", w: 62 },
];

const STEPS = [
    {
        num: "01", title: "Кариерен анализ",
        desc: "Попълни научно-валидирания RIASEC тест (базиран на O*NET данни) и открий своя кариерен профил в 6 измерения.",
        to: "/career-advisor/", cta: "Направи теста",
        visual: "riasec",
    },
    {
        num: "02", title: "Подбор на специалности",
        desc: `Профилът ти се сравнява с ${RIASEC_SPECIALTIES} специалности в ${UNIVERSITIES} университета и получаваш личен списък.`,
        to: "/universities/", cta: "Разгледай каталога",
        visual: "catalog",
    },
    {
        num: "03", title: "Изчисли приемния бал",
        desc: "Виж точните изисквания, изчисли конкурсния си бал с калкулатора и разбери дали имаш шанс — преди да е станало.",
        to: "/calculator/", cta: "Изчисли бал",
        visual: "score",
    },
];

function StepVisual({ kind }) {
    if (kind === "riasec") {
        return (
            <div className="hm-vis hm-vis--indigo" aria-hidden="true">
                <span className="hm-vis-label">Примерен профил</span>
                {RIASEC_DEMO.map((r) => (
                    <div key={r.k} className="hm-bar">
                        <span>{r.k}</span>
                        <i><b style={{ width: `${r.w}%` }} /></i>
                    </div>
                ))}
            </div>
        );
    }
    if (kind === "catalog") {
        return (
            <div className="hm-vis hm-vis--mint" aria-hidden="true">
                <span className="hm-vis-label">Каталог</span>
                <span className="hm-vis-big">{SPECIALTIES}</span>
                <span className="hm-vis-text">специалности в {UNIVERSITIES} университета</span>
                <span className="hm-vis-text">филтър по град, направление и степен</span>
            </div>
        );
    }
    return (
        <div className="hm-vis hm-vis--navy" aria-hidden="true">
            <span className="hm-vis-label">Примерен резултат</span>
            <span className="hm-vis-big hm-vis-big--mono">512.40</span>
            <span className="hm-pill hm-pill--light"><TrendingUp size={14} strokeWidth={2} /> Над средното с 32 т.</span>
            <span className="hm-vis-text">формулата и коефициентите се показват за всяка специалност</span>
        </div>
    );
}

function StepsSection() {
    return (
        <section className="hm-section" style={{ background: "var(--brand-bg-alt)" }}>
            <div className="hm-wrap">
                <Reveal>
                    <SectionHead eyebrow="Как работи" title="Три стъпки до правилния избор" />
                </Reveal>
                <div className="hm-steps">
                    {STEPS.map((s, i) => (
                        <Reveal key={s.num} className={`hm-step${i % 2 ? " hm-step--rev" : ""}`}>
                            <div className="hm-step-text">
                                <span className="hm-step-num">{s.num}</span>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                                <Link to={s.to} className="hm-link">{s.cta} <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" /></Link>
                            </div>
                            <StepVisual kind={s.visual} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── ЧЗВ ──────────────────────────────────────────────────────────────────────

const FAQ = [
    {
        q: "Безплатен ли е УниПът?",
        a: "Да. Калкулаторът, кариерният тест и каталогът са безплатни. Първите специалности изчисляваш без акаунт; с безплатен акаунт ги запазваш и продължаваш без ограничение.",
    },
    {
        q: "Откъде са данните?",
        a: `Формулите са от официалните наредби и правилници за прием на университетите, а минималните балове — от публикуваните от тях класирания. ${DATA_FRESHNESS_NOTE}`,
    },
    {
        q: "Гарантира ли балът, че ще вляза?",
        a: "Не. Калкулаторът прилага точната формула на специалността, но прагът за прием се мени всяка година според броя кандидати. Затова показваме и минималния бал от миналите години като ориентир.",
    },
    {
        q: "Какво е RIASEC тестът?",
        a: "Модел на Холанд с шест кариерни типа, използван и в американската база O*NET. Отговаряш на 30 въпроса за около 3 минути и получаваш профил, свързан със специалности.",
    },
    {
        q: "Не намирам моята специалност. Какво да направя?",
        a: "Пиши ни на uniput1000@gmail.com и ще я добавим. Калкулаторът вече има формулите на повечето университети, но работим по останалите.",
    },
];

function FaqSection() {
    return (
        <section className="hm-section" style={{ background: "var(--brand-bg)" }}>
            <div className="hm-wrap hm-faq-grid">
                <Reveal>
                    <SectionHead eyebrow="Въпроси" title="Често задавани въпроси" sub="Кратки отговори, преди да започнеш." />
                </Reveal>
                <Reveal>
                    <div className="hm-faq">
                        {FAQ.map((f) => (
                            <details key={f.q} className="hm-faq-item">
                                <summary>
                                    <span>{f.q}</span>
                                    <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                                </summary>
                                <p>{f.a}</p>
                            </details>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ── ФИНАЛЕН ПРИЗИВ ───────────────────────────────────────────────────────────

function CTASection() {
    const { user } = useAuth();
    return (
        <section className="hm-final">
            <div className="hm-hero-dots" aria-hidden="true" />
            <div className="hm-wrap hm-final-inner">
                <Reveal>
                    <SectionHead
                        light
                        eyebrow={user ? "Продължи пътя си" : "Започни сега"}
                        title="Не чакай резултатите. Виж ги сега."
                        sub={user
                            ? "Изчисли бал за твоите специалности, направи кариерния тест и сравни университетите."
                            : "Присъедини се към учениците, които вземат информирани решения за своето бъдеще — напълно безплатно."}
                    />
                    <div className="hm-cta-row" style={{ marginTop: "2rem" }}>
                        <Link to="/calculator/" className="hm-btn hm-btn--mint" style={BTN_BASE}>
                            {user ? "Изчисли моя бал" : "Започни безплатно"} <ArrowRight size={16} strokeWidth={1.75} />
                        </Link>
                        <Link to={user ? "/career-advisor/" : "/universities/"} className="hm-btn hm-btn--ghost" style={BTN_BASE}>
                            {user ? "Направи кариерен тест" : "Разгледай университетите"}
                        </Link>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ── СТИЛОВЕ ─────────────────────────────────────────────────────────────────

const CSS = `
.hm-wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
.hm-section { padding: 5rem 0; }
@media (min-width: 900px) { .hm-section { padding: 6.5rem 0; } }

/* HERO */
.hm-hero { position: relative; overflow: hidden; background: var(--brand-indigo); color: #fff; padding: 9rem 0 4.5rem; }
.hm-hero-dots { position: absolute; inset: 0; pointer-events: none; opacity: 0.28;
  background-image: radial-gradient(circle, var(--brand-mint) 1.25px, transparent 1.5px); background-size: 28px 28px;
  -webkit-mask-image: linear-gradient(to left, #000 0%, transparent 70%); mask-image: linear-gradient(to left, #000 0%, transparent 70%); }
.hm-hero-grid { position: relative; display: grid; gap: 3rem; align-items: center; }
@media (min-width: 960px) { .hm-hero-grid { grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 4rem; } .hm-hero { padding: 10rem 0 6rem; } }
.hm-chip { display: inline-block; margin: 0 0 1.25rem; padding: 0.4rem 0.875rem; border-radius: 999px; background: rgba(255,255,255,0.14); color: var(--brand-mint); font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.hm-h1 { margin: 0 0 1.25rem; font-family: var(--font-display); font-weight: 800; font-size: clamp(2.5rem, 5.6vw, 4.25rem); line-height: 1.05; letter-spacing: -0.035em; color: #fff; text-wrap: balance; }
.hm-lead { margin: 0 0 2rem; max-width: 34rem; font-size: clamp(1.0625rem, 2vw, 1.25rem); line-height: 1.6; color: rgba(255,255,255,0.88); }
.hm-cta-row { display: flex; flex-direction: column; gap: 0.875rem; }
@media (min-width: 560px) { .hm-cta-row { flex-direction: row; flex-wrap: wrap; } }
.hm-btn--mint { background: var(--brand-mint); color: #1D2939; }
.hm-btn--mint:hover { transform: translateY(-2px); background: #8dfde4; }
.hm-btn--ghost { border: 2px solid rgba(255,255,255,0.55); color: #fff; }
.hm-btn--ghost:hover { background: rgba(255,255,255,0.12); border-color: #fff; }
.hm-stage { margin-top: 2.25rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.22); }
.hm-stage-title { margin: 0 0 0.75rem; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.75); }
.hm-stage-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.625rem; }
.hm-stage-link { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.875rem; border-radius: 0.625rem; background: rgba(255,255,255,0.12); color: #fff; font-size: 13px; text-decoration: none; transition: background 0.2s ease; }
.hm-stage-link strong { font-weight: 800; }
.hm-stage-link span { color: rgba(255,255,255,0.78); }
.hm-stage-link:hover { background: rgba(255,255,255,0.22); }

.hm-visual { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; max-width: 32rem; width: 100%; justify-self: center; }
.hm-col { display: flex; flex-direction: column; gap: 1rem; }
.hm-col--shift { margin-top: 2.5rem; }
.hm-tile { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.25rem; border-radius: 1.5rem; color: #1D2939; box-shadow: 0 18px 40px rgba(20,22,90,0.28); }
.hm-tile--mint { background: var(--brand-mint); min-height: 15rem; }
.hm-tile--peach { background: #FFB784; min-height: 14rem; }
.hm-tile-label { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.75; }
.hm-tile-score { font-family: var(--font-mono); font-weight: 600; font-size: clamp(2rem, 4.4vw, 2.75rem); line-height: 1.05; letter-spacing: -0.04em; margin-top: 0.5rem; }
.hm-tile-letter { font-family: var(--font-display); font-weight: 800; font-size: 4.5rem; line-height: 1; margin-top: 0.25rem; }
.hm-tile-type { font-family: var(--font-display); font-weight: 800; font-size: 1.25rem; }
.hm-tile-note { margin-top: auto; font-size: 11px; opacity: 0.6; }
.hm-pill { display: inline-flex; align-items: center; gap: 0.4rem; align-self: flex-start; padding: 0.3rem 0.7rem; border-radius: 999px; background: #fff; color: #047857; font-size: 12px; font-weight: 800; }
.hm-pill--light { background: rgba(255,255,255,0.16); color: var(--brand-mint); }
.hm-badge { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.125rem; border-radius: 1.25rem; background: var(--brand-navy); color: #fff; box-shadow: 0 18px 40px rgba(20,22,90,0.28); }
.hm-badge-num { font-family: var(--font-display); font-weight: 800; font-size: 2rem; line-height: 1; color: var(--brand-mint); }
.hm-badge-text { font-size: 12px; line-height: 1.4; opacity: 0.9; }
.hm-bubble { align-self: flex-start; padding: 0.7rem 1rem; border-radius: 1rem 1rem 1rem 0.25rem; background: #fff; color: var(--brand-navy); font-size: 13px; line-height: 1.4; box-shadow: 0 12px 30px rgba(20,22,90,0.22); }
.hm-bubble b { color: var(--brand-indigo); }

/* ЛЕНТА С ДОВЕРИЕ */
.hm-trust { background: #fff; border-bottom: 1px solid var(--brand-border); }
.hm-trust-list { list-style: none; margin: 0 auto; padding: 1.25rem 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; justify-content: center; }
.hm-trust-list li { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 14px; font-weight: 700; color: var(--brand-navy); }
.hm-trust-list svg { color: var(--brand-indigo); }

/* ТРИТЕ ВХОДА */
.hm-entries { display: grid; gap: 1.25rem; margin-top: 2.5rem; }
@media (min-width: 860px) { .hm-entries { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.hm-entry { display: flex; flex-direction: column; height: 100%; min-height: 19rem; padding: 2rem; border-radius: 1.5rem; text-decoration: none; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease; }
.hm-entry:hover { transform: translateY(-4px); box-shadow: 0 22px 44px rgba(42,41,82,0.2); }
.hm-entry-icon { display: inline-flex; align-self: flex-start; padding: 0.875rem; border-radius: 1rem; margin-bottom: 1.5rem; }
.hm-entry h3 { margin: 0 0 0.625rem; font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.hm-entry p { margin: 0 0 1.5rem; font-size: 1rem; line-height: 1.6; flex: 1; }
.hm-entry-cta { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 0.9375rem; }
.hm-entry--indigo { background: var(--brand-indigo); color: #fff; }
.hm-entry--indigo .hm-entry-icon { background: rgba(255,255,255,0.16); color: var(--brand-mint); }
.hm-entry--indigo p { color: rgba(255,255,255,0.86); }
.hm-entry--indigo .hm-entry-cta { color: var(--brand-mint); }
.hm-entry--mint { background: var(--brand-mint); color: #1D2939; }
.hm-entry--mint .hm-entry-icon { background: rgba(29,41,57,0.1); }
.hm-entry--mint p { color: rgba(29,41,57,0.82); }
.hm-entry--navy { background: var(--brand-navy); color: #fff; }
.hm-entry--navy .hm-entry-icon { background: rgba(255,255,255,0.12); color: var(--brand-mint); }
.hm-entry--navy p { color: rgba(255,255,255,0.82); }
.hm-entry--navy .hm-entry-cta { color: var(--brand-mint); }

/* ПЪТ */
.hm-split-head { display: grid; gap: 1.25rem; align-items: end; }
@media (min-width: 900px) { .hm-split-head { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 4rem; } }
.hm-path { list-style: none; margin: 3.5rem 0 0; padding: 0; display: grid; gap: 1.25rem; }
@media (min-width: 860px) { .hm-path { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.hm-path-item { position: relative; padding: 1.75rem; border-radius: 1.5rem; background: #fff; border: 1px solid var(--brand-card-border); }
.hm-path-num { position: absolute; top: 1.5rem; right: 1.75rem; font-family: var(--font-mono); font-weight: 600; font-size: 13px; color: var(--brand-muted); }
.hm-path-grade { margin: 0 0 0.5rem; font-size: 13px; font-weight: 800; color: var(--brand-indigo); }
.hm-path-item h3 { margin: 0 0 0.625rem; font-family: var(--font-display); font-size: 1.375rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: var(--brand-text); }
.hm-path-item > p:not(.hm-path-grade) { margin: 0 0 1.5rem; font-size: 1rem; line-height: 1.6; color: var(--brand-muted); }
.hm-link { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; font-size: 0.9375rem; color: var(--brand-indigo); text-decoration: none; border-bottom: 2px solid rgba(70,77,230,0.28); padding-bottom: 0.15rem; transition: border-color 0.2s ease; }
.hm-link:hover { border-bottom-color: var(--brand-indigo); }

/* ЧИСЛА */
.hm-stats { background: var(--brand-indigo); color: #fff; padding: 4rem 0; }
.hm-stats-grid { display: grid; gap: 2rem; text-align: left; }
@media (min-width: 720px) { .hm-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3rem; } }
.hm-stat-num { font-family: var(--font-display); font-weight: 800; font-size: clamp(2.75rem, 6vw, 4.25rem); line-height: 1; letter-spacing: -0.04em; color: var(--brand-mint); }
.hm-stat-label { margin-top: 0.5rem; font-size: 1.125rem; font-weight: 800; }
.hm-stat-sub { margin-top: 0.15rem; font-size: 14px; color: rgba(255,255,255,0.78); }

/* ЗАЩО */
.hm-why { display: grid; gap: 2.5rem 2rem; margin-top: 3rem; }
@media (min-width: 640px) { .hm-why { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1000px) { .hm-why { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.hm-why-icon { display: inline-flex; padding: 0.75rem; border-radius: 0.875rem; background: rgba(70,77,230,0.1); color: var(--brand-indigo); margin-bottom: 1rem; }
.hm-why-item h3 { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: 1.1875rem; font-weight: 800; letter-spacing: -0.015em; color: var(--brand-text); }
.hm-why-item p { margin: 0; font-size: 0.9375rem; line-height: 1.65; color: var(--brand-muted); }

/* СТЪПКИ */
.hm-steps { display: grid; gap: 4rem; margin-top: 3.5rem; }
.hm-step { display: grid; gap: 2rem; align-items: center; }
@media (min-width: 900px) {
  .hm-step { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 5rem; }
  .hm-step--rev .hm-step-text { order: 2; }
}
.hm-step-num { display: block; margin-bottom: 0.75rem; font-family: var(--font-mono); font-weight: 600; font-size: 1.25rem; color: var(--brand-indigo); }
.hm-step-text h3 { margin: 0 0 0.75rem; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.5rem, 3vw, 2.125rem); letter-spacing: -0.025em; line-height: 1.15; color: var(--brand-text); }
.hm-step-text p { margin: 0 0 1.5rem; max-width: 30rem; font-size: 1.0625rem; line-height: 1.65; color: var(--brand-muted); }
.hm-vis { display: flex; flex-direction: column; gap: 0.75rem; padding: 2rem; border-radius: 1.75rem; min-height: 17rem; justify-content: center; }
.hm-vis--indigo { background: var(--brand-indigo); color: #fff; }
.hm-vis--mint { background: var(--brand-mint); color: #1D2939; }
.hm-vis--navy { background: var(--brand-navy); color: #fff; }
.hm-vis-label { font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.75; }
.hm-vis-big { font-family: var(--font-display); font-weight: 800; font-size: 3.5rem; line-height: 1; letter-spacing: -0.04em; }
.hm-vis-big--mono { font-family: var(--font-mono); font-weight: 600; color: var(--brand-mint); }
.hm-vis-text { font-size: 15px; line-height: 1.5; opacity: 0.9; }
.hm-bar { display: grid; grid-template-columns: 1.5rem 1fr; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 14px; }
.hm-bar i { display: block; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.18); overflow: hidden; }
.hm-bar b { display: block; height: 100%; border-radius: 999px; background: var(--brand-mint); }

/* ЧЗВ */
.hm-faq-grid { display: grid; gap: 2.5rem; }
@media (min-width: 900px) { .hm-faq-grid { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: 5rem; } }
.hm-faq-item { border-bottom: 1px solid var(--brand-border); }
.hm-faq-item:first-child { border-top: 1px solid var(--brand-border); }
.hm-faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 0; cursor: pointer; list-style: none; font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; letter-spacing: -0.01em; color: var(--brand-text); }
.hm-faq-item summary::-webkit-details-marker { display: none; }
.hm-faq-item summary svg { flex-shrink: 0; color: var(--brand-indigo); transition: transform 0.25s ease; }
.hm-faq-item[open] summary svg { transform: rotate(45deg); }
.hm-faq-item p { margin: 0 0 1.25rem; max-width: 40rem; font-size: 1rem; line-height: 1.7; color: var(--brand-muted); }

/* ФИНАЛ */
.hm-final { position: relative; overflow: hidden; background: var(--brand-indigo); color: #fff; padding: 5.5rem 0; }
.hm-final-inner { position: relative; }
`;

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function Home() {
    return (
        <div className="landing-page" style={{ background: "var(--brand-bg)", minHeight: "100vh" }}>
            <Seo
                title="Калкулатор за приемен бал и кариерен тест"
                description={`Изчисли приемния си бал по МОН формулите, направи RIASEC кариерен тест и сравни ${UNIVERSITIES} университета — безплатно, на едно място. За ${ADMISSION_YEAR_SHORT} г.`}
                path="/"
            />
            <JsonLd data={HOME_SCHEMA} />
            <style>{CSS}</style>
            <HeroSection />
            <TrustBar />
            <EntriesSection />
            <PathSection />
            <StatsSection />
            <WhySection />
            <StepsSection />
            <FaqSection />
            <CTASection />
        </div>
    );
}
