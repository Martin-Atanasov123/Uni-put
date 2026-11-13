import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, BellOff, Check, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { reminderService } from "@/services/reminderService";

/**
 * Напомняния от календара. Абонаментът е за един университет (или за всички, когато
 * universityName е null). Имейл 7 дни и 1 ден преди всяка дата от календара:
 * кандидатстване, приемен изпит, класиране и записване.
 * Без профил бутонът води към входа и след него връща в календара.
 */

// ── Споделен списък със записванията на потребителя ──────────────────────────
// Календарът показва десетки бутони (по един за събитие) — зареждаме веднъж.
const store = { userId: null, list: null, listeners: new Set() };
const notify = () => store.listeners.forEach((fn) => fn());

async function loadSubs(userId, force = false) {
    if (!userId) { store.userId = null; store.list = []; notify(); return; }
    if (!force && store.userId === userId && store.list) return;
    store.userId = userId;
    store.list = await reminderService.getMine();
    notify();
}

function useSubs(user) {
    const [, tick] = useState(0);
    useEffect(() => {
        const fn = () => tick((n) => n + 1);
        store.listeners.add(fn);
        return () => store.listeners.delete(fn);
    }, []);
    useEffect(() => { loadSubs(user?.id || null); }, [user?.id]);
    return store.userId === (user?.id || null) ? store.list : null; // null = още зарежда
}

function useReminderScope(universityName = null) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const scope = universityName || null;
    const subs = useSubs(user);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null); // { kind: "ok" | "warn" | "error", text }

    useEffect(() => { setNotice(null); }, [scope]);

    const mine = useMemo(() => (subs || []).find((s) => (s.university_name || null) === scope), [subs, scope]);
    const coveredByAll = useMemo(() => scope !== null && (subs || []).some((s) => !s.university_name), [subs, scope]);

    const goToLogin = useCallback(() => {
        const search = scope ? `?university=${encodeURIComponent(scope)}` : "";
        navigate("/login", { state: { from: { pathname: "/calendar/", search } } });
    }, [navigate, scope]);

    const subscribe = useCallback(async () => {
        if (!user) { goToLogin(); return; }
        setBusy(true);
        setNotice(null);
        const res = await reminderService.subscribe({ email: user.email, universityName: scope, userId: user.id });
        setBusy(false);
        if (!res?.ok) setNotice({ kind: "error", text: "Нещо се обърка. Опитай пак след малко." });
        else if (res.alreadyConfirmed) setNotice({ kind: "ok", text: "Вече получаваш напомняния за това." });
        else if (res.emailPending) setNotice({ kind: "warn", text: "Записахме те, но имейлът за потвърждение не тръгна. Опитай пак по-късно." });
        else setNotice({ kind: "ok", text: `Изпратихме ти имейл на ${user.email}. Натисни линка в него, за да потвърдиш.` });
        await loadSubs(user.id, true);
    }, [user, scope, goToLogin]);

    const stop = useCallback(async () => {
        if (!mine) return;
        setBusy(true);
        const ok = await reminderService.unsubscribe(mine.unsubscribe_token);
        setBusy(false);
        setNotice(ok ? { kind: "ok", text: "Спряхме напомнянията." } : { kind: "error", text: "Не успяхме да те отпишем. Опитай пак." });
        await loadSubs(user?.id || null, true);
    }, [mine, user?.id]);

    return { user, scope, subs, mine, coveredByAll, busy, notice, subscribe, stop };
}

const noticeColor = (kind) => (kind === "error" ? "#f87171" : kind === "warn" ? "#FBBF24" : "var(--brand-cyan)");

const primaryBtn = {
    display: "inline-flex", alignItems: "center", gap: "0.5rem", minHeight: "44px", padding: "0.625rem 1.25rem",
    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", border: "none", borderRadius: "0.75rem",
    color: "#fff", fontSize: "13.5px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
};
const ghostBtn = {
    display: "inline-flex", alignItems: "center", gap: "0.4rem", minHeight: "44px", padding: "0.5rem 1rem",
    background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem",
    color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
};

// ── Голяма лента над календара ───────────────────────────────────────────────
export default function CalendarReminder({ universityName = null }) {
    const { user, scope, subs, mine, coveredByAll, busy, notice, subscribe, stop } = useReminderScope(universityName);
    const scopeLabel = scope ? "за този университет" : "за всички университети";

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
                    {!user && " Нужен е безплатен профил."} Искаш само един университет? Натисни събитие в календара.
                </p>
                {coveredByAll && !mine && (
                    <p style={{ margin: "0.375rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>
                        Вече получаваш напомняния за всички университети — включително този.
                    </p>
                )}
                {notice && (
                    <p role="status" style={{ margin: "0.5rem 0 0", fontSize: "12.5px", fontWeight: 600, color: noticeColor(notice.kind), display: "flex", alignItems: "center", gap: "0.375rem" }}>
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
                    <button type="button" onClick={stop} disabled={busy} style={ghostBtn}>
                        <BellOff size={14} strokeWidth={1.5} aria-hidden="true" /> Спри
                    </button>
                </div>
            ) : (
                <button type="button" onClick={subscribe} disabled={busy || (user && subs === null)} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                    {busy ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> : <BellRing size={15} strokeWidth={1.5} aria-hidden="true" />}
                    {user ? `Напомняй ми ${scopeLabel}` : "Влез и ми напомняй"}
                </button>
            )}
        </div>
    );
}

// ── Компактно действие под конкретно събитие ─────────────────────────────────
export function EventReminderAction({ universityName, national = false }) {
    const { user, subs, mine, coveredByAll, busy, notice, subscribe, stop } = useReminderScope(universityName);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.625rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }}>
                {mine ? (
                    <>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "12.5px", fontWeight: 700, color: mine.confirmed_at ? "#10b981" : "#FBBF24" }}>
                            <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                            {mine.confirmed_at ? "Напомнянията са включени" : "Чака потвърждение в имейла"}
                        </span>
                        <button type="button" onClick={stop} disabled={busy} style={ghostBtn}>
                            <BellOff size={14} strokeWidth={1.5} aria-hidden="true" /> Спри
                        </button>
                    </>
                ) : coveredByAll ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "12.5px", fontWeight: 600, color: "var(--brand-muted)" }}>
                        <Check size={14} strokeWidth={1.5} aria-hidden="true" /> Вече получаваш напомняния за всички университети
                    </span>
                ) : (
                    <button type="button" onClick={subscribe} disabled={busy || (user && subs === null)} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                        {busy ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> : <BellRing size={15} strokeWidth={1.5} aria-hidden="true" />}
                        {national ? (user ? "Напомняй ми за тези дати" : "Влез и ми напомняй") : (user ? "Напомняй ми само за този университет" : "Влез и ми напомняй за него")}
                    </button>
                )}
            </div>
            {notice && (
                <p role="status" style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: noticeColor(notice.kind) }}>{notice.text}</p>
            )}
        </div>
    );
}
