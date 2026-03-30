// Компонент: Вход
// Описание: Позволява автентикация чрез имейл/парола и Google OAuth.
// Вход: няма директни пропсове; използва локално състояние за email/password.
// Изход: навигация към защитени страници при успех; визуализира грешки при провал.
import { useState } from "react";
import { supabase } from "../../lib/supabase";

import {
    Mail,
    Lock,
    LogIn,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const SAFE_ORIGIN = import.meta.env.VITE_APP_URL || window.location.origin;

const safeAuthError = (msg) => {
    const map = {
        'Invalid login credentials': 'Невалиден имейл или парола.',
        'Email not confirmed': 'Моля потвърдете имейла си.',
        'Too many requests': 'Твърде много опити. Опитайте по-късно.',
    };
    return map[msg] || 'Възникна грешка. Опитайте отново.';
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname + (location.state?.from?.search || '') || '/calculator';

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${SAFE_ORIGIN}${from}`
            }
        });
        if (error) setError(safeAuthError(error.message));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(safeAuthError(error.message));
            setLoading(false);
        } else {
            navigate(from);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-content/5">
                <div className="card-body">
                    {/* Header с икона */}
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg flex items-center justify-center">
                            <LogIn className="text-primary-content w-8 h-8" />
                        </div>
                        <h2 className="card-title text-2xl font-bold text-base-content">
                            Добре дошъл отново!
                        </h2>
                        <p className="text-sm text-base-content/60 text-center">
                            Влез в УниПът, за да управляваш своите балoве.
                        </p>
                    </div>

                    {/* Грешка с подравнена икона */}
                    {error && (
                        <div className="alert alert-error shadow-sm mb-4 py-2 text-sm flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Имейл поле */}
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

                        {/* Парола поле */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-base-content">Парола</span>
                            </label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-3 w-5 h-5 text-base-content/50 z-10 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10 focus:input-primary bg-base-100"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {/* Бутон за показване на паролата */}
                                <button
                                    type="button"
                                    className="absolute right-3 p-1 hover:bg-base-200 rounded-full transition-colors z-20"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 opacity-50" />
                                    ) : (
                                        <Eye className="w-5 h-5 opacity-50" />
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-end mt-1">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    Забравена парола?
                                </Link>
                            </div>
                        </div>

                        {/* Бутон за вход */}
                        <div className="form-control mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Влизане...</span>
                                    </>
                                ) : (
                                    "Влез в профила"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="divider text-xs text-base-content/40 uppercase font-bold tracking-widest mt-8">
                        Или
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn btn-outline w-full flex items-center justify-center gap-3 border-base-300 hover:bg-base-200 rounded-xl transition-all h-12"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="font-bold">Влез с Google</span>
                        </button>
                    </div>

                    <p className="text-center text-sm text-base-content/60 mt-6">
                        Нямаш профил?{" "}
                        <Link to="/register" className="text-primary font-bold hover:underline">
                            Регистрирай се
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
