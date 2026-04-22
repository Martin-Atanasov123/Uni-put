import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
    UserPlus, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
    GraduationCap, BookmarkCheck, GitCompareArrows, TrendingUp,
} from "lucide-react";
import { Field, Divider } from "./Login";

// CLAUDE.md: "Never require name on signup — ask it later, optionally, in profile"
// CLAUDE.md: "After signup, redirect directly to the calculator"
// CLAUDE.md: "SPLIT LAYOUT (desktop): Left = brand visual/copy | Right = form"

const BENEFITS = [
    { icon: BookmarkCheck, title: "Запази резултатите", desc: "Балсовете и специалностите, които изчислиш, се пазят автоматично." },
    { icon: GitCompareArrows, title: "Сравни факултети",  desc: "Запази любимите си специалности и ги сравни на едно място." },
    { icon: TrendingUp,       title: "Проследи прогреса", desc: "Виж как оценките ти се отразяват на шансовете ти с времето." },
];

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 8) {
            setError("Паролата трябва да е поне 8 символа!");
            setLoading(false);
            return;
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Паролата трябва да съдържа поне една главна буква и една цифра!");
            setLoading(false);
            return;
        }

        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
            if (signUpError.message.includes("already registered")) {
                setError("Този имейл вече е зает. Пробвай да влезеш.");
            } else {
                setError("Възникна грешка при регистрацията. Опитайте отново.");
            }
            setLoading(false);
        } else {
            // CLAUDE.md: "After signup, redirect directly to the calculator"
            navigate("/calculator");
        }
    };

    const rules = [
        { ok: password.length >= 8, label: "Поне 8 символа" },
        { ok: /[A-Z]/.test(password), label: "Главна буква" },
        { ok: /[0-9]/.test(password), label: "Цифра" },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "stretch",
                background: "var(--brand-bg)",
                color: "var(--brand-text)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Left panel — brand / benefits (desktop only) ── */}
            <div
                className="reg-left-panel"
                style={{
                    flex: "0 0 45%",
                    display: "none",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "4rem 3rem",
                    background: "linear-gradient(160deg, var(--brand-bg-alt) 0%, var(--brand-bg) 100%)",
                    borderRight: "1px solid var(--brand-border)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* ambient glows */}
                <div aria-hidden style={{ position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />
                <div aria-hidden style={{ position: "absolute", bottom: "-100px", right: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
                        <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", display: "flex" }}>
                            <GraduationCap size={20} color="#fff" />
                        </div>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            УниПът
                        </span>
                    </Link>

                    {/* Headline */}
                    <div>
                        <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, textWrap: "balance" }}>
                            Запази резултатите си
                        </h2>
                        <p style={{ margin: "0.75rem 0 0", fontSize: "1rem", color: "var(--brand-muted)", lineHeight: 1.6, maxWidth: "360px" }}>
                            Регистрирай се безплатно за 30 секунди и никога не губи изчислените балове.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {BENEFITS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={16} style={{ color: "var(--brand-cyan)" }} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>{title}</p>
                                    <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6rem 1.5rem 3rem",
                    position: "relative",
                }}
            >
                {/* mobile ambient glows */}
                <div aria-hidden style={{ position: "absolute", top: "-200px", left: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />
                <div aria-hidden style={{ position: "absolute", bottom: "-200px", right: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />

                <div
                    style={{
                        width: "100%",
                        maxWidth: "440px",
                        background: "var(--brand-surface)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid var(--brand-card-border)",
                        borderRadius: "1.5rem",
                        padding: "2.5rem 2rem",
                        boxShadow: "0 24px 60px var(--brand-shadow)",
                        position: "relative",
                    }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                        <div
                            style={{
                                width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                                background: "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 16px 40px rgba(139,92,246,0.35)",
                            }}
                        >
                            <UserPlus size={28} color="#fff" />
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)", textWrap: "balance" }}>
                                Регистрация
                            </h1>
                            <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: "var(--brand-muted)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                Стани част от УниПът <GraduationCap size={14} style={{ color: "var(--brand-cyan)" }} />
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div
                            style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.75rem 0.875rem",
                                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)",
                                borderRadius: "0.625rem", color: "#fca5a5", fontSize: "13px", fontWeight: 500,
                                marginBottom: "1.25rem",
                            }}
                        >
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* CLAUDE.md: email + password only — no username on signup */}
                        <Field label="Имейл" icon={Mail} type="email" placeholder="ivan@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
                        <Field
                            label="Парола"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            right={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{ background: "none", border: "none", color: "var(--brand-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            }
                        />

                        {/* Password strength indicators */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "-0.25rem" }}>
                            {rules.map(r => (
                                <span
                                    key={r.label}
                                    style={{
                                        padding: "0.25rem 0.625rem",
                                        background: r.ok ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.08)",
                                        border: `1px solid ${r.ok ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.12)"}`,
                                        borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                                        color: r.ok ? "#86efac" : "var(--brand-muted)",
                                        letterSpacing: "0.04em", transition: "all 0.2s",
                                    }}
                                >
                                    {r.ok ? "✓" : "•"} {r.label}
                                </span>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "0.75rem", padding: "0.875rem 1rem",
                                background: loading ? "rgba(148,163,184,0.15)" : "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
                                border: "none", borderRadius: "0.75rem", color: "#fff",
                                fontSize: "14px", fontWeight: 800,
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                boxShadow: loading ? "none" : "0 12px 30px rgba(139,92,246,0.3)",
                                fontFamily: "inherit",
                                transition: "transform 0.15s",
                            }}
                            onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    Регистриране...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} /> Регистрирай ме
                                </>
                            )}
                        </button>
                    </form>

                    {/* CLAUDE.md: privacy micro-copy */}
                    <p style={{ margin: "0.875rem 0 0", textAlign: "center", fontSize: "11px", color: "var(--brand-muted)", opacity: 0.7 }}>
                        Никакъв спам. Само резултатите ти.
                    </p>

                    <Divider label="Или" />

                    <p style={{ margin: 0, textAlign: "center", fontSize: "13px", color: "var(--brand-muted)" }}>
                        Вече имаш профил?{" "}
                        <Link to="/login" style={{ color: "var(--brand-cyan)", fontWeight: 700, textDecoration: "none" }}>
                            Влез тук
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @media (min-width: 900px) {
                    .reg-left-panel { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default SignUp;
