import { useState } from "react";
import { calcStatsService } from "@/services/calcStatsService";

// Отказ от анонимната статистика на баловете. Действа веднага за този браузър
// (няма „Запази") — при изключване сървърът трие вече записаните балове.
export default function CalcStatsOptOut() {
    const [optedOut, setOptedOut] = useState(() => calcStatsService.isOptedOut());
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        const next = !optedOut;
        setBusy(true);
        await calcStatsService.setOptOut(next);
        setOptedOut(next);
        setBusy(false);
    };

    return (
        <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem",
            padding: "1rem 1.25rem", background: "var(--brand-surface-2)",
            border: "1px solid var(--brand-border)", borderRadius: "0.75rem",
        }}>
            <div style={{ flex: "1 1 16rem", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>
                    Анонимна статистика на баловете
                </p>
                <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                    {optedOut
                        ? "Изключено за този браузър. Изчисленията ти не се записват, а старите са изтрити."
                        : "Включено за този браузър. Записва се само балът — без акаунт, имейл или IP."}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={!optedOut}
                onClick={toggle}
                disabled={busy}
                style={{
                    minHeight: "44px", padding: "0 1.1rem", borderRadius: "0.625rem",
                    background: "transparent", border: "1px solid var(--brand-border)",
                    color: "var(--brand-text)", fontSize: "13px", fontWeight: 700,
                    fontFamily: "inherit", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
                }}
            >
                {optedOut ? "Включи" : "Изключи"}
            </button>
        </div>
    );
}
