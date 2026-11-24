import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { m } from "motion/react";
import { getAllDormitories } from "@/lib/api";
import Seo from "@/components/common/Seo";
import { useIsMobile } from "@/hooks/useIsMobile";
import DormFilters from "./DormFilters";
import { applyFilters, readFilters, writeFilters, hasRent, DISTANCE_OPTIONS } from "@/lib/dormFilters";
import ErrorState from "@/components/common/ErrorState";
import { DORMITORIES, DORMITORY_CITIES, ADMISSION_YEAR_SHORT } from "@/lib/siteStats";
import { PageArt } from "@/components/common/Illustrations";
import {
    Building2,
    MapPin,
    Bus,
    Bath,
    Hammer,
    Star,
    Calculator,
    School,
    Search,
    Clock,
    Route,
    CalendarDays,
    ExternalLink,
    Filter,
    X,
} from "lucide-react";

const BGN_TO_EUR = 1.95583;

const S = {
    surface: {
        background: "var(--brand-surface)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--brand-border)",
        borderRadius: "1rem",
    },
    inset: {
        background: "var(--brand-input-bg)",
        border: "1px solid var(--brand-border)",
        borderRadius: "0.75rem",
    },
};

function RatingStars({ value = 0 }) {
    const full = Math.floor(value);
    const half = value - full > 0;
    return (
        <div style={{ display: "flex", gap: "2px" }}>
            {[...Array(5)].map((_, i) => {
                if (i < full) return <Star key={i} size={13} fill="var(--warning)" color="var(--warning)" />;
                if (i === full && half) {
                    return (
                        <span key={i} style={{ position: "relative", display: "inline-block", width: 13, height: 13 }}>
                            <Star size={13} fill="none" color="rgba(148,163,184,0.3)" />
                            <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: "50%" }}>
                                <Star size={13} fill="var(--warning)" color="var(--warning)" />
                            </span>
                        </span>
                    );
                }
                return <Star key={i} size={13} fill="none" color="rgba(148,163,184,0.3)" />;
            })}
        </div>
    );
}

