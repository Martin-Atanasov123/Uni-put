import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { sessionService } from "@/services/sessionService";
import { useTheme } from "@/hooks/useTheme";
import {
    User, LogOut, LayoutDashboard, Menu, X, GraduationCap,
    Calculator, Search, Settings, Building2, Heart, ChevronDown,
    Sun, Moon, Brain
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// CLAUDE.md nav order: Университети / Калкулатор / Кариерен тест / Общежития (max 4 items)
const NAV_LINKS = [
    { name: "Университети",   path: "/universities",   icon: Search },
    { name: "Калкулатор",     path: "/calculator",     icon: Calculator },
    { name: "Кариерен тест",  path: "/career-advisor", icon: Brain },
    { name: "Общежития",      path: "/dormitories",    icon: Building2 },
    { name: "За нас",      path: "/about",    icon: GraduationCap },

];

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggle: toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef();
    const isLight = theme === "light";

    const isAdmin = user?.app_metadata?.role === "admin";

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onClick = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false); };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);

    useEffect(() => { setIsMenuOpen(false); setIsUserMenuOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        await sessionService.logout();
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

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
                    border: `1px solid ${scrolled ? "rgba(6,182,212,0.2)" : "var(--brand-border)"}`,
                    borderRadius: "1.25rem",
                    padding: scrolled ? "0.5rem 1rem" : "0.75rem 1rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.4s",
                    boxShadow: "0 10px 40px var(--brand-shadow)",
                }}>
                    {/* Brand */}
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                        <div style={{
                            padding: "0.5rem", borderRadius: "0.625rem",
                            background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 24px rgba(6,182,212,0.3)",
                        }}>
                            <GraduationCap size={18} color="#fff" />
                        </div>
                        <span style={{
                            fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.02em",
                            background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>УниПът</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="uni-nav-desktop" style={{ alignItems: "center", gap: "0.25rem" }}>
                        {NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "0.375rem",
                                        padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                                        fontSize: "13px", fontWeight: 600, textDecoration: "none",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-muted)",
                                        background: active ? "rgba(6,182,212,0.1)" : "transparent",
                                        border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--brand-text)"; }}
                                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--brand-muted)"; }}
                                >
                                    <Icon size={14} /> {link.name}
                                </Link>
                            );
                        })}
                        {isAdmin && (
                            <Link to="/admin" style={{
                                display: "flex", alignItems: "center", gap: "0.375rem",
                                padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                                fontSize: "13px", fontWeight: 700, textDecoration: "none",
                                color: "var(--brand-violet)",
                                background: isActive("/admin") ? "rgba(139,92,246,0.12)" : "transparent",
                                border: "1px solid rgba(139,92,246,0.25)",
                            }}>
                                <Settings size={14} /> Админ
                            </Link>
                        )}
                    </div>

                    {/* Right: CTA + auth */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Primary CTA — always visible on desktop */}
                        <Link
                            to="/calculator"
                            className="uni-nav-desktop"
                            style={{
                                padding: "0.5rem 1rem", borderRadius: "0.625rem",
                                fontSize: "13px", fontWeight: 700, color: "var(--brand-cyan)", textDecoration: "none",
                                border: "1px solid rgba(6,182,212,0.4)",
                                background: "rgba(6,182,212,0.06)",
                                transition: "background 0.2s, border-color 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.12)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.7)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,0.06)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; }}
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
                                    style={{
                                        display: "flex", alignItems: "center", gap: "0.375rem",
                                        padding: "0.375rem 0.5rem 0.375rem 0.375rem",
                                        background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.12)",
                                        borderRadius: "999px", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                >
                                    <div style={{
                                        width: "28px", height: "28px", borderRadius: "50%",
                                        background: "linear-gradient(135deg,var(--brand-cyan),var(--brand-violet))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}><User size={14} color="#fff" /></div>
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
                                            background: "rgba(6,182,212,0.06)", borderRadius: "0.625rem" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Добре дошъл</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-cyan)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {user.user_metadata?.username || user.email}
                                            </div>
                                        </div>
                                        {isAdmin && <MenuItem to="/admin" icon={Settings} label="Админ панел" color="var(--brand-violet)" />}
                                        <MenuItem to="/profile" icon={User} label="Профил" />
                                        <MenuItem to="/calculator" icon={LayoutDashboard} label="Моите балове" />
                                        <MenuItem to="/favorites" icon={Heart} label="Любими" />
                                        <div style={{ height: "1px", background: "rgba(148,163,184,0.1)", margin: "0.375rem 0" }} />
                                        <button onClick={handleLogout} style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                                            padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                                            fontSize: "13px", fontWeight: 600, color: "#f87171",
                                            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                        >
                                            <LogOut size={14} /> Изход
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            aria-label={isLight ? "Превключи на тъмна тема" : "Превключи на светла тема"}
                            title={isLight ? "Тъмна тема" : "Светла тема"}
                            style={{
                                padding: "0.5rem",
                                background: isLight ? "rgba(124,58,237,0.08)" : "rgba(250,204,21,0.08)",
                                border: `1px solid ${isLight ? "rgba(124,58,237,0.2)" : "rgba(250,204,21,0.2)"}`,
                                borderRadius: "0.625rem",
                                color: isLight ? "var(--brand-violet)" : "#FBBF24",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.25s",
                            }}
                        >
                            {isLight ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

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

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1 }}>
                            {NAV_LINKS.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <Link key={link.path} to={link.path} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                        fontSize: "14px", fontWeight: 600, textDecoration: "none",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-text)",
                                        background: active ? "rgba(6,182,212,0.1)" : "rgba(30,41,59,0.5)",
                                        border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(148,163,184,0.08)",
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
                                    background: "rgba(139,92,246,0.08)",
                                    border: "1px solid rgba(139,92,246,0.25)",
                                }}>
                                    <Settings size={16} /> Админ панел
                                </Link>
                            )}
                        </div>

                        <div style={{ paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {/* Primary CTA always at bottom of mobile menu */}
                            <Link to="/calculator" style={{
                                padding: "0.875rem", borderRadius: "0.75rem", textAlign: "center",
                                fontSize: "14px", fontWeight: 800, textDecoration: "none",
                                color: "var(--brand-cyan)", border: "1px solid rgba(6,182,212,0.4)",
                                background: "rgba(6,182,212,0.08)",
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
                @media (min-width: 1024px) {
                    .uni-nav-desktop { display: flex; }
                    .uni-nav-mobile { display: none; }
                }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
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
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(148,163,184,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
            <Icon size={14} /> {label}
        </Link>
    );
}
