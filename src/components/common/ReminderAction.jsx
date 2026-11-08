// Компонент: ReminderAction
// Обслужва /reminders/confirm?token=… и /reminders/unsubscribe?token=…
// (линковете от имейлите). Един екран, минимален — прочита токена, вика RPC-то,
// показва резултата. Без layout шум: това е landing от имейл, не част от app-а.

import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, BellOff } from "lucide-react";
import Seo from "@/components/common/Seo";
import { reminderService } from "@/services/reminderService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReminderAction() {
    const location = useLocation();
    const [params] = useSearchParams();
    const isUnsub = location.pathname.replace(/\/+$/, "").endsWith("/unsubscribe");
    const token = params.get("token") || "";
    const [status, setStatus] = useState("working"); // working | ok | fail

    useEffect(() => {
        if (!UUID_RE.test(token)) { setStatus("fail"); return; }
        const run = isUnsub ? reminderService.unsubscribe(token) : reminderService.confirm(token);
        run.then((res) => {
            const ok = isUnsub ? res === true : typeof res === "string" && res.length > 0;
            setStatus(ok ? "ok" : "fail");
        });
    }, [token, isUnsub]);

    const title = isUnsub ? "Отписване от напомняния" : "Потвърждаване на напомняния";
    const Icon = status === "ok" ? (isUnsub ? BellOff : CheckCircle2) : XCircle;
    const color = status === "ok" ? (isUnsub ? "var(--brand-muted)" : "#10b981") : "#f87171";

    const message = {
        working: "Момент…",
        ok: isUnsub
            ? "Готово — няма да получаваш повече напомняния. Можеш да се запишеш пак по всяко време от калкулатора."
            : "Готово! Ще ти пишем 7 и 1 дни преди датите за прием — кандидатстване, изпит, класиране и записване.",
        fail: isUnsub
            ? "Линкът е невалиден или вече си отписан."
            : "Линкът е невалиден или изтекъл. Опитай да се запишеш отново от калкулатора.",
    }[status];

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 1.25rem 3rem" }}>
            <Seo title={title} description="Управление на имейл напомнянията за срокове за кандидатстване." noindex />
            <div style={{
                width: "100%", maxWidth: "26rem", textAlign: "center",
                background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)",
                borderRadius: "1.25rem", padding: "2rem 1.75rem",
            }}>
                {status !== "working" && (
                    <Icon size={40} strokeWidth={1.5} style={{ color, margin: "0 auto 1rem" }} />
                )}
                <h1 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--brand-text)", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>
                    {title}
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--brand-muted)", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                    {message}
                </p>
                <Link to="/calculator/" style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minHeight: "44px", padding: "0 1.25rem", borderRadius: "0.75rem",
                    fontSize: "0.9375rem", fontWeight: 700, color: "#fff", textDecoration: "none",
                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                }}>
                    Към калкулатора
                </Link>
            </div>
        </div>
    );
}
