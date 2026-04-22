import { useState, useRef } from "react";
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
            const target = document.getElementById("main");
            if (!target) return;
            const canvas = await html2canvas(target, {
                scale: 1,
                useCORS: true,
                logging: false,
                backgroundColor: null,
            });
            const dataUrl = canvas.toDataURL("image/png", 0.8);
            setScreenshotData(dataUrl);
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
            if (uploadError) {
                console.warn("Screenshot upload failed:", uploadError.message);
                return null;
            }
            const { data: urlData } = supabase.storage.from("reports-screenshots").getPublicUrl(data.path);
            return urlData?.publicUrl || null;
        } catch {
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            setError("Моля, опишете проблема.");
            return;
        }
        setSending(true);
        setError("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Трябва да сте влезли в профила си.");
                setSending(false);
                return;
            }
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
            if (insertError) {
                setError("Грешка при изпращане: " + insertError.message);
                setSending(false);
                return;
            }
            setSent(true);
            setTimeout(() => closeModal(), 2000);
        } catch (err) {
            setError("Неочаквана грешка: " + err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
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
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(251,191,36,0.16)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(251,191,36,0.08)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"; }}
                title="Докладвай грешка"
            >
                <Flag size={13} />
                <span>Докладвай</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem",
                        background: "var(--brand-surface-2)",
                        backdropFilter: "blur(6px)",
                        animation: "fadeIn 0.2s ease-out",
                    }}
                >
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                    <div
                        ref={modalRef}
                        style={{
                            width: "100%",
                            maxWidth: "520px",
                            maxHeight: "90vh",
                            overflow: "auto",
                            background: "var(--brand-surface)",
                            backdropFilter: "blur(16px)",
                            border: "1px solid var(--brand-input-border)",
                            borderRadius: "1.25rem",
                            color: "var(--brand-text)",
                            boxShadow: "0 32px 80px var(--brand-shadow)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--brand-border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div
                                    style={{
                                        width: "2.25rem",
                                        height: "2.25rem",
                                        borderRadius: "0.625rem",
                                        background: "rgba(251,191,36,0.12)",
                                        border: "1px solid rgba(251,191,36,0.3)",
                                        color: "#fbbf24",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Докладвай грешка</h3>
                                    <p style={{ margin: "0.15rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>Помогни ни да подобрим данните</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "transparent", border: "1px solid var(--brand-input-border)", color: "var(--brand-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {sent ? (
                            <div style={{ padding: "2.5rem", textAlign: "center" }}>
                                <div
                                    style={{
                                        width: "3.5rem",
                                        height: "3.5rem",
                                        margin: "0 auto 1rem",
                                        borderRadius: "50%",
                                        background: "rgba(34,197,94,0.12)",
                                        border: "1px solid rgba(34,197,94,0.3)",
                                        color: "#86efac",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckCircle2 size={28} />
                                </div>
                                <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Благодарим!</h4>
                                <p style={{ margin: "0.5rem 0 0", fontSize: "13px", color: "var(--brand-muted)" }}>
                                    Докладът е изпратен успешно. Ще бъде прегледан от администратор.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                {(universityName || specialty) && (
                                    <div
                                        style={{
                                            padding: "0.75rem 0.875rem",
                                            background: "var(--brand-input-bg)",
                                            border: "1px solid var(--brand-border)",
                                            borderRadius: "0.625rem",
                                            fontSize: "12px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.25rem",
                                        }}
                                    >
                                        {universityName && (
                                            <p style={{ margin: 0, color: "var(--brand-muted)" }}>
                                                <span style={{ opacity: 0.6 }}>Университет:</span>{" "}
                                                <span style={{ color: "var(--brand-text)", fontWeight: 600 }}>{universityName}</span>
                                            </p>
                                        )}
                                        {specialty && (
                                            <p style={{ margin: 0, color: "var(--brand-muted)" }}>
                                                <span style={{ opacity: 0.6 }}>Специалност:</span>{" "}
                                                <span style={{ color: "var(--brand-text)", fontWeight: 600 }}>{specialty}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                                        Тип на проблема
                                    </label>
                                    <select
                                        value={reportType}
                                        onChange={e => setReportType(e.target.value)}
                                        style={{
                                            width: "100%",
                                            height: "2.5rem",
                                            padding: "0 0.75rem",
                                            background: "var(--brand-input-bg)",
                                            border: "1px solid var(--brand-input-border)",
                                            borderRadius: "0.5rem",
                                            color: "var(--brand-text)",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            fontFamily: "inherit",
                                            outline: "none",
                                        }}
                                    >
                                        {REPORT_TYPES.map(t => (
                                            <option key={t.value} value={t.value} style={{ background: "var(--brand-dropdown-bg)" }}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                                        Описание на проблема *
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        maxLength={1000}
                                        placeholder="Опишете какво е грешно и каква е вярната информация, ако я знаете..."
                                        style={{
                                            width: "100%",
                                            minHeight: "100px",
                                            padding: "0.75rem",
                                            background: "var(--brand-input-bg)",
                                            border: "1px solid var(--brand-input-border)",
                                            borderRadius: "0.5rem",
                                            color: "var(--brand-text)",
                                            fontSize: "13px",
                                            fontFamily: "inherit",
                                            outline: "none",
                                            resize: "vertical",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    <p style={{ margin: "0.3rem 0 0", textAlign: "right", fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6, fontFamily: "monospace" }}>
                                        {description.length}/1000
                                    </p>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                                        Скрийншот (автоматичен)
                                    </label>
                                    {screenshotData ? (
                                        <div style={{ position: "relative" }}>
                                            <img
                                                src={screenshotData}
                                                alt="Screenshot"
                                                style={{ width: "100%", maxHeight: "160px", objectFit: "cover", objectPosition: "top", border: "1px solid var(--brand-input-border)", borderRadius: "0.5rem" }}
                                            />
                                            <button
                                                onClick={() => setScreenshotData(null)}
                                                style={{
                                                    position: "absolute",
                                                    top: "0.5rem",
                                                    right: "0.5rem",
                                                    width: "1.5rem",
                                                    height: "1.5rem",
                                                    borderRadius: "50%",
                                                    background: "rgba(248,113,113,0.9)",
                                                    border: "none",
                                                    color: "#fff",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <X size={11} />
                                            </button>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: "0.5rem",
                                                    left: "0.5rem",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.25rem",
                                                    padding: "0.2rem 0.5rem",
                                                    background: "rgba(34,197,94,0.2)",
                                                    border: "1px solid rgba(34,197,94,0.4)",
                                                    borderRadius: "999px",
                                                    fontSize: "10px",
                                                    color: "#86efac",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <Camera size={10} /> Прикачен
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={takeScreenshot}
                                            style={{
                                                width: "100%",
                                                padding: "0.875rem",
                                                background: "transparent",
                                                border: "1px dashed var(--brand-border)",
                                                borderRadius: "0.5rem",
                                                color: "var(--brand-muted)",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.5rem",
                                                fontFamily: "inherit",
                                            }}
                                        >
                                            <Camera size={14} /> Направи скрийншот
                                        </button>
                                    )}
                                </div>

                                {error && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.625rem 0.75rem",
                                            background: "rgba(248,113,113,0.08)",
                                            border: "1px solid rgba(248,113,113,0.3)",
                                            borderRadius: "0.5rem",
                                            color: "#fca5a5",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <AlertTriangle size={14} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={sending || !description.trim()}
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem",
                                        background: sending || !description.trim() ? "rgba(148,163,184,0.15)" : "linear-gradient(135deg, #fbbf24, #f59e0b)",
                                        border: "none",
                                        borderRadius: "0.625rem",
                                        color: "var(--brand-bg)",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        cursor: sending || !description.trim() ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                        fontFamily: "inherit",
                                        boxShadow: sending || !description.trim() ? "none" : "0 10px 24px rgba(251,191,36,0.25)",
                                        opacity: sending || !description.trim() ? 0.6 : 1,
                                    }}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Изпращане...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} /> Изпрати доклад
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
