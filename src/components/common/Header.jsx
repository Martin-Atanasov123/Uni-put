import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { sessionService } from "@/services/sessionService";
import { useTheme } from "@/hooks/useTheme";
import {
    User, LogOut, LayoutDashboard, Menu, X, GraduationCap,
    Calculator, Search, Settings, Building2, Heart, ChevronDown,
    Brain, ClipboardList, CalendarDays, Sun, Moon, MoreHorizontal, BookOpen
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

// CLAUDE.md nav order: Университети / Калкулатор / Кариерен тест / Общежития (max 4 items)
//
// Trailing slash е ЗАДЪЛЖИТЕЛЕН — това е канoничната форма (виж Seo.jsx). Netlify
// 301-redirect-ва /about → /about/, така че връзка без наклонена черта праща
// Googlebot през излишен redirect и GSC я отчита като "Page with redirect"
// вместо да индексира директно канoничния URL.
const PRIMARY_NAV_LINKS = [
    { name: "Университети",   path: "/universities/",   icon: Search },
    { name: "Калкулатор",     path: "/calculator/",     icon: Calculator },
    { name: "Кариерен тест",  path: "/career-advisor/", icon: Brain },
    { name: "Прием след 7. клас", path: "/priem-7-klas/", icon: GraduationCap },
];

const MORE_LINKS = [
    { name: "ДЗИ стратег", path: "/dzi-strateg/", icon: Brain, description: "План и подготовка за матурите" },
    { name: "Специалности", path: "/specialnosti/", icon: BookOpen, description: "Разгледай всички направления" },
    { name: "Календар", path: "/calendar/", icon: CalendarDays, description: "Срокове и важни дати" },
    { name: "Общежития", path: "/dormitories/", icon: Building2, description: "Настаняване към университетите" },
    { name: "Любими", path: "/favorites/", icon: Heart, description: "Запазените ти възможности" },
    { name: "Моите оценки", path: "/my-grades/", icon: ClipboardList, description: "Оценки и личен напредък" },
    { name: "За нас", path: "/about/", icon: GraduationCap, description: "Мисията зад УниПът" },
];

/**
 * Малък avatar badge за хедъра — gradient circle с първата буква.
 * Avatar upload е премахнат напълно по UX решение; всички профили имат
 * единен initial-based avatar (като много модерни SaaS apps).
 */
function HeaderAvatar({ user, size = 28 }) {
    const md = user?.user_metadata || {};
    const source = (md.username || (user?.email || "").split("@")[0] || "").trim();
    const initial = (source[0] || "У").toUpperCase();
    const fontSize = Math.round(size * 0.5); // 14px при 28px circle

    return (
        <div style={{
            width: `${size}px`, height: `${size}px`, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
            color: "#fff", fontSize: `${fontSize}px`, fontWeight: 900, letterSpacing: "-0.02em",
        }}>
            <span>{initial}</span>
        </div>
    );
}

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggle: toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef();
    const moreMenuRef = useRef();

    const isAdmin = user?.app_metadata?.role === "admin";

    useEffect(() => {
        let rafId = null;
        const onScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                setScrolled(window.scrollY > 20);
                rafId = null;
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll, { passive: true });
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        const onClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setIsMoreMenuOpen(false);
        };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsMoreMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") setIsMoreMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const handleLogout = useCallback(async () => {
        await sessionService.logout();
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
        navigate("/login");
    }, [navigate]);

    // Сравнява без значение от trailing slash: NAV_LINKS сочат към канoничната
    // форма (/about/), но потребител може да отвори и /about директно — активното
    // състояние трябва да работи и в двата случая.
    const isActive = useCallback((path) => {
        const strip = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
        return strip(location.pathname) === strip(path);
    }, [location.pathname]);

    return (
        <>
            <nav style={{
                position: "fixed", top: scrolled ? "0.5rem" : 0, left: 0, right: 0, zIndex: 100,
                padding: "0.75rem 1rem", transition: "top 0.4s",
            }}>
                <div style={{
                    maxWidth: "80rem", margin: "0 auto",
                    background: scrolled ? "var(--brand-nav-scrolled)" : "var(--brand-nav-bg)",
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${scrolled ? "color-mix(in srgb, var(--brand-cyan) 22%, transparent)" : "var(--brand-border)"}`,
                    borderRadius: "1.25rem",
                    padding: scrolled ? "0.5rem 1rem" : "0.75rem 1rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.4s",
                    boxShadow: "0 10px 40px var(--brand-shadow)",
                }}>
                    {/* Brand */}
                    <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                        <img
                            src="/logo-uniput.png"
                            alt="УниПът лого"
                            width="188"
                            height="160"
                            style={{ height: scrolled ? "48px" : "56px", width: "auto", objectFit: "contain" }}
                        />
                    </Link>

                    {/* Desktop nav */}
                    <div className="uni-nav-desktop" style={{ alignItems: "center", gap: "0.25rem" }}>
                        {PRIMARY_NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`uni-nav-link${active ? " uni-nav-link--active" : ""}`}
                                >
                                    <Icon size={14} /> {link.name}
                                </Link>
                            );
                        })}
                        <div ref={moreMenuRef} className="uni-more-wrap">
                            <button
                                type="button"
                                className={`uni-nav-link uni-more-btn${MORE_LINKS.some((link) => isActive(link.path)) ? " uni-nav-link--active" : ""}`}
                                onClick={() => setIsMoreMenuOpen((open) => !open)}
                                aria-haspopup="menu"
                                aria-expanded={isMoreMenuOpen}
                            >
                                <MoreHorizontal size={14} /> Още функции
                                <ChevronDown size={13} className={isMoreMenuOpen ? "uni-chevron-open" : ""} />
                            </button>
                            {isMoreMenuOpen && (
                                <div className="uni-more-menu" role="menu" aria-label="Още функции">
                                    <div className="uni-more-heading">Всички възможности</div>
                                    <div className="uni-more-grid">
                                        {MORE_LINKS.map((link) => {
                                            const Icon = link.icon;
                                            return (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    role="menuitem"
                                                    className={`uni-more-item${isActive(link.path) ? " uni-more-item--active" : ""}`}
                                                >
                                                    <span className="uni-more-icon"><Icon size={17} /></span>
                                                    <span>
                                                        <strong>{link.name}</strong>
                                                        <small>{link.description}</small>
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        {isAdmin && (
                            <Link to="/admin" style={{
                                display: "flex", alignItems: "center", gap: "0.375rem",
                                padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                                fontSize: "13px", fontWeight: 700, textDecoration: "none",
                                color: "var(--brand-violet)",
                                background: isActive("/admin") ? "var(--brand-subtle)" : "transparent",
                                border: "1px solid color-mix(in srgb, var(--brand-cyan) 28%, transparent)",
                            }}>
                                <Settings size={14} /> Админ
                            </Link>
                        )}
                    </div>

                    {/* Right: CTA + auth */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                            className="uni-theme-toggle"
                            type="button"
                            onClick={toggleTheme}
                            aria-label={theme === "dark" ? "Включи светла тема" : "Включи тъмна тема"}
                            title={theme === "dark" ? "Светла тема" : "Тъмна тема"}
                            style={{
                                width: "2.5rem", height: "2.5rem", display: "grid", placeItems: "center",
                                borderRadius: "0.75rem", background: "var(--brand-surface)",
                                border: "1px solid var(--brand-border)", color: "var(--brand-text)",
                                cursor: "pointer", flexShrink: 0,
                            }}
                        >
                            <span key={theme} className="uni-theme-icon" aria-hidden="true">
                                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                            </span>
                        </button>
                        {/* Primary CTA — always visible on desktop */}
                        <Link
                            to="/calculator/"
                            className="uni-nav-desktop uni-nav-cta"
                        >
                            Изчисли бал →
                        </Link>

                        {!user ? (
                            <div className="uni-nav-desktop" style={{ alignItems: "center", gap: "0.375rem" }}>
                                <Link to="/login" style={{
                                    padding: "0.5rem 0.75rem", borderRadius: "0.625rem",
                                    fontSize: "13px", fontWeight: 600, color: "var(--brand-muted)", textDecoration: "none",
                                }}>Вход</Link>
                                <Link to="/register" style={{
                                    padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                                    fontSize: "13px", fontWeight: 700, color: "var(--brand-text)", textDecoration: "none",
                                    background: "var(--brand-surface)", border: "1px solid var(--brand-border)",
                                }}>Регистрация</Link>
                            </div>
                        ) : (
                            <div ref={userMenuRef} style={{ position: "relative" }}>
                                <button
                                    onClick={() => setIsUserMenuOpen((o) => !o)}
                                    aria-label="Меню на профила"
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "0.375rem",
                                        padding: "0.375rem 0.5rem 0.375rem 0.375rem",
                                        background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.12)",
                                        borderRadius: "999px", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                >
                                    <HeaderAvatar user={user} size={28} />
                                    <ChevronDown size={14} color="var(--brand-muted)" />
                                </button>
                                {isUserMenuOpen && (
                                    <div style={{
                                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                                        minWidth: "15rem", background: "var(--brand-dropdown-bg)",
                                        border: "1px solid var(--brand-border)", borderRadius: "0.875rem",
                                        boxShadow: "0 20px 60px var(--brand-shadow)", padding: "0.5rem",
                                        zIndex: 110,
                                    }}>
                                        <div style={{ padding: "0.625rem 0.75rem", marginBottom: "0.25rem",
                                            background: "color-mix(in srgb, var(--brand-cyan) 7%, transparent)", borderRadius: "0.625rem" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Добре дошъл</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-cyan)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {user.user_metadata?.username || user.email}
                                            </div>
                                        </div>
                                        {isAdmin && <MenuItem to="/admin" icon={Settings} label="Админ панел" color="var(--brand-violet)" />}
                                        <MenuItem to="/profile" icon={User} label="Профил" />
                                        <MenuItem to="/my-grades" icon={ClipboardList} label="Моите оценки" />
                                        <MenuItem to="/favorites" icon={Heart} label="Любими" />
                                        <div style={{ height: "1px", background: "rgba(148,163,184,0.1)", margin: "0.375rem 0" }} />
                                        <button onClick={handleLogout} style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                                            padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                                            fontSize: "13px", fontWeight: 600, color: "#f87171",
                                            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                        }}
                                        className="uni-logout-btn"
                                        >
                                            <LogOut size={14} /> Изход
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="uni-nav-mobile"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Отвори меню"
                            style={{
                                padding: "0.5rem", background: "rgba(148,163,184,0.08)",
                                border: "1px solid rgba(148,163,184,0.12)", borderRadius: "0.625rem",
                                color: "var(--brand-text)", cursor: "pointer",
                            }}
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 110 }}>
                    <div onClick={() => setIsMenuOpen(false)} style={{
                        position: "absolute", inset: 0, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)",
                    }} />
                    <div style={{
                        position: "absolute", top: 0, right: 0, height: "100%", width: "min(85vw, 22rem)",
                        background: "var(--brand-bg)", borderLeft: "1px solid var(--brand-border)",
                        padding: "1.5rem", display: "flex", flexDirection: "column",
                        animation: "slideIn 0.3s ease-out",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <span style={{
                                fontSize: "1.125rem", fontWeight: 800,
                                background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>УниПът</span>
                            <button onClick={() => setIsMenuOpen(false)} aria-label="Затвори меню" style={{
                                padding: "0.5rem", background: "rgba(148,163,184,0.08)",
                                border: "1px solid rgba(148,163,184,0.12)", borderRadius: "0.625rem",
                                color: "var(--brand-text)", cursor: "pointer",
                            }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="uni-mobile-links">
                            <div className="uni-mobile-section-label">Основни</div>
                            {PRIMARY_NAV_LINKS.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <Link key={link.path} to={link.path} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                        fontSize: "14px", fontWeight: 600, textDecoration: "none",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-text)",
                                        background: active ? "var(--brand-card-hover)" : "var(--brand-surface-2)",
                                        border: active ? "1px solid color-mix(in srgb, var(--brand-cyan) 28%, transparent)" : "1px solid var(--brand-border)",
                                    }}>
                                        <Icon size={16} /> {link.name}
                                    </Link>
                                );
                            })}
                            <div className="uni-mobile-section-label uni-mobile-section-label--spaced">Още функции</div>
                            {MORE_LINKS.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <Link key={link.path} to={link.path} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                        fontSize: "14px", fontWeight: 600, textDecoration: "none",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-text)",
                                        background: active ? "var(--brand-card-hover)" : "var(--brand-surface-2)",
                                        border: active ? "1px solid color-mix(in srgb, var(--brand-cyan) 28%, transparent)" : "1px solid var(--brand-border)",
                                    }}>
                                        <Icon size={16} /> {link.name}
                                    </Link>
                                );
                            })}
                            {isAdmin && (
                                <Link to="/admin" style={{
                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                    padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                    fontSize: "14px", fontWeight: 700, textDecoration: "none",
                                    color: "var(--brand-violet)",
                                    background: "color-mix(in srgb, var(--signal) 10%, transparent)",
                                    border: "1px solid color-mix(in srgb, var(--signal) 28%, transparent)",
                                }}>
                                    <Settings size={16} /> Админ панел
                                </Link>
                            )}
                        </div>

                        <div style={{ paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {/* Primary CTA always at bottom of mobile menu */}
                            <Link to="/calculator/" style={{
                                padding: "0.875rem", borderRadius: "0.75rem", textAlign: "center",
                                fontSize: "14px", fontWeight: 800, textDecoration: "none",
                                color: "var(--brand-cyan)", border: "1px solid color-mix(in srgb, var(--brand-cyan) 40%, transparent)",
                                background: "color-mix(in srgb, var(--brand-cyan) 9%, transparent)",
                            }}>Изчисли бал →</Link>

                            {!user ? (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <Link to="/login" style={{
                                        padding: "0.75rem", borderRadius: "0.625rem", textAlign: "center",
                                        fontSize: "13px", fontWeight: 700, textDecoration: "none",
                                        color: "var(--brand-text)", background: "rgba(148,163,184,0.08)",
                                        border: "1px solid rgba(148,163,184,0.12)",
                                    }}>Вход</Link>
                                    <Link to="/register" style={{
                                        padding: "0.75rem", borderRadius: "0.625rem", textAlign: "center",
                                        fontSize: "13px", fontWeight: 700, textDecoration: "none",
                                        color: "var(--brand-text)", background: "var(--brand-surface)",
                                        border: "1px solid var(--brand-border)",
                                    }}>Регистрация</Link>
                                </div>
                            ) : (
                                <button onClick={handleLogout} style={{
                                    width: "100%", padding: "0.75rem", borderRadius: "0.625rem",
                                    fontSize: "13px", fontWeight: 700, color: "#f87171",
                                    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                                    cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                }}>
                                    <LogOut size={14} /> Изход
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .uni-nav-desktop { display: none; }
                .uni-nav-mobile { display: flex; }
                @media (min-width: 1320px) {
                    .uni-nav-desktop { display: flex; }
                    .uni-nav-mobile { display: none; }
                }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

                /* Nav link — replaces inline onMouseEnter/onMouseLeave handlers */
                .uni-nav-link {
                    display: flex; align-items: center; gap: 0.375rem;
                    padding: 0.5rem 0.875rem; border-radius: 0.625rem;
                    font-size: 13px; font-weight: 600; text-decoration: none;
                    color: var(--brand-muted);
                    background: transparent;
                    border: 1px solid transparent;
                    transition: color 0.2s, background 0.2s, border-color 0.2s;
                }
                .uni-nav-link:hover {
                    color: var(--brand-text);
                }
                .uni-nav-link--active {
                    color: var(--brand-cyan) !important;
                    background: color-mix(in srgb, var(--brand-cyan) 10%, transparent);
                    border-color: color-mix(in srgb, var(--brand-cyan) 25%, transparent);
                }

                .uni-more-wrap { position: relative; }
                .uni-more-btn { font-family: inherit; cursor: pointer; }
                .uni-more-btn .lucide-chevron-down { transition: transform 0.2s ease; }
                .uni-more-btn .uni-chevron-open { transform: rotate(180deg); }
                .uni-more-menu {
                    position: absolute; top: calc(100% + 0.75rem); right: 0;
                    width: min(38rem, calc(100vw - 2rem)); padding: 0.75rem;
                    background: var(--brand-dropdown-bg); border: 1px solid var(--brand-border);
                    border-radius: 1rem; box-shadow: 0 24px 70px var(--brand-shadow);
                    animation: uniMenuIn 0.2s ease-out; transform-origin: top right;
                }
                .uni-more-heading {
                    padding: 0.375rem 0.5rem 0.625rem; color: var(--brand-muted);
                    font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
                }
                .uni-more-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.375rem; }
                .uni-more-item {
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
                    border: 1px solid transparent; border-radius: 0.75rem; color: var(--brand-text);
                    text-decoration: none; transition: background 0.2s, border-color 0.2s, transform 0.2s;
                }
                .uni-more-item:hover { background: var(--brand-surface-2); border-color: var(--brand-border); transform: translateY(-1px); }
                .uni-more-item--active { background: color-mix(in srgb, var(--brand-cyan) 9%, transparent); border-color: color-mix(in srgb, var(--brand-cyan) 28%, transparent); }
                .uni-more-icon {
                    width: 2.25rem; height: 2.25rem; display: grid; place-items: center; flex-shrink: 0;
                    border-radius: 0.625rem; color: var(--brand-cyan);
                    background: color-mix(in srgb, var(--brand-cyan) 10%, var(--brand-surface));
                }
                .uni-more-item strong { display: block; font-size: 13px; line-height: 1.25; }
                .uni-more-item small { display: block; margin-top: 0.2rem; color: var(--brand-muted); font-size: 11px; line-height: 1.3; }
                .uni-mobile-links { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; overflow-y: auto; padding-right: 0.125rem; }
                .uni-mobile-section-label { padding: 0 0.25rem 0.25rem; color: var(--brand-muted); font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
                .uni-mobile-section-label--spaced { margin-top: 0.75rem; }
                @keyframes uniMenuIn { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

                /* Calculator CTA button — replaces inline hover handlers */
                .uni-nav-cta {
                    padding: 0.5rem 1rem; border-radius: 0.625rem;
                    font-size: 13px; font-weight: 700; color: var(--brand-cyan); text-decoration: none;
                    border: 1px solid color-mix(in srgb, var(--brand-cyan) 40%, transparent);
                    background: color-mix(in srgb, var(--brand-cyan) 6%, transparent);
                    transition: background 0.2s, border-color 0.2s;
                }
                .uni-nav-cta:hover {
                    background: color-mix(in srgb, var(--brand-cyan) 12%, transparent);
                    border-color: color-mix(in srgb, var(--brand-cyan) 70%, transparent);
                }

                /* Dropdown menu item */
                .uni-menu-item { transition: background 0.15s; }
                .uni-menu-item:hover { background: rgba(148,163,184,0.06) !important; }

                /* Logout button */
                .uni-logout-btn { transition: background 0.15s; }
                .uni-logout-btn:hover { background: rgba(248,113,113,0.08) !important; }
            `}</style>
        </>
    );
}

function MenuItem({ to, icon: Icon, label, color = "var(--brand-text)" }) {
    return (
        <Link to={to} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
            fontSize: "13px", fontWeight: 600, color, textDecoration: "none",
            transition: "background 0.15s",
        }}
        className="uni-menu-item"
        >
            <Icon size={14} /> {label}
        </Link>
    );
}
