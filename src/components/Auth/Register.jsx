import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Регистрация със Supabase Auth + Метаданни за username
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username, // Записваме потребителското име тук
                }
            }
        });

        if (signUpError) {
            // Проверка дали имейлът вече съществува
            if (signUpError.message.includes("already registered")) {
                setError("Този имейл вече е зает. Пробвай да влезеш.");
            } else {
                setError(signUpError.message);
            }
            setLoading(false);
        } else {
            console.log("Успех!", data);
            navigate("/");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-base-200 px-4 pt-20">
            <div className="card w-full max-w-md shadow-2xl bg-base-100 border border-base-content/5">
                <div className="card-body">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="bg-secondary p-3 rounded-2xl shadow-lg text-secondary-content">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">Нов акаунт</h2>
                        <p className="text-sm opacity-60">Стани част от UniPut🎓</p>
                    </div>

                    {error && (
                        <div className="alert alert-error text-sm py-2 mb-4 animate-bounce">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* USERNAME FIELD */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Потребителско име</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                                <input
                                    type="text"
                                    placeholder="ivan"
                                    className="input input-bordered w-full pl-10 focus:input-secondary"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* EMAIL FIELD */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Имейл</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="input input-bordered w-full pl-10 focus:input-secondary"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* PASSWORD FIELD WITH TOGGLE */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Парола</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10 focus:input-secondary"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button className="btn btn-secondary w-full mt-6" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : "Регистрирай ме"}
                        </button>
                    </form>

                    <div className="divider opacity-10">ИЛИ</div>

                    <p className="text-center text-sm">
                        Вече имаш профил?{" "}
                        <Link to="/login" className="link link-secondary font-bold">Влез тук</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
