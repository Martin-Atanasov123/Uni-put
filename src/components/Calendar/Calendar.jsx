import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { m } from "motion/react";
import { calendarService } from "@/services/calendarService";
import { slugify } from "@/lib/slugify";
import Seo from "@/components/common/Seo";
import ErrorState from "@/components/common/ErrorState";
import CalendarReminder, { EventReminderAction } from "@/components/Calendar/CalendarReminder";
import CalendarModal from "@/components/Calendar/CalendarModal";
import JsonLd from "@/components/common/JsonLd";
import { ADMISSION_YEAR_SHORT } from "@/lib/siteStats";

// Национални дати (ДЗИ, НВО) са с „university_name“ = „МОН — …“ — не са университет, без линк към /universities/.
const isNational = (name) => String(name || "").startsWith("МОН");
import {
    CalendarDays, ChevronLeft, ChevronRight, MapPin, ExternalLink,
    Filter, X, School, GraduationCap, FileText, Trophy, UserCheck,
    LayoutGrid, List, Info, BellRing,
} from "lucide-react";

// ── Тип събитие → цвят/етикет/икона (сигнатурни цветове, стабилни навсякъде) ──
const EVENT_TYPES = {
    application: { label: "Кандидатстване", color: "#06B6D4", Icon: FileText },
    exam:        { label: "Приемен изпит",  color: "#8B5CF6", Icon: GraduationCap },
    ranking:     { label: "Класиране",      color: "#FBBF24", Icon: Trophy },
    enrollment:  { label: "Записване",      color: "#10B981", Icon: UserCheck },
};
const TYPE_ORDER = ["application", "exam", "ranking", "enrollment"];

const MONTHS_BG = [
    "януари", "февруари", "март", "април", "май", "юни",
    "юли", "август", "септември", "октомври", "ноември", "декември",
];
const MONTHS_BG_CAP = MONTHS_BG.map((m0) => m0[0].toUpperCase() + m0.slice(1));
// Понеделник-първи (българска конвенция)
const WEEKDAYS_BG = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];

// 'YYYY-MM-DD' → локален Date (без TZ отместване)
function parseDate(s) {
    if (!s) return null;
    const [y, m0, d] = s.split("-").map(Number);
    return new Date(y, m0 - 1, d);
}
const ymd = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
// Понеделник = 0 … Неделя = 6
const mondayIndex = (date) => (date.getDay() + 6) % 7;

// Форматира диапазон на български: "9 юли 2026", "18 – 26 април 2026",
// "28 юни – 2 юли 2026", "26 януари – 9 юни 2026"
function formatRange(startStr, endStr) {
    const s = parseDate(startStr);
    const e = endStr ? parseDate(endStr) : null;
    if (!s) return "";
    if (!e || ymd(s) === ymd(e)) {
        return `${s.getDate()} ${MONTHS_BG[s.getMonth()]} ${s.getFullYear()}`;
    }
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
        return `${s.getDate()} – ${e.getDate()} ${MONTHS_BG[e.getMonth()]} ${e.getFullYear()}`;
    }
    if (s.getFullYear() === e.getFullYear()) {
        return `${s.getDate()} ${MONTHS_BG[s.getMonth()]} – ${e.getDate()} ${MONTHS_BG[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS_BG[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${MONTHS_BG[e.getMonth()]} ${e.getFullYear()}`;
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(
        typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
    );
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const on = () => setIsDesktop(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return isDesktop;
}

const S = {
    surface: {
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-card-border)",
        borderRadius: "1.25rem",
    },
    inset: {
        background: "var(--brand-input-bg)",
        border: "1px solid var(--brand-input-border)",
        borderRadius: "0.75rem",
        color: "var(--brand-text)",
        fontSize: "13px",
        fontFamily: "inherit",
        outline: "none",
        padding: "0.55rem 0.75rem",
    },
};

