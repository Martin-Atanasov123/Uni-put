import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { m, useInView } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

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

// GlobeScene for CTASection — lazy loaded
const GlobeScene = lazy(() => import("@/components/landing/GlobeScene"));

// AnoAI aurora shader — lazy loaded (Three.js chunk, shared with GlobeScene)
const AnoAI = lazy(() => import("@/components/landing/AnoAI"));

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
            {/* ── Layer 0: AnoAI shader — само в долната половина ── */}
            <Suspense fallback={null}>
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "0%", bottom: 0, left: 0, right: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                        filter: "blur(2.5px)",
                        transform: "scale(1.02)",
                    }}
                >
                    <AnoAI style={{ position: "absolute", inset: 0 }} />
                </div>
            </Suspense>

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
                        Изцяло обновени данни за 2026 г.
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
                                background: "linear-gradient(130deg, #06B6D4 0%, #8B5CF6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
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
    { value: 250, suffix: "+", label: "специалности", sub: "в базата данни" },
    { value: 47,  suffix: "",  label: "университета",  sub: "от цяла България" },
    { value: 999,   suffix: "+",  label: "професии ",   sub: "кариерен профил" },
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
        title: "Кариерен Анализ",
        desc: "Попълни научно-валидирания RIASEC тест (базиран на O*NET данни) и открий своя уникален кариерен профил в 6 измерения.",
    },
    {
        num: "02",
        icon: Target,
        title: "Алгоритмичен Подбор",
        desc: "Нашият алгоритъм сравнява профила ти с над 250 специалности в 47 университета и генерира персонализиран списък.",
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
        desc: "Всички данни са от публичните регистри на Министерство на Образованието, актуализирани за 2026 г.",
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

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
    {
        text: "Бях сигурна, че нямам шанс за Право в СУ. Сложих оценките в калкулатора и видях — Над средното с 23 точки. Кандидатствах. Взеха ме. УниПът буквално промени решението ми.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Мария Стоянова",
        role: "Студентка, Право — СУ",
    },
    {
        text: "Прекарах седмици в Excel таблици с коефициенти. После намерих УниПът — 10 минути и бях готов. Как не го открих по-рано?",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Тодор Петков",
        role: "Студент, Бизнес администрация — УНСС",
    },
    {
        text: "Мислех, че ще уча счетоводство, защото баща ми каза така. Направих RIASEC теста — излезе Изследовател. Сега съм в Психология и за пръв път съм спокойна за избора си.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Александра Димова",
        role: "Студентка, Психология — НБУ",
    },
    {
        text: "Препоръчвам УниПът на всичките ми 12-класници. Данните от МОН са точни, интерфейсът е ясен. Учениците реално го използват — не е поредният безполезен сайт.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Йордан Маринов",
        role: "Класен ръководител, ПГЕЕ — Варна",
    },
    {
        text: "Исках да уча в Пловдив, но не знаех дали баловете ми стигат. Филтрирах по град, изчислих и избрах ПУ. Сега съм втора година Информатика и не съжалявам.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Христо Иванов",
        role: "Студент, Информатика — ПУ",
    },
    {
        text: "Дъщеря ми ми показа сайта и за пръв път разбрах как се изчислява балът. Данните са официални, всичко е обяснено ясно. Вече не се притеснявам, че тя взима грешно решение.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Надежда Великова",
        role: "Майка на кандидат-студентка",
    },
    {
        text: "Колебаях се между Медицина и Биохимия. В УниПът видях балове и за двете едновременно и веднага стана ясно. Записах Биохимия в МУ-Пловдив и съм доволен.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Стефан Георгиев",
        role: "Студент, Биохимия — МУ Пловдив",
    },
    {
        text: "Никой в училище не ми обясни как работят коефициентите. Намерих УниПът, прочетох формулата и изведнъж всичко имаше смисъл. Жалко, че не съществуваше преди 3 години.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Ивет Николова",
        role: "Студентка, Архитектура — УАСГ",
    },
    {
        text: "Пратих линка на 12 съученика в деня, в който го открих. Всички го използваме. Стана нашият референтен сайт за кандидатстването тази година.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Боян Христов",
        role: "12-ти клас, кандидатства за ТУ",
    },
];

