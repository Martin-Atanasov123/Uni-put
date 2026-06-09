import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import { X, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "uniput_terms_accepted";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, "1");
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <m.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: "fixed",
                        bottom: "1.25rem",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 200,
                        width: "min(92vw, 520px)",
                        background: "var(--brand-surface)",
                        border: "1px solid var(--brand-card-border)",
                        borderRadius: "1.25rem",
                        padding: "1.25rem 1.5rem",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                    role="dialog"
                    aria-label="Условия за ползване"
                >
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <div style={{
                            flexShrink: 0,
                            width: 36, height: 36, borderRadius: "0.625rem",
                            background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <ShieldCheck size={18} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{
                                margin: 0,
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                color: "var(--brand-text)",
                                letterSpacing: "-0.01em",
                            }}>
                                Поверителност и условия
                            </p>
                            <p style={{
                                margin: "0.25rem 0 0",
                                fontSize: "0.8125rem",
                                color: "var(--brand-muted)",
                                lineHeight: 1.55,
                            }}>
                                УниПът използва localStorage само за запазване на твоите резултати.
                                Никакви лични данни не се продават.{" "}
                                <Link to="/privacy" onClick={accept} style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                    Политика за поверителност
                                </Link>{" "}·{" "}
                                <Link to="/terms" onClick={accept} style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                    Условия за ползване
                                </Link>
                            </p>
                        </div>
                        <button
                            onClick={accept}
                            aria-label="Затвори"
                            style={{
                                flexShrink: 0,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--brand-muted)",
                                padding: "0.25rem",
                                borderRadius: "0.375rem",
                                display: "flex",
                                alignItems: "center",
                                transition: "color 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--brand-text)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--brand-muted)"}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Action row */}
                    <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                        <button
                            onClick={accept}
                            style={{
                                background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                                color: "#fff",
                                border: "none",
                                borderRadius: "0.625rem",
                                padding: "0.625rem 1.25rem",
                                fontSize: "0.8125rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                letterSpacing: "0.01em",
                                transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(6,182,212,0.3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                        >
                            Разбрах, продължи →
                        </button>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
