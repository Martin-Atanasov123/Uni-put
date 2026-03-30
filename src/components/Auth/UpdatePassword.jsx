// Компонент: Нова парола
// Описание: Приема потребителя след клик на линк в имейла (Supabase токен),
//   валидира въведените стойности и обновява паролата чрез Supabase Auth.
// Вход: няма пропсове; използва локално състояние и проверка за активна сесия.
// Изход: статус съобщения; пренасочване към /login при успех.
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UpdatePassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a session (Supabase handles the recovery token and creates a session automatically)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Supabase може да има нужда от време за обработка на hash фрагмента
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Паролите не съвпадат!");
            return;
        }

        if (password.length < 8) {
            setError("Паролата трябва да е поне 8 символа!");
            return;
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Паролата трябва да съдържа поне една главна буква и една цифра!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch {
            setError("Възникна грешка при смяна на паролата. Опитайте отново.");
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
                            <Lock className="text-primary-content w-8 h-8" />
                        </div>
                        <h2 className="card-title text-2xl font-bold text-base-content">
                            Нова парола
                        </h2>
                        <p className="text-sm text-base-content/60 text-center">
                            Въведи своята нова парола за достъп до УниПът.
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
                                <span>Паролата е променена успешно! Пренасочване...</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium text-base-content">Нова парола</span>
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

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium text-base-content">Потвърди парола</span>
                                </label>
                                <div className="relative flex items-center">
                                    <Lock className="absolute left-3 w-5 h-5 text-base-content/50 z-10 pointer-events-none" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="input input-bordered w-full pl-10 pr-10 focus:input-primary bg-base-100"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Обновяване...</span>
                                        </>
                                    ) : (
                                        "Обнови паролата"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
