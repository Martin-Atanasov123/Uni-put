import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { sessionService } from "@/services/sessionService";
import { useTheme } from "@/hooks/useTheme";
import { User, LogOut, Menu, X, Search, Settings, Heart, ChevronDown, ClipboardList, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { MAIN_NAV, MORE_TOOLS } from "@/components/common/navItems";

// ── Навигация по design.md (раздел 11) ──────────────────────────────────────
// Публично: Специалности | Университети | Кариерно ориентиране | Калкулатор на бал | Запазени.
// Останалите инструменти са в падащото „Още“ (desktop), в менюто (мобилно) и във футъра.
//
// Trailing slash е ЗАДЪЛЖИТЕЛЕН — каноничната форма (виж Seo.jsx). Netlify
// 301-redirect-ва /about → /about/, затова връзка без наклонена черта праща
// Googlebot през излишен redirect.
const NAV_GROUPS = [
    { key: "main", label: "Основни", items: MAIN_NAV },
    { key: "more", label: "Още инструменти", items: MORE_TOOLS },
];

// Отрязва дължина и махa специални символи — стойността отива в URL и в заявка към каталога.
const cleanQuery = (v) => v.replace(/[%_\\'";<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

/**
 * Малък avatar badge за хедъра — кръг с първата буква.
 */
function HeaderAvatar({ user, size = 28 }) {
    const md = user?.user_metadata || {};
    const source = (md.username || (user?.email || "").split("@")[0] || "").trim();
    const initial = (source[0] || "У").toUpperCase();
    const fontSize = Math.round(size * 0.5);

    return (
        <div style={{
            width: `${size}px`, height: `${size}px`, borderRadius: "50%",
            background: "var(--brand-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
            color: "var(--brand-accent-ink)", fontSize: `${fontSize}px`, fontWeight: 900, letterSpacing: "-0.02em",
        }}>
            <span>{initial}</span>
        </div>
    );
}

function SearchForm({ onDone, className = "", inputId }) {
    const navigate = useNavigate();
    const [value, setValue] = useState("");
    const submit = (e) => {
        e.preventDefault();
        const q = cleanQuery(value);
        if (!q) return;
        navigate(`/universities/?q=${encodeURIComponent(q)}`);
        setValue("");
        onDone?.();
    };
    return (
        <form onSubmit={submit} role="search" className={`hd-search ${className}`}>
            <label htmlFor={inputId} className="hd-sr">Търси специалност или университет</label>
            <Search size={16} strokeWidth={1.75} aria-hidden="true" />
            <input
                id={inputId}
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Търси специалност или университет"
                maxLength={80}
                autoComplete="off"
            />
        </form>
    );
}

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggle: toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef();
    const navRef = useRef();

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
            if (moreRef.current && !moreRef.current.contains(e.target)) setIsMoreOpen(false);
        };
        const onKey = (e) => { if (e.key === "Escape") { setIsUserMenuOpen(false); setIsMenuOpen(false); setIsMoreOpen(false); } };
        window.addEventListener("click", onClick);
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); };
    }, []);

    useEffect(() => { setIsMenuOpen(false); setIsUserMenuOpen(false); setIsMoreOpen(false); }, [location.pathname]);

    const handleLogout = useCallback(async () => {
        await sessionService.logout();
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
        navigate("/login");
    }, [navigate]);

    // Сравнява без значение от trailing slash (потребител може да отвори /about и /about/).
    const isActive = useCallback((path) => {
        const strip = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
        return strip(location.pathname) === strip(path);
    }, [location.pathname]);

    return (
        <>
            <nav aria-label="Основна навигация" className={`hd-bar${scrolled ? " is-scrolled" : ""}`}>
                <div ref={navRef} className="hd-bar__inner">
                    {/* Brand */}
                    <Link to="/" aria-label="УниПът — начало" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
                        <img
                            src="/logo-uniput.png"
                            alt="UniПът"
                            width="56" height="44"
                            style={{ height: "44px", width: "auto", objectFit: "contain" }}
                        />
                    </Link>

                    {/* Desktop: основните пътища като обикновени връзки */}
                    <div className="uni-nav-desktop hd-links">
                        {NAV_GROUPS[0].items.map((it) => (
                            <Link key={it.path} to={it.path} className={`hd-link${isActive(it.path) ? " is-current" : ""}`} aria-current={isActive(it.path) ? "page" : undefined}>
                                {it.name}
                            </Link>
                        ))}
                        <div ref={moreRef} className="hd-group">
                            <button
                                type="button"
                                className={`hd-link hd-more${MORE_TOOLS.some((t) => isActive(t.path)) ? " is-current" : ""}`}
                                aria-expanded={isMoreOpen}
                                aria-controls="hd-more-panel"
                                onClick={() => setIsMoreOpen((o) => !o)}
                            >
                                Още <ChevronDown size={16} strokeWidth={2} aria-hidden="true" style={{ transform: isMoreOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                            </button>
                            {isMoreOpen && (
                                <div id="hd-more-panel" className="hd-panel">
                                    {MORE_TOOLS.map((it) => {
                                        const Icon = it.icon;
                                        return (
                                            <Link key={it.path} to={it.path} className={`hd-item${isActive(it.path) ? " is-current" : ""}`} aria-current={isActive(it.path) ? "page" : undefined}>
                                                <span className="hd-item-icon"><Icon size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                                                <span className="hd-item-text">
                                                    <strong>{it.name}</strong>
                                                    <small>{it.desc}</small>
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {isAdmin && (
                            <Link to="/admin" className="hd-admin">
                                <Settings size={14} /> Админ
                            </Link>
                        )}
                    </div>

                    {/* Търсачка (широк екран) */}
                    <SearchForm className="uni-nav-wide hd-search--inline" inputId="hd-search-desktop" />

                    {/* Вдясно: основен бутон + акаунт */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="hd-theme"
                            aria-label={theme === "dark" ? "Светла тема" : "Тъмна тема"}
                            aria-pressed={theme === "dark"}
                            title={theme === "dark" ? "Светла тема" : "Тъмна тема"}
                        >
                            {theme === "dark" ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
                        </button>
                        {!user ? (
                            <div className="uni-nav-desktop" style={{ alignItems: "center", gap: "0.375rem" }}>
                                <Link to="/login" className="hd-login">Вход</Link>
                                <Link to="/register" className="hd-register">Регистрация</Link>
                            </div>
                        ) : (
                            <div ref={userMenuRef} style={{ position: "relative" }}>
                                <button
                                    onClick={() => setIsUserMenuOpen((o) => !o)}
                                    aria-label="Меню на профила"
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                    className="hd-avatar-btn"
                                >
                                    <HeaderAvatar user={user} size={28} />
                                    <ChevronDown size={14} color="var(--brand-muted)" />
                                </button>
                                {isUserMenuOpen && (
                                    <div className="hd-user-panel">
                                        <div style={{ padding: "0.625rem 0.75rem", marginBottom: "0.25rem", background: "rgba(23,86,217,0.06)", borderRadius: "0.625rem" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Добре дошъл</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-accent-text)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {user.user_metadata?.username || user.email}
                                            </div>
                                        </div>
                                        {isAdmin && <MenuItem to="/admin" icon={Settings} label="Админ панел" color="var(--brand-accent-text)" />}
                                        <MenuItem to="/profile" icon={User} label="Профил" />
                                        <MenuItem to="/my-grades" icon={ClipboardList} label="Моите оценки" />
                                        <MenuItem to="/favorites" icon={Heart} label="Любими" />
                                        <div style={{ height: "1px", background: "var(--brand-border)", margin: "0.375rem 0" }} />
                                        <button onClick={handleLogout} className="uni-logout-btn hd-logout">
                                            <LogOut size={14} /> Изход
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="uni-nav-mobile hd-burger"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Отвори меню"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Мобилно меню */}
            {isMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 110 }}>
                    <div onClick={() => setIsMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(21,43,41,0.55)", backdropFilter: "blur(6px)" }} />
                    <div className="hd-drawer">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-text)" }}>Меню</span>
                            <button onClick={() => setIsMenuOpen(false)} aria-label="Затвори меню" className="hd-burger">
                                <X size={18} />
                            </button>
                        </div>

                        <SearchForm inputId="hd-search-mobile" onDone={() => setIsMenuOpen(false)} className="hd-search--drawer" />

                        <div className="hd-drawer-scroll">
                            {NAV_GROUPS.map((g) => (
                                <section key={g.key} style={{ marginTop: "1.5rem" }}>
                                    <h2 className="hd-drawer-title">{g.label}</h2>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                        {g.items.map((it) => {
                                            const Icon = it.icon;
                                            return (
                                                <Link key={it.path} to={it.path} className={`hd-item${isActive(it.path) ? " is-current" : ""}`}>
                                                    <span className="hd-item-icon"><Icon size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                                                    <span className="hd-item-text">
                                                        <strong>{it.name}</strong>
                                                        <small>{it.desc}</small>
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                            <Link to="/about/" className="hd-about">За нас</Link>
                            {isAdmin && (
                                <Link to="/admin" className="hd-admin" style={{ marginTop: "0.75rem" }}>
                                    <Settings size={16} /> Админ панел
                                </Link>
                            )}
                        </div>

                        <div className="hd-drawer-foot">
                            <Link to="/calculator/" className="hd-drawer-cta">Изчисли бал →</Link>
                            {!user ? (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <Link to="/login" className="hd-login hd-login--box">Вход</Link>
                                    <Link to="/register" className="hd-register hd-login--box">Регистрация</Link>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <Link to="/favorites" className="hd-login hd-login--box"><Heart size={14} /> Любими</Link>
                                    <button onClick={handleLogout} className="hd-login hd-login--box hd-logout-box"><LogOut size={14} /> Изход</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hd-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--canvas); border-bottom: 1px solid var(--border); }
                .hd-bar.is-scrolled { box-shadow: var(--shadow-float); }
                #hd-more-panel { left: auto; right: 0; }
                .hd-bar__inner { max-width: 80rem; margin: 0 auto; height: var(--header-h); padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
                @media (max-width: 767px) { .hd-bar__inner { padding: 0 1rem; } }
                .hd-links { align-items: center; gap: 0.25rem; }
                .hd-link { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 0.75rem; font-size: 15px; font-weight: 600; color: var(--ink); text-decoration: none; border-radius: var(--radius-control); transition: color 0.14s ease, background-color 0.14s ease; white-space: nowrap; }
                .hd-link:hover { color: var(--brand); }
                .hd-more { gap: 4px; border: 0; background: transparent; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
                .hd-more[aria-expanded="true"] { color: var(--brand); }
                .hd-link.is-current { color: var(--brand); }
                .hd-link.is-current::after { content: ""; position: absolute; left: 0.75rem; right: 0.75rem; bottom: 6px; height: 2px; background: var(--brand); border-radius: 2px; }
                .uni-nav-desktop { display: none; }
                .uni-nav-wide { display: none; }
                .uni-nav-mobile { display: flex; }
                /* Пълната навигация от 1200 px (пет пътя + акаунт); под това — компактен хедър и меню */
                @media (min-width: 1200px) {
                    .uni-nav-desktop { display: flex; }
                    .uni-nav-mobile { display: none; }
                }
                @media (min-width: 1560px) { .uni-nav-wide { display: flex; } }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .hd-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

                /* Групи */
                .hd-groups { align-items: center; gap: 0.25rem; }
                .hd-group { position: relative; }
                .hd-group-btn {
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    padding: 0.55rem 0.9rem; border-radius: 0.75rem;
                    font: inherit; font-size: 14px; font-weight: 700; color: var(--brand-text);
                    background: transparent; border: 1px solid transparent; cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }
                .hd-group-btn:hover, .hd-group-btn.is-active { background: rgba(23,86,217,0.09); color: var(--brand-accent-text); }
                .hd-panel {
                    position: absolute; top: calc(100% + 0.5rem); left: 0; z-index: 120;
                    width: 23rem; padding: 0.5rem;
                    background: var(--brand-dropdown-bg); border: 1px solid var(--brand-border); border-radius: 1rem;
                    box-shadow: 0 24px 60px var(--brand-shadow);
                    animation: hdPanel 0.16s ease-out;
                }
                @keyframes hdPanel { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .hd-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.7rem 0.75rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.15s; }
                .hd-item:hover, .hd-item.is-current { background: rgba(23,86,217,0.08); }
                .hd-item-icon { display: inline-flex; flex-shrink: 0; padding: 0.55rem; border-radius: 0.625rem; background: rgba(23,86,217,0.1); color: var(--brand-accent-text); }
                .hd-item-text { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
                .hd-item-text strong { font-size: 14px; font-weight: 800; color: var(--brand-text); }
                .hd-item-text small { font-size: 12.5px; line-height: 1.4; color: var(--brand-muted); }
                .hd-item.is-current .hd-item-text strong { color: var(--brand-accent-text); }

                /* Търсачка */
                .hd-search { position: relative; align-items: center; }
                .hd-search svg { position: absolute; left: 0.8rem; color: var(--brand-muted); pointer-events: none; }
                .hd-search input {
                    width: 100%; height: 2.5rem; padding: 0 0.9rem 0 2.4rem;
                    font: inherit; font-size: 13.5px; color: var(--brand-text);
                    background: var(--brand-surface-2); border: 1px solid transparent; border-radius: 0.75rem; outline: none;
                    transition: border-color 0.15s, background 0.15s;
                }
                .hd-search input::placeholder { color: var(--brand-muted); }
                .hd-search input:focus { background: var(--surface); border-color: var(--brand-accent); }
                .hd-search--inline { flex: 1 1 0; min-width: 12rem; max-width: 22rem; }
                .hd-search--drawer { display: flex; }
                .hd-search--drawer input { height: 3rem; font-size: 15px; }

                /* Бутони и акаунт */
                .uni-nav-cta {
                    padding: 0.55rem 1.1rem; border-radius: 0.75rem;
                    font-size: 13px; font-weight: 700; color: var(--brand-accent-ink); text-decoration: none;
                    background: var(--brand-accent); border: 1px solid var(--brand-accent);
                    transition: background 0.2s, transform 0.2s; white-space: nowrap;
                }
                .uni-nav-cta:hover { background: var(--brand-navy); border-color: var(--brand-navy); }
                .hd-login { padding: 0.5rem 0.75rem; border-radius: 0.625rem; font-size: 13px; font-weight: 700; color: var(--brand-text); text-decoration: none; }
                .hd-login:hover { color: var(--brand-accent-text); }
                .hd-register { padding: 0.5rem 0.875rem; border-radius: 0.625rem; font-size: 13px; font-weight: 700; color: var(--brand-text); text-decoration: none; background: var(--brand-surface-2); border: 1px solid var(--brand-border); }
                .hd-register:hover { border-color: var(--brand-accent); }
                .hd-admin { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; border-radius: 0.625rem; font-size: 13px; font-weight: 700; text-decoration: none; color: var(--brand-accent-text); border: 1px solid rgba(23,86,217,0.25); }
                .hd-avatar-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.5rem 0.375rem 0.375rem; background: var(--brand-surface-2); border: 1px solid var(--brand-border); border-radius: 999px; cursor: pointer; font-family: inherit; }
                .hd-user-panel { position: absolute; top: calc(100% + 8px); right: 0; min-width: 15rem; background: var(--brand-dropdown-bg); border: 1px solid var(--brand-border); border-radius: 0.875rem; box-shadow: 0 20px 60px var(--brand-shadow); padding: 0.5rem; z-index: 130; }
                .hd-logout { width: 100%; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 13px; font-weight: 600; color: var(--danger); background: none; border: none; cursor: pointer; font-family: inherit; text-align: left; }
                .uni-menu-item { transition: background 0.15s; }
                .uni-menu-item:hover { background: rgba(23,86,217,0.07) !important; }
                .uni-logout-btn { transition: background 0.15s; }
                .uni-logout-btn:hover { background: rgba(220,38,38,0.08) !important; }
                .hd-theme { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: var(--radius-control); border: 1px solid var(--border); background: var(--surface); color: var(--ink); cursor: pointer; transition: border-color 0.14s ease, color 0.14s ease; }
                .hd-theme:hover { border-color: var(--brand); color: var(--brand); }
                .hd-burger { padding: 0.5rem; background: var(--brand-surface-2); border: 1px solid var(--brand-border); border-radius: 0.625rem; color: var(--brand-text); cursor: pointer; }

                /* Мобилно меню */
                .hd-drawer { position: absolute; top: 0; right: 0; height: 100%; width: min(88vw, 24rem); background: var(--brand-bg); border-left: 1px solid var(--brand-border); padding: 1.25rem; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; }
                .hd-drawer-scroll { flex: 1; overflow-y: auto; padding-bottom: 1rem; }
                .hd-drawer-title { margin: 0 0 0.5rem; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-muted); }
                .hd-about { display: flex; align-items: center; min-height: 44px; margin-top: 1.25rem; padding: 0.5rem 0; font-size: 14px; font-weight: 700; color: var(--brand-muted); text-decoration: none; }
                /* Телефон: менюто е списък от заглавия — описанията удвояваха височината */
                @media (max-width: 767px) {
                    .hd-drawer .hd-item { align-items: center; min-height: 48px; padding: 0.375rem 0.5rem; }
                    .hd-drawer .hd-item-text small { display: none; }
                    .hd-drawer .hd-item-text strong { font-size: 15px; }
                    .hd-drawer .hd-item-icon { padding: 0.4rem; }
                    .hd-drawer-title { margin-top: 0.75rem; }
                    .hd-about { margin-top: 0.5rem; }
                }
                .hd-drawer-foot { padding-top: 1rem; border-top: 1px solid var(--brand-border); display: flex; flex-direction: column; gap: 0.5rem; }
                .hd-drawer-cta { display: block; padding: 0.9rem; border-radius: 0.75rem; text-align: center; font-size: 15px; font-weight: 800; text-decoration: none; color: var(--brand-accent-ink); background: var(--brand-accent); }
                .hd-login--box { display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem; text-align: center; border: 1px solid var(--brand-border); background: var(--brand-surface-2); border-radius: 0.625rem; font: inherit; font-size: 13px; font-weight: 700; color: var(--brand-text); text-decoration: none; cursor: pointer; }
                .hd-logout-box { color: var(--danger); }
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
