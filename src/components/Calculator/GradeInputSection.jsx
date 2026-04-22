import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ArrowUpDown } from "lucide-react";
import { FIELD_LABELS, SLOT_GROUPS } from "@/lib/coefficients_config";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_PREFIX = "uniput_grades";

function getStorageKey(faculty, specialty) {
    return `${STORAGE_PREFIX}:${faculty || "all"}:${specialty || "all"}`;
}

function clampAndFormat(value) {
    if (value === "" || value == null) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toFixed(2);
}

function isValidGrade(value) {
    if (value === "" || value == null) return true;
    const n = Number(value);
    return !Number.isNaN(n) && n >= 2 && n <= 6;
}

function rankAltLabel(label) {
    const t = String(label || "");
    if (/^ДЗИ\s/.test(t)) return 0;
    if (/^ДЗИ[¹²]/.test(t)) return 1;
    if (t.startsWith("Изпит")) return 2;
    if (t.startsWith("Диплома:")) return 3;
    return 4;
}

function compareAlternatives(a, b) {
    const diff = rankAltLabel(a.label) - rankAltLabel(b.label);
    return diff !== 0 ? diff : a.label.length - b.label.length;
}

function buildSlots(coefficients) {
    const map = {};
    Object.keys(coefficients || {}).forEach(key => {
        const label = FIELD_LABELS[key] || key;
        let slotId = key;
        for (const [group, members] of Object.entries(SLOT_GROUPS)) {
            if (members.includes(key)) { slotId = group; break; }
        }
        if (!map[slotId]) map[slotId] = { id: slotId, alternatives: [] };
        map[slotId].alternatives.push({ key, label });
    });
    return Object.values(map).map(slot => {
        const alternatives = [...slot.alternatives].sort(compareAlternatives);
        return { ...slot, label: alternatives[0]?.label || slot.id, alternatives };
    });
}