const T_COL1 = TESTIMONIALS.slice(0, 3);
const T_COL2 = TESTIMONIALS.slice(3, 6);
const T_COL3 = TESTIMONIALS.slice(6, 9);

function TestimonialsColumn({ testimonials, duration = 15 }) {
    return (
        <div style={{ overflow: "hidden", willChange: "transform" }}>
            <m.ul
                animate={{ translateY: "-50%" }}
                transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "1.5rem", listStyle: "none", margin: 0, padding: 0, willChange: "transform" }}
            >
                {[0, 1].map((pass) =>
                    testimonials.map(({ text, image, name, role }, i) => (
                        <m.li
                            key={`${pass}-${i}`}
                            aria-hidden={pass === 1 ? "true" : "false"}
                            whileHover={{ scale: 1.03, y: -6, transition: { type: "spring", stiffness: 400, damping: 17 } }}
                            style={{
                                padding: "1.5rem",
                                borderRadius: "1.25rem",
                                border: "1px solid var(--brand-card-border)",
                                background: "var(--brand-surface)",
                                maxWidth: "300px",
                                width: "100%",
                                cursor: "default",
                            }}
                        >
                            <blockquote style={{ margin: 0, padding: 0 }}>
                                <p style={{ color: "var(--brand-muted)", lineHeight: 1.65, fontSize: "0.9375rem", margin: 0 }}>
                                    {text}
                                </p>
                                <footer style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                                    <img
                                        width={40} height={40}
                                        src={image}
                                        alt={`Снимка на ${name}`}
                                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--brand-border)" }}
                                    />
                                    <div>
                                        <cite style={{ fontStyle: "normal", fontWeight: 700, fontSize: "0.875rem", color: "var(--brand-text)", display: "block" }}>
                                            {name}
                                        </cite>
                                        <span style={{ fontSize: "0.75rem", color: "var(--brand-muted)" }}>
                                            {role}
                                        </span>
                                    </div>
                                </footer>
                            </blockquote>
                        </m.li>
                    ))
                )}
            </m.ul>
        </div>
    );
}

function TrustSection() {
    return (
        <section
            aria-labelledby="testimonials-heading"
            className="py-24 px-6 relative overflow-hidden"
            style={{ background: "var(--brand-bg)", borderTop: "1px solid var(--brand-border)" }}
        >
            <m.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.9, ease: EASE }}
                className="max-w-6xl mx-auto"
            >
                <div className="text-center mb-14">
                    <div
                        className="inline-flex items-center px-4 py-1 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
                        style={{ border: "1px solid var(--brand-border)", color: "var(--brand-muted)", background: "var(--brand-surface)" }}
                    >
                        Отзиви
                    </div>
                    <h2
                        id="testimonials-heading"
                        className="text-3xl md:text-5xl font-extrabold"
                        style={{ color: "var(--brand-text)", letterSpacing: "-0.03em", textWrap: "balance", lineHeight: 1.1 }}
                    >
                        Ученици, които вече са{" "}
                        <span style={{ background: "linear-gradient(130deg, #06B6D4, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            намерили пътя си
                        </span>
                    </h2>
                    <p className="mt-4 max-w-md mx-auto" style={{ color: "var(--brand-muted)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
                        Не ни вярвай само на думи — виж какво казват тези, които вече са кандидатствали с УниПът.
                    </p>
                </div>

                <div
                    role="region"
                    aria-label="Отзиви на потребители"
                    className="flex justify-center gap-6"
                    style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)", maxHeight: "720px", overflow: "hidden" }}
                >
                    <TestimonialsColumn testimonials={T_COL1} duration={18} />
                    <TestimonialsColumn testimonials={T_COL2} duration={22} className="hidden md:block" />
                    <TestimonialsColumn testimonials={T_COL3} duration={20} className="hidden lg:block" />
                </div>
            </m.div>
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
                        right: "-8%",
                        transform: "translateY(-50%)",
                        width: "min(520px, 90vw)",
                        height: "min(520px, 90vw)",
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
