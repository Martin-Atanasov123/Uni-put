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
    ChevronLeft,
    Shield,
    Bell,
    Lock,
    Eye,
    EyeOff,
    Globe,
    Activity,
    Smartphone
} from "lucide-react";

const Profile = () => {
    const navigate = useNavigate();
    
    // UI State
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // User Data State
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        email: "",
        newEmail: "",
        currentPassword: "", // For re-auth
        privacy: {
            isPublic: false,
            showActivity: true
        },
        notifications: {
            emailUpdates: true,
            securityAlerts: true,
            marketing: false
        }
    });

    // Password Visibility
    const [showPassword, setShowPassword] = useState(false);

    // --- 1. Fetch Profile ---
    useEffect(() => {
        const getProfile = async () => {
            try {
                setLoading(true);
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) throw error;

                if (user) {
                    setUser(user);
                    
                    // Parse metadata
                    const metadata = user.user_metadata || {};
                    
                    setFormData(prev => ({
                        ...prev,
                        username: metadata.username || "",
                        bio: metadata.bio || "",
                        email: user.email || "",
                        privacy: {
                            isPublic: metadata.privacy?.isPublic ?? false,
                            showActivity: metadata.privacy?.showActivity ?? true
                        },
                        notifications: {
                            emailUpdates: metadata.notifications?.emailUpdates ?? true,
                            securityAlerts: metadata.notifications?.securityAlerts ?? true,
                            marketing: metadata.notifications?.marketing ?? false
                        }
                    }));
                }
            } catch (error) {
                console.error("Error loading profile:", error.message);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [navigate]);

    // --- Helpers ---
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    // --- 2. Update General Info (Username, Bio) ---
    const updateGeneralInfo = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: "", text: "" });

        try {
            const { error } = await supabase.auth.updateUser({
                data: { 
                    username: formData.username,
                    bio: formData.bio
                }
            });

            if (error) throw error;
            showMessage("success", "Профилът е обновен успешно!");
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    // --- 3. Change Email ---
    const handleChangeEmail = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: "", text: "" });

        // Basic validation
        if (!formData.newEmail || !formData.newEmail.includes("@")) {
            showMessage("error", "Моля, въведете валиден имейл адрес.");
            setUpdating(false);
            return;
        }

        if (!formData.currentPassword) {
            showMessage("error", "Моля, въведете текущата си парола за потвърждение.");
            setUpdating(false);
            return;
        }

        try {
            // 1. Re-authenticate
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: formData.currentPassword
            });

            if (signInError) throw new Error("Грешна парола. Моля, опитайте отново.");

            // 2. Update Email
            const { error: updateError } = await supabase.auth.updateUser({
                email: formData.newEmail
            });

            if (updateError) throw updateError;

            showMessage("success", "Изпратен е линк за потвърждение на новия имейл адрес!");
            setFormData(prev => ({ ...prev, newEmail: "", currentPassword: "" }));
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    // --- 4. Reset Password ---
    const handleResetPassword = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/update-password`, // Assuming this route exists or just standard reset
            });
            if (error) throw error;
            showMessage("success", "Изпратен е имейл за възстановяване на паролата.");
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    // --- 5. Update Settings (Privacy/Notifications) ---
    const updateSettings = async (section) => {
        setUpdating(true);
        try {
            const updateData = {};
            if (section === 'privacy') updateData.privacy = formData.privacy;
            if (section === 'notifications') updateData.notifications = formData.notifications;

            const { error } = await supabase.auth.updateUser({
                data: updateData
            });

            if (error) throw error;
            showMessage("success", "Настройките са запазени!");
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSettingChange = (section, key, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    // --- 6. Logout ---
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    const tabs = [
        { id: "general", label: "Общи", icon: User },
        { id: "security", label: "Сигурност", icon: Shield },
        { id: "privacy", label: "Поверителност", icon: Lock },
        { id: "notifications", label: "Известия", icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-base-200 px-4 pt-28 pb-12">
            <div className="max-w-5xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn btn-circle btn-ghost hover:bg-base-300"
                        aria-label="Назад"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-base-content">Настройки на профила</h1>
                        <p className="opacity-60 text-sm">Управлявайте вашата лична информация и предпочитания</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="bg-base-100 rounded-3xl p-4 shadow-lg sticky top-24">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm mb-1
                                            ${activeTab === tab.id 
                                                ? "bg-primary text-primary-content shadow-md" 
                                                : "hover:bg-base-200 text-base-content/70"}`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                             <div className="divider my-2"></div>
                             <button 
                                onClick={handleLogout}
                                className="flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm text-error hover:bg-error/10"
                            >
                                <LogOut size={18} />
                                Изход
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="card bg-base-100 shadow-xl rounded-[2rem] border border-base-200">
                            <div className="card-body p-6 md:p-8">
                                
                                {/* Messages */}
                                {message.text && (
                                    <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-6 rounded-2xl animate-in fade-in slide-in-from-top-2`}>
                                        {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        <span>{message.text}</span>
                                    </div>
                                )}

                                {/* --- TAB: GENERAL --- */}
                                {activeTab === "general" && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-base-200">
                                            <div className="avatar placeholder relative group">
                                                <div className="bg-primary text-primary-content rounded-full w-24 md:w-32 text-4xl font-bold shadow-2xl ring-4 ring-base-100 flex items-center justify-center">
                                                    <User className="w-12 h-12" />
                                                </div>
                                            </div>

                                            <div className="text-center md:text-left space-y-1">
                                                <h2 className="text-2xl font-black">{formData.username || "Потребител"}</h2>
                                                <p className="opacity-50 font-medium flex items-center justify-center md:justify-start gap-2">
                                                    {user?.email}
                                                    {user?.email_confirmed_at && (
                                                        <span className="badge badge-success badge-xs gap-1 py-2 px-3 text-[10px] font-bold uppercase text-white">
                                                            <CheckCircle2 size={10} /> Потвърден
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="badge badge-ghost mt-2">Студент</div>
                                            </div>
                                        </div>

                                        <form onSubmit={updateGeneralInfo} className="space-y-6">
                                            <div className="form-control w-full">
                                                <label className="label">
                                                    <span className="label-text font-bold">Потребителско име</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                                    <input 
                                                        type="text" 
                                                        className="input input-bordered w-full pl-12 rounded-2xl" 
                                                        placeholder="Вашето име"
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-control w-full">
                                                <label className="label">
                                                    <span className="label-text font-bold">Биография</span>
                                                    <span className="label-text-alt opacity-50">Кратко описание за вас</span>
                                                </label>
                                                <textarea 
                                                    className="textarea textarea-bordered h-24 rounded-2xl" 
                                                    placeholder="Разкажете нещо за себе си..."
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                                ></textarea>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4">
                                                <button type="button" onClick={() => setFormData(prev => ({...prev, username: user.user_metadata?.username || "", bio: user.user_metadata?.bio || ""}))} className="btn btn-ghost rounded-xl">Отказ</button>
                                                <button type="submit" disabled={updating} className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30">
                                                    {updating && <Loader2 className="animate-spin" size={18} />}
                                                    Запази
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* --- TAB: SECURITY --- */}
                                {activeTab === "security" && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        
                                        {/* Change Email Section */}
                                        <section className="space-y-4">
                                            <h3 className="text-xl font-black flex items-center gap-2">
                                                <Mail className="text-primary" /> Промяна на имейл
                                            </h3>
                                            <div className="bg-base-200/50 p-6 rounded-3xl space-y-4 border border-base-200">
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text font-bold">Нов имейл адрес</span></label>
                                                    <input 
                                                        type="email" 
                                                        className="input input-bordered rounded-xl" 
                                                        placeholder="new@example.com"
                                                        value={formData.newEmail}
                                                        onChange={(e) => setFormData({...formData, newEmail: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text font-bold">Текуща парола (за потвърждение)</span></label>
                                                    <div className="relative">
                                                        <input 
                                                            type={showPassword ? "text" : "password"}
                                                            className="input input-bordered w-full rounded-xl pr-10" 
                                                            placeholder="••••••••"
                                                            value={formData.currentPassword}
                                                            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <button 
                                                        onClick={handleChangeEmail} 
                                                        disabled={!formData.newEmail || !formData.currentPassword || updating}
                                                        className="btn btn-primary btn-sm rounded-lg"
                                                    >
                                                        {updating && <Loader2 className="animate-spin" size={14} />}
                                                        Обнови имейл
                                                    </button>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="divider"></div>

                                        {/* Reset Password Section */}
                                        <section className="space-y-4">
                                            <h3 className="text-xl font-black flex items-center gap-2">
                                                <Shield className="text-primary" /> Парола
                                            </h3>
                                            <div className="flex items-center justify-between bg-base-200/50 p-6 rounded-3xl border border-base-200">
                                                <div>
                                                    <p className="font-bold">Нулиране на паролата</p>
                                                    <p className="text-xs opacity-60 max-w-xs mt-1">Ще получите имейл с инструкции за задаване на нова парола.</p>
                                                </div>
                                                <button 
                                                    onClick={handleResetPassword}
                                                    disabled={updating}
                                                    className="btn btn-outline btn-sm rounded-lg"
                                                >
                                                    Изпрати имейл
                                                </button>
                                            </div>
                                        </section>
                                        
                                        <div className="divider"></div>
                                        
                                        {/* Linked Accounts (Visual Only for now) */}
                                        <section className="space-y-4">
                                            <h3 className="text-xl font-black flex items-center gap-2">
                                                <Globe className="text-primary" /> Свързани акаунти
                                            </h3>
                                            <div className="bg-base-200/50 p-4 rounded-3xl border border-base-200 opacity-60">
                                                <div className="flex items-center gap-4 p-2">
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                        <span className="font-bold text-lg">G</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold">Google</p>
                                                        <p className="text-xs">Не е свързан</p>
                                                    </div>
                                                    <button disabled className="btn btn-xs btn-ghost">Свържи</button>
                                                </div>
                                            </div>
                                        </section>

                                    </div>
                                )}

                                {/* --- TAB: PRIVACY --- */}
                                {activeTab === "privacy" && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <h3 className="text-2xl font-black mb-6">Настройки за поверителност</h3>
                                        
                                        <div className="bg-base-200/30 rounded-[2rem] p-2">
                                            <label className="flex items-center justify-between p-6 hover:bg-base-200 rounded-[1.5rem] cursor-pointer transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                                        <Globe size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block">Публичен профил</span>
                                                        <span className="text-xs opacity-60">Разрешете на другите да виждат основната ви информация.</span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="toggle toggle-primary"
                                                    checked={formData.privacy.isPublic}
                                                    onChange={(e) => handleSettingChange('privacy', 'isPublic', e.target.checked)}
                                                />
                                            </label>

                                            <div className="divider my-0 opacity-10 mx-6"></div>

                                            <label className="flex items-center justify-between p-6 hover:bg-base-200 rounded-[1.5rem] cursor-pointer transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block">Показвай активността</span>
                                                        <span className="text-xs opacity-60">Другите ще виждат кога сте онлайн.</span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="toggle toggle-secondary"
                                                    checked={formData.privacy.showActivity}
                                                    onChange={(e) => handleSettingChange('privacy', 'showActivity', e.target.checked)}
                                                />
                                            </label>
                                        </div>

                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => updateSettings('privacy')} 
                                                disabled={updating}
                                                className="btn btn-primary rounded-xl px-8"
                                            >
                                                {updating && <Loader2 className="animate-spin" size={18} />}
                                                Запази настройките
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* --- TAB: NOTIFICATIONS --- */}
                                {activeTab === "notifications" && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <h3 className="text-2xl font-black mb-6">Известия</h3>

                                        <div className="space-y-4">
                                            <div className="form-control bg-base-200/30 p-4 rounded-2xl">
                                                <label className="label cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <Mail className="opacity-50" />
                                                        <div>
                                                            <span className="label-text font-bold text-lg">Имейл известия</span>
                                                            <p className="text-xs opacity-50">Получавайте важни актуализации на имейла си.</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="checkbox checkbox-primary" 
                                                        checked={formData.notifications.emailUpdates}
                                                        onChange={(e) => handleSettingChange('notifications', 'emailUpdates', e.target.checked)}
                                                    />
                                                </label>
                                            </div>

                                            <div className="form-control bg-base-200/30 p-4 rounded-2xl">
                                                <label className="label cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <Shield className="opacity-50" />
                                                        <div>
                                                            <span className="label-text font-bold text-lg">Сигурност</span>
                                                            <p className="text-xs opacity-50">Известия при опити за вход от нови устройства.</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="checkbox checkbox-primary" 
                                                        checked={formData.notifications.securityAlerts}
                                                        onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                                                    />
                                                </label>
                                            </div>

                                            <div className="form-control bg-base-200/30 p-4 rounded-2xl">
                                                <label className="label cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <Smartphone className="opacity-50" />
                                                        <div>
                                                            <span className="label-text font-bold text-lg">Маркетинг</span>
                                                            <p className="text-xs opacity-50">Новини за нови функции и промоции.</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="checkbox" 
                                                        checked={formData.notifications.marketing}
                                                        onChange={(e) => handleSettingChange('notifications', 'marketing', e.target.checked)}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button 
                                                onClick={() => updateSettings('notifications')} 
                                                disabled={updating}
                                                className="btn btn-primary rounded-xl px-8"
                                            >
                                                {updating && <Loader2 className="animate-spin" size={18} />}
                                                Запази предпочитанията
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
