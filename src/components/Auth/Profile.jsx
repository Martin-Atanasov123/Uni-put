import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
    User, 
    Mail, 
    LogOut, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    ChevronLeft
} from "lucide-react";

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    
    const navigate = useNavigate();

    // 1. Вземане на данните при зареждане
    useEffect(() => {
        // Дефинираме я вътре
        const getProfile = async () => {
            try {
                setLoading(true);
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) throw error;

                if (user) {
                    setUser(user);
                    setUsername(user.user_metadata?.username || "");
                }
            } catch (error) {
                console.error("Грешка при зареждане:", error.message);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [navigate]); // Добавяме navigate тук, за да сме 100% изрядни

    // 2. Функция за обновяване на името
    async function updateProfile(e) {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: "", text: "" });

        try {
            const { error } = await supabase.auth.updateUser({
                data: { username: username }
            });

            if (error) throw error;
            setMessage({ type: "success", text: "Профилът е обновен успешно!" });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setUpdating(false);
        }
    }

    // 3. Функция за Изход
    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 px-4 py-12">
            <div className="max-w-md mx-auto">
                {/* Бутон Назад */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="btn btn-ghost btn-sm mb-4 gap-2 opacity-60 hover:opacity-100"
                >
                    <ChevronLeft className="w-4 h-4" /> Назад
                </button>

                <div className="card bg-base-100 shadow-2xl border  border-base-content/5">
                    <div className="card-body">
                        {/* Аватар Секция */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="avatar placeholder mb-4">
                                <div className="bg-primary text-primary-content rounded-full w-24 shadow-lg ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <span className="text-3xl font-bold">
                                        {username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-base-content">{username || "Потребител"}</h2>
                            <p className="text-sm opacity-50">{user?.email}</p>
                        </div>

                        {/* Съобщения за статус */}
                        {message.text && (
                            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-6 py-2 text-sm`}>
                                {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={updateProfile} className="space-y-6">
                            {/* Поле за Имейл (Само за четене) */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold uppercase text-xs opacity-60">Имейл адрес</span>
                                </label>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-3 w-5 h-5 opacity-30 z-10" />
                                    <input
                                        type="text"
                                        value={user?.email}
                                        disabled
                                        className="input input-bordered w-full pl-10 bg-base-200 opacity-70 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Поле за потребителско име */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold uppercase text-xs opacity-60">Потребителско име</span>
                                </label>
                                <div className="relative flex items-center">
                                    <User className="absolute left-3 w-5 h-5 text-primary z-10 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                        placeholder="Въведи име..."
                                    />
                                </div>
                            </div>

                            {/* Бутони за действие */}
                            <div className="flex flex-col gap-3 mt-8">
                                <button 
                                    type="submit" 
                                    disabled={updating}
                                    className="btn btn-primary w-full gap-2 shadow-lg"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Запази промените
                                </button>
                                
                                <div className="divider opacity-10">Опасно зона</div>

                                <button 
                                    type="button"
                                    onClick={handleLogout}
                                    className="btn btn-outline btn-error w-full gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Изход от профила
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
