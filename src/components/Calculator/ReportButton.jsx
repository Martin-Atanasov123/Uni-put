import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Flag, Camera, Send, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

const REPORT_TYPES = [
    { value: "formula_error", label: "Грешна формула / коефициенти" },
    { value: "wrong_info", label: "Неточна информация (име, бал, степен)" },
    { value: "missing_specialty", label: "Липсваща специалност" },
    { value: "other", label: "Друго" },
];

export default function ReportButton({ universityName, specialty }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reportType, setReportType] = useState("formula_error");
    const [description, setDescription] = useState("");
    const [screenshotData, setScreenshotData] = useState(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const modalRef = useRef(null);

    const takeScreenshot = async () => {
        try {
            const target = document.getElementById("main") || document.body;
            const canvas = await html2canvas(target, {
                scale: 1,
                useCORS: true,
                logging: false,
                backgroundColor: null,
            });
            setScreenshotData(canvas.toDataURL("image/png", 0.8));
        } catch {
            setScreenshotData(null);
        }
    };

    const openModal = async () => {
        setIsOpen(true);
        setSent(false);
        setError("");
        setDescription("");
        setReportType("formula_error");
        await takeScreenshot();
    };

    const closeModal = () => {
        setIsOpen(false);
        setScreenshotData(null);
        setDescription("");
        setError("");
    };

    const uploadScreenshot = async dataUrl => {
        if (!dataUrl) return null;
        try {
            const blob = await (await fetch(dataUrl)).blob();
            const fileName = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
            const { data, error: uploadError } = await supabase.storage
                .from("reports-screenshots")
                .upload(fileName, blob, { contentType: "image/png" });
            if (uploadError) return null;
            const { data: urlData } = supabase.storage.from("reports-screenshots").getPublicUrl(data.path);
            return urlData?.publicUrl || null;
        } catch {
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) { setError("Моля, опишете проблема."); return; }
        setSending(true);
        setError("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Трябва да сте влезли в профила си."); setSending(false); return; }
            const screenshotUrl = await uploadScreenshot(screenshotData);
            const { error: insertError } = await supabase.from("reports").insert({
                user_id: user.id,
                university_name: universityName || null,
                specialty: specialty || null,
                report_type: reportType,
                description: description.trim(),
                screenshot_url: screenshotUrl,
                status: "open",
            });
            if (insertError) { setError("Грешка при изпращане: " + insertError.message); setSending(false); return; }
            setSent(true);
            setTimeout(() => closeModal(), 2000);
        } catch (err) {
            setError("Неочаквана грешка: " + err.message);
        } finally {
            setSending(false);
        }
    };

    // ── Input / label shared styles ───────────────────────────────────────────
    const labelStyle = {
        display: "block",
        fontSize: "10px",
        fontWeight: 800,
        color: "var(--brand-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "0.4rem",
    };
    const inputBase = {
        width: "100%",
        boxSizing: "border-box",
        background: "var(--brand-input-bg)",
        border: "1px solid var(--brand-input-border)",
        borderRadius: "0.625rem",
        color: "var(--brand-text)",
        fontSize: "13px",
        fontFamily: "inherit",
        outline: "none",
    };

    // ── Modal rendered via portal so Framer Motion transforms don't clip it ───
    const modal = isOpen ? (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                animation: "rb-fadeIn 0.2s ease-out",
            }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
            <style>{`
                @keyframes rb-fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
                @keyframes rb-spin   { to { transform:rotate(360deg); } }
                @media (max-width: 700px) { .rb-grid { grid-template-columns: 1fr !important; } }
            `}</style>

            {/* Modal card */}
            <div
                ref={modalRef}
                style={{
                    width: "100%",
                    maxWidth: "860px",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: "1.375rem",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
                    color: "var(--brand-text)",
                }}
            >
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.125rem 1.5rem",
                    borderBottom: "1px solid var(--brand-border)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                            width: "2.25rem", height: "2.25rem",
                            borderRadius: "0.625rem",
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.35)",
                            color: "#fbbf24",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                                Докладвай грешка
                            </p>
                            <p style={{ margin: "0.1rem 0 0", fontSize: "11px", color: "var(--brand-muted)" }}>
                                Помогни ни да подобрим данните
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeModal}
                        style={{
                            width: "2rem", height: "2rem",
                            borderRadius: "0.5rem",
                            background: "transparent",
                            border: "1px solid var(--brand-border)",
                            color: "var(--brand-muted)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* ── Body ───────────────────────────────────────────────────── */}
                {sent ? (
                    <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                        <div style={{
                            width: "3.5rem", height: "3.5rem",
                            margin: "0 auto 1rem",
                            borderRadius: "50%",
                            background: "rgba(34,197,94,0.12)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            color: "#86efac",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <CheckCircle2 size={26} />
                        </div>
                        <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Благодарим!</p>
                        <p style={{ margin: "0.5rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                            Докладът е изпратен успешно и ще бъде прегледан от администратор.
                        </p>
                    </div>
                ) : (
                    <div
                        className="rb-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0",
                            minHeight: "360px",
                        }}
                    >
                        {/* ── Left: Screenshot ─────────────────────────────── */}
                        <div style={{
                            padding: "1.375rem 1.5rem",
                            borderRight: "1px solid var(--brand-border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}>
                            <p style={labelStyle}>Скрийншот (автоматичен)</p>

                            {screenshotData ? (
                                <div style={{ position: "relative", flex: 1 }}>
                                    <img
                                        src={screenshotData}
                                        alt="Screenshot preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            minHeight: "240px",
                                            objectFit: "cover",
                                            objectPosition: "top",
                                            borderRadius: "0.625rem",
                                            border: "1px solid var(--brand-border)",
                                            display: "block",
                                        }}
                                    />
                                    {/* Remove screenshot */}
                                    <button
                                        onClick={() => setScreenshotData(null)}
                                        style={{
                                            position: "absolute", top: "0.5rem", right: "0.5rem",
                                            width: "1.625rem", height: "1.625rem",
                                            borderRadius: "50%",
                                            background: "rgba(15,15,15,0.75)",
                                            border: "1px solid rgba(248,113,113,0.5)",
                                            color: "#fca5a5",
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <X size={11} />
                                    </button>
                                    {/* Badge */}
                                    <span style={{
                                        position: "absolute", bottom: "0.5rem", left: "0.5rem",
                                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                        padding: "0.2rem 0.6rem",
                                        background: "rgba(16,185,129,0.18)",
                                        border: "1px solid rgba(16,185,129,0.35)",
                                        borderRadius: "999px",
                                        fontSize: "10px", fontWeight: 700, color: "#6ee7b7",
                                    }}>
                                        <Camera size={10} /> Прикачен
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={takeScreenshot}
                                    style={{
                                        flex: 1,
                                        minHeight: "240px",
                                        background: "var(--brand-surface-2)",
                                        border: "1.5px dashed var(--brand-border)",
                                        borderRadius: "0.75rem",
                                        color: "var(--brand-muted)",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.625rem",
                                        fontFamily: "inherit",
                                        transition: "border-color 0.2s, background 0.2s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; e.currentTarget.style.background = "rgba(6,182,212,0.04)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--brand-border)"; e.currentTarget.style.background = "var(--brand-surface-2)"; }}
                                >
                                    <Camera size={22} style={{ opacity: 0.5 }} />
                                    Направи скрийншот
                                </button>
                            )}
                        </div>

                        {/* ── Right: Form ──────────────────────────────────── */}
                        <div style={{
                            padding: "1.375rem 1.5rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}>
                            {/* Context info */}
                            {(universityName || specialty) && (
                                <div style={{
                                    padding: "0.75rem 1rem",
                                    background: "var(--brand-surface-2)",
                                    border: "1px solid var(--brand-border)",
                                    borderRadius: "0.625rem",
                                    fontSize: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.3rem",
                                }}>
                                    {universityName && (
                                        <p style={{ margin: 0 }}>
                                            <span style={{ color: "var(--brand-muted)", fontWeight: 500 }}>Университет: </span>
                                            <span style={{ color: "var(--brand-text)", fontWeight: 700 }}>{universityName}</span>
                                        </p>
                                    )}
                                    {specialty && (
                                        <p style={{ margin: 0 }}>
                                            <span style={{ color: "var(--brand-muted)", fontWeight: 500 }}>Специалност: </span>
                                            <span style={{ color: "var(--brand-text)", fontWeight: 700 }}>{specialty}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Report type */}
                            <div>
                                <label style={labelStyle}>Тип на проблема</label>
                                <select
                                    value={reportType}
                                    onChange={e => setReportType(e.target.value)}
                                    style={{
                                        ...inputBase,
                                        height: "2.75rem",
                                        padding: "0 0.875rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    {REPORT_TYPES.map(t => (
                                        <option key={t.value} value={t.value} style={{ background: "var(--brand-dropdown-bg)" }}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <label style={labelStyle}>Описание на проблема *</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    maxLength={1000}
                                    placeholder="Опишете какво е грешно и каква е вярната информация, ако я знаете..."
                                    style={{
                                        ...inputBase,
                                        flex: 1,
                                        minHeight: "110px",
                                        padding: "0.75rem",
                                        resize: "none",
                                        lineHeight: 1.6,
                                    }}
                                />
                                <p style={{ margin: "0.3rem 0 0", textAlign: "right", fontSize: "10px", color: "var(--brand-muted)", opacity: 0.55, fontFamily: "monospace" }}>
                                    {description.length}/1000
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.625rem 0.875rem",
                                    background: "rgba(248,113,113,0.08)",
                                    border: "1px solid rgba(248,113,113,0.3)",
                                    borderRadius: "0.625rem",
                                    color: "#fca5a5",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}>
                                    <AlertTriangle size={13} />
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={sending || !description.trim()}
                                style={{
                                    width: "100%",
                                    padding: "0.875rem",
                                    background: sending || !description.trim()
                                        ? "rgba(148,163,184,0.12)"
                                        : "linear-gradient(135deg,#fbbf24,#f59e0b)",
                                    border: "none",
                                    borderRadius: "0.75rem",
                                    color: sending || !description.trim() ? "var(--brand-muted)" : "var(--brand-bg)",
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    cursor: sending || !description.trim() ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    fontFamily: "inherit",
                                    boxShadow: sending || !description.trim() ? "none" : "0 8px 24px rgba(251,191,36,0.28)",
                                    opacity: sending || !description.trim() ? 0.55 : 1,
                                    transition: "opacity 0.2s",
                                }}
                            >
                                {sending
                                    ? <><Loader2 size={14} style={{ animation: "rb-spin 1s linear infinite" }} /> Изпращане...</>
                                    : <><Send size={14} /> Изпрати доклад</>
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={openModal}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.4rem 0.75rem",
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.25)",
                    borderRadius: "0.5rem",
                    color: "#fbbf24",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(251,191,36,0.16)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(251,191,36,0.08)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"; }}
                title="Докладвай грешка"
            >
                <Flag size={13} />
                <span>Докладвай</span>
            </button>

            {/* Modal — rendered at document.body to escape any transformed ancestor */}
            {typeof document !== "undefined" && createPortal(modal, document.body)}
        </>
    );
}
