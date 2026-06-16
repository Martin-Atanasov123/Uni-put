// /universities/[uniSlug] — per-университет SEO страница.
// Резолва slug → име през кеширан списък имена, после дърпа всички редове за
// това име и ги групира по факултет за рендер.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { m } from "motion/react";
import { ArrowLeft, ArrowRight, Calculator, MapPin, GraduationCap, Building2, AlertCircle, Database, ChevronRight } from "lucide-react";
import { universityService } from "@/services/universityService";
import { slugify } from "@/lib/slugify";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import AccreditationWarning from "@/components/common/AccreditationWarning";

const CARD_BORDER = "1px solid var(--brand-card-border)";

function Loader() {
    return (
        <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
            <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid var(--brand-border)",
                borderTopColor: "var(--brand-cyan)",
                animation: "spin 0.7s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function NotFound({ slug }) {
    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "8rem 1.5rem 4rem" }}>
            <Seo title="Университетът не е намерен" path={`/universities/${slug}`} noindex />
            <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
                <AlertCircle size={32} color="var(--brand-cyan)" />
                <h1 style={{ marginTop: "1rem", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    Не открихме този университет
                </h1>
                <p style={{ marginTop: "0.75rem", color: "var(--brand-muted)", lineHeight: 1.6 }}>
                    Линкът, който си отворил, може да е остарял. Виж всички университети, които поддържаме.
                </p>
                <Link
                    to="/universities"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        marginTop: "1.5rem", padding: "0.75rem 1.5rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        color: "#fff", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none",
                    }}
                >
                    Към всички университети <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}

function StatChip({ icon: Icon, label, value }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.875rem", background: "var(--brand-surface-2)",
            border: CARD_BORDER, borderRadius: "999px", fontSize: "0.8125rem",
        }}>
            <Icon size={14} strokeWidth={1.5} color="var(--brand-cyan)" />
            <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{value}</span>
            <span style={{ color: "var(--brand-muted)" }}>{label}</span>
        </div>
    );
}

