import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { summarizeResults } from "@/lib/calcSummary";

// Долна лента на телефон: обобщение на резултатите, докато ученикът въвежда оценки.
// Само чете готовите calcResults — не смята нищо само.
//  • непълен бал никога не се показва като число;
//  • при няколко университета не показва бал за един от тях, а броя с пълен бал;
//  • скрива се, докато поле е на фокус и когато самите резултати са на екрана,
//    а страницата получава долен отстъп колкото лентата — нищо не остава закрито.

const bg = n => (n === 1 ? "оценка" : "оценки");

export default function CalcScoreBar({ results, targetId, active }) {
    const mobile = useIsMobile();
    const [focusInside, setFocusInside] = useState(false);
    const [resultsVisible, setResultsVisible] = useState(false);
    const barRef = useRef(null);

    // Поле на фокус → лентата се скрива (клавиатурата и полето имат приоритет).
    useEffect(() => {
        if (!mobile) return;
        const isField = el => el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
        const on = () => setFocusInside(isField(document.activeElement));
        const off = () => setTimeout(on, 0);
        document.addEventListener("focusin", on);
        document.addEventListener("focusout", off);
        return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
    }, [mobile]);

    // Резултатите на екрана → лентата не е нужна и не закрива бутоните им.
    useEffect(() => {
        if (!mobile || !active) return;
        const el = document.getElementById(targetId);
        if (!el || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [mobile, active, targetId, results.length]);

    const show = mobile && active && results.length > 0;
    const hidden = !show || focusInside || resultsVisible;

    // Долен отстъп колкото лентата, докато тя съществува.
    useEffect(() => {
        if (!show) return;
        const h = barRef.current?.offsetHeight || 72;
        const root = document.documentElement;
        const prev = root.style.scrollPaddingBottom;
        root.style.setProperty("--calc-bar-h", `${h}px`);
        root.style.scrollPaddingBottom = `${h + 12}px`;
        return () => { root.style.removeProperty("--calc-bar-h"); root.style.scrollPaddingBottom = prev; };
    }, [show]);

    if (!show) return null;
    const s = summarizeResults(results);
    const goToResults = () => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });

    let main, sub;
    if (s.complete === 0) {
        main = `Още ${s.fewestMissing} ${bg(s.fewestMissing)} до пълен бал`;
        sub = s.total > 1 ? `За най-близкия от ${s.total} университета` : "Балът ще се покаже, когато въведеш всички";
    } else if (s.single) {
        main = `${s.single.formatted}${s.single.maxBall ? ` от ${s.single.maxBall}` : ""}`;
        sub = s.single.item.university_name;
    } else {
        main = `Пълен бал: ${s.complete} от ${s.total} университета`;
        sub = s.complete < s.total ? "Другите чакат оценки" : "Виж бала за всеки поотделно";
    }

    return (
        <div ref={barRef} className={`csb${hidden ? " csb--hidden" : ""}`} aria-hidden={hidden || undefined}>
            <style>{CSS}</style>
            <div className="csb__text" role="status" aria-live="polite">
                <span className={`csb__main${s.single && s.complete ? " csb__main--score" : ""}`}>{main}</span>
                <span className="csb__sub">{sub}</span>
            </div>
            <button type="button" className="csb__btn" onClick={goToResults} tabIndex={hidden ? -1 : 0}>
                {s.total > 1 ? "Резултати" : "Към резултата"} <ArrowDown size={16} strokeWidth={2} aria-hidden="true" />
            </button>
        </div>
    );
}

const CSS = `
.csb { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: flex; align-items: center; gap: 12px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 1px solid var(--border); box-shadow: 0 -8px 24px color-mix(in srgb, var(--ink) 8%, transparent); transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease; }
.csb--hidden { transform: translateY(110%); opacity: 0; pointer-events: none; }
.csb__text { flex: 1; min-width: 0; display: grid; gap: 1px; }
.csb__main { font-size: 15px; font-weight: 750; color: var(--ink); line-height: 1.3; }
.csb__main--score { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.csb__sub { font-size: 13px; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.csb__btn { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 48px; padding: 0 16px; border: 0; border-radius: var(--radius-control); background: var(--brand); color: var(--on-brand); font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.csb__btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .csb { transition: none; } }
`;
