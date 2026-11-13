// /specialnosti/ — хъб с всички per-специалност страници.
//
// Защо съществува: 173-те /specialnosti/[slug] страници нямаха нито една страница,
// която да ги изброява — откриваеми бяха само през sitemap-а, а Google почти не
// обхожда страници без вътрешни връзки към тях (Search Console, ноември 2026:
// 11 познати URL-а от 234). Хъбът дава на всяка от тях истински <a> линк.
//
// Показва само специалности, предлагани в ≥2 университета — същият праг като
// prerender.mjs и sitemap-а (под него няма агрегатна страница).
// Огледалото в суровия HTML е buildSpecialtiesIndexBody() в scripts/prerender.mjs.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { m } from "motion/react";
import { ArrowRight, Search, AlertCircle } from "lucide-react";
import { universityService } from "@/services/universityService";
import { slugify } from "@/lib/slugify";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { ADMISSION_YEAR_SHORT, DATA_FRESHNESS_NOTE } from "@/lib/siteStats";

const CARD_BORDER = "1px solid var(--brand-card-border)";

const BREADCRUMB = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Начало", item: "https://uniput.eu/" },
        { "@type": "ListItem", position: 2, name: "Специалности", item: "https://uniput.eu/specialnosti/" },
    ],
};

export default function SpecialtiesIndex() {
    const [status, setStatus] = useState("loading");
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let cancelled = false;
        universityService.getSpecialtyIndex()
            .then((data) => { if (!cancelled) { setItems(data); setStatus("ok"); } })
            .catch(() => { if (!cancelled) setStatus("error"); });
        return () => { cancelled = true; };
    }, []);

    // Групиране по първа буква — азбучен указател вместо стена от 170+ линка.
    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q ? items.filter((it) => it.name.toLowerCase().includes(q)) : items;
        const map = new Map();
        for (const it of filtered) {
            const letter = it.name[0].toUpperCase();
            if (!map.has(letter)) map.set(letter, []);
            map.get(letter).push(it);
        }
        return [...map.entries()];
    }, [items, query]);

    const title = `Специалности в България — къде се изучават, прием ${ADMISSION_YEAR_SHORT}`;
    const description =
        `Азбучен списък на специалностите, които се изучават в поне два български университета. ` +
        `Виж къде се предлага всяка, по каква формула се образува балът и изчисли своя — безплатно.`;

    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 5rem" }}>
            <Seo title={title} description={description} path="/specialnosti" />
            <JsonLd data={BREADCRUMB} />

            <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
                <div style={{
                    fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--brand-cyan)", marginBottom: "0.5rem",
                }}>
                    Специалности
                </div>
                <h1 style={{
                    margin: 0, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800,
                    letterSpacing: "-0.03em", lineHeight: 1.1, textWrap: "balance",
                }}>
                    Специалности в България за прием {ADMISSION_YEAR_SHORT}
                </h1>
                <p style={{ margin: "1rem 0 0", fontSize: "1rem", lineHeight: 1.65, color: "var(--brand-muted)", maxWidth: "65ch" }}>
                    Тук са специалностите, които се изучават в поне два университета. Избери една и ще видиш
                    къде се предлага, по каква формула се образува балът и какъв е бил минималният бал за
                    прием, където има официални данни.
                </p>

                {status === "ok" && (
                    <div style={{ position: "relative", marginTop: "1.5rem", maxWidth: "28rem" }}>
                        <label htmlFor="spec-search" style={{
                            display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--brand-muted)", marginBottom: "0.5rem",
                        }}>
                            Търси специалност
                        </label>
                        <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: "1rem", bottom: "1rem", color: "var(--brand-muted)" }} />
                        <input
                            id="spec-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                            placeholder="напр. Право, Информатика"
                            style={{
                                width: "100%", height: "3rem", padding: "0 1rem 0 2.75rem",
                                background: "var(--brand-input-bg)", border: "1px solid var(--brand-input-border)",
                                borderRadius: "0.75rem", color: "var(--brand-text)", fontSize: "0.9375rem",
                                fontFamily: "inherit", outline: "none",
                            }}
                        />
                    </div>
                )}

                {status === "loading" && (
                    <p style={{ marginTop: "2rem", color: "var(--brand-muted)" }}>Зареждаме специалностите…</p>
                )}

                {status === "error" && (
                    <p style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-muted)" }}>
                        <AlertCircle size={16} strokeWidth={1.5} color="#FBBF24" />
                        Нещо се обърка при зареждането. Провери връзката и опитай пак.
                    </p>
                )}

                {status === "ok" && groups.length === 0 && (
                    <p style={{ marginTop: "2rem", color: "var(--brand-muted)", lineHeight: 1.65 }}>
                        Нищо не съвпада с „{query}“. Опитай с по-кратка дума или{" "}
                        <Link to="/universities/" style={{ color: "var(--brand-cyan)", fontWeight: 600, textDecoration: "none" }}>
                            търси във всички университети
                        </Link>.
                    </p>
                )}

                {status === "ok" && groups.map(([letter, list]) => (
                    <section key={letter} style={{ marginTop: "2rem" }}>
                        <h2 style={{
                            margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 800, fontFamily: "monospace",
                            color: "var(--brand-violet)",
                        }}>
                            {letter}
                        </h2>
                        <ul style={{
                            listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem",
                            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))",
                        }}>
                            {list.map((it) => (
                                <li key={it.name}>
                                    <Link
                                        to={`/specialnosti/${slugify(it.name)}/`}
                                        className="spec-index-link"
                                        style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
                                            minHeight: "44px", padding: "0.625rem 0.875rem", background: "var(--brand-surface)",
                                            border: CARD_BORDER, borderRadius: "0.75rem", textDecoration: "none",
                                            color: "var(--brand-text)", fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3,
                                        }}
                                    >
                                        <span>{it.name}</span>
                                        <span style={{ flexShrink: 0, fontSize: "0.75rem", fontWeight: 500, color: "var(--brand-muted)" }}>
                                            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{it.unis}</span> университета
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginTop: "2.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
                >
                    <Link to="/calculator/" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.75rem",
                        background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                        color: "#fff", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none", fontSize: "0.9375rem",
                    }}>
                        Изчисли моя бал <ArrowRight size={16} />
                    </Link>
                    <Link to="/universities/" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem",
                        border: "1px solid var(--brand-border)", color: "var(--brand-text)", borderRadius: "0.75rem",
                        fontWeight: 600, textDecoration: "none", fontSize: "0.9375rem",
                    }}>
                        Виж всички университети
                    </Link>
                </m.div>

                <p style={{ marginTop: "2rem", fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.6, maxWidth: "65ch" }}>
                    {DATA_FRESHNESS_NOTE} Специалности, които се
                    предлагат само в един университет, са на страницата на съответния университет.
                </p>
            </div>

            <style>{`
                .spec-index-link { transition: border-color 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.2s cubic-bezier(0.16,1,0.3,1); }
                .spec-index-link:hover { border-color: var(--brand-cyan); transform: translateY(-2px); }
                .spec-index-link:focus-visible { outline: 2px solid var(--brand-cyan); outline-offset: 2px; }
                #spec-search:focus { border-color: var(--brand-cyan); }
                @media (prefers-reduced-motion: reduce) { .spec-index-link { transition: none; } .spec-index-link:hover { transform: none; } }
            `}</style>
        </div>
    );
}
