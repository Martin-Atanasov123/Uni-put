// Компонент: Забравена парола
// Описание: Изпраща имейл за възстановяване чрез Supabase и указва redirect към страницата
//   за задаване на нова парола.
// Вход: няма пропсове; локално състояние за имейл и индикатори за статус.
// Изход: статус съобщения; Supabase изпраща имейл с линк към /update-password.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleResetRequest = async (e) => {
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
            setError("Възникна грешка. Опитайте отново.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-content/5">
                <div className="card-body">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg flex items-center justify-center">
                            <Mail className="text-primary-content w-8 h-8" />
                        </div>
                        <h2 className="card-title text-2xl font-bold text-base-content">
                            Забравена парола?
                        </h2>
                        <p className="text-sm text-base-content/60 text-center">
                            Въведи своя имейл и ще ти изпратим линк за възстановяване.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error shadow-sm mb-4 py-2 text-sm flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="alert alert-success shadow-sm py-3 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <span>Провери своята поща за инструкции!</span>
                            </div>
                            <Link to="/login" className="btn btn-ghost btn-sm gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Обратно към вход
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetRequest} className="space-y-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium text-base-content">Имейл</span>
                                </label>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-3 w-5 h-5 text-base-content/50 z-10 pointer-events-none" />
                                    <input
                                        type="email"
                                        placeholder="ivan@mail.com"
                                        className="input input-bordered w-full pl-10 focus:input-primary bg-base-100"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control mt-6 space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Изпращане...</span>
                                        </>
                                    ) : (
                                        "Изпрати линк"
                                    )}
                                </button>
                                <Link to="/login" className="btn btn-ghost w-full flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Върни се към вход
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
