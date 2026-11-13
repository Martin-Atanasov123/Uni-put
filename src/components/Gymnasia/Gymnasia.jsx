// Прием след VII клас (София): бал по формулата на всяка паралелка, минимални балове
// от 1-ви етап за 4 години и помощник за подреждане на желанията.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import {
    School, Search, ChevronDown, ChevronUp, Plus, Check, X, ArrowUp, ArrowDown, Users, Info,
    TrendingUp, TrendingDown, AlertCircle, Share2, ListChecks, ExternalLink,
} from "lucide-react";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import ErrorState from "@/components/common/ErrorState";
import CalendarModal from "@/components/Calendar/CalendarModal";
import { gymnasiaService } from "@/services/gymnasiaService";
import {
    DIPLOMA_SUBJECTS, ABILITY_EXAMS, computeBal, verdict, wishStatus, wishesAdvice, labelForKey, historyForClass, MAX_BAL,
} from "@/lib/gymnasiaScore";

const REGION = "София-град";
const RUO_URL = "https://ruo.mon.bg/sofia-grad/ucheniczi/priem-na-ucheniczi/priem-v-8-klas/";
const LS_INPUTS = "uniput_g7_inputs_v1";
const LS_WISHES = "uniput_g7_wishes_v1";
const PAGE = 60;
const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const STATUS = {
    safe:     { label: "сигурно",   color: "#10b981" },
    possible: { label: "възможно",  color: "#FBBF24" },
    risky:    { label: "рисково",   color: "#f87171" },
    unknown:  { label: "без данни", color: "var(--brand-muted)" },
};

const card = { background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "1.25rem" };
const input = {
    width: "100%", height: "3rem", padding: "0 0.75rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)",
    borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "0.9375rem", fontFamily: "inherit", outline: "none",
};
const mono = { fontFamily: "monospace" };
const label = { display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brand-muted)", marginBottom: "0.375rem" };
const chip = (on, color = "var(--brand-cyan)") => ({
    display: "inline-flex", alignItems: "center", gap: "0.375rem", minHeight: 40, padding: "0 0.875rem", borderRadius: "999px", cursor: "pointer",
    fontFamily: "inherit", fontSize: "12.5px", fontWeight: 600, color: on ? color : "var(--brand-muted)",
    background: on ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--brand-surface-2)",
    border: `1px solid ${on ? color : "var(--brand-border)"}`,
});
const ghostBtn = {
    display: "inline-flex", alignItems: "center", gap: "0.4rem", minHeight: 44, padding: "0 1rem", background: "transparent",
    border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
};
const iconBtn = {
    display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "var(--brand-surface-2)",
    border: "1px solid var(--brand-border)", borderRadius: "0.625rem", color: "var(--brand-text)", cursor: "pointer",
};

const shortSchool = (s) => String(s || "").replace(/,\s*ГР\.\s*СОФИЯ\.?$/i, "").replace(/\s+/g, " ").trim();
const fmt = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("bg-BG", { maximumFractionDigits: 2 }));

function readLS(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function writeLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* недостъпен */ } }

