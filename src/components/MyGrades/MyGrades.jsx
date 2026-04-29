import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import {
    BookOpen, ChevronDown, ChevronUp, CheckCircle2,
    Clock, Calculator, Save, AlertCircle, RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    GRADE_CATEGORIES, loadGrades, saveGrades, getUpdatedAt, syncToSupabase, loadFromSupabase,
} from "@/lib/gradeStore";
import { useAuth } from "@/hooks/useAuth";

// ── Валидация ────────────────────────────────────────────────────────────────
function isValid(val) {
    if (val === "" || val == null) return true;
    const n = Number(val);
    return !Number.isNaN(n) && n >= 2 && n <= 6;
}

function fmt(val) {
    if (val === "" || val == null) return "";
    const n = Number(val);
    return Number.isNaN(n) ? "" : n.toFixed(2);
}

// ── Едно поле за оценка ──────────────────────────────────────────────────────
function GradeField({ label, gradeKey, value, onChange, onBlur }) {
    const [focused, setFocused] = useState(false);
    const invalid = !isValid(value) && value !== "";
    const filled = value !== "" && !invalid;

    return (
        <div style={{
            background: "var(--brand-surface)",
            border: `1px solid ${invalid ? "rgba(248,113,113,0.4)" : filled ? "rgba(6,182,212,0.3)" : "var(--brand-border)"}`,
            borderRadius: "0.875rem",
            padding: "0.875rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: focused && !invalid ? "0 0 0 3px rgba(6,182,212,0.08)" : "none",
        }}>
            <label style={{
                fontSize: "11px", fontWeight: 700,
                color: filled ? "var(--brand-cyan)" : "var(--brand-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em",
                lineHeight: 1.35, display: "flex", alignItems: "center", gap: "0.35rem",
                transition: "color 0.2s",
            }}>
                {filled && <CheckCircle2 size={10} style={{ flexShrink: 0 }} />}
                {label}
            </label>

            <input
                type="text"
                inputMode="decimal"
                placeholder="—"
                value={value}
                onChange={e => onChange(gradeKey, e.target.value.replace(",", "."))}
                onFocus={() => setFocused(true)}
                onBlur={() => { setFocused(false); onBlur(gradeKey); }}
                style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "monospace",
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: invalid ? "#f87171" : filled ? "var(--brand-text)" : "var(--brand-muted)",
                    width: "100%",
                    padding: 0,
                    letterSpacing: "-0.02em",
                }}
            />

            {invalid && (
                <span style={{ fontSize: "10px", color: "#f87171", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <AlertCircle size={10} /> 2.00 – 6.00
                </span>
            )}
        </div>
    );
}

