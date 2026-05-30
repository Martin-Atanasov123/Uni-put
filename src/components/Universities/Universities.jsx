import { useState, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import {
    Search, MapPin, Calculator, School, Heart, X, BookOpen,
    GraduationCap, Briefcase, Wrench, Leaf, Palette, Shield,
    Globe, FlaskConical, HeartPulse, LayoutGrid, Rows3,
    ArrowLeft, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { universityService } from "@/services/universityService";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import { slugify } from "@/lib/slugify";

// ─── rsvu.mon.bg High-level groups ──────────────────────────────────────────
// Matches the official МОН classification 
const GROUPS = [
    {
        id: "social",
        name: "Социални, стопански и правни науки",
        icon: Briefcase,
        accent: "#06B6D4",
        bg: "rgba(6,182,212,0.08)",
        border: "rgba(6,182,212,0.18)",
    },
    {
        id: "tech",
        name: "Технически науки",
        icon: Wrench,
        accent: "#8B5CF6",
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.18)",
    },
    {
        id: "nat",
        name: "Природни науки, математика и информатика",
        icon: FlaskConical,
        accent: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.18)",
    },
    {
        id: "health",
        name: "Здравеопазване и спорт",
        icon: HeartPulse,
        accent: "#ec4899",
        bg: "rgba(236,72,153,0.08)",
        border: "rgba(236,72,153,0.18)",
    },
    {
        id: "hum",
        name: "Хуманитарни науки",
        icon: Globe,
        accent: "#FBBF24",
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.18)",
    },
    {
        id: "ped",
        name: "Педагогически науки",
        icon: GraduationCap,
        accent: "#f97316",
        bg: "rgba(249,115,22,0.08)",
        border: "rgba(249,115,22,0.18)",
    },
    {
        id: "agr",
        name: "Аграрни науки и ветеринарна медицина",
        icon: Leaf,
        accent: "#22c55e",
        bg: "rgba(34,197,94,0.08)",
        border: "rgba(34,197,94,0.18)",
    },
    {
        id: "arts",
        name: "Изкуства",
        icon: Palette,
        accent: "#a855f7",
        bg: "rgba(168,85,247,0.08)",
        border: "rgba(168,85,247,0.18)",
    },
    {
        id: "sec",
        name: "Сигурност и отбрана",
        icon: Shield,
        accent: "#64748b",
        bg: "rgba(100,116,139,0.08)",
        border: "rgba(100,116,139,0.18)",
    },
];

