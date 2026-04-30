import {
    ExternalLink,
    ShieldCheck,
    Info,
    BookOpen,
    FileText,
    GraduationCap,
    Heart,
    Database,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { m } from "motion/react";

const LINK_COLUMNS = [
    {
        title: "Официални Ресурси",
        links: [
            { label: "Данни от МОН", icon: Database, href: "https://www.mon.bg", external: true },
            { label: "Информация за ДЗИ", icon: BookOpen, href: "https://www.mon.bg/obshto-obrazovanie/darzhavni-zrelostni-izpiti-dzi", external: true },
            { label: "Новини от МОН", icon: ExternalLink, href: "https://www.mon.bg/novini/", external: true },
            { label: "Държавни изпити", icon: FileText, href: "https://www.mon.bg/obshto-obrazovanie/darzhavni-zrelostni-izpiti-dzi/izpitni-materiali-za-dzi-po-godini/", external: true },
        ],
    },
    {
        title: "Проектът",
        links: [
            { label: "За нас", icon: Info, href: "/about" },
            { label: "Лиценз GNU", icon: ShieldCheck, href: "https://www.gnu.org/licenses/gpl-3.0.html", external: true },
        ],
    },
    {
        title: "Правна част",
        links: [
            { label: "Условия за ползване", href: "/terms" },
            { label: "Поверителност", href: "/privacy" },
        ],
    },
];

function FooterLink({ link }) {
    const Icon = link.icon;
    const content = (
        <>
            {Icon && <Icon size={13} style={{ opacity: 0.7 }} />}
            <span>{link.label}</span>
        </>
    );
    const style = {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        color: "var(--brand-muted)",
        fontSize: "13px",
        fontWeight: 500,
        textDecoration: "none",
        transition: "color 0.2s",
    };
    const onEnter = e => { e.currentTarget.style.color = "var(--brand-cyan)"; };
    const onLeave = e => { e.currentTarget.style.color = "var(--brand-muted)"; };

    if (link.external) {
        return (
            <a href={link.href} target="_blank" rel="noreferrer" style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                {content}
            </a>
        );
    }
    return (
        <Link to={link.href} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
            {content}
        </Link>
    );
}

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    if (location.pathname.startsWith("/admin")) return null;

    return (
        <footer
            style={{
                position: "relative",
                background: "linear-gradient(180deg, transparent 0%, var(--brand-surface) 30%, var(--brand-bg) 100%)",
                borderTop: "1px solid var(--brand-border)",
                overflow: "hidden",
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), rgba(139,92,246,0.4), transparent)",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: "-120px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "640px",
                    height: "240px",
                    background: "radial-gradient(ellipse at center, rgba(6,182,212,0.08), transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{ maxWidth: "1200px", margin: "0 auto", padding: "3.5rem 1.5rem 2rem", position: "relative" }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "3rem",
                        marginBottom: "3rem",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div
                                style={{
                                    width: "2.25rem",
                                    height: "2.25rem",
                                    borderRadius: "0.625rem",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 8px 24px rgba(6,182,212,0.25)",
                                }}
                            >
                                <GraduationCap size={20} color="#fff" />
                            </div>
                            <span
                                style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                УниПът
                            </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--brand-muted)", lineHeight: 1.6, margin: 0 }}>
                            Твоят дигитален пътеводител към висшето образование в България. Данните са от официалните наредби на МОН, актуализирани за {currentYear} г.
                        </p>
                        {/* <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                alignSelf: "flex-start",
                                padding: "0.3rem 0.625rem",
                                background: "rgba(139,92,246,0.1)",
                                border: "1px solid rgba(139,92,246,0.3)",
                                borderRadius: "999px",
                                color: "#c4b5fd",
                                fontSize: "10px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            НОИТ 2026
                        </span> */}
                    </div>

                    {LINK_COLUMNS.map(col => (
                        <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: "var(--brand-cyan)",
                                    opacity: 0.85,
                                }}
                            >
                                {col.title}
                            </h3>
                            {col.links.map(link => <FooterLink key={link.label} link={link} />)}
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        paddingTop: "1.5rem",
                        borderTop: "1px solid var(--brand-border)",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--brand-muted)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            opacity: 0.7,
                            
                        }}
                    >
                        © {currentYear} УниПът Bulgaria — Всички права запазени
                    </p>
                    {/* <p style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "var(--brand-muted)", opacity: 0.7 }}>
                        Направено с <Heart size={11} style={{ color: "#f87171", fill: "#f87171" }} /> в България
                    </p> */}
                </div>
            </m.div>
        </footer>
    );
};

export default Footer;
