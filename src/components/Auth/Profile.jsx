import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { sessionService } from "@/services/sessionService";
import { useAuth } from "@/hooks/useAuth";
import { universityService } from "@/services/universityService";
import { reminderService } from "@/services/reminderService";
import { useUpcomingDeadlines } from "@/hooks/useNextDeadline";
import { loadGrades, ALL_CATEGORY_KEYS } from "@/lib/gradeStore";
import CalcStatsOptOut from "@/components/common/CalcStatsOptOut";
import Seo from "@/components/common/Seo";
import { historyPoints, mergeCalculatorHistory, readLocalHistory } from "@/lib/calcHistory";
import {
    Mail, LogOut, Loader2, CheckCircle2, AlertCircle, Shield, Lock, LayoutGrid,
    ArrowRight, MapPin, Trash2, UserRound, Check, Clock, Bell, BellOff,
} from "lucide-react";

// Профил — редизайн ноември 2026. Логиката (данни, срокове, напомняния,
// изтриване на акаунт) е същата; сменена е само подредбата и визията:
// странична навигация на широк екран, чипове на телефон, табло с „следваща стъпка“.

const RIASEC_TYPES = {
    R: { label: "Реалист" },
    I: { label: "Изследовател" },
    A: { label: "Артист" },
    S: { label: "Социален" },
    E: { label: "Предприемач" },
    C: { label: "Конвенционален" },
};

const TABS = [
    { id: "overview", label: "Преглед", icon: LayoutGrid },
    { id: "settings", label: "Лични данни", icon: UserRound },
    { id: "security", label: "Сигурност", icon: Shield },
    { id: "privacy", label: "Поверителност", icon: Lock },
];

function Sticker({ name, size = 40, className = "" }) {
    return <img src={`/illustrations/stickers/${name}.webp`} alt="" aria-hidden="true" width={size} height={size} decoding="async" className={`pf-sticker ${className}`} />;
}

