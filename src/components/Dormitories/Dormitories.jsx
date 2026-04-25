import { useEffect, useState } from "react";
import { m } from "motion/react";
import { getAllDormitories } from "@/lib/api";
import {
    Building2,
    MapPin,
    Bus,
    Bath,
    Hammer,
    Star,
    Calculator,
    School,
    Search,
    Clock,
    Route,
    CalendarDays,
    ExternalLink,
    Filter,
    X,
} from "lucide-react";

const BGN_TO_EUR = 1.95583;

const S = {
    surface: {
        background: "var(--brand-surface)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--brand-border)",
        borderRadius: "1rem",
    },
    inset: {
        background: "var(--brand-input-bg)",
        border: "1px solid var(--brand-border)",
        borderRadius: "0.75rem",
    },
};

function RatingStars({ value = 0 }) {
    const full = Math.floor(value);
    const half = value - full > 0;
    return (
        <div style={{ display: "flex", gap: "2px" }}>
            {[...Array(5)].map((_, i) => {
                if (i < full) return <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />;
                if (i === full && half) {
                    return (
                        <span key={i} style={{ position: "relative", display: "inline-block", width: 13, height: 13 }}>
                            <Star size={13} fill="none" color="rgba(148,163,184,0.3)" />
                            <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: "50%" }}>
                                <Star size={13} fill="#fbbf24" color="#fbbf24" />
                            </span>
                        </span>
                    );
                }
                return <Star key={i} size={13} fill="none" color="rgba(148,163,184,0.3)" />;
            })}
        </div>
    );
}

function DormCard({ dorm }) {
    const toEur = bgn => Math.round(bgn / BGN_TO_EUR);
    const rent = dorm.monthly_rent_avg || 0;
    const deposit = dorm.deposit_amount || 0;
    const utility = 40;
    const hasFinancialData = rent > 0;

    return (
        <div
            style={{
                ...S.surface,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(6,182,212,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--brand-border)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.2rem 0.5rem",
                            background: "var(--brand-border)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--brand-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: "0.5rem",
                        }}
                    >
                        <School size={10} /> {dorm.university_id}
                    </div>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "1.125rem",
                            fontWeight: 800,
                            color: "var(--brand-text)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.3,
                        }}
                    >
                        {dorm.block_number}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--brand-muted)", fontSize: "12px", marginTop: "0.2rem" }}>
                        <MapPin size={12} /> {dorm.city}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <RatingStars value={dorm.condition_rating || 0} />
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.25rem" }}>
                        {dorm.condition_rating || 0}/5
                    </span>
                </div>
            </div>

            {/* Feature badges */}
            {(dorm.is_renovated || dorm.has_private_bathroom) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {dorm.is_renovated && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "999px", color: "#86efac", fontSize: "11px", fontWeight: 600 }}>
                            <Hammer size={11} /> Реновиран
                        </span>
                    )}
                    {dorm.has_private_bathroom && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "11px", fontWeight: 600 }}>
                            <Bath size={11} /> Собствена баня
                        </span>
                    )}
                </div>
            )}

            {/* Distance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ ...S.inset, padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Route size={15} style={{ color: "var(--brand-cyan)", marginBottom: "0.3rem" }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-text)", fontFamily: "monospace" }}>
                        {dorm.distance_to_uni_km != null ? `${dorm.distance_to_uni_km} км` : "—"}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.125rem" }}>до университета</span>
                </div>
                <div style={{ ...S.inset, padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Clock size={15} style={{ color: "var(--brand-violet)", marginBottom: "0.3rem" }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-text)", fontFamily: "monospace" }}>
                        {dorm.commute_minutes != null ? `${dorm.commute_minutes} мин` : "—"}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.125rem" }}>пътуване</span>
                </div>
            </div>

            {/* Transport */}
            <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                    <Bus size={11} /> Транспорт
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {dorm.transport_lines && dorm.transport_lines.length > 0 ? (
                        dorm.transport_lines.map((line, i) => (
                            <span key={i} style={{ padding: "0.15rem 0.5rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 700, color: "var(--brand-text)", fontFamily: "monospace" }}>
                                {line}
                            </span>
                        ))
                    ) : (
                        <span style={{ fontSize: "11px", color: "var(--brand-muted)", opacity: 0.5, fontStyle: "italic" }}>Няма информация</span>
                    )}
                </div>
            </div>

            {/* Application period */}
            {dorm.application_period ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.625rem" }}>
                    <CalendarDays size={14} style={{ color: "#fbbf24", flexShrink: 0 }} />
                    <div>
                        <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Кандидатстване</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-text)" }}>{dorm.application_period}</span>
                    </div>
                </div>
            ) : null}

            {/* Cost calculator */}
            <div style={{ ...S.inset, padding: "1rem" }}>
                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-cyan)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem" }}>
                    <Calculator size={12} /> Калкулатор "Оцеляване"
                </h4>
                {hasFinancialData ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "13px" }}>
                        <Row label="Наем / месец" value={`${toEur(rent)} €`} strong />
                        {deposit > 0 && <Row label="Депозит (еднократно)" value={`${toEur(deposit)} €`} />}
                        <Row label="Сметки (прибл.)" value={`${toEur(utility)} €`} />
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--brand-muted)", opacity: 0.5, fontStyle: "italic", textAlign: "center" }}>
                        Цените не са посочени
                    </p>
                )}
            </div>

            {/* Maps link */}
            {dorm.google_maps_url && (
                <a
                    href={dorm.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 1rem",
                        background: "rgba(6,182,212,0.08)",
                        border: "1px solid rgba(6,182,212,0.25)",
                        borderRadius: "0.625rem",
                        color: "var(--brand-cyan)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.15)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,0.08)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; }}
                >
                    <MapPin size={14} />
                    Виж на картата
                    <ExternalLink size={12} style={{ opacity: 0.7 }} />
                </a>
            )}
        </div>
    );
}

