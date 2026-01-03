import { useState } from "react";
import { supabase } from "../../supabaseClient";

import {
    Mail,
    Lock,
    LogIn,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate("/Calculator");
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
                            Влез в UniPut, за да управляваш своите балoве.
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

                        {/* Парола поле - ФИКСНАТО */}
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
                        </div>

                        {/* <div className="text-right">
                            <a href="#" className="label-text-alt link link-hover text-primary font-medium">
                                Забравена парола?
                            </a>
                        </div> */}

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

                    <p className="text-center text-sm text-base-content/60">
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
