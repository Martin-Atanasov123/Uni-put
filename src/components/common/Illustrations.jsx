import { RIASEC_TYPES } from "@/lib/riasecTypes";

// Авторски геометрични илюстрации на UniПът (design.md, раздел 9).
// Един език навсякъде: точки (възли), пътища и разклонения. Само цветовете от
// токените — мастило, син акцент, мента за целта, пунктир за пътища без резултат.
// Всички са декоративни (aria-hidden) — смисълът винаги е в текста до тях.
// Изключение е InterestsHex: той носи информация и има текстов еквивалент.

const CSS = `
.il { display: block; width: 100%; height: auto; overflow: visible; }
.il-plane { fill: var(--surface-subtle); }
.il-card { fill: var(--surface); stroke: var(--border-strong); stroke-width: 1.5; }
.il-slot { fill: none; stroke: var(--border-strong); stroke-width: 1.5; stroke-dasharray: 5 5; }
.il-ink { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.il-brand { fill: none; stroke: var(--brand); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.il-muted { fill: none; stroke: var(--border-strong); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 2 7; }
.il-node { fill: var(--surface); stroke: var(--ink); stroke-width: 2.5; }
.il-node--brand { stroke: var(--brand); }
.il-node--open { fill: var(--surface); stroke: var(--border-strong); stroke-width: 2; stroke-dasharray: 3 4; }
.il-dot { fill: var(--ink); }
.il-dot--brand { fill: var(--brand); }
.il-goal { fill: var(--signal); stroke: var(--ink); stroke-width: 2.5; }
.il-line { fill: none; stroke: var(--border-strong); stroke-width: 1.5; stroke-linecap: round; }
/* Еднократно „изчертаване“ на основния път при появяване */
.il-draw { stroke-dasharray: 240; stroke-dashoffset: 240; animation: il-draw 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; }
@keyframes il-draw { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .il-draw { animation: none; stroke-dashoffset: 0; } }

.es { display: grid; justify-items: center; gap: 4px; padding: clamp(32px, 6vw, 56px) 16px; text-align: center; }
.es__art { width: min(240px, 70%); margin-bottom: 16px; }
.es h3 { margin: 0; font-size: clamp(19px, 2vw, 22px); font-weight: 700; line-height: 1.3; text-wrap: balance; color: var(--ink); }
.es p { margin: 6px 0 0; max-width: 46ch; font-size: 15px; line-height: 1.55; color: var(--ink-muted); }
.es__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 18px; }
.es-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 48px; padding: 0 20px; border-radius: var(--radius-control); font: inherit; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease; }
.es-btn--primary { background: var(--brand); color: var(--on-brand); border: 1px solid var(--brand); }
.es-btn--primary:hover { background: var(--brand-hover); border-color: var(--brand-hover); color: var(--on-brand); }
.es-btn--ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--border-strong); }
.es-btn--ghost:hover { border-color: var(--ink); color: var(--ink); }
`;

export function IllustrationStyles() {
    return <style>{CSS}</style>;
}

/** Търсене без резултат: пътят се разклонява, но нито едно разклонение не стига до цел. */
export function NoMatchArt() {
    return (
        <svg className="il" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
            <rect className="il-plane" x="20" y="18" width="200" height="114" rx="20" />
            <path className="il-ink il-draw" d="M44 75 H104" />
            <path className="il-muted" d="M104 75 C134 75 140 40 176 40" />
            <path className="il-muted" d="M104 75 H182" />
            <path className="il-muted" d="M104 75 C134 75 140 110 176 110" />
            <circle className="il-node" cx="44" cy="75" r="8" />
            <circle className="il-dot" cx="104" cy="75" r="5" />
            <circle className="il-node--open" cx="184" cy="40" r="8" />
            <circle className="il-node--open" cx="190" cy="75" r="8" />
            <circle className="il-node--open" cx="184" cy="110" r="8" />
        </svg>
    );
}

/** Празен списък: три празни места; пътят води към първото. */
export function EmptyShortlistArt() {
    return (
        <svg className="il" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
            <rect className="il-plane" x="20" y="14" width="200" height="122" rx="20" />
            <rect className="il-slot" x="104" y="30" width="96" height="24" rx="8" />
            <rect className="il-slot" x="104" y="63" width="96" height="24" rx="8" />
            <rect className="il-slot" x="104" y="96" width="96" height="24" rx="8" />
            <path className="il-brand il-draw" d="M42 108 C66 108 62 42 92 42" />
            <circle className="il-node" cx="42" cy="108" r="8" />
            <circle className="il-goal" cx="104" cy="42" r="7" />
            <path className="il-line" d="M118 42 H160 M118 75 H150 M118 108 H156" />
        </svg>
    );
}