const daysWord = (n) => (n === 0 ? "по-малко от ден" : n === 1 ? "1 ден" : `${n} дни`);

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
    const [formData, setFormData] = useState({ username: "", bio: "", email: "" });

    // Университетите зад любимите (за сроковете им) — от пълния favoriteDetails.
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
                    setRiasecType(metadata.riasec_type || localStorage.getItem("riasec_result") || "");

                    if (favorites.length > 0) {
                        setFavoriteDetails(await universityService.getByIds(favorites));
                    } else {
                        setFavoriteDetails([]);
                    }

                    // Акаунт + браузър: калкулаторът пише в localStorage, акаунтът се
                    // синхронизира при зареждане — сливаме, за да се вижда новото веднага.
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
            const { error } = await supabase.auth.updateUser({ data: { username: formData.username, bio: formData.bio } });
            if (error) throw error;
            showMessage("success", "Запазихме промените.");
        } catch {
            showMessage("error", "Не успяхме да запазим промените. Опитай пак.");
        } finally {
            setUpdating(false);
        }
    };

    const getUserInitials = () => {
        const source = (formData.username?.trim() || (user?.email || "").split("@")[0] || "").trim();
        return (source[0] || "У").toUpperCase();
    };

    // Истинско изтриване през Edge Function delete-account (service role).
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
            // Навигация ПРЕДИ logout: иначе ProtectedRoute печели надпреварата с ?deleted=1.
            navigate("/login?deleted=1", { replace: true });
            await sessionService.logout();
        } catch (err) {
            showMessage("error", err.message);
            setDeletingAccount(false);
        }
    };

    // Абонира имейла за напомняния за ВСИЧКИ срокове (университет = null).
    const handleSubscribeAll = useCallback(async () => {
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
    }, [user]);

    const handleUnsubscribeReminder = async (row) => {
        setUnsubscribingId(row.id);
        const ok = await reminderService.unsubscribe(row.unsubscribe_token);
        if (ok) setReminders(prev => prev.filter(r => r.id !== row.id));
        setUnsubscribingId(null);
    };

    // Едно конкретно следващо действие — всяка проверка има смисъл само ако предишната е свършена.
    const nextAction = useMemo(() => {
        if (!riasecType) {
            return { title: "Направи кариерния тест", text: "30 въпроса показват кои специалности пасват на интересите ти.", cta: "Направи теста", link: "/career-advisor" };
        }
        if (calculatorHistory.length === 0) {
            const typeLabel = RIASEC_TYPES[riasecType]?.label || riasecType;
            return { title: "Изчисли своя бал", text: `Типът ти е ${typeLabel}. Сега провери шансовете си за специалностите, които те интересуват.`, cta: "Към калкулатора", link: "/calculator" };
        }
        if (favorites.length === 0) {
            return { title: "Запази специалност в любими", text: "Така сравняваш университети и следиш сроковете им.", cta: "Разгледай университети", link: "/universities" };
        }
        if (myGradesFilled === 0) {
            return { title: "Въведи оценките си веднъж", text: "Калкулаторът ще ги попълва сам на всяко устройство.", cta: "Моите оценки", link: "/my-grades" };
        }
        const urgent = upcomingDeadlines[0];
        if (urgent && reminders.length === 0) {
            return { title: `Наближава срок: ${urgent.universityName}`, text: `Остават ${daysWord(urgent.daysLeft)}. Включи имейл напомняния, за да не го изпуснеш.`, cta: "Получавай напомняния", onClick: handleSubscribeAll };
        }
        if (favorites.length < 2) {
            return { title: "Запази още една специалност", text: "С две любими можеш да ги сравниш една до друга.", cta: "Разгледай университети", link: "/universities" };
        }
        return { title: "Сравни любимите си", text: `Имаш ${favorites.length} запазени специалности. Виж къде шансовете ти са най-добри.`, cta: "Към любимите", link: "/favorites" };
    }, [riasecType, calculatorHistory.length, favorites.length, myGradesFilled, upcomingDeadlines, reminders.length, handleSubscribeAll]);

    if (loading) {
        return (
            <div className="pf pf--loading" role="status">
                <style>{CSS}</style>
                <Loader2 size={28} className="pf-spin" aria-hidden="true" />
                <p>Зареждаме профила ти…</p>
            </div>
        );
    }

    const riasecLabel = riasecType ? (RIASEC_TYPES[riasecType]?.label || riasecType) : null;
    // Пълните резултати са само в този браузър (в акаунта се пази типът).
    const hasSavedRiasecResults = (() => {
        try { return !!JSON.parse(localStorage.getItem("riasec_last_results") || "null")?.scores; } catch { return false; }
    })();

    const steps = [
        { label: "Кариерен тест", done: !!riasecType, link: "/career-advisor", sub: riasecLabel ? `Тип ${riasecLabel}` : "30 въпроса" },
        { label: "Изчисли бал", done: calculatorHistory.length > 0, link: "/calculator", sub: calculatorHistory.length > 0 ? `${calculatorHistory.length} ${calculatorHistory.length === 1 ? "специалност" : "специалности"}` : "Пробвай калкулатора" },
        { label: "Въведи оценките", done: myGradesFilled > 0, link: "/my-grades", sub: myGradesFilled > 0 ? `${myGradesFilled} попълнени` : "Попълват се сами" },
        { label: "Запази 3 специалности", done: favorites.length >= 3, link: "/universities", sub: `${Math.min(favorites.length, 3)} от 3` },
        { label: "Сравни университети", done: favorites.length >= 2, link: "/favorites", sub: favorites.length >= 2 ? "Готов за сравнение" : "Трябват поне 2" },
    ];
    const doneCount = steps.filter(s => s.done).length;
    const displayName = formData.username || (user?.email || "").split("@")[0] || "Твоят профил";

    return (
        <div className="pf">
            <Seo title="Профил" path="/profile" noindex />
            <style>{CSS}</style>
            <div className="pf-wrap">
                {/* ── Шапка ── */}
                <header className="pf-head">
                    <div className="pf-avatar" aria-hidden="true">{getUserInitials()}</div>
                    <div className="pf-head__text">
                        <p className="pf-eyebrow">Кандидат-студент</p>
                        <h1 className="pf-h1">{displayName}</h1>
                        <p className="pf-head__mail"><Mail size={15} strokeWidth={1.75} aria-hidden="true" /> {user?.email}</p>
                    </div>
                    <button type="button" className="pf-btn pf-btn--ghost pf-head__out" onClick={handleLogout}>
                        <LogOut size={16} strokeWidth={1.75} aria-hidden="true" /> Изход
                    </button>
                </header>

                <div className="pf-layout">
                    {/* ── Навигация: колона на широк екран, чипове на телефон ── */}
                    <nav className="pf-nav" aria-label="Раздели на профила">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                className="pf-nav__item"
                                aria-current={activeTab === t.id ? "page" : undefined}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <t.icon size={18} strokeWidth={1.75} aria-hidden="true" /> {t.label}
                            </button>
                        ))}
                        <div className="pf-nav__progress" aria-hidden="true">
                            <span>Прогрес</span>
                            <b>{doneCount} от {steps.length}</b>
                            <i><em style={{ width: `${(doneCount / steps.length) * 100}%` }} /></i>
                        </div>
                    </nav>

                    <div className="pf-main">
                        {message.text && (
                            <p className={`pf-alert pf-alert--${message.type}`} role={message.type === "error" ? "alert" : "status"}>
                                {message.type === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
                                {message.text}
                            </p>
                        )}

                        {activeTab === "overview" && (
                            <>
                                {/* Следваща стъпка */}
                                <section className="pf-next" aria-labelledby="pf-next-t">
                                    <Sticker name="compass" size={64} className="pf-next__st" />
                                    <div className="pf-next__text">
                                        <p className="pf-next__tag">Следваща стъпка</p>
                                        <h2 id="pf-next-t">{nextAction.title}</h2>
                                        <p>{nextAction.text}</p>
                                    </div>
                                    {nextAction.link ? (
                                        <Link to={nextAction.link} className="pf-next__cta">{nextAction.cta} <ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></Link>
                                    ) : (
                                        <button type="button" className="pf-next__cta" onClick={nextAction.onClick} disabled={subscribingAll}>
                                            {nextAction.cta} <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                                        </button>
                                    )}
                                </section>

                                {/* Числата */}
                                <dl className="pf-stats">
                                    <Link to="/favorites" className="pf-stat"><dt>Любими</dt><dd>{favorites.length}</dd></Link>
                                    <Link to="/calculator" className="pf-stat"><dt>Изчислени бала</dt><dd>{calculatorHistory.length}</dd></Link>
                                    <Link to="/my-grades" className="pf-stat"><dt>Попълнени оценки</dt><dd>{myGradesFilled}</dd></Link>
                                    <Link to={hasSavedRiasecResults ? "/career-advisor/?view=results" : "/career-advisor/"} className="pf-stat">
                                        <dt>Кариерен тип</dt>
                                        <dd className={riasecLabel ? "pf-stat__word" : undefined}>{riasecLabel || "—"}</dd>
                                    </Link>
                                </dl>

                                {/* Пътят: пет спирки */}
                                <section className="pf-card" aria-labelledby="pf-path-t">
                                    <div className="pf-card__head">
                                        <h2 id="pf-path-t" className="pf-h2">Твоят път</h2>
                                        <span className="pf-muted">{doneCount} от {steps.length} стъпки</span>
                                    </div>
                                    <ol className="pf-path">
                                        {steps.map((s, i) => {
                                            const inner = (
                                                <>
                                                    <span className="pf-path__dot" aria-hidden="true">{s.done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                                                    <span className="pf-path__text"><b>{s.label}</b><small>{s.sub}</small></span>
                                                    <span className="sr-only">{s.done ? " — готово" : " — предстои"}</span>
                                                </>
                                            );
                                            return (
                                                <li key={s.label} data-done={s.done}>
                                                    {s.done ? <div className="pf-path__step">{inner}</div> : <Link to={s.link} className="pf-path__step">{inner}</Link>}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </section>

                                <div className="pf-cols">
                                    {/* Любими */}
                                    <section className="pf-card" aria-labelledby="pf-fav-t">
                                        <div className="pf-card__head">
                                            <h2 id="pf-fav-t" className="pf-h2">Любими специалности</h2>
                                            {favoriteDetails.length > 0 && <Link to="/favorites" className="pf-link">Всички <ArrowRight size={15} aria-hidden="true" /></Link>}
                                        </div>
                                        {favoriteDetails.length > 0 ? (
                                            <ul className="pf-list">
                                                {favoriteDetails.slice(0, 5).map(uni => (
                                                    <li key={uni.id}>
                                                        <span className="pf-list__text">
                                                            <b>{uni.specialty || uni.university_name}</b>
                                                            <small><MapPin size={12} aria-hidden="true" /> {uni.specialty ? `${uni.university_name}, ` : ""}{uni.city}</small>
                                                        </span>
                                                        <button type="button" className="pf-icon-btn" onClick={() => toggleFavorite(uni.id.toString())} aria-label={`Махни ${uni.specialty || uni.university_name} от любими`}>
                                                            <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="pf-empty">
                                                <Sticker name="star" size={48} />
                                                <p>Все още нямаш запазени специалности. Намери такава, която те интересува, и я добави тук.</p>
                                                <Link to="/universities/" className="pf-btn pf-btn--ghost">Разгледай университети</Link>
                                            </div>
                                        )}
                                    </section>

                                    {/* Срокове + напомняния */}
                                    <section className="pf-card" aria-labelledby="pf-dl-t">
                                        <div className="pf-card__head">
                                            <h2 id="pf-dl-t" className="pf-h2">Срокове</h2>
                                        </div>
                                        {upcomingDeadlines.length > 0 ? (
                                            <ul className="pf-list">
                                                {upcomingDeadlines.slice(0, 4).map(d => (
                                                    <li key={`${d.universityName}-${d.deadline}`}>
                                                        <span className="pf-list__text">
                                                            <b>{d.universityName}</b>
                                                            <small>{d.type === "application" ? "Кандидатстване" : "Приемен изпит"} · {new Date(d.deadline).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })}</small>
                                                        </span>
                                                        <span className={`pf-pill${d.daysLeft <= 7 ? " pf-pill--soon" : ""}`}>
                                                            {d.daysLeft === 0 ? "днес" : d.daysLeft === 1 ? "утре" : `след ${d.daysLeft} дни`}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="pf-muted pf-pad">
                                                {favorites.length > 0 ? "Няма предстоящи срокове за любимите ти университети." : "Запази специалност и тук ще виждаш сроковете на университета ѝ."}
                                            </p>
                                        )}
                                        <div className="pf-remind">
                                            {reminders.length > 0 ? (
                                                <>
                                                    <p className="pf-remind__title"><Bell size={15} aria-hidden="true" /> Имейл напомняния</p>
                                                    <ul className="pf-remind__list">
                                                        {reminders.map(r => (
                                                            <li key={r.id}>
                                                                <span>{r.university_name || "Всички университети"} <small>· {r.confirmed_at ? "активно" : "чака потвърждение"}</small></span>
                                                                <button type="button" className="pf-text-btn" onClick={() => handleUnsubscribeReminder(r)} disabled={unsubscribingId === r.id}>
                                                                    <BellOff size={14} aria-hidden="true" /> Спри
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            ) : (
                                                <button type="button" className="pf-text-btn pf-text-btn--brand" onClick={handleSubscribeAll} disabled={subscribingAll}>
                                                    <Bell size={15} aria-hidden="true" /> Получавай напомняния по имейл
                                                </button>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* История на изчисленията */}
                                {calculatorHistory.length > 0 && (
                                    <section className="pf-card" aria-labelledby="pf-hist-t">
                                        <div className="pf-card__head">
                                            <div>
                                                <h2 id="pf-hist-t" className="pf-h2">Моят прогрес по специалности</h2>
                                                <p className="pf-muted">Изчисли пак, когато оценките ти се променят — тук виждаш разликата.</p>
                                            </div>
                                            <Link to="/calculator/" className="pf-link">Изчисли пак <ArrowRight size={15} aria-hidden="true" /></Link>
                                        </div>
                                        <ul className="pf-hist">
                                            {(showAllHistory ? calculatorHistory : calculatorHistory.slice(0, 6)).map((h, i) => {
                                                const points = historyPoints(h);
                                                const prev = points.length > 1 ? points[points.length - 2] : null;
                                                const delta = prev ? Number(h.score) - Number(prev.score) : null;
                                                const hasMin = h.minBall != null;
                                                const above = hasMin && h.isAbove === true;
                                                const pct = h.maxBall > 0 ? Math.min((h.score / h.maxBall) * 100, 100) : null;
                                                return (
                                                    <li key={i} className="pf-hist__item" data-state={hasMin ? (above ? "above" : "below") : "none"}>
                                                        <div className="pf-hist__top">
                                                            <span className="pf-list__text">
                                                                <b>{h.specialty || "Неизвестна"}</b>
                                                                <small>{h.university || h.faculty}</small>
                                                            </span>
                                                            <span className="pf-hist__score">{h.score?.toFixed ? h.score.toFixed(2) : h.score}</span>
                                                        </div>
                                                        {points.length > 1 && <ScoreSparkline points={points} />}
                                                        {pct !== null && <i className="pf-hist__bar"><em style={{ width: `${pct}%` }} /></i>}
                                                        <div className="pf-hist__meta">
                                                            <span className="pf-hist__verdict">
                                                                {hasMin
                                                                    ? (above ? `Над минималния (${Number(h.minBall).toFixed(2)})` : `Под минималния (${Number(h.minBall).toFixed(2)})`)
                                                                    : (pct !== null ? `${pct.toFixed(0)}% от максималния бал` : "")}
                                                            </span>
                                                            <span className="pf-muted"><Clock size={12} aria-hidden="true" /> {h.date ? new Date(h.date).toLocaleDateString("bg-BG", { day: "numeric", month: "short" }) : ""}</span>
                                                        </div>
                                                        {delta !== null && (
                                                            <span className="pf-hist__delta" data-dir={delta > 0 ? "up" : delta < 0 ? "down" : "same"}>
                                                                {delta === 0 ? "Без промяна" : `${delta > 0 ? "▲ +" : "▼ −"}${Math.abs(delta).toFixed(2)} т.`} спрямо {new Date(prev.date).toLocaleDateString("bg-BG", { day: "numeric", month: "short" })}
                                                            </span>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        {calculatorHistory.length > 6 && (
                                            <button type="button" className="pf-btn pf-btn--ghost pf-center" onClick={() => setShowAllHistory(v => !v)}>
                                                {showAllHistory ? "Покажи по-малко" : `Покажи всички (${calculatorHistory.length})`}
                                            </button>
                                        )}
                                    </section>
                                )}
                            </>
                        )}

                        {activeTab === "settings" && (
                            <section className="pf-card pf-narrow" aria-labelledby="pf-set-t">
                                <h2 id="pf-set-t" className="pf-h2">Лични данни</h2>
                                <p className="pf-muted">Името се вижда само от теб. Не е задължително.</p>
                                <form className="pf-form" onSubmit={updateGeneralInfo}>
                                    <div className="pf-form__row">
                                        <label className="pf-field">
                                            <span>Име</span>
                                            <input type="text" autoComplete="nickname" maxLength={60} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                        </label>
                                        <label className="pf-field">
                                            <span>Имейл</span>
                                            <input type="email" value={user?.email || ""} disabled />
                                        </label>
                                    </div>
                                    <label className="pf-field">
                                        <span>За мен <small>(по желание)</small></span>
                                        <textarea rows={4} maxLength={500} placeholder="Например: искам да уча информатика в Пловдив" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                                    </label>
                                    <button type="submit" className="pf-btn pf-btn--primary" disabled={updating}>
                                        {updating && <Loader2 size={16} className="pf-spin" aria-hidden="true" />} Запази промените
                                    </button>
                                </form>
                            </section>
                        )}

                        {activeTab === "security" && (
                            <>
                                <section className="pf-card pf-narrow" aria-labelledby="pf-pw-t">
                                    <h2 id="pf-pw-t" className="pf-h2">Парола</h2>
                                    <div className="pf-row">
                                        <p className="pf-muted">Ще ти пратим линк за смяна на паролата на {user?.email}.</p>
                                        <button type="button" className="pf-btn pf-btn--ghost" onClick={() => navigate("/forgot-password")}>Смени паролата</button>
                                    </div>
                                </section>
                                <section className="pf-card pf-card--danger pf-narrow" aria-labelledby="pf-del-t">
                                    <h2 id="pf-del-t" className="pf-h2">Изтриване на профила</h2>
                                    <p className="pf-muted">Изтриваме акаунта, любимите и оценките ти завинаги. Това не може да се върне.</p>
                                    {!showDeleteConfirm ? (
                                        <button type="button" className="pf-btn pf-btn--danger" onClick={() => setShowDeleteConfirm(true)}>Изтрий профила</button>
                                    ) : (
                                        <div className="pf-confirm">
                                            <label className="pf-field">
                                                <span>За да потвърдиш, напиши имейла си ({user?.email})</span>
                                                <input type="email" autoComplete="off" value={deleteConfirmEmail} onChange={e => setDeleteConfirmEmail(e.target.value)} />
                                            </label>
                                            <div className="pf-confirm__actions">
                                                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail(""); }}>Откажи</button>
                                                <button type="button" className="pf-btn pf-btn--danger" onClick={handleDeleteAccount} disabled={deleteConfirmEmail !== user?.email || deletingAccount}>
                                                    {deletingAccount && <Loader2 size={16} className="pf-spin" aria-hidden="true" />} Изтрий завинаги
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {activeTab === "privacy" && (
                            <section className="pf-card pf-narrow" aria-labelledby="pf-priv-t">
                                <h2 id="pf-priv-t" className="pf-h2">Поверителност</h2>
                                <p className="pf-muted">
                                    Данните ти не се показват на други хора и не се продават. Подробностите са в{" "}
                                    <Link to="/privacy" className="pf-link pf-link--inline">политиката за поверителност</Link>.
                                </p>
                                <CalcStatsOptOut />
                            </section>
                        )}
                    </div>
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
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={`Бал през времето: ${scores.map(s => s.toFixed(2)).join(", ")}`} className="pf-spark">
            <polyline points={coords} fill="none" stroke="var(--brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

const CSS = `
.pf { min-height: 100vh; background: var(--canvas); color: var(--ink); padding: calc(var(--header-h) + 24px) 0 64px; }
@media (min-width: 960px) { .pf { padding-top: calc(var(--header-h) + 48px); } }
.pf--loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--ink-muted); }
.pf .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.pf-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 64px); box-sizing: border-box; }
.pf-spin { animation: pf-spin 0.9s linear infinite; }
@keyframes pf-spin { to { transform: rotate(360deg); } }
.pf-sticker { display: inline-block; flex-shrink: 0; object-fit: contain; pointer-events: none; user-select: none; }
.pf-muted { margin: 0; font-size: 15px; line-height: 1.55; color: var(--ink-muted); }
.pf-muted svg { vertical-align: -2px; }
.pf-pad { padding: 4px 0 12px; }
.pf-h1 { margin: 2px 0 0; font-family: var(--font-display); font-size: clamp(26px, 3.2vw, 40px); line-height: 1.1; font-weight: 750; letter-spacing: -0.02em; overflow-wrap: anywhere; text-wrap: balance; }
.pf-h2 { margin: 0; font-family: var(--font-display); font-size: 19px; line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; text-wrap: balance; }
.pf-eyebrow { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brand); }

/* Шапка */
.pf-head { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
@media (min-width: 640px) { .pf-head { grid-template-columns: auto minmax(0, 1fr) auto; gap: 20px; } }
.pf-avatar { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 18px; background: var(--brand); color: var(--on-brand); font-family: var(--font-display); font-size: 30px; font-weight: 800; }
@media (min-width: 960px) { .pf-avatar { width: 84px; height: 84px; border-radius: 22px; font-size: 40px; } }
.pf-head__mail { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 15px; color: var(--ink-muted); overflow-wrap: anywhere; }
.pf-head__out { grid-column: 1 / -1; justify-self: start; }
@media (min-width: 640px) { .pf-head__out { grid-column: auto; justify-self: end; } }

/* Подредба */
.pf-layout { display: grid; gap: 20px; margin-top: 20px; }
@media (min-width: 960px) { .pf-layout { grid-template-columns: 232px minmax(0, 1fr); gap: 40px; margin-top: 32px; align-items: start; } }
.pf-main { display: grid; gap: 20px; min-width: 0; }

.pf-nav { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 calc(-1 * clamp(16px, 4vw, 64px)); padding: 2px clamp(16px, 4vw, 64px); }
.pf-nav::-webkit-scrollbar { display: none; }
.pf-nav__item { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; min-height: 44px; padding: 0 16px; border: 1px solid var(--border-strong); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: 15px; font-weight: 650; cursor: pointer; transition: border-color 0.14s ease, background-color 0.14s ease, color 0.14s ease; }
.pf-nav__item:hover { border-color: var(--brand); color: var(--brand); }
.pf-nav__item[aria-current="page"] { background: var(--ink); border-color: var(--ink); color: var(--canvas); }
.pf-nav__item:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.pf-nav__progress { display: none; }
@media (min-width: 960px) {
  .pf-nav { position: sticky; top: calc(var(--header-h) + 24px); flex-direction: column; gap: 4px; overflow: visible; margin: 0; padding: 0; }
  .pf-nav__item { justify-content: flex-start; min-height: 48px; border-color: transparent; border-radius: var(--radius-control); background: transparent; }
  .pf-nav__item:hover { background: var(--surface); border-color: var(--border); color: var(--ink); }
  .pf-nav__item[aria-current="page"] { background: var(--surface); border-color: var(--border); color: var(--brand); box-shadow: inset 3px 0 0 var(--brand); }
  .pf-nav__progress { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 20px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-feature); background: var(--surface); font-size: 14px; }
  .pf-nav__progress span { color: var(--ink-muted); font-weight: 600; }
  .pf-nav__progress b { font-variant-numeric: tabular-nums; }
  .pf-nav__progress i { grid-column: 1 / -1; display: block; height: 6px; border-radius: 3px; background: var(--surface-subtle); overflow: hidden; }
  .pf-nav__progress em { display: block; height: 100%; border-radius: 3px; background: var(--brand); transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
}

.pf-alert { display: flex; align-items: center; gap: 8px; margin: 0; padding: 12px 14px; border-radius: var(--radius-control); font-size: 15px; font-weight: 600; border: 1px solid; }
.pf-alert--success { color: var(--success); border-color: color-mix(in srgb, var(--success) 40%, transparent); background: color-mix(in srgb, var(--success) 8%, transparent); }
.pf-alert--error { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, transparent); background: color-mix(in srgb, var(--danger) 8%, transparent); }

/* Следваща стъпка: тъмната карта на марката */
.pf-next { position: relative; display: grid; gap: 16px; padding: 22px; border-radius: var(--radius-feature); background: var(--inverse-bg); color: var(--inverse-text); animation: pf-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
@media (min-width: 760px) { .pf-next { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 20px; padding: 28px; } }
.pf-next__tag { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--signal); }
.pf-next h2 { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(20px, 2vw, 24px); line-height: 1.25; font-weight: 700; text-wrap: balance; }
.pf-next p:not(.pf-next__tag) { margin: 6px 0 0; max-width: 56ch; font-size: 15px; line-height: 1.55; color: var(--inverse-muted); }
.pf-next__st { position: absolute; top: -14px; right: 14px; width: 52px; height: 52px; transform: rotate(10deg); }
@media (min-width: 760px) { .pf-next__st { position: static; width: 64px; height: 64px; transform: rotate(-6deg); } }
.pf-next__cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 22px; border: 0; border-radius: var(--radius-control); background: var(--signal); color: var(--on-signal); font: inherit; font-weight: 750; text-decoration: none; white-space: nowrap; cursor: pointer; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.pf-next__cta:hover { transform: translateY(-2px); color: var(--on-signal); }
.pf-next__cta:active { transform: translateY(0); }
.pf-next__cta:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.pf-next__cta:disabled { opacity: 0.7; cursor: wait; }
@keyframes pf-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* Числата */
.pf-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }
@media (min-width: 760px) { .pf-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; } }
.pf-stat { display: flex; flex-direction: column-reverse; justify-content: flex-end; gap: 4px; min-height: 96px; padding: 16px; box-sizing: border-box; border: 1px solid var(--border); border-radius: var(--radius-feature); background: var(--surface); color: var(--ink); text-decoration: none; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.14s ease; }
.pf-stat:hover { transform: translateY(-2px); border-color: var(--brand); color: var(--ink); }
.pf-stat dt { font-size: 13px; font-weight: 650; color: var(--ink-muted); }
.pf-stat dd { margin: 0; font-family: var(--font-display); font-size: 34px; line-height: 1.05; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.pf-stat dd.pf-stat__word { font-size: 20px; line-height: 1.3; padding-top: 6px; overflow-wrap: anywhere; }

/* Карти */
.pf-card { display: grid; gap: 14px; padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-feature); background: var(--surface); min-width: 0; }
@media (min-width: 760px) { .pf-card { padding: 24px; } }
.pf-card--danger { border-color: color-mix(in srgb, var(--danger) 35%, var(--border)); }
.pf-card__head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 8px 16px; }
.pf-card__head .pf-muted { margin-top: 4px; font-size: 14px; }
.pf-narrow { max-width: 680px; }
.pf-cols { display: grid; gap: 20px; }
@media (min-width: 1100px) { .pf-cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; } }
.pf-link { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: -12px 0; font-size: 15px; font-weight: 700; color: var(--brand); text-decoration: none; }
.pf-link:hover { color: var(--brand-hover); }
.pf-link--inline { display: inline; min-height: 0; margin: 0; text-decoration: underline; text-underline-offset: 3px; }

/* Пътят */
.pf-path { list-style: none; margin: 0; padding: 0; display: grid; }
.pf-path li { position: relative; }
.pf-path li:not(:last-child)::after { content: ""; position: absolute; left: 15px; top: 40px; bottom: -6px; width: 2px; background: var(--border-strong); }
.pf-path li[data-done="true"]:not(:last-child)::after { background: var(--brand); }
.pf-path__step { display: flex; align-items: flex-start; gap: 14px; min-height: 56px; padding: 6px 0; color: var(--ink); text-decoration: none; }
a.pf-path__step:hover b { color: var(--brand); }
.pf-path__dot { position: relative; z-index: 1; display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border-strong); background: var(--surface); font-size: 13px; font-weight: 800; color: var(--ink-muted); box-sizing: border-box; }
.pf-path li[data-done="true"] .pf-path__dot { border-color: var(--brand); background: var(--brand); color: var(--on-brand); }
.pf-path__text b { display: block; font-size: 15px; font-weight: 700; padding-top: 5px; }
.pf-path__text small { display: block; margin-top: 2px; font-size: 13px; color: var(--ink-muted); }
@media (min-width: 960px) {
  .pf-path { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .pf-path li:not(:last-child)::after { left: 40px; right: -12px; top: 21px; bottom: auto; width: auto; height: 2px; }
  .pf-path__step { flex-direction: column; gap: 10px; padding: 6px 0 0; }
  .pf-path__text b { padding-top: 0; }
}

/* Списъци */
.pf-list { list-style: none; margin: 0; padding: 0; }
.pf-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; padding: 8px 0; border-top: 1px solid var(--border); }
.pf-list__text { min-width: 0; flex: 1; }
.pf-list__text b { display: block; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-list__text small { display: flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 13px; color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-icon-btn { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border: 1px solid var(--border); border-radius: var(--radius-control); background: transparent; color: var(--ink-muted); cursor: pointer; transition: color 0.14s ease, border-color 0.14s ease; }
.pf-icon-btn:hover { color: var(--danger); border-color: var(--danger); }
.pf-icon-btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.pf-pill { flex-shrink: 0; padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 700; background: var(--surface-subtle); color: var(--ink); white-space: nowrap; }
.pf-pill--soon { background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger); }
.pf-empty { display: grid; justify-items: start; gap: 12px; padding: 8px 0 4px; }
.pf-empty p { margin: 0; max-width: 42ch; font-size: 15px; line-height: 1.55; color: var(--ink-muted); }
.pf-remind { padding-top: 12px; border-top: 1px solid var(--border); }
.pf-remind__title { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; font-size: 14px; font-weight: 700; }
.pf-remind__list { list-style: none; margin: 0; padding: 0; }
.pf-remind__list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14px; }
.pf-remind__list small { color: var(--ink-muted); }
.pf-text-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0; border: 0; background: none; color: var(--ink-muted); font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
.pf-text-btn:hover { color: var(--ink); }
.pf-text-btn--brand { color: var(--brand); font-size: 15px; font-weight: 700; }
.pf-text-btn--brand:hover { color: var(--brand-hover); }
.pf-text-btn:disabled { opacity: 0.6; cursor: wait; }

/* История */
.pf-hist { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
@media (min-width: 700px) { .pf-hist { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1200px) { .pf-hist { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.pf-hist__item { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--canvas); min-width: 0; }
.pf-hist__item[data-state="above"] { border-color: color-mix(in srgb, var(--success) 45%, var(--border)); }
.pf-hist__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.pf-hist__score { flex-shrink: 0; font-family: var(--font-display); font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
.pf-hist__item[data-state="above"] .pf-hist__score { color: var(--success); }
.pf-hist__bar { display: block; height: 4px; border-radius: 2px; background: var(--surface-subtle); overflow: hidden; }
.pf-hist__bar em { display: block; height: 100%; background: var(--brand); }
.pf-hist__item[data-state="above"] .pf-hist__bar em { background: var(--success); }
.pf-hist__item[data-state="below"] .pf-hist__bar em { background: var(--danger); }
.pf-hist__meta { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
.pf-hist__meta .pf-muted { font-size: 13px; white-space: nowrap; }
.pf-hist__verdict { font-weight: 700; color: var(--ink-muted); }
.pf-hist__item[data-state="above"] .pf-hist__verdict { color: var(--success); }
.pf-hist__item[data-state="below"] .pf-hist__verdict { color: var(--danger); }
.pf-hist__delta { font-size: 13px; font-weight: 700; color: var(--ink-muted); }
.pf-hist__delta[data-dir="up"] { color: var(--success); }
.pf-hist__delta[data-dir="down"] { color: var(--danger); }
.pf-spark { width: 100%; height: 28px; overflow: visible; }

/* Форми и бутони */
.pf-form { display: grid; gap: 16px; margin-top: 4px; }
.pf-form__row { display: grid; gap: 16px; }
@media (min-width: 600px) { .pf-form__row { grid-template-columns: 1fr 1fr; } }
.pf-field { display: grid; gap: 6px; min-width: 0; }
.pf-field > span { font-size: 14px; font-weight: 650; }
.pf-field small { font-weight: 500; color: var(--ink-muted); }
.pf-field input, .pf-field textarea { width: 100%; box-sizing: border-box; min-height: 48px; padding: 12px 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--canvas); color: var(--ink); font: inherit; font-size: 16px; outline: none; transition: border-color 0.14s ease, box-shadow 0.14s ease; }
.pf-field textarea { resize: vertical; line-height: 1.5; }
.pf-field input:focus, .pf-field textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.pf-field input:disabled { color: var(--ink-muted); background: var(--surface-subtle); cursor: not-allowed; }
.pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 20px; border-radius: var(--radius-control); font: inherit; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease, transform 0.14s ease; justify-self: start; }
.pf-btn:active:not(:disabled) { transform: translateY(1px); }
.pf-btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.pf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.pf-btn--primary { background: var(--brand); color: var(--on-brand); }
.pf-btn--primary:hover:not(:disabled) { background: var(--brand-hover); }
.pf-btn--ghost { background: transparent; color: var(--ink); border-color: var(--border-strong); }
.pf-btn--ghost:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); }
.pf-btn--danger { background: transparent; color: var(--danger); border-color: var(--danger); }
.pf-btn--danger:hover:not(:disabled) { background: color-mix(in srgb, var(--danger) 10%, transparent); }
.pf-center { justify-self: center; }
.pf-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; }
.pf-row .pf-muted { flex: 1 1 260px; }
.pf-confirm { display: grid; gap: 12px; padding: 16px; border-radius: var(--radius-control); background: color-mix(in srgb, var(--danger) 6%, transparent); }
.pf-confirm__actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }

@media (prefers-reduced-motion: reduce) {
  .pf-next { animation: none; }
  .pf-spin { animation: none; }
  .pf-stat, .pf-next__cta, .pf-btn { transition: none; }
  .pf-stat:hover, .pf-next__cta:hover { transform: none; }
}
`;

export default Profile;
