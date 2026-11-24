import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import { AuthShell, AuthCard, AuthAlert, Field } from "./AuthShell";

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleResetRequest = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${SAFE_ORIGIN}/update-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch {
            setError("Нещо се обърка. Провери връзката и опитай пак.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <Seo title="Забравена парола" path="/forgot-password" noindex />
            <AuthCard title="Забравена парола" lead="Въведи имейла на профила си и ще ти пратим линк за нова парола.">
                {error && <AuthAlert>{error}</AuthAlert>}
                {success ? (
                    <div className="au-form">
                        <AuthAlert kind="ok">
                            Пратихме линк на {email}. Ако не е във входящата поща, провери папка „Спам“.
                        </AuthAlert>
                        <Link to="/login" className="au-btn au-btn--ghost">
                            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Обратно към вход
                        </Link>
                    </div>
                ) : (
                    <form className="au-form" onSubmit={handleResetRequest}>
                        <Field label="Имейл" icon={Mail} type="email" name="email" autoComplete="email" placeholder="ivan@mail.bg" value={email} onChange={e => setEmail(e.target.value)} />
                        <button type="submit" className="au-btn au-btn--primary" disabled={loading}>
                            {loading ? <><Loader2 size={18} className="au-spin" aria-hidden="true" /> Изпращане…</> : "Изпрати линк"}
                        </button>
                        <Link to="/login" className="au-btn au-btn--ghost">
                            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Обратно към вход
                        </Link>
                    </form>
                )}
            </AuthCard>
        </AuthShell>
    );
};

export default ForgotPassword;
