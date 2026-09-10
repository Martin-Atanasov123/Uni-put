// Компонент: DeadlineReminder
// „Срок за кандидатстване + напомни ми по имейл" — точка 7 от роудмапа.
// CLAUDE.md §12/§18: единствената retention механика, която работи за 12. клас.
//
// Показва се в резултата на калкулатора. Ако има предстоящ срок за дадения
// университет — показва обратно броене с фактическа спешност (не фалшива
// недостига) и сгъната форма за имейл напомняне (double opt-in, GDPR за
// непълнолетни: само имейл, отписване с един клик).

import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, BellRing, Check, ArrowRight, AlertCircle } from "lucide-react";
import { useNextDeadline } from "@/hooks/useNextDeadline";
import { useAuth } from "@/hooks/useAuth";
import { reminderService } from "@/services/reminderService";

const MONTHS = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]} ${y} г.`;
}
function urgencyColor(days) {
    if (days <= 7) return "#f87171";
    if (days <= 21) return "#FBBF24";
    return "var(--brand-cyan)";
}

export default function DeadlineReminder({ universityName = null }) {
    const deadline = useNextDeadline(universityName);
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState(user?.email || "");
    const [state, setState] = useState("idle"); // idle | loading | done | pending | error
    const [errMsg, setErrMsg] = useState("");

    // Показваме секцията само при срок в следващите ~45 дни — иначе е шум.
    if (!deadline || deadline.daysLeft > 45) return null;

    const color = urgencyColor(deadline.daysLeft);
    const daysText =
        deadline.daysLeft === 0 ? "днес е последният ден" :
        deadline.daysLeft === 1 ? "остава 1 ден" :
        `остават ${deadline.daysLeft} дни`;
    const kind = deadline.type === "application" ? "за кандидатстване" : "за приемния изпит";

    async function submit(e) {
        e.preventDefault();
        setErrMsg("");
        setState("loading");
        const res = await reminderService.subscribe({
            email,
            universityName: deadline.universityName,
            userId: user?.id || null,
        });
        if (!res?.ok) {
            setState("error");
            setErrMsg(res?.error === "invalid_email"
                ? "Провери имейл адреса."
                : "Нещо се обърка. Опитай пак след малко.");
            return;
        }
        if (res.alreadyConfirmed) { setState("done"); return; }
        setState(res.emailPending ? "pending" : "done");
    }

    return (
        <div style={{
            display: "flex", flexDirection: "column", gap: "0.625rem",
            padding: "0.875rem", borderRadius: "0.75rem",
            background: `${color === "var(--brand-cyan)" ? "rgba(6,182,212,0.06)" : color + "14"}`,
            border: `1px solid ${color === "var(--brand-cyan)" ? "rgba(6,182,212,0.2)" : color + "40"}`,
        }}>
            {/* Обратно броене */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <Clock size={15} style={{ color, flexShrink: 0, marginTop: "1px" }} strokeWidth={1.5} />
                <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--brand-text)" }}>
                    Срок <strong>{kind}</strong> в {deadline.universityName}: до{" "}
                    <strong style={{ fontFamily: "monospace" }}>{fmtDate(deadline.deadline)}</strong>
                    {" — "}
                    <strong style={{ color }}>{daysText}</strong>.
                    {deadline.sourceUrl && (
                        <>
                            {" "}
                            <a href={deadline.sourceUrl} target="_blank" rel="noopener noreferrer"
                               style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                Официален график
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Опт-ин */}
            {state === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", fontWeight: 600, color: "#10b981" }}>
                    <Check size={14} /> Записахме те. Ще ти пишем 7 и 1 дни преди срока.
                </div>
            )}
            {state === "pending" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
                    Записахме те. Имейлът за потвърждение тръгва скоро — активирай го, за да получаваш напомнянията.
                </div>
            )}

            {state !== "done" && state !== "pending" && (
                !open ? (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        style={{
                            alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.375rem",
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            fontSize: "12px", fontWeight: 700, color: "var(--brand-cyan)",
                        }}
                    >
                        <BellRing size={13} strokeWidth={2} /> Напомни ми по имейл <ArrowRight size={12} />
                    </button>
                ) : (
                    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <input
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="твоят имейл"
                                aria-label="Имейл за напомняния"
                                style={{
                                    flex: 1, minWidth: "12rem", height: "2.5rem", padding: "0 0.75rem",
                                    background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)",
                                    borderRadius: "0.625rem", color: "var(--brand-text)", fontSize: "13px", fontFamily: "inherit",
                                    outline: "none",
                                }}
                            />
                            <button
                                type="submit"
                                disabled={state === "loading"}
                                style={{
                                    height: "2.5rem", padding: "0 1rem", borderRadius: "0.625rem", border: "none",
                                    cursor: state === "loading" ? "wait" : "pointer",
                                    fontSize: "13px", fontWeight: 700, color: "#fff",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    opacity: state === "loading" ? 0.7 : 1,
                                }}
                            >
                                {state === "loading" ? "…" : "Запиши ме"}
                            </button>
                        </div>
                        {errMsg && (
                            <div style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>{errMsg}</div>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                            Само имейл. Отписване с един клик във всяко съобщение.{" "}
                            <Link to="/privacy/" style={{ color: "var(--brand-cyan)", textDecoration: "none" }}>Поверителност</Link>.
                        </div>
                    </form>
                )
            )}
        </div>
    );
}
