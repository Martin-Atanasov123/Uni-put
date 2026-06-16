import { AlertTriangle } from "lucide-react";

// Известни статуси на акредитация → warning copy.
// NULL / непознат статус → нищо не се рендира (нормален университет).
const STATUS_COPY = {
    under_review: {
        title: "Акредитацията е под въпрос",
        text: "Институционалната акредитация на този университет е под въпрос (НАОА, 2025 г.). Преди да кандидатстваш, провери официалния статус — има сигнали, че издадени дипломи не се признават.",
    },
};

/**
 * Визуален warning за университети с проблемна акредитация.
 * Trust-критичен компонент — показва се навсякъде, където такъв университет
 * се представя на потребителя (per-uni страница, калкулатор резултат, карти).
 *
 * @param {string} status     - accreditation_status от базата
 * @param {"banner"|"chip"} [variant="banner"] - banner=пълен; chip=компактен
 */
export default function AccreditationWarning({ status, variant = "banner" }) {
    const copy = STATUS_COPY[status];
    if (!copy) return null;

    const AMBER = "#FBBF24";
    const amberBg = "rgba(251,191,36,0.08)";
    const amberBorder = "rgba(251,191,36,0.35)";

    if (variant === "chip") {
        return (
            <span
                title={copy.text}
                style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.2rem 0.5rem", borderRadius: "999px",
                    background: amberBg, border: `1px solid ${amberBorder}`,
                    color: AMBER, fontSize: "10px", fontWeight: 700,
                    whiteSpace: "nowrap",
                }}
            >
                <AlertTriangle size={10} strokeWidth={2} /> Акредитация под въпрос
            </span>
        );
    }

    return (
        <div
            role="alert"
            style={{
                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                padding: "0.875rem 1rem", borderRadius: "0.75rem",
                background: amberBg, border: `1px solid ${amberBorder}`,
            }}
        >
            <AlertTriangle size={18} strokeWidth={2} color={AMBER} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: AMBER, marginBottom: "0.2rem" }}>
                    {copy.title}
                </div>
                <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--brand-muted)" }}>
                    {copy.text}
                </p>
            </div>
        </div>
    );
}