export default function GradeInputSection({ coefficients = {}, faculty, specialty, onGradesChange }) {
    const { user } = useAuth();
    const [valuesByKey, setValuesByKey] = useState({});
    const [activeAltBySlot, setActiveAltBySlot] = useState({});
    const [saving, setSaving] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    const slots = useMemo(() => buildSlots(coefficients), [coefficients]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(getStorageKey(faculty, specialty));
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.valuesByKey) setValuesByKey(parsed.valuesByKey);
            if (parsed.activeAltBySlot) setActiveAltBySlot(parsed.activeAltBySlot);
        } catch {}
    }, [faculty, specialty]);

    useEffect(() => {
        try { localStorage.setItem(getStorageKey(faculty, specialty), JSON.stringify({ valuesByKey, activeAltBySlot })); } catch {}
    }, [valuesByKey, activeAltBySlot, faculty, specialty]);

    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    const lastSavedRef = useRef("");
    useEffect(() => {
        if (!userRef.current) return;
        const payload = { valuesByKey, activeAltBySlot };
        const key = `${faculty || "all"}:${specialty || "all"}:${JSON.stringify(payload)}`;
        if (lastSavedRef.current === key) return;
        lastSavedRef.current = key;
        (async () => {
            setSaving(true);
            try {
                const existing = userRef.current.user_metadata?.grade_inputs || {};
                await supabase.auth.updateUser({ data: { grade_inputs: { ...existing, [getStorageKey(faculty, specialty)]: payload } } });
            } finally { setSaving(false); }
        })();
    }, [valuesByKey, activeAltBySlot, faculty, specialty]);

    useEffect(() => {
        if (onGradesChange) onGradesChange(valuesByKey, activeAltBySlot);
    }, [valuesByKey, activeAltBySlot, onGradesChange]);

    useEffect(() => {
        const close = () => setOpenDropdown(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const handleChangeGrade = (key, value) => setValuesByKey(prev => ({ ...prev, [key]: value.replace(",", ".") }));
    const handleBlurGrade = key => setValuesByKey(prev => ({ ...prev, [key]: clampAndFormat(prev[key]) }));
    const handleChangeActiveAlt = (slotId, altKey) => setActiveAltBySlot(prev => ({ ...prev, [slotId]: altKey }));

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={16} style={{ color: "var(--brand-cyan)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Входни данни
                    </span>
                </div>
                {saving && (
                    <span style={{ fontSize: "11px", color: "var(--brand-muted)", opacity: 0.6 }}>Записване...</span>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0.875rem" }}>
                {slots.map(slot => {
                    const activeKey = activeAltBySlot[slot.id] || slot.alternatives[0]?.key;
                    const activeAlt = slot.alternatives.find(a => a.key === activeKey) || slot.alternatives[0];
                    const value = valuesByKey[activeAlt.key] ?? "";
                    const invalid = !isValidGrade(value);
                    const hasMultiple = slot.alternatives.length > 1;
                    const isOpen = openDropdown === slot.id;

                    let bestAlt = null;
                    let bestProduct = -Infinity;
                    slot.alternatives.forEach(alt => {
                        const v = parseFloat(valuesByKey[alt.key]);
                        if (!Number.isNaN(v) && v >= 2 && v <= 6) {
                            const product = v * (Number(coefficients[alt.key]) || 1);
                            if (product > bestProduct) { bestProduct = product; bestAlt = { ...alt, grade: v }; }
                        }
                    });

                    return (
                        <div
                            key={slot.id}
                            style={{
                                background: "var(--brand-input-bg)",
                                border: `1px solid ${invalid && value !== "" ? "rgba(248,113,113,0.4)" : "var(--brand-border)"}`,
                                borderRadius: "0.875rem",
                                padding: "1rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.625rem",
                                transition: "border-color 0.2s",
                            }}
                        >
                            {/* Label + switcher */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.4, flex: 1 }}>
                                    {activeAlt?.label || slot.label}
                                </span>
                                {hasMultiple && (
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : slot.id); }}
                                            style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                                        >
                                            <ArrowUpDown size={10} /> Смени
                                        </button>
                                        {isOpen && (
                                            <div
                                                onClick={e => e.stopPropagation()}
                                                style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--brand-dropdown-bg)", border: "1px solid var(--brand-card-border)", borderRadius: "0.625rem", minWidth: "12rem", zIndex: 30, boxShadow: "0 16px 40px var(--brand-shadow)", overflow: "hidden" }}
                                            >
                                                {slot.alternatives.map(alt => (
                                                    <button
                                                        key={alt.key}
                                                        type="button"
                                                        onClick={() => { handleChangeActiveAlt(slot.id, alt.key); setOpenDropdown(null); }}
                                                        style={{ width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "12px", fontWeight: activeKey === alt.key ? 700 : 500, color: activeKey === alt.key ? "var(--brand-cyan)" : "var(--brand-text)", background: activeKey === alt.key ? "rgba(6,182,212,0.08)" : "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                                                        onMouseEnter={e => { if (activeKey !== alt.key) e.currentTarget.style.background = "rgba(148,163,184,0.06)"; }}
                                                        onMouseLeave={e => { if (activeKey !== alt.key) e.currentTarget.style.background = "none"; }}
                                                    >
                                                        {alt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={value}
                                onChange={e => handleChangeGrade(activeAlt.key, e.target.value)}
                                onBlur={() => handleBlurGrade(activeAlt.key)}
                                onFocus={e => { e.target.style.borderColor = invalid ? "rgba(248,113,113,0.5)" : "rgba(6,182,212,0.5)"; e.target.style.boxShadow = invalid ? "0 0 0 3px rgba(248,113,113,0.08)" : "0 0 0 3px rgba(6,182,212,0.08)"; }}
                                onBlurCapture={e => { e.target.style.borderColor = invalid && value !== "" ? "rgba(248,113,113,0.4)" : "var(--brand-input-border)"; e.target.style.boxShadow = "none"; }}
                                style={{ width: "100%", height: "2.75rem", padding: "0 0.875rem", background: "var(--brand-input-bg)", border: `1px solid ${invalid && value !== "" ? "rgba(248,113,113,0.4)" : "var(--brand-input-border)"}`, borderRadius: "0.625rem", color: "var(--brand-text)", fontSize: "18px", fontWeight: 700, fontFamily: "monospace", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" }}
                            />

                            {/* Hint */}
                            <div style={{ fontSize: "11px", color: "var(--brand-muted)", minHeight: "1rem" }}>
                                {invalid && value !== "" ? (
                                    <span style={{ color: "#f87171" }}>Оценка между 2.00 и 6.00</span>
                                ) : bestAlt ? (
                                    <span>Най-добра: <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{bestAlt.grade.toFixed(2)}</strong> <span style={{ opacity: 0.6 }}>({bestAlt.label})</span></span>
                                ) : (
                                    <span style={{ opacity: 0.5 }}>Въведи оценка</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
