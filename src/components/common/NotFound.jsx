import { Link } from "react-router-dom";
import { Home, ArrowRight, AlertCircle } from "lucide-react";
import { m } from "motion/react";

export default function NotFound() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "6rem 1.5rem",
                background: "var(--brand-bg)",
                color: "var(--brand-text)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div aria-hidden style={{ position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "640px", height: "640px", background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: "-200px", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />

            <m.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ textAlign: "center", maxWidth: "640px", position: "relative", zIndex: 1 }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.4rem 0.875rem",
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        borderRadius: "999px",
                        color: "#fca5a5",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        marginBottom: "1.5rem",
                    }}
                >
                    <AlertCircle size={12} /> 404
                </div>

                <h1
                    style={{
                        margin: 0,
                        fontSize: "clamp(3rem, 10vw, 6rem)",
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Страницата не е намерена
                </h1>

                <p style={{ margin: "1.25rem auto 0", fontSize: "1.0625rem", color: "var(--brand-muted)", maxWidth: "440px", lineHeight: 1.6 }}>
                    Търсената страница не съществува или е била преместена. Върни се към началото, за да продължиш.
                </p>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
                    <Link
                        to="/"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            border: "none",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 700,
                            textDecoration: "none",
                            boxShadow: "0 12px 30px rgba(6,182,212,0.3)",
                        }}
                    >
                        <Home size={16} /> Към началната
                    </Link>
                    <Link
                        to="/universities"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            background: "transparent",
                            border: "1px solid rgba(148,163,184,0.2)",
                            borderRadius: "0.75rem",
                            color: "var(--brand-text)",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Разгледай университети <ArrowRight size={14} />
                    </Link>
                </div>
            </m.div>
        </main>
    );
}
