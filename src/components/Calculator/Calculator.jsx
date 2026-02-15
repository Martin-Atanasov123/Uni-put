import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
    Calculator, 
    Zap, 
    TrendingUp, 
    TrendingDown,
    ArrowRight,
    Info,
    CheckCircle2,
    History,
    ArrowDownUp,
    XCircle,
    Search,
    ChevronDown
} from "lucide-react";
import GradeInputSection from "./GradeInputSection";
import { FIELD_LABELS, SLOT_GROUPS } from "../../lib/coefficients_config";

const CalculatorPage = () => {
    const [, setLoading] = useState(false);
    const [allData, setAllData] = useState([]); 
    const [faculties, setFaculties] = useState([]); 
    const [selectedFaculty, setSelectedFaculty] = useState("");
    
    // Filters
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedUniversity, setSelectedUniversity] = useState("");
    
    // Searchable Faculty State
    const [facultySearch, setFacultySearch] = useState("");
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);

    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [grades, setGrades] = useState({});

    // Derived unique values for filters
    const cities = [...new Set(allData.map(d => d.city).filter(Boolean))].sort();
    const universities = [...new Set(allData.map(d => d.university_name).filter(Boolean))].sort();

    // Filtered faculties for search
    const filteredFaculties = faculties.filter(f => 
        !facultySearch || f.toLowerCase().includes(facultySearch.toLowerCase())
    );

    // Filtered data based on City and University
    const filteredData = allData.filter(d => {
        const matchCity = !selectedCity || d.city === selectedCity;
        const matchUni = !selectedUniversity || d.university_name === selectedUniversity;
        return matchCity && matchUni;
    });

    // Specialties based on filtered data
    const availableSpecialties = [...new Set(filteredData.map(d => d.specialty))].sort();

    useEffect(() => {
        const fetchFaculties = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('universities_duplicate').select('faculty');
            if (!error && data) setFaculties([...new Set(data.map(item => item.faculty).filter(Boolean))]);
            setLoading(false);
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (!selectedFaculty) return;
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('universities_duplicate').select('*').eq('faculty', selectedFaculty);
            if (!error && data) setAllData(data);
            setLoading(false);
        };
        fetchData();
    }, [selectedFaculty]);

    const handleGradesChange = (newGrades) => {
        setGrades(newGrades);
        // We can use 'valid' to block submission or show global error if needed
    };

    const getBestGradeForSlot = (mainKey) => {
        // Find which group this key belongs to
        let groupName = mainKey;
        for (const [master, members] of Object.entries(SLOT_GROUPS)) {
            if (members.includes(mainKey)) {
                groupName = master;
                break;
            }
        }

        const group = SLOT_GROUPS[groupName] || [mainKey];
        let bestKey = mainKey;
        let maxVal = -1;

        group.forEach(key => {
            const val = parseFloat(grades[key]);
            if (!isNaN(val) && val >= 2 && val <= 6) {
                if (val > maxVal) {
                    maxVal = val;
                    bestKey = key;
                }
            }
        });

        const currentVal = parseFloat(grades[bestKey]) || 0;
        return {
            key: bestKey,
            value: (currentVal >= 2 && currentVal <= 6) ? currentVal : 0,
            others: group.filter(k => k !== bestKey && (parseFloat(grades[k]) >= 2))
        };
    };

    const calculateScore = (coefficients) => {
        if (!coefficients) return 0;
        let total = 0;
        const processedGroups = new Set();
        
        Object.keys(coefficients).forEach(key => {
            let groupId = key;
            for (const [master, members] of Object.entries(SLOT_GROUPS)) {
                if (members.includes(key)) { groupId = master; break; }
            }
            
            if (!processedGroups.has(groupId)) {
                const { value } = getBestGradeForSlot(groupId);
                total += value * (coefficients[key] || 0);
                processedGroups.add(groupId);
            }
        });
        return total.toFixed(2);
    };

    return (
        <div className="min-h-screen bg-base-100 pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* --- ЗАГЛАВИЕ --- */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-xl">
                        <Calculator size={40} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase italic underline decoration-primary">Калкулатор </h1>
                </div>

                {/* --- ИЗБИРАТЕЛИ --- */}
                <div className="bg-base-200 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Faculty (Mandatory) - Searchable */}
                        <div className="relative">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="input input-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold px-6 w-full pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                    placeholder="Търси факултет..."
                                    value={facultySearch} 
                                    onChange={(e) => {
                                        setFacultySearch(e.target.value);
                                        if (selectedFaculty !== e.target.value) {
                                            setSelectedFaculty(""); // Clear actual selection if typing changes
                                            setSelectedSpecialtyName("");
                                            setSelectedCity("");
                                            setSelectedUniversity("");
                                        }
                                        setIsFacultyDropdownOpen(true);
                                    }}
                                    onClick={() => setIsFacultyDropdownOpen(true)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50 pointer-events-none">
                                    <ChevronDown className={`transition-transform duration-300 ${isFacultyDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                                </div>
                            </div>

                            {isFacultyDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsFacultyDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-2xl shadow-xl border border-base-200 max-h-60 overflow-y-auto z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {filteredFaculties.length > 0 ? (
                                            filteredFaculties.map((f, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full text-left px-6 py-3 hover:bg-base-200 font-bold border-b border-base-200 last:border-none transition-colors"
                                                    onClick={() => {
                                                        setSelectedFaculty(f);
                                                        setFacultySearch(f);
                                                        setSelectedSpecialtyName("");
                                                        setSelectedCity("");
                                                        setSelectedUniversity("");
                                                        setIsFacultyDropdownOpen(false);
                                                    }}
                                                >
                                                    {f}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center opacity-50 font-bold italic">Няма намерени резултати</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Specialty (Mandatory) */}
                        <select 
                            className="select select-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold px-6 w-full" 
                            value={selectedSpecialtyName} 
                            onChange={(e) => setSelectedSpecialtyName(e.target.value)} 
                            disabled={!selectedFaculty}
                        >
                            <option value="">Избери специалност (Задължително)</option>
                            {availableSpecialties.map((s, i) => <option key={i} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Optional Filters */}
                    {selectedFaculty && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-base-content/5 animate-in slide-in-from-top-2">
                            <select 
                                className="select select-sm select-ghost w-full font-bold opacity-70" 
                                value={selectedCity} 
                                onChange={(e) => {
                                    setSelectedCity(e.target.value);
                                    if (selectedSpecialtyName && !filteredData.find(d => d.specialty === selectedSpecialtyName && (!e.target.value || d.city === e.target.value))) {
                                        setSelectedSpecialtyName(""); // Reset specialty if current selection invalid under new filter
                                    }
                                }}
                            >
                                <option value="">Всички градове (Опционално)</option>
                                {cities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                            </select>

                            <select 
                                className="select select-sm select-ghost w-full font-bold opacity-70" 
                                value={selectedUniversity} 
                                onChange={(e) => {
                                    setSelectedUniversity(e.target.value);
                                    if (selectedSpecialtyName && !filteredData.find(d => d.specialty === selectedSpecialtyName && (!e.target.value || d.university_name === e.target.value))) {
                                        setSelectedSpecialtyName("");
                                    }
                                }}
                            >
                                <option value="">Всички университети (Опционално)</option>
                                {universities.map((u, i) => <option key={i} value={u}>{u}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* --- ВХОДНИ ПОЛЕТА --- */}
                <div className="bg-base-100 shadow-2xl p-8 border border-base-200 rounded-[3rem] animate-in fade-in slide-in-from-top-4 duration-500">
                    <GradeInputSection onGradesChange={handleGradesChange} />
                </div>

                {/* --- РЕЗУЛТАТИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredData.filter(d => d.specialty === selectedSpecialtyName).map(item => {
                        const score = calculateScore(item.coefficients);
                        const diff = (item.min_ball_2024 - score).toFixed(2);
                        const isPassing = score >= item.min_ball_2024;
                        const hasStarted = score > 0;

                        return (
                            <div key={item.id} className="bg-base-100 p-10 rounded-[3rem] shadow-xl border border-base-200 group transition-all hover:shadow-2xl">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter block mb-1">{item.university_name}</span>
                                            <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">{item.specialty}</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-5xl font-black tracking-tighter ${isPassing ? 'text-success' : 'text-primary'}`}>{score}</div>
                                            <div className="text-[10px] font-black opacity-30 uppercase">БАЛ</div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 bg-base-200 rounded-[2rem] text-[13px] font-bold opacity-80 flex gap-4 border-l-4 border-primary">
                                        <Info size={20} className="shrink-0 text-primary mt-0.5" />
                                        <span><strong>Метод:</strong> {item.formula_description}</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-base-200 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black opacity-40 italic font-mono uppercase">Мин. бал 2024: {item.min_ball_2024}</span>
                                        {!isPassing && hasStarted && (
                                            <div className="flex items-center gap-1.5 text-error mt-1 animate-pulse">
                                                <TrendingDown size={14} strokeWidth={3} />
                                                <span className="text-[11px] font-black uppercase">Нужни са още {diff} т.</span>
                                            </div>
                                        )}
                                    </div>
                                    {isPassing && <div className="badge badge-success py-3 px-5 font-black italic text-white rounded-xl shadow-lg animate-bounce"><CheckCircle2 size={12} className="mr-1"/>ВЛИЗАШ</div>}
                                    {!isPassing && hasStarted && <div className="badge badge-error badge-outline py-3 px-5 font-black italic rounded-xl border-2">НЕ ДОСТИГА</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;


