import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { m } from "motion/react";
import {
    Compass,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Search,
    Calculator as CalcIcon,
    Target,
} from "lucide-react";
import { dziService } from "@/services/dziService";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";

const HOWTO_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Как да избереш втори държавен зрелостен изпит (ДЗИ)",
    inLanguage: "bg-BG",
    description:
        "Виж кой втори ДЗИ отваря най-много специалности в българските университети.",
    step: [
        { "@type": "HowToStep", name: "Виж класацията", text: "Прегледай кои предмети участват в балообразуването на най-много специалности." },
        { "@type": "HowToStep", name: "Избери според интересите си", text: "Ако вече имаш посока, провери кои ДЗИ ти трябват за конкретната специалност." },
        { "@type": "HowToStep", name: "Изчисли бала си", text: "Премини към калкулатора и виж приемния си бал." },
    ],
};

const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Count-up анимация за броя специалности (signature micro-interaction).
function useCountUp(target, run) {
    const [val, setVal] = useState(prefersReducedMotion ? target : 0);
    const raf = useRef();
    useEffect(() => {
        if (prefersReducedMotion || !run) {
            setVal(target);
            return;
        }
        const duration = 600;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
            setVal(Math.round(target * eased));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        // Предпазна мрежа: ако rAF е throttle-нат (фонов таб), гарантираме финалната стойност.
        const safety = setTimeout(() => setVal(target), duration + 120);
        return () => { cancelAnimationFrame(raf.current); clearTimeout(safety); };
    }, [target, run]);
    return val;
}

