import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

// Heavy 3D components — lazy loaded so they never block first paint
const HolographicEarth = lazy(() => import("@/components/landing/HolographicEarth"));
const GlobeScene        = lazy(() => import("@/components/landing/GlobeScene"));
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
} from "lucide-react";

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
            {/* ── Layer 0: dot grid background ── */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(148,163,184,0.055) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* ── Layer 1: noise grain overlay ── */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    opacity: 0.028,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* ── Layer 2: hero text — single column, left-aligned ── */}
            <div
                className="relative max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center min-h-screen"
                style={{ zIndex: 2 }}
            >
                {/* ── Left: text content ── */}
                <m.div
                    className="flex-1 flex flex-col justify-center py-32 lg:py-0 text-left"
                    initial={{ opacity: 0, x: -36 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    style={{ maxWidth: "600px", zIndex: 2 }}
                >
                    {/* Badge — filled with real data */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 w-fit"
                        style={{
                            background: "rgba(6,182,212,0.08)",
                            border: "1px solid rgba(6,182,212,0.28)",
                            color: "var(--brand-cyan)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        <Zap size={11} />
                        127 специалности · 18 университета · Безплатно
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
                        <br />
                        <span
                            style={{
                                background: "linear-gradient(130deg, #06B6D4 0%, #8B5CF6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            път към Университета
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p
                        className="mb-10 leading-relaxed"
                        style={{
                            fontSize: "clamp(1rem, 2vw, 1.125rem)",
                            color: "var(--brand-muted)",
                            maxWidth: "460px",
                            lineHeight: 1.7,
                        }}
                    >
                        Забрави за сложните таблици и неясните критерии. Ние
                        използваме реални данни, за да ти покажем къде имаш шанс.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Primary — calculator (highest-intent action) */}
                        <m.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/calculator"
                                className="inline-flex items-center gap-3 font-semibold"
                                style={{
                                    background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
                                    color: "#fff",
                                    padding: "0.9rem 1.75rem",
                                    borderRadius: "0.875rem",
                                    fontSize: "0.9375rem",
                                    textDecoration: "none",
                                    boxShadow:
                                        "0 0 32px rgba(6,182,212,0.35), 0 4px 16px rgba(0,0,0,0.2)",
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
                                to="/career-advisor"
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
                                    e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)";
                                    e.currentTarget.style.color = "var(--brand-cyan)";
                                    e.currentTarget.style.background = "rgba(6,182,212,0.04)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-border)";
                                    e.currentTarget.style.color = "var(--brand-text)";
                                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                }}
                            >
                                <Brain size={18} />
                                Направи RIASEC тест
                                <ArrowRight size={16} />
                            </Link>
                        </m.div>
                    </div>
                </m.div>

                {/* ── Right: Holographic Earth — desktop only ── */}
                <m.div
                    className="hidden lg:flex flex-1 items-center justify-center"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
                    aria-hidden
                    style={{ minHeight: "540px", maxWidth: "580px" }}
                >
                    {/* Outer glow ring */}
                    <div style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "560px",
                        aspectRatio: "1/1",
                    }}>
                        {/* Ambient glow behind the globe */}
                        <div style={{
                            position: "absolute",
                            inset: "10%",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)",
                            filter: "blur(24px)",
                            pointerEvents: "none",
                        }} />
                        <Suspense fallback={
                            <div style={{
                                width: "100%", height: "100%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <div style={{
                                    width: "200px", height: "200px", borderRadius: "50%",
                                    border: "1px solid rgba(6,182,212,0.2)",
                                    background: "radial-gradient(circle, rgba(6,182,212,0.05), transparent)",
                                    animation: "spin 3s linear infinite",
                                }} />
                            </div>
                        }>
                            <HolographicEarth style={{ width: "100%", height: "100%" }} />
                        </Suspense>
                    </div>
                </m.div>

            </div>

            {/* Bottom fade into next section */}
            <div
                aria-hidden
                className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                    background: "linear-gradient(to bottom, transparent, var(--brand-bg))",
                    zIndex: 3,
                }}
            />

            {/* Scroll indicator — chevron instead of line */}
            <m.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                style={{ zIndex: 4, color: "rgba(148,163,184,0.4)" }}
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
    { value: 127, suffix: "+", label: "специалности", sub: "в базата данни" },
    { value: 18,  suffix: "",  label: "университета",  sub: "от цяла България" },
    { value: 6,   suffix: "",  label: "RIASEC типа",   sub: "кариерен профил" },
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
                fontFamily: "monospace",
                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
        title: "Психометричен Анализ",
        desc: "Попълни научно-валидирания RIASEC тест (базиран на O*NET данни) и открий своя уникален кариерен профил в 6 измерения.",
    },
    {
        num: "02",
        icon: Target,
        title: "Алгоритмичен Подбор",
        desc: "Нашият алгоритъм сравнява профила ти с над 127 специалности в 18 университета и генерира персонализиран списък.",
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
            className="py-28 px-6"
            style={{ background: "var(--brand-bg)" }}
        >
            <div className="max-w-6xl mx-auto">
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
                                    e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)";
                                    e.currentTarget.style.boxShadow = "0 0 28px rgba(6,182,212,0.09)";
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
                                            background: "linear-gradient(135deg, rgba(6,182,212,0.14), rgba(139,92,246,0.14))",
                                        }}
                                    >
                                        <Icon size={20} style={{ color: "var(--brand-cyan)" }} />
                                    </div>
                                    <span
                                        className="text-5xl font-black select-none"
                                        style={{ color: "rgba(148,163,184,0.12)", fontFamily: "monospace" }}
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
        desc: "Всички данни са от публичните регистри на Министерство на Образованието, актуализирани за 2025 г.",
    },
    {
        icon: Calculator,
        title: "Прецизен Калкулатор",
        desc: "Въведи оценките си и виж точния конкурсен бал по официалната формула за всяка специалност.",
    },
    {
        icon: Smartphone,
        title: "Работи Навсякъде",
        desc: "Оптимизиран за телефон, таблет и компютър. Тъмна и светла тема за комфортна работа по всяко време.",
    },
    {
        icon: BookMarked,
        title: "Запази и Сравни",
        desc: "Добавяй специалности в любими и сравнявай шансовете си в различни университети и градове.",
    },
];