function Row({ label, value, strong = false }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--brand-muted)", opacity: 0.8 }}>{label}</span>
            <span style={{ fontFamily: "monospace", fontWeight: strong ? 800 : 600, color: strong ? "var(--brand-text)" : "var(--brand-muted)" }}>
                {value}
            </span>
        </div>
    );
}

function Skeleton() {
    return (
        <div
            style={{
                ...S.surface,
                height: "380px",
                background: "linear-gradient(110deg, var(--brand-surface) 30%, var(--brand-border) 50%, var(--brand-surface) 70%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s linear infinite",
            }}
        />
    );
}

const Dormitories = () => {
    const [dormitories, setDormitories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUniversity, setSelectedUniversity] = useState("");
    const [universities, setUniversities] = useState([]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAllDormitories();
            setDormitories(data);
            const unis = [...new Set(data.map(d => d.university_id))].filter(Boolean).sort();
            setUniversities(unis);
            setLoading(false);
        })();
    }, []);

    const filteredDorms = selectedUniversity
        ? dormitories.filter(d => d.university_id === selectedUniversity)
        : dormitories;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", padding: "7rem 1.5rem 3rem", color: "var(--brand-text)" }}>
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand-violet)", boxShadow: "0 0 12px rgba(139,92,246,0.6)" }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Жилищна база
                        </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.75rem", textWrap: "balance" }}>
                        <Building2 size={32} style={{ color: "var(--brand-cyan)" }} />
                        Общежития
                    </h1>
                    <p style={{ margin: 0, color: "var(--brand-muted)", fontSize: "1rem", maxWidth: "640px" }}>
                        Намери най-доброто място за студентския си живот — бюджет, транспорт и условия на едно място.
                    </p>
                </m.div>

                {/* Filter bar */}
                <div
                    style={{
                        ...S.surface,
                        padding: "1rem 1.25rem",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-muted)" }}>
                        <Filter size={14} />
                        <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Филтри</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "240px" }}>
                        <School size={14} style={{ color: "var(--brand-muted)" }} />
                        <select
                            value={selectedUniversity}
                            onChange={e => setSelectedUniversity(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "0.55rem 0.75rem",
                                background: "var(--brand-input-bg)",
                                border: "1px solid var(--brand-input-border)",
                                borderRadius: "0.5rem",
                                color: "var(--brand-text)",
                                fontSize: "13px",
                                fontFamily: "inherit",
                                outline: "none",
                            }}
                        >
                            <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Всички университети</option>
                            {universities.map(u => (
                                <option key={u} value={u} style={{ background: "var(--brand-dropdown-bg)" }}>{u}</option>
                            ))}
                        </select>
                    </div>
                    {selectedUniversity && (
                        <button
                            type="button"
                            onClick={() => setSelectedUniversity("")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.4rem 0.75rem",
                                background: "rgba(6,182,212,0.1)",
                                border: "1px solid rgba(6,182,212,0.3)",
                                borderRadius: "999px",
                                color: "var(--brand-cyan)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            <X size={12} /> Изчисти
                        </button>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)", marginLeft: "auto" }}>
                        {loading ? "..." : `${filteredDorms.length} резултат${filteredDorms.length === 1 ? "" : "а"}`}
                    </span>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                    </div>
                ) : filteredDorms.length === 0 ? (
                    <div
                        style={{
                            ...S.surface,
                            padding: "4rem 2rem",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "4rem",
                                height: "4rem",
                                margin: "0 auto 1rem",
                                borderRadius: "1rem",
                                background: "rgba(6,182,212,0.08)",
                                border: "1px solid rgba(6,182,212,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Search size={28} style={{ color: "var(--brand-cyan)" }} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-text)", textWrap: "balance" }}>
                            Няма намерени общежития
                        </h3>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--brand-muted)", fontSize: "14px" }}>
                            Опитай с по-широко търсене или премахни филтъра по университет.
                        </p>
                        {selectedUniversity && (
                            <button
                                type="button"
                                onClick={() => setSelectedUniversity("")}
                                style={{
                                    marginTop: "1.25rem",
                                    padding: "0.6rem 1.25rem",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    border: "none",
                                    borderRadius: "0.625rem",
                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                Покажи всички
                            </button>
                        )}
                    </div>
                ) : (
                    <m.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}
                    >
                        {filteredDorms.map(dorm => (
                            <m.div
                                key={dorm.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                                }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <DormCard dorm={dorm} />
                            </m.div>
                        ))}
                    </m.div>
                )}
            </div>
        </div>
    );
};

export default Dormitories;
