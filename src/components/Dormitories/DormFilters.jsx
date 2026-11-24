import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DISTANCE_OPTIONS, SORT_OPTIONS, citiesOf, universitiesOf, activeCount } from "@/lib/dormFilters";

// Филтри за общежитията: на настолен — ред над списъка, на телефон — бутон,
// който отваря панел отдолу („Покажи N“). Подредбата по наем е винаги видима.
export default function DormFilters({ dorms, filters, onChange, onReset, shown, total, rentCount, previewCount }) {
    const mobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(filters);
    const openBtn = useRef(null);
    const sheetRef = useRef(null);
    const cities = citiesOf(dorms);
    const active = activeCount(filters);

    // При отваряне панелът започва от текущите филтри; фокусът влиза в панела,
    // Escape затваря, а при затваряне фокусът се връща на бутона.
    useEffect(() => {
        if (!open) return;
        const opener = openBtn.current;
        setDraft(filters);
        const first = sheetRef.current?.querySelector("select, button");
        first?.focus();
        const onKey = e => {
            if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
            if (e.key === "Tab" && sheetRef.current) {
                const f = [...sheetRef.current.querySelectorAll("select, button:not([disabled])")];
                if (!f.length) return;
                if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
            }
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; opener?.focus(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fields = (f, set) => {
        const unis = universitiesOf(dorms, f.city);
        return (
            <>
                <label className="df-field">
                    <span>Град</span>
                    <select value={f.city} onChange={e => set({ city: e.target.value, uni: universitiesOf(dorms, e.target.value).includes(f.uni) ? f.uni : "" })}>
                        <option value="">Всички градове</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </label>
                <label className="df-field df-field--wide">
                    <span>Университет</span>
                    <select value={f.uni} onChange={e => set({ uni: e.target.value })}>
                        <option value="">Всички университети</option>
                        {unis.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </label>
                <fieldset className="df-seg">
                    <legend>Разстояние до университета</legend>
                    <div>
                        {DISTANCE_OPTIONS.map(o => (
                            <label key={o.value || "all"} className={f.km === o.value ? "is-on" : ""}>
                                <input type="radio" name={mobile ? "df-km-m" : "df-km"} value={o.value} checked={f.km === o.value} onChange={() => set({ km: o.value })} />
                                {o.label}
                            </label>
                        ))}
                    </div>
                </fieldset>
            </>
        );
    };

    const sortSelect = (
        <label className="df-field df-sort">
            <span>Подреди</span>
            <select value={filters.sort} onChange={e => onChange({ sort: e.target.value })}>
                {SORT_OPTIONS.map(o => <option key={o.value || "def"} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );

    const count = <p className="df-count" aria-live="polite">{shown === total ? `${total} общежития` : `${shown} от ${total} общежития`}{filters.sort === "rent" && <> · наем е посочен за {rentCount} от {total}</>}</p>;

    return (
        <div className="df">
            <style>{CSS}</style>
            {mobile ? (
                <>
                    <div className="df-mbar">
                        <button ref={openBtn} type="button" className="df-open" onClick={() => setOpen(true)} aria-haspopup="dialog">
                            <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                            Филтри{active > 0 && <span className="df-badge">{active}</span>}
                        </button>
                        {sortSelect}
                    </div>
                    {count}
                    {open && (
                        <div className="df-overlay" onClick={() => setOpen(false)}>
                            <div ref={sheetRef} className="df-sheet" role="dialog" aria-modal="true" aria-labelledby="df-title" onClick={e => e.stopPropagation()}>
                                <div className="df-sheet__head">
                                    <h2 id="df-title">Филтри</h2>
                                    <button type="button" className="df-x" onClick={() => setOpen(false)} aria-label="Затвори филтрите"><X size={20} aria-hidden="true" /></button>
                                </div>
                                <div className="df-sheet__body">{fields(draft, patch => setDraft(d => ({ ...d, ...patch })))}</div>
                                <div className="df-sheet__foot">
                                    <button type="button" className="df-ghost" onClick={() => setDraft(d => ({ ...d, city: "", uni: "", km: "" }))}>Изчисти</button>
                                    <button type="button" className="df-apply" onClick={() => { onChange({ city: draft.city, uni: draft.uni, km: draft.km }); setOpen(false); }}>
                                        Покажи {previewCount(draft)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="df-bar">
                        {fields(filters, onChange)}
                        {sortSelect}
                        {active > 0 && <button type="button" className="df-ghost df-reset" onClick={onReset}><X size={14} aria-hidden="true" /> Изчисти</button>}
                    </div>
                    {count}
                </>
            )}
        </div>
    );
}

const CSS = `
.df { color: var(--ink); }
.df-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 16px; padding: 1rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; }
.df-field { display: grid; gap: 4px; min-width: 150px; }
.df-field--wide { flex: 1; min-width: 220px; }
.df-field > span, .df-seg legend { font-size: 12px; font-weight: 700; color: var(--ink-muted); }
.df-field select { min-height: 44px; padding: 0 12px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--canvas); color: var(--ink); font: inherit; font-size: 15px; max-width: 100%; }
.df-field select:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.df-seg { margin: 0; padding: 0; border: 0; min-width: 0; }
.df-seg legend { padding: 0; margin-bottom: 4px; }
.df-seg > div { display: inline-flex; border: 1px solid var(--border-strong); border-radius: var(--radius-control); overflow: hidden; }
.df-seg label { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; font-size: 14px; font-weight: 650; cursor: pointer; border-right: 1px solid var(--border-strong); background: var(--canvas); }
.df-seg label:last-child { border-right: 0; }
.df-seg label.is-on { background: var(--ink); color: var(--canvas); }
.df-seg input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.df-seg label:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: -3px; }
.df-ghost { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: transparent; color: var(--ink); font: inherit; font-weight: 650; cursor: pointer; }
.df-count { margin: 10px 2px 0; font-size: 14px; color: var(--ink-muted); }
.df-mbar { display: flex; align-items: flex-end; gap: 10px; }
.df-open { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--ink); font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.df-open:focus-visible, .df-apply:focus-visible, .df-ghost:focus-visible, .df-x:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.df-badge { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: var(--brand); color: var(--on-brand); font-size: 12px; font-weight: 800; }
.df-mbar .df-sort { flex: 1; min-width: 0; }
.df-mbar .df-sort select { width: 100%; min-height: 48px; font-size: 16px; }
.df-overlay { position: fixed; inset: 0; z-index: 120; background: color-mix(in srgb, var(--ink) 45%, transparent); display: flex; align-items: flex-end; }
.df-sheet { width: 100%; max-height: 88vh; display: flex; flex-direction: column; background: var(--canvas); border-radius: 20px 20px 0 0; animation: df-up 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes df-up { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.df-sheet__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 8px 4px 16px; }
.df-sheet__head h2 { margin: 0; font-size: 18px; font-weight: 750; }
.df-x { display: grid; place-items: center; width: 44px; height: 44px; border: 0; background: none; color: var(--ink); cursor: pointer; border-radius: 10px; }
.df-sheet__body { overflow-y: auto; padding: 8px 16px 16px; display: grid; gap: 16px; }
.df-sheet__body .df-field select { width: 100%; min-height: 48px; font-size: 16px; }
.df-sheet__body .df-seg > div { display: flex; }
.df-sheet__body .df-seg label { flex: 1; justify-content: center; min-height: 48px; }
.df-sheet__foot { display: flex; gap: 10px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); }
.df-apply { flex: 1; min-height: 52px; border: 0; border-radius: var(--radius-control); background: var(--brand); color: var(--on-brand); font: inherit; font-size: 16px; font-weight: 750; cursor: pointer; }
.df-sheet__foot .df-ghost { min-height: 52px; }
@media (prefers-reduced-motion: reduce) { .df-sheet { animation: none; } }
`;
