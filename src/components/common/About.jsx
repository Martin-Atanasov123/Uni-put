import { Mail, Github, Code2, Briefcase, Users, Lightbulb, Database, BookOpen, Calculator, Brain } from "lucide-react";
import { m } from "motion/react";

const TEAM = [
    {
        name: "Мартин Атанасов",
        role: "Съосновател, архитект на платформата и full-stack разработчик",
        image: "/martin_snimka.webp",
        bio: "Мартин е фокусиран върху изграждането на дигитални продукти, които решават реални проблеми за ученици, родители и университети. В УниПът той отговаря за архитектурата на приложението, интеграцията със Supabase и проектирането на основните модули – от калкулатора за бал и логиката за RIASEC препоръки, до администраторския панел и инфраструктурата за данните. Вярва, че прозрачността и точната информация могат да променят начина, по който младите хора взимат решения за образованието си.",
        skills: ["React", "JavaScript / TypeScript", "Tailwind / DaisyUI", "Supabase / SQL", "GitHub / CI"],
        focus: "Архитектура на системи, синхронизация на данни между фронтенд и база, кандидатстудентски кампании, аналитика и инструменти за администратори.",
        email: "matanasov573@gmail.com",
        github: "https://github.com/Martin-Atanasov123",
        accent: "cyan",
    },
    {
        name: "Ивън Минков",
        role: "Съосновател, UI/UX и фронтенд разработчик",
        image: "/ivun_snimka.jpg",
        bio: "Ивън е ориентиран към детайла разработчик, който се грижи всяко взаимодействие в УниПът да е ясно, бързо и приятно за ползване. Той работи върху визуалната система на проекта, компонентите за търсене на университети и общежития, както и върху адаптивното поведение на интерфейса при различни устройства. Интересува се от достъпност, микроанимации и типография.",
        skills: ["C#", "Supabase / SQL", "Тестване на интерфейси", "Логистика"],
        focus: "Дизайн на интерфейси, интерактивни компоненти, оптимизация на UX потоци, тестове на потребителски сценарии и визуализация на комплексна информация.",
        email: "ivun.minkov05@gmail.com",
        github: "https://github.com/ivun1000",
        accent: "violet",
    },
];

