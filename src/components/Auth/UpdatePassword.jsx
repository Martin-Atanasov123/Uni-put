import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Field } from "./Login";
import { Alert } from "./ForgotPassword";

const UpdatePassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            await supabase.auth.getSession();
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async e => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Паролите не съвпадат!");
            return;
        }
        if (password.length < 8) {
            setError("Паролата трябва да е поне 8 символа!");
            return;
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Паролата трябва да съдържа поне една главна буква и една цифра!");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch {
            setError("Възникна грешка при смяна на паролата. Опитайте отново.");
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

            <div aria-hidden style={{ position: "absolute", top: "-200px", left: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: "-200px", right: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />

            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    background: "rgba(30,41,59,0.6)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148,163,184,0.12)",
                    borderRadius: "1.5rem",
                    padding: "2.5rem 2rem",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "3.5rem",
                            height: "3.5rem",
                            borderRadius: "1rem",
                            background: "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 16px 40px rgba(139,92,246,0.35)",
                        }}
                    >
                        <Lock size={28} color="#fff" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)" }}>
                            Нова парола
                        </h2>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                            Въведи своята нова парола за достъп до УниПът.
                        </p>
                    </div>
                </div>

                {error && <Alert kind="error" icon={AlertCircle}>{error}</Alert>}

                {success ? (
                    <Alert kind="success" icon={CheckCircle2}>
                        Паролата е променена успешно! Пренасочване...
                    </Alert>
                ) : (
                    <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <Field
                            label="Нова парола"
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
                        <Field
                            label="Потвърди парола"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "0.75rem",
                                padding: "0.875rem 1rem",
                                background: loading ? "rgba(148,163,184,0.15)" : "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
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
                                boxShadow: loading ? "none" : "0 12px 30px rgba(139,92,246,0.3)",
                                fontFamily: "inherit",
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Обновяване...
                                </>
                            ) : (
                                "Обнови паролата"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePassword;
