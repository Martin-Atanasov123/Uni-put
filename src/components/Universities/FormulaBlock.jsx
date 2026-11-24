import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { summarizeFormula, termToText, formatCoef } from "@/lib/formulaSummary";
import { useIsMobile } from "@/hooks/useIsMobile";

// Формулата на една програма: кратко представяне + точната формула.
// Кратко представяне има само при проверена структура (lib/formulaSummary);
// иначе се показва оригиналният текст, както досега.
export default function FormulaBlock({ program }) {
    const mobile = useIsMobile();
    const summary = useMemo(() => summarizeFormula(program), [program]);
    const exact = program.formula_description;
    if (!exact) return null;

    if (!summary.ok) {
        return (
            <div className="fx fx--raw">
                <style>{CSS}</style>
                <strong>Формула:</strong> {exact}
            </div>
        );
    }

    return (
        <div className="fx">
            <style>{CSS}</style>
            <p className="fx__h">Как се смята балът</p>
            <ol className="fx__terms">
                {summary.terms.map((t, i) => (
                    <li key={i} aria-label={termToText(t)}>
                        {t.groups.map((g, j) => (
                            <span key={j} className="fx__grp" aria-hidden="true">
                                {j > 0 && <span className="fx__or">или</span>}
                                <span className="fx__coef">{formatCoef(g.coef)}×</span>
                                <span className="fx__what">
                                    {g.items.length === 1 ? g.items[0] : <>най-високата оценка от {g.items.join(", ")}</>}
                                </span>
                            </span>
                        ))}
                    </li>
                ))}
            </ol>
            {mobile ? (
                <details className="fx__exact">
                    <summary>Точна формула <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" /></summary>
                    <code>{exact}</code>
                </details>
            ) : (
                <p className="fx__exact-inline"><span>Точна формула:</span> <code>{exact}</code></p>
            )}
        </div>
    );
}

const CSS = `
.fx { margin-top: 0.75rem; padding: 0.75rem 0.875rem; background: color-mix(in srgb, var(--brand) 6%, transparent); border: 1px solid color-mix(in srgb, var(--brand) 18%, transparent); border-radius: 0.625rem; font-size: 13px; line-height: 1.5; color: var(--ink-muted); overflow-wrap: anywhere; }
.fx--raw strong { color: var(--ink); }
.fx__h { margin: 0 0 6px; font-size: 12px; font-weight: 750; color: var(--ink); }
.fx__terms { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.fx__terms li { display: grid; gap: 2px; }
.fx__terms li + li { padding-top: 6px; border-top: 1px dashed color-mix(in srgb, var(--brand) 20%, transparent); }
.fx__grp { display: grid; grid-template-columns: 3.25rem minmax(0, 1fr); align-items: baseline; column-gap: 8px; }
.fx__or { grid-column: 1 / -1; font-size: 12px; font-weight: 650; color: var(--ink-muted); }
.fx__coef { font-variant-numeric: tabular-nums; font-weight: 800; color: var(--ink); text-align: right; }
.fx__what { color: var(--ink); }
.fx__exact { margin-top: 8px; }
.fx__exact summary { list-style: none; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-weight: 650; color: var(--brand); cursor: pointer; }
.fx__exact summary::-webkit-details-marker { display: none; }
.fx__exact[open] summary svg { transform: rotate(180deg); }
.fx__exact summary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
.fx__exact code, .fx__exact-inline code { font-family: inherit; font-size: 12.5px; color: var(--ink-muted); }
.fx__exact-inline { margin: 8px 0 0; padding-top: 6px; border-top: 1px solid color-mix(in srgb, var(--brand) 15%, transparent); }
.fx__exact-inline span { font-weight: 650; color: var(--ink); }
`;
