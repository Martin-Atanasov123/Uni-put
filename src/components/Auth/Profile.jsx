import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { sessionService } from "@/services/sessionService";
import { useAuth } from "@/hooks/useAuth";
import { universityService } from "@/services/universityService";
import { reminderService } from "@/services/reminderService";
import { useUpcomingDeadlines } from "@/hooks/useNextDeadline";
import { loadGrades, ALL_CATEGORY_KEYS } from "@/lib/gradeStore";
import CalcStatsOptOut from "@/components/common/CalcStatsOptOut";
import { historyPoints, mergeCalculatorHistory, readLocalHistory } from "@/lib/calcHistory";
import {
    User,
    Mail,
    LogOut,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Shield,
    Lock,
    Activity,
    Heart,
    Calculator,
    ArrowRight,
    MapPin,
    GraduationCap,
    Trash2,
    Settings,
    Brain,
    Check,
    Target,
    Clock,
    CalendarClock,
    Bell,
    BellOff,
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
    const [riasecType, setRiasecType] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);

    const [user, setUser] = useState(null);
    const [favoriteDetails, setFavoriteDetails] = useState([]);
    const [calculatorHistory, setCalculatorHistory] = useState([]);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [myGradesFilled, setMyGradesFilled] = useState(0);
    const [reminders, setReminders] = useState([]);
    const [subscribingAll, setSubscribingAll] = useState(false);
    const [unsubscribingId, setUnsubscribingId] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        email: "",
    });

    // Университетите зад любимите (за да покажем сроковете им) — извежда се
    // от пълния favoriteDetails, не само последните 3.
    const favoriteUniversityNames = useMemo(
        () => [...new Set(favoriteDetails.map(f => f.university_name).filter(Boolean))],
        [favoriteDetails]
    );
    const upcomingDeadlines = useUpcomingDeadlines(favoriteUniversityNames);

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
                    }));
                    setRiasecType(
                        metadata.riasec_type ||
                        localStorage.getItem("riasec_result") ||
                        ""
                    );

                    if (favorites.length > 0) {
                        // Пълният списък (не само последните 3) — трябва ни за
                        // сроковете на ВСИЧКИ любими университети по-долу.
                        const details = await universityService.getByIds(favorites);
                        setFavoriteDetails(details);
                    } else {
                        setFavoriteDetails([]);
                    }

                    // Акаунт + браузър: калкулаторът пише в localStorage, а акаунтът се
                    // синхронизира при зареждане — без сливане ново изчисление не се
                    // вижда тук, докато страницата не се презареди.
                    const accountHistory = Array.isArray(metadata.calculator_history) ? metadata.calculator_history : [];
                    setCalculatorHistory(mergeCalculatorHistory(accountHistory, readLocalHistory()));

                    // Merge като в MyGrades.jsx: облакът има приоритет пред локалните.
                    const mergedGrades = { ...loadGrades(), ...(metadata.my_grades || {}) };
                    setMyGradesFilled([...ALL_CATEGORY_KEYS].filter(k => mergedGrades[k] && mergedGrades[k] !== "").length);

                    setReminders(await reminderService.getMine());
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

    // Извежда първата буква от username или email — за gradient circle avatar.
    // Avatar upload е премахнат напълно по UX решение; всички профили имат
    // единен initial-based avatar (като много модерни SaaS apps).
    const getUserInitials = () => {
        const username = formData.username?.trim();
        const email = user?.email || "";
        const source = (username || email.split("@")[0] || "").trim();
        return (source[0] || "У").toUpperCase();
    };

    // Истинско изтриване през Edge Function delete-account (service role —
    // само signOut() не трие нищо от auth.users, а бутонът обещаваше точно това).
    const handleDeleteAccount = async () => {
        if (deleteConfirmEmail !== user?.email) return;
        setDeletingAccount(true);
        try {
            const { data, error } = await supabase.functions.invoke("delete-account");
            if (error || !data?.ok) {
                let msg = "Изтриването не мина. Опитай пак или ни пиши.";
                try {
                    const body = await error?.context?.json?.();
                    if (body?.message) msg = body.message;
                } catch { /* тялото не е JSON — пазим генеричното съобщение */ }
                throw new Error(msg);
            }
            // Навигация ПРЕДИ logout: /profile е зад ProtectedRoute, което
            // рендерира собствен `<Navigate to="/login" replace>` в мига щом
            // signOut() изпразни user-а — и той печели надпреварата с ?deleted=1.
            navigate("/login?deleted=1", { replace: true });
            await sessionService.logout();
        } catch (err) {
            showMessage("error", err.message);
            setDeletingAccount(false);
        }
    };

    // Абонира текущия имейл за напомняния за ВСИЧКИ срокове (не само любимите
    // университети — субкрипцията е по имейл+университет=null, не по програма).
    const handleSubscribeAll = async () => {
        if (!user?.email) return;
        setSubscribingAll(true);
        const res = await reminderService.subscribe({ email: user.email, universityName: null, userId: user.id });
        if (res?.ok) {
            showMessage("success", res.emailPending
                ? "Записахме те. Имейлите тръгват, щом активираме услугата."
                : "Записахме те. Провери имейла си, за да потвърдиш.");
            setReminders(await reminderService.getMine());
        } else {
            showMessage("error", "Нещо се обърка. Опитай пак.");
        }
        setSubscribingAll(false);
    };

    const handleUnsubscribeReminder = async (row) => {
        setUnsubscribingId(row.id);
        const ok = await reminderService.unsubscribe(row.unsubscribe_token);
        if (ok) setReminders(prev => prev.filter(r => r.id !== row.id));
        setUnsubscribingId(null);
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
                        <div
                            style={{
                                width: "9rem",
                                height: "9rem",
                                borderRadius: "1.5rem",
                                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                border: "3px solid var(--brand-surface)",
                                boxShadow: "0 16px 40px var(--brand-shadow)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "4.5rem",
                                fontWeight: 900,
                                letterSpacing: "-0.04em",
                                fontFamily: "Inter, system-ui, sans-serif",
                                userSelect: "none",
                                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                            }}
                        >
                            {getUserInitials()}
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
                            { label: "Изчисли бал", done: calculatorHistory.length > 0, link: "/calculator", sub: calculatorHistory.length > 0 ? `${calculatorHistory.length} ${calculatorHistory.length === 1 ? "специалност" : "специалности"}` : "Пробвай калкулатора" },
                            { label: "Въведи оценките си", done: myGradesFilled > 0, link: "/my-grades", sub: myGradesFilled > 0 ? `${myGradesFilled} попълнени` : "Автоматично в калкулатора" },
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
                                        <Link to="/career-advisor/" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", fontWeight: 700, color: riasecInfo.color, textDecoration: "none", opacity: 0.8, whiteSpace: "nowrap" }}>
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
                                                    <Link to="/universities/" style={{ display: "inline-flex", padding: "0.4rem 0.875rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "0.5rem", color: "var(--brand-cyan)", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>
                                                        Търсене
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Deadlines за любимите + управление на имейл напомнянията */}
                                {favorites.length > 0 && (
                                    <div style={{ padding: "1.25rem 1.5rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-border)", borderRadius: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <CalendarClock size={15} style={{ color: "var(--brand-cyan)" }} />
                                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-cyan)" }}>Наближаващи срокове</span>
                                        </div>

                                        {upcomingDeadlines.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                                {upcomingDeadlines.slice(0, 4).map(d => (
                                                    <div key={`${d.universityName}-${d.deadline}`} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.75rem", background: "var(--brand-surface)", border: "1px solid var(--brand-border)", borderRadius: "0.75rem" }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.universityName}</p>
                                                            <p style={{ margin: "0.15rem 0 0", fontSize: "11px", color: "var(--brand-muted)" }}>
                                                                {d.type === "application" ? "Срок за кандидатстване" : "Приемен изпит"} · {new Date(d.deadline).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })}
                                                            </p>
                                                        </div>
                                                        <span style={{ flexShrink: 0, padding: "0.25rem 0.625rem", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: d.daysLeft <= 7 ? "rgba(248,113,113,0.12)" : "rgba(6,182,212,0.1)", color: d.daysLeft <= 7 ? "#fca5a5" : "var(--brand-cyan)" }}>
                                                            {d.daysLeft === 0 ? "днес" : d.daysLeft === 1 ? "утре" : `след ${d.daysLeft} дни`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: "12px", color: "var(--brand-muted)", fontStyle: "italic" }}>
                                                Няма предстоящи срокове за любимите ти университети в момента.
                                            </p>
                                        )}

                                        <div style={{ paddingTop: "0.875rem", borderTop: "1px solid var(--brand-border)" }}>
                                            {reminders.length > 0 ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)" }}>
                                                        <Bell size={11} style={{ verticalAlign: "-1px", marginRight: "0.3rem" }} />
                                                        Имейл напомняния
                                                    </span>
                                                    {reminders.map(r => (
                                                        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "12px" }}>
                                                            <span style={{ color: "var(--brand-text)" }}>
                                                                {r.university_name || "Всички университети"}
                                                                <span style={{ color: "var(--brand-muted)", fontWeight: 500 }}> · {r.confirmed_at ? "активно" : "чака потвърждение"}</span>
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUnsubscribeReminder(r)}
                                                                disabled={unsubscribingId === r.id}
                                                                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "none", border: "none", cursor: unsubscribingId === r.id ? "wait" : "pointer", color: "var(--brand-muted)", fontSize: "11px", fontWeight: 600, padding: 0, fontFamily: "inherit" }}
                                                            >
                                                                <BellOff size={12} /> Спри
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleSubscribeAll}
                                                    disabled={subscribingAll}
                                                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: subscribingAll ? "wait" : "pointer", color: "var(--brand-cyan)", fontSize: "12px", fontWeight: 700, padding: 0, fontFamily: "inherit" }}
                                                >
                                                    <Bell size={13} strokeWidth={2} /> Получавай напомняния по имейл <ArrowRight size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Calculator history */}
                                {calculatorHistory.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Моят прогрес по специалности</h3>
                                                <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>Изчисли пак със същия университет, когато оценките ти се променят — тук виждаш разликата.</p>
                                            </div>
                                            <Link to="/calculator/" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", fontWeight: 700, color: "var(--brand-cyan)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                Изчисли пак <ArrowRight size={11} />
                                            </Link>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                                            {(showAllHistory ? calculatorHistory : calculatorHistory.slice(0, 6)).map((h, i) => {
                                                const points = historyPoints(h);
                                                const prev = points.length > 1 ? points[points.length - 2] : null;
                                                const delta = prev ? Number(h.score) - Number(prev.score) : null;
                                                // Сравнение само срещу реален минимален бал; стари записи (без minBall) са неутрални.
                                                const hasMin = h.minBall != null;
                                                const above = hasMin && h.isAbove === true;
                                                return (
                                                <div key={i} style={{ padding: "1rem", background: "var(--brand-input-bg)", border: `1px solid ${above ? "rgba(16,185,129,0.25)" : "var(--brand-border)"}`, borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--brand-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.specialty || "Неизвестна"}</p>
                                                            <p style={{ margin: "0.2rem 0 0", fontSize: "10px", color: "var(--brand-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.university || h.faculty}</p>
                                                        </div>
                                                        <span style={{ fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 800, color: above ? "#34d399" : "var(--brand-text)", flexShrink: 0 }}>{h.score?.toFixed ? h.score.toFixed(2) : h.score}</span>
                                                    </div>
                                                    {points.length > 1 && <ScoreSparkline points={points} />}
                                                    {delta !== null && (
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: delta > 0 ? "#34d399" : delta < 0 ? "#fca5a5" : "var(--brand-muted)" }}>
                                                            {delta > 0 ? "▲ +" : delta < 0 ? "▼ −" : ""}{delta === 0 ? "Без промяна" : Math.abs(delta).toFixed(2) + " т."} спрямо {new Date(prev.date).toLocaleDateString("bg-BG", { day: "numeric", month: "short" })}
                                                        </span>
                                                    )}
                                                    {h.maxBall > 0 && (
                                                        <div style={{ height: "3px", background: "var(--brand-border)", borderRadius: "2px" }}>
                                                            <div style={{ height: "3px", borderRadius: "2px", background: hasMin ? (above ? "#34d399" : "rgba(248,113,113,0.6)") : "var(--brand-cyan)", width: `${Math.min((h.score / h.maxBall) * 100, 100)}%` }} />
                                                        </div>
                                                    )}
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontSize: "10px", color: hasMin ? (above ? "#34d399" : "#fca5a5") : "var(--brand-muted)", fontWeight: 700 }}>
                                                            {hasMin
                                                                ? (above ? `Над минималния (${Number(h.minBall).toFixed(2)})` : `Под минималния (${Number(h.minBall).toFixed(2)})`)
                                                                : (h.maxBall > 0 ? `${Math.min((h.score / h.maxBall) * 100, 100).toFixed(0)}% от макс. бал` : "")}
                                                        </span>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6 }}>
                                                            <Clock size={9} /> {h.date ? new Date(h.date).toLocaleDateString("bg-BG", { day: "numeric", month: "short" }) : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        {calculatorHistory.length > 6 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllHistory(v => !v)}
                                                style={{ alignSelf: "center", minHeight: "44px", padding: "0 1.25rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                                            >
                                                {showAllHistory ? "Покажи по-малко" : `Покажи всички (${calculatorHistory.length})`}
                                            </button>
                                        )}
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
                                        <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "var(--brand-muted)" }}>Изпращаме линк за смяна на паролата на {user?.email}.</p>
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
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--brand-muted)", lineHeight: 1.6 }}>
                                Данните ти не се показват на други потребители и не се продават на трети страни.
                                Виж пълните подробности в{" "}
                                <Link to="/privacy" style={{ color: "var(--brand-cyan)" }}>Политиката за поверителност</Link>.
                            </p>
                            <CalcStatsOptOut />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function ScoreSparkline({ points }) {
    const scores = points.map(p => Number(p.score));
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const y = (s) => (max === min ? 12 : 21 - ((s - min) / (max - min)) * 18);
    const x = (i) => (i / (points.length - 1)) * 100;
    const coords = scores.map((s, i) => `${x(i).toFixed(1)},${y(s).toFixed(1)}`).join(" ");
    return (
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={`Бал през времето: ${scores.map(s => s.toFixed(2)).join(", ")}`} style={{ width: "100%", height: "28px", overflow: "visible" }}>
            <polyline points={coords} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

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

export default Profile;