// Телефон: компактен ред — най-важното на два реда, останалото при поискване.
function DormRow({ dorm }) {
    const toEur = bgn => Math.round(bgn / BGN_TO_EUR);
    const rent = dorm.monthly_rent_avg || 0;
    const deposit = dorm.deposit_amount || 0;
    const facts = [
        dorm.distance_to_uni_km != null && `${dorm.distance_to_uni_km} км`,
        dorm.commute_minutes != null && `${dorm.commute_minutes} мин`,
        rent > 0 ? `${toEur(rent)} €/мес.` : "цена не е посочена",
    ].filter(Boolean);
    const extras = [dorm.is_renovated && "Реновиран", dorm.has_private_bathroom && "Собствена баня"].filter(Boolean);
    return (
        <article className="dm-row">
            <div className="dm-row__top">
                <h3 className="dm-row__name">{dorm.block_number}</h3>
                {dorm.condition_rating ? (
                    <span className="dm-row__rate" aria-label={`Състояние ${dorm.condition_rating} от 5`}>
                        <Star size={14} fill="var(--warning)" color="var(--warning)" aria-hidden="true" /> {dorm.condition_rating}/5
                    </span>
                ) : <span className="dm-row__norate">Няма оценка</span>}
            </div>
            <p className="dm-row__sub">{dorm.university_id}{dorm.city && !String(dorm.university_id || "").includes(dorm.city) ? ` · ${dorm.city}` : ""}</p>
            <p className="dm-row__facts">{facts.join(" · ")}{extras.length > 0 && <span> · {extras.join(" · ")}</span>}</p>
            <details className="dm-row__more">
                <summary>Транспорт, срокове и разходи</summary>
                <dl>
                    <div><dt>Транспорт</dt><dd>{dorm.transport_lines?.length ? dorm.transport_lines.join(", ") : "Няма информация"}</dd></div>
                    {dorm.application_period && <div><dt>Кандидатстване</dt><dd>{dorm.application_period}</dd></div>}
                    {rent > 0 && <div><dt>Наем / месец</dt><dd>{toEur(rent)} €</dd></div>}
                    {deposit > 0 && <div><dt>Депозит (еднократно)</dt><dd>{toEur(deposit)} €</dd></div>}
                    {rent > 0 && <div><dt>Сметки (прибл.)</dt><dd>{toEur(40)} €</dd></div>}
                </dl>
            </details>
            {dorm.google_maps_url && (
                <a className="dm-row__map" href={dorm.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <MapPin size={15} aria-hidden="true" /> Виж на картата <ExternalLink size={12} aria-hidden="true" />
                </a>
            )}
        </article>
    );
}

const DM_ROW_CSS = `
@media (max-width: 767px) {
  .dm-grid { gap: 0 !important; border-top: 1px solid var(--border); }
  .dm-filter-label { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .dm-filter select { min-height: 48px; font-size: 16px !important; }
  .dm-filter { padding: 12px !important; }
}
.dm-row { padding: 14px 0 6px; border-bottom: 1px solid var(--border); color: var(--ink); }
.dm-row__top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.dm-row__name { margin: 0; font-size: 17px; font-weight: 750; letter-spacing: -0.01em; }
.dm-row__rate { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dm-row__norate { font-size: 13px; color: var(--ink-muted); white-space: nowrap; }
.dm-empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 1rem; }
.dm-empty-actions button { min-height: 44px; padding: 0 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--ink); font: inherit; font-weight: 650; cursor: pointer; }
.dm-empty-actions button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.dm-row__sub { margin: 2px 0 0; font-size: 14px; color: var(--ink-muted); }
.dm-row__facts { margin: 6px 0 0; font-size: 15px; font-weight: 650; font-variant-numeric: tabular-nums; }
.dm-row__facts span { font-weight: 500; color: var(--ink-muted); }
.dm-row__more summary { display: flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 650; color: var(--brand); cursor: pointer; list-style: none; }
.dm-row__more summary::-webkit-details-marker { display: none; }
.dm-row__more summary::after { content: "+"; margin-left: 8px; font-weight: 700; }
.dm-row__more[open] summary::after { content: "−"; }
.dm-row__more dl { margin: 0 0 6px; display: grid; gap: 6px; font-size: 14px; }
.dm-row__more dl > div { display: flex; justify-content: space-between; gap: 12px; }
.dm-row__more dt { color: var(--ink-muted); }
.dm-row__more dd { margin: 0; font-weight: 650; text-align: right; font-variant-numeric: tabular-nums; }
.dm-row__map { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 650; color: var(--brand); text-decoration: none; }
.dm-row__map:focus-visible, .dm-row__more summary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
`;

function DormCard({ dorm }) {
    const mobile = useIsMobile();
    const toEur = bgn => Math.round(bgn / BGN_TO_EUR);
    const rent = dorm.monthly_rent_avg || 0;
    const deposit = dorm.deposit_amount || 0;
    const utility = 40;
    const hasFinancialData = rent > 0;
    if (mobile) return <DormRow dorm={dorm} />;

    return (
        <div
            style={{
                ...S.surface,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
                height: "100%",  // alignment fix: всяка карта запълва grid cell-а
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(23,86,217,0.35)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(23,86,217,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--brand-border)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.2rem 0.5rem",
                            background: "var(--brand-border)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--brand-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: "0.5rem",
                        }}
                    >
                        <School size={10} /> {dorm.university_id}
                    </div>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "1.125rem",
                            fontWeight: 800,
                            color: "var(--brand-text)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.3,
                        }}
                    >
                        {dorm.block_number}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--brand-muted)", fontSize: "12px", marginTop: "0.2rem" }}>
                        <MapPin size={12} /> {dorm.city}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    {dorm.condition_rating ? (
                        <>
                            <span role="img" aria-label={`Състояние ${dorm.condition_rating} от 5`}><RatingStars value={dorm.condition_rating} /></span>
                            <span aria-hidden="true" style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.25rem" }}>
                                {dorm.condition_rating}/5
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-muted)" }}>Няма оценка</span>
                    )}
                </div>
            </div>

            {/* Feature badges */}
            {(dorm.is_renovated || dorm.has_private_bathroom) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {dorm.is_renovated && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "999px", color: "var(--success)", fontSize: "11px", fontWeight: 600 }}>
                            <Hammer size={11} /> Реновиран
                        </span>
                    )}
                    {dorm.has_private_bathroom && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", background: "rgba(23,86,217,0.1)", border: "1px solid rgba(23,86,217,0.3)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "11px", fontWeight: 600 }}>
                            <Bath size={11} /> Собствена баня
                        </span>
                    )}
                </div>
            )}

            {/* Distance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ ...S.inset, padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Route size={15} style={{ color: "var(--brand-cyan)", marginBottom: "0.3rem" }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-text)", fontFamily: "var(--font-mono)" }}>
                        {dorm.distance_to_uni_km != null ? `${dorm.distance_to_uni_km} км` : "—"}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.125rem" }}>до университета</span>
                </div>
                <div style={{ ...S.inset, padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Clock size={15} style={{ color: "var(--brand-violet)", marginBottom: "0.3rem" }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-text)", fontFamily: "var(--font-mono)" }}>
                        {dorm.commute_minutes != null ? `${dorm.commute_minutes} мин` : "—"}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--brand-muted)", opacity: 0.6, marginTop: "0.125rem" }}>пътуване</span>
                </div>
            </div>

            {/* Transport */}
            <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                    <Bus size={11} /> Транспорт
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {dorm.transport_lines && dorm.transport_lines.length > 0 ? (
                        dorm.transport_lines.map((line, i) => (
                            <span key={i} style={{ padding: "0.15rem 0.5rem", background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 700, color: "var(--brand-text)", fontFamily: "var(--font-mono)" }}>
                                {line}
                            </span>
                        ))
                    ) : (
                        <span style={{ fontSize: "11px", color: "var(--brand-muted)", opacity: 0.5, fontStyle: "italic" }}>Няма информация</span>
                    )}
                </div>
            </div>

            {/* Application period */}
            {dorm.application_period ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.625rem" }}>
                    <CalendarDays size={14} style={{ color: "var(--warning)", flexShrink: 0 }} />
                    <div>
                        <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Кандидатстване</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-text)" }}>{dorm.application_period}</span>
                    </div>
                </div>
            ) : null}

            {/* Cost calculator */}
            <div style={{ ...S.inset, padding: "1rem" }}>
                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "10px", fontWeight: 700, color: "var(--brand-cyan)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem" }}>
                    <Calculator size={12} /> Калкулатор "Оцеляване"
                </h4>
                {hasFinancialData ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "13px" }}>
                        <Row label="Наем / месец" value={`${toEur(rent)} €`} strong />
                        {deposit > 0 && <Row label="Депозит (еднократно)" value={`${toEur(deposit)} €`} />}
                        <Row label="Сметки (прибл.)" value={`${toEur(utility)} €`} />
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--brand-muted)", opacity: 0.5, fontStyle: "italic", textAlign: "center" }}>
                        Цените не са посочени
                    </p>
                )}
            </div>

            {/* Maps link — marginTop: auto подравнява бутона към дъното на всяка
                карта, така че редовете в grid-а изглеждат подредени дори когато
                някои карти имат повече badges / application_period / т.н. */}
            {dorm.google_maps_url && (
                <a
                    href={dorm.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 1rem",
                        background: "rgba(23,86,217,0.08)",
                        border: "1px solid rgba(23,86,217,0.25)",
                        borderRadius: "0.625rem",
                        color: "var(--brand-cyan)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(23,86,217,0.15)"; e.currentTarget.style.borderColor = "rgba(23,86,217,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(23,86,217,0.08)"; e.currentTarget.style.borderColor = "rgba(23,86,217,0.25)"; }}
                >
                    <MapPin size={14} />
                    Виж на картата
                    <ExternalLink size={12} style={{ opacity: 0.7 }} />
                </a>
            )}
        </div>
    );
}

