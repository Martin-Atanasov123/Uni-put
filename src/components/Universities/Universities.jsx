import { useState, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import {
    Search, MapPin, Calculator, School, Heart, X, BookOpen,
    GraduationCap, Briefcase, Wrench, Leaf, Palette, Shield,
    Globe, FlaskConical, HeartPulse, LayoutGrid, Rows3,
    ArrowLeft, ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SignupPrompt from "@/components/common/SignupPrompt";
import { universityService } from "@/services/universityService";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import { slugify } from "@/lib/slugify";
import AccreditationWarning from "@/components/common/AccreditationWarning";
import { UNIVERSITIES, SPECIALTIES, ADMISSION_YEAR_SHORT } from "@/lib/siteStats";

// ─── rsvu.mon.bg High-level groups ──────────────────────────────────────────
// Matches the official МОН classification 
const GROUPS = [
    {
        id: "social",
        name: "Социални, стопански и правни науки",
        icon: Briefcase,
        accent: "#06B6D4",
        bg: "rgba(23,86,217,0.08)",
        border: "rgba(23,86,217,0.18)",
    },
    {
        id: "tech",
        name: "Технически науки",
        icon: Wrench,
        accent: "#2563EB",
        bg: "rgba(23,86,217,0.08)",
        border: "rgba(23,86,217,0.18)",
    },
    {
        id: "nat",
        name: "Природни науки, математика и информатика",
        icon: FlaskConical,
        accent: "#0A6853",
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
        accent: "#986100",
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
        accent: "#BE185D",
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

// ─── Направление (ред в указател) ──────────────────────────────────────────
// Един акцент за страницата: цветът на направлението е само малък маркер.
function GroupCard({ group, total, specialties, univCount, cityCount, onSelect, onSpecialtyClick }) {
    return (
        <m.div variants={cardVariants} className="uni-group" onClick={() => onSelect(group)}>
            <div className="uni-group-head">
                <span aria-hidden="true" className="uni-group-marker" style={{ background: group.accent }} />
                <button type="button" className="uni-group-title-btn">
                    <h3 className="uni-group-title">{group.name}</h3>
                </button>
                <span className="uni-group-count" title="специалности">{total}</span>
                <ChevronRight size={18} strokeWidth={1.5} className="uni-group-arrow" aria-hidden="true" />
            </div>

            {(univCount > 0 || cityCount > 0) && (
                <p className="uni-group-meta">
                    специалности
                    {univCount > 0 && <> · {univCount} {univCount === 1 ? "университет" : "университета"}</>}
                    {cityCount > 0 && <> · {cityCount} {cityCount === 1 ? "град" : "града"}</>}
                </p>
            )}

            <p className="uni-group-specs">
                {specialties.slice(0, 5).map(({ name }, i) => (
                    <span key={name}>
                        {i > 0 && <span aria-hidden="true"> · </span>}
                        <button
                            type="button"
                            className="uni-spec-link"
                            onClick={(e) => { e.stopPropagation(); onSpecialtyClick(name); }}
                        >
                            {name}
                        </button>
                    </span>
                ))}
                {specialties.length > 5 && <span> · +{specialties.length - 5} още</span>}
            </p>
        </m.div>
    );
}

// ─── Специалност (ред в резултатите) ───────────────────────────────────────
function SpecialtyCard({ uni, isFav, onToggleFav, showUser }) {
    return (
        <m.div variants={cardVariants} className="uni-row">
            <div className="uni-row-main">
                <p className="uni-row-kicker">
                    {uni.education_level && <span>{uni.education_level} · </span>}
                    <span className="uni-row-city"><MapPin size={11} strokeWidth={1.5} aria-hidden="true" /> {uni.city}</span>
                </p>
                <h2 className="uni-row-title">
                    <Link to={`/specialnosti/${slugify(uni.specialty)}/`} onClick={(e) => e.stopPropagation()}>
                        {uni.specialty}
                    </Link>
                </h2>
                <p className="uni-row-uni">
                    <School size={13} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <Link to={`/universities/${slugify(uni.university_name)}/`} onClick={(e) => e.stopPropagation()}>
                        {uni.university_name}
                    </Link>
                </p>
                {uni.faculty && uni.faculty !== uni.specialty && (
                    <p className="uni-row-faculty">{uni.faculty}</p>
                )}
                {uni.accreditation_status && (
                    <div style={{ marginTop: "0.5rem" }}>
                        <AccreditationWarning status={uni.accreditation_status} variant="chip" />
                    </div>
                )}
            </div>

            <div className="uni-row-actions">
                <Link
                    to={`/calculator/?specialty=${encodeURIComponent(uni.specialty)}&university=${encodeURIComponent(uni.university_name)}`}
                    className="uni-row-calc"
                >
                    <Calculator size={14} strokeWidth={1.5} /> Изчисли бал
                </Link>
                {showUser && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
                        className="uni-row-fav"
                        data-active={isFav ? "true" : "false"}
                        aria-label={isFav ? "Премахни от любими" : "Добави в любими"}
                    >
                        <Heart size={14} strokeWidth={1.5} fill={isFav ? "#ef4444" : "none"} />
                        {isFav ? "В любими" : "Запази"}
                    </button>
                )}
            </div>
        </m.div>
    );
}

// Търсене от хедъра: ?q=… (дължина и специални символи се чистят — стойността отива в заявка)
const readQuery = (search) =>
    (new URLSearchParams(search).get("q") || "").replace(/[%_\\'";<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

// ─── Main Component ────────────────────────────────────────────────────────
export default function UniversitiesPage() {
    const { isFavorite, toggleFavorite } = useAuth();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState(() => readQuery(location.search));
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
    const searchActiveRef = useRef(false);
    // Покана за акаунт — показва се само когато АНОНИМЕН потребител добави любима.
    const [showFavNudge, setShowFavNudge] = useState(false);
    const handleToggleFav = async (id) => {
        const res = await toggleFavorite(id);
        if (res?.added && res?.anonymous) setShowFavNudge(true);
    };

    const loadInitial = async () => {
        setLoading(true);
        setError(null);
        try {
            // Сървърът връща най-много 1000 реда на заявка — тегли се на страници,
            // докато свършат (не фиксирани 2 партиди, които биха отрязали >2000 реда).
            const loadAll = async () => {
                const all = [];
                for (let offset = 0; ; offset += 1000) {
                    const batch = await universityService.searchUniversities({ limit: 1000, offset });
                    all.push(...batch);
                    if (batch.length < 1000) break;
                }
                return all;
            };
            const [unis, cityList] = await Promise.all([loadAll(), universityService.getCities()]);
            // Ако междувременно е стартирано търсене (напр. от хедъра през ?q=), пълният списък
            // не бива да го презапише.
            if (!searchActiveRef.current) setUniversities(unis);
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

        searchActiveRef.current = hasFilters;
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
                    setSuggestions([...new Map(results.map((r) => [r.specialty, r])).values()].slice(0, 5));
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
    const distinctSpecialties = useMemo(
        () => new Set(universities.map((u) => u.specialty)).size,
        [universities]
    );
    const totalCities = useMemo(
        () => new Set(universities.map((u) => u.city).filter(Boolean)).size,
        [universities]
    );

    useEffect(() => {
        const q = readQuery(location.search);
        if (q) setSearchTerm(q);
    }, [location.search]);

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
                title={`${UNIVERSITIES} университета и ${SPECIALTIES} специалности за прием ${ADMISSION_YEAR_SHORT}`}
                description={`${UNIVERSITIES} висши училища в България и ${SPECIALTIES} специалности. Филтрирай по град, факултет и степен. Изчисли приемния си бал по коефициентите на МОН.`}
                path="/universities"
                image="https://uniput.eu/og/universities.png"
            />
            <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* ── Header ───────────────────────────────────────────── */}
                <m.div
                    className="uni-head"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <p style={{ margin: "0 0 0.75rem", color: "var(--brand-accent-text)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                            Каталог
                        </p>
                        <h1 style={{ fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 800, color: "var(--brand-text)", lineHeight: 1.08, letterSpacing: "-0.03em", margin: 0, textWrap: "balance" }}>
                            Открий своето{" "}
                            <span style={{ color: "var(--brand-accent-text)" }}>
                                бъдеще
                            </span>
                        </h1>
                    </div>
                    {!loading && !error && (
                        <p className="uni-head-count">
                            <span className="uni-head-num">{distinctSpecialties.toLocaleString("bg-BG")}</span> {distinctSpecialties === 1 ? "специалност" : "специалности"} в{" "}
                            <span className="uni-head-num">{totalUniversities}</span> {totalUniversities === 1 ? "университет" : "университета"} в{" "}
                            <span className="uni-head-num">{totalCities}</span> {totalCities === 1 ? "град" : "града"}
                        </p>
                    )}
                </m.div>

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
                            onFocus={(e) => { e.target.style.borderColor = "rgba(23,86,217,0.5)"; if (searchTerm.length > 1) setShowSuggestions(true); }}
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
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(23,86,217,0.06)")}
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
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: viewMode === "browse" ? "rgba(23,86,217,0.12)" : "var(--brand-surface-2)", border: viewMode === "browse" ? "1px solid rgba(23,86,217,0.35)" : "1px solid var(--brand-border)", borderRadius: "0.75rem", cursor: "pointer", color: viewMode === "browse" ? "var(--brand-cyan)" : "var(--brand-muted)", transition: "all 0.2s", flexShrink: 0 }}
                        >
                            <LayoutGrid size={16} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => setViewMode("search")}
                            title="Всички специалности"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: viewMode === "search" ? "rgba(23,86,217,0.12)" : "var(--brand-surface-2)", border: viewMode === "search" ? "1px solid rgba(23,86,217,0.35)" : "1px solid var(--brand-border)", borderRadius: "0.75rem", cursor: "pointer", color: viewMode === "search" ? "var(--brand-cyan)" : "var(--brand-muted)", transition: "all 0.2s", flexShrink: 0 }}
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
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(23,86,217,0.1)", color: "var(--brand-cyan)", border: "1px solid rgba(23,86,217,0.2)" }}>
                                    {selectedFaculty}
                                    <button onClick={() => { setSelectedFaculty(null); if (!hasTextFilters && !selectedGroup) { setViewMode("browse"); loadInitial(); } }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}><X size={10} /></button>
                                </span>
                            )}
                            {searchTerm && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(23,86,217,0.1)", color: "var(--brand-cyan)", border: "1px solid rgba(23,86,217,0.2)" }}>
                                    "{searchTerm}"
                                </span>
                            )}
                            {selectedCity !== "Всички" && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(23,86,217,0.1)", color: "var(--brand-violet)", border: "1px solid rgba(23,86,217,0.2)" }}>
                                    {selectedCity}
                                </span>
                            )}
                            {selectedLevel !== "Всички" && (
                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "rgba(23,86,217,0.1)", color: "var(--brand-violet)", border: "1px solid rgba(23,86,217,0.2)" }}>
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
                            <X size={28} style={{ color: "#AA2735" }} />
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-text)", marginBottom: "0.5rem" }}>{error}</h3>
                        <button onClick={loadInitial} style={{ padding: "0.75rem 1.5rem", background: "var(--brand-accent)", border: "none", borderRadius: "0.75rem", color: "var(--brand-accent-ink)", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
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
                                    <button onClick={resetFilters} style={{ padding: "0.75rem 1.5rem", background: "var(--brand-accent)", border: "none", borderRadius: "0.75rem", color: "var(--brand-accent-ink)", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
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
                                        className="uni-list"
                                    >
                                        {displayUnis.slice(0, visibleCount).map((uni) => (
                                            <SpecialtyCard
                                                key={uni.id}
                                                uni={uni}
                                                isFav={isFavorite(String(uni.id))}
                                                onToggleFav={() => handleToggleFav(String(uni.id))}
                                                showUser={true}
                                            />
                                        ))}
                                    </m.div>
                                    {displayUnis.length > visibleCount && (
                                        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
                                            <button
                                                type="button"
                                                onClick={() => setVisibleCount((c) => c + 60)}
                                                style={{ padding: "0.75rem 2rem", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
                                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(23,86,217,0.3)")}
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

                .uni-head { display: grid; gap: 1.25rem; margin-bottom: 2.25rem; }
                .uni-head-count { margin: 0; font-size: 1.0625rem; line-height: 1.6; color: var(--brand-muted); max-width: 24rem; }
                .uni-head-num { font-family: var(--font-mono); font-weight: 600; color: var(--brand-text); }

                .uni-direction-grid, .uni-list { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 3.5rem; }

                .uni-group { border-top: 1px solid var(--brand-border); padding: 1.5rem 0 1.75rem; cursor: pointer; }
                .uni-group-head { display: flex; align-items: center; gap: 0.75rem; }
                .uni-group-marker { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
                .uni-group-title-btn { flex: 1; min-width: 0; text-align: left; background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
                .uni-group-title { margin: 0; font-family: var(--font-display); font-size: 1.3125rem; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; color: var(--brand-text); transition: color 0.2s ease; }
                .uni-group:hover .uni-group-title { color: var(--brand-accent-text); }
                .uni-group-count { font-family: var(--font-mono); font-size: 1.125rem; font-weight: 600; color: var(--brand-text); }
                .uni-group-arrow { flex-shrink: 0; color: var(--brand-muted); transition: transform 0.2s ease, color 0.2s ease; }
                .uni-group:hover .uni-group-arrow { transform: translateX(3px); color: var(--brand-accent-text); }
                .uni-group-meta { margin: 0.5rem 0 0 calc(8px + 0.75rem); font-size: 12px; color: var(--brand-muted); }
                .uni-group-specs { margin: 0.75rem 0 0 calc(8px + 0.75rem); font-size: 13px; line-height: 1.75; color: var(--brand-muted); }
                .uni-spec-link { background: none; border: 0; padding: 0; font: inherit; color: var(--brand-text); cursor: pointer; text-decoration: underline; text-decoration-color: var(--brand-border); text-underline-offset: 0.25em; transition: text-decoration-color 0.15s ease; }
                .uni-spec-link:hover { text-decoration-color: var(--brand-accent); }

                .uni-row { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem 1.5rem; border-top: 1px solid var(--brand-border); padding: 1.25rem 0; }
                .uni-row-main { flex: 1 1 15rem; min-width: 0; }
                .uni-row-kicker { margin: 0 0 0.4rem; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--brand-muted); }
                .uni-row-city { display: inline-flex; align-items: center; gap: 0.25rem; }
                .uni-row-title { margin: 0 0 0.375rem; font-family: var(--font-display); font-size: 1.1875rem; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; text-wrap: balance; }
                .uni-row-title a { color: var(--brand-text); text-decoration: none; }
                .uni-row-title a:hover { color: var(--brand-accent-text); }
                .uni-row-uni { margin: 0; display: flex; align-items: center; gap: 0.35rem; font-size: 13px; color: var(--brand-muted); }
                .uni-row-uni a { color: inherit; text-decoration: underline; text-decoration-color: var(--brand-border); text-underline-offset: 0.25em; }
                .uni-row-uni a:hover { text-decoration-color: var(--brand-accent); }
                .uni-row-faculty { margin: 0.25rem 0 0; font-size: 12px; color: var(--brand-muted); opacity: 0.75; }
                .uni-row-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
                .uni-row-calc { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0 1rem; background: transparent; color: var(--brand-accent-text); border: 1px solid rgba(23,86,217,0.45); border-radius: 0.625rem; font-weight: 700; font-size: 13px; text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
                .uni-row-calc:hover { background: var(--brand-accent); color: var(--brand-accent-ink); }
                .uni-row-fav { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0 0.875rem; background: transparent; border: 1px solid var(--brand-border); border-radius: 0.625rem; color: var(--brand-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
                .uni-row-fav:hover { border-color: var(--brand-accent); color: var(--brand-text); }
                .uni-row-fav[data-active="true"] { border-color: rgba(239,68,68,0.4); color: #ef4444; }

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

                @media (min-width: 900px) {
                    .uni-head { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: end; gap: 3rem; }
                    .uni-head-count { justify-self: end; }
                    .uni-direction-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .uni-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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

            {/* Покана за акаунт — плаващ банер, само за анонимни след добавена любима */}
            <AnimatePresence>
                {showFavNudge && (
                    <div style={{ position: "fixed", left: "1rem", right: "1rem", bottom: "1rem", zIndex: 90, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                        <div style={{ width: "100%", maxWidth: "34rem", pointerEvents: "auto", borderRadius: "1.25rem", boxShadow: "0 16px 40px var(--brand-shadow)" }}>
                            <SignupPrompt variant="favorite" onDismiss={() => setShowFavNudge(false)} />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
