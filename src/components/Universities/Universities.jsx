import { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "motion/react";
import { Search, MapPin, Calculator, School, Heart, X, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { universityService } from "@/services/universityService";
import { useAuth } from "@/hooks/useAuth";

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.02 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
};


const inputStyle = {
    width: "100%",
    height: "3rem",
    background: "var(--brand-input-bg)",
    border: "1px solid var(--brand-input-border)",
    borderRadius: "0.75rem",
    color: "var(--brand-text)",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
};

export default function UniversitiesPage() {
    const { user, isFavorite, toggleFavorite } = useAuth();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("Всички");
    const [selectedLevel, setSelectedLevel] = useState("Всички");
    const [cities, setCities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [visibleCount, setVisibleCount] = useState(60);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [unis, cityList] = await Promise.all([
                universityService.searchUniversities({}),
                universityService.getCities(),
            ]);
            setUniversities(unis);
            setCities(cityList);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (searchTerm.length > 1) {
                const results = await universityService.searchUniversities({
                    query: searchTerm,
                    city: selectedCity === "Всички" ? "Всички" : selectedCity,
                });
                setSearchResults(results);
                setSuggestions(results.slice(0, 5));
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setSearchResults(null);
            }
        })();
    }, [searchTerm, selectedCity]);

    const filteredUnis = useMemo(() => {
        const base = searchResults ?? universities;
        return base.filter((u) => {
            const matchesCity = selectedCity === "Всички" || u.city === selectedCity;
            const matchesLevel = selectedLevel === "Всички" || u.education_level === selectedLevel;
            return matchesCity && matchesLevel;
        });
    }, [universities, searchResults, selectedCity, selectedLevel]);

    useEffect(() => { setVisibleCount(60); }, [searchTerm, selectedCity, selectedLevel]);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCity("Всички");
        setSelectedLevel("Всички");
    };

    const hasActiveFilters = searchTerm || selectedCity !== "Всички" || selectedLevel !== "Всички";

    return (
        <div
            style={{ minHeight: "100vh", background: "var(--brand-bg)", paddingTop: "7rem", paddingBottom: "5rem" }}
            onClick={() => setShowSuggestions(false)}
        >
            <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: "2.5rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--brand-cyan)", boxShadow: "0 0 10px var(--brand-cyan)" }} />
                        <span style={{ color: "var(--brand-cyan)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                            Каталог
                        </span>
                    </div>
                    <h1 style={{ fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 900, color: "var(--brand-text)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0, textWrap: "balance" }}>
                        Открий своето{" "}
                        <span style={{ background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            бъдеще
                        </span>
                    </h1>
                    {!loading && (
                        <p style={{ color: "var(--brand-muted)", marginTop: "0.625rem", fontSize: "14px", fontWeight: 500 }}>
                            {filteredUnis.length.toLocaleString("bg-BG")} специалности
                        </p>
                    )}
                </m.div>

                {/* Filter Bar */}
                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                        background: "var(--brand-surface-2)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "1.25rem",
                        padding: "0.875rem",
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap: "0.625rem",
                        position: "sticky",
                        top: "5rem",
                        zIndex: 20,
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* Search */}
                    <div style={{ position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                        <input
                            type="text"
                            placeholder="Търси специалност или университет..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "1rem" }}
                            onFocus={(e) => { e.target.style.borderColor = "rgba(6,182,212,0.5)"; if (searchTerm.length > 1) setShowSuggestions(true); }}
                            onBlur={(e) => { e.target.style.borderColor = "rgba(148,163,184,0.12)"; }}
                        />

                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <m.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                                        background: "var(--brand-dropdown-bg)", border: "1px solid var(--brand-border)",
                                        borderRadius: "0.875rem", overflow: "hidden",
                                        boxShadow: "0 20px 60px var(--brand-shadow)", zIndex: 30,
                                    }}
                                >
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={s.id || i}
                                            onClick={() => { setSearchTerm(s.specialty); setShowSuggestions(false); }}
                                            style={{
                                                padding: "0.75rem 1rem", display: "flex", alignItems: "center",
                                                gap: "0.625rem", cursor: "pointer",
                                                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                                                transition: "background 0.15s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(6,182,212,0.06)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <School size={14} style={{ color: "var(--brand-cyan)", flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-text)" }}>{s.specialty}</div>
                                                <div style={{ fontSize: "12px", color: "var(--brand-muted)" }}>{s.university_name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* City */}
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{ ...inputStyle, padding: "0 0.875rem", width: "auto", minWidth: "130px", cursor: "pointer" }}
                    >
                        {cities.map((city) => (
                            <option key={city} value={city} style={{ background: "var(--brand-dropdown-bg)" }}>{city}</option>
                        ))}
                    </select>

                    {/* Level */}
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        style={{ ...inputStyle, padding: "0 0.875rem", width: "auto", minWidth: "140px", cursor: "pointer" }}
                    >
                        <option value="Всички" style={{ background: "var(--brand-dropdown-bg)" }}>Всички степени</option>
                        <option value="бакалавър" style={{ background: "var(--brand-dropdown-bg)" }}>Бакалавър</option>
                        <option value="магистър" style={{ background: "var(--brand-dropdown-bg)" }}>Магистър</option>
                    </select>
                </m.div>

                {/* Active filter chips */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", overflow: "hidden" }}
                        >
                            {searchTerm && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(6,182,212,0.1)", color: "var(--brand-cyan)", border: "1px solid rgba(6,182,212,0.2)" }}>
                                    "{searchTerm}"
                                </span>
                            )}
                            {selectedCity !== "Всички" && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(139,92,246,0.1)", color: "var(--brand-violet)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                    {selectedCity}
                                </span>
                            )}
                            {selectedLevel !== "Всички" && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(139,92,246,0.1)", color: "var(--brand-violet)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                    {selectedLevel}
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(148,163,184,0.08)", color: "var(--brand-muted)", border: "1px solid rgba(148,163,184,0.12)", cursor: "pointer", fontFamily: "inherit" }}
                            >
                                <X size={11} /> Изчисти
                            </button>
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Loading */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: "1rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "var(--brand-cyan)", animation: "uni-spin 0.75s linear infinite" }} />
                        <p style={{ color: "var(--brand-muted)", fontSize: "14px" }}>Зареждане...</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && filteredUnis.length === 0 && (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: "center", padding: "6rem 0" }}
                    >
                        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                            <Search size={28} style={{ color: "var(--brand-muted)", opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--brand-text)", marginBottom: "0.625rem", textWrap: "balance" }}>
                            Нищо не открихме
                        </h3>
                        <p style={{ color: "var(--brand-muted)", fontSize: "14px", marginBottom: "1.5rem" }}>
                            Опитай с различни ключови думи или разшири критериите.
                        </p>
                        <button
                            onClick={resetFilters}
                            style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", border: "none", borderRadius: "0.75rem", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                            Разшири критериите
                        </button>
                    </m.div>
                )}

                {/* Grid */}
                {!loading && filteredUnis.length > 0 && (
                    <>
                        <m.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}
                        >
                            {filteredUnis.slice(0, visibleCount).map((uni) => {
                                const fav = isFavorite(String(uni.id));
                                const isMaster = uni.education_level === "магистър";
                                const levelStyle = isMaster
                                    ? { bg: "rgba(139,92,246,0.12)", color: "var(--brand-violet)", border: "rgba(139,92,246,0.25)" }
                                    : { bg: "rgba(6,182,212,0.1)", color: "var(--brand-cyan)", border: "rgba(6,182,212,0.2)" };

                                return (
                                    <m.div
                                        key={uni.id}
                                        variants={cardVariants}
                                        whileHover={{ y: -4, boxShadow: "0 0 0 1px rgba(6,182,212,0.25), 0 24px 48px var(--brand-shadow)", borderColor: "rgba(6,182,212,0.25)" }}
                                        onMouseEnter={e => { e.currentTarget.style.willChange = "transform"; }}
                                        onMouseLeave={e => { e.currentTarget.style.willChange = "auto"; }}
                                        style={{
                                            background: "var(--brand-surface)",
                                            border: "1px solid var(--brand-card-border)",
                                            borderRadius: "1.125rem",
                                            padding: "1.375rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "1rem",
                                            position: "relative",
                                            overflow: "hidden",
                                            transition: "border-color 0.2s",
                                        }}
                                    >
                                        {/* Corner glow */}
                                        <div style={{ position: "absolute", top: 0, right: 0, width: "100px", height: "100px", background: "radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 70%)", transform: "translate(30%,-30%)", pointerEvents: "none" }} />

                                        {/* Badges */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                            {uni.education_level && (
                                                <span style={{ padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", background: levelStyle.bg, color: levelStyle.color, border: `1px solid ${levelStyle.border}` }}>
                                                    {uni.education_level}
                                                </span>
                                            )}
                                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "10px", fontWeight: 600, background: "var(--brand-card-hover)", color: "var(--brand-muted)", border: "1px solid var(--brand-border)" }}>
                                                <MapPin size={9} /> {uni.city}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--brand-text)", lineHeight: 1.45, margin: "0 0 0.375rem", textWrap: "balance" }}>
                                                {uni.specialty}
                                            </h2>
                                            <p style={{ fontSize: "12px", color: "var(--brand-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 500, margin: 0 }}>
                                                <School size={12} style={{ flexShrink: 0 }} />
                                                {uni.university_name}
                                            </p>
                                            {uni.faculty && uni.faculty !== uni.specialty && (
                                                <p style={{ fontSize: "11px", color: "var(--brand-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 400, opacity: 0.65, margin: "0.2rem 0 0" }}>
                                                    <BookOpen size={10} style={{ flexShrink: 0 }} />
                                                    {uni.faculty}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.875rem", borderTop: "1px solid var(--brand-border)" }}>
                                            <Link
                                                to={`/calculator?specialty=${encodeURIComponent(uni.specialty)}`}
                                                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.875rem", background: "linear-gradient(135deg,var(--brand-cyan),#0891b2)", border: "none", borderRadius: "0.625rem", color: "#fff", fontWeight: 700, fontSize: "12px", textDecoration: "none", fontFamily: "inherit", flexShrink: 0 }}
                                            >
                                                <Calculator size={13} /> Изчисли бал
                                            </Link>
                                            {user && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(String(uni.id)); }}
                                                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.75rem", background: fav ? "rgba(239,68,68,0.1)" : "rgba(148,163,184,0.07)", border: fav ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(148,163,184,0.12)", borderRadius: "0.625rem", color: fav ? "#ef4444" : "var(--brand-muted)", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                                                    aria-label={fav ? "Премахни от любими" : "Добави в любими"}
                                                >
                                                    <Heart size={13} fill={fav ? "#ef4444" : "none"} />
                                                    {fav ? "В любими" : "Запази"}
                                                </button>
                                            )}
                                        </div>
                                    </m.div>
                                );
                            })}
                        </m.div>

                        {filteredUnis.length > visibleCount && (
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount((c) => c + 60)}
                                    style={{ padding: "0.75rem 2rem", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--brand-border)")}
                                >
                                    Покажи още {Math.min(60, filteredUnis.length - visibleCount)}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes uni-spin { to { transform: rotate(360deg); } }
                input[type="text"]::placeholder { color: var(--brand-muted); opacity: 0.6; }
            `}</style>
        </div>
    );
}