function Row({ label, value, strong = false }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--brand-muted)", opacity: 0.8 }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: strong ? 800 : 600, color: strong ? "var(--brand-text)" : "var(--brand-muted)" }}>
                {value}
            </span>
        </div>
    );
}

function Skeleton() {
    return (
        <div
            style={{
                ...S.surface,
                height: "380px",
                background: "linear-gradient(110deg, var(--brand-surface) 30%, var(--brand-border) 50%, var(--brand-surface) 70%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s linear infinite",
            }}
        />
    );
}

const Dormitories = () => {
    const [dormitories, setDormitories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [loadError, setLoadError] = useState(false);

    const loadDormitories = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await getAllDormitories({ throwOnError: true });
            setDormitories(data);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDormitories(); }, [loadDormitories]);

    // Филтрите живеят в адреса (?city=&uni=&km=&sort=) — споделими и пазени при „Назад“.
    const filters = useMemo(() => readFilters(searchParams, dormitories), [searchParams, dormitories]);
    const setFilters = useCallback(patch => {
        setSearchParams(writeFilters({ ...filters, ...patch }), { replace: true });
    }, [filters, setSearchParams]);
    const resetFilters = useCallback(() => setFilters({ city: "", uni: "", km: "" }), [setFilters]);
    const filteredDorms = useMemo(() => applyFilters(dormitories, filters), [dormitories, filters]);
    const rentCount = useMemo(() => dormitories.filter(hasRent).length, [dormitories]);
    const kmLabel = DISTANCE_OPTIONS.find(o => o.value === filters.km)?.label;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", padding: "7rem 1.5rem 3rem", color: "var(--brand-text)" }}>
            <Seo
                title={`Студентски общежития в България — ${DORMITORIES} блока, цени и условия за ${ADMISSION_YEAR_SHORT}`}
                description={`Сравни ${DORMITORIES} студентски общежития в ${DORMITORY_CITIES} града. Месечен наем, депозит, разстояние до университета и транспортни линии — на едно място. Данни към ${ADMISSION_YEAR_SHORT} г.`}
                path="/dormitories"
                image="https://uniput.eu/og/dormitories.png"
            />
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="pg-head"
                    style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand-violet)", boxShadow: "0 0 12px rgba(23,86,217,0.6)" }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Жилищна база
                        </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.75rem", textWrap: "balance" }}>
                        <Building2 size={32} style={{ color: "var(--brand-cyan)" }} />
                        Общежития
                    </h1>
                    <p style={{ margin: 0, color: "var(--brand-muted)", fontSize: "1rem", maxWidth: "640px" }}>
                        Наем, разстояние до университета и транспорт за {DORMITORIES} общежития.
                    </p>
                    <PageArt name="dormitories" height={701} rows={3} />
                </m.div>

                {/* Filters */}
                <style>{DM_ROW_CSS}</style>
                {!loading && !loadError && (
                    <DormFilters
                        dorms={dormitories}
                        filters={filters}
                        onChange={setFilters}
                        onReset={resetFilters}
                        shown={filteredDorms.length}
                        total={dormitories.length}
                        rentCount={rentCount}
                        previewCount={f => applyFilters(dormitories, f).length}
                    />
                )}

                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "1.25rem" }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                    </div>
                ) : loadError ? (
                    <ErrorState
                        message="Не успяхме да заредим общежитията. Провери връзката и опитай пак."
                        onRetry={loadDormitories}
                    />
                ) : filteredDorms.length === 0 ? (
                    <div
                        style={{
                            ...S.surface,
                            padding: "4rem 2rem",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "4rem",
                                height: "4rem",
                                margin: "0 auto 1rem",
                                borderRadius: "1rem",
                                background: "rgba(23,86,217,0.08)",
                                border: "1px solid rgba(23,86,217,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Search size={28} style={{ color: "var(--brand-cyan)" }} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-text)", textWrap: "balance" }}>
                            Нищо не съвпада с тези филтри
                        </h3>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--brand-muted)", fontSize: "14px" }}>
                            Премахни един от филтрите:
                        </p>
                        <div className="dm-empty-actions">
                            {filters.km && <button type="button" onClick={() => setFilters({ km: "" })}>Без „{kmLabel}“</button>}
                            {filters.uni && <button type="button" onClick={() => setFilters({ uni: "" })}>Всички университети</button>}
                            {filters.city && <button type="button" onClick={() => setFilters({ city: "", uni: "" })}>Всички градове</button>}
                        </div>
                    </div>
                ) : (
                    <m.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        className="dm-grid"
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "1.25rem" }}
                    >
                        {filteredDorms.map(dorm => (
                            <m.div
                                key={dorm.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                                }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <DormCard dorm={dorm} />
                            </m.div>
                        ))}
                    </m.div>
                )}
            </div>
        </div>
    );
};

export default Dormitories;
