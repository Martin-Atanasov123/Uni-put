import { useLocation, Link } from "react-router-dom";
import { ExternalLink, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

// Футър по design.md (раздели 11–12): същите пътища като хедъра, източници, отговорност,
// контакт и правни страници. Без декоративни ефекти; външните връзки не отварят нов раздел.
const COLUMNS = [
    {
        title: "Разгледай",
        links: [
            { label: "Специалности", href: "/specialnosti/" },
            { label: "Университети", href: "/universities/" },
            { label: "Кариерно ориентиране", href: "/career-advisor/" },
            { label: "Калкулатор на бал", href: "/calculator/" },
            { label: "Запазени", href: "/favorites/" },
        ],
    },
    {
        title: "Още инструменти",
        links: [
            { label: "ДЗИ Стратег", href: "/dzi-strateg/" },
            { label: "Прием след 7. клас", href: "/priem-7-klas/" },
            { label: "Календар", href: "/calendar/" },
            { label: "Общежития", href: "/dormitories/" },
        ],
    },
    {
        title: "Източници",
        links: [
            { label: "МОН: висше образование", href: "https://www.mon.bg/visshe-obrazovanie/", external: true },
            { label: "НАОА: акредитация", href: "https://www.neaa.government.bg/akreditirani-institucii/visshi-uchilischa", external: true },
            { label: "Рейтингова система на ВУ", href: "https://rsvu.mon.bg/", external: true },
        ],
    },
    {
        title: "Проектът",
        links: [
            { label: "За нас", href: "/about/" },
            { label: "Пиши ни", href: "mailto:uniput1000@gmail.com", mail: true },
            { label: "Условия за ползване", href: "/terms/" },
            { label: "Поверителност", href: "/privacy/" },
        ],
    },
];

function FooterLink({ link }) {
    if (link.external || link.mail) {
        return (
            <a href={link.href} className="ft-link">
                {link.label}
                {link.external && <ExternalLink size={13} strokeWidth={1.75} aria-hidden="true" />}
                {link.external && <span className="ft-sr"> (външен сайт)</span>}
            </a>
        );
    }
    return <Link to={link.href} className="ft-link">{link.label}</Link>;
}

const Footer = () => {
    const location = useLocation();
    const mobile = useIsMobile();
    if (location.pathname.startsWith("/admin")) return null;
    const year = new Date().getFullYear();

    return (
        <footer className="ft" aria-labelledby="ft-title">
            <h2 id="ft-title" className="ft-sr">Долен колонтитул</h2>
            <div className="ft-wrap">
                <div className="ft-grid">
                    <div className="ft-brand">
                        <Link to="/" className="ft-logo" aria-label="УниПът — начало">
                            <img src="/logo-uniput.png" alt="UniПът" width="56" height="44" />
                        </Link>
                        <p>Независим образователен навигатор за специалности, университети и прием в България.</p>
                        <p className="ft-note">Не сме част от МОН и не представляваме университетите. Проверявай условията в официалния правилник за прием.</p>
                    </div>
                    {mobile ? (
                        // Телефон: групите са свити, за да не е подвалът стена от линкове.
                        <div className="ft-folds">
                            {COLUMNS.map((col) => (
                                <details key={col.title} className="ft-fold">
                                    <summary><span>{col.title}</span><ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" /></summary>
                                    <nav aria-label={col.title}>
                                        <ul>
                                            {col.links.map((l) => <li key={l.label}><FooterLink link={l} /></li>)}
                                        </ul>
                                    </nav>
                                </details>
                            ))}
                        </div>
                    ) : COLUMNS.map((col) => (
                        <nav key={col.title} aria-label={col.title} className="ft-col">
                            <h3>{col.title}</h3>
                            <ul>
                                {col.links.map((l) => <li key={l.label}><FooterLink link={l} /></li>)}
                            </ul>
                        </nav>
                    ))}
                </div>
                {mobile && (
                    <nav className="ft-quick" aria-label="Основни връзки">
                        <Link to="/privacy/" className="ft-link">Поверителност</Link>
                        <Link to="/terms/" className="ft-link">Условия</Link>
                        <a href="mailto:uniput1000@gmail.com" className="ft-link">Пиши ни</a>
                    </nav>
                )}
                <div className="ft-legal">
                    <span>© {year} UniПът</span>
                    <span>Данните се проверяват за всяка приемна кампания; винаги с година и източник.</span>
                </div>
            </div>
            <style>{`
                .ft { background: var(--surface); border-top: 1px solid var(--border); color: var(--ink); }
                .ft-wrap { max-width: 1280px; margin: 0 auto; padding: 56px clamp(16px, 4vw, 64px) 32px; }
                .ft-grid { display: grid; gap: 40px; }
                @media (min-width: 768px) { .ft-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (min-width: 1200px) { .ft-grid { grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr)); gap: 32px; } }
                .ft-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); font-size: 20px; font-weight: 750; letter-spacing: -0.01em; min-height: 44px; }
                .ft-logo img { width: auto; height: 44px; object-fit: contain; }
                .ft-brand p { margin: 12px 0 0; font-size: 15px; line-height: 1.55; color: var(--ink-muted); max-width: 40ch; }
                .ft-brand .ft-note { font-size: 14px; }
                .ft-col h3 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--ink); }
                .ft-col ul { list-style: none; margin: 0; padding: 0; }
                .ft-link { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 4px 0; font-size: 15px; color: var(--ink-muted); text-decoration: none; transition: color 0.14s ease; }
                .ft-link:hover { color: var(--brand); text-decoration: underline; text-underline-offset: 3px; }
                .ft-legal { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between; font-size: 13px; color: var(--ink-muted); }
                @media (max-width: 767px) {
                    .ft-wrap { padding-top: 32px; padding-bottom: 24px; }
                    .ft-grid { gap: 20px; }
                    .ft-brand p { font-size: 14px; }
                    .ft-folds { border-top: 1px solid var(--border); }
                    .ft-fold { border-bottom: 1px solid var(--border); }
                    .ft-fold summary { list-style: none; display: flex; align-items: center; justify-content: space-between; min-height: 52px; font-size: 15px; font-weight: 700; cursor: pointer; }
                    .ft-fold summary::-webkit-details-marker { display: none; }
                    .ft-fold summary svg { color: var(--ink-muted); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                    .ft-fold[open] summary svg { transform: rotate(180deg); }
                    .ft-fold summary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
                    .ft-fold ul { list-style: none; margin: 0 0 10px; padding: 0; }
                    .ft-fold .ft-link { min-height: 44px; }
                    .ft-quick { display: flex; flex-wrap: wrap; gap: 0 20px; margin-top: 12px; }
                    .ft-quick .ft-link { min-height: 44px; font-weight: 600; color: var(--ink); }
                    .ft-legal { margin-top: 12px; }
                }
                .ft-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
            `}</style>
        </footer>
    );
};

export default Footer;
