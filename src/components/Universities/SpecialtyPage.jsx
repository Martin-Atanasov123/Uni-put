// /specialnosti/[slug] — per-специалност SEO страница (точка 8 роудмап).
// Агрегира ЕДНА специалност през всички университети, които я предлагат.
// Всяко поле идва от базата — нула измислени описания/заплати/кариери
// (Мартин: „само верни данни"; одитът: „не показвай зарплата като магическа цифра").
//
// Показва: кои университети × градове, формула + max_ball на всеки, историческия
// минимален бал където има, RIASEC съответствие (връзка към кариерния тест) и
// deep link към калкулатора за всяка програма.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { m } from "motion/react";
import { ArrowLeft, ArrowRight, Calculator, MapPin, GraduationCap, Building2, AlertCircle, Compass, TrendingUp } from "lucide-react";
import { universityService } from "@/services/universityService";
import { slugify } from "@/lib/slugify";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import AccreditationWarning from "@/components/common/AccreditationWarning";
import { ADMISSION_YEAR_SHORT } from "@/lib/siteStats";

const CARD_BORDER = "1px solid var(--brand-card-border)";

// RIASEC буква → име/цвят. Стабилни цветове (същите като кариерния резултат).
const RIASEC_LETTER = {
    R: { name: "Реалистичен", color: "#F97316" },
    I: { name: "Изследователски", color: "#8B5CF6" },
    A: { name: "Артистичен", color: "#EC4899" },
    S: { name: "Социален", color: "#10B981" },
    E: { name: "Предприемачески", color: "#F59E0B" },
    C: { name: "Конвенционален", color: "#06B6D4" },
};

function Loader() {
    return (
        <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
            <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid var(--brand-border)", borderTopColor: "var(--brand-cyan)",
                animation: "spin 0.7s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function NotFound({ slug }) {
    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "8rem 1.5rem 4rem" }}>
            <Seo title="Специалността не е намерена" path={`/specialnosti/${slug}`} noindex />
            <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
                <AlertCircle size={32} color="var(--brand-cyan)" />
                <h1 style={{ marginTop: "1rem", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    Не открихме тази специалност
                </h1>
                <p style={{ marginTop: "0.75rem", color: "var(--brand-muted)", lineHeight: 1.6 }}>
                    Линкът може да е остарял. Разгледай всички университети и специалности.
                </p>
                <Link to="/universities/" style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem",
                    padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                    color: "#fff", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none",
                }}>
                    Към университетите <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}

function StatChip({ icon: Icon, label, value, color }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.875rem", background: "var(--brand-surface-2)",
            border: CARD_BORDER, borderRadius: "999px", fontSize: "0.8125rem",
        }}>
            <Icon size={14} strokeWidth={1.5} color={color || "var(--brand-cyan)"} />
            <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{value}</span>
            <span style={{ color: "var(--brand-muted)" }}>{label}</span>
        </div>
    );
}

