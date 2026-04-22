import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Mail,
    Lock,
    LogIn,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    GraduationCap,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const safeAuthError = msg => {
    const map = {
        "Invalid login credentials": "Невалиден имейл или парола.",
        "Email not confirmed": "Моля потвърдете имейла си.",
        "Too many requests": "Твърде много опити. Опитайте по-късно.",
    };
    return map[msg] || "Възникна грешка. Опитайте отново.";
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname + (location.state?.from?.search || "") || "/calculator";

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${SAFE_ORIGIN}${from}` },
        });
        if (error) setError(safeAuthError(error.message));
    };

    const handleLogin = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(safeAuthError(error.message)); setLoading(false); }
        else { navigate(from); }
        setLoading(false);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--brand-bg)",
                padding: "6rem 1.5rem 3rem",
                color: "var(--brand-text)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ambient glows */}
            <div aria-hidden style={{ position: "absolute", top: "-200px", right: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: "-200px", left: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />

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
                            width: "3.5rem",
                            height: "3.5rem",
                            borderRadius: "1rem",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 16px 40px rgba(6,182,212,0.35)",
                        }}
                    >
                        <GraduationCap size={28} color="#fff" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)" }}>
                            Добре дошъл отново
                        </h2>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                            Влез в УниПът, за да управляваш своите балове.
                        </p>
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 0.875rem",
                            background: "rgba(248,113,113,0.08)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            borderRadius: "0.625rem",
                            color: "#fca5a5",
                            fontSize: "13px",
                            fontWeight: 500,
                            marginBottom: "1.25rem",
                        }}
                    >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* CLAUDE.md: "Регистрирай се с Google if OAuth is ever added should be the FIRST option" */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    style={{
                        width: "100%", height: "3rem",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                        background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)",
                        borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "14px",
                        fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        transition: "border-color 0.2s, background 0.2s",
                        marginBottom: "0.25rem",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; e.currentTarget.style.background = "var(--brand-surface)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--brand-input-border)"; e.currentTarget.style.background = "var(--brand-input-bg)"; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Влез с Google
                </button>

                <Divider label="Или с имейл" />

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <Field
                        label="Имейл"
                        icon={Mail}
                        type="email"
                        placeholder="ivan@mail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <div>
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
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
                            <Link to="/forgot-password" style={{ fontSize: "11px", color: "var(--brand-cyan)", fontWeight: 600, textDecoration: "none" }}>
                                Забравена парола?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: "0.75rem",
                            padding: "0.875rem 1rem",
                            background: loading ? "rgba(148,163,184,0.15)" : "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            border: "none",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 800,
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            boxShadow: loading ? "none" : "0 12px 30px rgba(6,182,212,0.3)",
                            fontFamily: "inherit",
                            transition: "transform 0.15s",
                        }}
                        onMouseDown={e => !loading && (e.currentTarget.style.transform = "scale(0.98)")}
                        onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                Влизане...
                            </>
                        ) : (
                            <>
                                <LogIn size={16} /> Влез в профила
                            </>
                        )}
                    </button>
                </form>

                <p style={{ margin: "1.75rem 0 0", textAlign: "center", fontSize: "13px", color: "var(--brand-muted)" }}>
                    Нямаш профил?{" "}
                    <Link to="/register" style={{ color: "var(--brand-cyan)", fontWeight: 700, textDecoration: "none" }}>
                        Регистрирай се
                    </Link>
                </p>
            </div>
        </div>
    );
};

export function Field({ label, icon: Icon, right, ...inputProps }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
            </span>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0 0.875rem",
                    background: "var(--brand-input-bg)",
                    border: "1px solid var(--brand-input-border)",
                    borderRadius: "0.625rem",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.08)"; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--brand-input-border)"; e.currentTarget.style.boxShadow = "none"; }}
            >
                {Icon && <Icon size={16} style={{ color: "var(--brand-muted)", flexShrink: 0 }} />}
                <input
                    {...inputProps}
                    required
                    style={{
                        flex: 1,
                        height: "2.75rem",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--brand-text)",
                        fontSize: "14px",
                        fontWeight: 500,
                        fontFamily: "inherit",
                    }}
                />
                {right}
            </div>
        </label>
    );
}

export function Divider({ label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0 1.25rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--brand-border)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: "var(--brand-muted)", textTransform: "uppercase", opacity: 0.6 }}>{label}</span>
            <div style={{ flex: 1, height: "1px", background: "var(--brand-border)" }} />
        </div>
    );
}

export default Login;