/** 404: пътят прекъсва; целта е по-нататък, но връзката липсва. */
export function BrokenPathArt() {
    return (
        <svg className="il" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
            <path className="il-ink il-draw" d="M30 80 C60 80 64 50 96 50" />
            <path className="il-muted" d="M108 50 H140" />
            <path className="il-ink" d="M152 50 C176 50 182 34 210 34" />
            <circle className="il-node" cx="30" cy="80" r="8" />
            <circle className="il-dot" cx="96" cy="50" r="5" />
            <circle className="il-dot" cx="152" cy="50" r="5" />
            <circle className="il-goal" cx="210" cy="34" r="10" />
        </svg>
    );
}

/** Празно състояние: илюстрация, заглавие, кратък текст и до две действия. */
export function EmptyState({ art, title, children, actions, as: Tag = "section", headingLevel = 3 }) {
    const H = `h${headingLevel}`;
    return (
        <Tag className="es">
            <IllustrationStyles />
            {art && <div className="es__art">{art}</div>}
            <H>{title}</H>
            {children && <p>{children}</p>}
            {actions && <div className="es__actions">{actions}</div>}
        </Tag>
    );
}

// ── Шестте типа интереси (модел на Холанд) ──────────────────────────────────
// Информативна диаграма: в модела съседните типове са по-близки, срещуположните —
// най-различни. Текстовият списък до нея казва същото с думи.


export function InterestsHex() {
    const cx = 120, cy = 112, r = 78;
    const pts = RIASEC_TYPES.map((t, i) => {
        const a = (-90 + i * 60) * (Math.PI / 180);
        return { ...t, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    const ring = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return (
        <svg className="il" viewBox="0 0 240 224" aria-hidden="true" focusable="false">
            <polygon points={ring} className="il-plane" />
            <polygon points={ring} className="il-ink" style={{ strokeWidth: 2 }} />
            {pts.map((p, i) => {
                const q = pts[(i + 3) % 6];
                return i < 3 ? <line key={p.code} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className="il-muted" /> : null;
            })}
            {pts.map((p) => (
                <g key={p.code}>
                    <circle cx={p.x} cy={p.y} r="17" className="il-node" />
                    <text x={p.x} y={p.y} dy="0.36em" textAnchor="middle" style={{ fontSize: 15, fontWeight: 800, fill: "var(--ink)" }}>{p.code}</text>
                </g>
            ))}
        </svg>
    );
}

// ── Илюстрация до заглавието на страница ─────────────────────────────────────
// Контейнерът получава className="pg-head"; от 1000 px нагоре става две колони:
// текстът вляво, картината вдясно. На телефон картината се крие — данните са първи.
// rows = броят на останалите деца в контейнера (за да не се добавят празни редове).
const PAGE_ART_CSS = `
.pg-art { display: none; width: 100%; height: auto; }
@media (min-width: 1000px) {
  .pg-head { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 300px); column-gap: 48px; align-items: start; align-content: start; }
  /* Излишната височина от картината отива в последния текстов ред, не между заглавието и текста */
  .pg-head:has(> .pg-art[data-rows="2"]) { grid-template-rows: auto 1fr; }
  .pg-head:has(> .pg-art[data-rows="3"]) { grid-template-rows: auto auto 1fr; }
  .pg-head > * { grid-column: 1; }
  .pg-head > .pg-art { display: block; grid-column: 2; justify-self: end; align-self: center; animation: pg-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
}
.pg-art--center { display: block; width: min(420px, 86%); margin: 1rem auto 0; }
@keyframes pg-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .pg-head > .pg-art { animation: none; } }
`;

export function PageArt({ name, width = 960, height, rows = 3, center = false }) {
    return (
        <>
            <style>{PAGE_ART_CSS}</style>
            <img
                className={center ? "pg-art pg-art--center" : "pg-art"}
                src={`/illustrations/${name}-960.webp`}
                srcSet={`/illustrations/${name}-480.webp 480w, /illustrations/${name}-960.webp 960w`}
                sizes={center ? "420px" : "(min-width: 1000px) 340px, 0px"}
                width={width}
                height={height}
                alt=""
                decoding="async"
                data-rows={rows}
                style={center ? undefined : { gridRow: `1 / span ${rows}` }}
            />
        </>
    );
}
