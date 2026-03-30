// Компонент: Профил и настройки (Модерен Дизайн)
// Описание: Зарежда профил от Supabase, визуализира основни данни, любими университети 
//   и история на баловете. Позволява промени в потребителска информация и сигурност.
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { sessionService } from "../../services/sessionService";
import { useAuth } from "../../hooks/useAuth";
import { universityService } from "../../services/universityService";
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
    Smartphone,
    Heart,
    Calculator,
    Calendar,
    ArrowRight,
    MapPin,
    GraduationCap,
    Star,
    Trash2,
    Settings,
    Edit3
} from "lucide-react";

const Profile = () => {
    const navigate = useNavigate();
    const { favorites, toggleFavorite } = useAuth();
    
    // UI State
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Data State
    const [user, setUser] = useState(null);
    const [favoriteDetails, setFavoriteDetails] = useState([]);
    const [calculatorHistory, setCalculatorHistory] = useState([]);
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        email: "",
        newEmail: "",
        currentPassword: "",
        privacy: { isPublic: false, showActivity: true },
        notifications: { emailUpdates: true, securityAlerts: true, marketing: false }
    });

    // --- 1. Fetch Profile & Related Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;

                if (user) {
                    setUser(user);
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

                    // Fetch Favorite Details
                    if (favorites.length > 0) {
                        const allUnis = await universityService.searchUniversities({});
                        const details = allUnis.filter(u => favorites.includes(u.id.toString()));
                        setFavoriteDetails(details.slice(0, 3)); // Show top 3 in overview
                    }

                    // Fetch Calculator History from LocalStorage (Mock or actual if implemented)
                    const history = JSON.parse(localStorage.getItem("calculator_history") || "[]");
                    setCalculatorHistory(history.slice(0, 3));
                }
            } catch (error) {
                console.error("Error loading profile data:", error.message);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, favorites]);

    // --- Helpers ---
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleLogout = async () => {
        await sessionService.logout();
        navigate("/login");
    };

    // --- Handlers ---
    const updateGeneralInfo = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { username: formData.username, bio: formData.bio }
            });
            if (error) throw error;
            showMessage("success", "Профилът е обновен успешно!");
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="font-black animate-pulse opacity-50 uppercase tracking-widest text-xs">Зареждане на профил...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Преглед", icon: Activity },
        { id: "settings", label: "Настройки", icon: Settings },
        { id: "security", label: "Сигурност", icon: Shield },
        { id: "privacy", label: "Поверителност", icon: Lock },
    ];

    return (
        <div className="min-h-screen bg-base-200/50 selection:bg-primary/30">
            {/* Top Decorative Banner */}
            <div className="h-48 md:h-64 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] animate-pulse"></div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-24 md:-mt-32 relative z-10 pb-20">
                {/* Main Profile Card */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-base-content/5 overflow-hidden">
                    <div className="p-6 md:p-10">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-base-200 p-1 ring-4 ring-base-100 shadow-xl overflow-hidden">
                                    <div className="w-full h-full rounded-[1.8rem] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary">
                                        <User size={64} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <button className="absolute -bottom-2 -right-2 btn btn-circle btn-primary btn-sm shadow-lg border-2 border-base-100 hover:scale-110 transition-transform">
                                    <Edit3 size={14} />
                                </button>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">{formData.username || "Потребител"}</h1>
                                    <span className="badge badge-primary font-black text-[10px] uppercase tracking-widest px-3 py-3 shadow-sm shadow-primary/20">
                                        Кандидат-студент
                                    </span>
                                </div>
                                <p className="text-base-content/60 font-medium flex items-center justify-center md:justify-start gap-2">
                                    <Mail size={16} className="opacity-40" /> {user?.email}
                                </p>
                                <p className="text-sm opacity-50 italic max-w-md mx-auto md:mx-0">
                                    {formData.bio || "Все още няма добавена биография..."}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleLogout} className="btn btn-ghost btn-sm rounded-xl font-black text-error hover:bg-error/10">
                                    <LogOut size={16} /> Изход
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex overflow-x-auto gap-2 p-1 bg-base-200/50 rounded-2xl mb-10 no-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap
                                        ${activeTab === tab.id 
                                            ? "bg-base-100 text-primary shadow-sm ring-1 ring-base-content/5" 
                                            : "opacity-50 hover:opacity-100 hover:bg-base-100/50"}`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        {message.text && (
                            <div className={`alert ${message.type === "success" ? "alert-success bg-success/10 text-success border-success/20" : "alert-error bg-error/10 text-error border-error/20"} mb-8 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500`}>
                                {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="font-bold">{message.text}</span>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            
                            {/* --- TAB: OVERVIEW --- */}
                            {activeTab === "overview" && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 group hover:bg-primary/10 transition-colors">
                                            <Heart className="text-primary mb-4 group-hover:scale-110 transition-transform" size={32} />
                                            <p className="text-3xl font-black">{favorites.length}</p>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Любими</p>
                                        </div>
                                        <div className="bg-secondary/5 p-6 rounded-3xl border border-secondary/10 group hover:bg-secondary/10 transition-colors">
                                            <Calculator className="text-secondary mb-4 group-hover:scale-110 transition-transform" size={32} />
                                            <p className="text-3xl font-black">{calculatorHistory.length}</p>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Изчислени бала</p>
                                        </div>
                                    </div>

                                    {/* Favorite Universities Preview */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-lg font-black italic">Последно добавени любими</h3>
                                            <Link to="/favorites" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                                                Виж всички <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                        <div className="space-y-3">
                                            {favoriteDetails.length > 0 ? favoriteDetails.map((uni) => (
                                                <div key={uni.id} className="flex items-center gap-4 p-4 bg-base-200/30 rounded-2xl border border-base-content/5 hover:border-primary/20 transition-all group">
                                                    <div className="w-12 h-12 rounded-xl bg-base-100 flex items-center justify-center text-primary shadow-sm">
                                                        <GraduationCap size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate text-sm">{uni.university_name}</p>
                                                        <p className="text-[10px] opacity-50 flex items-center gap-1 uppercase tracking-tighter">
                                                            <MapPin size={10} /> {uni.city}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleFavorite(uni.id.toString())}
                                                        className="btn btn-ghost btn-circle btn-sm text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="p-10 bg-base-200/20 rounded-[2rem] border border-dashed border-base-content/10 flex flex-col items-center gap-4 text-center">
                                                    <Heart size={32} className="opacity-10" />
                                                    <p className="text-sm opacity-40 font-medium italic">Нямате добавени любими университети</p>
                                                    <Link to="/universities" className="btn btn-primary btn-xs rounded-lg">Търсене</Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: SETTINGS --- */}
                            {activeTab === "settings" && (
                                <form onSubmit={updateGeneralInfo} className="max-w-2xl space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-black uppercase tracking-widest text-[10px] opacity-50">Потребителско име</span></label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                                <input 
                                                    type="text" 
                                                    className="input input-bordered w-full pl-12 rounded-2xl bg-base-200/50 focus:bg-base-100 transition-all font-bold" 
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-black uppercase tracking-widest text-[10px] opacity-50">Имейл (Само за четене)</span></label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                                <input 
                                                    type="text" 
                                                    className="input input-bordered w-full pl-12 rounded-2xl bg-base-200/20 opacity-50 font-bold cursor-not-allowed" 
                                                    value={user?.email} 
                                                    disabled 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-black uppercase tracking-widest text-[10px] opacity-50">Биография</span></label>
                                        <textarea 
                                            className="textarea textarea-bordered h-32 rounded-3xl bg-base-200/50 focus:bg-base-100 transition-all font-medium p-6" 
                                            placeholder="Разкажете ни малко за вашите цели..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-base-content/5">
                                        <button type="submit" disabled={updating} className="btn btn-primary px-10 rounded-2xl font-black shadow-xl shadow-primary/20">
                                            {updating && <Loader2 className="animate-spin" size={18} />}
                                            Запази промените
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* --- TAB: SECURITY --- */}
                            {activeTab === "security" && (
                                <div className="max-w-2xl space-y-10">
                                    <div className="p-8 bg-base-200/30 rounded-[2rem] border border-base-content/5 space-y-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black">Сигурност на акаунта</h3>
                                                <p className="text-xs opacity-50">Управлявайте вашата парола и методи за вход</p>
                                            </div>
                                        </div>
                                        
                                        <div className="divider opacity-5"></div>

                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <p className="font-black text-lg">Парола</p>
                                                <p className="text-sm opacity-50">Последна промяна: преди 2 месеца</p>
                                            </div>
                                            <button 
                                                onClick={() => navigate("/forgot-password")}
                                                className="btn btn-outline btn-primary px-8 rounded-xl font-black text-xs uppercase tracking-widest"
                                            >
                                                Промени парола
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-error/5 rounded-[2rem] border border-error/10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center">
                                                <AlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-error">Опасна зона</h3>
                                                <p className="text-xs opacity-50">Действия, които не могат да бъдат отменени</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between bg-base-100 p-6 rounded-2xl border border-error/20">
                                            <div>
                                                <p className="font-bold">Изтриване на акаунт</p>
                                                <p className="text-xs opacity-50">Всички ваши данни ще бъдат премахнати завинаги.</p>
                                            </div>
                                            <button className="btn btn-error btn-sm rounded-lg text-white font-black">Изтрий</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: PRIVACY --- */}
                            {activeTab === "privacy" && (
                                <div className="max-w-2xl space-y-6">
                                    <div className="bg-base-200/30 rounded-[2.5rem] p-4 border border-base-content/5">
                                        <label className="flex items-center justify-between p-6 hover:bg-base-100/50 rounded-[2rem] cursor-pointer transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Globe size={28} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black block">Публичен профил</span>
                                                    <span className="text-xs opacity-50 font-medium">Позволете на другите да виждат вашите любими университети.</span>
                                                </div>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="toggle toggle-primary toggle-lg"
                                                checked={formData.privacy.isPublic}
                                                onChange={(e) => setFormData({...formData, privacy: {...formData.privacy, isPublic: e.target.checked}})}
                                            />
                                        </label>

                                        <div className="divider my-0 opacity-5 mx-8"></div>

                                        <label className="flex items-center justify-between p-6 hover:bg-base-100/50 rounded-[2rem] cursor-pointer transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Activity size={28} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black block">Статус на активност</span>
                                                    <span className="text-xs opacity-50 font-medium">Показвай кога последно сте влизали в платформата.</span>
                                                </div>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="toggle toggle-secondary toggle-lg"
                                                checked={formData.privacy.showActivity}
                                                onChange={(e) => setFormData({...formData, privacy: {...formData.privacy, showActivity: e.target.checked}})}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button className="btn btn-primary px-10 rounded-2xl font-black shadow-lg shadow-primary/20">
                                            Запази настройките
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Global Smooth Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default Profile;
