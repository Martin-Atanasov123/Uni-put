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
    CheckCircle,
    School,
    Compass,
} from "lucide-react";

// GlobeScene for CTASection — lazy loaded
const GlobeScene = lazy(() => import("@/components/landing/GlobeScene"));

// AnoAI aurora shader — lazy loaded (Three.js chunk, shared with GlobeScene)
const AnoAI = lazy(() => import("@/components/landing/AnoAI"));

// ── Gradient dot grid background ────────────────────────────────────────────
function DotsBg({ cyanOpacity = 0.1, violetOpacity = 0.07, size = 26 }) {
    return (
        <div
            aria-hidden
            style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--hero-line-1) ${cyanOpacity * 100}%, transparent) 1px, transparent 1px), radial-gradient(circle, color-mix(in srgb, var(--hero-line-2) ${violetOpacity * 100}%, transparent) 1px, transparent 1px)`,
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
    // В браузъра четем media query още при първия render. Ако започнем винаги
    // с false, мобилен екран временно се разпознава като desktop и успява да
    // задейства lazy import-а на Three.js преди effect-ът да коригира стойността.
    const [matches, setMatches] = useState(() =>
        typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia(query).matches
            : false
    );
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
    // Mobile + reduced-motion → пропускаме целия Three.js шейдър.
    // На <768px устройство 3D ефектът е едва видим, а Three.js core (~730 KB raw)
    // блокира main thread за 5-10s на по-слаби телефони. PageSpeed mobile тестът
    // (Moto G Power + Slow 4G) спадаше до Performance 49 заради това.
    const isMobile = useMediaQuery("(max-width: 768px)");
    const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
    const enableShader = !isMobile && !prefersReducedMotion;

    // На desktop — отлагаме шейдъра до СЛЕД първото изрисуване, за да не блокира
    // FCP. Double-rAF гарантира paint-а да премине през compositor.
    const [anoaiReady, setAnoaiReady] = useState(false);
    useEffect(() => {
        if (!enableShader) return;
        let r1, r2;
        r1 = requestAnimationFrame(() => {
            r2 = requestAnimationFrame(() => setAnoaiReady(true));
        });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [enableShader]);

    return (
        <section
            data-testid="hero-section"
            className="relative overflow-hidden"
            style={{ background: "var(--brand-bg)", minHeight: "max(100svh, 52rem)" }}
        >
            {/* Движението е най-силно горе, но продължава много деликатно зад
                текста. Дългата mask крива избягва видима хоризонтална граница. */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0,
                    overflow: "hidden", pointerEvents: "none", zIndex: 0,
                    WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 30%, rgba(0,0,0,0.58) 58%, rgba(0,0,0,0.2) 84%, transparent 100%)",
                    maskImage: "linear-gradient(to bottom, #000 0%, #000 30%, rgba(0,0,0,0.58) 58%, rgba(0,0,0,0.2) 84%, transparent 100%)",
                }}
            >
                <DotsBg cyanOpacity={0.07} violetOpacity={0.05} size={32} />

                {!enableShader && (
                    <div
                        style={{
                            position: "absolute", inset: "-10% 0 0", zIndex: 1,
                            background:
                                "radial-gradient(ellipse 80% 60% at 20% 24%, var(--hero-glow-1), transparent 64%), " +
                                "radial-gradient(ellipse 70% 55% at 80% 36%, var(--hero-glow-2), transparent 66%)",
                        }}
                    />
                )}

                {enableShader && anoaiReady && (
                    <Suspense fallback={null}>
                        <div
                            style={{
                                position: "absolute", inset: 0, zIndex: 1,
                                filter: "blur(3.5px)", transform: "translateY(-13%) scale(1.08)",
                            }}
                        >
                            <AnoAI style={{ position: "absolute", inset: 0 }} />
                        </div>
                    </Suspense>
                )}
            </div>

            {/* Мек локален воал само зад четимата зона — няма ръб и фонът
                остава видим около него и между отделните елементи. */}
            <div
                aria-hidden
                style={{
                    position: "absolute", inset: 0, zIndex: 2,
                    pointerEvents: "none",
                    background: "radial-gradient(ellipse 58% 42% at 50% 64%, color-mix(in srgb, var(--brand-bg) 88%, transparent) 0%, color-mix(in srgb, var(--brand-bg) 62%, transparent) 48%, transparent 82%)",
                }}
            />

            {/* ── Layer 2: centred hero text ── */}
            <div
                className="relative max-w-5xl mx-auto px-6 flex flex-col items-center text-center"
                style={{ zIndex: 3, minHeight: "max(100svh, 52rem)", paddingTop: "clamp(20rem, 48vh, 28rem)", paddingBottom: "7rem" }}
            >
                <m.div
                    className="flex flex-col items-center"
                    // Заглавието е LCP елементът. Не го скриваме с opacity при
                    // първия paint; останалите секции запазват плавните Reveal
                    // анимации при скрол.
                    initial={false}
                    style={{ width: "100%", zIndex: 3 }}
                >
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
                    </h1>

                    {/* Subheadline */}
                    <p
                        className="mb-10 leading-relaxed"
                        style={{
                            fontSize: "clamp(1rem, 2vw, 1.125rem)",
                            color: "var(--hero-text-secondary)",
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
                                    background: "var(--hero-line-1)",
                                    color: "var(--brand-accent-ink)",
                                    padding: "0.9rem 1.75rem",
                                    borderRadius: "0.875rem",
                                    fontSize: "0.9375rem",
                                    textDecoration: "none",
                                    boxShadow: "var(--shadow-md)",
                                    transition: "background-color 180ms ease, box-shadow 220ms ease",
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
                                    background: "color-mix(in srgb, var(--hero-text) 4%, transparent)",
                                    padding: "0.9rem 1.75rem",
                                    borderRadius: "0.875rem",
                                    fontSize: "0.9375rem",
                                    textDecoration: "none",
                                    transition: "border-color 0.2s, color 0.2s, background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "var(--hero-line-1)";
                                    e.currentTarget.style.color = "var(--hero-line-1)";
                                    e.currentTarget.style.background = "color-mix(in srgb, var(--hero-line-1) 8%, transparent)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--brand-border)";
                                    e.currentTarget.style.color = "var(--brand-text)";
                                    e.currentTarget.style.background = "color-mix(in srgb, var(--hero-text) 4%, transparent)";
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
    const [activeStep, setActiveStep] = useState(0);
    const ActiveIcon = STEPS[activeStep].icon;

    return (
        <section
            className="how-section py-28 px-6 relative overflow-hidden"
            style={{ background: "var(--brand-bg-alt)" }}
        >
            <div className="how-progressive-blur" aria-hidden="true" />
            <div className="max-w-6xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
                <Reveal className="mb-14 md:mb-20">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4"
                        style={{ color: "var(--brand-cyan)" }}>
                        Как работи
                    </p>
                    <div className="how-heading-row">
                      <h2
                        className="text-3xl md:text-5xl font-bold max-w-2xl"
                        style={{
                            color: "var(--brand-text)",
                            letterSpacing: "-0.02em",
                            textWrap: "balance",
                        }}
                      >
                          Три стъпки. Един по-ясен избор.
                      </h2>
                      <p className="how-intro">От това кой си до конкретна специалност и реален приемен бал — без лутане между десетки сайтове.</p>
                    </div>
                </Reveal>

                <div className="how-stage">
                    <div className="how-orbit" aria-hidden="true">
                        <div className="how-orbit-ring how-orbit-ring-a" />
                        <div className="how-orbit-ring how-orbit-ring-b" />
                        <m.div
                            key={activeStep}
                            className="how-orbit-core"
                            initial={{ scale: 0.78, opacity: 0, filter: "blur(10px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.55, ease: EASE }}
                        >
                            <ActiveIcon size={42} strokeWidth={1.35} />
                            <span>{STEPS[activeStep].num}</span>
                        </m.div>
                        <span className="how-orbit-label">профил → избор → прием</span>
                    </div>

                    <div className="how-steps" role="list" aria-label="Стъпки в УниПът">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const active = activeStep === index;
                            return (
                                <m.button
                                    key={step.num}
                                    type="button"
                                    role="listitem"
                                    className={`how-step ${active ? "is-active" : ""}`}
                                    onMouseEnter={() => setActiveStep(index)}
                                    onFocus={() => setActiveStep(index)}
                                    onClick={() => setActiveStep(index)}
                                    initial={{ opacity: 0, x: 24 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
                                    aria-pressed={active}
                                >
                                    <span className="how-step-rail" aria-hidden="true"><i /></span>
                                    <span className="how-step-icon"><Icon size={19} /></span>
                                    <span className="how-step-copy">
                                        <small>{step.num}</small>
                                        <strong>{step.title}</strong>
                                        <span>{step.desc}</span>
                                    </span>
                                    <ArrowRight className="how-step-arrow" size={18} aria-hidden="true" />
                                </m.button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <style>{`
                .how-section { isolation: isolate; }
                .how-progressive-blur { position:absolute; inset:auto 0 0; height:42%; pointer-events:none; background:linear-gradient(to bottom, transparent, color-mix(in srgb, var(--brand-bg) 82%, transparent)); backdrop-filter:blur(1px); }
                .how-heading-row { display:flex; align-items:end; justify-content:space-between; gap:3rem; }
                .how-intro { max-width:27rem; margin:0 0 .25rem; color:var(--brand-muted); font-size:1rem; line-height:1.7; }
                .how-stage { display:grid; grid-template-columns:minmax(18rem,.82fr) minmax(24rem,1.18fr); gap:clamp(3rem,7vw,7rem); align-items:center; }
                .how-orbit { position:relative; aspect-ratio:1; width:min(100%,25rem); margin:auto; display:grid; place-items:center; }
                .how-orbit::before { content:""; position:absolute; inset:17%; border-radius:50%; background:radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--brand-cyan) 24%, transparent), transparent 62%); filter:blur(18px); }
                .how-orbit-ring { position:absolute; border:1px solid color-mix(in srgb, var(--brand-cyan) 28%, var(--brand-card-border)); border-radius:50%; }
                .how-orbit-ring::after { content:""; position:absolute; width:.7rem; height:.7rem; border-radius:50%; background:var(--brand-cyan); box-shadow:0 0 25px color-mix(in srgb, var(--brand-cyan) 80%, transparent); top:12%; left:17%; }
                .how-orbit-ring-a { inset:8%; animation:orbit-spin 18s linear infinite; }
                .how-orbit-ring-b { inset:25%; border-color:color-mix(in srgb, var(--brand-violet) 35%, var(--brand-card-border)); animation:orbit-spin 12s linear infinite reverse; }
                .how-orbit-ring-b::after { background:var(--brand-violet); top:auto; left:auto; right:7%; bottom:26%; }
                .how-orbit-core { width:8.25rem; height:8.25rem; border-radius:2.25rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.55rem; color:var(--brand-text); background:linear-gradient(145deg, color-mix(in srgb, var(--brand-surface) 92%, var(--brand-cyan)), var(--brand-surface)); border:1px solid color-mix(in srgb, var(--brand-cyan) 38%, var(--brand-card-border)); box-shadow:0 24px 70px color-mix(in srgb, var(--brand-cyan) 16%, transparent), inset 0 1px 0 rgba(255,255,255,.12); }
                .how-orbit-core span { font:800 11px/1 monospace; letter-spacing:.18em; color:var(--brand-cyan); }
                .how-orbit-label { position:absolute; bottom:2%; font:700 10px/1 monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--brand-muted); }
                .how-steps { display:flex; flex-direction:column; }
                .how-step { position:relative; display:grid; grid-template-columns:1.25rem 2.75rem 1fr auto; gap:1rem; align-items:start; width:100%; padding:1.35rem .25rem; border:0; background:transparent; color:inherit; text-align:left; cursor:pointer; }
                .how-step + .how-step { border-top:1px solid var(--brand-card-border); }
                .how-step-rail { width:2px; height:100%; min-height:4.6rem; margin:.2rem auto; border-radius:2px; background:var(--brand-card-border); overflow:hidden; }
                .how-step-rail i { display:block; width:100%; height:0; background:linear-gradient(var(--brand-cyan),var(--brand-violet)); transition:height .5s cubic-bezier(.16,1,.3,1); }
                .how-step.is-active .how-step-rail i { height:100%; }
                .how-step-icon { width:2.75rem; height:2.75rem; display:grid; place-items:center; border-radius:.9rem; color:var(--brand-muted); background:var(--brand-surface); border:1px solid var(--brand-card-border); transition:.35s ease; }
                .how-step.is-active .how-step-icon { color:var(--brand-cyan); border-color:color-mix(in srgb,var(--brand-cyan) 55%,var(--brand-card-border)); transform:rotate(-4deg) scale(1.04); box-shadow:0 12px 30px color-mix(in srgb,var(--brand-cyan) 12%,transparent); }
                .how-step-copy { display:flex; flex-direction:column; min-width:0; }
                .how-step-copy small { margin-bottom:.3rem; color:var(--brand-cyan); font:800 10px/1 monospace; letter-spacing:.16em; }
                .how-step-copy strong { color:var(--brand-text); font-size:1.12rem; letter-spacing:-.015em; }
                .how-step-copy > span { display:grid; grid-template-rows:0fr; opacity:0; color:var(--brand-muted); font-size:.88rem; line-height:1.65; transition:grid-template-rows .45s ease, opacity .3s ease, margin .45s ease; overflow:hidden; }
                .how-step.is-active .how-step-copy > span { grid-template-rows:1fr; opacity:1; margin-top:.55rem; }
                .how-step-arrow { align-self:center; color:var(--brand-muted); opacity:.35; transition:.3s ease; }
                .how-step.is-active .how-step-arrow { color:var(--brand-cyan); opacity:1; transform:translateX(4px); }
                @keyframes orbit-spin { to { transform:rotate(360deg); } }
                @media (max-width:767px) { .how-heading-row { display:block; } .how-intro { margin-top:1rem; } .how-stage { grid-template-columns:1fr; gap:2rem; } .how-orbit { width:min(82vw,20rem); } .how-step { grid-template-columns:.65rem 2.5rem 1fr; gap:.75rem; } .how-step-arrow { display:none; } }
                @media (prefers-reduced-motion:reduce) { .how-orbit-ring { animation:none; } }
            `}</style>
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
        <section className="path-section py-28 px-6 relative overflow-hidden" style={{ background: "var(--brand-bg)" }}>
            <div className="path-glow" aria-hidden="true" />
            <div className="max-w-6xl mx-auto">
                <Reveal className="path-heading mb-14">
                    <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--brand-cyan)" }}>
                        Целият път
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--brand-text)", letterSpacing: "-0.02em", textWrap: "balance" }}>
                        Всяко голямо решение има следваща стъпка
                    </h2>
                    <p className="mt-4 text-lg max-w-xl" style={{ color: "var(--brand-muted)" }}>
                        Три решения, които определят образованието ти. УниПът помага за всяко от тях.
                    </p>
                </Reveal>
                <m.ol
                    className="path-track"
                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {PATH_STAGES.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <m.li key={s.to} className="path-stop" variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
                                <Link
                                    to={s.to}
                                    className="path-card"
                                >
                                    <span className="path-node" aria-hidden="true"><i /></span>
                                    <div className="path-card-top">
                                        <div className="path-icon">
                                            <Icon size={20} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} aria-hidden="true" />
                                        </div>
                                        <span className="path-grade">
                                            етап {String(i + 1).padStart(2, "0")} · {s.grade}
                                        </span>
                                    </div>
                                    <h3 className="path-title">
                                        {s.title}
                                    </h3>
                                    <p className="path-desc">
                                        {s.desc}
                                    </p>
                                    <span className="path-cta">
                                        {s.cta} <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                                    </span>
                                </Link>
                            </m.li>
                        );
                    })}
                </m.ol>
            </div>
            <style>{`
                .path-section { isolation:isolate; }
                .path-glow { position:absolute; width:34rem; height:34rem; right:-12rem; top:5rem; border-radius:50%; background:color-mix(in srgb,var(--brand-violet) 10%,transparent); filter:blur(90px); pointer-events:none; }
                .path-heading { display:grid; grid-template-columns:1fr minmax(17rem,.65fr); column-gap:4rem; align-items:end; }
                .path-heading > p:first-child { grid-column:1/-1; }
                .path-heading h2 { max-width:45rem; }
                .path-track { position:relative; display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; }
                .path-track::before { content:""; position:absolute; left:5%; right:5%; top:1rem; height:1px; background:linear-gradient(90deg,transparent,var(--brand-cyan),var(--brand-violet),transparent); opacity:.55; }
                .path-stop { position:relative; padding-top:2.25rem; }
                .path-card { position:relative; display:flex; flex-direction:column; min-height:22rem; padding:1.6rem; overflow:hidden; background:color-mix(in srgb,var(--brand-surface) 93%,transparent); border:1px solid var(--brand-card-border); border-radius:1.5rem; color:inherit; text-decoration:none; transition:transform .45s cubic-bezier(.16,1,.3,1),border-color .3s ease,box-shadow .45s ease; }
                .path-card::after { content:""; position:absolute; inset:auto -20% -55% 10%; height:70%; border-radius:50%; background:color-mix(in srgb,var(--brand-cyan) 8%,transparent); filter:blur(35px); transition:.45s ease; }
                .path-card:hover { transform:translateY(-8px); border-color:color-mix(in srgb,var(--brand-cyan) 55%,var(--brand-card-border)); box-shadow:0 28px 60px color-mix(in srgb,var(--brand-cyan) 10%,transparent); }
                .path-card:hover::after { transform:translateY(-22%); }
                .path-node { position:absolute; width:1rem; height:1rem; border-radius:50%; top:-1.8rem; left:50%; transform:translateX(-50%); border:3px solid var(--brand-bg); background:var(--brand-cyan); box-shadow:0 0 0 1px var(--brand-cyan),0 0 22px color-mix(in srgb,var(--brand-cyan) 70%,transparent); }
                .path-stop:nth-child(2) .path-node { background:color-mix(in srgb,var(--brand-cyan) 45%,var(--brand-violet)); }
                .path-stop:nth-child(3) .path-node { background:var(--brand-violet); box-shadow:0 0 0 1px var(--brand-violet),0 0 22px color-mix(in srgb,var(--brand-violet) 70%,transparent); }
                .path-card-top { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:3.25rem; }
                .path-icon { display:grid; place-items:center; width:3rem; height:3rem; border-radius:1rem; background:var(--brand-subtle); border:1px solid var(--brand-card-border); }
                .path-grade { color:var(--brand-muted); font:800 10px/1.2 monospace; letter-spacing:.08em; text-transform:uppercase; }
                .path-title { margin:0 0 .65rem; color:var(--brand-text); font-size:1.4rem; font-weight:750; letter-spacing:-.025em; text-wrap:balance; }
                .path-desc { margin:0 0 1.5rem; color:var(--brand-muted); font-size:.88rem; line-height:1.7; flex:1; }
                .path-cta { position:relative; z-index:1; display:inline-flex; align-items:center; gap:.4rem; color:var(--brand-cyan); font-size:.88rem; font-weight:750; }
                .path-cta svg { transition:transform .3s ease; } .path-card:hover .path-cta svg { transform:translateX(5px); }
                @media (max-width:767px) { .path-heading { display:block; } .path-track { grid-template-columns:1fr; gap:1rem; padding-left:1.5rem!important; } .path-track::before { top:0; bottom:0; left:.25rem; right:auto; width:1px; height:auto; background:linear-gradient(transparent,var(--brand-cyan),var(--brand-violet),transparent); } .path-stop { padding:0; } .path-node { top:2.2rem; left:-1.25rem; } .path-card { min-height:0; } .path-card-top { margin-bottom:2rem; } }
            `}</style>
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
        desc: "Оптимизиран за телефон, таблет и компютър. Светла и тъмна тема за комфортна работа по всяко време.",
    },
    {
        icon: BookMarked,
        title: "Запази и Сравни",
        desc: "Добавяй специалности в любими и сравнявай шансовете си в различни университети и градове.",
    },
];

function FeaturesSection() {
    return (
        <section className="features-section py-28 px-6 relative overflow-hidden" style={{ background: "var(--brand-bg-alt)" }}>
            <div className="features-aurora" aria-hidden="true" />
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
                    className="feature-bento"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={stagger}
                >
                    {FEATURES.map((f, index) => {
                        const Icon = f.icon;
                        return (
                            <m.div
                                key={f.title}
                                variants={fadeUp}
                                transition={{ duration: 0.5, ease: EASE }}
                                className={`feature-tile feature-tile-${index + 1}`}
                            >
                                <span className="feature-index">0{index + 1}</span>
                                <div className="feature-icon">
                                    <Icon size={20} style={{ color: "var(--brand-violet)" }} />
                                </div>
                                <h3
                                    className="feature-title"
                                >
                                    {f.title}
                                </h3>
                                <p className="feature-desc">
                                    {f.desc}
                                </p>
                                <div className="feature-shine" aria-hidden="true" />
                            </m.div>
                        );
                    })}
                </m.div>
            </div>
            <style>{`
                .features-section { isolation:isolate; }
                .features-aurora { position:absolute; inset:8% 5% auto; height:24rem; background:radial-gradient(ellipse at 25% 50%,color-mix(in srgb,var(--brand-cyan) 12%,transparent),transparent 52%),radial-gradient(ellipse at 75% 40%,color-mix(in srgb,var(--brand-violet) 13%,transparent),transparent 50%); filter:blur(55px); pointer-events:none; }
                .feature-bento { display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:minmax(12.5rem,auto); gap:1rem; }
                .feature-tile { position:relative; display:flex; flex-direction:column; justify-content:flex-end; min-height:13rem; padding:1.5rem; overflow:hidden; background:color-mix(in srgb,var(--brand-surface) 95%,transparent); border:1px solid var(--brand-card-border); border-radius:1.5rem; transition:transform .4s cubic-bezier(.16,1,.3,1),border-color .3s ease,box-shadow .4s ease; }
                .feature-tile:hover { transform:translateY(-5px); border-color:color-mix(in srgb,var(--brand-violet) 50%,var(--brand-card-border)); box-shadow:0 24px 55px color-mix(in srgb,var(--brand-violet) 9%,transparent); }
                .feature-tile-1,.feature-tile-4 { grid-column:span 2; }
                .feature-tile-1 { grid-row:span 2; min-height:26rem; justify-content:flex-end; }
                .feature-tile-4 { grid-column:3 / span 2; }
                .feature-index { position:absolute; top:1.2rem; right:1.25rem; color:var(--brand-muted); font:800 10px/1 monospace; letter-spacing:.16em; opacity:.7; }
                .feature-icon { width:3rem; height:3rem; display:grid; place-items:center; margin-bottom:1.35rem; border-radius:1rem; background:var(--brand-subtle); border:1px solid var(--brand-card-border); transition:transform .4s cubic-bezier(.16,1,.3,1); }
                .feature-tile:hover .feature-icon { transform:rotate(-7deg) scale(1.08); }
                .feature-title { position:relative; z-index:1; margin:0 0 .55rem; color:var(--brand-text); font-size:1rem; font-weight:700; text-wrap:balance; }
                .feature-tile-1 .feature-title { font-size:clamp(1.5rem,2.6vw,2.15rem); max-width:18rem; letter-spacing:-.03em; }
                .feature-desc { position:relative; z-index:1; margin:0; color:var(--brand-muted); font-size:.87rem; line-height:1.65; max-width:30rem; }
                .feature-tile-1 .feature-desc { font-size:.95rem; max-width:28rem; }
                .feature-shine { position:absolute; width:12rem; height:12rem; right:-5rem; top:-5rem; border-radius:50%; background:color-mix(in srgb,var(--brand-violet) 11%,transparent); filter:blur(25px); transition:transform .6s ease; }
                .feature-tile:nth-child(odd) .feature-shine { background:color-mix(in srgb,var(--brand-cyan) 10%,transparent); }
                .feature-tile:hover .feature-shine { transform:scale(1.45) translate(-12%,12%); }
                @media (max-width:900px) { .feature-bento { grid-template-columns:repeat(2,1fr); } .feature-tile-1 { grid-row:span 1; min-height:17rem; } .feature-tile-4 { grid-column:auto; } }
                @media (max-width:560px) { .feature-bento { grid-template-columns:1fr; } .feature-tile,.feature-tile-1,.feature-tile-4 { grid-column:auto; min-height:13rem; } }
            `}</style>
        </section>
    );
}

// ── TRUST ───────────────────────────────────────────────────────────────────

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
    {
        text: "Бях сигурна, че нямам шанс за Право в СУ. Сложих оценките в калкулатора и видях — Над средното с 23 точки. Кандидатствах. Взеха ме. УниПът буквално промени решението ми.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Мария Стоянова",
        role: "Студентка, Право — СУ",
    },
    {
        text: "Прекарах седмици в Excel таблици с коефициенти. После намерих УниПът — 10 минути и бях готов. Как не го открих по-рано?",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Тодор Петков",
        role: "Студент, Бизнес администрация — УНСС",
    },
    {
        text: "Мислех, че ще уча счетоводство, защото баща ми каза така. Направих RIASEC теста — излезе Изследовател. Сега съм в Психология и за пръв път съм спокойна за избора си.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Александра Димова",
        role: "Студентка, Психология — НБУ",
    },
    {
        text: "Препоръчвам УниПът на всичките ми 12-класници. Данните от МОН са точни, интерфейсът е ясен. Учениците реално го използват — не е поредният безполезен сайт.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Йордан Маринов",
        role: "Класен ръководител, ПГЕЕ — Варна",
    },
    {
        text: "Исках да уча в Пловдив, но не знаех дали баловете ми стигат. Филтрирах по град, изчислих и избрах ПУ. Сега съм втора година Информатика и не съжалявам.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Христо Иванов",
        role: "Студент, Информатика — ПУ",
    },
    {
        text: "Дъщеря ми ми показа сайта и за пръв път разбрах как се изчислява балът. Данните са официални, всичко е обяснено ясно. Вече не се притеснявам, че тя взима грешно решение.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Надежда Великова",
        role: "Майка на кандидат-студентка",
    },
    {
        text: "Колебаях се между Медицина и Биохимия. В УниПът видях балове и за двете едновременно и веднага стана ясно. Записах Биохимия в МУ-Пловдив и съм доволен.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Стефан Георгиев",
        role: "Студент, Биохимия — МУ Пловдив",
    },
    {
        text: "Никой в училище не ми обясни как работят коефициентите. Намерих УниПът, прочетох формулата и изведнъж всичко имаше смисъл. Жалко, че не съществуваше преди 3 години.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Ивет Николова",
        role: "Студентка, Архитектура — УАСГ",
    },
    {
        text: "Пратих линка на 12 съученика в деня, в който го открих. Всички го използваме. Стана нашият референтен сайт за кандидатстването тази година.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=126&h=126",
        name: "Боян Христов",
        role: "12-ти клас, кандидатства за ТУ",
    },
];

const T_COL1 = TESTIMONIALS.slice(0, 3);
const T_COL2 = TESTIMONIALS.slice(3, 6);
const T_COL3 = TESTIMONIALS.slice(6, 9);

function TestimonialsColumn({ testimonials, duration = 15, className = "" }) {
    return (
        <div className={className} style={{ overflow: "hidden", willChange: "transform" }}>
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
            <DotsBg cyanOpacity={0.08} violetOpacity={0.06} size={26} />
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
                        <span style={{ color: "var(--brand-cyan)" }}>
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
                                    background: "var(--brand-cyan)",
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
                                    to="/calculator/"
                                    className="inline-flex items-center gap-3 font-semibold"
                                    style={{
                                        background: "var(--brand-cyan)",
                                        color: "var(--brand-accent-ink)",
                                        padding: "0.9rem 1.75rem",
                                        borderRadius: "0.875rem",
                                        fontSize: "0.9375rem",
                                        textDecoration: "none",
                                        boxShadow: "var(--shadow-md)",
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
                                        e.currentTarget.style.borderColor = "var(--brand-cyan)";
                                        e.currentTarget.style.color = "var(--brand-violet)";
                                        e.currentTarget.style.background = "var(--brand-subtle)";
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
            <TrustSection />
            <CTASection />
        </div>
    );
}