function FeaturesSection() {
    return (
        <section className="py-28 px-6" style={{ background: "var(--brand-bg-alt)" }}>
            <div className="max-w-6xl mx-auto">
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
                                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)";
                                    e.currentTarget.style.boxShadow = "0 0 24px rgba(139,92,246,0.07)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-card-border)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl mb-4"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12))",
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

// ── TRUST ───────────────────────────────────────────────────────────────────

const TRUST = [
    {
        icon: Database,
        label: "O*NET Professional",
        sub: "Научна основа за RIASEC",
    },
    {
        icon: BookOpen,
        label: "Holland Codes",
        sub: "Валидирана психометрия",
    },
    {
        icon: Shield,
        label: "Данни от МОН",
        sub: "Официална интеграция",
    },
    {
        icon: CheckCircle,
        label: "Актуално за 2025 г.",
        sub: "Редовно обновявани данни",
    },
];

function TrustSection() {
    return (
        <section
            className="py-28 px-6"
            style={{
                background: "var(--brand-bg)",
                borderTop: "1px solid var(--brand-border)",
            }}
        >
            <div className="max-w-4xl mx-auto">
                <Reveal className="text-center mb-12">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4"
                        style={{ color: "var(--brand-muted)" }}>
                        Защо ни се доверяват
                    </p>
                    <h2
                        className="text-2xl md:text-4xl font-bold"
                        style={{
                            color: "var(--brand-text)",
                            letterSpacing: "-0.02em",
                            textWrap: "balance",
                        }}
                    >
                        Изграден върху наука, не на интуиция
                    </h2>
                </Reveal>

                <m.div
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                >
                    {TRUST.map((item) => {
                        const Icon = item.icon;
                        return (
                            <m.div
                                key={item.label}
                                variants={fadeUp}
                                transition={{ duration: 0.5, ease: EASE }}
                                className="text-center p-6 rounded-2xl"
                                style={{
                                    background: "var(--brand-surface)",
                                    border: "1px solid var(--brand-card-border)",
                                }}
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl mb-3"
                                    style={{ background: "rgba(6,182,212,0.09)" }}
                                >
                                    <Icon size={20} style={{ color: "var(--brand-cyan)" }} />
                                </div>
                                <p className="font-semibold text-sm" style={{ color: "var(--brand-text)" }}>
                                    {item.label}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "var(--brand-muted)" }}>
                                    {item.sub}
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
    // Only load Globe on desktop to reduce mobile render overhead
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const { user } = useAuth();

    return (
        <section
            className="relative overflow-hidden"
            style={{ background: "var(--brand-bg-alt)", minHeight: "560px" }}
        >
            {/* ── Three.js globe — absolute right side, behind all text — desktop only ── */}
            {isDesktop && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "50%",
                        right: "-8%",
                        transform: "translateY(-50%)",
                        width: "min(620px, 65vw)",
                        height: "min(620px, 65vw)",
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
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(148,163,184,0.05) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

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
                                    background: "linear-gradient(130deg, #06B6D4, #8B5CF6)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
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
                                    to="/calculator"
                                    className="inline-flex items-center gap-3 font-semibold"
                                    style={{
                                        background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
                                        color: "#fff",
                                        padding: "0.9rem 1.75rem",
                                        borderRadius: "0.875rem",
                                        fontSize: "0.9375rem",
                                        textDecoration: "none",
                                        boxShadow: "0 0 40px rgba(6,182,212,0.28)",
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
                                        e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                                        e.currentTarget.style.color = "var(--brand-violet)";
                                        e.currentTarget.style.background = "rgba(139,92,246,0.04)";
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
            <HeroSection />
            <StatStripSection />
            <HowItWorksSection />
            <FeaturesSection />
            <TrustSection />
            <CTASection />
        </div>
    );
}
