import { Link } from "react-router-dom";
import { m } from "motion/react";
import { UserPlus, X, Heart, Sparkles, CalendarDays } from "lucide-react";

// Преизползваема покана за акаунт. Показва се САМО след доставена стойност
// (запазена любима, разкрит резултат и т.н.) — никога като първо действие.
// CLAUDE.md §3: "Secondary CTA … after the user has seen value — never as the first ask."
//
// variant задава контекстния текст + икона. Всички варианти водят към /register.
const VARIANTS = {
    favorite: {
        Icon: Heart,
        title: "Запазено! Създай акаунт, за да не го изгубиш",
        text: "Любимите ти се пазят на това устройство. С безплатен акаунт ги виждаш от телефона и компютъра — и получаваш напомняния за сроковете.",
    },
    "favorites-page": {
        Icon: Heart,
        title: "Влез, за да не изгубиш списъка си",
        text: "Тези любими се пазят само на този браузър. Създай безплатен акаунт и ще ги имаш навсякъде — плюс напомняния, когато наближи срок.",
    },
    riasec: {
        Icon: Sparkles,
        title: "Запази своя кариерен тип",
        text: "Създай безплатен акаунт за 30 секунди и запази резултата си — за да се върнеш към подходящите специалности по всяко време.",
    },
    calendar: {
        Icon: CalendarDays,
        title: "Получавай напомняния за сроковете",
        text: "С безплатен акаунт ти напомняме преди всеки важен срок за прием — за да не изпуснеш кандидатстване или записване.",
    },
};

/**
 * @param {string} variant  Ключ от VARIANTS (favorite | favorites-page | riasec | calendar)
 * @param {() => void} [onDismiss]  Ако е подаден — показва бутон „×" за затваряне
 * @param {string} [registerTo]  Дестинация на CTA (default /register)
 */
export default function SignupPrompt({ variant = "favorite", onDismiss, registerTo = "/register" }) {
    const cfg = VARIANTS[variant] || VARIANTS.favorite;
    const { Icon } = cfg;

    return (
        <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "relative",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                padding: "1.25rem 1.5rem",
                background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))",
                border: "1px solid rgba(6,182,212,0.25)",
                borderRadius: "1.25rem",
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: "0.75rem", flexShrink: 0,
                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon size={22} color="#fff" strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    margin: 0, fontSize: "1rem", fontWeight: 800,
                    color: "var(--brand-text)", letterSpacing: "-0.01em", textWrap: "balance",
                }}>
                    {cfg.title}
                </h3>
                <p style={{
                    margin: "0.375rem 0 0.875rem", fontSize: "13px",
                    color: "var(--brand-muted)", lineHeight: 1.55, maxWidth: "52ch",
                }}>
                    {cfg.text}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                    <Link to={registerTo} className="signup-prompt-cta" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.6rem 1.1rem", borderRadius: "0.75rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none",
                    }}>
                        <UserPlus size={14} strokeWidth={2} /> Регистрирай се безплатно
                    </Link>
                    <Link to="/login" style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "0.6rem 1rem", borderRadius: "0.75rem",
                        border: "1px solid var(--brand-border)", color: "var(--brand-text)",
                        fontSize: "13px", fontWeight: 600, textDecoration: "none",
                    }}>
                        Вече имам акаунт
                    </Link>
                </div>
            </div>

            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Затвори"
                    style={{
                        position: "absolute", top: "0.75rem", right: "0.75rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "0.5rem",
                        background: "var(--brand-surface-2)", border: "1px solid var(--brand-border)",
                        color: "var(--brand-muted)", cursor: "pointer",
                    }}
                >
                    <X size={14} />
                </button>
            )}

            <style>{`.signup-prompt-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(6,182,212,0.3); } .signup-prompt-cta { transition: transform 0.2s, box-shadow 0.2s; }`}</style>
        </m.div>
    );
}
