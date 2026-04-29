import { useEffect, useMemo, useState } from "react";
import { m } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { universityService } from "@/services/universityService";
import { Search, MapPin, School, Heart, Calculator, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
    const { user, favorites, isFavorite, toggleFavorite } = useAuth();
    const [allFavoritesData, setAllFavoritesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("Всички");

    useEffect(() => {
        const load = async () => {
            if (!user || favorites.length === 0) {
                setAllFavoritesData([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Server-side: дърпаме само записите с тези ID-та (а не цялата таблица)
                const data = await universityService.getByIds(favorites);
                setAllFavoritesData(data);
            } catch (err) {
                console.error("Favorites load failed:", err);
                setAllFavoritesData([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, favorites]);

    const cities = useMemo(() => {
        const set = new Set(["Всички"]);
        allFavoritesData.forEach(u => u.city && set.add(u.city));
        return Array.from(set);
    }, [allFavoritesData]);

    const filtered = useMemo(() => {
        return allFavoritesData.filter(u => {
            const matchesCity = cityFilter === "Всички" || u.city === cityFilter;
            const term = search.trim().toLowerCase();
            if (!term) return matchesCity;
            const haystack = `${u.specialty || ""} ${u.university_name || ""}`.toLowerCase();
            return matchesCity && haystack.includes(term);
        });
    }, [allFavoritesData, search, cityFilter]);

    if (!user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--brand-bg)",
                    color: "var(--brand-text)",
                    padding: "7rem 1.5rem 3rem",
                }}
            >
                <div
                    style={{
                        maxWidth: "440px",
                        textAlign: "center",
                        background: "var(--brand-surface)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "1.5rem",
                        padding: "2.5rem 2rem",
                    }}
                >
                    <div
                        style={{
                            width: "3.5rem",
                            height: "3.5rem",
                            margin: "0 auto 1rem",
                            borderRadius: "1rem",
                            background: "rgba(248,113,113,0.1)",
                            border: "1px solid rgba(248,113,113,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Heart size={24} style={{ color: "#fca5a5" }} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", textWrap: "balance" }}>
                        Любимите са само за логнати потребители
                    </h1>
                    <p style={{ margin: "0.75rem 0 1.5rem", color: "var(--brand-muted)", fontSize: "14px" }}>
                        Влез в профила си, за да запазваш и виждаш любимите специалности.
                    </p>
                    <Link
                        to="/login"
                        style={{
                            display: "inline-flex",
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 800,
                            textDecoration: "none",
                            boxShadow: "0 12px 30px rgba(6,182,212,0.3)",
                        }}
                    >
                        Към вход
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 3rem" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Heart size={14} style={{ color: "#f87171", fill: "#f87171" }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Запазени
                        </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", textWrap: "balance" }}>
                        Моите любими специалности
                    </h1>
                    <p style={{ margin: 0, color: "var(--brand-muted)", fontSize: "1rem", maxWidth: "640px" }}>
                        Запазени университети и специалности, достъпни от всеки твой вход.
                    </p>
                </m.div>

                <div
                    style={{
                        background: "var(--brand-surface)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "1rem",
                        padding: "1rem 1.25rem",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "0.75rem",
                        position: "sticky",
                        top: "6rem",
                        zIndex: 20,
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                        <input
                            type="text"
                            placeholder="Търси в любимите..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                height: "2.75rem",
                                padding: "0 0.875rem 0 2.5rem",
                                background: "var(--brand-input-bg)",
                                border: "1px solid var(--brand-input-border)",
                                borderRadius: "0.625rem",
                                color: "var(--brand-text)",
                                fontSize: "13px",
                                fontWeight: 500,
                                fontFamily: "inherit",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <select
                        value={cityFilter}
                        onChange={e => setCityFilter(e.target.value)}
                        style={{
                            height: "2.75rem",
                            minWidth: "160px",
                            padding: "0 0.875rem",
                            background: "var(--brand-input-bg)",
                            border: "1px solid var(--brand-input-border)",
                            borderRadius: "0.625rem",
                            color: "var(--brand-text)",
                            fontSize: "13px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        {cities.map(city => (
                            <option key={city} value={city} style={{ background: "var(--brand-dropdown-bg)" }}>{city}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
                        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", border: "3px solid rgba(6,182,212,0.2)", borderTopColor: "var(--brand-cyan)", animation: "spin 1s linear infinite" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            textAlign: "center",
                            padding: "4rem 2rem",
                            background: "var(--brand-surface)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "1.25rem",
                        }}
                    >
                        <div
                            style={{
                                width: "4rem",
                                height: "4rem",
                                margin: "0 auto 1rem",
                                borderRadius: "1rem",
                                background: "rgba(248,113,113,0.1)",
                                border: "1px solid rgba(248,113,113,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Heart size={28} style={{ color: "#fca5a5" }} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, textWrap: "balance" }}>Все още нямаш запазени специалности.</h3>
                        <p style={{ margin: "0.5rem auto 1.25rem", color: "var(--brand-muted)", fontSize: "14px", maxWidth: "400px", lineHeight: 1.6 }}>
                            Намери специалност, която те интересува, и я добави тук с натискане на сърцето.
                        </p>
                        <Link
                            to="/universities"
                            style={{
                                display: "inline-flex",
                                padding: "0.6rem 1.25rem",
                                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                borderRadius: "0.625rem",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            Към университетите
                        </Link>
                    </m.div>
                ) : (
                    <m.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}
                    >
                        {filtered.map(uni => {
                            const favorite = isFavorite(String(uni.id));
                            return (
                                <m.div
                                    key={uni.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                                    }}
                                    style={{
                                        position: "relative",
                                        padding: "1.5rem",
                                        background: "var(--brand-surface)",
                                        backdropFilter: "blur(8px)",
                                        border: "1px solid var(--brand-border)",
                                        borderRadius: "1rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1rem",
                                        overflow: "hidden",
                                        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)";
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 16px 40px rgba(6,182,212,0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "var(--brand-border)";
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <div
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            top: "-80px",
                                            right: "-80px",
                                            width: "160px",
                                            height: "160px",
                                            borderRadius: "50%",
                                            background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)",
                                            pointerEvents: "none",
                                        }}
                                    />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", position: "relative" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            <MapPin size={10} style={{ color: "var(--brand-cyan)" }} /> {uni.city}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(String(uni.id))}
                                            style={{
                                                padding: "0.3rem",
                                                background: favorite ? "rgba(248,113,113,0.1)" : "var(--brand-border)",
                                                border: `1px solid ${favorite ? "rgba(248,113,113,0.3)" : "rgba(148,163,184,0.15)"}`,
                                                borderRadius: "999px",
                                                color: favorite ? "#f87171" : "var(--brand-muted)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            aria-label="Премахни от любими"
                                        >
                                            <Heart size={14} fill={favorite ? "#f87171" : "none"} />
                                        </button>
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em", color: "var(--brand-text)" }}>
                                            {uni.specialty}
                                        </h2>
                                        <p style={{ margin: "0.4rem 0 0", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "12px", color: "var(--brand-muted)", fontWeight: 600 }}>
                                            <School size={12} /> {uni.university_name}
                                        </p>
                                    </div>

                                    <div style={{ marginTop: "auto", paddingTop: "0.875rem", borderTop: "1px solid var(--brand-border)", position: "relative" }}>
                                        <Link
                                            to={`/calculator?specialty=${encodeURIComponent(uni.specialty)}`}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.4rem",
                                                padding: "0.5rem 0.875rem",
                                                background: "rgba(6,182,212,0.1)",
                                                border: "1px solid rgba(6,182,212,0.3)",
                                                borderRadius: "0.5rem",
                                                color: "var(--brand-cyan)",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                textDecoration: "none",
                                            }}
                                        >
                                            <Calculator size={13} /> Изчисли бал
                                        </Link>
                                    </div>
                                </m.div>
                            );
                        })}
                    </m.div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;