// ── Категория (accordion) ────────────────────────────────────────────────────
function CategorySection({ category, grades, onChange, onBlur, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const filled = category.fields.filter(f => grades[f.key] && grades[f.key] !== "").length;
    const total = category.fields.length;

    return (
        <div style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: "1.25rem",
            overflow: "hidden",
        }}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: "0.875rem", padding: "1.125rem 1.25rem",
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "inherit", textAlign: "left",
                }}
            >
                <div style={{
                    width: "36px", height: "36px", borderRadius: "0.625rem", flexShrink: 0,
                    background: `${category.color}18`,
                    border: `1px solid ${category.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <BookOpen size={16} style={{ color: category.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>
                        {category.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--brand-muted)", marginTop: "0.1rem" }}>
                        {category.description}
                    </div>
                </div>

                {/* Progress pill */}
                <div style={{
                    padding: "0.2rem 0.625rem", borderRadius: "999px", flexShrink: 0,
                    background: filled > 0 ? `${category.color}15` : "var(--brand-surface-2)",
                    border: `1px solid ${filled > 0 ? category.color + "30" : "var(--brand-border)"}`,
                    fontSize: "11px", fontWeight: 700,
                    color: filled > 0 ? category.color : "var(--brand-muted)",
                }}>
                    {filled}/{total}
                </div>

                <div style={{ color: "var(--brand-muted)", flexShrink: 0, marginLeft: "0.25rem" }}>
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Fields grid */}
            <AnimatePresence initial={false}>
                {open && (
                    <m.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div style={{
                            padding: "0 1.25rem 1.25rem",
                            borderTop: "1px solid var(--brand-border)",
                            paddingTop: "1.125rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.75rem",
                        }}>
                            {category.fields.map(field => (
                                <GradeField
                                    key={field.key}
                                    gradeKey={field.key}
                                    label={field.label}
                                    value={grades[field.key] ?? ""}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                />
                            ))}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Главна страница ──────────────────────────────────────────────────────────
export default function MyGradesPage() {
    const { user } = useAuth();
    const [grades, setGrades] = useState({});
    const [syncing, setSyncing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [cloudLoaded, setCloudLoaded] = useState(false);
    const syncTimer = useRef(null);

    // 1. Зареди от localStorage при mount
    useEffect(() => {
        const local = loadGrades();
        setGrades(local);
        setLastSaved(getUpdatedAt());
    }, []);

    // 2. Ако е влязъл — опитай да заредиш от Supabase (по-свежи данни)
    useEffect(() => {
        if (!user || cloudLoaded) return;
        (async () => {
            const cloud = await loadFromSupabase();
            if (cloud && Object.keys(cloud).length > 0) {
                // Merge: cloud overrides local само за попълнени полета
                setGrades(prev => ({ ...prev, ...cloud }));
                saveGrades({ ...loadGrades(), ...cloud });
            }
            setCloudLoaded(true);
        })();
    }, [user, cloudLoaded]);

    // Запис на стойност
    const handleChange = useCallback((key, value) => {
        setGrades(prev => ({ ...prev, [key]: value }));
    }, []);

    // При blur — форматирай + запази локално + schedule cloud sync
    const handleBlur = useCallback((key) => {
        setGrades(prev => {
            const formatted = fmt(prev[key]);
            const next = { ...prev, [key]: formatted };
            saveGrades(next);
            setLastSaved(new Date().toISOString());
            return next;
        });

        // Debounced cloud sync — 2 секунди след последния blur
        if (user) {
            if (syncTimer.current) clearTimeout(syncTimer.current);
            syncTimer.current = setTimeout(() => {
                setSyncing(true);
                syncToSupabase(loadGrades()).finally(() => setSyncing(false));
            }, 2000);
        }
    }, [user]);

    // Статистики
    const totalFilled = GRADE_CATEGORIES.reduce(
        (sum, cat) => sum + cat.fields.filter(f => grades[f.key] && grades[f.key] !== "").length, 0
    );
    const totalFields = GRADE_CATEGORIES.reduce((sum, cat) => sum + cat.fields.length, 0);
    const pct = Math.round((totalFilled / totalFields) * 100);

    const lastSavedLabel = lastSaved
        ? new Date(lastSaved).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", paddingTop: "7rem", paddingBottom: "5rem" }}>
            <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* ── Заглавие ── */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: "2rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--brand-violet)", boxShadow: "0 0 10px var(--brand-violet)" }} />
                        <span style={{ color: "var(--brand-violet)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                            Моят профил
                        </span>
                    </div>
                    <h1 style={{
                        fontSize: "clamp(1.875rem,5vw,3rem)", fontWeight: 900,
                        color: "var(--brand-text)", lineHeight: 1.1, letterSpacing: "-0.03em",
                        margin: "0 0 0.625rem", textWrap: "balance",
                    }}>
                        Моите{" "}
                        <span style={{ background: "linear-gradient(135deg,var(--brand-violet),var(--brand-cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            оценки
                        </span>
                    </h1>
                    <p style={{ color: "var(--brand-muted)", fontSize: "14px", lineHeight: 1.6, maxWidth: "42rem", margin: 0 }}>
                        Попълни оценките си веднъж — калкулаторът ще ги зареди автоматично за всяка специалност.
                    </p>
                </m.div>

                {/* ── Статус лента ── */}
                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                    style={{
                        background: "var(--brand-surface)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "1.25rem",
                        padding: "1.125rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Progress bar */}
                    <div style={{ flex: 1, minWidth: "160px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand-text)" }}>
                                Попълнени полета
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 800, fontFamily: "monospace", color: "var(--brand-cyan)" }}>
                                {totalFilled}/{totalFields}
                            </span>
                        </div>
                        <div style={{ height: "6px", borderRadius: "999px", background: "var(--brand-border)", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: "999px",
                                background: "linear-gradient(90deg,var(--brand-cyan),var(--brand-violet))",
                                width: `${pct}%`,
                                transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
                            }} />
                        </div>
                    </div>

                    {/* Save status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        {syncing ? (
                            <>
                                <RefreshCw size={13} style={{ color: "var(--brand-cyan)", animation: "spin 1s linear infinite" }} />
                                <span style={{ fontSize: "12px", color: "var(--brand-muted)" }}>Синхронизиране...</span>
                            </>
                        ) : lastSavedLabel ? (
                            <>
                                <Save size={13} style={{ color: "#10b981" }} />
                                <span style={{ fontSize: "12px", color: "var(--brand-muted)" }}>Запазено {lastSavedLabel}</span>
                            </>
                        ) : (
                            <>
                                <Clock size={13} style={{ color: "var(--brand-muted)" }} />
                                <span style={{ fontSize: "12px", color: "var(--brand-muted)" }}>Не е запазено</span>
                            </>
                        )}
                    </div>

                    {/* CTA */}
                    <Link
                        to="/calculator"
                        style={{
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            padding: "0.5rem 1rem", borderRadius: "0.625rem",
                            background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                            color: "#fff", fontSize: "13px", fontWeight: 700,
                            textDecoration: "none", flexShrink: 0,
                        }}
                    >
                        <Calculator size={14} /> Изчисли бал →
                    </Link>
                </m.div>

                {/* ── Guest banner ── */}
                {!user && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: "flex", alignItems: "flex-start", gap: "0.75rem",
                            padding: "0.875rem 1rem",
                            background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)",
                            borderRadius: "0.875rem", marginBottom: "1.5rem",
                        }}
                    >
                        <AlertCircle size={15} style={{ color: "#FBBF24", flexShrink: 0, marginTop: "2px" }} />
                        <p style={{ fontSize: "13px", color: "var(--brand-muted)", margin: 0, lineHeight: 1.55 }}>
                            Оценките се пазят само в браузъра.{" "}
                            <Link to="/register" style={{ color: "var(--brand-cyan)", fontWeight: 700, textDecoration: "none" }}>
                                Регистрирай се
                            </Link>{" "}
                            за да ги запазиш в профила си и да ги достъпваш от всяко устройство.
                        </p>
                    </m.div>
                )}

                {/* ── Категории ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {GRADE_CATEGORIES.map((cat, i) => (
                        <m.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.12 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <CategorySection
                                category={cat}
                                grades={grades}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                defaultOpen={i === 0}
                            />
                        </m.div>
                    ))}
                </div>

                {/* ── Footer note ── */}
                <p style={{ fontSize: "11px", color: "var(--brand-muted)", opacity: 0.5, textAlign: "center", marginTop: "2.5rem", letterSpacing: "0.04em" }}>
                    Оценките се записват автоматично при всяка промяна. Калкулаторът ги зарежда автоматично.
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