// Maps REAL faculty names from the DB `faculty` column to rsvu high-level groups.
// Faculty names are the official МОН professional directions — fetched directly from DB,
// no keyword guessing.
const FACULTY_TO_GROUP = {
    // ── Педагогически науки ───────────────────────────────────────────
    "Педагогика": "ped",
    "Педагогика на обучението": "ped",
    "Педагогически": "ped",
    "Педагогически факултет": "ped",
    "Науки за образованието и изкуствата": "ped",

    // ── Хуманитарни науки ─────────────────────────────────────────────
    "Филология": "hum",
    "Класически и нови филологии": "hum",
    "Философия": "hum",
    "История и археология": "hum",
    "Исторически науки": "hum",
    "Теоретичен факултет": "hum",

    // ── Социални, стопански и правни науки ───────────────────────────
    "Икономика": "social",
    "Администрация и управление": "social",
    "Стопански науки": "social",
    "Стопански": "social",
    "Туризъм": "social",
    "Право": "social",
    "Правно-исторически науки": "social",
    "Психология": "social",
    "Политически науки": "social",
    "Социология, антропология и науки за културата": "social",
    "Обществени комуникации и информационни науки": "social",

    // ── Природни науки, математика и информатика ─────────────────────
    "Информатика и компютърни науки": "nat",
    "Математика и информатика": "nat",
    "Математика": "nat",
    "Физически науки": "nat",
    "Биологически науки": "nat",
    "Химически науки": "nat",
    "Науки за земята": "nat",
    "Природни науки и технологии": "nat",
    "Природо-математически науки": "nat",
    "Геолого-географски науки": "nat",

    // ── Технически науки ─────────────────────────────────────────────
    "Комуникационна и компютърна техника": "tech",
    "Общо инженерство": "tech",
    "Машинно инженерство": "tech",
    "Архитектура, строителство и геодезия": "tech",
    "Електротехника, електроника и автоматика": "tech",
    "Транспорт, корабоплаване и авиация": "tech",
    "Хранителни технологии": "tech",
    "Техника и технологии": "tech",
    "Електротехника и електроника": "tech",
    "Морски транспорт и технологии": "tech",
    "Транспортна, корабна и авиационна техника": "tech",
    "Технически науки": "tech",
    "Проучване, добив и обработка на полезни изкопаеми": "tech",

    // ── Здравеопазване и спорт ────────────────────────────────────────
    "Здравни грижи": "health",
    "Медицина": "health",
    "Медицински колеж": "health",
    "Медицински": "health",
    "Обществено здраве": "health",
    "Химия и фармация": "health",

    // ── Аграрни науки и ветеринарна медицина ─────────────────────────
    "Аграрен": "agr",
    "Растениевъдство": "agr",
    "Горско стопанство": "agr",
    "Растителна защита": "agr",
    "Животновъдство": "agr",
    "Ветеринарна медицина": "agr",
    "Ветеринарномедицински": "agr",

    // ── Изкуства ──────────────────────────────────────────────────────
    "Изобразително изкуство": "arts",
    "Изкуства": "arts",
    "Екранни изкуства": "arts",
    "Сценични изкуства": "arts",
    "Театрално и филмово изкуство": "arts",
    "Музикално и танцово изкуство": "arts",
    "Хореографски факултет": "arts",
    "Инструментален факултет": "arts",
    "Поп и джаз изкуство": "arts",
    "Вокален факултет": "arts",
    "Музикална режисура и звукорежисура": "arts",
    "Теория на изкуствата": "arts",
    "Педагогика на изкуствата": "arts",

    // ── Сигурност и отбрана ───────────────────────────────────────────
    "Национална сигурност": "sec",
    "Военноморски науки": "sec",
    "Военно дело": "sec",
    "Сигурност и отбрана": "sec",

    // ── Здравеопазване и спорт (допълнителни) ────────────────────────
    "Обществено здраве и спорт": "health",
    "Факултет по обществено здраве": "health",
    "Здравеопазване и спорт": "health",
    "Дентална медицина": "health",
    "Факултет по дентална медицина": "health",
    "Медицински факултет": "health",
    "Фармацевтичен факултет": "health",
    "Фармация": "health",
    "Кинезитерапия": "health",
    "Спорт": "health",
    "Спортен мениджмънт": "health",

    // ── Технически науки (допълнителни) ─────────────────────────────
    "Енергетика": "tech",
    "Информационни и комуникационни технологии": "tech",
    "Химични технологии": "tech",
    "Материали и материалознание": "tech",
    "Металургия": "tech",
    "Електротехника, електроника и автоматизация": "tech",
    "Архитектура": "tech",
    "Компютърна и комуникационна техника": "tech",

    // ── Природни науки, математика и информатика (допълнителни) ──────
    "Биотехнологии": "nat",

    // ── Хуманитарни науки (допълнителни) ─────────────────────────────
    "Славянски филологии": "hum",
    "Религия и теология": "hum",
    "Богословие": "hum",

    // ── Социални, стопански и правни науки (допълнителни) ────────────
    "Социални дейности": "social",
    "Журналистика и масова комуникация": "social",
    "Колеж по туризъм – Варна": "social",
    "Обществени комуникации": "social",
    "Социология": "social",
    "Социална работа": "social",

    // ── Педагогически науки (допълнителни) ───────────────────────────
    "Педагогика на обучението по математика, физика и информатика": "ped",
};

