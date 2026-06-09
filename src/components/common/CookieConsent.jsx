import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "uniput_cookie_consent";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, "granted");
        window.gtag?.("consent", "update", { analytics_storage: "granted" });
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem(STORAGE_KEY, "declined");
        setVisible(false);
    };

    return (
        <>
            <style>{`
                .cookie-banner {
                    position: fixed;
                    bottom: 1rem;
                    left: 1rem;
                    right: 1rem;
                    z-index: 200;
                    max-width: 540px;
                    margin: 0 auto;
                    background: var(--brand-surface);
                    border: 1px solid var(--brand-card-border);
                    border-radius: 1.25rem;
                    padding: 1.25rem;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    box-sizing: border-box;
                }
                @media (min-width: 600px) {
                    .cookie-banner {
                        left: 50%;
                        right: auto;
                        transform: translateX(-50%);
                        width: calc(100vw - 2rem);
                        bottom: 1.25rem;
                        padding: 1.25rem 1.5rem;
                    }
                }
                .cookie-actions {
                    display: flex;
                    gap: 0.625rem;
                }
                @media (max-width: 400px) {
                    .cookie-actions {
                        flex-direction: column;
                    }
                    .cookie-actions button {
                        width: 100%;
                        justify-content: center;
                    }
                }
                .cookie-decline {
                    flex: 1;
                    background: transparent;
                    border: 1px solid var(--brand-border);
                    color: var(--brand-muted);
                    border-radius: 0.625rem;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: border-color 0.15s, color 0.15s;
                    font-family: inherit;
                }
                .cookie-decline:hover {
                    border-color: var(--brand-text);
                    color: var(--brand-text);
                }
                .cookie-accept {
                    flex: 2;
                    background: linear-gradient(135deg, var(--brand-cyan), var(--brand-violet));
                    color: #fff;
                    border: none;
                    border-radius: 0.625rem;
                    padding: 0.75rem 1.25rem;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                }
                .cookie-accept:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(6,182,212,0.3);
                }
            `}</style>

            <AnimatePresence>
                {visible && (
                    <m.div
                        className="cookie-banner"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        role="dialog"
                        aria-label="Съгласие за бисквитки"
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                            <div style={{
                                flexShrink: 0,
                                width: 36, height: 36, borderRadius: "0.625rem",
                                background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <ShieldCheck size={18} color="#fff" />
                            </div>
                            <div>
                                <p style={{
                                    margin: 0,
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    color: "var(--brand-text)",
                                    letterSpacing: "-0.01em",
                                }}>
                                    Поверителност и аналитика
                                </p>
                                <p style={{
                                    margin: "0.25rem 0 0",
                                    fontSize: "0.8125rem",
                                    color: "var(--brand-muted)",
                                    lineHeight: 1.55,
                                }}>
                                    УниПът използва анонимна аналитика, за да разберем кои функции помагат най-много. Без лични данни.{" "}
                                    <Link to="/privacy" style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                        Поверителност
                                    </Link>
                                    {" "}·{" "}
                                    <Link to="/terms" style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                        Условия
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="cookie-actions">
                            <button className="cookie-decline" onClick={decline}>
                                Отказвам
                            </button>
                            <button className="cookie-accept" onClick={accept}>
                                Приемам →
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
}
