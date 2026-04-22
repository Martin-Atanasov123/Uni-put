import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Target,
    GraduationCap,
    Briefcase,
    ChevronRight,
    RefreshCw,
    MapPin,
    Building2,
    BookOpen,
    Calculator,
    ArrowRight,
} from "lucide-react";

// CLAUDE.md §14 Brand Moat — each RIASEC type has its own distinct color
const RIASEC_LABELS = {
    R: { name: "Реалистичен",    desc: "Предпочиташ практическа работа с инструменти и машини.",   color: "#F97316", bg: "rgba(249,115,22,0.1)",   border: "rgba(249,115,22,0.3)"   },
    I: { name: "Изследователски", desc: "Обичаш да решаваш сложни проблеми и да анализираш данни.", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   border: "rgba(139,92,246,0.3)"   },
    A: { name: "Артистичен",     desc: "Цениш творчеството, изкуството и оригиналността.",         color: "#EC4899", bg: "rgba(236,72,153,0.1)",   border: "rgba(236,72,153,0.3)"   },
    S: { name: "Социален",       desc: "Харесваш да помагаш на хората и да работиш в екип.",       color: "#10B981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)"   },
    E: { name: "Предприемачески", desc: "Имаш лидерски умения и обичаш да убеждаваш другите.",     color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.3)"   },
    C: { name: "Конвенционален", desc: "Предпочиташ структурата, детайлите и организацията.",      color: "#06B6D4", bg: "rgba(6,182,212,0.1)",    border: "rgba(6,182,212,0.3)"    },
};

const S = {
    surface: {
        background: "var(--brand-surface)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--brand-card-border)",
        borderRadius: "1.25rem",
    },
};

