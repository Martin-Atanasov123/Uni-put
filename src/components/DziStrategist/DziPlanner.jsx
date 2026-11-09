// Обратен калкулатор за ДЗИ: избираш специалностите, които те интересуват,
// и виждаш кой втори ДЗИ държи най-много от тях отворени без кандидатстудентски изпит.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import { Search, X, ChevronDown, Share2, Check, AlertCircle, Sparkles, Calculator as CalcIcon, ArrowRight } from "lucide-react";
import { dziService } from "@/services/dziService";
import { rankSecondDzi } from "@/lib/dziPlan";

const MAX_CHOSEN = 12;
const STATUS = {
    open:   { label: "без изпит",   color: "#10b981" },
    exam:   { label: "с кандидатстудентски изпит", color: "#FBBF24" },
    closed: { label: "затворена",   color: "#f87171" },
};
const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const card = {
    background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "1.25rem",
};
const inputStyle = {
    width: "100%", height: "3rem", padding: "0 1rem 0 2.5rem", background: "var(--brand-input-bg)",
    border: "1px solid var(--brand-input-border)", borderRadius: "0.75rem", color: "var(--brand-text)",
    fontSize: "0.9375rem", fontFamily: "inherit", outline: "none",
};

function SegmentBar({ counts, total }) {
    const seg = (k) => (total ? (counts[k] / total) * 100 : 0);
    return (
        <div role="img" aria-label={`${counts.open} без изпит, ${counts.exam} с изпит, ${counts.closed} затворени`}
            style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--brand-surface-2)" }}>
            {["open", "exam", "closed"].map((k) => (
                <m.div key={k} initial={reduced ? false : { width: 0 }} animate={{ width: `${seg(k)}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ background: STATUS[k].color }} />
            ))}
        </div>
    );
}

function copyLink(onDone) {
    const url = window.location.href;
    const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = url; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); onDone(true); } catch { onDone(false); }
        document.body.removeChild(ta);
    };
    if (window.isSecureContext && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => onDone(true), fallback);
    } else fallback();
}

export default function DziPlanner({ specialties }) {
    const [params, setParams] = useSearchParams();
    const [chosen, setChosen] = useState([]);
    const [zdippk, setZdippk] = useState(params.get("zdippk") === "1");
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [copied, setCopied] = useState(false);
    const hydrated = useRef(false);

    // Хидратация от ?s=A|B — само имена, които реално съществуват.
    useEffect(() => {
        if (hydrated.current || !specialties.length) return;
        hydrated.current = true;
        const raw = (params.get("s") || "").split("|").map((s) => s.trim()).filter(Boolean).slice(0, MAX_CHOSEN);
        const lower = new Map(specialties.map((s) => [s.toLowerCase(), s]));
        const valid = [...new Set(raw.map((r) => lower.get(r.toLowerCase())).filter(Boolean))];
        if (valid.length) setChosen(valid);
    }, [specialties, params]);

    // Обратна посока: състояние → URL (споделяем линк).
    useEffect(() => {
        if (!hydrated.current) return;
        const next = new URLSearchParams(params);
        if (chosen.length) next.set("s", chosen.join("|")); else next.delete("s");
        if (zdippk) next.set("zdippk", "1"); else next.delete("zdippk");
        if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, [chosen, zdippk, params, setParams]);

    useEffect(() => {
        if (!chosen.length) { setRows([]); return undefined; }
        let alive = true;
        setLoading(true); setError(false);
        dziService.getPlanRows(chosen)
            .then((r) => { if (alive) setRows(r); })
            .catch(() => { if (alive) setError(true); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [chosen]);

    const plan = useMemo(() => (rows.length ? rankSecondDzi(rows, { zdippk }) : null), [rows, zdippk]);
    const total = rows.length;
    const best = plan?.candidates[0];
    const noEffect = plan && plan.candidates.every((c) => c.gain === 0);
    const visible = plan ? (showAll ? plan.candidates : plan.candidates.slice(0, 6)) : [];

    const tryAdd = (value) => {
        const exact = specialties.find((s) => s.toLowerCase() === value.trim().toLowerCase());
        if (!exact || chosen.includes(exact) || chosen.length >= MAX_CHOSEN) return;
        setChosen((c) => [...c, exact]);
        setQuery("");
        setExpanded(null);
    };
    const remove = (name) => { setChosen((c) => c.filter((x) => x !== name)); setExpanded(null); };

    return (
        <section aria-labelledby="dzi-planner-h" style={{ ...card, background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))", padding: "1.75rem", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Sparkles size={16} strokeWidth={1.5} style={{ color: "var(--brand-violet)" }} aria-hidden="true" />
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-violet)" }}>Обратен калкулатор</span>
            </div>
            <h2 id="dzi-planner-h" style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.375rem, 3vw, 1.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--brand-text)", textWrap: "balance" }}>
                Кой ДЗИ пази отворени <em style={{ fontStyle: "normal", color: "var(--brand-cyan)" }}>твоите</em> специалности
            </h2>
            <p style={{ margin: "0 0 1.25rem", fontSize: "14px", lineHeight: 1.6, color: "var(--brand-muted)", maxWidth: "62ch" }}>
                Добави до {MAX_CHOSEN} специалности, които ти харесват. За всеки възможен втори ДЗИ ще видиш колко от програмите
                остават отворени без кандидатстудентски изпит, колко — само с изпит, и колко се затварят.
            </p>

            <label htmlFor="dzi-plan-input" style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brand-muted)", marginBottom: "0.5rem" }}>
                Специалност
            </label>
            <div style={{ position: "relative", maxWidth: "30rem" }}>
                <Search size={16} aria-hidden="true" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-muted)", pointerEvents: "none" }} />
                <input
                    id="dzi-plan-input" list="dzi-plan-specialties" value={query} disabled={chosen.length >= MAX_CHOSEN}
                    onChange={(e) => { setQuery(e.target.value); tryAdd(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tryAdd(query); } }}
                    placeholder={chosen.length >= MAX_CHOSEN ? `Максимум ${MAX_CHOSEN} специалности` : "Напр. Информатика, Право, Медицина…"}
                    style={inputStyle}
                />
                <datalist id="dzi-plan-specialties">
                    {specialties.filter((s) => !chosen.includes(s)).map((s) => <option key={s} value={s} />)}
                </datalist>
            </div>

            {chosen.length > 0 && (
                <ul aria-label="Избрани специалности" style={{ listStyle: "none", margin: "0.875rem 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {chosen.map((name) => (
                        <li key={name} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", paddingLeft: "0.875rem", background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "999px", fontSize: "13px", fontWeight: 600, color: "var(--brand-text)" }}>
                            {name}
                            <button type="button" onClick={() => remove(name)} aria-label={`Премахни ${name}`}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "transparent", border: "none", color: "var(--brand-muted)", cursor: "pointer", borderRadius: "999px" }}>
                                <X size={14} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "1rem", fontSize: "13.5px", color: "var(--brand-text)", cursor: "pointer", minHeight: 44 }}>
                <input type="checkbox" checked={zdippk} onChange={(e) => setZdippk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--brand-cyan)" }} />
                Уча в професионална гимназия (вторият ми ДЗИ е ЗДИППК)
            </label>

            {/* Резултат */}
            {!chosen.length && (
                <p style={{ margin: "1.25rem 0 0", fontSize: "13.5px", color: "var(--brand-muted)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <AlertCircle size={15} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    Започни с 2–3 специалности. Колкото повече добавиш, толкова по-ясно се вижда кой ДЗИ е най-сигурният избор.
                </p>
            )}
            {loading && <p style={{ margin: "1.25rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>Смятаме по официалните формули…</p>}
            {error && !loading && (
                <p role="alert" style={{ margin: "1.25rem 0 0", fontSize: "13px", color: "#f87171" }}>
                    Не успяхме да заредим формулите. Провери връзката и опитай пак.
                </p>
            )}
            {!loading && !error && chosen.length > 0 && total === 0 && (
                <p style={{ margin: "1.25rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                    Не намерихме данни за тези специалности за прием {new Date().getFullYear()}. Може да ги добавим скоро.
                </p>
            )}

            {plan && best && !loading && (
                <m.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--brand-muted)" }}>
                            <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{chosen.length}</strong> специалности ·{" "}
                            <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{total}</strong> програми в университетите
                        </span>
                        <button type="button" onClick={() => copyLink((ok) => { setCopied(ok); setTimeout(() => setCopied(false), 2000); })}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", minHeight: 44, padding: "0 0.875rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: copied ? "#10b981" : "var(--brand-text)", fontSize: "12.5px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                            {copied ? <Check size={14} strokeWidth={1.5} aria-hidden="true" /> : <Share2 size={14} strokeWidth={1.5} aria-hidden="true" />}
                            {copied ? "Копирано" : "Копирай линк"}
                        </button>
                    </div>

                    {noEffect ? (
                        <div style={{ ...card, padding: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                            <AlertCircle size={18} strokeWidth={1.5} style={{ color: "#FBBF24", flexShrink: 0 }} aria-hidden="true" />
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--brand-text)" }}>
                                Изборът на втори ДЗИ не променя нищо за тези специалности:{" "}
                                {plan.baseline.counts.exam > 0 && <>{plan.baseline.counts.exam} от програмите искат кандидатстудентски изпит, </>}
                                {plan.baseline.counts.open > 0 && <>{plan.baseline.counts.open} са отворени само с БЕЛ и дипломни оценки, </>}
                                {plan.baseline.counts.closed > 0 && <>{plan.baseline.counts.closed} искат ДЗИ извън стандартния избор. </>}
                                Избери предмета, в който си най-силен.
                            </p>
                        </div>
                    ) : (
                        <div style={{ ...card, padding: "1.25rem 1.5rem", borderColor: "rgba(6,182,212,0.4)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-cyan)", marginBottom: "0.375rem" }}>Най-добър втори ДЗИ за теб</div>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.5rem 1rem" }}>
                                <span style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{best.label}</span>
                                <span style={{ fontSize: "14px", color: "var(--brand-text)" }}>
                                    <strong style={{ fontFamily: "monospace" }}>{best.counts.open}</strong> от {total} програми без изпит
                                    {best.gain > 0 && <span style={{ color: "#10b981", fontWeight: 700 }}> · +{best.gain} спрямо само БЕЛ</span>}
                                </span>
                            </div>
                        </div>
                    )}

                    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {visible.map((c, i) => {
                            const open = expanded === c.id;
                            return (
                                <li key={c.id} style={{ ...card, overflow: "hidden" }}>
                                    <button type="button" onClick={() => setExpanded(open ? null : c.id)} aria-expanded={open}
                                        style={{ width: "100%", display: "grid", gridTemplateColumns: "2rem 1fr auto", gap: "0.75rem", alignItems: "center", padding: "0.875rem 1rem", background: "transparent", border: "none", color: "var(--brand-text)", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                                        <span style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 800, color: i < 3 ? "var(--brand-cyan)" : "var(--brand-muted)" }}>{i + 1}</span>
                                        <span style={{ minWidth: 0 }}>
                                            <span style={{ display: "block", fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>{c.label}</span>
                                            <SegmentBar counts={c.counts} total={total} />
                                            <span style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem 0.75rem", marginTop: "0.375rem", fontSize: "11.5px", fontWeight: 600 }}>
                                                <span style={{ color: STATUS.open.color }}>{c.counts.open} без изпит</span>
                                                <span style={{ color: STATUS.exam.color }}>{c.counts.exam} с изпит</span>
                                                <span style={{ color: STATUS.closed.color }}>{c.counts.closed} затворени</span>
                                            </span>
                                        </span>
                                        <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--brand-muted)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {open && (
                                            <m.ul initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                                style={{ listStyle: "none", margin: 0, padding: "0 1rem 0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.375rem", overflow: "hidden" }}>
                                                {rows.map((r, idx) => {
                                                    const st = STATUS[c.statuses[idx]];
                                                    const q = new URLSearchParams({ specialty: r.specialty, university: r.university_name });
                                                    return (
                                                        <li key={`${r.specialty}-${r.university_name}`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", background: "var(--brand-surface-2)", borderRadius: "0.625rem", borderLeft: `3px solid ${st.color}` }}>
                                                            <span style={{ flex: 1, minWidth: 0, fontSize: "12.5px", lineHeight: 1.4 }}>
                                                                <strong style={{ color: "var(--brand-text)" }}>{r.specialty}</strong>
                                                                <span style={{ color: "var(--brand-muted)" }}> — {r.university_name}</span>
                                                            </span>
                                                            <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: st.color }}>{st.label}</span>
                                                            <Link to={`/calculator/?${q}`} aria-label={`Изчисли бал за ${r.specialty} в ${r.university_name}`} style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "0.5rem", color: "var(--brand-cyan)", textDecoration: "none" }}>
                                                                <CalcIcon size={15} strokeWidth={1.5} aria-hidden="true" />
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </m.ul>
                                        )}
                                    </AnimatePresence>
                                </li>
                            );
                        })}
                    </ol>

                    {plan.candidates.length > 6 && (
                        <button type="button" onClick={() => setShowAll((v) => !v)}
                            style={{ alignSelf: "center", minHeight: 44, padding: "0 1.25rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                            {showAll ? "Покажи само първите 6" : `Покажи всички ${plan.candidates.length} предмета`}
                        </button>
                    )}

                    <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.6, color: "var(--brand-muted)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <AlertCircle size={14} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                        „Без изпит“ значи, че балът се образува само от ДЗИ и дипломни оценки. Можеш да се явиш и на допълнителен ДЗИ по желание —
                        тогава комбинирай първите два предмета. Данните са по формулите за прием, публикувани от университетите.
                    </p>

                    <Link to={`/calculator/?specialty=${encodeURIComponent(chosen[0])}`} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.5rem", minHeight: 44, padding: "0 1.25rem", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", borderRadius: "0.75rem", color: "#fff", fontSize: "13.5px", fontWeight: 700, textDecoration: "none" }}>
                        Изчисли бала си за {chosen[0]} <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                </m.div>
            )}
        </section>
    );
}
