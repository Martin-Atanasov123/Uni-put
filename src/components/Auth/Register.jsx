// Компонент: Регистрация
// Описание: Създава нов потребител в Supabase Auth и записва метаданни (username).
// Вход: няма пропсове; използва локално състояние за email/username/password.
// Изход: пренасочване към начална страница при успех; визуализация на грешки при неуспех.
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
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

        // Валидация на паролата
        if (password.length < 8) {
            setError("Паролата трябва да е поне 8 символа!");
            setLoading(false);
            return;
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Паролата трябва да съдържа поне една главна буква и една цифра!");
            setLoading(false);
            return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });

        if (signUpError) {
            if (signUpError.message.includes("already registered")) {
                setError("Този имейл вече е зает. Пробвай да влезеш.");
            } else {
                setError("Възникна грешка при регистрацията. Опитайте отново.");
            }
            setLoading(false);
        } else {
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
                        <p className="text-sm opacity-60">Стани част от УниПът🎓</p>
                    </div>

                    {error && (
                        <div className="alert alert-error text-sm py-2 mb-4 animate-bounce">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Поле за потребителско име */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Потребителско име</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 opacity-40 z-10 pointer-events-none color-primary-content" />
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

                        {/* Поле за имейл */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Имейл</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 opacity-40 z-10 pointer-events-none" />
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

                        {/* Поле за парола с превключвател */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold uppercase text-xs">Парола</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 opacity-40 z-10 pointer-events-none" />
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
