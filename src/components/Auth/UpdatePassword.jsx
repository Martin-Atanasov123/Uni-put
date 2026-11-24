import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/common/Seo";
import { AuthShell, AuthCard, AuthAlert, Field, PasswordToggle } from "./AuthShell";

const UpdatePassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Сесията от линка в имейла се прочита тук, преди смяната на паролата.
    useEffect(() => { supabase.auth.getSession(); }, []);

    const handleUpdatePassword = async e => {
        e.preventDefault();
        if (password !== confirmPassword) { setError("Двете пароли не съвпадат."); return; }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Паролата трябва да има поне 8 символа, една главна латинска буква и една цифра.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch {
            setError("Нещо се обърка при смяната на паролата. Опитай пак.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <Seo title="Нова парола" path="/update-password" noindex />
            <AuthCard title="Нова парола" lead="Избери парола с поне 8 символа, една главна латинска буква и една цифра.">
                {error && <AuthAlert>{error}</AuthAlert>}
                {success ? (
                    <AuthAlert kind="ok">Паролата е сменена. Пренасочваме те към входа…</AuthAlert>
                ) : (
                    <form className="au-form" onSubmit={handleUpdatePassword}>
                        <Field
                            label="Нова парола"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            name="new-password"
                            autoComplete="new-password"
                            value={password}
                            onChange={e => setPassword(e.target.value.replace(/\s/g, ""))}
                            right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                        />
                        <Field
                            label="Повтори паролата"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            name="confirm-password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
                        />
                        <button type="submit" className="au-btn au-btn--primary" disabled={loading}>
                            {loading ? <><Loader2 size={18} className="au-spin" aria-hidden="true" /> Запазване…</> : "Запази новата парола"}
                        </button>
                    </form>
                )}
            </AuthCard>
        </AuthShell>
    );
};

export default UpdatePassword;