const RIASECResults = ({ results, onRestart }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("all");
    const [showAllSpecialties, setShowAllSpecialties] = useState(false);
    const [showAllCareers, setShowAllCareers] = useState(false);

    const { scores, riasecCode, specialties, careers, error } = results;
    const visibleSpecialties = showAllSpecialties ? specialties : specialties.slice(0, 5);
    const visibleCareers = showAllCareers ? careers : careers.slice(0, 5);

    const viewModes = [
        { id: "all", label: "Всички" },
        { id: "specialties", label: "Специалности" },
        { id: "careers", label: "Професии" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            {/* Profile header */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div
                    style={{
                        width: "4rem",
                        height: "4rem",
                        margin: "0 auto",
                        borderRadius: "1rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 16px 40px rgba(6,182,212,0.3)",
                    }}
                >
                    <Target size={28} color="#fff" />
                </div>
                <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", textWrap: "balance" }}>
                    Твоят RIASEC Профил:{" "}
                    <span style={{ fontFamily: "monospace", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {riasecCode}
                    </span>
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
                    {riasecCode.split("").map((char, idx) => {
                        const typeInfo = RIASEC_LABELS[char] || {};
                        return (
                        <div
                            key={idx}
                            style={{
                                background: typeInfo.bg || "var(--brand-surface)",
                                border: `1px solid ${typeInfo.border || "var(--brand-card-border)"}`,
                                borderRadius: "1.25rem",
                                padding: "1.25rem",
                                textAlign: "left",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "1.75rem",
                                    fontWeight: 900,
                                    fontFamily: "monospace",
                                    color: typeInfo.color || "var(--brand-cyan)",
                                    marginBottom: "0.25rem",
                                    lineHeight: 1,
                                }}
                            >
                                {char}
                            </div>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--brand-text)" }}>{typeInfo.name}</h4>
                            <p style={{ margin: "0.4rem 0 0", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.55 }}>{typeInfo.desc}</p>
                        </div>
                        );
                    })}
                </div>

                {/* Score bars */}
                <div style={{ maxWidth: "560px", margin: "1rem auto 0", display: "flex", flexDirection: "column", gap: "0.625rem", width: "100%" }}>
                    {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([type, score]) => (
                        <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ width: "1.5rem", fontSize: "13px", fontWeight: 800, color: "var(--brand-text)", fontFamily: "monospace" }}>{type}</span>
                            <div style={{ flex: 1, height: "8px", background: "rgba(148,163,184,0.1)", borderRadius: "999px", overflow: "hidden" }}>
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${score}%`,
                                        background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-violet))",
                                        borderRadius: "999px",
                                        transition: "width 1s ease",
                                        boxShadow: "0 0 8px rgba(6,182,212,0.4)",
                                    }}
                                />
                            </div>
                            <span style={{ width: "3rem", textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--brand-muted)", fontFamily: "monospace" }}>{score}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: "0.875rem 1rem",
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        borderRadius: "0.75rem",
                        color: "#fca5a5",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "center",
                    }}
                >
                    Възникна грешка при зареждане на препоръките. Опитайте отново.
                </div>
            )}

            {/* View toggle */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                    style={{
                        display: "inline-flex",
                        padding: "0.25rem",
                        background: "var(--brand-surface)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "0.75rem",
                        gap: "0.25rem",
                    }}
                >
                    {viewModes.map(m => {
                        const active = viewMode === m.id;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setViewMode(m.id)}
                                style={{
                                    padding: "0.5rem 1rem",
                                    background: active ? "rgba(6,182,212,0.12)" : "transparent",
                                    border: `1px solid ${active ? "rgba(6,182,212,0.35)" : "transparent"}`,
                                    borderRadius: "0.5rem",
                                    color: active ? "var(--brand-cyan)" : "var(--brand-muted)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s",
                                }}
                            >
                                {m.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Specialties */}
            {(viewMode === "all" || viewMode === "specialties") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                        <GraduationCap size={22} style={{ color: "var(--brand-cyan)" }} />
                        Топ специалности за теб
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {visibleSpecialties.length > 0 ? visibleSpecialties.map((spec, index) => (
                            <div
                                key={spec.id}
                                style={{
                                    ...S.surface,
                                    padding: "1.25rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.875rem",
                                }}
                            >
                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
                                    <div
                                        style={{
                                            width: "2.5rem",
                                            height: "2.5rem",
                                            borderRadius: "0.625rem",
                                            background: "rgba(6,182,212,0.1)",
                                            border: "1px solid rgba(6,182,212,0.25)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--brand-cyan)",
                                            fontFamily: "monospace",
                                            fontSize: "13px",
                                            fontWeight: 800,
                                            flexShrink: 0,
                                        }}
                                    >
                                        #{index + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: "180px" }}>
                                        <h4 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-text)" }}>{spec.name}</h4>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                                            <span style={{ padding: "0.2rem 0.5rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                {spec.category || "Специалност"}
                                            </span>
                                            <span style={{ padding: "0.2rem 0.5rem", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "999px", color: "var(--brand-muted)", fontSize: "10px", fontWeight: 700, fontFamily: "monospace" }}>
                                                {spec.riasec_code}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <div
                                            style={{
                                                fontSize: "1.875rem",
                                                fontWeight: 800,
                                                fontFamily: "monospace",
                                                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            {spec.compatibility}%
                                        </div>
                                        <div style={{ fontSize: "9px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.6 }}>
                                            съвпадение
                                        </div>
                                    </div>
                                </div>
                                {spec.universities && spec.universities.length > 0 && (
                                    <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                                        <p style={{ margin: "0 0 0.5rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                                            Университети ({spec.universities_count})
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                            {spec.universities.slice(0, 3).map(uni => (
                                                <span
                                                    key={uni.id}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.3rem",
                                                        padding: "0.3rem 0.625rem",
                                                        background: "var(--brand-surface)",
                                                        border: "1px solid var(--brand-border)",
                                                        borderRadius: "0.5rem",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "var(--brand-text)",
                                                    }}
                                                >
                                                    <Building2 size={11} style={{ color: "var(--brand-muted)" }} /> {uni.university_name}
                                                    {uni.city && (
                                                        <>
                                                            <MapPin size={9} style={{ color: "var(--brand-muted)", marginLeft: "0.2rem" }} /> {uni.city}
                                                        </>
                                                    )}
                                                </span>
                                            ))}
                                            {spec.universities.length > 3 && (
                                                <span style={{ padding: "0.3rem 0.625rem", fontSize: "11px", color: "var(--brand-muted)", fontWeight: 600 }}>
                                                    +{spec.universities.length - 3} още
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const params = new URLSearchParams({ specialty: spec.name });
                                            navigate(`/calculator?${params.toString()}`);
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            padding: "0.5rem 0.875rem",
                                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                            border: "none",
                                            borderRadius: "0.5rem",
                                            color: "#fff",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                            boxShadow: "0 8px 20px rgba(6,182,212,0.25)",
                                        }}
                                    >
                                        <Calculator size={13} /> Изчисли бал
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <EmptyState label="Няма намерени специалности с над 50% съвпадение." />
                        )}
                    </div>
                    {specialties.length > 5 && (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                                type="button"
                                onClick={() => setShowAllSpecialties(v => !v)}
                                style={{
                                    padding: "0.6rem 1.25rem",
                                    background: "transparent",
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    borderRadius: "0.625rem",
                                    color: "var(--brand-text)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                {showAllSpecialties ? "Скрий останалите" : `Покажи останалите ${specialties.length - 5}`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Careers */}
            {(viewMode === "all" || viewMode === "careers") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                        <Briefcase size={22} style={{ color: "var(--brand-violet)" }} />
                        Топ професии за теб
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                        {visibleCareers.length > 0 ? visibleCareers.map((career, index) => (
                            <div
                                key={career.id}
                                style={{
                                    ...S.surface,
                                    padding: "1.5rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem",
                                    position: "relative",
                                    overflow: "hidden",
                                    transition: "transform 0.2s, border-color 0.2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)"; }}
                            >
                                <div aria-hidden style={{ position: "absolute", top: "-80px", right: "-80px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                                    <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "var(--brand-violet)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "12px", fontWeight: 800 }}>
                                        #{index + 1}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div
                                            style={{
                                                fontSize: "1.5rem",
                                                fontWeight: 800,
                                                fontFamily: "monospace",
                                                background: "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            {career.compatibility}%
                                        </div>
                                        <div style={{ fontSize: "8px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>
                                            съвпадение
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: "relative" }}>
                                    <h4 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.3, color: "var(--brand-text)" }}>
                                        {career.name}
                                    </h4>
                                    <p style={{ margin: "0.3rem 0 0", fontSize: "10px", fontWeight: 800, color: "var(--brand-violet)", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.85 }}>
                                        {career.category}
                                    </p>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", position: "relative" }}>
                                    {/* <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "var(--brand-muted)", fontWeight: 600 }}>
                                        <DollarSign size={13} style={{ color: "#86efac" }} />
                                        <span>{career.salary || "По договаряне"} лв.</span>
                                    </div> */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "var(--brand-muted)", fontWeight: 600 }}>
                                        <BookOpen size={13} style={{ color: "var(--brand-cyan)" }} />
                                        <span>{career.required_education || "Висше образование"}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid rgba(148,163,184,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                                    <span style={{ padding: "0.2rem 0.5rem", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", fontFamily: "monospace" }}>
                                        {career.riasec_code}
                                    </span>
                                    <div
                                        style={{
                                            width: "2rem",
                                            height: "2rem",
                                            borderRadius: "50%",
                                            background: "rgba(139,92,246,0.1)",
                                            border: "1px solid rgba(139,92,246,0.25)",
                                            color: "var(--brand-violet)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <EmptyState label="Няма намерени професии за твоя профил." />
                        )}
                    </div>
                    {careers.length > 5 && (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                                type="button"
                                onClick={() => setShowAllCareers(v => !v)}
                                style={{
                                    padding: "0.6rem 1.25rem",
                                    background: "transparent",
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    borderRadius: "0.625rem",
                                    color: "var(--brand-text)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                {showAllCareers ? "Скрий останалите" : `Покажи останалите ${careers.length - 5}`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* CLAUDE.md §5: "Link results to calculator — the most powerful funnel moment" */}
            <div
                style={{
                    padding: "2rem",
                    background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))",
                    border: "1px solid rgba(6,182,212,0.25)",
                    borderRadius: "1.25rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    alignItems: "center",
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em", textWrap: "balance" }}>
                        Виж дали ще влезеш в тези специалности
                    </h3>
                    <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                        Изчисли своя приемен бал и сравни с историческия среден бал за прием.
                    </p>
                </div>
                <Link
                    to="/calculator"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.875rem 2rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        border: "none", borderRadius: "0.75rem", color: "#fff",
                        fontSize: "15px", fontWeight: 800, textDecoration: "none",
                        boxShadow: "0 12px 30px rgba(6,182,212,0.35)",
                    }}
                >
                    <Calculator size={18} /> Изчисли бал за тези специалности <ArrowRight size={16} />
                </Link>
            </div>

            {/* Footer actions */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem", borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                <button
                    type="button"
                    onClick={onRestart}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.75rem 1.5rem",
                        background: "transparent",
                        border: "1px solid var(--brand-border)", borderRadius: "0.75rem",
                        color: "var(--brand-muted)", fontSize: "13px", fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "border-color 0.2s, color 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; e.currentTarget.style.color = "var(--brand-text)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--brand-border)"; e.currentTarget.style.color = "var(--brand-muted)"; }}
                >
                    <RefreshCw size={14} /> Направи теста отново
                </button>
            </div>
        </div>
    );
};

function EmptyState({ label }) {
    return (
        <div
            style={{
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                background: "var(--brand-surface)",
                border: "1px dashed var(--brand-border)",
                borderRadius: "1rem",
                color: "var(--brand-muted)",
                fontSize: "13px",
                fontWeight: 600,
            }}
        >
            {label}
        </div>
    );
}

export default RIASECResults;