function MemberCard({ member, reverse }) {
    const accentColor = member.accent === "cyan" ? "var(--brand-cyan)" : "var(--brand-violet)";
    const accentBg = member.accent === "cyan" ? "rgba(6,182,212,0.1)" : "rgba(139,92,246,0.1)";
    const accentBorder = member.accent === "cyan" ? "rgba(6,182,212,0.3)" : "rgba(139,92,246,0.3)";
    const glowRgb = member.accent === "cyan" ? "6,182,212" : "139,92,246";

    return (
        <article
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2.5rem",
                alignItems: "center",
                direction: reverse ? "rtl" : "ltr",
            }}
        >
            <div style={{ direction: "ltr", display: "flex", justifyContent: "center" }}>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "380px",
                        aspectRatio: "1 / 1",
                        borderRadius: "2rem",
                        overflow: "hidden",
                        background: `linear-gradient(135deg, ${accentBg}, transparent)`,
                        border: `1px solid ${accentBorder}`,
                        boxShadow: `0 24px 60px rgba(${glowRgb}, 0.18)`,
                    }}
                >
                    <img
                        src={member.image}
                        alt={member.name}
                        width={400}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, var(--brand-surface))", pointerEvents: "none" }} />
                </div>
            </div>

            <div style={{ direction: "ltr", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)", textWrap: "balance" }}>
                        {member.name}
                    </h2>
                    <p style={{ margin: "0.4rem 0 0", fontSize: "13px", color: accentColor, fontWeight: 600 }}>
                        {member.role}
                    </p>
                </div>

                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "var(--brand-muted)" }}>
                    {member.bio}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div>
                        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-muted)", marginBottom: "0.5rem" }}>
                            <Code2 size={13} /> Технически умения
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {member.skills.map(skill => (
                                <span
                                    key={skill}
                                    style={{
                                        padding: "0.25rem 0.625rem",
                                        background: accentBg,
                                        border: `1px solid ${accentBorder}`,
                                        borderRadius: "999px",
                                        color: accentColor,
                                        fontSize: "11px",
                                        fontWeight: 600,
                                    }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-muted)", marginBottom: "0.5rem" }}>
                            <Briefcase size={13} /> Професионален фокус
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.55, color: "var(--brand-text)", opacity: 0.9 }}>
                            {member.focus}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", paddingTop: "0.5rem" }}>
                    <a
                        href={`mailto:${member.email}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.5rem 0.875rem",
                            background: accentBg,
                            border: `1px solid ${accentBorder}`,
                            borderRadius: "999px",
                            color: accentColor,
                            fontSize: "12px",
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        <Mail size={14} /> Имейл
                    </a>
                    <a
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.5rem 0.875rem",
                            background: "transparent",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "999px",
                            color: "var(--brand-muted)",
                            fontSize: "12px",
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        <Github size={14} /> GitHub
                    </a>
                </div>
            </div>
        </article>
    );
}

const About = () => {
    return (
        <main
            style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}
            aria-labelledby="about-title"
        >
            <div aria-hidden style={{ position: "absolute", top: "-200px", right: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: "20%", left: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "5rem", position: "relative" }}>
                <m.header
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 auto" }}>
                        <Users size={12} /> За нас
                    </div>
                    <h1
                        id="about-title"
                        style={{
                            margin: 0,
                            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.05,
                            textWrap: "balance",
                        }}
                    >
                        Хората зад{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            УниПът
                        </span>
                    </h1>
                    <p style={{ margin: "0.5rem auto 0", maxWidth: "720px", fontSize: "1rem", color: "var(--brand-muted)", lineHeight: 1.65 }}>
                        УниПът е създаден, за да помогне на кандидат-студентите в България да вземат информирани решения за своето бъдеще. Комбинираме данни за университети, специалности, балове и общежития в една интуитивна платформа и я развиваме с внимание към детайла, достъпността и високия перформанс.
                    </p>
                </m.header>

                {/* ── Why We Built This ── */}
                <m.section
                    aria-labelledby="why-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "3rem", alignItems: "start" }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "999px", color: "var(--brand-violet)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", width: "fit-content" }}>
                            <Lightbulb size={11} /> Защо го изградихме
                        </div>
                        <h2
                            id="why-title"
                            style={{ margin: 0, fontSize: "clamp(1.625rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, color: "var(--brand-text)", textWrap: "balance" }}
                        >
                            Защото тази информация не трябва да е трудна за намиране
                        </h2>
                        <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.7, color: "var(--brand-muted)" }}>
                            Формулата за приемен бал е публична — но разпръсната в PDF-и, наредби и форуми от 2019 г. Всяка специалност прилага различни коефициенти за различни изпити. Никой не е събрал всичко на едно място, докато не го направихме ние.
                        </p>
                        <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.7, color: "var(--brand-muted)" }}>
                            Добавихме RIASEC кариерния тест, защото 17-годишен ученик не трябва да избира специалност само по бал — а по това кой е. Всичко останало — общежития, университети, сравнения — следва от същата идея: намали хаоса, дай яснота.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {[
                            { icon: Calculator, color: "var(--brand-cyan)", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)", title: "Точен калкулатор", desc: "Прилагаме официалните коефициенти от наредбите на МОН за всяка специалност поотделно — не приблизителна формула." },
                            { icon: Brain, color: "var(--brand-violet)", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)", title: "RIASEC профил", desc: "Научно обоснован метод за съпоставяне на личностни интереси с кариерни пътища и специалности." },
                            { icon: BookOpen, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", title: "Агрегирани данни", desc: "Университети, факултети, общежития и исторически балове на едно място — без да ровиш в отделни сайтове." },
                        ].map(({ icon: Icon, color, bg, border, title, desc }) => (
                            <div key={title} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1.25rem", background: "var(--brand-surface)", border: "1px solid var(--brand-card-border)", borderRadius: "1rem" }}>
                                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-text)" }}>{title}</p>
                                    <p style={{ margin: "0.25rem 0 0", fontSize: "13px", color: "var(--brand-muted)", lineHeight: 1.55 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </m.section>

                {/* ── Data Transparency ── */}
                <m.section
                    aria-labelledby="data-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        padding: "2rem",
                        background: "linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))",
                        border: "1px solid var(--brand-card-border)",
                        borderRadius: "1.25rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Database size={16} style={{ color: "var(--brand-cyan)" }} />
                        </div>
                        <h2
                            id="data-title"
                            style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-text)", letterSpacing: "-0.01em", textWrap: "balance" }}
                        >
                            Прозрачност на данните
                        </h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                        {[
                            { label: "Приемни балове и коефициенти", source: "Наредби на МОН, актуализирани за 2025 г.", href: "https://www.mon.bg" },
                            { label: "Кариерни профили (RIASEC)", source: "O*NET Career Database (база данни за кариери от O*NET)", href: "https://www.onetonline.org" },
                            { label: "Информация за университети", source: "Официални сайтове на университетите + МОН регистър", href: "https://www.mon.bg" },
                            { label: "Общежития", source: "Информация от публично достъпни университетски справочници", href: null },
                        ].map(({ label, source, href }) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-text)" }}>{label}</span>
                                {href ? (
                                    <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--brand-cyan)", textDecoration: "none", lineHeight: 1.5, opacity: 0.85 }}>{source} ↗</a>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "var(--brand-muted)", lineHeight: 1.5 }}>{source}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <p style={{ margin: "1.25rem 0 0", fontSize: "12px", color: "var(--brand-muted)", opacity: 0.7, lineHeight: 1.6 }}>
                        Данните се актуализират при публикуване на нови наредби. Признаваме честно когато нещо не е покрито — виж известието в калкулатора. Ако забележиш грешка, използвай бутона „Докладвай грешка" до всеки резултат.
                    </p>
                </m.section>

                <m.section
                    aria-label="Екип"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "flex", flexDirection: "column", gap: "5rem" }}
                >
                    {TEAM.map((member, idx) => (
                        <MemberCard key={member.name} member={member} reverse={idx % 2 === 1} />
                    ))}
                </m.section>
            </div>
        </main>
    );
};

export default About;
