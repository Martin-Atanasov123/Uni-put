import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

// Общ шаблон за вход и регистрация в новия дизайн.
// Широк екран: вляво панел с картина и какво пази профилът, вдясно формата.
// Телефон: само формата — без нищо преди нея.

const CSS = `
.au { min-height: 100vh; padding: 104px 0 56px; background: var(--canvas); color: var(--ink); }
.au__grid { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 64px); box-sizing: border-box; display: grid; gap: 24px; align-items: stretch; }
@media (min-width: 960px) {
  .au { padding: 112px 0 64px; }
  .au__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 460px); gap: 32px; }
  .au__grid--single { grid-template-columns: minmax(0, 460px); justify-content: center; }
}

/* Панел вляво */
.au-aside { display: none; }
@media (min-width: 960px) {
  .au-aside { display: flex; flex-direction: column; justify-content: space-between; gap: 32px; padding: 40px; border-radius: var(--radius-feature); background: var(--surface-subtle); border: 1px solid var(--border); }
}
.au-aside__eyebrow { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); }
.au-aside h2 { margin: 0; font-family: var(--font-display); font-size: clamp(28px, 2.6vw, 36px); font-weight: 800; line-height: 1.12; letter-spacing: -0.03em; text-wrap: balance; }
.au-aside__art { display: block; width: min(420px, 100%); height: auto; margin: 0 auto; }
.au-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.au-list li { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; align-items: start; }
.au-list img { width: 44px; height: 44px; object-fit: contain; }
.au-list b { display: block; font-size: 16px; line-height: 1.35; }
.au-list span { display: block; margin-top: 2px; font-size: 15px; line-height: 1.5; color: var(--ink-muted); }

/* Формата */
.au-card { align-self: center; width: 100%; max-width: 460px; margin: 0 auto; padding: clamp(24px, 4vw, 40px); border-radius: var(--radius-feature); background: var(--surface); border: 1px solid var(--border); animation: au-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes au-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.au-card h1 { margin: 0; font-family: var(--font-display); font-size: clamp(28px, 3vw, 34px); font-weight: 800; line-height: 1.12; letter-spacing: -0.03em; text-wrap: balance; }
.au-card__lead { margin: 10px 0 0; font-size: 16px; line-height: 1.55; color: var(--ink-muted); max-width: 40ch; }
.au-card__body { margin-top: 28px; }

.au-alert { display: flex; align-items: flex-start; gap: 10px; margin: 0 0 20px; padding: 12px 14px; border-radius: var(--radius-control); font-size: 15px; line-height: 1.45; font-weight: 600; }
.au-alert svg { flex-shrink: 0; margin-top: 2px; }
.au-alert--error { color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, transparent); border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent); }
.au-alert--ok { color: var(--success); background: color-mix(in srgb, var(--success) 8%, transparent); border: 1px solid color-mix(in srgb, var(--success) 30%, transparent); }

.au-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 52px; padding: 0 20px; border-radius: var(--radius-control); font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
.au-btn:hover:not(:disabled) { transform: translateY(-1px); }
.au-btn:active:not(:disabled) { transform: translateY(0); }
.au-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.au-btn--primary { background: var(--brand); color: var(--on-brand); border: 1px solid var(--brand); }
.au-btn--primary:hover:not(:disabled) { background: var(--brand-hover); border-color: var(--brand-hover); }
.au-btn--google { background: var(--surface); color: var(--ink); border: 1px solid var(--border-strong); }
.au-btn--google:hover:not(:disabled) { border-color: var(--ink); }
.au-btn--ghost { background: transparent; color: var(--ink); border: 1px solid var(--border-strong); text-decoration: none; }
.au-btn--ghost:hover { border-color: var(--ink); }
.au-spin { animation: au-spin 1s linear infinite; }
@keyframes au-spin { to { transform: rotate(360deg); } }

.au-div { display: flex; align-items: center; gap: 12px; margin: 22px 0; font-size: 14px; color: var(--ink-muted); }
.au-div::before, .au-div::after { content: ""; flex: 1; height: 1px; background: var(--border); }

.au-form { display: grid; gap: 18px; }
.au-field { display: grid; gap: 8px; }
.au-field__label { font-size: 15px; font-weight: 700; color: var(--ink); }
.au-field__box { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 6px 0 14px; border-radius: var(--radius-control); background: var(--surface); border: 1px solid var(--border-strong); transition: border-color 0.15s ease, box-shadow 0.15s ease; }
.au-field__box:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.au-field__box > svg { flex-shrink: 0; color: var(--ink-muted); }
.au-field input { flex: 1; min-width: 0; height: 50px; padding: 0 8px 0 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: 16px; }
.au-field input::placeholder { color: var(--ink-muted); opacity: 0.8; }
.au-eye { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: 8px; background: transparent; color: var(--ink-muted); cursor: pointer; transition: color 0.15s ease, background-color 0.15s ease; }
.au-eye:hover { color: var(--ink); background: var(--surface-subtle); }
.au-row-end { display: flex; justify-content: flex-end; margin-top: -8px; }

.au-link { color: var(--brand); font-weight: 700; text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 3px; transition: text-decoration-color 0.15s ease; }
.au-link:hover { text-decoration-color: currentColor; }
.au-link--pad { display: inline-flex; align-items: center; min-height: 44px; }
.au-foot { margin: 22px 0 0; text-align: center; font-size: 15px; color: var(--ink-muted); }
.au-note { margin: 14px 0 0; text-align: center; font-size: 14px; line-height: 1.5; color: var(--ink-muted); }

.au-rules { list-style: none; margin: -6px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.au-rules li { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 13px; font-weight: 700; color: var(--ink-muted); background: var(--surface-subtle); border: 1px solid var(--border); transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease; }
.au-rules li[data-ok="true"] { color: var(--success); border-color: color-mix(in srgb, var(--success) 35%, transparent); background: color-mix(in srgb, var(--success) 8%, transparent); }

@media (prefers-reduced-motion: reduce) {
  .au-card { animation: none; }
  .au-btn, .au-btn:hover:not(:disabled) { transition: none; transform: none; }
}
`;