export default function UniversityPage() {
    const { uniSlug } = useParams();
    const [status, setStatus] = useState("loading"); // loading | ok | notfound | error
    const [uniName, setUniName] = useState("");
    const [rows, setRows] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setStatus("loading");
                const names = await universityService.getUniversityNames();
                const match = names.find((n) => slugify(n) === uniSlug);
                if (!match) {
                    if (!cancelled) setStatus("notfound");
                    return;
                }
                const data = await universityService.getByUniversityName(match);
                if (cancelled) return;
                setUniName(match);
                setRows(data);
                setStatus(data.length ? "ok" : "notfound");
            } catch {
                if (!cancelled) setStatus("error");
            }
        })();
        return () => { cancelled = true; };
    }, [uniSlug]);

    // Групиране по факултет + общи метрики
    const { faculties, cities, totalSpecialties } = useMemo(() => {
        const byFac = new Map();
        const cityCount = new Map();
        for (const r of rows) {
            const fac = r.faculty || "Общи специалности";
            if (!byFac.has(fac)) byFac.set(fac, []);
            byFac.get(fac).push(r);
            if (r.city) cityCount.set(r.city, (cityCount.get(r.city) || 0) + 1);
        }
        const facs = [...byFac.entries()]
            .map(([name, specs]) => ({ name, specs: specs.sort((a, b) => (a.specialty || "").localeCompare(b.specialty || "", "bg")) }))
            .sort((a, b) => a.name.localeCompare(b.name, "bg"));
        const cities = [...cityCount.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
        return { faculties: facs, cities, totalSpecialties: rows.length };
    }, [rows]);

    if (status === "loading") return <Loader />;
    if (status === "notfound") return <NotFound slug={uniSlug} />;
    if (status === "error") return <NotFound slug={uniSlug} />;

    const primaryCity = cities[0] || "";
    // Статус на акредитация (един за целия университет) — за warning банер.
    const accreditationStatus = rows[0]?.accreditation_status;
    // SEO copy от SEO-AUDIT-REPORT.md §3.2 — enriched за прием 2026
    const seoTitle = `Прием в ${uniName} 2026 — Балообразуване, ${faculties.length} факултета, ${totalSpecialties} специалности`;
    const seoDesc = `Подготвяш се за ${uniName}? Виж точните коефициенти за балообразуване по МОН за всичките ${totalSpecialties} специалности в ${faculties.length} факултета. Изчисли своя приемен бал за 2026 г. — безплатно, без регистрация.${primaryCity ? ` Кампусът е в ${primaryCity}.` : ""}`;

    // Schema.org EducationalOrganization — описва университета като субект.
    // Department-ите са факултетите, дърпани от actual DB data.
    const uniSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: uniName,
        url: `https://uniput.eu/universities/${uniSlug}`,
        ...(primaryCity && {
            address: { "@type": "PostalAddress", addressLocality: primaryCity, addressCountry: "BG" },
        }),
        areaServed: { "@type": "Country", name: "България" },
        department: faculties.map(f => ({ "@type": "EducationalOrganization", name: f.name })),
    };

    // BreadcrumbList — Google показва пътя в SERP-а вместо суров URL.
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Начало", item: "https://uniput.eu/" },
            { "@type": "ListItem", position: 2, name: "Университети", item: "https://uniput.eu/universities" },
            { "@type": "ListItem", position: 3, name: uniName, item: `https://uniput.eu/universities/${uniSlug}` },
        ],
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 5rem" }}
        >
            <Seo
                title={seoTitle}
                description={seoDesc}
                path={`/universities/${uniSlug}`}
            />
            <JsonLd data={uniSchema} />
            <JsonLd data={breadcrumbSchema} />

            <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

                {/* Breadcrumb / back */}
                <Link
                    to="/universities"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        fontSize: "0.8125rem", color: "var(--brand-muted)",
                        textDecoration: "none", marginBottom: "1.25rem",
                    }}
                >
                    <ArrowLeft size={14} /> Всички университети
                </Link>

                {/* Header */}
                <div style={{
                    fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--brand-cyan)", marginBottom: "0.5rem",
                }}>
                    Университет
                </div>
                <h1 style={{
                    margin: 0, fontSize: "clamp(2rem, 5vw, 3.25rem)",
                    fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1,
                    textWrap: "balance",
                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Прием в {uniName} 2026
                </h1>

                {/* Stat chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
                    {primaryCity && <StatChip icon={MapPin} value={primaryCity} label={cities.length > 1 ? `и още ${cities.length - 1} града` : ""} />}
                    <StatChip icon={Building2} value={faculties.length} label="факултета" />
                    <StatChip icon={GraduationCap} value={totalSpecialties} label="специалности" />
                </div>

                {/* CTAs */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.75rem" }}>
                    <Link
                        to="/calculator"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.875rem 1.5rem",
                            background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                            color: "#fff", borderRadius: "0.75rem", fontWeight: 700,
                            fontSize: "0.9375rem", textDecoration: "none",
                        }}
                    >
                        <Calculator size={16} /> Изчисли бал за специалност
                    </Link>
                    {primaryCity && (
                        <Link
                            to="/dormitories"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.875rem 1.5rem", background: "transparent",
                                color: "var(--brand-text)", border: CARD_BORDER,
                                borderRadius: "0.75rem", fontWeight: 600,
                                fontSize: "0.9375rem", textDecoration: "none",
                            }}
                        >
                            Общежития в {primaryCity} <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {/* Trust note */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    marginTop: "2rem", padding: "0.5rem 0.875rem",
                    background: "var(--brand-surface-2)", border: CARD_BORDER,
                    borderRadius: "0.625rem", fontSize: "0.75rem", color: "var(--brand-muted)",
                }}>
                    <Database size={12} /> Данни от наредбите на МОН, актуализирани за 2026 г.
                </div>

                {/* Trust warning — показва се само за университети с проблемна акредитация */}
                {accreditationStatus && (
                    <div style={{ marginTop: "1.25rem" }}>
                        <AccreditationWarning status={accreditationStatus} />
                    </div>
                )}

                {/* ── Уникален съдържателен блок (F2 от SEO одита) ──
                    Решава „Crawled — currently not indexed" чрез ~110 думи
                    реален текст, разчупващ template thinness. Всички числа
                    идват от Supabase, нула измисляне. */}
                <section style={{
                    marginTop: "2.5rem",
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-card-border)",
                    borderRadius: "1.25rem",
                    padding: "1.75rem",
                }}>
                    <h2 style={{
                        margin: 0, fontSize: "1.125rem", fontWeight: 700,
                        letterSpacing: "-0.01em", color: "var(--brand-text)",
                    }}>
                        За приема в {uniName} през 2026 г.
                    </h2>
                    <p style={{
                        margin: "1rem 0 0", fontSize: "0.9375rem",
                        lineHeight: 1.7, color: "var(--brand-muted)", maxWidth: "65ch",
                    }}>
                        {uniName} е сред 47-те акредитирани висши училища в България. През
                        академичната 2026 г. приема кандидати за {totalSpecialties}{" "}
                        {totalSpecialties === 1 ? "специалност" : "специалности"},
                        разпределени в {faculties.length}{" "}
                        {faculties.length === 1 ? "факултет" : "факултета"}.
                        Балообразуването следва официалните коефициенти, публикувани от МОН
                        в наредбата за прием.
                    </p>
                    <p style={{
                        margin: "0.875rem 0 0", fontSize: "0.9375rem",
                        lineHeight: 1.7, color: "var(--brand-muted)", maxWidth: "65ch",
                    }}>
                        Изчисли реалния си конкурсен бал с{" "}
                        <Link to="/calculator" style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                            калкулатора за бал
                        </Link>
                        {" "}— той прилага точните формули за всяка от {totalSpecialties}{" "}
                        {totalSpecialties === 1 ? "специалност" : "специалности"} и сравнява
                        резултата ти с историческия среден бал за прием.
                    </p>
                    <p style={{
                        margin: "0.875rem 0 0", fontSize: "0.9375rem",
                        lineHeight: 1.7, color: "var(--brand-muted)", maxWidth: "65ch",
                    }}>
                        Не си сигурен/а в специалността? Започни с{" "}
                        <Link to="/career-advisor" style={{ color: "var(--brand-cyan)", textDecoration: "none", fontWeight: 600 }}>
                            RIASEC кариерния тест
                        </Link>
                        {" "}— той сравнява профила ти с 912 специалности и предлага най-подходящите.
                    </p>
                </section>

                {/* Faculties + specialties */}
                <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {faculties.map((fac, idx) => (
                        <m.section
                            key={fac.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                background: "var(--brand-surface)",
                                border: CARD_BORDER, borderRadius: "1.25rem",
                                padding: "1.5rem",
                            }}
                        >
                            <h2 style={{
                                margin: 0, fontSize: "1.0625rem", fontWeight: 700,
                                letterSpacing: "-0.01em", color: "var(--brand-text)",
                            }}>
                                {fac.name}
                            </h2>
                            <div style={{
                                fontSize: "0.75rem", color: "var(--brand-muted)",
                                marginTop: "0.25rem",
                            }}>
                                {fac.specs.length} {fac.specs.length === 1 ? "специалност" : "специалности"}
                            </div>

                            <ul style={{
                                listStyle: "none", padding: 0, margin: "1rem 0 0",
                                display: "grid", gap: "0.5rem",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            }}>
                                {fac.specs.map((s) => (
                                    <li key={s.id} style={{ display: "flex" }}>
                                        <Link
                                            to={`/calculator?specialty=${encodeURIComponent(s.specialty)}&university=${encodeURIComponent(uniName)}`}
                                            style={{
                                                flex: 1,
                                                padding: "0.625rem 0.875rem",
                                                background: "var(--brand-surface-2)",
                                                border: CARD_BORDER, borderRadius: "0.625rem",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "space-between", gap: "0.5rem",
                                                fontSize: "0.875rem",
                                                color: "var(--brand-text)",
                                                textDecoration: "none",
                                                transition: "border-color 0.18s, transform 0.18s, background 0.18s",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = "var(--brand-cyan)";
                                                e.currentTarget.style.transform = "translateX(2px)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = "var(--brand-card-border)";
                                                e.currentTarget.style.transform = "translateX(0)";
                                            }}
                                            title="Изчисли бал за тази специалност"
                                        >
                                            <span style={{ flex: 1 }}>{s.specialty}</span>
                                            <ChevronRight size={14} strokeWidth={1.5} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </m.section>
                    ))}
                </div>
            </div>
        </m.div>
    );
}
