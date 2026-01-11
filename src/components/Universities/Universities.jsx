import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { 
    Search, 
    MapPin, 
    GraduationCap, 
    ChevronRight, 
    School, 
    Filter,
    Award,
    TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const UniversitiesPage = () => {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("Всички");
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const fetchUniversities = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('university_admissions')
                .select('*');
            
            if (!error && data) {
                setUniversities(data);
                setCities(["Всички", ...new Set(data.map(u => u.city).filter(Boolean))]);
            }
            setLoading(false);
        };
        fetchUniversities();
    }, []);

    // Филтрираща логика
    const filteredUnis = universities.filter(u => {
        const matchesSearch = u.specialty.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.university_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCity = selectedCity === "Всички" || u.city === selectedCity;
        return matchesSearch && matchesCity;
    });

    return (
        <div className="min-h-screen bg-base-100 pt-28 pb-12 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* --- HERO SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="badge badge-primary font-black italic p-4 mb-2">DATABASE 2025</div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic">
                            Открий своето <br />
                            <span className="text-primary underline decoration-wavy">бъдеще</span>
                        </h1>
                    </div>
                    <div className="stats shadow-xl bg-base-200 rounded-[2rem] hidden lg:flex">
                        <div className="stat px-8">
                            <div className="stat-title font-bold uppercase text-[10px]">Специалности</div>
                            <div className="stat-value text-primary tracking-tighter">{universities.length}</div>
                            <div className="stat-desc font-bold">В цяла България</div>
                        </div>
                    </div>
                </div>

                {/* --- SMART FILTERS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-200 p-4 rounded-[2.5rem] shadow-inner sticky top-24 z-10 backdrop-blur-md bg-base-200/80">
                    <div className="relative col-span-1 md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                        <input 
                            type="text" 
                            placeholder="Търси специалност или университет..." 
                            className="input w-full pl-12 h-14 bg-base-100 border-none rounded-2xl font-bold shadow-sm focus:ring-2 ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                        <select 
                            className="select w-full pl-12 h-14 bg-base-100 border-none rounded-2xl font-bold shadow-sm cursor-pointer"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- UNIVERSITY GRID --- */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-infinity loading-lg text-primary scale-150"></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnis.map((uni) => (
                            <div 
                                key={uni.id} 
                                className="group bg-base-100 rounded-[2.5rem] border border-base-200 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                            >
                                {/* Background Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                                
                                <div className="flex flex-col h-full space-y-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest">
                                            <MapPin size={12} className="text-primary" /> {uni.city}
                                        </div>
                                        <h2 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                                            {uni.specialty}
                                        </h2>
                                        <p className="text-xs font-bold opacity-60 flex items-center gap-1">
                                            <School size={14} /> {uni.university_name}
                                        </p>
                                    </div>

                                    <div className="flex-1">
                                        <div className="p-4 bg-base-200 rounded-2xl border-l-4 border-primary/30 group-hover:border-primary transition-all">
                                            <span className="text-[10px] font-black opacity-40 uppercase block mb-1">Прием:</span>
                                            <p className="text-[11px] font-bold leading-relaxed italic">{uni.formula_description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-base-200">
                                        <div>
                                            <div className="text-2xl font-black text-primary tracking-tighter italic">
                                                {uni.min_ball_2024}
                                            </div>
                                            <div className="text-[9px] font-black opacity-30 uppercase tracking-tighter">Мин. Бал 2024</div>
                                        </div>
                                        <Link 
                                            to="/calculator" 
                                            className="btn btn-circle btn-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform"
                                        >
                                            <ChevronRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- EMPTY STATE --- */}
                {!loading && filteredUnis.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="bg-base-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-black opacity-40 italic uppercase tracking-tighter text-center">
                            Нищо не открихме, братле... <br />
                            Пробвай друго търсене.
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversitiesPage;
