import { AlertCircle, RefreshCcw } from "lucide-react";

/**
 * Показва ясна грешка вместо празен екран или празен списък.
 * Съобщението е на български и без технически жаргон; бутонът повтаря заявката.
 */
export default function ErrorState({
    message = "Нещо се обърка при зареждането. Провери връзката и опитай пак.",
    onRetry,
    style,
}) {
    return (
        <div
            role="alert"
            style={{
                background: "var(--brand-surface)",
                border: "1px solid rgba(248,113,113,0.35)",
                borderRadius: "1.25rem",
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.875rem",
                ...style,
            }}
        >
            <AlertCircle size={28} strokeWidth={1.5} style={{ color: "#f87171" }} aria-hidden="true" />
            <p style={{ margin: 0, color: "var(--brand-text)", fontSize: "0.9375rem", maxWidth: "36ch", lineHeight: 1.6 }}>
                {message}
            </p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        minHeight: "44px",
                        padding: "0.625rem 1.25rem",
                        background: "transparent",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "0.75rem",
                        color: "var(--brand-text)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        fontFamily: "inherit",
                        cursor: "pointer",
                    }}
                >
                    <RefreshCcw size={14} strokeWidth={1.5} aria-hidden="true" /> Опитай пак
                </button>
            )}
        </div>
    );
}