export default function SpecialtyPage() {
    const { specSlug } = useParams();
    const [status, setStatus] = useState("loading");
    const [name, setName] = useState("");
    const [programs, setPrograms] = useState([]);
    const [riasec, setRiasec] = useState(null);
    const [minScores, setMinScores] = useState({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setStatus("loading");
                const names = await universityService.getSpecialtyNames();
                const match = names.find((n) => slugify(n) === specSlug);
                if (!match) { if (!cancelled) setStatus("notfound"); return; }
                const { programs, riasec, minScores } = await universityService.getBySpecialty(match);
                if (cancelled) return;
                setName(match);
                setPrograms(programs);
                setRiasec(riasec);
                setMinScores(minScores);
                setStatus(programs.length ? "ok" : "notfound");
            } catch {
                if (!cancelled) setStatus("error");
            }
        })();
        return () => { cancelled = true; };
    }, [specSlug]);

    const { cities, minRange } = useMemo(() => {
        const citySet = [...new Set(programs.map((p) => p.city).filter(Boolean))];
        const vals = Object.values(minScores).map((m0) => m0.minBall).filter((v) => v > 0);
        const range = vals.length
            ? { lo: Math.min(...vals), hi: Math.max(...vals), n: vals.length }
            : null;
        return { cities: citySet, minRange: range };
    }, [programs, minScores]);

    if (status === "loading") return <Loader />;
    if (status === "notfound" || status === "error") return <NotFound slug={specSlug} />;

    const uniCount = new Set(programs.map((p) => p.university_name)).size;
    const primaryLetter = riasec?.riasec_code?.[0];
    const letterInfo = primaryLetter ? RIASEC_LETTER[primaryLetter] : null;

    const seoTitle = `${name} — университети и приемен бал ${ADMISSION_YEAR_SHORT}`;
    const seoDesc =
        `Къде да учиш ${name} в България: ${uniCount} ${uniCount === 1 ? "университет" : "университета"} в ${cities.length} ${cities.length === 1 ? "град" : "града"}. ` +
        `Балообразуване по коефициентите на МОН${minRange ? `, минимални балове от минали години` : ""} и изчисли своя бал безплатно.`;

    // Schema.org: всяка програма е Course към EducationalOrganization.
    const courseSchemas = programs.slice(0, 25).map((p) => ({
        "@context": "https://schema.org",
        "@type": "Course",
        name: `${name} — ${p.university_name}`,
        ...(p.education_level && { educationalLevel: p.education_level }),
        provider: {
            "@type": "EducationalOrganization",
            name: p.university_name,
            ...(p.city && { address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: "BG" } }),
        },
    }));
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Начало", item: "https://uniput.eu/" },
            { "@type": "ListItem", position: 2, name: "Специалности", item: "https://uniput.eu/universities" },
            { "@type": "ListItem", position: 3, name, item: `https://uniput.eu/specialnosti/${specSlug}` },
        ],
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 5rem" }}
        >
            <Seo title={seoTitle} description={seoDesc} path={`/specialnosti/${specSlug}`} />
            {courseSchemas.map((s, i) => <JsonLd key={i} data={s} />)}
            <JsonLd data={breadcrumbSchema} />

            <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
                <Link to="/universities/" style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.8125rem", color: "var(--brand-muted)", textDecoration: "none", marginBottom: "1.25rem",
                }}>
                    <ArrowLeft size={14} /> Всички университети
                </Link>

                <div style={{
                    fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--brand-cyan)", marginBottom: "0.5rem",
                }}>
                    Специалност
                </div>
                <h1 style={{
                    margin: 0, fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900,
                    letterSpacing: "-0.035em", lineHeight: 1.1, textWrap: "balance",
                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    {name}
                </h1>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginTop: "1.25rem" }}>
                    <StatChip icon={Building2} value={uniCount} label={uniCount === 1 ? "университет" : "университета"} />
                    <StatChip icon={MapPin} value={cities.length} label={cities.length === 1 ? "град" : "града"} />
                    {letterInfo && (
                        <StatChip icon={Compass} value={riasec.riasec_code} label={`тип ${letterInfo.name}`} color={letterInfo.color} />
                    )}
                    {minRange && (
                        <StatChip icon={TrendingUp} value={minRange.lo.toFixed(2)} label={`най-нисък минимален бал`} color="#10b981" />
                    )}
                </div>

                {/* Intro — само факти от базата */}
                <section style={{
                    marginTop: "2rem", background: "var(--brand-surface)", border: CARD_BORDER,
                    borderRadius: "1.25rem", padding: "1.5rem",
                }}>
                    <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--brand-muted)", maxWidth: "65ch" }}>
                        Специалност <strong style={{ color: "var(--brand-text)" }}>{name}</strong> се предлага за прием
                        през {ADMISSION_YEAR_SHORT} г. в {uniCount}{" "}
                        {uniCount === 1 ? "университет" : "университета"} в {cities.length}{" "}
                        {cities.length === 1 ? "град" : "града"} ({cities.join(", ")}). Всеки университет прилага
                        собствена формула за балообразуване по официалните коефициенти на МОН.
                        {minRange && (
                            <> Историческите минимални балове за прием се движат между{" "}
                                <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{minRange.lo.toFixed(2)}</strong> и{" "}
                                <strong style={{ color: "var(--brand-text)", fontFamily: "monospace" }}>{minRange.hi.toFixed(2)}</strong> т.
                                (по данни за {minRange.n} {minRange.n === 1 ? "програма" : "програми"}).</>
                        )}
                    </p>
                    {letterInfo && (
                        <p style={{ margin: "0.875rem 0 0", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--brand-muted)", maxWidth: "65ch" }}>
                            По RIASEC профил тази специалност пасва на тип{" "}
                            <strong style={{ color: letterInfo.color }}>{letterInfo.name} ({riasec.riasec_code})</strong>.
                            Не си сигурен/а дали е за теб? Направи{" "}
                            <Link to="/career-advisor/" style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                                кариерния тест
                            </Link>.
                        </p>
                    )}
                </section>

                {/* Програми по университети */}
                <h2 style={{ margin: "2.5rem 0 1rem", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    Къде се изучава
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {programs.map((p, idx) => {
                        const ms = minScores[p.id];
                        const uniSlug = slugify(p.university_name);
                        const calcHref = `/calculator/?specialty=${encodeURIComponent(p.specialty)}&university=${encodeURIComponent(p.university_name)}`;
                        return (
                            <m.div
                                key={p.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
                                style={{ background: "var(--brand-surface)", border: CARD_BORDER, borderRadius: "1.25rem", padding: "1.25rem 1.5rem" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: "min(100%, 16rem)" }}>
                                        <Link to={`/universities/${uniSlug}/`} style={{ color: "var(--brand-text)", textDecoration: "none", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>
                                            {p.university_name}
                                        </Link>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--brand-muted)" }}>
                                            {p.city && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={13} strokeWidth={1.5} /> {p.city}</span>}
                                            {p.education_level && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><GraduationCap size={13} strokeWidth={1.5} /> {p.education_level}</span>}
                                        </div>
                                    </div>
                                    {ms && (
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "1.25rem", fontWeight: 900, fontFamily: "monospace", color: "#10b981", lineHeight: 1 }}>
                                                {ms.minBall.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>
                                                мин. бал {ms.year}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {p.accreditation_status && (
                                    <div style={{ marginTop: "0.75rem" }}><AccreditationWarning status={p.accreditation_status} /></div>
                                )}

                                {p.formula_description && (
                                    <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.75rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "0.625rem", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                        <strong style={{ color: "var(--brand-text)" }}>Формула:</strong> {p.formula_description}
                                    </div>
                                )}

                                <Link to={calcHref} style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.875rem",
                                    minHeight: "40px", padding: "0 0.875rem", borderRadius: "0.625rem",
                                    fontSize: "13px", fontWeight: 700, color: "#fff", textDecoration: "none",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                }}>
                                    <Calculator size={14} strokeWidth={2} /> Изчисли бала си тук
                                </Link>
                            </m.div>
                        );
                    })}
                </div>

                {/* Долен CTA */}
                <div style={{ marginTop: "2.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <Link to="/calculator/" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        color: "#fff", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none", fontSize: "0.9375rem",
                    }}>
                        <Calculator size={16} /> Калкулатор за бал
                    </Link>
                    <Link to="/career-advisor/" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem",
                        background: "transparent", border: "1px solid var(--brand-border)",
                        color: "var(--brand-text)", borderRadius: "0.75rem", fontWeight: 600, textDecoration: "none", fontSize: "0.9375rem",
                    }}>
                        <Compass size={16} /> Кариерен тест
                    </Link>
                </div>

                <p style={{ marginTop: "2rem", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.6, maxWidth: "65ch" }}>
                    Данните са от официалните наредби на МОН за прием {ADMISSION_YEAR_SHORT} г. Минималните
                    балове (където са показани) са от официалните класирания на съответните университети от
                    минали години и служат само като ориентир.
                </p>
            </div>
        </m.div>
    );
}
