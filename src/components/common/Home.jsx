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

import {
    Brain,
    Target,
    GraduationCap,
    BarChart3,
    Shield,
    ArrowRight,
    Database,
    BookOpen,
    ChevronDown,
    Calculator,
    BookMarked,
    Smartphone,
    Zap,
    CheckCircle,
    School,
    Compass,
} from "lucide-react";

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

function HeroSection() {
    return (
        <section
            data-testid="hero-section"
            className="relative min-h-screen overflow-hidden"
            style={{ background: "var(--brand-bg)" }}
        >
            <DotsBg cyanOpacity={0.07} violetOpacity={0.05} size={32} />

            {/* ── Layer 2: centred hero text ── */}
            <div
                className="relative max-w-5xl mx-auto px-6 flex flex-col items-center justify-center min-h-screen text-center"
                style={{ zIndex: 3 }}
            >
                <m.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    style={{ width: "100%", zIndex: 3 }}
                >
                    {/* Badge — filled with real data */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 w-fit"
                        style={{
                            background: "rgba(245,181,68,0.08)",
                            border: "1px solid rgba(245,181,68,0.28)",
                            color: "var(--brand-cyan)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        <Zap size={11} />
                        Готови за прием {ADMISSION_YEAR_SHORT} г.
                    </div>

                    {/* Headline */}
                    <h1
                        className="font-bold leading-tight mb-6"
                        style={{
                            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                            color: "var(--brand-text)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.07,
                            textWrap: "balance",
                        }}
                    >
                        Открий своя
                        <br /> път към Университета
                        <span
                            style={{
                                color: "var(--brand-accent-text)",
                            }}
                        >
                            {/* път към Университета */}
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p
                        className="mb-10 leading-relaxed"
                        style={{
                            fontSize: "clamp(1rem, 2vw, 1.125rem)",
                            color: "rgb(203, 213, 225)",
                            maxWidth: "540px",
                            lineHeight: 1.7,
                            margin: "0 auto 2.5rem",
                        }}
                    >
                        Забрави за сложните таблици и неясните критерии. Ние
                        използваме реални данни, за да ти покажем къде имаш шанс.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        {/* Primary — calculator (highest-intent action) */}
                        <m.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
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
                                    boxShadow:
                                        "0 0 32px rgba(245,181,68,0.35), 0 4px 16px rgba(0,0,0,0.2)",
                                    transition: "box-shadow 0.2s",
                                }}
                            >
                                <Calculator size={18} />
                                Изчисли моя бал
                                <ArrowRight size={16} />
                            </Link>
                        </m.div>

                        {/* Secondary — with hover state */}
                        <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/career-advisor/"
                                className="inline-flex items-center gap-2 font-medium"
                                style={{
                                    border: "1px solid var(--brand-border)",
                                    color: "var(--brand-text)",
                                    background: "rgba(255,255,255,0.04)",
                                    padding: "0.9rem 1.75rem",
                                    borderRadius: "0.875rem",
                                    fontSize: "0.9375rem",
                                    textDecoration: "none",
                                    transition: "border-color 0.2s, color 0.2s, background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(245,181,68,0.4)";
                                    e.currentTarget.style.color = "var(--brand-cyan)";
                                    e.currentTarget.style.background = "rgba(245,181,68,0.04)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-border)";
                                    e.currentTarget.style.color = "var(--brand-text)";
                                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                }}
                            >
                                <Brain size={18} />
                                Направи кариерен тест
                                <ArrowRight size={16} />
                            </Link>
                        </m.div>
                    </div>
                </m.div>

            </div>

            {/* Bottom fade into next section */}
            <div
                aria-hidden
                className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                style={{
                    background: "linear-gradient(to bottom, transparent, var(--brand-bg))",
                    zIndex: 4,
                }}
            />

            {/* Scroll indicator — chevron instead of line */}
            <m.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                style={{ zIndex: 5, color: "rgba(148,163,184,0.4)" }}
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            >
                <div style={{
                    width: "1px", height: "20px",
                    background: "linear-gradient(to bottom, transparent, rgba(148,163,184,0.3))",
                }} />
                <ChevronDown size={15} />
            </m.div>
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

const STEPS = [
    {
        num: "01",
        icon: Brain,
        title: "Кариерен Анализ",
        desc: "Попълни научно-валидирания RIASEC тест (базиран на O*NET данни) и открий своя уникален кариерен профил в 6 измерения.",
    },
    {
        num: "02",
        icon: Target,
        title: "Алгоритмичен Подбор",
        desc: `Нашият алгоритъм сравнява профила ти с ${RIASEC_SPECIALTIES} специалности в ${UNIVERSITIES} университета и генерира персонализиран списък.`,
    },
    {
        num: "03",
        icon: GraduationCap,
        title: "Изчисли Приемния Бал",
        desc: "Виж точните изисквания, изчисли конкурсния си бал с калкулатора и разбери дали имаш шанс — преди да е станало.",
    },
];

function HowItWorksSection() {
    return (
        <section
            className="py-28 px-6 relative overflow-hidden"
            style={{ background: "var(--brand-bg)" }}
        >
            <DotsBg cyanOpacity={0.09} violetOpacity={0.06} size={28} />
            <div className="max-w-6xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
                <Reveal className="text-center mb-16">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4"
                        style={{ color: "var(--brand-cyan)" }}>
                        Как работи
                    </p>
                    <h2
                        className="text-3xl md:text-5xl font-bold"
                        style={{
                            color: "var(--brand-text)",
                            letterSpacing: "-0.02em",
                            textWrap: "balance",
                        }}
                    >
                        Три стъпки до правилния избор
                    </h2>
                </Reveal>

                <m.div
                    className="grid md:grid-cols-3 gap-7"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                            <m.div
                                key={step.num}
                                variants={fadeUp}
                                transition={{ duration: 0.5, ease: EASE }}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-2xl"
                                style={{
                                    background: "var(--brand-surface)",
                                    border: "1px solid var(--brand-card-border)",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(245,181,68,0.4)";
                                    e.currentTarget.style.boxShadow = "0 0 28px rgba(245,181,68,0.09)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-card-border)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className="p-3 rounded-xl"
                                        style={{
                                            background: "rgba(245,181,68,0.14)",
                                        }}
                                    >
                                        <Icon size={20} style={{ color: "var(--brand-cyan)" }} />
                                    </div>
                                    <span
                                        className="text-5xl font-black select-none"
                                        style={{ color: "rgba(148,163,184,0.12)", fontFamily: "var(--font-mono)" }}
                                    >
                                        {step.num}
                                    </span>
                                </div>
                                <h3
                                    className="text-lg font-semibold mb-3"
                                    style={{ color: "var(--brand-text)", textWrap: "balance" }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--brand-muted)" }}>
                                    {step.desc}
                                </p>
                            </m.div>
                        );
                    })}
                </m.div>
            </div>
        </section>
    );
}

// ── PATH (образователният път: 7. клас → ДЗИ → университет) ────────────────

const PATH_STAGES = [
    {
        icon: School,
        grade: "7. клас",
        title: "Избери гимназия",
        desc: "Балът ти за всяка паралелка в София, минималните балове от 4 години и помощник за подреждане на желанията.",
        to: "/priem-7-klas/",
        cta: "Прием след 7. клас",
    },
    {
        icon: Compass,
        grade: "10.–11. клас",
        title: "Избери втори ДЗИ",
        desc: "Добави специалностите, които те привличат, и виж коя матура ги държи отворени без изпит.",
        to: "/dzi-strateg/",
        cta: "Кой ДЗИ да избера",
    },
    {
        icon: GraduationCap,
        grade: "12. клас",
        title: "Влез в университет",
        desc: "Точният приемен бал по формулата на всяка специалност и сравнение с минимумите.",
        to: "/calculator/",
        cta: "Изчисли бала си",
    },
];

function PathSection() {
    return (
        <section className="py-24 px-6 relative" style={{ background: "var(--brand-bg)" }}>
            <div className="max-w-6xl mx-auto">
                <Reveal className="text-center mb-12">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--brand-cyan)" }}>
                        Целият път
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--brand-text)", letterSpacing: "-0.02em", textWrap: "balance" }}>
                        От седми клас до студентската скамейка
                    </h2>
                    <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "var(--brand-muted)" }}>
                        Три решения, които определят образованието ти. УниПът помага за всяко от тях.
                    </p>
                </Reveal>
                <m.ol
                    className="grid md:grid-cols-3 gap-5"
                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {PATH_STAGES.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <m.li key={s.to} variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
                                <Link
                                    to={s.to}
                                   
                                    style={{
                                        display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem",
                                        background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)",
                                        borderRadius: "1.25rem", textDecoration: "none", color: "inherit",
                                        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(245,181,68,0.4)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--brand-card-border)"; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                                        <div className="inline-flex p-3 rounded-xl" style={{ background: "rgba(245,181,68,0.12)" }}>
                                            <Icon size={20} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} aria-hidden="true" />
                                        </div>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 800, color: "var(--brand-muted)" }}>
                                            {String(i + 1).padStart(2, "0")} · {s.grade}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--brand-text)", textWrap: "balance" }}>
                                        {s.title}
                                    </h3>
                                    <p style={{ margin: "0 0 1.25rem", fontSize: "14px", lineHeight: 1.65, color: "var(--brand-muted)", flex: 1 }}>
                                        {s.desc}
                                    </p>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "14px", fontWeight: 700, color: "var(--brand-cyan)" }}>
                                        {s.cta} <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                                    </span>
                                </Link>
                            </m.li>
                        );
                    })}
                </m.ol>
            </div>
        </section>
    );
}

