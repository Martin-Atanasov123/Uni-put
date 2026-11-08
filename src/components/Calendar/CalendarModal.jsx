import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Достъпен диалог: Escape и клик извън го затварят, фокусът отива към бутона „Затвори“,
 * фонът не се скролира. Използва се за детайли на събитие и за списък със събитията от ден.
 */
export default function CalendarModal({ open, title, subtitle, onClose, children }) {
    const closeRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 100, background: "rgba(3,7,18,0.72)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
            }}
        >
            <div
                role="dialog" aria-modal="true" aria-label={title}
                style={{
                    width: "100%", maxWidth: "36rem", maxHeight: "86vh", display: "flex", flexDirection: "column",
                    background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "1.25rem",
                    boxShadow: "0 24px 60px var(--brand-shadow)",
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", padding: "1.125rem 1.25rem 0.75rem" }}>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--brand-text)", textWrap: "balance" }}>{title}</h2>
                        {subtitle && <p style={{ margin: "0.25rem 0 0", fontSize: "12.5px", color: "var(--brand-muted)" }}>{subtitle}</p>}
                    </div>
                    <button
                        ref={closeRef} type="button" onClick={onClose} aria-label="Затвори"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, flexShrink: 0,
                            background: "var(--brand-surface-2)", border: "1px solid var(--brand-border)", borderRadius: "0.625rem",
                            color: "var(--brand-text)", cursor: "pointer",
                        }}
                    >
                        <X size={18} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                </div>
                <div style={{ overflowY: "auto", padding: "0.25rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
