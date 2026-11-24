import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Loader2, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/common/Seo";
import { AuthShell, AuthAside, AuthCard, AuthAlert, GoogleButton, Field, Divider, PasswordToggle } from "./AuthShell";
import { ACCOUNT_ITEMS } from "./accountItems";

// Само имейл и парола — името се пита по-късно, по желание, в профила.
// След регистрация: обратно там, откъдето е дошъл, иначе в калкулатора.

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const fromPath = location.state?.from?.pathname;
    const fromSearch = location.state?.from?.search || "";
    const from = fromPath ? `${fromPath}${fromSearch}` : "/calculator";

    const rules = [
        { ok: password.length >= 8, label: "Поне 8 символа" },
        { ok: /[A-Z]/.test(password), label: "Главна латинска буква" },
        { ok: /[0-9]/.test(password), label: "Цифра" },
    ];

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${SAFE_ORIGIN}${from}` },
        });
        if (error) setError("Нещо се обърка. Провери връзката и опитай пак.");
    };

    const handleSignUp = async e => {
        e.preventDefault();
        setError(null);
        if (!rules.every(r => r.ok)) {
            setError("Паролата трябва да има поне 8 символа, една главна латинска буква и една цифра.");
            return;
        }
        setLoading(true);
        const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${SAFE_ORIGIN}${from}` } });
        setLoading(false);
        if (signUpError) {
            setError(signUpError.message.includes("already registered")
                ? "Този имейл вече има профил. Пробвай да влезеш."
                : "Нещо се обърка при регистрацията. Опитай пак.");
        } else {
            navigate(from);
        }
    };

    // Вече влязъл потребител няма какво да прави на страницата за регистрация.
    if (user) return <Navigate to={fromPath ? from : "/profile"} replace />;

    return (
        <AuthShell
            aside={
                <AuthAside
                    eyebrow="Безплатен профил"
                    title="Запази резултатите си и ги сравни по-късно"
                    art={{ name: "career-paths", height: 680 }}
                    items={ACCOUNT_ITEMS}
                />
            }
        >
            <Seo title="Регистрация" path="/register" noindex />
            <AuthCard title="Създай профил" lead="Безплатно е и отнема под минута. Трябват само имейл и парола.">
                {error && <AuthAlert>{error}</AuthAlert>}

                <GoogleButton onClick={handleGoogleSignup}>Регистрирай се с Google</GoogleButton>
                <Divider label="или с имейл" />

                <form className="au-form" onSubmit={handleSignUp}>
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
                        name="new-password"
                        autoComplete="new-password"
                        aria-describedby="au-rules"
                        value={password}
                        onChange={e => setPassword(e.target.value.replace(/\s/g, ""))}
                        right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                    />
                    <ul className="au-rules" id="au-rules" aria-label="Изисквания към паролата">
                        {rules.map(r => (
                            <li key={r.label} data-ok={r.ok}>
                                {r.ok ? <Check size={14} strokeWidth={2.25} aria-hidden="true" /> : <span aria-hidden="true">•</span>}
                                {r.label}
                                <span className="sr-only">{r.ok ? " — изпълнено" : " — още не"}</span>
                            </li>
                        ))}
                    </ul>
                    <button type="submit" className="au-btn au-btn--primary" disabled={loading}>
                        {loading
                            ? <><Loader2 size={18} className="au-spin" aria-hidden="true" /> Създаване…</>
                            : <>Създай профила <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" /></>}
                    </button>
                </form>

                <p className="au-note">Никакъв спам. Пазим само резултатите ти. <Link to="/privacy" className="au-link">Поверителност</Link></p>
                <p className="au-foot">
                    Вече имаш профил? <Link to="/login" state={location.state} className="au-link">Влез</Link>
                </p>
            </AuthCard>
        </AuthShell>
    );
};

export default SignUp;