// ─── Animation variants ────────────────────────────────────────────────────
const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.025 } },
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

// ─── Direction Group Card (rsvu-inspired) ──────────────────────────────────
function GroupCard({ group, total, specialties, univCount, cityCount, onSelect, onSpecialtyClick }) {
    const Icon = group.icon;
    const [hovered, setHovered] = useState(false);

    return (
        <m.div
            variants={cardVariants}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onSelect(group)}
            style={{
                background: "var(--brand-surface)",
                border: `1px solid ${hovered ? group.accent + "55" : "var(--brand-card-border)"}`,
                borderRadius: "1.25rem",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.22s, transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: hovered
                    ? `0 20px 48px rgba(0,0,0,0.18), 0 0 0 1px ${group.accent}33`
                    : "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            {/* Illustrated header — rsvu style */}
            <div
                style={{
                    background: group.bg,
                    borderBottom: `1px solid ${group.border}`,
                    padding: "1.25rem 1.375rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "84px",
                }}
            >
                {/* Ambient glow */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse at 80% 50%, ${group.accent}18 0%, transparent 70%)`,
                    pointerEvents: "none",
                }} />

                {/* Icon "card" — white surface with icon (rsvu white-card-inside-green-rect pattern) */}
                <div style={{
                    width: "48px", height: "48px", flexShrink: 0,
                    background: "var(--brand-surface)",
                    border: `1px solid ${group.border}`,
                    borderRadius: "0.75rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 16px ${group.accent}22`,
                    position: "relative", zIndex: 1,
                }}>
                    <Icon size={22} strokeWidth={1.5} style={{ color: group.accent }} />
                </div>

                {/* Count + group name */}
                <div style={{ flex: 1, position: "relative", zIndex: 1, minWidth: 0 }}>
                    {/* Group name instead of generic "НАПРАВЛЕНИЕ" */}
                    <div style={{
                        fontSize: "13px", fontWeight: 700, color: group.accent,
                        marginBottom: "0.25rem", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                        {group.name}
                    </div>
                    <div style={{
                        fontSize: "1.5rem", fontWeight: 900,
                        fontFamily: "monospace", lineHeight: 1,
                        background: `linear-gradient(135deg, ${group.accent}, ${group.accent}bb)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}>
                        {total}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--brand-muted)", fontWeight: 500 }}>
                        специалности
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                    size={18} strokeWidth={1.5}
                    style={{
                        color: group.accent,
                        opacity: hovered ? 1 : 0.35,
                        transition: "opacity 0.2s, transform 0.2s",
                        transform: hovered ? "translateX(3px)" : "translateX(0)",
                        flexShrink: 0, position: "relative", zIndex: 1,
                    }}
                />
            </div>

            {/* Body */}
            <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                {/* Uni/city meta */}
                {(univCount > 0 || cityCount > 0) && (
                    <div style={{
                        fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)",
                        marginBottom: "0.75rem", display: "flex", gap: "0.75rem",
                    }}>
                        {univCount > 0 && <span>{univCount} {univCount === 1 ? "университет" : "университета"}</span>}
                        {cityCount > 0 && <span>{cityCount} {cityCount === 1 ? "град" : "града"}</span>}
                    </div>
                )}

                {/* Specialty pills — REAL specialty names from DB */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {specialties.slice(0, 5).map(({ name }) => (
                        <button
                            key={name}
                            onClick={(e) => { e.stopPropagation(); onSpecialtyClick(name); }}
                            style={{
                                padding: "0.2rem 0.6rem",
                                borderRadius: "999px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: group.bg,
                                color: group.accent,
                                border: `1px solid ${group.border}`,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "background 0.15s, transform 0.15s",
                                maxWidth: "180px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = group.accent + "22";
                                e.currentTarget.style.transform = "scale(1.04)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = group.bg;
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {name}
                        </button>
                    ))}
                    {specialties.length > 5 && (
                        <span style={{
                            padding: "0.2rem 0.6rem", borderRadius: "999px",
                            fontSize: "11px", fontWeight: 600,
                            background: "var(--brand-surface-2)",
                            color: "var(--brand-muted)",
                            border: "1px solid var(--brand-border)",
                        }}>
                            +{specialties.length - 5} още
                        </span>
                    )}
                </div>
            </div>
        </m.div>
    );
}

// ─── Specialty card (search results) ──────────────────────────────────────
function SpecialtyCard({ uni, isFav, onToggleFav, showUser }) {
    const isMaster = uni.education_level === "магистър";
    const levelStyle = isMaster
        ? { bg: "rgba(139,92,246,0.12)", color: "var(--brand-violet)", border: "rgba(139,92,246,0.25)" }
        : { bg: "rgba(6,182,212,0.1)", color: "var(--brand-cyan)", border: "rgba(6,182,212,0.2)" };

    return (
        <m.div
            variants={cardVariants}
            whileHover={{ y: -4, boxShadow: "0 0 0 1px rgba(6,182,212,0.25), 0 24px 48px var(--brand-shadow)", borderColor: "rgba(6,182,212,0.25)" }}
            onMouseEnter={(e) => { e.currentTarget.style.willChange = "transform"; }}
            onMouseLeave={(e) => { e.currentTarget.style.willChange = "auto"; }}
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
                    <Link
                        to={`/universities/${slugify(uni.university_name)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "inherit", textDecoration: "none", borderBottom: "1px dotted var(--brand-border)" }}
                    >
                        {uni.university_name}
                    </Link>
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
                {showUser && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
                        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.75rem", background: isFav ? "rgba(239,68,68,0.1)" : "rgba(148,163,184,0.07)", border: isFav ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(148,163,184,0.12)", borderRadius: "0.625rem", color: isFav ? "#ef4444" : "var(--brand-muted)", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                        aria-label={isFav ? "Премахни от любими" : "Добави в любими"}
                    >
                        <Heart size={13} fill={isFav ? "#ef4444" : "none"} />
                        {isFav ? "В любими" : "Запази"}
                    </button>
                )}
            </div>
        </m.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function UniversitiesPage() {
    const { user, isFavorite, toggleFavorite } = useAuth();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("Всички");
    const [selectedLevel, setSelectedLevel] = useState("Всички");
    const [cities, setCities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [visibleCount, setVisibleCount] = useState(60);
    const [viewMode, setViewMode] = useState("browse");
    // Real DB-based filters
    const [selectedGroup, setSelectedGroup] = useState(null);   // group id
    const [selectedFaculty, setSelectedFaculty] = useState(null); // exact faculty name from DB
    const gridRef = useRef(null);

    const loadInitial = async () => {
        setLoading(true);
        setError(null);
        try {
            const [batch1, batch2, cityList] = await Promise.all([
                universityService.searchUniversities({ limit: 1000, offset: 0 }),
                universityService.searchUniversities({ limit: 1000, offset: 1000 }),
                universityService.getCities(),
            ]);
            const unis = [...batch1, ...batch2];
            setUniversities(unis);
            setCities(cityList);
        } catch (err) {
            console.error("Universities initial load failed:", err);
            setError("Не успяхме да заредим данните. Провери връзката и опитай пак.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitial(); }, []);

    // Debounced server-side text/city/level search
    useEffect(() => {
        const hasFilters =
            searchTerm.trim().length > 1 ||
            selectedCity !== "Всички" ||
            selectedLevel !== "Всички";

        if (!hasFilters) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const results = await universityService.searchUniversities({
                    query: searchTerm.trim(),
                    city: selectedCity,
                    level: selectedLevel,
                    limit: 500,
                });
                setUniversities(results);
                if (searchTerm.trim().length > 1) {
                    setSuggestions(results.slice(0, 5));
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (err) {
                console.error("Universities search failed:", err);
                setError("Грешка при търсене. Опитай отново.");
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedCity, selectedLevel]);

    useEffect(() => { setVisibleCount(60); }, [searchTerm, selectedCity, selectedLevel, selectedFaculty, selectedGroup]);

    const hasTextFilters =
        searchTerm.trim().length > 0 ||
        selectedCity !== "Всички" ||
        selectedLevel !== "Всички";

    const hasActiveFilters = hasTextFilters || !!selectedFaculty || !!selectedGroup;

    // Switch to search mode whenever any filter is active
    useEffect(() => {
        if (hasActiveFilters) setViewMode("search");
    }, [hasActiveFilters]);

    // ── Group data computed from REAL DB data ──────────────────────────────
    // Uses FACULTY_TO_GROUP mapping — no keyword guessing.
    const groupData = useMemo(() => {
        const data = {};
        GROUPS.forEach((g) => {
            data[g.id] = { total: 0, specialtyCounts: {}, univNames: new Set(), cityNames: new Set() };
        });

        universities.forEach((uni) => {
            const gid = FACULTY_TO_GROUP[uni.faculty];
            if (!gid || !data[gid]) return;
            data[gid].specialtyCounts[uni.specialty] = (data[gid].specialtyCounts[uni.specialty] || 0) + 1;
            if (uni.university_name) data[gid].univNames.add(uni.university_name);
            if (uni.city) data[gid].cityNames.add(uni.city);
            data[gid].total++;
        });

        const result = {};
        Object.entries(data).forEach(([id, { total, specialtyCounts, univNames, cityNames }]) => {
            result[id] = {
                total,
                specialties: Object.entries(specialtyCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name]) => ({ name })),
                univCount: univNames.size,
                cityCount: cityNames.size,
            };
        });
        return result;
    }, [universities]);

    // ── Client-side group/faculty filter on top of server results ──────────
    const displayUnis = useMemo(() => {
        let result = universities;
        if (selectedFaculty) {
            result = result.filter((u) => u.faculty === selectedFaculty);
        } else if (selectedGroup) {
            result = result.filter((u) => FACULTY_TO_GROUP[u.faculty] === selectedGroup);
        }
        return result;
    }, [universities, selectedFaculty, selectedGroup]);

    // Stats
    const totalUniversities = useMemo(
        () => new Set(universities.map((u) => u.university_name)).size,
        [universities]
    );
    const totalCities = useMemo(
        () => new Set(universities.map((u) => u.city).filter(Boolean)).size,
        [universities]
    );
    const activeGroupsCount = useMemo(
        () => GROUPS.filter((g) => (groupData[g.id]?.total || 0) > 0).length,
        [groupData]
    );

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCity("Всички");
        setSelectedLevel("Всички");
        setSelectedGroup(null);
        setSelectedFaculty(null);
        setViewMode("browse");
        loadInitial();
    };

    const handleGroupSelect = (group) => {
        setSelectedGroup(group.id);
        setSelectedFaculty(null);
        setViewMode("search");
        setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const handleFacultyClick = (facultyName) => {
        setSelectedFaculty(facultyName);
        setSelectedGroup(null);
        setViewMode("search");
        setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const handleSpecialtyClick = (specialtyName) => {
        setSearchTerm(specialtyName);
        setSelectedGroup(null);
        setSelectedFaculty(null);
        setViewMode("search");
        setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    // Label for the active group/faculty chip
    const activeGroupObj = selectedGroup ? GROUPS.find((g) => g.id === selectedGroup) : null;

    return (
        <div
            style={{ minHeight: "100vh", background: "var(--brand-bg)", paddingTop: "7rem", paddingBottom: "5rem" }}
            onClick={() => setShowSuggestions(false)}
        >
            <Seo
                title="Университети и специалности"
                description="Сравни факултети, специалности и градове в българските университети. Намери своята специалност и изчисли приемния си бал."
                path="/universities"
            />
            <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* ── Header ───────────────────────────────────────────── */}
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
                    <h1 style={{ fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 900, color: "var(--brand-text)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 0.625rem", textWrap: "balance" }}>
                        Открий своето{" "}
                        <span style={{ background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            бъдеще
                        </span>
                    </h1>
                    {!loading && (
                        <p style={{ color: "var(--brand-muted)", fontSize: "14px", fontWeight: 500, margin: 0 }}>
                            {universities.length.toLocaleString("bg-BG")} специалности в {totalUniversities} университета в {totalCities} града
                        </p>
                    )}
                </m.div>

                {/* ── Stat strip (rsvu-inspired) ────────────────────────── */}
                {!loading && !error && (
                    <m.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="uni-stat-strip"
                    >
                        {[
                            { value: universities.length, label: "Специалности" },
                            { value: totalUniversities, label: "Университета" },
                            { value: totalCities, label: "Града" },
                            { value: activeGroupsCount, label: "Направления" },
                        ].map(({ value, label }) => (
                            <div key={label} className="uni-stat-card">
                                <span className="uni-stat-num">{value.toLocaleString("bg-BG")}</span>
                                <span className="uni-stat-label">{label}</span>
                            </div>
                        ))}
                    </m.div>
                )}

                {/* ── Filter bar ────────────────────────────────────────── */}
                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="uni-filter-bar"
                >
                    <div style={{ position: "relative" }} className="uni-filter-search">
                        <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                        <input
                            type="text"
                            placeholder="Търси специалност или университет..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                    style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--brand-dropdown-bg)", border: "1px solid var(--brand-border)", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 20px 60px var(--brand-shadow)", zIndex: 30 }}
                                >
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={s.id || i}
                                            onClick={() => { setSearchTerm(s.specialty); setShowSuggestions(false); }}
                                            style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none", transition: "background 0.15s" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(6,182,212,0.06)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <School size={14} style={{ color: "var(--brand-cyan)", flexShrink: 0 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.specialty}</div>
                                                <div style={{ fontSize: "12px", color: "var(--brand-muted)" }}>{s.university_name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="uni-filter-selects">
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="uni-filter-select"
                            style={{ ...inputStyle, width: "100%", padding: "0 0.875rem", cursor: "pointer" }}
                        >
                            {cities.map((city) => (
                                <option key={city} value={city} style={{ background: "var(--brand-dropdown-bg)" }}>{city}</option>
                            ))}
                        </select>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="uni-filter-select"
                            style={{ ...inputStyle, width: "100%", padding: "0 0.875rem", cursor: "pointer" }}
                        >
                            <option value="Всички" style={{ background: "var(--brand-dropdown-bg)" }}>Всички степени</option>
                            <option value="бакалавър" style={{ background: "var(--brand-dropdown-bg)" }}>Бакалавър</option>
                            <option value="магистър" style={{ background: "var(--brand-dropdown-bg)" }}>Магистър</option>
                        </select>
                    </div>

                    {/* View toggle */}
                    <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <button
                            onClick={resetFilters}
                            title="Разгледай по направления"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: viewMode === "browse" ? "rgba(6,182,212,0.12)" : "var(--brand-surface-2)", border: viewMode === "browse" ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--brand-border)", borderRadius: "0.75rem", cursor: "pointer", color: viewMode === "browse" ? "var(--brand-cyan)" : "var(--brand-muted)", transition: "all 0.2s", flexShrink: 0 }}
                        >
                            <LayoutGrid size={16} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => setViewMode("search")}
                            title="Всички специалности"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: viewMode === "search" ? "rgba(6,182,212,0.12)" : "var(--brand-surface-2)", border: viewMode === "search" ? "1px solid rgba(6,182,212,0.35)" : "1px solid var(--brand-border)", borderRadius: "0.75rem", cursor: "pointer", color: viewMode === "search" ? "var(--brand-cyan)" : "var(--brand-muted)", transition: "all 0.2s", flexShrink: 0 }}
                        >
                            <Rows3 size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </m.div>

                {/* ── Active filter chips ───────────────────────────────── */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", overflow: "hidden" }}
                        >
                            {/* Group chip */}
                            {activeGroupObj && (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: `${activeGroupObj.accent}18`, color: activeGroupObj.accent, border: `1px solid ${activeGroupObj.accent}33` }}>
                                    {activeGroupObj.name}
                                    <button onClick={() => { setSelectedGroup(null); if (!hasTextFilters && !selectedFaculty) { setViewMode("browse"); loadInitial(); } }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}><X size={10} /></button>
                                </span>
                            )}
                            {/* Faculty chip */}
                            {selectedFaculty && (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(6,182,212,0.1)", color: "var(--brand-cyan)", border: "1px solid rgba(6,182,212,0.2)" }}>
                                    {selectedFaculty}
                                    <button onClick={() => { setSelectedFaculty(null); if (!hasTextFilters && !selectedGroup) { setViewMode("browse"); loadInitial(); } }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}><X size={10} /></button>
                                </span>
                            )}
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

                {/* ── Loading ───────────────────────────────────────────── */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: "1rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "var(--brand-cyan)", animation: "uni-spin 0.75s linear infinite" }} />
                        <p style={{ color: "var(--brand-muted)", fontSize: "14px" }}>Зареждане...</p>
                    </div>
                )}

                {/* ── Error ─────────────────────────────────────────────── */}
                {!loading && error && (
                    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "5rem 1rem" }}>
                        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                            <X size={28} style={{ color: "#f87171" }} />
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-text)", marginBottom: "0.5rem" }}>{error}</h3>
                        <button onClick={loadInitial} style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", border: "none", borderRadius: "0.75rem", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
                            Опитай отново
                        </button>
                    </m.div>
                )}

                <AnimatePresence mode="wait">

                    {/* ════════════════════════════════════════════════════
                        BROWSE MODE — rsvu.mon.bg direction group cards
                        Real faculty data from DB, grouped by МОН classification
                        ════════════════════════════════════════════════════ */}
                    {!loading && !error && viewMode === "browse" && (
                        <m.div
                            key="browse"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                                <div>
                                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-muted)", marginBottom: "0.25rem" }}>
                                        Професионални направления
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--brand-muted)", fontWeight: 500 }}>
                                        Избери направление или търси директно по-горе
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewMode("search")}
                                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-cyan)"; e.currentTarget.style.color = "var(--brand-cyan)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--brand-border)"; e.currentTarget.style.color = "var(--brand-muted)"; }}
                                >
                                    Виж всички <ChevronRight size={13} />
                                </button>
                            </div>

                            {/* Direction group cards */}
                            <m.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="uni-direction-grid"
                            >
                                {GROUPS.filter((g) => (groupData[g.id]?.total || 0) > 0).map((group) => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        total={groupData[group.id].total}
                                        specialties={groupData[group.id].specialties}
                                        univCount={groupData[group.id].univCount}
                                        cityCount={groupData[group.id].cityCount}
                                        onSelect={handleGroupSelect}
                                        onSpecialtyClick={handleSpecialtyClick}
                                    />
                                ))}
                            </m.div>

                            
                            
                        </m.div>
                    )}

                    {/* ════════════════════════════════════════════════════
                        SEARCH MODE — specialty cards with active filters
                        ════════════════════════════════════════════════════ */}
                    {!loading && !error && viewMode === "search" && (
                        <m.div
                            key="search"
                            ref={gridRef}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* Back button */}
                            <button
                                onClick={resetFilters}
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", marginBottom: "1.25rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-cyan)"; e.currentTarget.style.color = "var(--brand-cyan)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--brand-border)"; e.currentTarget.style.color = "var(--brand-muted)"; }}
                            >
                                <ArrowLeft size={13} /> Направления
                            </button>

                            {/* Results label */}
                            <div style={{ fontSize: "13px", color: "var(--brand-muted)", fontWeight: 500, marginBottom: "1.25rem" }}>
                                {displayUnis.length.toLocaleString("bg-BG")} специалности
                                {selectedFaculty && <span style={{ color: "var(--brand-cyan)" }}> · {selectedFaculty}</span>}
                                {activeGroupObj && !selectedFaculty && <span style={{ color: activeGroupObj.accent }}> · {activeGroupObj.name}</span>}
                                {searchTerm && <span style={{ color: "var(--brand-cyan)" }}> за „{searchTerm}"</span>}
                            </div>

                            {/* Empty */}
                            {displayUnis.length === 0 && (
                                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "6rem 0" }}>
                                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                                        <Search size={28} style={{ color: "var(--brand-muted)", opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--brand-text)", marginBottom: "0.625rem" }}>Нищо не открихме</h3>
                                    <p style={{ color: "var(--brand-muted)", fontSize: "14px", marginBottom: "1.5rem" }}>
                                        Опитай с различни ключови думи или разшири критериите.
                                    </p>
                                    <button onClick={resetFilters} style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", border: "none", borderRadius: "0.75rem", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
                                        Разшири критериите
                                    </button>
                                </m.div>
                            )}

                            {/* Card grid */}
                            {displayUnis.length > 0 && (
                                <>
                                    <m.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}
                                    >
                                        {displayUnis.slice(0, visibleCount).map((uni) => (
                                            <SpecialtyCard
                                                key={uni.id}
                                                uni={uni}
                                                isFav={isFavorite(String(uni.id))}
                                                onToggleFav={() => toggleFavorite(String(uni.id))}
                                                showUser={!!user}
                                            />
                                        ))}
                                    </m.div>
                                    {displayUnis.length > visibleCount && (
                                        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
                                            <button
                                                type="button"
                                                onClick={() => setVisibleCount((c) => c + 60)}
                                                style={{ padding: "0.75rem 2rem", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
                                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--brand-border)")}
                                            >
                                                Покажи още {Math.min(60, displayUnis.length - visibleCount)}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                @keyframes uni-spin { to { transform: rotate(360deg); } }
                input[type="text"]::placeholder { color: var(--brand-muted); opacity: 0.6; }

                .uni-stat-strip {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.625rem;
                    margin-bottom: 1.75rem;
                }
                .uni-stat-card {
                    background: var(--brand-surface);
                    border: 1px solid var(--brand-card-border);
                    border-radius: 1rem;
                    padding: 1rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                    transition: border-color 0.2s;
                }
                .uni-stat-card:hover { border-color: rgba(6,182,212,0.25); }
                .uni-stat-num {
                    font-size: 1.625rem;
                    font-weight: 900;
                    font-family: monospace;
                    background: linear-gradient(135deg, var(--brand-cyan), var(--brand-violet));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    line-height: 1;
                }
                .uni-stat-label {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--brand-muted);
                }
                .uni-direction-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                .uni-filter-bar {
                    background: var(--brand-surface-2);
                    backdrop-filter: blur(16px);
                    border: 1px solid var(--brand-border);
                    border-radius: 1.25rem;
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    position: sticky;
                    top: 4.5rem;
                    z-index: 20;
                    margin-bottom: 1.25rem;
                }
                .uni-filter-search { width: 100%; }
                .uni-filter-selects {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                .uni-filter-select { width: 100%; min-width: 0; }

                @media (min-width: 640px) {
                    .uni-stat-strip { grid-template-columns: repeat(4, 1fr); }
                    .uni-direction-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 1024px) {
                    .uni-direction-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (min-width: 768px) {
                    .uni-filter-bar {
                        flex-direction: row;
                        align-items: center;
                        top: 5rem;
                        padding: 0.875rem;
                        gap: 0.625rem;
                        overflow: visible;
                    }
                    .uni-filter-search { flex: 1 1 0; min-width: 0; }
                    .uni-filter-selects { display: flex; flex-direction: row; gap: 0.5rem; flex-shrink: 0; }
                    .uni-filter-select { width: auto !important; min-width: 140px; max-width: 190px; flex-shrink: 0; }
                }
            `}</style>
        </div>
    );
}