/** Страница: панел с ползите вляво (само на широк екран) и карта с формата. */
export function AuthShell({ aside, children }) {
    return (
        <div className="au">
            <style>{CSS}</style>
            <div className={aside ? "au__grid" : "au__grid au__grid--single"}>
                {aside}
                {children}
            </div>
        </div>
    );
}

export function AuthAside({ eyebrow, title, art, items }) {
    return (
        <aside className="au-aside" aria-label={eyebrow}>
            <div>
                <p className="au-aside__eyebrow">{eyebrow}</p>
                <h2>{title}</h2>
            </div>
            {art && (
                <img
                    className="au-aside__art"
                    src={`/illustrations/${art.name}-960.webp`}
                    srcSet={`/illustrations/${art.name}-480.webp 480w, /illustrations/${art.name}-960.webp 960w`}
                    sizes="420px"
                    width={960}
                    height={art.height}
                    alt=""
                    decoding="async"
                />
            )}
            <ul className="au-list">
                {items.map((it) => (
                    <li key={it.title}>
                        <img src={`/illustrations/stickers/${it.sticker}.webp`} alt="" aria-hidden="true" width={44} height={44} decoding="async" />
                        <div><b>{it.title}</b><span>{it.text}</span></div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export function AuthCard({ title, lead, children }) {
    return (
        <section className="au-card" aria-labelledby="au-title">
            <h1 id="au-title">{title}</h1>
            {lead && <p className="au-card__lead">{lead}</p>}
            <div className="au-card__body">{children}</div>
        </section>
    );
}

export function AuthAlert({ kind = "error", children }) {
    const Icon = kind === "ok" ? CheckCircle2 : AlertCircle;
    return (
        <div className={`au-alert au-alert--${kind}`} role={kind === "error" ? "alert" : "status"}>
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
}

export function GoogleButton({ onClick, children }) {
    return (
        <button type="button" className="au-btn au-btn--google" onClick={onClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {children}
        </button>
    );
}

/** Поле с видим етикет над него. Използва се и в „Забравена парола“ и „Нова парола“. */
export function Field({ label, icon: Icon, right, ...inputProps }) {
    return (
        <label className="au-field">
            <span className="au-field__label">{label}</span>
            <span className="au-field__box">
                {Icon && <Icon size={18} strokeWidth={1.5} aria-hidden="true" />}
                <input required {...inputProps} />
                {right}
            </span>
        </label>
    );
}

export function Divider({ label = "или" }) {
    return <div className="au-div" role="separator">{label}</div>;
}

export function PasswordToggle({ shown, onToggle }) {
    return (
        <button type="button" className="au-eye" onClick={onToggle} aria-label={shown ? "Скрий паролата" : "Покажи паролата"} aria-pressed={shown}>
            {shown ? <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.5} aria-hidden="true" />}
        </button>
    );
}