function SubjectRow({ rank, row, max, animate }) {
    const count = useCountUp(row.specialties, animate);
    const pct = max ? Math.max((row.specialties / max) * 100, 4) : 0;
    return (
        <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-card-border)",
                borderRadius: "1.25rem",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                    style={{
                        flexShrink: 0,
                        width: 32,
                        textAlign: "center",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        fontWeight: 800,
                        color: rank <= 3 ? "var(--brand-cyan)" : "var(--brand-muted)",
                    }}
                >
                    {rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--brand-text)", letterSpacing: "-0.01em" }}>
                        {row.subject}
                    </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                        style={{
                            fontFamily: "monospace",
                            fontSize: "1.75rem",
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        {count}
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        специалности
                    </div>
                </div>
            </div>

            {/* Path bar — реинфорсва метафората за пътя */}
            <div style={{ height: "4px", background: "var(--brand-surface-2)", borderRadius: "2px", overflow: "hidden" }}>
                <m.div
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: "100%", background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-violet))", borderRadius: "2px" }}
                />
            </div>

            {row.samples?.length > 0 && (
                <div style={{ fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                    напр.{" "}
                    {row.samples.slice(0, 4).map((s, i) => (
                        <span key={s}>
                            <Link
                                to={`/calculator/?specialty=${encodeURIComponent(s)}`}
                                style={{ color: "var(--brand-text)", textDecoration: "none", borderBottom: "1px dotted var(--brand-border)" }}
                            >
                                {s}
                            </Link>
                            {i < Math.min(row.samples.length, 4) - 1 ? ", " : ""}
                        </span>
                    ))}
                </div>
            )}
        </m.div>
    );
}

export default function DziStrategist() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Обратна секция
    const [specialties, setSpecialties] = useState([]);
    const [query, setQuery] = useState("");
    const [lookupSubjects, setLookupSubjects] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await dziService.getDziStrategy();
                if (alive) { setRows(data); setLoading(false); }
            } catch {
                if (alive) { setError("Нещо се обърка при зареждането. Провери връзката и опитай пак."); setLoading(false); }
            }
        })();
        dziService.getSpecialtyNames().then(n => alive && setSpecialties(n)).catch(() => {});
        return () => { alive = false; };
    }, []);

    const runLookup = async (name) => {
        const exact = specialties.find(s => s.toLowerCase() === name.trim().toLowerCase());
        if (!exact) { setLookupSubjects([]); return; }
        setLookupLoading(true);
        setLookupError(false);
        try {
            const subs = await dziService.getDziForSpecialty(exact);
            setLookupSubjects(subs);
        } catch {
            setLookupSubjects(null);
            setLookupError(true);
        } finally {
            setLookupLoading(false);
        }
    };

    const max = rows.length ? rows[0].specialties : 0;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", paddingTop: "7rem", paddingBottom: "5rem" }}>
            <Seo
                title="Кой втори ДЗИ да избера — ДЗИ Стратег"
                description="Виж кой втори държавен зрелостен изпит отваря най-много специалности в българските университети. Безплатно, по официалните формули за балообразуване."
                path="/dzi-strateg"
            />
            <JsonLd data={HOWTO_SCHEMA} />

            <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem" }}>
                {/* Hero */}
                <m.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: "2.5rem" }}
                >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.875rem", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "999px", marginBottom: "1rem" }}>
                        <Compass size={14} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-cyan)" }}>
                            ДЗИ Стратег
                        </span>
                    </div>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--brand-text)", textWrap: "balance", margin: "0 0 1rem" }}>
                        Кой втори ДЗИ ти отваря{" "}
                        <span style={{ background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            най-много врати
                        </span>
                    </h1>
                    <p style={{ fontSize: "1.0625rem", color: "var(--brand-muted)", lineHeight: 1.6, maxWidth: "44rem", margin: 0 }}>
                        Българският език и литература е задължителен. Вторият ДЗИ е твоят избор — и той решава колко специалности ще можеш да караш. Ето подредбата по официалните формули за балообразуване.
                    </p>
                </m.div>

                {/* Ranking */}
                {loading && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--brand-border)", borderTopColor: "var(--brand-cyan)", animation: "spin 0.7s linear infinite" }} />
                    </div>
                )}

                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 1.25rem", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "1rem", color: "#f87171", fontSize: "14px" }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {!loading && !error && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {rows.map((row, i) => (
                            <SubjectRow key={row.subject} rank={i + 1} row={row} max={max} animate />
                        ))}
                    </div>
                )}

                {/* Honest note */}
                {!loading && !error && (
                    <p style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.6, marginTop: "1.25rem" }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                        Броят отразява специалностите, в чието балообразуване участва предметът (като изпит или матура), по текущите данни в УниПът. По-висок брой значи повече опции — но винаги проверявай конкретната формула за специалността, която те интересува.
                    </p>
                )}

                {/* Reverse lookup */}
                <m.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        marginTop: "3rem",
                        background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))",
                        border: "1px solid var(--brand-card-border)",
                        borderRadius: "1.25rem",
                        padding: "1.75rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                        <Target size={18} strokeWidth={1.5} style={{ color: "var(--brand-violet)" }} />
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)", margin: 0 }}>
                            Вече знаеш какво искаш?
                        </h2>
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--brand-muted)", lineHeight: 1.6, margin: "0 0 1rem", maxWidth: "40rem" }}>
                        Избери специалност и виж кои ДЗИ участват в балообразуването ѝ.
                    </p>

                    <div style={{ position: "relative", maxWidth: "30rem" }}>
                        <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                        <input
                            list="dzi-specialties"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setLookupSubjects(null); }}
                            onInput={(e) => { const v = e.target.value; if (specialties.some(s => s.toLowerCase() === v.trim().toLowerCase())) runLookup(v); }}
                            placeholder="Търси специалност…"
                            aria-label="Търси специалност"
                            style={{
                                width: "100%",
                                height: "3rem",
                                padding: "0 1rem 0 2.5rem",
                                background: "var(--brand-input-bg)",
                                border: "1px solid var(--brand-input-border)",
                                borderRadius: "0.75rem",
                                color: "var(--brand-text)",
                                fontSize: "0.9375rem",
                                fontFamily: "inherit",
                                outline: "none",
                            }}
                        />
                        <datalist id="dzi-specialties">
                            {specialties.map((s) => <option key={s} value={s} />)}
                        </datalist>
                    </div>

                    {lookupLoading && (
                        <p style={{ fontSize: "13px", color: "var(--brand-muted)", marginTop: "1rem" }}>Зареждане…</p>
                    )}

                    {lookupError && !lookupLoading && (
                        <p role="alert" style={{ fontSize: "13px", color: "#f87171", marginTop: "1rem" }}>
                            Не успяхме да заредим данните за тази специалност. Провери връзката и опитай пак.
                        </p>
                    )}

                    {lookupSubjects && !lookupLoading && (
                        lookupSubjects.length > 0 ? (
                            <div style={{ marginTop: "1.25rem" }}>
                                <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brand-muted)", margin: "0 0 0.625rem" }}>
                                    ДЗИ, които участват в балообразуването:
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {lookupSubjects.map((s) => (
                                        <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "999px", fontSize: "13px", fontWeight: 600, color: "var(--brand-text)" }}>
                                            <TrendingUp size={12} style={{ color: "var(--brand-cyan)" }} /> {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "13px", color: "var(--brand-muted)", marginTop: "1rem" }}>
                                <AlertCircle size={14} /> Избери специалност от списъка, за да видиш кои ДЗИ ѝ трябват.
                            </p>
                        )
                    )}
                </m.div>

                {/* CTA */}
                <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
                    <Link
                        to="/calculator/"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.875rem 1.75rem",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            color: "#fff",
                            borderRadius: "0.75rem",
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            textDecoration: "none",
                        }}
                    >
                        <CalcIcon size={16} strokeWidth={2} /> Изчисли своя бал <ArrowRight size={16} strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
