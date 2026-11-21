import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { UNIVERSITIES, SPECIALTIES, CAREERS, RIASEC_SPECIALTIES, ADMISSION_YEAR_SHORT, DATA_FRESHNESS_NOTE } from "@/lib/siteStats";

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

import { Brain, ArrowRight, Calculator, TrendingUp } from "lucide-react";

// GlobeScene for CTASection — lazy loaded
const GlobeScene = lazy(() => import("@/components/landing/GlobeScene"));

// ── Gradient dot grid background ────────────────────────────────────────────
function DotsBg({ cyanOpacity = 0.1, violetOpacity = 0.07, size = 26 }) {
    return (
        <div
            aria-hidden
            style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(circle, rgba(245,181,68,${cyanOpacity}) 1px, transparent 1px), radial-gradient(circle, rgba(245,181,68,${violetOpacity}) 1px, transparent 1px)`,
                backgroundSize: `${size}px ${size}px, ${size}px ${size}px`,
                backgroundPosition: `0 0, ${size / 2}px ${size / 2}px`,
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    );
}

// ── Animation primitives ────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(query);
        setMatches(mq.matches);
        const listener = (e) => setMatches(e.matches);
        mq.addEventListener("change", listener);
        return () => mq.removeEventListener("change", listener);
    }, [query]);
    return matches;
}

function Reveal({ children, delay = 0, className }) {
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
        >
            {children}
        </m.div>
    );
}

// ── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(end, duration = 1400, trigger) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!trigger) return;
        let startTime = null;
        const raf = (ts) => {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
            setValue(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(raf);
            else setValue(end);
        };
        requestAnimationFrame(raf);
    }, [trigger, end, duration]);
    return value;
}

// ── HERO ────────────────────────────────────────────────────────────────────
// Асиметричен: текст вляво, пример за резултат вдясно (показва какво получаваш, преди да поискаме нещо).

const EXAMPLE_GRADES = [
    { label: "ДЗИ по български език", value: "5.50" },
    { label: "ДЗИ по втори предмет", value: "5.00" },
    { label: "Диплома за средно образование", value: "5.60" },
];

function ResultPreview() {
    const score = useCountUp(512, 1100, true);
    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
            className="rounded-2xl w-full"
            style={{
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-card-border)",
                padding: "1.75rem",
                maxWidth: "26rem",
                justifySelf: "end",
            }}
            aria-label="Пример за изчислен приемен бал"
        >
            <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--brand-accent-text)" }}>
                    Така изглежда резултатът
                </span>
                <span style={{ fontSize: "11px", color: "var(--brand-muted)" }}>примерни данни</span>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "var(--brand-muted)" }}>Приемен бал</p>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "3.5rem", lineHeight: 1.05, letterSpacing: "-0.04em", color: "var(--brand-text)", margin: "0.25rem 0 0.875rem" }}>
                {score}
                <span style={{ color: "var(--brand-muted)" }}>.40</span>
            </div>
            <span
                className="inline-flex items-center gap-2"
                style={{ background: "rgba(16,185,129,0.14)", color: "#34d399", fontSize: "13px", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "999px" }}
            >
                <TrendingUp size={14} strokeWidth={1.5} aria-hidden="true" />
                Над средното с 32 точки
            </span>

            <dl style={{ margin: "1.5rem 0 0", borderTop: "1px solid var(--brand-border)" }}>
                {EXAMPLE_GRADES.map((g) => (
                    <div key={g.label} className="flex items-baseline justify-between" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--brand-border)" }}>
                        <dt style={{ fontSize: "14px", color: "var(--brand-muted)" }}>{g.label}</dt>
                        <dd style={{ margin: 0, fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "14px", color: "var(--brand-text)" }}>{g.value}</dd>
                    </div>
                ))}
            </dl>
            <p style={{ margin: "1rem 0 0", fontSize: "12px", lineHeight: 1.6, color: "var(--brand-muted)" }}>
                За всяка специалност виждаш точната формула и коефициентите, не само числото.
            </p>
        </m.div>
    );
}

function HeroSection() {
    return (
        <section
            data-testid="hero-section"
            className="relative overflow-hidden"
            style={{ background: "var(--brand-bg)" }}
        >
            <DotsBg cyanOpacity={0.07} violetOpacity={0.05} size={32} />

            <div
                className="relative max-w-6xl mx-auto px-6 grid items-center gap-14 lg:gap-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                style={{ zIndex: 3, paddingTop: "9rem", paddingBottom: "6rem" }}
            >
                <m.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                >
                    <p
                        style={{
                            margin: "0 0 1.5rem",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--brand-accent-text)",
                        }}
                    >
                        Готови за прием {ADMISSION_YEAR_SHORT} г.
                    </p>

                    <h1
                        className="font-bold"
                        style={{
                            margin: "0 0 1.5rem",
                            fontSize: "clamp(2.5rem, 5.6vw, 4.25rem)",
                            color: "var(--brand-text)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.06,
                            textWrap: "balance",
                        }}
                    >
                        Открий своя
                        <br /> път към Университета
                    </h1>

                    <p
                        style={{
                            fontSize: "clamp(1.0625rem, 2vw, 1.25rem)",
                            color: "rgb(203, 213, 225)",
                            maxWidth: "34rem",
                            lineHeight: 1.65,
                            margin: "0 0 2.25rem",
                        }}
                    >
                        Забрави за сложните таблици и неясните критерии. Ние
                        използваме реални данни, за да ти покажем къде имаш шанс.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <m.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/calculator/"
                                className="inline-flex items-center justify-center gap-3 font-semibold w-full sm:w-auto"
                                style={{
                                    background: "var(--brand-accent)",
                                    color: "var(--brand-accent-ink)",
                                    padding: "0.9rem 1.75rem",
                                    minHeight: "3.25rem",
                                    borderRadius: "0.875rem",
                                    fontSize: "0.9375rem",
                                    textDecoration: "none",
                                }}
                            >
                                <Calculator size={18} strokeWidth={1.5} />
                                Изчисли моя бал
                                <ArrowRight size={16} strokeWidth={1.5} />
                            </Link>
                        </m.div>

                        <Link
                            to="/career-advisor/"
                            className="inline-flex items-center gap-2 font-semibold"
                            style={{
                                color: "var(--brand-text)",
                                fontSize: "0.9375rem",
                                textDecoration: "underline",
                                textDecorationColor: "rgba(245,181,68,0.5)",
                                textUnderlineOffset: "0.35em",
                                padding: "0.75rem 0.25rem",
                            }}
                        >
                            <Brain size={18} strokeWidth={1.5} />
                            Направи кариерен тест
                        </Link>
                    </div>

                    <p style={{ margin: "1.75rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                        Безплатно · Данни от официалните наредби на МОН
                    </p>
                </m.div>

                <ResultPreview />
            </div>
        </section>
    );
}

// ── STAT STRIP ───────────────────────────────────────────────────────────────

const STATS = [
    { value: SPECIALTIES,  suffix: "", label: "различни специалности", sub: "в базата данни" },
    { value: UNIVERSITIES, suffix: "", label: "университета",           sub: "от цяла България" },
    { value: CAREERS,      suffix: "", label: "професии",                sub: "кариерен профил" },
    { value: 100, suffix: "%", label: "безплатно",     sub: "без скрити такси" },
];

function StatItem({ value, suffix, label, sub, delay, trigger }) {
    const count = useCountUp(value, 1400, trigger);
    return (
        <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={trigger ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay, ease: EASE }}
            style={{ textAlign: "center", padding: "2rem 1rem" }}
        >
            <div style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                fontFamily: "var(--font-mono)",
                color: "var(--brand-accent-text)",
            }}>
                {count}{suffix}
            </div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--brand-text)", marginTop: "0.4rem" }}>
                {label}
            </div>
            <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--brand-muted)", marginTop: "0.125rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {sub}
            </div>
        </m.div>
    );
}

function StatStripSection() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <section
            ref={ref}
            style={{
                background: "var(--brand-bg)",
                borderTop: "1px solid var(--brand-border)",
                borderBottom: "1px solid var(--brand-border)",
            }}
        >
            <div className="stat-strip-grid" style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }}>
                {STATS.map((stat, i) => (
                    <div key={stat.label} className={`stat-col stat-col-${i}`}>
                        <StatItem {...stat} delay={i * 0.07} trigger={inView} />
                    </div>
                ))}
            </div>
            <style>{`
                .stat-strip-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
                .stat-col { border-right: 1px solid var(--brand-border); }
                .stat-col:last-child { border-right: none; }
                @media (max-width: 640px) {
                    .stat-strip-grid { grid-template-columns: repeat(2, 1fr); }
                    .stat-col-1 { border-right: none; }
                    .stat-col-2 { border-top: 1px solid var(--brand-border); }
                    .stat-col-3 { border-top: 1px solid var(--brand-border); border-right: none; }
                }
                @keyframes uniput-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
            `}</style>
        </section>
    );
}

// ── HOW IT WORKS ────────────────────────────────────────────────────────────
// Заглавие вляво (залепено), стъпки вдясно като списък с линии — без карти и икони.

const STEPS = [
    {
        num: "01",
        title: "Кариерен анализ",
        desc: "Попълни научно-валидирания RIASEC тест (базиран на O*NET данни) и открий своя кариерен профил в 6 измерения.",
    },
    {
        num: "02",
        title: "Подбор на специалности",
        desc: `Профилът ти се сравнява с ${RIASEC_SPECIALTIES} специалности в ${UNIVERSITIES} университета и получаваш личен списък.`,
    },
    {
        num: "03",
        title: "Изчисли приемния бал",
        desc: "Виж точните изисквания, изчисли конкурсния си бал с калкулатора и разбери дали имаш шанс — преди да е станало.",
    },
];

function SectionHeading({ eyebrow, children, sub }) {
    return (
        <>
            <p style={{ margin: "0 0 1rem", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-accent-text)" }}>
                {eyebrow}
            </p>
            <h2
                className="font-bold"
                style={{ margin: 0, fontSize: "clamp(1.875rem, 3.6vw, 3rem)", color: "var(--brand-text)", letterSpacing: "-0.025em", lineHeight: 1.1, textWrap: "balance" }}
            >
                {children}
            </h2>
            {sub && (
                <p style={{ margin: "1.25rem 0 0", fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--brand-muted)", maxWidth: "26rem" }}>
                    {sub}
                </p>
            )}
        </>
    );
}

function HowItWorksSection() {
    return (
        <section className="px-6 relative" style={{ background: "var(--brand-bg)", paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
            <div className="max-w-6xl mx-auto grid gap-12 lg:gap-24 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
                <Reveal className="lg:sticky lg:self-start lg:top-28">
                    <SectionHeading eyebrow="Как работи" sub="От интересите ти до конкретен бал за конкретна специалност.">
                        Три стъпки до правилния избор
                    </SectionHeading>
                </Reveal>

                <m.ol
                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {STEPS.map((step) => (
                        <m.li
                            key={step.num}
                            variants={fadeUp}
                            transition={{ duration: 0.5, ease: EASE }}
                            className="grid gap-5 sm:gap-8 sm:grid-cols-[4rem_minmax(0,1fr)]"
                            style={{ borderTop: "1px solid var(--brand-border)", padding: "2rem 0 2.25rem" }}
                        >
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 600, color: "var(--brand-accent-text)", lineHeight: 1.2 }}>
                                {step.num}
                            </span>
                            <div>
                                <h3 style={{ margin: "0 0 0.625rem", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--brand-text)", lineHeight: 1.2 }}>
                                    {step.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--brand-muted)", maxWidth: "36rem" }}>
                                    {step.desc}
                                </p>
                            </div>
                        </m.li>
                    ))}
                </m.ol>
            </div>
        </section>
    );
}

// ── PATH (образователният път: 7. клас → ДЗИ → университет) ────────────────
// Хоризонтален път с три спирки, свързани с една линия; последната е запълнена.

const PATH_STAGES = [
    {
        grade: "7. клас",
        title: "Избери гимназия",
        desc: "Балът ти за всяка паралелка в София, минималните балове от 4 години и помощник за подреждане на желанията.",
        to: "/priem-7-klas/",
        cta: "Прием след 7. клас",
    },
    {
        grade: "10.–11. клас",
        title: "Избери втори ДЗИ",
        desc: "Добави специалностите, които те привличат, и виж коя матура ги държи отворени без изпит.",
        to: "/dzi-strateg/",
        cta: "Кой ДЗИ да избера",
    },
    {
        grade: "12. клас",
        title: "Влез в университет",
        desc: "Точният приемен бал по формулата на всяка специалност и сравнение с минимумите.",
        to: "/calculator/",
        cta: "Изчисли бала си",
    },
];

function PathSection() {
    return (
        <section className="px-6 relative" style={{ background: "var(--brand-bg-alt)", paddingTop: "5rem", paddingBottom: "7rem" }}>
            <div className="max-w-6xl mx-auto">
                <Reveal className="grid gap-6 lg:gap-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end" >
                    <div>
                        <SectionHeading eyebrow="Целият път">
                            От седми клас до студентската скамейка
                        </SectionHeading>
                    </div>
                    <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--brand-muted)", maxWidth: "26rem" }}>
                        Три решения, които определят образованието ти. УниПът помага за всяко от тях.
                    </p>
                </Reveal>

                <m.ol
                    className="path-list"
                    style={{ listStyle: "none", margin: "4rem 0 0", padding: 0 }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {PATH_STAGES.map((s, i) => {
                        const last = i === PATH_STAGES.length - 1;
                        return (
                            <m.li key={s.to} variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="path-li">
                                <span
                                    aria-hidden
                                    className="path-dot"
                                    style={{
                                        background: last ? "var(--brand-accent)" : "var(--brand-bg-alt)",
                                        border: "2px solid var(--brand-accent)",
                                    }}
                                />
                                <p style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--brand-accent-text)" }}>
                                    {s.grade}
                                </p>
                                <h3 style={{ margin: "0 0 0.625rem", fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--brand-text)", lineHeight: 1.2 }}>
                                    {s.title}
                                </h3>
                                <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", lineHeight: 1.65, color: "var(--brand-muted)" }}>
                                    {s.desc}
                                </p>
                                <Link
                                    to={s.to}
                                    className="path-cta inline-flex items-center gap-2 font-semibold"
                                    style={{ fontSize: "0.9375rem", color: "var(--brand-text)", textDecoration: "none", borderBottom: "1px solid rgba(245,181,68,0.5)", paddingBottom: "0.2rem" }}
                                >
                                    {s.cta} <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                                </Link>
                            </m.li>
                        );
                    })}
                </m.ol>
            </div>
            <style>{`
                .path-li { position: relative; padding: 1.75rem 0 2.5rem 2rem; border-left: 1px solid var(--brand-border); }
                .path-dot { position: absolute; left: -6px; top: 2rem; width: 11px; height: 11px; border-radius: 50%; }
                .path-cta:hover { border-bottom-color: var(--brand-accent); }
                @media (min-width: 768px) {
                    .path-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.5rem; border-top: 1px solid var(--brand-border); }
                    .path-li { padding: 2.25rem 0 0; border-left: none; }
                    .path-dot { left: 0; top: -6px; }
                }
            `}</style>
        </section>
    );
}

// ── TRUST / FEATURES ────────────────────────────────────────────────────────
// Четири факта в ред под заглавие — без карти и икони.

const FEATURES = [
    {
        title: "Реалистични шансове",
        desc: "Показваме реални приемни балове от официалните данни на МОН — без приукрасяване.",
    },
    {
        title: "RIASEC психометрия",
        desc: "Научно-валидирана методология (Holland Codes), използвана от O*NET — открий кариерния си тип.",
    },
    {
        title: "Официални данни",
        desc: DATA_FRESHNESS_NOTE,
    },
    {
        title: "Запази и сравни",
        desc: "Добавяй специалности в любими и сравнявай шансовете си в различни университети и градове.",
    },
];

function FeaturesSection() {
    return (
        <section className="px-6 relative" style={{ background: "var(--brand-bg)", paddingTop: "5.5rem", paddingBottom: "6rem" }}>
            <div className="max-w-6xl mx-auto">
                <Reveal>
                    <div style={{ maxWidth: "40rem" }}>
                        <SectionHeading eyebrow="Данни и доверие" sub="Не просто калкулатор. Цялостна платформа за информирано кандидатстване.">
                            Създаден за сериозни избори
                        </SectionHeading>
                    </div>
                </Reveal>

                <m.dl
                    className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
                    style={{ margin: "3.5rem 0 0" }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {FEATURES.map((f) => (
                        <m.div
                            key={f.title}
                            variants={fadeUp}
                            transition={{ duration: 0.5, ease: EASE }}
                            style={{ borderTop: "2px solid var(--brand-accent)", paddingTop: "1.25rem" }}
                        >
                            <dt style={{ fontSize: "1.1875rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--brand-text)", fontFamily: "var(--font-display)" }}>
                                {f.title}
                            </dt>
                            <dd style={{ margin: "0.625rem 0 0", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--brand-muted)" }}>
                                {f.desc}
                            </dd>
                        </m.div>
                    ))}
                </m.dl>
            </div>
        </section>
    );
}

// ── FINAL CTA ────────────────────────────────────────────────────────────────

function CTASection() {
    const { user } = useAuth();
    const sectionRef = useRef(null);
    const [globeReady, setGlobeReady] = useState(false);
    // Skip loading Three.js globe entirely on small screens — saves ~600KB parse on mobile
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        if (!isDesktop) return; // never mount globe on mobile
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setGlobeReady(true); obs.disconnect(); } },
            { rootMargin: "300px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [isDesktop]);

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden"
            style={{ background: "var(--brand-bg-alt)", minHeight: "560px" }}
        >
            {/* ── Three.js globe — only mounted once section nears viewport ── */}
            {globeReady && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "50%",
                        right: "5%",
                        transform: "translateY(-50%)",
                        width: "min(480px, 42vw)",
                        height: "min(480px, 42vw)",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    <Suspense fallback={null}>
                        <GlobeScene style={{ width: "100%", height: "100%" }} />
                    </Suspense>
                </div>
            )}

            {/* Edge fade — seamlessly blends globe into bg on the right */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, var(--brand-bg-alt) 35%, transparent 65%, var(--brand-bg-alt) 100%)",
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            />
            {/* Top + bottom fades */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, var(--brand-bg-alt) 0%, transparent 15%, transparent 85%, var(--brand-bg-alt) 100%)",
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            />

            {/* Dot grid */}
            <DotsBg cyanOpacity={0.08} violetOpacity={0.07} size={30} />

            {/* ── Text content — left-aligned on desktop, centred on mobile ── */}
            <div
                className="relative max-w-6xl mx-auto px-6 py-28"
                style={{ zIndex: 2 }}
            >
                <div style={{ maxWidth: "640px" }}>
                    <Reveal>
                        <p
                            className="text-xs font-bold tracking-widest uppercase mb-5"
                            style={{ color: "var(--brand-cyan)" }}
                        >
                            {user ? "Продължи пътя си" : "Започни сега"}
                        </p>
                        <h2
                            className="text-4xl md:text-6xl font-bold mb-6"
                            style={{
                                color: "var(--brand-text)",
                                letterSpacing: "-0.03em",
                                textWrap: "balance",
                                lineHeight: 1.05,
                            }}
                        >
                            Готов ли си да
                            <br />
                            <span
                                style={{
                                    color: "var(--brand-accent-text)",
                                }}
                            >
                                откриеш своя път?
                            </span>
                        </h2>

                        <p
                            className="text-lg mb-10"
                            style={{ color: "var(--brand-muted)", maxWidth: "480px", lineHeight: 1.7 }}
                        >
                            {user
                                ? "Изчисли бал за твоите специалности, направи кариерния тест и сравни университетите."
                                : "Присъедини се към учениците, които вземат информирани решения за своето бъдеще — напълно безплатно."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <m.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    to="/calculator/"
                                    className="inline-flex items-center gap-3 font-semibold"
                                    style={{
                                        background: "var(--brand-accent)",
                                        color: "var(--brand-accent-ink)",
                                        padding: "0.9rem 1.75rem",
                                        borderRadius: "0.875rem",
                                        fontSize: "0.9375rem",
                                        textDecoration: "none",
                                        boxShadow: "0 0 40px rgba(245,181,68,0.28)",
                                    }}
                                >
                                    {user ? "Изчисли моя бал" : "Започни безплатно"}
                                    <ArrowRight size={16} />
                                </Link>
                            </m.div>

                            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    to={user ? "/career-advisor" : "/universities"}
                                    className="inline-flex items-center gap-2 font-medium"
                                    style={{
                                        border: "1px solid var(--brand-border)",
                                        color: "var(--brand-text)",
                                        background: "rgba(255,255,255,0.03)",
                                        padding: "0.9rem 1.75rem",
                                        borderRadius: "0.875rem",
                                        fontSize: "0.9375rem",
                                        textDecoration: "none",
                                        transition: "border-color 0.2s, color 0.2s, background 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(245,181,68,0.4)";
                                        e.currentTarget.style.color = "var(--brand-violet)";
                                        e.currentTarget.style.background = "rgba(245,181,68,0.04)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--brand-border)";
                                        e.currentTarget.style.color = "var(--brand-text)";
                                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                    }}
                                >
                                    {user ? "Направи кариерен тест" : "Разгледай университетите"}
                                </Link>
                            </m.div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function Home() {
    return (
        <div
            className="landing-page"
            style={{ background: "var(--brand-bg)", minHeight: "100vh" }}
        >
            <Seo
                title="Калкулатор за приемен бал и кариерен тест"
                description={`Изчисли приемния си бал по МОН формулите, направи RIASEC кариерен тест и сравни ${UNIVERSITIES} университета — безплатно, на едно място. За ${ADMISSION_YEAR_SHORT} г.`}
                path="/"
            />
            <JsonLd data={HOME_SCHEMA} />
            <HeroSection />
            <StatStripSection />
            <HowItWorksSection />
            <PathSection />
            <FeaturesSection />
            <CTASection />
        </div>
    );
}