// ── Единична карта на събитие (за agenda и за списъка под решетката) ──────────
function EventCard({ event, today, onOpen }) {
    const type = EVENT_TYPES[event.event_type] || EVENT_TYPES.application;
    const { Icon } = type;
    const end = event.end_date ? parseDate(event.end_date) : parseDate(event.start_date);
    const isPast = end && end < today;
    const slug = slugify(event.university_name);

    return (
        <div style={{
            ...S.surface,
            padding: "1rem 1.125rem",
            display: "flex",
            gap: "0.875rem",
            alignItems: "flex-start",
            borderLeft: `3px solid ${type.color}`,
            opacity: isPast ? 0.55 : 1,
            transition: "opacity 0.2s",
        }}>
            <div style={{
                width: 38, height: 38, borderRadius: "0.625rem", flexShrink: 0,
                background: `${type.color}1a`,
                border: `1px solid ${type.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon size={18} style={{ color: type.color }} strokeWidth={1.5} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{
                        fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                        color: type.color,
                    }}>{type.label}</span>
                    {isPast && (
                        <span style={{
                            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            color: "var(--brand-muted)", background: "var(--brand-surface-2)",
                            border: "1px solid var(--brand-border)", borderRadius: "999px", padding: "0.05rem 0.4rem",
                        }}>Минало</span>
                    )}
                    {event.is_confirmed === false && (
                        <span style={{
                            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            color: "#FBBF24", background: "rgba(251,191,36,0.1)",
                            border: "1px solid rgba(251,191,36,0.3)", borderRadius: "999px", padding: "0.05rem 0.4rem",
                        }}>Предстои да се потвърди</span>
                    )}
                </div>

                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-text)", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {event.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.25rem" }}>
                    <CalendarDays size={13} style={{ color: "var(--brand-muted)", flexShrink: 0 }} strokeWidth={1.5} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-text)", fontFamily: "monospace" }}>
                        {formatRange(event.start_date, event.end_date)}
                    </span>
                </div>

                {event.description && (
                    <p style={{ margin: "0.4rem 0 0", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>
                        {event.description}
                    </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                    {isNational(event.university_name) ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "12px", fontWeight: 600, color: "var(--brand-text)" }}>
                            <School size={12} strokeWidth={1.5} /> {event.university_name}
                        </span>
                    ) : (
                        <Link to={`/universities/${slug}/`} style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            fontSize: "12px", fontWeight: 600, color: "var(--brand-cyan)", textDecoration: "none",
                        }}>
                            <School size={12} strokeWidth={1.5} /> {event.university_name}
                        </Link>
                    )}
                    {event.city && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", color: "var(--brand-muted)" }}>
                            <MapPin size={11} strokeWidth={1.5} /> {event.city}
                        </span>
                    )}
                    {event.source_url && (
                        <a href={event.source_url} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)", textDecoration: "none", marginLeft: "auto",
                        }}>
                            Източник <ExternalLink size={11} strokeWidth={1.5} />
                        </a>
                    )}
                </div>
                {onOpen && (
                    <button type="button" onClick={() => onOpen(event)} style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.625rem", minHeight: "44px",
                        padding: "0.4rem 0.875rem", background: "transparent", border: "1px solid var(--brand-border)",
                        borderRadius: "0.75rem", color: "var(--brand-cyan)", fontSize: "12.5px", fontWeight: 600,
                        fontFamily: "inherit", cursor: "pointer",
                    }}>
                        <BellRing size={14} strokeWidth={1.5} aria-hidden="true" /> {isNational(event.university_name) ? "Напомняй ми за тези дати" : "Напомняй ми за този университет"}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Месечна решетка (десктоп) ────────────────────────────────────────────────
function MonthGrid({ monthDate, events, today, onPrev, onNext, onOpenEvent, onOpenDay }) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = mondayIndex(firstOfMonth);

    // Карта: ден (1..N) → събития, чийто диапазон покрива деня
    const byDay = useMemo(() => {
        const map = {};
        for (const ev of events) {
            const s = parseDate(ev.start_date);
            const e = ev.end_date ? parseDate(ev.end_date) : s;
            for (let d = 1; d <= daysInMonth; d++) {
                const day = new Date(year, month, d);
                if (day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
                    day <= new Date(e.getFullYear(), e.getMonth(), e.getDate())) {
                    (map[d] ||= []).push(ev);
                }
            }
        }
        return map;
    }, [events, year, month, daysInMonth]);

    const cells = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d) =>
        d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

    return (
        <div style={{ ...S.surface, padding: "1.25rem", minWidth: 0, overflow: "hidden" }}>
            {/* Навигация по месеци */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <button type="button" onClick={onPrev} aria-label="Предишен месец" style={navBtn}>
                    <ChevronLeft size={18} strokeWidth={1.5} />
                </button>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--brand-text)" }}>
                    {MONTHS_BG_CAP[month]} {year}
                </h2>
                <button type="button" onClick={onNext} aria-label="Следващ месец" style={navBtn}>
                    <ChevronRight size={18} strokeWidth={1.5} />
                </button>
            </div>

            {/* Заглавия на дните */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.375rem", marginBottom: "0.375rem" }}>
                {WEEKDAYS_BG.map((w) => (
                    <div key={w} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand-muted)", padding: "0.25rem 0" }}>
                        {w}
                    </div>
                ))}
            </div>

            {/* Дни */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.375rem" }}>
                {cells.map((d, i) => {
                    const dayEvents = d ? (byDay[d] || []) : [];
                    return (
                        <div key={i} style={{
                            minHeight: 84, minWidth: 0, overflow: "hidden",
                            borderRadius: "0.625rem",
                            border: isToday(d) ? "1px solid var(--brand-cyan)" : "1px solid var(--brand-border)",
                            background: d ? "var(--brand-input-bg)" : "transparent",
                            padding: "0.4rem",
                            display: "flex", flexDirection: "column", gap: "0.2rem",
                            boxShadow: isToday(d) ? "0 0 0 3px rgba(6,182,212,0.12)" : "none",
                        }}>
                            {d && (
                                <span style={{
                                    fontSize: "11px", fontWeight: isToday(d) ? 800 : 600, fontFamily: "monospace",
                                    color: isToday(d) ? "var(--brand-cyan)" : "var(--brand-muted)",
                                    alignSelf: "flex-end",
                                }}>{d}</span>
                            )}
                            {dayEvents.slice(0, 3).map((ev, j) => {
                                const t = EVENT_TYPES[ev.event_type] || EVENT_TYPES.application;
                                return (
                                    <button key={j} type="button" onClick={() => onOpenEvent(ev, d)}
                                        title={`${t.label}: ${ev.university_name}`}
                                        aria-label={`${t.label} — ${ev.university_name}. Отвори`}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "0.25rem", width: "100%", minWidth: 0,
                                            background: `${t.color}1a`, border: "none", borderLeft: `2px solid ${t.color}`,
                                            borderRadius: "0.25rem", padding: "0.15rem 0.25rem", overflow: "hidden",
                                            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                        }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--brand-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                                            {ev.university_name.replace(/\s*[„"].*/, "").replace(/–.*/, "").trim().split(" ").slice(0, 2).join(" ")}
                                        </span>
                                    </button>
                                );
                            })}
                            {dayEvents.length > 3 && (
                                <button type="button" onClick={() => onOpenDay(d, dayEvents)}
                                    aria-label={`Покажи всички ${dayEvents.length} събития за ${d} ${MONTHS_BG[month]}`}
                                    style={{
                                        width: "100%", padding: "0.2rem 0.25rem", background: "var(--brand-surface-2)",
                                        border: "1px solid var(--brand-border)", borderRadius: "0.25rem", cursor: "pointer",
                                        fontFamily: "inherit", fontSize: "10px", fontWeight: 700, color: "var(--brand-cyan)",
                                    }}>
                                    +{dayEvents.length - 3} още
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const navBtn = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 34, height: 34, borderRadius: "0.625rem",
    background: "var(--brand-surface-2)", border: "1px solid var(--brand-border)",
    color: "var(--brand-text)", cursor: "pointer",
};

// ── Легенда ──────────────────────────────────────────────────────────────────
function Legend() {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {TYPE_ORDER.map((k) => {
                const t = EVENT_TYPES[k];
                return (
                    <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: "3px", background: t.color }} />
                        {t.label}
                    </span>
                );
            })}
        </div>
    );
}

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    // ?university=… — връщане от входа с вече избран университет
    const [uniFilter, setUniFilter] = useState(() => new URLSearchParams(location.search).get("university") || "");
    const [cityFilter, setCityFilter] = useState("");
    const [activeTypes, setActiveTypes] = useState(new Set(TYPE_ORDER));
    const isDesktop = useIsDesktop();
    const [viewMode, setViewMode] = useState("agenda"); // 'agenda' | 'grid'
    const [monthDate, setMonthDate] = useState(() => {
        const t = new Date();
        return new Date(t.getFullYear(), t.getMonth(), 1);
    });

    const today = useMemo(() => {
        const t = new Date();
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    }, []);

    // На десктоп решетката е по подразбиране; на мобилен винаги agenda.
    useEffect(() => {
        setViewMode(isDesktop ? "grid" : "agenda");
    }, [isDesktop]);

    const [loadError, setLoadError] = useState(false);
    // dialog: null | { day: { d, events } } | { event, day? }
    const [dialog, setDialog] = useState(null);
    const closeDialog = useCallback(() => setDialog(null), []);
    const openEvent = useCallback((event, day) => setDialog({ event, day: day && day.events ? day : null }), []);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            setEvents(await calendarService.getAdmissionEvents({ throwOnError: true }));
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    const universities = useMemo(
        () => [...new Set(events.map((e) => e.university_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg")),
        [events]
    );
    const cities = useMemo(
        () => [...new Set(events.map((e) => e.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg")),
        [events]
    );

    const filtered = useMemo(() => events.filter((e) =>
        (!uniFilter || e.university_name === uniFilter) &&
        (!cityFilter || e.city === cityFilter) &&
        activeTypes.has(e.event_type)
    ), [events, uniFilter, cityFilter, activeTypes]);

    // Групиране по "месец година" за agenda. Започва от текущия месец като
    // решетката; по-ранните са зад бутон. Текущо събитие, започнало по-рано,
    // отива в групата на текущия месец.
    const [showPast, setShowPast] = useState(false);
    const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
    const { grouped, pastCount } = useMemo(() => {
        const groups = [];
        const idx = {};
        let past = 0;
        for (const ev of filtered) {
            const s = parseDate(ev.start_date);
            const e = ev.end_date ? parseDate(ev.end_date) : s;
            const isPast = e < currentMonthStart;
            if (isPast) past++;
            if (isPast && !showPast) continue;
            const anchor = !isPast && s < currentMonthStart ? currentMonthStart : s;
            const order = anchor.getFullYear() * 12 + anchor.getMonth();
            if (idx[order] === undefined) {
                idx[order] = groups.length;
                groups.push({ key: order, label: `${MONTHS_BG_CAP[anchor.getMonth()]} ${anchor.getFullYear()}`, items: [] });
            }
            groups[idx[order]].items.push(ev);
        }
        groups.sort((a, b) => a.key - b.key);
        return { grouped: groups, pastCount: past };
    }, [filtered, showPast, currentMonthStart]);

    // Събития за текущия месец (списък под решетката)
    const monthEvents = useMemo(() => filtered.filter((ev) => {
        const s = parseDate(ev.start_date);
        const e = ev.end_date ? parseDate(ev.end_date) : s;
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        return e >= monthStart && s <= monthEnd;
    }).sort((a, b) => a.start_date.localeCompare(b.start_date)), [filtered, monthDate]);

    const toggleType = useCallback((key) => {
        setActiveTypes((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            // Никога не позволявай празен избор — връща всички
            return next.size === 0 ? new Set(TYPE_ORDER) : next;
        });
    }, []);

    const clearFilters = () => { setUniFilter(""); setCityFilter(""); setActiveTypes(new Set(TYPE_ORDER)); };
    const hasFilters = uniFilter || cityFilter || activeTypes.size !== TYPE_ORDER.length;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", padding: "7rem 1.5rem 3rem", color: "var(--brand-text)" }}>
            <Seo
                title={`Календар за прием ${ADMISSION_YEAR_SHORT} — ДЗИ, изпити и срокове`}
                description={`Датите за прием ${ADMISSION_YEAR_SHORT}: ДЗИ, приемни изпити, срокове за кандидатстване, класирания и записвания по университети. От заповедите на МОН и сайтовете на университетите.`}
                path="/calendar"
            />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: `Календар за прием ${ADMISSION_YEAR_SHORT} — УниПът`,
                description: "Ключови дати от кандидатстудентските кампании на българските университети: изпити, срокове, класирания и записвания.",
                url: "https://uniput.eu/calendar/",
                inLanguage: "bg-BG",
            }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand-cyan)", boxShadow: "0 0 12px rgba(6,182,212,0.6)" }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Календар за прием
                        </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.75rem", textWrap: "balance" }}>
                        <CalendarDays size={32} style={{ color: "var(--brand-cyan)" }} strokeWidth={1.5} />
                        Всички дати за прием {ADMISSION_YEAR_SHORT}
                    </h1>
                    <p style={{ margin: 0, color: "var(--brand-muted)", fontSize: "1rem", maxWidth: "640px", lineHeight: 1.6 }}>
                        Изпити, срокове за кандидатстване, класирания и записвания — събрани по университети,
                        за да не изпуснеш нито един срок.
                    </p>
                </m.div>

                {/* Trust note */}
                <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "0.875rem" }}>
                    <Info size={16} style={{ color: "var(--brand-cyan)", flexShrink: 0, marginTop: 1 }} strokeWidth={1.5} />
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--brand-muted)", lineHeight: 1.55 }}>
                        Датите са от заповедите на МОН (ДЗИ) и от официалните сайтове на университетите. Университетите обявяват графиците си за {ADMISSION_YEAR_SHORT} г. през пролетта — добавяме ги веднага.
                        Винаги проверявай в източника до събитието — графиците понякога се променят.
                    </p>
                </div>

                {/* Filters */}
                <div style={{ ...S.surface, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-muted)" }}>
                            <Filter size={14} strokeWidth={1.5} />
                            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Филтри</span>
                        </div>
                        <select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)} style={{ ...S.inset, flex: 1, minWidth: 200 }} aria-label="Университет">
                            <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Всички университети</option>
                            {universities.map((u) => <option key={u} value={u} style={{ background: "var(--brand-dropdown-bg)" }}>{u}</option>)}
                        </select>
                        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ ...S.inset, minWidth: 140 }} aria-label="Град">
                            <option value="" style={{ background: "var(--brand-dropdown-bg)" }}>Всички градове</option>
                            {cities.map((c) => <option key={c} value={c} style={{ background: "var(--brand-dropdown-bg)" }}>{c}</option>)}
                        </select>
                        {hasFilters && (
                            <button type="button" onClick={clearFilters} style={{
                                display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem",
                                background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "999px",
                                color: "var(--brand-cyan)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                            }}>
                                <X size={12} strokeWidth={1.5} /> Изчисти
                            </button>
                        )}
                    </div>

                    {/* Type toggles */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {TYPE_ORDER.map((k) => {
                            const t = EVENT_TYPES[k];
                            const on = activeTypes.has(k);
                            return (
                                <button key={k} type="button" onClick={() => toggleType(k)} style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                    padding: "0.35rem 0.75rem", borderRadius: "999px", cursor: "pointer", fontFamily: "inherit",
                                    fontSize: "12px", fontWeight: 600,
                                    color: on ? t.color : "var(--brand-muted)",
                                    background: on ? `${t.color}1a` : "var(--brand-surface-2)",
                                    border: `1px solid ${on ? `${t.color}55` : "var(--brand-border)"}`,
                                    transition: "all 0.15s",
                                }}>
                                    <span style={{ width: 9, height: 9, borderRadius: "3px", background: on ? t.color : "var(--brand-muted)" }} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <CalendarReminder universityName={uniFilter || null} />

                {/* View toggle (desktop only) + count */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <Legend />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-muted)" }}>
                            {loading ? "..." : loadError ? "" : `${filtered.length} събити${filtered.length === 1 ? "е" : "я"}`}
                        </span>
                        {isDesktop && (
                            <div style={{ display: "flex", background: "var(--brand-surface-2)", border: "1px solid var(--brand-border)", borderRadius: "0.625rem", padding: "0.2rem" }}>
                                {[["grid", LayoutGrid, "Решетка"], ["agenda", List, "Списък"]].map(([mode, Icon, label]) => (
                                    <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={label} style={{
                                        display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.7rem",
                                        borderRadius: "0.45rem", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 700,
                                        border: "none",
                                        color: viewMode === mode ? "#fff" : "var(--brand-muted)",
                                        background: viewMode === mode ? "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))" : "transparent",
                                    }}>
                                        <Icon size={14} strokeWidth={1.5} /> {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ ...S.surface, padding: "4rem 2rem", textAlign: "center", color: "var(--brand-muted)" }}>
                        Зареждане на датите…
                    </div>
                ) : loadError ? (
                    <ErrorState
                        message="Не успяхме да заредим датите за прием. Провери връзката и опитай пак."
                        onRetry={loadEvents}
                    />
                ) : filtered.length === 0 ? (
                    <div style={{ ...S.surface, padding: "4rem 2rem", textAlign: "center" }}>
                        <div style={{ width: "4rem", height: "4rem", margin: "0 auto 1rem", borderRadius: "1rem", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CalendarDays size={28} style={{ color: "var(--brand-cyan)" }} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-text)", textWrap: "balance" }}>
                            {events.length === 0 ? "Скоро добавяме датите" : "Няма събития с тези филтри"}
                        </h3>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--brand-muted)", fontSize: "14px" }}>
                            {events.length === 0
                                ? "Работим по събирането на графиците за прием от университетите."
                                : "Опитай да разшириш филтрите или ги изчисти."}
                        </p>
                        {hasFilters && events.length > 0 && (
                            <button type="button" onClick={clearFilters} style={{ marginTop: "1.25rem", padding: "0.6rem 1.25rem", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", border: "none", borderRadius: "0.625rem", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Изчисти филтрите
                            </button>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <MonthGrid
                            monthDate={monthDate}
                            events={filtered}
                            today={today}
                            onPrev={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                            onNext={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                            onOpenEvent={(ev) => openEvent(ev)}
                            onOpenDay={(d, evs) => setDialog({ day: { d, events: evs } })}
                        />
                        {/* Списък на събитията за месеца под решетката */}
                        {monthEvents.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brand-muted)" }}>
                                    Събития през {MONTHS_BG[monthDate.getMonth()]} {monthDate.getFullYear()}
                                </h3>
                                {monthEvents.map((ev) => <EventCard key={ev.id} event={ev} today={today} onOpen={openEvent} />)}
                            </div>
                        ) : (
                            <p style={{ margin: 0, textAlign: "center", color: "var(--brand-muted)", fontSize: "13px", padding: "1rem" }}>
                                Няма събития през този месец. Разгледай съседните месеци със стрелките.
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {pastCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowPast((v) => !v)}
                            style={{ alignSelf: "center", minHeight: "44px", padding: "0 1.25rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                            {showPast ? "Скрий по-ранните събития" : `Покажи по-ранните събития (${pastCount})`}
                        </button>
                    )}
                    {grouped.length === 0 && (
                        <p style={{ margin: 0, textAlign: "center", color: "var(--brand-muted)", fontSize: "13px", padding: "1rem" }}>
                            Няма събития от {MONTHS_BG[today.getMonth()]} {today.getFullYear()} нататък. Все още нямаме дати за следващия прием.
                        </p>
                    )}
                    <m.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                    >
                        {grouped.map((group) => (
                            <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--brand-text)", letterSpacing: "-0.01em" }}>
                                        {group.label}
                                    </h3>
                                    <div style={{ flex: 1, height: 1, background: "var(--brand-border)" }} />
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand-muted)", fontFamily: "monospace" }}>
                                        {group.items.length}
                                    </span>
                                </div>
                                {group.items.map((ev) => (
                                    <m.div key={ev.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }}>
                                        <EventCard event={ev} today={today} onOpen={openEvent} />
                                    </m.div>
                                ))}
                            </div>
                        ))}
                    </m.div>
                    </div>
                )}
            </div>

            <CalendarModal
                open={!!dialog}
                onClose={closeDialog}
                title={dialog?.event ? dialog.event.university_name : dialog?.day ? `${dialog.day.d} ${MONTHS_BG[monthDate.getMonth()]} ${monthDate.getFullYear()}` : ""}
                subtitle={dialog?.event ? (isNational(dialog.event.university_name) ? "Национален график на МОН — важи за всички." : "Избери дали да ти напомняме само за този университет.") : dialog?.day ? `${dialog.day.events?.length || 0} събития — избери едно` : ""}
            >
                {dialog?.event ? (
                    <>
                        {dialog.day && (
                            <button type="button" onClick={() => setDialog({ day: dialog.day })} style={{
                                alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.3rem", minHeight: "44px",
                                background: "transparent", border: "none", color: "var(--brand-cyan)", fontSize: "13px", fontWeight: 600,
                                fontFamily: "inherit", cursor: "pointer", padding: 0,
                            }}>
                                <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Всички събития от деня
                            </button>
                        )}
                        <EventCard event={dialog.event} today={today} />
                        <EventReminderAction universityName={dialog.event.university_name} national={isNational(dialog.event.university_name)} />
                    </>
                ) : dialog?.day ? (
                    dialog.day.events.map((ev) => {
                        const t = EVENT_TYPES[ev.event_type] || EVENT_TYPES.application;
                        return (
                            <button key={ev.id} type="button" onClick={() => setDialog({ event: ev, day: dialog.day })} style={{
                                ...S.surface, display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", minHeight: "56px",
                                padding: "0.75rem 1rem", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                                borderLeft: `3px solid ${t.color}`, color: "var(--brand-text)",
                            }}>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.color }}>{t.label}</span>
                                    <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>{ev.university_name}</span>
                                </span>
                                <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--brand-muted)", flexShrink: 0 }} aria-hidden="true" />
                            </button>
                        );
                    })
                ) : null}
            </CalendarModal>
        </div>
    );
};

export default Calendar;
