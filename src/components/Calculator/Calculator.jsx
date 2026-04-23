import { useState, useEffect, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    Info,
    CheckCircle2,
    XCircle,
    ChevronDown,
    AlertCircle,
    BookOpen,
    GraduationCap,
    Star,
    ArrowRight,
    Lightbulb,
    Target,
    Zap,
    Copy,
    Check,
} from "lucide-react";
import GradeInputSection from "./GradeInputSection";
import ReportButton from "./ReportButton";
import { FIELD_LABELS, SLOT_GROUPS } from "@/lib/coefficients_config";

const S = {
    surface: "var(--brand-surface-2)",
    border: "var(--brand-border)",
    input: {
        background: "var(--brand-input-bg)",
        border: "1px solid var(--brand-input-border)",
        borderRadius: "0.75rem",
        color: "var(--brand-text)",
        fontSize: "14px",
        fontWeight: 500,
        outline: "none",
        fontFamily: "inherit",
        height: "3rem",
        padding: "0 1rem",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    },
};

// ── How it works steps ──────────────────────────────────────────────────────
const HOW_STEPS = [
    { icon: BookOpen,      num: "01", title: "Избери факултет",   desc: "Напиши или избери факултета, за който искаш да кандидатстваш. Можеш да търсиш по ключова дума." },
    { icon: GraduationCap, num: "02", title: "Избери специалност", desc: "От наличните специалности за избрания факултет, изберете тази, която ви интересува." },
    { icon: Star,          num: "03", title: "Въведи оценките",   desc: "Въведи своите оценки от матурата и дипломата. Калкулаторът автоматично прилага коефициентите." },
    { icon: Target,        num: "04", title: "Виж резултата",     desc: "Получаваш своя конкурсен бал и сравнение с историческия среден бал за прием." },
];

