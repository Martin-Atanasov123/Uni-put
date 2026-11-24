import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import { ACCOUNT_ITEMS } from "./accountItems";
import { AuthShell, AuthAside, AuthCard, AuthAlert, GoogleButton, Field, Divider, PasswordToggle } from "./AuthShell";

// Field и Divider се ползват и от ForgotPassword / UpdatePassword.
export { Field, Divider };

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const safeAuthError = msg => {
    const map = {
        "Invalid login credentials": "Грешен имейл или парола. Пробвай пак или възстанови паролата си.",
        "Email not confirmed": "Потвърди имейла си — изпратихме ти линк.",
        "Too many requests": "Твърде много опити. Опитай пак след малко.",
    };
    return map[msg] || "Нещо се обърка. Провери връзката и опитай пак.";
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    // Без state.from pathname е undefined — тогава отиваме в калкулатора, не на "/undefined".
    const fromPath = location.state?.from?.pathname;
    const fromSearch = location.state?.from?.search || "";
    const from = fromPath ? `${fromPath}${fromSearch}` : "/calculator";
    const accountDeleted = new URLSearchParams(location.search).get("deleted") === "1";

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${SAFE_ORIGIN}${from}` },
        });
        if (error) setError(safeAuthError(error.message));
    };

    const handleLogin = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) setError(safeAuthError(error.message));
        else navigate(from);
    };

    // Вече влязъл потребител няма какво да прави на страницата за вход.
    if (user) return <Navigate to={fromPath ? from : "/profile"} replace />;

    return (
        <AuthShell
            aside={
                <AuthAside
                    eyebrow="Твоят профил"
                    title="Всичко, което запази, те чака тук"
                    art={{ name: "calculator-score", height: 694 }}
                    items={ACCOUNT_ITEMS}
                />
            }
        >
            <Seo title="Вход" path="/login" noindex />
            <AuthCard title="Влез в профила си" lead="Продължи от там, където спря — с любимите специалности и оценките си.">
                {accountDeleted && !error && <AuthAlert kind="ok">Акаунтът и данните ти бяха изтрити.</AuthAlert>}
                {error && <AuthAlert>{error}</AuthAlert>}

                <GoogleButton onClick={handleGoogleLogin}>Влез с Google</GoogleButton>
                <Divider label="или с имейл" />

                <form className="au-form" onSubmit={handleLogin}>
                    <Field
                        label="Имейл"
                        icon={Mail}
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="ivan@mail.bg"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <Field
                        label="Парола"
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        // Интервалите се махат тихо — иначе „грешна парола“ без видима причина.
                        onChange={e => setPassword(e.target.value.replace(/\s/g, ""))}
                        right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                    />
                    <div className="au-row-end">
                        <Link to="/forgot-password" className="au-link au-link--pad">Забравена парола?</Link>
                    </div>
                    <button type="submit" className="au-btn au-btn--primary" disabled={loading}>
                        {loading
                            ? <><Loader2 size={18} className="au-spin" aria-hidden="true" /> Влизане…</>
                            : <>Влез в профила <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" /></>}
                    </button>
                </form>

                <p className="au-foot">
                    Нямаш профил? <Link to="/register" state={location.state} className="au-link">Създай безплатен профил</Link>
                </p>
            </AuthCard>
        </AuthShell>
    );
};

export default Login;