// ── FEATURES ────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: BarChart3,
        title: "Реалистични Шансове",
        desc: "Показваме реални приемни балове от официалните данни на МОН — без приукрасяване.",
    },
    {
        icon: Brain,
        title: "RIASEC Психометрия",
        desc: "Научно-валидирана методология (Holland Codes), използвана от O*NET — открий кариерния си тип.",
    },
    {
        icon: Shield,
        title: "Официална Интеграция",
        desc: DATA_FRESHNESS_NOTE,
    },
    {
        icon: Calculator,
        title: "Прецизен Калкулатор",
        desc: "Въведи оценките си и виж точния конкурсен бал по официалната формула за всяка специалност.",
    },
    {
        icon: Smartphone,
        title: "Работи Навсякъде",
        desc: "Оптимизиран за телефон, таблет и компютър. Тъмна  тема за комфортна работа по всяко време.",
    },
    {
        icon: BookMarked,
        title: "Запази и Сравни",
        desc: "Добавяй специалности в любими и сравнявай шансовете си в различни университети и градове.",
    },
];

function FeaturesSection() {
    return (
        <section className="py-28 px-6 relative overflow-hidden" style={{ background: "var(--brand-bg-alt)" }}>
            <DotsBg cyanOpacity={0.06} violetOpacity={0.09} size={30} />
            <div className="max-w-6xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
                <Reveal className="text-center mb-16">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4"
                        style={{ color: "var(--brand-violet)" }}>
                        Характеристики
                    </p>
                    <h2
                        className="text-3xl md:text-5xl font-bold"
                        style={{
                            color: "var(--brand-text)",
                            letterSpacing: "-0.02em",
                            textWrap: "balance",
                        }}
                    >
                        Създаден за сериозни избори
                    </h2>
                    <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "var(--brand-muted)" }}>
                        Не просто калкулатор. Цялостна платформа за информирано кандидатстване.
                    </p>
                </Reveal>

                <m.div
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <m.div
                                key={f.title}
                                variants={fadeUp}
                                transition={{ duration: 0.5, ease: EASE }}
                                whileHover={{ y: -4 }}
                                className="p-6 rounded-2xl"
                                style={{
                                    background: "var(--brand-surface)",
                                    border: "1px solid var(--brand-card-border)",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(245,181,68,0.35)";
                                    e.currentTarget.style.boxShadow = "0 0 24px rgba(245,181,68,0.07)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-card-border)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl mb-4"
                                    style={{
                                        background: "rgba(245,181,68,0.12)",
                                    }}
                                >
                                    <Icon size={20} style={{ color: "var(--brand-violet)" }} />
                                </div>
                                <h3
                                    className="font-semibold mb-2"
                                    style={{ color: "var(--brand-text)", fontSize: "16px", textWrap: "balance" }}
                                >
                                    {f.title}
                                </h3>
                                <p style={{ color: "var(--brand-muted)", fontSize: "14px", lineHeight: "1.65" }}>
                                    {f.desc}
                                </p>
                            </m.div>
                        );
                    })}
                </m.div>
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
