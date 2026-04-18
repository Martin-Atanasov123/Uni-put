import { useState, useEffect, useMemo } from "react";
import {
    Search,
    MapPin,
    Calculator,
    School,
    Filter,
    Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { universityService } from "@/services/universityService";
import { useAuth } from "@/hooks/useAuth";

const UniversitiesPage = () => {
    const { user, isFavorite, toggleFavorite } = useAuth();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("Всички");
    const [cities, setCities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [visibleCount, setVisibleCount] = useState(60);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const unis = await universityService.searchUniversities({});
            setUniversities(unis);
            const cityList = await universityService.getCities();
            setCities(cityList);
            setLoading(false);
        };
        loadData();
    }, []);

    // Autocomplete Logic
    useEffect(() => {
        const doSearch = async () => {
            if (searchTerm.length > 1) {
                const results = await universityService.searchUniversities({ query: searchTerm, city: selectedCity === "Всички" ? "Всички" : selectedCity });
                setSearchResults(results);
                setSuggestions(results.slice(0, 5));
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setSearchResults(null);
            }
        };
        doSearch();
    }, [searchTerm, selectedCity]);

    // Filtering Logic
    const filteredUnis = useMemo(() => {
        const base = searchResults ?? universities;
        return base.filter(u => {
            const matchesCity = selectedCity === "Всички" || u.city === selectedCity;
            return matchesCity;
        });
    }, [universities, searchResults, selectedCity]);

    useEffect(() => {
        setVisibleCount(60);
    }, [searchTerm, selectedCity]);

    const handleSuggestionClick = (text) => {
        setSearchTerm(text);
        setShowSuggestions(false);
    };

    return (
        <div className="min-h-screen bg-base-100 pt-28 pb-12 px-6" onClick={() => setShowSuggestions(false)}>
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div className="space-y-2">
                        
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic">
                            Открий своето <br />
                            <span className="text-primary ">бъдеще</span>
                        </h1>
                    </div>
                </div>

                {/* --- SMART FILTERS --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-base-200 p-4 rounded-[2.5rem] shadow-inner sticky top-24 z-20 backdrop-blur-md bg-base-200/80">
                    
                    {/* Search Input with Autocomplete */}
                    <div className="relative col-span-1 md:col-span-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                        <input 
                            type="text" 
                            placeholder="Търси специалност или университет..." 
                            className="input w-full pl-12 h-14 bg-base-100 border-none rounded-2xl font-bold shadow-sm focus:ring-2 ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-2xl shadow-xl border border-base-200 overflow-hidden z-30">
                                {suggestions.map((s, i) => (
                                    <div 
                                        key={s.id || i}
                                        className="p-3 hover:bg-base-200 cursor-pointer flex items-center gap-3 border-b border-base-200 last:border-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSuggestionClick(s.specialty);
                                        }}
                                    >
                                        <School size={16} className="opacity-50" />
                                        <div>
                                            <div className="font-bold text-sm">{s.specialty}</div>
                                            <div className="text-xs font-medium opacity-50">{s.university_name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* City Filter */}
                    <div className="relative col-span-1 md:col-span-4">
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

                {/* --- CONTENT AREA --- */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-infinity loading-lg text-primary scale-150"></span>
                    </div>
                ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnis.slice(0, visibleCount).map((uni) => {
                            const favorite = isFavorite(String(uni.id));
                            return (
                                <div
                                    key={uni.id}
                                    className="group bg-base-100 rounded-[2.5rem] border border-base-200 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                                    <div className="flex flex-col h-full space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest">
                                                <MapPin size={12} className="text-primary" /> {uni.city}
                                            </div>

                                            <h2 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                                                {uni.specialty}
                                            </h2>
                                            <p className="text-sm font-medium opacity-60 flex items-center gap-1">
                                                <School size={14} /> {uni.university_name}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-base-200 mt-auto gap-3">
                                            <Link
                                                to={`/calculator?specialty=${encodeURIComponent(uni.specialty)}`}
                                                className="btn btn-primary btn-sm rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                                            >
                                                <Calculator size={14} /> Изчисли бал
                                            </Link>
                                            {user && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(String(uni.id));
                                                    }}
                                                    className={`btn btn-sm rounded-2xl font-bold gap-2 ${
                                                        favorite
                                                            ? "btn-error btn-outline"
                                                            : "btn-outline border-base-300"
                                                    }`}
                                                    aria-label={
                                                        favorite
                                                            ? "Премахни от любими"
                                                            : "Добави в любими"
                                                    }
                                                >
                                                    <Heart
                                                        size={18}
                                                        className={favorite ? "fill-current" : ""}
                                                    />
                                                    {favorite ? "В любими" : "Добави в любими"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filteredUnis.length > visibleCount && (
                        <div className="flex justify-center mt-8">
                            <button
                                type="button"
                                className="btn btn-primary rounded-2xl px-8"
                                onClick={() => setVisibleCount((c) => c + 60)}
                            >
                                Покажи още
                            </button>
                        </div>
                    )}
                    </>
                )}

                {/* --- EMPTY STATE --- */}
                {!loading && filteredUnis.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="bg-base-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-black opacity-40 italic uppercase tracking-tighter text-center">
                            Нищо не открихме... <br />
                            Пробвай друго търсене.
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversitiesPage;
