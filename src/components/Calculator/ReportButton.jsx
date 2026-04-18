// Модул: Бутон за докладване на грешки в калкулатора
// Описание: Позволява потребителите да докладват неточни формули или грешна информация.
//   Прави скрийншот на текущото състояние, качва го в Supabase Storage
//   и записва доклад в таблицата reports.
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
            // Скрийшот на целия main елемент (калкулатора)
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
            // При грешка просто не добавяме скрийншот
            setScreenshotData(null);
        }
    };

    const openModal = async () => {
        setIsOpen(true);
        setSent(false);
        setError("");
        setDescription("");
        setReportType("formula_error");
        // Автоматично правим скрийншот при отваряне
        await takeScreenshot();
    };

    const closeModal = () => {
        setIsOpen(false);
        setScreenshotData(null);
        setDescription("");
        setError("");
    };

    const uploadScreenshot = async (dataUrl) => {
        if (!dataUrl) return null;
        try {
            const blob = await (await fetch(dataUrl)).blob();
            const fileName = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
            const { data, error: uploadError } = await supabase.storage
                .from("reports-screenshots")
                .upload(fileName, blob, { contentType: "image/png" });
            if (uploadError) {
                // Ако bucket-а не съществува, пропускаме скрийшота
                console.warn("Screenshot upload failed:", uploadError.message);
                return null;
            }
            const { data: urlData } = supabase.storage
                .from("reports-screenshots")
                .getPublicUrl(data.path);
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

            // Качваме скрийншота
            const screenshotUrl = await uploadScreenshot(screenshotData);

            // Записваме доклада
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
            {/* Floating Report Button */}
            <button
                onClick={openModal}
                className="btn btn-ghost btn-sm gap-1.5 text-warning hover:bg-warning/10 rounded-xl opacity-70 hover:opacity-100 transition-all"
                title="Докладвай грешка"
            >
                <Flag size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline text-xs font-bold">Докладвай</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-base-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-base-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-warning" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">Докладвай грешка</h3>
                                    <p className="text-xs opacity-50 font-medium">Помогни ни да подобрим данните</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="btn btn-ghost btn-sm btn-circle">
                                <X size={18} />
                            </button>
                        </div>

                        {sent ? (
                            /* Success state */
                            <div className="p-10 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} className="text-success" />
                                </div>
                                <h4 className="text-xl font-black">Благодарим!</h4>
                                <p className="text-sm opacity-60 font-medium">
                                    Докладът е изпратен успешно. Ще бъде прегледан от администратор.
                                </p>
                            </div>
                        ) : (
                            /* Form */
                            <div className="p-6 space-y-5">
                                {/* Context info */}
                                {(universityName || specialty) && (
                                    <div className="p-3 bg-base-200/60 rounded-xl text-xs font-semibold space-y-1">
                                        {universityName && (
                                            <p className="opacity-60">
                                                <span className="opacity-40">Университет:</span> {universityName}
                                            </p>
                                        )}
                                        {specialty && (
                                            <p className="opacity-60">
                                                <span className="opacity-40">Специалност:</span> {specialty}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Report type */}
                                <div>
                                    <label className="text-xs font-black uppercase opacity-40 mb-2 block">
                                        Тип на проблема
                                    </label>
                                    <select
                                        className="select select-bordered w-full rounded-xl font-semibold"
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                    >
                                        {REPORT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-black uppercase opacity-40 mb-2 block">
                                        Описание на проблема *
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full rounded-xl font-medium min-h-[100px] resize-y"
                                        placeholder="Опишете какво е грешно и каква е вярната информация, ако я знаете..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        maxLength={1000}
                                    />
                                    <p className="text-[10px] opacity-30 font-bold text-right mt-1">
                                        {description.length}/1000
                                    </p>
                                </div>

                                {/* Screenshot preview */}
                                <div>
                                    <label className="text-xs font-black uppercase opacity-40 mb-2 block">
                                        Скрийншот (автоматичен)
                                    </label>
                                    {screenshotData ? (
                                        <div className="relative group">
                                            <img
                                                src={screenshotData}
                                                alt="Screenshot"
                                                className="w-full rounded-xl border border-base-200 shadow-sm max-h-40 object-cover object-top"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button
                                                    onClick={() => setScreenshotData(null)}
                                                    className="btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Премахни"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 badge badge-sm badge-success gap-1 font-bold">
                                                <Camera size={10} /> Прикачен
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={takeScreenshot}
                                            className="btn btn-ghost btn-sm w-full rounded-xl border-2 border-dashed border-base-300 gap-2 opacity-50 hover:opacity-100"
                                        >
                                            <Camera size={14} />
                                            <span className="text-xs font-bold">Направи скрийншот</span>
                                        </button>
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="alert alert-error rounded-xl text-sm font-bold py-2">
                                        <AlertTriangle size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={sending || !description.trim()}
                                    className="btn btn-warning w-full rounded-xl font-black text-sm gap-2"
                                >
                                    {sending ? (
                                        <><Loader2 size={16} className="animate-spin" /> Изпращане...</>
                                    ) : (
                                        <><Send size={16} /> Изпрати доклад</>
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
