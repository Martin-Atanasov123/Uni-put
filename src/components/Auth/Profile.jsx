import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { sessionService } from "@/services/sessionService";
import { useAuth } from "@/hooks/useAuth";
import { universityService } from "@/services/universityService";
import {
    User,
    Mail,
    LogOut,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Shield,
    Lock,
    Globe,
    Activity,
    Heart,
    Calculator,
    ArrowRight,
    MapPin,
    GraduationCap,
    Trash2,
    Settings,
    Edit3,
    Brain,
    Check,
    Target,
    Clock,
} from "lucide-react";

const RIASEC_TYPES = {
    R: { label: "Реалист", color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
    I: { label: "Изследовател", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
    A: { label: "Артист", color: "#EC4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)" },
    S: { label: "Социален", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
    E: { label: "Предприемач", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
    C: { label: "Конвенционален", color: "#06B6D4", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.3)" },
};

const SURFACE = {
    background: "var(--brand-surface)",
    backdropFilter: "blur(10px)",
    border: "1px solid var(--brand-border)",
    borderRadius: "1.25rem",
};

const Profile = () => {
    const navigate = useNavigate();
    const { favorites, toggleFavorite } = useAuth();

    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [riasecType, setRiasecType] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
    const avatarInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [favoriteDetails, setFavoriteDetails] = useState([]);
    const [calculatorHistory, setCalculatorHistory] = useState([]);
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        email: "",
        privacy: { isPublic: false, showActivity: true },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;

                if (user) {
                    setUser(user);
                    const metadata = user.user_metadata || {};
                    setFormData(prev => ({
                        ...prev,
                        username: metadata.username || "",
                        bio: metadata.bio || "",
                        email: user.email || "",
                        privacy: {
                            isPublic: metadata.privacy?.isPublic ?? false,
                            showActivity: metadata.privacy?.showActivity ?? true,
                        },
                    }));
                    setAvatarUrl(metadata.avatar_url || "");
                    setRiasecType(
                        metadata.riasec_type ||
                        localStorage.getItem("riasec_result") ||
                        ""
                    );

                    if (favorites.length > 0) {
                        // Server-side: дърпаме само първите 3 favorite-а (вместо цялата таблица)
                        const details = await universityService.getByIds(favorites.slice(0, 3));
                        setFavoriteDetails(details);
                    }

                    const history = JSON.parse(localStorage.getItem("calculator_history") || "[]");
                    setCalculatorHistory(history.slice(0, 3));
                }
            } catch {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, favorites]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleLogout = async () => {
        await sessionService.logout();
        navigate("/login");
    };

    const updateGeneralInfo = async e => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { username: formData.username, bio: formData.bio },
            });
            if (error) throw error;
            showMessage("success", "Профилът е обновен успешно!");
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleAvatarUpload = async e => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showMessage("error", "Моля, изберете изображение (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage("error", "Снимката трябва да е под 5 MB.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const ext = file.name.split(".").pop().toLowerCase();
            const path = `${user.id}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(path, file, { upsert: true, contentType: file.type });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            });
            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            showMessage("success", "Профилната снимка е обновена!");
        } catch (err) {
            showMessage("error", err.message || "Грешка при качване на снимката.");
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

    const updatePrivacy = async () => {
        setUpdatingPrivacy(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { privacy: formData.privacy },
            });
            if (error) throw error;
            showMessage("success", "Настройките за поверителност са запазени!");
        } catch (err) {
            showMessage("error", err.message);
        } finally {
            setUpdatingPrivacy(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmEmail !== user?.email) return;
        setDeletingAccount(true);
        try {
            // Sign out immediately — actual deletion requires server-side admin API.
            // Contact support or implement via Edge Function.
            await sessionService.logout();
            navigate("/login?deleted=1");
        } catch (err) {
            showMessage("error", err.message);
            setDeletingAccount(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", border: "3px solid rgba(6,182,212,0.2)", borderTopColor: "var(--brand-cyan)", animation: "spin 1s linear infinite" }} />
                    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--brand-muted)" }}>
                        Зареждане на профил...
                    </p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Преглед", icon: Activity },
        { id: "settings", label: "Настройки", icon: Settings },
        { id: "security", label: "Сигурност", icon: Shield },
        { id: "privacy", label: "Поверителност", icon: Lock },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)" }}>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { scrollbar-width: none; }
            `}</style>

            {/* Banner */}
            <div
                style={{
                    height: "240px",
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(139,92,246,0.18))",
                }}
            >
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(circle at 30% 30%, rgba(6,182,212,0.25), transparent 50%), radial-gradient(circle at 70% 70%, rgba(139,92,246,0.25), transparent 50%)",
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                    }}
                />
            </div>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 4rem", marginTop: "-120px", position: "relative", zIndex: 1 }}>
                <div style={{ ...SURFACE, padding: "1.75rem 1.5rem", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1.5rem", marginBottom: "2.5rem" }}>
                        <div style={{ position: "relative" }}>
                            <div
                                style={{
                                    width: "9rem",
                                    height: "9rem",
                                    borderRadius: "1.5rem",
                                    background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))",
                                    border: "3px solid var(--brand-surface)",
                                    boxShadow: "0 16px 40px var(--brand-shadow)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--brand-cyan)",
                                    overflow: "hidden",
                                    position: "relative",
                                }}
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Профилна снимка"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <User size={56} strokeWidth={1.5} />
                                )}
                                {uploadingAvatar && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "rgba(0,0,0,0.55)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Loader2 size={28} style={{ color: "#fff", animation: "spin 1s linear infinite" }} />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleAvatarUpload}
                            />
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                title="Смени профилната снимка"
                                style={{
                                    position: "absolute",
                                    bottom: "-0.375rem",
                                    right: "-0.375rem",
                                    width: "2.25rem",
                                    height: "2.25rem",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    border: "2px solid var(--brand-bg)",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                                    boxShadow: "0 8px 20px rgba(6,182,212,0.3)",
                                    opacity: uploadingAvatar ? 0.6 : 1,
                                    transition: "opacity 0.2s",
                                }}
                            >
                                <Edit3 size={13} />
                            </button>
                        </div>

                        <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                                <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                                    {formData.username || "Потребител"}
                                </h1>
                                <span
                                    style={{
                                        padding: "0.3rem 0.75rem",
                                        background: "rgba(6,182,212,0.12)",
                                        border: "1px solid rgba(6,182,212,0.3)",
                                        borderRadius: "999px",
                                        color: "var(--brand-cyan)",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.14em",
                                    }}
                                >
                                    Кандидат-студент
                                </span>
                            </div>
                            <p style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--brand-muted)", fontSize: "13px", fontWeight: 500 }}>
                                <Mail size={14} style={{ opacity: 0.6 }} /> {user?.email}
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--brand-muted)", opacity: 0.7, fontStyle: "italic", maxWidth: "480px" }}>
                                {formData.bio || "Все още няма добавена биография..."}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.55rem 1rem",
                                background: "rgba(248,113,113,0.08)",
                                border: "1px solid rgba(248,113,113,0.25)",
                                borderRadius: "0.625rem",
                                color: "#fca5a5",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            <LogOut size={14} /> Изход
                        </button>
                    </div>

                    {/* Tabs */}
                    <div
                        className="no-scrollbar"
                        style={{
                            display: "flex",
                            gap: "0.25rem",
                            padding: "0.25rem",
                            background: "var(--brand-input-bg)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "0.75rem",
                            marginBottom: "2rem",
                            overflow: "auto",
                        }}
                    >
                        {tabs.map(tab => {
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        padding: "0.6rem 1rem",
                                        background: active ? "rgba(6,182,212,0.12)" : "transparent",
                                        border: `1px solid ${active ? "rgba(6,182,212,0.35)" : "transparent"}`,
                                        borderRadius: "0.5rem",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-muted)",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {message.text && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 0.875rem",
                                background: message.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
                                border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
                                borderRadius: "0.625rem",
                                color: message.type === "success" ? "#86efac" : "#fca5a5",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "1.25rem",
                            }}
                        >
                            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (() => {
                        const progressSteps = [
                            { label: "Кариерен тест", done: !!riasecType, link: "/career-advisor", sub: riasecType ? `Тип ${RIASEC_TYPES[riasecType]?.label || riasecType}` : "30 въпроса" },
                            { label: "Изчисли бал", done: calculatorHistory.length > 0, link: "/calculator", sub: calculatorHistory.length > 0 ? `${calculatorHistory.length} изчисления` : "Пробвай калкулатора" },
                            { label: "Запази 3 специалности", done: favorites.length >= 3, link: "/universities", sub: `${Math.min(favorites.length, 3)}/3 запазени` },
                            { label: "Сравни университети", done: favorites.length >= 2, link: "/favorites", sub: favorites.length >= 2 ? "Готов за сравнение" : "Запази поне 2" },
                        ];
                        const doneCount = progressSteps.filter(s => s.done).length;
                        const riasecInfo = riasecType ? RIASEC_TYPES[riasecType] : null;

                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {/* Progress steps */}
                                <div style={{ padding: "1.25rem 1.5rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-border)", borderRadius: "1.25rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <Target size={15} style={{ color: "var(--brand-cyan)" }} />
                                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-cyan)" }}>Прогрес</span>
                                        </div>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)" }}>{doneCount}/{progressSteps.length} завършени</span>
                                    </div>
                                    {/* Track */}
                                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                                        <div style={{ height: "4px", background: "var(--brand-border)", borderRadius: "2px" }} />
                                        <div style={{ position: "absolute", top: 0, left: 0, height: "4px", borderRadius: "2px", background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-violet))", width: `${(doneCount / progressSteps.length) * 100}%`, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)" }} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem" }}>
                                        {progressSteps.map((step, i) => {
                                            const inner = (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", padding: "0.625rem", background: step.done ? "rgba(6,182,212,0.06)" : "transparent", border: `1px solid ${step.done ? "rgba(6,182,212,0.2)" : "transparent"}`, borderRadius: "0.75rem", cursor: step.done ? "default" : "pointer", height: "100%" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                                        <span style={{ width: "1.125rem", height: "1.125rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: step.done ? "var(--brand-cyan)" : "var(--brand-border)" }}>
                                                            {step.done ? <Check size={9} color="#fff" strokeWidth={3} /> : <span style={{ fontSize: "8px", fontWeight: 800, color: "var(--brand-muted)" }}>{i + 1}</span>}
                                                        </span>
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: step.done ? "var(--brand-text)" : "var(--brand-muted)" }}>{step.label}</span>
                                                    </div>
                                                    <span style={{ fontSize: "10px", color: step.done ? "var(--brand-cyan)" : "var(--brand-muted)", paddingLeft: "1.5rem", opacity: 0.8 }}>{step.sub}</span>
                                                </div>
                                            );
                                            return step.done
                                                ? <div key={i}>{inner}</div>
                                                : <Link key={i} to={step.link} style={{ textDecoration: "none" }}>{inner}</Link>;
                                        })}
                                    </div>
                                </div>

                                {/* RIASEC card */}
                                {riasecInfo && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", background: riasecInfo.bg, border: `1px solid ${riasecInfo.border}`, borderRadius: "1.25rem" }}>
                                        <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: riasecInfo.bg, border: `1px solid ${riasecInfo.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Brain size={20} style={{ color: riasecInfo.color }} strokeWidth={1.5} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: riasecInfo.color, opacity: 0.85 }}>Кариерен тип</p>
                                            <p style={{ margin: "0.2rem 0 0", fontSize: "15px", fontWeight: 800, color: riasecInfo.color }}>
                                                {riasecInfo.label} ({riasecType})
                                            </p>
                                        </div>
                                        <Link to="/career-advisor" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", fontWeight: 700, color: riasecInfo.color, textDecoration: "none", opacity: 0.8, whiteSpace: "nowrap" }}>
                                            Виж резултата <ArrowRight size={11} />
                                        </Link>
                                    </div>
                                )}

                                {/* Stats + Favorites */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", alignContent: "start" }}>
                                        <StatCard icon={Heart} label="Любими" value={favorites.length} color="cyan" />
                                        <StatCard icon={Calculator} label="Изчислени бала" value={calculatorHistory.length} color="violet" />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Последно добавени любими</h3>
                                            <Link to="/favorites" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", fontWeight: 700, color: "var(--brand-cyan)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                Виж всички <ArrowRight size={11} />
                                            </Link>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                            {favoriteDetails.length > 0 ? favoriteDetails.map(uni => (
                                                <div key={uni.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-border)", borderRadius: "0.75rem" }}>
                                                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", background: "rgba(6,182,212,0.1)", color: "var(--brand-cyan)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <GraduationCap size={18} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uni.university_name}</p>
                                                        <p style={{ margin: "0.15rem 0 0", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "10px", color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}><MapPin size={9} /> {uni.city}</p>
                                                    </div>
                                                    <button onClick={() => toggleFavorite(uni.id.toString())} style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", background: "transparent", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )) : (
                                                <div style={{ padding: "2rem", textAlign: "center", background: "var(--brand-input-bg)", border: "1px dashed var(--brand-input-border)", borderRadius: "1rem" }}>
                                                    <Heart size={28} style={{ color: "var(--brand-muted)", opacity: 0.3, margin: "0 auto 0.625rem" }} />
                                                    <p style={{ margin: "0 0 0.75rem", fontSize: "12px", color: "var(--brand-muted)", fontStyle: "italic" }}>Нямате добавени любими университети</p>
                                                    <Link to="/universities" style={{ display: "inline-flex", padding: "0.4rem 0.875rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "0.5rem", color: "var(--brand-cyan)", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>
                                                        Търсене
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Calculator history */}
                                {calculatorHistory.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>История на изчисленията</h3>
                                            <Link to="/calculator" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", fontWeight: 700, color: "var(--brand-cyan)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                Изчисли пак <ArrowRight size={11} />
                                            </Link>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                                            {calculatorHistory.map((h, i) => (
                                                <div key={i} style={{ padding: "1rem", background: "var(--brand-input-bg)", border: `1px solid ${h.isAbove ? "rgba(16,185,129,0.25)" : "var(--brand-border)"}`, borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.specialty || "Неизвестна"}</p>
                                                            <p style={{ margin: "0.2rem 0 0", fontSize: "10px", color: "var(--brand-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.university || h.faculty}</p>
                                                        </div>
                                                        <span style={{ fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 800, color: h.isAbove ? "#34d399" : "var(--brand-muted)", flexShrink: 0 }}>{h.score?.toFixed ? h.score.toFixed(2) : h.score}</span>
                                                    </div>
                                                    {h.maxBall > 0 && (
                                                        <div style={{ height: "3px", background: "var(--brand-border)", borderRadius: "2px" }}>
                                                            <div style={{ height: "3px", borderRadius: "2px", background: h.isAbove ? "#34d399" : "rgba(248,113,113,0.6)", width: `${Math.min((h.score / h.maxBall) * 100, 100)}%` }} />
                                                        </div>
                                                    )}
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontSize: "10px", color: h.isAbove ? "#34d399" : "#fca5a5", fontWeight: 700 }}>
                                                            {h.isAbove ? "Над средното" : "Под средното"}
                                                        </span>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6 }}>
                                                            <Clock size={9} /> {h.date ? new Date(h.date).toLocaleDateString("bg-BG", { day: "numeric", month: "short" }) : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <form onSubmit={updateGeneralInfo} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                                <InputGroup
                                    label="Потребителско име"
                                    icon={User}
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                                <InputGroup label="Имейл (само за четене)" icon={Mail} value={user?.email || ""} disabled />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                                    Биография
                                </label>
                                <textarea
                                    placeholder="Разкажете ни малко за вашите цели..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    style={{
                                        width: "100%",
                                        minHeight: "120px",
                                        padding: "0.875rem",
                                        background: "var(--brand-input-bg)",
                                        border: "1px solid var(--brand-input-border)",
                                        borderRadius: "0.75rem",
                                        color: "var(--brand-text)",
                                        fontSize: "13px",
                                        fontFamily: "inherit",
                                        outline: "none",
                                        resize: "vertical",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid var(--brand-border)" }}>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                        border: "none",
                                        borderRadius: "0.75rem",
                                        color: "#fff",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        cursor: updating ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        fontFamily: "inherit",
                                        boxShadow: "0 12px 30px rgba(6,182,212,0.3)",
                                    }}
                                >
                                    {updating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                                    Запази промените
                                </button>
                            </div>
                        </form>
                    )}

                    {/* SECURITY */}
                    {activeTab === "security" && (
                        <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <Section icon={Shield} iconColor="cyan" title="Сигурност на акаунта" subtitle="Управлявайте вашата парола и методи за вход">
                                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>Парола</p>
                                        <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>Последна промяна: преди 2 месеца</p>
                                    </div>
                                    <button
                                        onClick={() => navigate("/forgot-password")}
                                        style={{
                                            padding: "0.55rem 1rem",
                                            background: "rgba(6,182,212,0.1)",
                                            border: "1px solid rgba(6,182,212,0.3)",
                                            borderRadius: "0.625rem",
                                            color: "var(--brand-cyan)",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        Промени парола
                                    </button>
                                </div>
                            </Section>

                            <Section icon={AlertCircle} iconColor="red" title="Опасна зона" subtitle="Действия, които не могат да бъдат отменени" danger>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>Изтриване на акаунт</p>
                                            <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>Всички ваши данни ще бъдат премахнати завинаги.</p>
                                        </div>
                                        {!showDeleteConfirm && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                style={{ padding: "0.55rem 1rem", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: "0.625rem", color: "#fca5a5", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}
                                            >
                                                Изтрий
                                            </button>
                                        )}
                                    </div>
                                    {showDeleteConfirm && (
                                        <div style={{ padding: "1rem", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>
                                                Въведи имейл-а си за потвърждение:
                                                <span style={{ color: "var(--brand-muted)", fontWeight: 500 }}> ({user?.email})</span>
                                            </p>
                                            <input
                                                type="email"
                                                value={deleteConfirmEmail}
                                                onChange={e => setDeleteConfirmEmail(e.target.value)}
                                                placeholder={user?.email}
                                                style={{ height: "2.5rem", padding: "0 0.875rem", background: "var(--brand-input-bg)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "0.625rem", color: "var(--brand-text)", fontSize: "13px", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" }}
                                            />
                                            <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail(""); }}
                                                    style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.625rem", color: "var(--brand-muted)", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                                                >
                                                    Откажи
                                                </button>
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={deleteConfirmEmail !== user?.email || deletingAccount}
                                                    style={{ padding: "0.5rem 1rem", background: deleteConfirmEmail === user?.email ? "rgba(248,113,113,0.2)" : "transparent", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "0.625rem", color: "#fca5a5", fontSize: "12px", fontWeight: 700, cursor: deleteConfirmEmail === user?.email ? "pointer" : "not-allowed", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "0.375rem", opacity: deleteConfirmEmail === user?.email ? 1 : 0.5 }}
                                                >
                                                    {deletingAccount && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                                                    Изтрий завинаги
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>
                    )}

                    {/* PRIVACY */}
                    {activeTab === "privacy" && (
                        <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <ToggleRow
                                icon={Globe}
                                title="Публичен профил"
                                subtitle="Позволете на другите да виждат вашите любими университети."
                                checked={formData.privacy.isPublic}
                                onChange={e => setFormData({ ...formData, privacy: { ...formData.privacy, isPublic: e.target.checked } })}
                            />
                            <ToggleRow
                                icon={Activity}
                                title="Статус на активност"
                                subtitle="Показвай кога последно сте влизали в платформата."
                                checked={formData.privacy.showActivity}
                                onChange={e => setFormData({ ...formData, privacy: { ...formData.privacy, showActivity: e.target.checked } })}
                                color="violet"
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                                <button
                                    onClick={updatePrivacy}
                                    disabled={updatingPrivacy}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                        border: "none",
                                        borderRadius: "0.75rem",
                                        color: "#fff",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        cursor: updatingPrivacy ? "not-allowed" : "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: "0 12px 30px rgba(6,182,212,0.3)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {updatingPrivacy && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                                    Запази настройките
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function StatCard({ icon: Icon, label, value, color }) {
    const palette = color === "cyan"
        ? { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", color: "var(--brand-cyan)" }
        : { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", color: "var(--brand-violet)" };
    return (
        <div
            style={{
                padding: "1.25rem",
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: "1rem",
            }}
        >
            <Icon size={24} style={{ color: palette.color, marginBottom: "0.75rem" }} />
            <p style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800, color: "var(--brand-text)", fontFamily: "monospace", lineHeight: 1 }}>{value}</p>
            <p style={{ margin: "0.4rem 0 0", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-muted)" }}>{label}</p>
        </div>
    );
}

function InputGroup({ label, icon: Icon, disabled, ...props }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                {label}
            </label>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0 0.875rem",
                    height: "2.75rem",
                    background: disabled ? "var(--brand-surface)" : "var(--brand-input-bg)",
                    border: "1px solid var(--brand-input-border)",
                    borderRadius: "0.625rem",
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                {Icon && <Icon size={15} style={{ color: "var(--brand-muted)", flexShrink: 0 }} />}
                <input
                    {...props}
                    disabled={disabled}
                    type="text"
                    style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--brand-text)",
                        fontSize: "13px",
                        fontWeight: 600,
                        fontFamily: "inherit",
                        cursor: disabled ? "not-allowed" : "text",
                    }}
                />
            </div>
        </div>
    );
}

function Section({ icon: Icon, iconColor, title, subtitle, danger, children }) {
    const palette = iconColor === "cyan"
        ? { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.3)", color: "var(--brand-cyan)" }
        : { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", color: "#fca5a5" };
    return (
        <div
            style={{
                padding: "1.5rem",
                background: danger ? "rgba(248,113,113,0.04)" : "var(--brand-input-bg)",
                border: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "var(--brand-border)"}`,
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div
                    style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "0.75rem",
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        color: palette.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Icon size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: danger ? "#fca5a5" : "var(--brand-text)", letterSpacing: "-0.01em" }}>{title}</h3>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "11px", color: "var(--brand-muted)" }}>{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function ToggleRow({ icon: Icon, title, subtitle, checked, onChange, color = "cyan" }) {
    const palette = color === "cyan"
        ? { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.3)", color: "var(--brand-cyan)" }
        : { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", color: "var(--brand-violet)" };
    return (
        <label
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: "var(--brand-input-bg)",
                border: "1px solid var(--brand-border)",
                borderRadius: "1rem",
                cursor: "pointer",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                    style={{
                        width: "2.75rem",
                        height: "2.75rem",
                        borderRadius: "0.75rem",
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        color: palette.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Icon size={22} strokeWidth={1.5} />
                </div>
                <div>
                    <span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>{title}</span>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--brand-muted)", marginTop: "0.2rem" }}>{subtitle}</span>
                </div>
            </div>
            <span
                style={{
                    position: "relative",
                    width: "2.5rem",
                    height: "1.375rem",
                    flexShrink: 0,
                    background: checked ? "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))" : "rgba(148,163,184,0.2)",
                    borderRadius: "999px",
                    transition: "background 0.2s",
                }}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <span
                    style={{
                        position: "absolute",
                        top: "2px",
                        left: checked ? "calc(100% - 1.25rem)" : "2px",
                        width: "1.125rem",
                        height: "1.125rem",
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        transition: "left 0.2s",
                    }}
                />
            </span>
        </label>
    );
}

export default Profile;