function useIsDesktop() {
    const [d, setD] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const on = () => setD(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return d;
}

// ── Детайли на паралелка: всички етапи × години ──────────────────────────────
function HistoryTable({ cls, stage1 }) {
    const [rows, setRows] = useState(null);
    const [err, setErr] = useState(false);
    useEffect(() => {
        let alive = true;
        gymnasiaService.getSchoolRankings(cls.school_code)
            .then((r) => { if (alive) setRows(r); })
            .catch(() => { if (alive) setErr(true); });
        return () => { alive = false; };
    }, [cls.school_code]);
    const hist = historyForClass(cls, stage1);
    const codesByYear = Object.fromEntries(hist.map((h) => [h.year, h]));
    const mine = (rows || []).filter((r) => {
        const h = codesByYear[r.campaign_year];
        if (!h?.matched) return false;
        return h.matched === "code" ? r.class_code === cls.class_code
            : r.class_name && cls.class_name && r.class_name.toLowerCase().replace(/\s+/g, " ") === cls.class_name.toLowerCase().replace(/\s+/g, " ");
    });
    const years = [...new Set(mine.map((r) => r.campaign_year))].sort((a, b) => b - a);
    if (err) return <p style={{ margin: 0, fontSize: "12.5px", color: "#f87171" }}>Не успяхме да заредим класиранията. Опитай пак.</p>;
    if (!rows) return <p style={{ margin: 0, fontSize: "12.5px", color: "var(--brand-muted)" }}>Зареждане на класиранията…</p>;
    if (!years.length) return <p style={{ margin: 0, fontSize: "12.5px", color: "var(--brand-muted)" }}>Няма класирания за тази паралелка — вероятно е нова.</p>;
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                    <tr style={{ color: "var(--brand-muted)", textAlign: "left" }}>
                        <th style={{ padding: "0.375rem 0.5rem", fontWeight: 700 }}>Година</th>
                        {[1, 2, 3, 4].map((s) => <th key={s} style={{ padding: "0.375rem 0.5rem", fontWeight: 700, textAlign: "right" }}>{s}. етап</th>)}
                        <th style={{ padding: "0.375rem 0.5rem", fontWeight: 700, textAlign: "right" }}>макс.</th>
                    </tr>
                </thead>
                <tbody>
                    {years.map((y) => {
                        const by = Object.fromEntries(mine.filter((r) => r.campaign_year === y).map((r) => [r.stage, r]));
                        return (
                            <tr key={y} style={{ borderTop: "1px solid var(--brand-border)" }}>
                                <td style={{ padding: "0.375rem 0.5rem", fontWeight: 700 }}>{y}{codesByYear[y]?.matched === "name" && <span title="свързано по име, кодът е сменен" style={{ color: "var(--brand-muted)" }}>*</span>}</td>
                                {[1, 2, 3, 4].map((s) => (
                                    <td key={s} style={{ ...mono, padding: "0.375rem 0.5rem", textAlign: "right", color: by[s]?.min_total > 0 ? "var(--brand-text)" : "var(--brand-muted)" }}>
                                        {by[s]?.min_total > 0 ? fmt(by[s].min_total) : "—"}
                                    </td>
                                ))}
                                <td style={{ ...mono, padding: "0.375rem 0.5rem", textAlign: "right", color: "var(--brand-muted)" }}>{fmt(by[1]?.max_total)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p style={{ margin: "0.5rem 0 0", fontSize: "11px", color: "var(--brand-muted)" }}>„—“ = няма класирани на този етап (местата са запълнени или няма кандидати). * = същата паралелка под друг код.</p>
        </div>
    );
}

// ── Ред за паралелка ─────────────────────────────────────────────────────────
function ClassRow({ row, year, inWish, onToggleWish, expanded, onExpand, stage1 }) {
    const { cls, bal, missing, hist, v } = row;
    const prev = hist.slice(1, 4).filter((h) => h.min !== null);
    return (
        <li style={{ ...card, overflow: "hidden", borderLeft: `3px solid ${v ? (v.above ? "#10b981" : "#f87171") : "var(--brand-border)"}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", padding: "0.875rem 1rem", alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem 0.5rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cls.kind === "професионална" ? "var(--brand-violet)" : "var(--brand-cyan)" }}>{cls.kind}</span>
                        {cls.quota && <span title="Прием по квоти — отделни минимални балове за момчета и момичета" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)" }}><Users size={11} strokeWidth={1.5} aria-hidden="true" /> квоти</span>}
                        {cls.places ? <span style={{ fontSize: "10px", color: "var(--brand-muted)" }}>{cls.places} места</span> : null}
                    </div>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3, color: "var(--brand-text)" }}>{cls.class_name}</h3>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "12.5px", color: "var(--brand-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <School size={12} strokeWidth={1.5} aria-hidden="true" /> {shortSchool(cls.school_name)}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.375rem 1rem", marginTop: "0.5rem" }}>
                        <span style={{ fontSize: "12px", color: "var(--brand-muted)" }}>мин. {year}: <strong style={{ ...mono, color: "var(--brand-text)" }}>{fmt(hist[0]?.min)}</strong></span>
                        {prev.map((h) => <span key={h.year} style={{ fontSize: "11.5px", color: "var(--brand-muted)" }}>{h.year}: <span style={mono}>{fmt(h.min)}</span></span>)}
                        {hist[0]?.min === null && <span style={{ fontSize: "11.5px", color: "var(--brand-muted)" }}>няма данни от {year} г. (нова паралелка)</span>}
                    </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {bal !== null ? (
                        <>
                            <div style={{ ...mono, fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(bal)}</div>
                            {v ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem", fontSize: "11px", fontWeight: 700, color: v.above ? "#10b981" : "#f87171" }}>
                                    {v.above ? <TrendingUp size={12} strokeWidth={1.5} aria-hidden="true" /> : <TrendingDown size={12} strokeWidth={1.5} aria-hidden="true" />}
                                    {v.above ? "над" : "под"} мин. с {fmt(Math.abs(v.diff))}
                                </span>
                            ) : <span style={{ display: "block", marginTop: "0.25rem", fontSize: "11px", color: "var(--brand-muted)" }}>без ориентир</span>}
                        </>
                    ) : (
                        <span title={missing.map(labelForKey).join(", ")} style={{ fontSize: "11px", color: "#FBBF24", fontWeight: 600, maxWidth: 140, display: "inline-block", lineHeight: 1.3 }}>
                            {missing[0]?.startsWith("olimp_") ? "иска резултат от олимпиада" : `въведи ${missing.map((k) => labelForKey(k).replace(/ \(свидетелство\)| \(.*\)/, "")).slice(0, 2).join(", ")}`}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", padding: "0 1rem 0.75rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => onToggleWish(cls.class_code)} aria-pressed={inWish}
                    style={{ ...ghostBtn, borderColor: inWish ? "var(--brand-cyan)" : "var(--brand-border)", color: inWish ? "var(--brand-cyan)" : "var(--brand-text)" }}>
                    {inWish ? <Check size={14} strokeWidth={1.5} aria-hidden="true" /> : <Plus size={14} strokeWidth={1.5} aria-hidden="true" />}
                    {inWish ? "В желанията" : "Добави в желанията"}
                </button>
                <button type="button" onClick={() => onExpand(expanded ? null : cls.class_code)} aria-expanded={expanded} style={ghostBtn}>
                    {expanded ? <ChevronUp size={14} strokeWidth={1.5} aria-hidden="true" /> : <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />}
                    Формула и класирания
                </button>
            </div>
            <AnimatePresence initial={false}>
                {expanded && (
                    <m.div initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
                        <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--brand-border)" }}>
                            <div style={{ paddingTop: "0.75rem" }}>
                                <span style={label}>Балообразуване</span>
                                <code style={{ fontSize: "12.5px", color: "var(--brand-text)", background: "var(--brand-surface-2)", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", display: "inline-block" }}>{cls.formula_raw}</code>
                                <p style={{ margin: "0.375rem 0 0", fontSize: "11.5px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                                    НВО точките (до 100) се умножават по коефициента; оценките от свидетелството: 6 → 50, 5 → 39, 4 → 26, 3 → 15 т. Максимум {MAX_BAL}.
                                    {cls.first_language && <> Първи чужд език: {cls.first_language}{cls.language_mode ? ` (${cls.language_mode})` : ""}.</>}
                                </p>
                            </div>
                            <div>
                                <span style={label}>Минимален бал по етапи</span>
                                <HistoryTable cls={cls} stage1={stage1} />
                            </div>
                            <a href={RUO_URL} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "12px", fontWeight: 600, color: "var(--brand-muted)", textDecoration: "none" }}>
                                Източник: РУО – София-град <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
                            </a>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </li>
    );
}

// ── Желания ──────────────────────────────────────────────────────────────────
function WishesList({ wishes, rowsByCode, onMove, onRemove, onCopy, copied }) {
    const statuses = wishes.map((c) => rowsByCode[c]?.status || "unknown");
    const advice = wishesAdvice(statuses);
    if (!wishes.length) {
        return (
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--brand-muted)" }}>
                Все още нямаш желания. Добави паралелки от списъка и ги подреди така, както би ги подал — класирането върви по реда им.
            </p>
        );
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {wishes.map((code, i) => {
                    const r = rowsByCode[code]; if (!r) return null;
                    const st = STATUS[r.status];
                    return (
                        <li key={code} style={{ display: "grid", gridTemplateColumns: "1.5rem 1fr auto", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0.625rem", background: "var(--brand-surface-2)", borderRadius: "0.75rem", borderLeft: `3px solid ${st.color}` }}>
                            <span style={{ ...mono, fontSize: "12px", fontWeight: 800, color: "var(--brand-muted)" }}>{i + 1}</span>
                            <span style={{ minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.cls.class_name}</span>
                                <span style={{ display: "block", fontSize: "11px", color: "var(--brand-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortSchool(r.cls.school_name)}</span>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: st.color }}>{st.label}{r.v ? ` · ${r.v.above ? "+" : "−"}${fmt(Math.abs(r.v.diff))}` : ""}</span>
                            </span>
                            <span style={{ display: "flex", gap: "0.25rem" }}>
                                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Премести нагоре" style={{ ...iconBtn, opacity: i === 0 ? 0.4 : 1 }}><ArrowUp size={14} strokeWidth={1.5} aria-hidden="true" /></button>
                                <button type="button" onClick={() => onMove(i, 1)} disabled={i === wishes.length - 1} aria-label="Премести надолу" style={{ ...iconBtn, opacity: i === wishes.length - 1 ? 0.4 : 1 }}><ArrowDown size={14} strokeWidth={1.5} aria-hidden="true" /></button>
                                <button type="button" onClick={() => onRemove(code)} aria-label="Премахни" style={iconBtn}><X size={14} strokeWidth={1.5} aria-hidden="true" /></button>
                            </span>
                        </li>
                    );
                })}
            </ol>
            {advice && (
                <p style={{ margin: 0, display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "12.5px", lineHeight: 1.55, color: "var(--brand-text)", padding: "0.625rem 0.75rem", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "0.75rem" }}>
                    <AlertCircle size={14} strokeWidth={1.5} style={{ color: "#FBBF24", flexShrink: 0, marginTop: 2 }} aria-hidden="true" /> {advice}
                </p>
            )}
            <p style={{ margin: 0, fontSize: "11px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                Подреждането е твое — не го сменяме автоматично. „Сигурно“ = поне 15 т. над миналогодишния минимум; „възможно“ = до 5 т. под него. Баловете се менят с около 8 т. годишно.
            </p>
            <button type="button" onClick={onCopy} style={{ ...ghostBtn, alignSelf: "flex-start", color: copied ? "#10b981" : "var(--brand-text)" }}>
                {copied ? <Check size={14} strokeWidth={1.5} aria-hidden="true" /> : <Share2 size={14} strokeWidth={1.5} aria-hidden="true" />} {copied ? "Копирано" : "Копирай линк към списъка"}
            </button>
        </div>
    );
}

// ── Страница ─────────────────────────────────────────────────────────────────
export default function Gymnasia() {
    const isDesktop = useIsDesktop();
    const [params, setParams] = useSearchParams();
    const [year, setYear] = useState(null);
    const [classes, setClasses] = useState([]);
    const [stage1, setStage1] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [inputs, setInputs] = useState(() => readLS(LS_INPUTS, {}));
    const [wishes, setWishes] = useState(() => {
        const fromUrl = (new URLSearchParams(window.location.search).get("w") || "").split(",").map((s) => s.trim()).filter(Boolean);
        return fromUrl.length ? fromUrl.slice(0, 40) : readLS(LS_WISHES, []);
    });
    const [q, setQ] = useState("");
    const [kind, setKind] = useState("");
    const [onlyIn, setOnlyIn] = useState(false);
    const [sort, setSort] = useState("min");
    const [expanded, setExpanded] = useState(null);
    const [shown, setShown] = useState(PAGE);
    const [abilityOpen, setAbilityOpen] = useState(false);
    const [wishesOpen, setWishesOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(false);
        try {
            const y = await gymnasiaService.getLatestYear(REGION);
            if (!y) { setClasses([]); setStage1([]); setYear(null); return; }
            const [cls, s1] = await Promise.all([
                gymnasiaService.getClasses(y, REGION),
                gymnasiaService.getStage1([y, y - 1, y - 2, y - 3], REGION),
            ]);
            setYear(y); setClasses(cls); setStage1(s1);
        } catch { setError(true); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    useEffect(() => { writeLS(LS_INPUTS, inputs); }, [inputs]);
    useEffect(() => {
        writeLS(LS_WISHES, wishes);
        const next = new URLSearchParams(params);
        if (wishes.length) next.set("w", wishes.join(",")); else next.delete("w");
        if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, [wishes, params, setParams]);

    const setInput = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
    const hasNvo = inputs.nvo_bel !== undefined && inputs.nvo_bel !== "" && inputs.nvo_mat !== undefined && inputs.nvo_mat !== "";

    const rows = useMemo(() => classes.map((cls) => {
        const { bal, missing } = hasNvo ? computeBal(cls, inputs) : { bal: null, missing: [] };
        const hist = historyForClass(cls, stage1);
        const min = hist[0]?.min ?? null;
        const v = verdict(bal, min);
        return { cls, bal, missing, hist, min, v, status: wishStatus(bal, min) };
    }), [classes, inputs, hasNvo, stage1]);
    const rowsByCode = useMemo(() => Object.fromEntries(rows.map((r) => [r.cls.class_code, r])), [rows]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const list = rows.filter((r) =>
            (!kind || r.cls.kind === kind) &&
            (!onlyIn || (r.v && r.v.above)) &&
            (!needle || `${r.cls.school_name} ${r.cls.class_name} ${r.cls.first_language || ""}`.toLowerCase().includes(needle))
        );
        const byMin = (a, b) => (b.min ?? -1) - (a.min ?? -1);
        if (sort === "bal") list.sort((a, b) => (b.bal ?? -1) - (a.bal ?? -1) || byMin(a, b));
        else if (sort === "school") list.sort((a, b) => a.cls.school_name.localeCompare(b.cls.school_name, "bg") || a.cls.class_name.localeCompare(b.cls.class_name, "bg"));
        else list.sort(byMin);
        return list;
    }, [rows, q, kind, onlyIn, sort]);

    const stats = useMemo(() => {
        const withBal = rows.filter((r) => r.bal !== null);
        const inCount = rows.filter((r) => r.v?.above).length;
        const withMin = rows.filter((r) => r.min !== null).length;
        const bals = withBal.map((r) => r.bal);
        return { withBal: withBal.length, inCount, withMin, lo: bals.length ? Math.min(...bals) : null, hi: bals.length ? Math.max(...bals) : null };
    }, [rows]);

    const toggleWish = (code) => setWishes((w) => (w.includes(code) ? w.filter((c) => c !== code) : [...w, code]));
    const moveWish = (i, d) => setWishes((w) => { const n = [...w]; const j = i + d; if (j < 0 || j >= n.length) return w; [n[i], n[j]] = [n[j], n[i]]; return n; });
    const copyLink = () => {
        const url = window.location.href;
        const done = (ok) => { setCopied(ok); setTimeout(() => setCopied(false), 2000); };
        if (window.isSecureContext && navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
        else done(false);
    };

    const wishesPanel = <WishesList wishes={wishes} rowsByCode={rowsByCode} onMove={moveWish} onRemove={(c) => toggleWish(c)} onCopy={copyLink} copied={copied} />;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", padding: "7rem 1rem 6rem", color: "var(--brand-text)" }}>
            <Seo
                title={`Прием след 7. клас в София ${year ? year + 1 : ""} — бал, минимални балове и желания`}
                description="Изчисли бала си за всяка паралелка в София по формулата от РУО, сравни с минималните балове от последните 4 години и подреди желанията си разумно. Безплатно."
                path="/priem-7-klas"
            />
            <JsonLd data={{
                "@context": "https://schema.org", "@type": "HowTo", inLanguage: "bg-BG",
                name: "Как да подредя желанията си за прием след 7. клас",
                step: [
                    { "@type": "HowToStep", name: "Въведи резултатите", text: "Точки от НВО по БЕЛ и математика и оценките от свидетелството." },
                    { "@type": "HowToStep", name: "Сравни", text: "Виж бала си за всяка паралелка и минималния бал от последните класирания." },
                    { "@type": "HowToStep", name: "Подреди желанията", text: "Мечтаните най-отпред, сигурните след тях — класирането върви по реда." },
                ],
            }} />

            <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <m.header initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.875rem", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "999px", marginBottom: "1rem" }}>
                        <School size={14} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} aria-hidden="true" />
                        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-cyan)" }}>Прием след 7. клас · {REGION}</span>
                    </div>
                    <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, textWrap: "balance" }}>
                        Виж в кои гимназии влизаш — <span style={{ background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>преди да подадеш желанията</span>
                    </h1>
                    <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.6, color: "var(--brand-muted)", maxWidth: "62ch" }}>
                        Балът ти по формулата на всяка паралелка, минималните балове от последните 4 кампании и помощник, който казва къде е сигурно, къде е възможно и къде е риск.
                    </p>
                </m.header>

                <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "0.875rem" }}>
                    <Info size={16} strokeWidth={1.5} style={{ color: "var(--brand-cyan)", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                    <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.55, color: "var(--brand-muted)" }}>
                        Данните са от справките на РУО – София-град: паралелки и балообразуване за прием {year ? `${year}/${year + 1}` : ""}, класирания {year ? `${year - 3}–${year}` : ""} г.
                        Минималният бал е този на последния приет на съответния етап — той се формира всяка година наново. Миналите балове са ориентир, не гаранция.
                    </p>
                </div>

                {/* Входове */}
                <section aria-labelledby="g7-inputs" style={{ ...card, padding: "1.25rem" }}>
                    <h2 id="g7-inputs" style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Твоите резултати</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                        {[["nvo_bel", "НВО БЕЛ (точки)"], ["nvo_mat", "НВО математика (точки)"]].map(([k, l]) => (
                            <div key={k}>
                                <label htmlFor={k} style={label}>{l}</label>
                                <input id={k} type="number" inputMode="decimal" min={0} max={100} step={0.25} value={inputs[k] ?? ""} onChange={(e) => setInput(k, e.target.value)} placeholder="0 – 100" style={{ ...input, ...mono, textAlign: "center" }} />
                            </div>
                        ))}
                    </div>
                    <span style={label}>Оценки от свидетелството (7. клас)</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem" }}>
                        {DIPLOMA_SUBJECTS.map((s) => (
                            <label key={s.key} title={s.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: 44, padding: "0 0.625rem", background: "var(--brand-surface-2)", border: "1px solid var(--brand-border)", borderRadius: "0.625rem", fontSize: "12.5px", fontWeight: 600 }}>
                                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.abbr} <span style={{ fontWeight: 400, color: "var(--brand-muted)" }}>· {s.label}</span></span>
                                <select value={inputs[s.key] ?? ""} onChange={(e) => setInput(s.key, e.target.value)} aria-label={s.label} style={{ ...input, ...mono, width: 64, height: 36, padding: "0 0.25rem", textAlign: "center" }}>
                                    <option value="">—</option>
                                    {[6, 5, 4, 3].map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </label>
                        ))}
                    </div>
                    <button type="button" onClick={() => setAbilityOpen((v) => !v)} aria-expanded={abilityOpen} style={{ ...ghostBtn, marginTop: "0.75rem" }}>
                        {abilityOpen ? <ChevronUp size={14} strokeWidth={1.5} aria-hidden="true" /> : <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />} Изпити за проверка на способностите
                    </button>
                    {abilityOpen && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
                            {ABILITY_EXAMS.map((a) => (
                                <div key={a.key}>
                                    <label htmlFor={a.key} style={label}>{a.label}</label>
                                    <input id={a.key} type="number" inputMode="decimal" min={0} max={100} step={0.5} value={inputs[a.key] ?? ""} onChange={(e) => setInput(a.key, e.target.value)} placeholder="0 – 100" style={{ ...input, ...mono, textAlign: "center" }} />
                                </div>
                            ))}
                        </div>
                    )}
                    {hasNvo && stats.withBal > 0 && (
                        <p style={{ margin: "1rem 0 0", fontSize: "13.5px", lineHeight: 1.6 }}>
                            Балът ти е между <strong style={mono}>{fmt(stats.lo)}</strong> и <strong style={mono}>{fmt(stats.hi)}</strong> според паралелката.
                            По минимумите от 1-ви етап {year} г. влизаш в <strong style={mono}>{stats.inCount}</strong> от {stats.withMin} паралелки с данни.
                        </p>
                    )}
                    {!hasNvo && <p style={{ margin: "1rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>Въведи точките от двете НВО, за да видиш бала си. Без тях списъкът показва само минималните балове.</p>}
                </section>

                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1fr) 22rem" : "minmax(0, 1fr)", gap: "1.5rem", alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 0 }}>
                        {/* Филтри */}
                        <div style={{ ...card, padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={16} strokeWidth={1.5} aria-hidden="true" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                                <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Училище, профил, език…" aria-label="Търси паралелка" style={{ ...input, paddingLeft: "2.5rem" }} />
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                                {[["", "Всички"], ["профилирана", "Профилирани"], ["професионална", "Професионални"]].map(([k, l]) => (
                                    <button key={k} type="button" onClick={() => { setKind(k); setShown(PAGE); }} style={chip(kind === k)}>{l}</button>
                                ))}
                                <button type="button" onClick={() => { setOnlyIn((v) => !v); setShown(PAGE); }} disabled={!hasNvo} style={{ ...chip(onlyIn, "#10b981"), opacity: hasNvo ? 1 : 0.5 }}>
                                    <Check size={13} strokeWidth={1.5} aria-hidden="true" /> Само където влизам
                                </button>
                                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Подреди" style={{ ...input, width: "auto", height: 40, marginLeft: "auto", fontSize: "12.5px" }}>
                                    <option value="min">по минимален бал</option>
                                    <option value="bal">по моя бал</option>
                                    <option value="school">по училище</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ ...card, padding: "3rem", textAlign: "center", color: "var(--brand-muted)" }}>Зареждане на паралелките…</div>
                        ) : error ? (
                            <ErrorState message="Не успяхме да заредим паралелките. Провери връзката и опитай пак." onRetry={load} />
                        ) : classes.length === 0 ? (
                            <div style={{ ...card, padding: "3rem", textAlign: "center", color: "var(--brand-muted)" }}>Скоро добавяме паралелките за този регион.</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ ...card, padding: "2.5rem 1.5rem", textAlign: "center" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, textWrap: "balance" }}>Нищо не съвпада с тези филтри</h3>
                                <p style={{ margin: "0.5rem 0 0", fontSize: "13.5px", color: "var(--brand-muted)" }}>Опитай с по-кратка дума или махни „Само където влизам“.</p>
                            </div>
                        ) : (
                            <>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--brand-muted)" }}>{filtered.length} паралелки</p>
                                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                    {filtered.slice(0, shown).map((r) => (
                                        <ClassRow key={r.cls.class_code} row={r} year={year} stage1={stage1} inWish={wishes.includes(r.cls.class_code)} onToggleWish={toggleWish} expanded={expanded === r.cls.class_code} onExpand={setExpanded} />
                                    ))}
                                </ul>
                                {filtered.length > shown && (
                                    <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...ghostBtn, alignSelf: "center" }}>Покажи още {Math.min(PAGE, filtered.length - shown)}</button>
                                )}
                            </>
                        )}
                    </div>

                    {isDesktop && (
                        <aside aria-labelledby="g7-wishes" style={{ ...card, padding: "1.25rem", position: "sticky", top: "6rem" }}>
                            <h2 id="g7-wishes" style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <ListChecks size={18} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} aria-hidden="true" /> Моите желания {wishes.length > 0 && <span style={{ ...mono, fontSize: "12px", color: "var(--brand-muted)" }}>({wishes.length})</span>}
                            </h2>
                            {wishesPanel}
                        </aside>
                    )}
                </div>

                <p style={{ margin: 0, fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.6, maxWidth: "70ch" }}>
                    Следваща стъпка след гимназията: <Link to="/dzi-strateg" style={{ color: "var(--brand-cyan)" }}>кой втори ДЗИ да избереш</Link> и <Link to="/calculator/" style={{ color: "var(--brand-cyan)" }}>балът за университет</Link> — УниПът е с теб по целия път.
                </p>
            </div>

            {/* Мобилен бутон + диалог за желанията */}
            {!isDesktop && (
                <>
                    <button type="button" onClick={() => setWishesOpen(true)} style={{
                        position: "fixed", left: "1rem", right: "1rem", bottom: "1rem", zIndex: 40, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", border: "none", borderRadius: "0.75rem", color: "#fff", fontSize: "15px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 12px 30px rgba(6,182,212,0.3)",
                    }}>
                        <ListChecks size={18} strokeWidth={1.5} aria-hidden="true" /> Моите желания{wishes.length ? ` (${wishes.length})` : ""}
                    </button>
                    <CalendarModal open={wishesOpen} onClose={() => setWishesOpen(false)} title="Моите желания" subtitle="Подреди ги така, както ще ги подадеш.">
                        {wishesPanel}
                    </CalendarModal>
                </>
            )}
        </div>
    );
}
