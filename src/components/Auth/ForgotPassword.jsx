import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Field } from "./Login";

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleResetRequest = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${SAFE_ORIGIN}/update-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch {
            setError("Възникна грешка. Опитайте отново.");
        } finally {
            setLoading(false);
        }
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
                }}
            >
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
                        <KeyRound size={28} color="#fff" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)" }}>
                            Забравена парола?
                        </h2>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                            Въведи своя имейл и ще ти изпратим линк за възстановяване.
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert kind="error" icon={AlertCircle}>
                        {error}
                    </Alert>
                )}

                {success ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
                        <Alert kind="success" icon={CheckCircle2}>
                            Провери своята поща за инструкции!
                        </Alert>
                        <Link
                            to="/login"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 1rem",
                                background: "transparent",
                                border: "1px solid var(--brand-border)",
                                borderRadius: "0.625rem",
                                color: "var(--brand-text)",
                                fontSize: "13px",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            <ArrowLeft size={14} /> Обратно към вход
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleResetRequest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <Field label="Имейл" icon={Mail} type="email" placeholder="ivan@mail.com" value={email} onChange={e => setEmail(e.target.value)} />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "0.5rem",
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
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Изпращане...
                                </>
                            ) : (
                                "Изпрати линк"
                            )}
                        </button>

                        <Link
                            to="/login"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 1rem",
                                background: "transparent",
                                border: "1px solid var(--brand-input-border)",
                                borderRadius: "0.625rem",
                                color: "var(--brand-muted)",
                                fontSize: "13px",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            <ArrowLeft size={14} /> Върни се към вход
                        </Link>
                    </form>
                )}
            </div>
        </div>
    );
};

export function Alert({ kind, icon: Icon, children }) {
    const styles = kind === "success"
        ? { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", color: "#86efac" }
        : { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)", color: "#fca5a5" };
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 0.875rem",
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: "0.625rem",
                color: styles.color,
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "1.25rem",
            }}
        >
            {Icon && <Icon size={16} style={{ flexShrink: 0 }} />}
            <span>{children}</span>
        </div>
    );
}

export default ForgotPassword;