// ── DZI points → grade conversion ───────────────────────────────────────────
const DZI_BANDS = [
    { min: 0,     max: 29.75, label: "Слаб",        grade_min: 2.00, grade_max: 2.00, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
    { min: 30,    max: 40.5,  label: "Среден",      grade_min: 3.00, grade_max: 3.99, color: "#F97316", bg: "rgba(249,115,22,0.08)",   border: "rgba(249,115,22,0.25)"   },
    { min: 40.75, max: 62.25, label: "Добър",       grade_min: 4.00, grade_max: 4.99, color: "#FBBF24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.25)"   },
    { min: 62.5,  max: 83.75, label: "Много добър", grade_min: 5.00, grade_max: 5.49, color: "#06B6D4", bg: "rgba(6,182,212,0.08)",    border: "rgba(6,182,212,0.25)"    },
    { min: 84,    max: 94.75, label: "Отличен",     grade_min: 5.50, grade_max: 5.99, color: "#8B5CF6", bg: "rgba(139,92,246,0.08)",   border: "rgba(139,92,246,0.25)"   },
    { min: 95,    max: 100,   label: "Отличен 6",   grade_min: 6.00, grade_max: 6.00, color: "#10b981", bg: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.25)"   },
];

function dziToGrade(pts) {
    const p = Math.max(0, Math.min(100, pts));
    const band = DZI_BANDS.find(b => p >= b.min && p <= b.max)
        ?? DZI_BANDS[0];
    let grade;
    if (band.grade_min === band.grade_max) {
        grade = band.grade_min;
    } else {
        const t = (p - band.min) / (band.max - band.min);
        grade = band.grade_min + t * (band.grade_max - band.grade_min);
    }
    return { grade: +grade.toFixed(2), band };
}

// ── Tips ────────────────────────────────────────────────────────────────────
const TIPS = [
    "Коефициентите се прилагат автоматично — не е нужно да ги пресмяташ ръчно.",
    "Ако имаш оценки от два различни изпита за едно и също поле, въведи и двете — калкулаторът взима по-високата.",
    "Средният бал за прием се изчислява от максималния разделен на две.",
    "Можеш да сравниш един и същи факултет в различни университети и градове.",
    "Пазете своя RIASEC профил — той ще ти помогне да намериш специалности, подходящи за теб.",
];

export default function CalculatorPage() {
    const [allData, setAllData] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedUniversity, setSelectedUniversity] = useState("");
    const [facultySearch, setFacultySearch] = useState("");
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
    const [dropdownShowAll, setDropdownShowAll] = useState(false);
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [grades, setGrades] = useState({});
    const [pendingSpecialty, setPendingSpecialty] = useState(null);
    const [dziPoints, setDziPoints] = useState("");
    const [dziError, setDziError] = useState("");
    const [copied, setCopied] = useState(false);
    const location = useLocation();

    const handleDziChange = (e) => {
        const val = e.target.value;
        setDziPoints(val);
        if (val === "" || val === "-") { setDziError(""); return; }
        const num = parseFloat(val);
        if (isNaN(num)) {
            setDziError("Въведи валидно число.");
        } else if (num < 0) {
            setDziError("Точките не могат да са отрицателни.");
        } else if (num > 100) {
            setDziError("Максималният брой точки е 100.");
        } else {
            setDziError("");
        }
    };

    const dziResult = dziPoints !== "" && !dziError && !isNaN(parseFloat(dziPoints))
        ? dziToGrade(parseFloat(dziPoints))
        : null;

    const copyGrade = () => {
        if (!dziResult) return;
        const text = String(dziResult.grade);
        if (window.isSecureContext && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {});
        } else {
            const el = document.createElement("textarea");
            el.value = text;
            el.style.position = "fixed";
            el.style.opacity = "0";
            document.body.appendChild(el);
            el.select();
            try { document.execCommand("copy"); } catch {}
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cities = [...new Set(allData.map(d => d.city).filter(Boolean))].sort();
    const universities = [...new Set(allData.map(d => d.university_name).filter(Boolean))].sort();

    const filteredFaculties = useMemo(() => {
        if (dropdownShowAll || !facultySearch) return faculties;
        return faculties.filter(f => f.toLowerCase().includes(facultySearch.toLowerCase()));
    }, [faculties, facultySearch, dropdownShowAll]);

    const filteredData = allData.filter(d => {
        const matchFaculty = !selectedFaculty || d.faculty === selectedFaculty;
        const matchCity = !selectedCity || d.city === selectedCity;
        const matchUni = !selectedUniversity || d.university_name === selectedUniversity;
        return matchFaculty && matchCity && matchUni;
    });

    const availableSpecialties = [...new Set(filteredData.map(d => d.specialty))].sort();

    useEffect(() => {
        (async () => {
            try {
                const cached = localStorage.getItem("uniput_faculties_cache");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) setFaculties(parsed);
                }
            } catch {}
            const { data, error } = await supabase.from("universities").select("faculty");
            if (!error && data) {
                const list = [...new Set(data.map(i => i.faculty).filter(Boolean))];
                setFaculties(list);
                try { localStorage.setItem("uniput_faculties_cache", JSON.stringify(list)); } catch {}
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedFaculty) return;
        (async () => {
            const { data, error } = await supabase.from("universities").select("id,faculty,specialty,university_name,city,coefficients,formula_description,max_ball").eq("faculty", selectedFaculty);
            if (!error && data) setAllData(data);
        })();
    }, [selectedFaculty]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sp = params.get("specialty")?.slice(0, 100).replace(/[%_\\]/g, "");
        if (!sp) return;
        (async () => {
            const { data, error } = await supabase.from("universities").select("faculty,specialty").ilike("specialty", `%${sp}%`).limit(1);
            if (error || !data?.length) return;
            const match = data[0];
            setPendingSpecialty(match.specialty);
            setSelectedFaculty(match.faculty);
            setFacultySearch(match.faculty);
        })();
    }, [location.search]);

    useEffect(() => {
        if (!pendingSpecialty || !allData.length) return;
        if (allData.find(d => d.specialty === pendingSpecialty)) {
            setSelectedSpecialtyName(pendingSpecialty);
            setPendingSpecialty(null);
        }
    }, [allData, pendingSpecialty]);

    useEffect(() => {
        setIsFacultyDropdownOpen(false);
        setDropdownShowAll(false);
    }, [location.pathname]);

    useEffect(() => {
        const onKey = e => { if (e.key === "Escape") { setIsFacultyDropdownOpen(false); setDropdownShowAll(false); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const rowsForSelectedSpecialty = useMemo(() => {
        if (!selectedSpecialtyName) return [];
        return filteredData.filter(d => d.specialty === selectedSpecialtyName);
    }, [filteredData, selectedSpecialtyName]);

    const coefficientsForInputs = useMemo(() => {
        const merged = {};
        rowsForSelectedSpecialty.forEach(row => {
            (Array.isArray(row?.coefficients) ? row.coefficients : []).forEach(slot => {
                (slot.alternatives || []).forEach(alt => {
                    if (alt?.key) merged[alt.key] = Number(alt.coef) || 1;
                });
            });
        });
        return merged;
    }, [rowsForSelectedSpecialty]);

    const describeGroup = groupId => {
        if (FIELD_LABELS[groupId]) return FIELD_LABELS[groupId];
        if (SLOT_GROUPS[groupId]) {
            const first = SLOT_GROUPS[groupId].find(k => FIELD_LABELS[k]);
            if (first) return FIELD_LABELS[first];
        }
        return groupId;
    };

    const getGroupIdForKey = key => {
        for (const [master, members] of Object.entries(SLOT_GROUPS)) {
            if (members.includes(key)) return master;
        }
        return key;
    };

    const describeMissingTerm = termKeys => {
        const labels = [];
        const seen = new Set();
        termKeys.forEach(key => {
            const label = FIELD_LABELS[key] || describeGroup(getGroupIdForKey(key));
            if (!seen.has(label)) { seen.add(label); labels.push(label); }
        });
        return labels.join(" / ");
    };

    const calculateScore = (coefficients, gradeSource) => {
        if (!Array.isArray(coefficients) || !coefficients.length) return { score: 0, missingSlots: [] };
        let total = 0;
        const missingSlots = [];
        coefficients.forEach(slot => {
            const alts = slot.alternatives || [];
            let best = null;
            const keys = [];
            alts.forEach(alt => {
                if (!alt?.key) return;
                keys.push(alt.key);
                const val = parseFloat(gradeSource[alt.key]);
                if (!Number.isNaN(val) && val >= 2 && val <= 6) {
                    const product = val * Number(alt.coef);
                    if (best === null || product > best) best = product;
                }
            });
            if (best === null) missingSlots.push(keys);
            else total += best;
        });
        return { score: total, missingSlots };
    };

    const hasAnyValidGrade = useMemo(() =>
        Object.values(grades).some(v => { const n = parseFloat(v); return !Number.isNaN(n) && n >= 2 && n <= 6; }),
        [grades]
    );

    const calcResults = useMemo(() => {
        if (!rowsForSelectedSpecialty.length) return [];
        const maxBallValues = rowsForSelectedSpecialty.map(r => Number(r.max_ball)).filter(v => !Number.isNaN(v) && v > 0);
        const avgMaxBall = maxBallValues.length ? maxBallValues.reduce((a, b) => a + b, 0) / maxBallValues.length : null;
        return rowsForSelectedSpecialty.map(item => {
            const { score, missingSlots } = calculateScore(item.coefficients, grades);
            const midPoint = avgMaxBall ? avgMaxBall / 2 : null;
            const isAbove = avgMaxBall !== null && score >= midPoint;
            const diff = midPoint !== null ? Math.abs(midPoint - score).toFixed(2) : null;
            const hasStarted = score > 0 || hasAnyValidGrade;
            return { item, score, formatted: Number.isFinite(score) ? score.toFixed(2) : "0.00", isAbove, diff, hasStarted, hasMissing: missingSlots.length > 0, missingSlots, midPoint, avgMaxBall };
        });
    }, [rowsForSelectedSpecialty, grades, hasAnyValidGrade]);

    const clearFaculty = () => {
        setFacultySearch("");
        setSelectedFaculty("");
        setSelectedSpecialtyName("");
        setSelectedCity("");
        setSelectedUniversity("");
        setIsFacultyDropdownOpen(true);
        setDropdownShowAll(true);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", paddingTop: "7rem", paddingBottom: "5rem" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* Header */}
                <m.div initial={{ opacity: 0, y: 20, }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--brand-violet)", boxShadow: "0 0 10px var(--brand-violet)" }} />
                        <span style={{ color: "var(--brand-violet)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>Калкулатор</span>
                    </div>
                    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "var(--brand-text)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 0.625rem", textWrap: "balance" }}>
                        Изчисли своя{" "}
                        <span style={{ background: "linear-gradient(135deg,var(--brand-violet),var(--brand-cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            приемен бал
                        </span>
                    </h1>

                    {/* Notice */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.875rem 1rem", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "0.875rem", maxWidth: "36rem" }}>
                        <AlertCircle size={15} style={{ color: "var(--brand-violet)", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontSize: "13px", color: "var(--brand-muted)", margin: 0, lineHeight: 1.5 }}>
                            Все още се работи по добавянето на всички университети. Ако не намирате своята специалност, изчакайте скоро.
                        </p>
                    </div>
                </m.div>

                {/* Selectors */}
                <m.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1.5rem" }}
                >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        {/* Faculty searchable */}
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    placeholder="Търси факултет..."
                                    value={facultySearch}
                                    onChange={e => { setFacultySearch(e.target.value); setDropdownShowAll(false); setIsFacultyDropdownOpen(true); }}
                                    onClick={() => { setIsFacultyDropdownOpen(true); setDropdownShowAll(true); }}
                                    onFocus={e => { setIsFacultyDropdownOpen(true); setDropdownShowAll(true); e.target.style.borderColor = "rgba(139,92,246,0.5)"; }}
                                    onBlur={e => { e.target.style.borderColor = "rgba(148,163,184,0.12)"; }}
                                    style={{ ...S.input, paddingLeft: "1rem", paddingRight: "4.5rem" }}
                                />
                                <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                    {facultySearch && (
                                        <button type="button" onClick={clearFaculty} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--brand-muted)", display: "flex" }}>
                                            <XCircle size={15} />
                                        </button>
                                    )}
                                    <ChevronDown size={16} style={{ color: "var(--brand-muted)", transition: "transform 0.2s", transform: isFacultyDropdownOpen ? "rotate(180deg)" : "none" }} />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isFacultyDropdownOpen && (
                                    <>
                                        <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => { setIsFacultyDropdownOpen(false); setDropdownShowAll(false); }} />
                                        <m.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--brand-dropdown-bg)", border: "1px solid var(--brand-border)", borderRadius: "0.875rem", maxHeight: "14rem", overflowY: "auto", zIndex: 20, boxShadow: "0 20px 60px var(--brand-shadow)" }}
                                        >
                                            {filteredFaculties.length > 0 ? filteredFaculties.map((f, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => { setSelectedFaculty(f); setFacultySearch(f); setSelectedSpecialtyName(""); setSelectedCity(""); setSelectedUniversity(""); setIsFacultyDropdownOpen(false); setDropdownShowAll(false); }}
                                                    style={{ width: "100%", textAlign: "left", padding: "0.625rem 1rem", fontSize: "13px", fontWeight: 500, color: "var(--brand-text)", background: "none", border: "none", borderBottom: i < filteredFaculties.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
                                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                                >
                                                    {f}
                                                </button>
                                            )) : (
                                                <div style={{ padding: "1rem", textAlign: "center", color: "var(--brand-muted)", fontSize: "13px" }}>Няма резултати</div>
                                            )}
                                        </m.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Specialty */}
                        <select
                            value={selectedSpecialtyName}
                            onChange={e => setSelectedSpecialtyName(e.target.value)}
                            disabled={!selectedFaculty}
                            style={{ ...S.input, cursor: selectedFaculty ? "pointer" : "not-allowed", opacity: selectedFaculty ? 1 : 0.5 }}
                        >
                            <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Избери специалност</option>
                            {availableSpecialties.map((s, i) => <option key={i} value={s} style={{ background: "var(--brand-dropdown-bg)" }}>{s}</option>)}
                        </select>
                    </div>

                    {/* Optional filters */}
                    <AnimatePresence>
                        {selectedFaculty && (
                            <m.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: "hidden", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(148,163,184,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
                            >
                                <select
                                    value={selectedCity}
                                    onChange={e => { setSelectedCity(e.target.value); if (selectedSpecialtyName && !filteredData.find(d => d.specialty === selectedSpecialtyName && (!e.target.value || d.city === e.target.value))) setSelectedSpecialtyName(""); }}
                                    style={{ ...S.input, height: "2.5rem", fontSize: "13px", cursor: "pointer" }}
                                >
                                    <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Всички градове</option>
                                    {cities.map((c, i) => <option key={i} value={c} style={{ background: "var(--brand-dropdown-bg)" }}>{c}</option>)}
                                </select>
                                <select
                                    value={selectedUniversity}
                                    onChange={e => { setSelectedUniversity(e.target.value); if (selectedSpecialtyName && !filteredData.find(d => d.specialty === selectedSpecialtyName && (!e.target.value || d.university_name === e.target.value))) setSelectedSpecialtyName(""); }}
                                    style={{ ...S.input, height: "2.5rem", fontSize: "13px", cursor: "pointer" }}
                                >
                                    <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Всички университети</option>
                                    {universities.map((u, i) => <option key={i} value={u} style={{ background: "var(--brand-dropdown-bg)" }}>{u}</option>)}
                                </select>
                            </m.div>
                        )}
                    </AnimatePresence>
                </m.div>

                {/* How it works — shown only when no faculty selected AND dropdown is closed */}
                {!selectedFaculty && !isFacultyDropdownOpen && (
                    <m.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        style={{ marginBottom: "2rem"  }}
                    >
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-cyan)", marginBottom: "1rem" }}>
                            Как работи
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.875rem" }}>
                            {HOW_STEPS.map(step => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.num} style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(139,92,246,0.12))", display: "inline-flex" }}>
                                                <Icon size={18} style={{ color: "var(--brand-cyan)" }} />
                                            </div>
                                            <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--brand-border)", letterSpacing: "-0.04em" }}>{step.num}</span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand-text)", margin: "0 0 0.3rem" }}>{step.title}</p>
                                            <p style={{ fontSize: "12px", color: "var(--brand-muted)", margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </m.div>
                )}

                {/* DZI → Grade Converter — shown only when no faculty selected AND dropdown is closed */}
                {!selectedFaculty && !isFacultyDropdownOpen && (
                    <m.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.22 }}
                        style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.5rem", marginBottom: "2rem" }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                            <div style={{ padding: "0.375rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(139,92,246,0.12))", display: "inline-flex" }}>
                                <Zap size={15} style={{ color: "var(--brand-cyan)" }} />
                            </div>
                            <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--brand-text)", margin: 0 }}>
                                Конвертор: Точки ДЗИ → Оценка
                            </p>
                        </div>

                        {/* Input + Slider */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.4rem" }}>
                                    Точки (0 – 100)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.25"
                                    placeholder="напр. 74.5"
                                    value={dziPoints}
                                    onChange={handleDziChange}
                                    style={{
                                        ...S.input,
                                        fontFamily: "monospace",
                                        fontSize: "1.1rem",
                                        fontWeight: 700,
                                        borderColor: dziError ? "rgba(248,113,113,0.6)" : undefined,
                                    }}
                                    onFocus={e => { e.target.style.borderColor = dziError ? "rgba(248,113,113,0.6)" : "rgba(6,182,212,0.5)"; }}
                                    onBlur={e => { e.target.style.borderColor = dziError ? "rgba(248,113,113,0.6)" : "var(--brand-input-border)"; }}
                                />
                                {dziError && (
                                    <p style={{
                                        marginTop: "0.35rem",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#fca5a5",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                    }}>
                                        <AlertCircle size={11} /> {dziError}
                                    </p>
                                )}
                            </div>

                            {/* Live result */}
                            <div style={{
                                padding: "1rem",
                                borderRadius: "0.875rem",
                                background: dziResult ? dziResult.band.bg : "var(--brand-border)",
                                border: `2px solid ${dziResult ? dziResult.band.border : "var(--brand-border)"}`,
                                textAlign: "center",
                                transition: "all 0.3s",
                                minHeight: "3rem",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.2rem",
                                position: "relative",
                            }}>
                                {dziResult ? (
                                    <>
                                        <span style={{ fontSize: "2.25rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: dziResult.band.color, fontFamily: "monospace" }}>
                                            {dziResult.grade.toFixed(2)}
                                        </span>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: dziResult.band.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            {dziResult.band.label}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={copyGrade}
                                            title="Копирай оценката"
                                            style={{
                                                position: "absolute", top: "0.5rem", right: "0.5rem",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: dziResult.band.color, opacity: 0.6, padding: "2px",
                                                display: "flex", alignItems: "center",
                                            }}
                                        >
                                            {copied ? <Check size={13} /> : <Copy size={13} />}
                                        </button>
                                    </>
                                ) : (
                                    <span style={{ fontSize: "13px", color: "var(--brand-muted)", fontWeight: 600 }}>
                                        Въведи точки
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Slider */}
                       

                        {/* Reference table */}
                        <div style={{ borderTop: "1px solid var(--brand-border)", paddingTop: "1rem" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem" }}>
                                Скала за оценяване
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                {DZI_BANDS.map(b => {
                                    const isActive = dziResult?.band.label === b.label;
                                    return (
                                        <div
                                            key={b.label}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 2fr 1fr",
                                                alignItems: "center",
                                                gap: "0.75rem",
                                                padding: "0.4rem 0.75rem",
                                                borderRadius: "0.5rem",
                                                background: isActive ? b.bg : "transparent",
                                                border: `1px solid ${isActive ? b.border : "transparent"}`,
                                                transition: "all 0.25s",
                                            }}
                                        >
                                            <span style={{ fontSize: "12px", fontWeight: 700, color: b.color }}>
                                                {b.label}
                                            </span>
                                            <div style={{ height: "6px", borderRadius: "999px", background: "var(--brand-border)", overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%",
                                                    borderRadius: "999px",
                                                    background: b.color,
                                                    width: `${b.max}%`,
                                                    opacity: isActive ? 1 : 0.35,
                                                    transition: "opacity 0.25s",
                                                }} />
                                            </div>
                                            <span style={{ fontSize: "11px", color: "var(--brand-muted)", textAlign: "right", fontFamily: "monospace" }}>
                                                {b.min} – {b.max} т.
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </m.div>
                )}

                {/* Tips — shown only when no faculty selected AND dropdown is closed */}
                {!selectedFaculty && !isFacultyDropdownOpen && (
                    <m.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.29 }}
                        style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "2rem" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                            <Lightbulb size={15} style={{ color: "#FBBF24" }} />
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-text)", margin: 0 }}>Съвети за по-добър резултат</p>
                        </div>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {TIPS.map((tip, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                    <ArrowRight size={13} style={{ color: "var(--brand-cyan)", flexShrink: 0, marginTop: "2px" }} />
                                    <span style={{ fontSize: "13px", color: "var(--brand-muted)", lineHeight: 1.55 }}>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </m.div>
                )}

                {/* Grade inputs */}
                <AnimatePresence>
                    {selectedSpecialtyName && rowsForSelectedSpecialty.length > 0 && (
                        <m.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.5rem", marginBottom: "1.5rem" }}
                        >
                            <GradeInputSection
                                coefficients={coefficientsForInputs}
                                faculty={selectedFaculty}
                                specialty={selectedSpecialtyName}
                                onGradesChange={setGrades}
                            />
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                {calcResults.length > 0 && (
                    <m.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1rem" }}
                    >
                        {calcResults.map(({ item, formatted, isAbove, diff, hasStarted, hasMissing, missingSlots, midPoint, avgMaxBall }) => (
                                <div key={item.id} style={{ background: S.surface, backdropFilter: "blur(12px)", border: `1px solid ${S.border}`, borderRadius: "1.25rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                                    {/* Top: name + score */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "11px", color: "var(--brand-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>{item.university_name}</div>
                                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--brand-text)", lineHeight: 1.4, margin: 0 }}>{item.specialty}</h3>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: hasMissing ? "var(--brand-muted)" : isAbove && hasStarted ? "#10b981" : "var(--brand-cyan)" }}>
                                                {hasMissing && hasStarted ? "—" : !hasStarted ? "—" : formatted}
                                            </div>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>бал</div>
                                        </div>
                                    </div>

                                    {/* Formula */}
                                    <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "0.75rem" }}>
                                        <Info size={14} style={{ color: "var(--brand-violet)", flexShrink: 0, marginTop: "1px" }} />
                                        <p style={{ fontSize: "12px", color: "var(--brand-muted)", margin: 0, lineHeight: 1.5 }}>
                                            <strong style={{ color: "var(--brand-text)" }}>Формула:</strong> {item.formula_description}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(148,163,184,0.08)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {midPoint && (
                                            <div style={{ fontSize: "12px", color: "var(--brand-muted)" }}>
                                                Среден бал за прием: <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{midPoint.toFixed(2)}</strong>
                                            </div>
                                        )}

                                        {hasMissing && hasStarted && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", color: "#f87171", fontWeight: 600 }}>
                                                <AlertCircle size={13} />
                                                Липсват: {missingSlots.map(describeMissingTerm).join(", ")}
                                            </div>
                                        )}

                                        {!hasMissing && hasStarted && avgMaxBall && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", fontWeight: 700, color: isAbove ? "#10b981" : "#f87171" }}>
                                                    {isAbove ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {isAbove ? `Над средното с ${diff} т.` : `Под средното с ${diff} т.`}
                                                </div>
                                                <span style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", background: isAbove ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", color: isAbove ? "#10b981" : "#f87171", border: `1px solid ${isAbove ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.25)"}` }}>
                                                    {isAbove ? "НАД СРЕДНОТО" : "ПОД СРЕДНОТО"}
                                                </span>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <ReportButton universityName={item.university_name} specialty={item.specialty} />
                                        </div>
                                    </div>
                                </div>
                        ))}
                    </m.div>
                )}
            </div>

            {/* CLAUDE.md: data source trust signal */}
            {calcResults.length > 0 && (
                <p style={{ marginTop: "1.5rem", fontSize: "11px", color: "var(--brand-muted)", opacity: 0.6, textAlign: "center", letterSpacing: "0.04em" }}>
                    Данните са от официалните наредби на МОН, актуализирани за 2025 г. Средният бал е изчислен от историческия максимален бал.
                </p>
            )}

            <style>{`
                input[type="text"]::placeholder { color: var(--brand-muted); opacity: 0.6; }
                select option { background: var(--brand-dropdown-bg); color: var(--brand-text); }
            `}</style>
        </div>
    );
}
