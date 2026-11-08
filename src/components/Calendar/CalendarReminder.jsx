import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, BellOff, Check, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { reminderService } from "@/services/reminderService";

/**
 * „Напомняй ми“ в календара. Абонаментът е за избрания университет (или за всички,
 * ако няма избран). Пращаме имейл 7 дни и 1 ден преди всяка дата от календара:
 * кандидатстване, приемен изпит, класиране и записване.
 * Без профил бутонът води към входа и след него връща в календара.
 */
export default function CalendarReminder({ universityName = null }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const scope = universityName || null;

    const [subs, setSubs] = useState(null); // null = още зарежда
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null); // { kind: "ok" | "warn" | "error", text }

    const refresh = useCallback(async () => {
        if (!user) { setSubs([]); return; }
        setSubs(await reminderService.getMine());
    }, [user]);

    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => { setNotice(null); }, [scope]);

    const mine = useMemo(() => (subs || []).find((s) => (s.university_name || null) === scope), [subs, scope]);
    const coveredByAll = useMemo(() => scope !== null && (subs || []).some((s) => !s.university_name), [subs, scope]);

    const scopeLabel = scope ? "за този университет" : "за всички университети";

    const goToLogin = () => {
        const search = scope ? `?university=${encodeURIComponent(scope)}` : "";
        navigate("/login", { state: { from: { pathname: "/calendar/", search } } });
    };

    const subscribe = async () => {
        if (!user) { goToLogin(); return; }
        setBusy(true);
        setNotice(null);
        const res = await reminderService.subscribe({ email: user.email, universityName: scope, userId: user.id });
        setBusy(false);
        if (!res?.ok) {
            setNotice({ kind: "error", text: "Нещо се обърка. Опитай пак след малко." });
            return;
        }
        if (res.alreadyConfirmed) setNotice({ kind: "ok", text: "Вече получаваш напомняния за това." });
        else if (res.emailPending) setNotice({ kind: "warn", text: "Записахме те, но имейлът за потвърждение не тръгна. Опитай пак по-късно." });
        else setNotice({ kind: "ok", text: `Изпратихме ти имейл на ${user.email}. Натисни линка в него, за да потвърдиш.` });
        await refresh();
    };

    const stop = async () => {
        if (!mine) return;
        setBusy(true);
        const ok = await reminderService.unsubscribe(mine.unsubscribe_token);
        setBusy(false);
        setNotice(ok ? { kind: "ok", text: "Спряхме напомнянията." } : { kind: "error", text: "Не успяхме да те отпишем. Опитай пак." });
        await refresh();
    };

    const noticeColor = notice?.kind === "error" ? "#f87171" : notice?.kind === "warn" ? "#FBBF24" : "var(--brand-cyan)";

    return (
        <div
            style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem",
                padding: "1rem 1.25rem",
                background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))",
                border: "1px solid var(--brand-card-border)", borderRadius: "1.25rem",
            }}
        >
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <BellRing size={16} strokeWidth={1.5} style={{ color: "var(--brand-cyan)" }} aria-hidden="true" />
                    Не изпускай срок
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "13px", lineHeight: 1.6, color: "var(--brand-muted)", maxWidth: "62ch" }}>
                    Получавай имейл 7 дни и 1 ден преди кандидатстване, приемен изпит, класиране и записване {scopeLabel}.
                    {!user && " Нужен е безплатен профил."}
                </p>
                {coveredByAll && !mine && (
                    <p style={{ margin: "0.375rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>
                        Вече получаваш напомняния за всички университети — включително този.
                    </p>
                )}
                {notice && (
                    <p role="status" style={{ margin: "0.5rem 0 0", fontSize: "12.5px", fontWeight: 600, color: noticeColor, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Mail size={13} strokeWidth={1.5} aria-hidden="true" /> {notice.text}
                    </p>
                )}
            </div>

            {mine ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "12.5px", fontWeight: 700, color: mine.confirmed_at ? "#10b981" : "#FBBF24" }}>
                        <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                        {mine.confirmed_at ? "Напомнянията са включени" : "Чака потвърждение в имейла"}
                    </span>
                    <button
                        type="button" onClick={stop} disabled={busy}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "0.4rem", minHeight: "44px", padding: "0.5rem 1rem",
                            background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem",
                            color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                        }}
                    >
                        <BellOff size={14} strokeWidth={1.5} aria-hidden="true" /> Спри
                    </button>
                </div>
            ) : (
                <button
                    type="button" onClick={subscribe} disabled={busy || subs === null}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem", minHeight: "44px", padding: "0.625rem 1.25rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", border: "none", borderRadius: "0.75rem",
                        color: "#fff", fontSize: "13.5px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                        opacity: busy ? 0.7 : 1,
                    }}
                >
                    {busy ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> : <BellRing size={15} strokeWidth={1.5} aria-hidden="true" />}
                    {user ? `Напомняй ми ${scopeLabel}` : "Влез и ми напомняй"}
                </button>
            )}
        </div>
    );
}
