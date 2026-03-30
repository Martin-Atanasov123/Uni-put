// Модул: Калкулатор на състезателен бал
// Описание: Дава UI и логика за избор на факултет/специалност, въвеждане на оценки
//   и изчисляване на бал на база коефициенти от база данни (Supabase).
// Вход: данни от Supabase (universities), потребителски оценки
// Изход: изчислен бал и описания на липсващи термини/слотове; визуализация с филтри
// Бизнес логика: групира ключове по SLOT_GROUP; при алтернативни ключове взима най-изгодния (max grade×coef).
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useLocation } from "react-router-dom";
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
    const [dropdownShowAll, setDropdownShowAll] = useState(false);
    const location = useLocation();
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [grades, setGrades] = useState({});

    // Derived unique values for filters
    const cities = [...new Set(allData.map(d => d.city).filter(Boolean))].sort();
    const universities = [...new Set(allData.map(d => d.university_name).filter(Boolean))].sort();

    // Filtered faculties for search (show all when dropdownShowAll is true)
    const filteredFaculties = useMemo(() => {
        if (dropdownShowAll) return faculties;
        if (!facultySearch) return faculties;
        return faculties.filter(f =>
            f.toLowerCase().includes(facultySearch.toLowerCase())
        );
    }, [faculties, facultySearch, dropdownShowAll]);

    // Filtered data based on Faculty, City and University
    const filteredData = allData.filter(d => {
        const matchFaculty = !selectedFaculty || d.faculty === selectedFaculty;
        const matchCity = !selectedCity || d.city === selectedCity;
        const matchUni = !selectedUniversity || d.university_name === selectedUniversity;
        return matchFaculty && matchCity && matchUni;
    });

    // Specialties based on filtered data
    const availableSpecialties = [...new Set(filteredData.map(d => d.specialty))].sort();

    useEffect(() => {
        const fetchFaculties = async () => {
            setLoading(true);
            /**
             * Взима списък с факултети от Supabase.
             * Причина за имплементация: UI трябва да показва динамичен списък от база, не хардкодиран.
             * Странични ефекти: При грешка логира и оставя текущото състояние; няма кеш тук.
             */
            const { data, error } = await supabase.from('universities').select('faculty');
            if (!error && data) {
                const list = [...new Set(data.map(item => item.faculty).filter(Boolean))];
                setFaculties(list);
                try {
                    localStorage.setItem("uniput_faculties_cache", JSON.stringify(list));
                } catch {
                    // cache write failed silently
                }
            }
            setLoading(false);
        };
        // Кеш: зареждане при старт
        try {
            const raw = localStorage.getItem("uniput_faculties_cache");
            if (raw) {
                const cached = JSON.parse(raw);
                if (Array.isArray(cached) && cached.length > 0) {
                    setFaculties(cached);
                }
            }
        } catch {
            // cache read failed silently
        }
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (!selectedFaculty) return;
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('universities')
                .select('*')
                .eq('faculty', selectedFaculty);
            if (!error && data) setAllData(data);
            setLoading(false);
        };
        fetchData();
    }, [selectedFaculty]);

    // Auto-select from URL params (e.g. from Career Advisor link)
    const [pendingSpecialty, setPendingSpecialty] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const specialtyParam = params.get('specialty');
        if (!specialtyParam) return;

        const autoSelect = async () => {
            const { data, error } = await supabase
                .from('universities')
                .select('faculty, specialty')
                .ilike('specialty', `%${specialtyParam}%`)
                .limit(1);

            if (error || !data || data.length === 0) return;

            const match = data[0];
            setPendingSpecialty(match.specialty);
            setSelectedFaculty(match.faculty);
            setFacultySearch(match.faculty);
        };
        autoSelect();
    }, [location.search]);

    // Once allData loads after auto-select, set the pending specialty
    useEffect(() => {
        if (!pendingSpecialty || allData.length === 0) return;
        const match = allData.find(d => d.specialty === pendingSpecialty);
        if (match) {
            setSelectedSpecialtyName(pendingSpecialty);
            setPendingSpecialty(null);
        }
    }, [allData, pendingSpecialty]);

    useEffect(() => {
        setIsFacultyDropdownOpen(false);
        setDropdownShowAll(false);
    }, [location.pathname]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setIsFacultyDropdownOpen(false);
                setDropdownShowAll(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleGradesChange = (newGrades) => {
        setGrades(newGrades);
    };

    const rowsForSelectedSpecialty = useMemo(() => {
        if (!selectedSpecialtyName) return [];
        return filteredData.filter((d) => d.specialty === selectedSpecialtyName);
    }, [filteredData, selectedSpecialtyName]);

    const coefficientsForInputs = useMemo(() => {
        const merged = {};
        rowsForSelectedSpecialty.forEach((row) => {
            const slots = Array.isArray(row?.coefficients) ? row.coefficients : [];
            slots.forEach(slot => {
                (slot.alternatives || []).forEach(alt => {
                    if (alt?.key) merged[alt.key] = Number(alt.coef) || 1;
                });
            });
        });
        return merged;
    }, [rowsForSelectedSpecialty]);

    const describeGroup = (groupId) => {
        if (FIELD_LABELS[groupId]) return FIELD_LABELS[groupId];
        if (SLOT_GROUPS[groupId]) {
            const firstWithLabel = SLOT_GROUPS[groupId].find((k) => FIELD_LABELS[k]);
            if (firstWithLabel) return FIELD_LABELS[firstWithLabel];
        }
        return groupId;
    };

    const getGroupIdForKey = (key) => {
        let groupId = key;
        for (const [master, members] of Object.entries(SLOT_GROUPS)) {
            if (members.includes(key)) {
                groupId = master;
                break;
            }
        }
        return groupId;
    };

    const describeMissingTerm = (termKeys) => {
        const labels = [];
        const seen = new Set();

        termKeys.forEach((key) => {
            const label = FIELD_LABELS[key] || describeGroup(getGroupIdForKey(key));
            if (!seen.has(label)) {
                seen.add(label);
                labels.push(label);
            }
        });

        return labels.join(" / ");
    };

    /**
     * Смята крайния бал по дадени коефициенти и оценки.
     * - Групира ключовете по SLOT_GROUP (предмет), не по стойност на коефициента.
     * - За всяка група взима алтернативата с най-висок grade×coef (авто-избор на най-изгодна).
     * - Връща сбор и списък липсващи слотове.
     * @param {Record<string, number|string>} coefficients
     * @param {Record<string, string|number>} gradeSource
     * @param {Record<string, string>} activeAltMap
     * @returns {{ score: number, missingSlots: string[][] }}
     */
    const calculateScore = (coefficients, gradeSource) => {
        if (!Array.isArray(coefficients) || coefficients.length === 0) return { score: 0, missingSlots: [] };

        let total = 0;
        const missingSlots = [];

        coefficients.forEach((slot) => {
            const alternatives = slot.alternatives || [];
            let bestProduct = null;
            const keys = [];

            alternatives.forEach(alt => {
                if (!alt?.key) return;
                keys.push(alt.key);
                const val = parseFloat(gradeSource[alt.key]);
                if (!Number.isNaN(val) && val >= 2 && val <= 6) {
                    const product = val * Number(alt.coef);
                    if (bestProduct === null || product > bestProduct) {
                        bestProduct = product;
                    }
                }
            });

            if (bestProduct === null) {
                missingSlots.push(keys);
            } else {
                total += bestProduct;
            }
        });

        return { score: total, missingSlots };
    };

    const hasAnyValidGrade = useMemo(() => {
        return Object.values(grades).some((v) => {
            const n = parseFloat(v);
            return !Number.isNaN(n) && n >= 2 && n <= 6;
        });
    }, [grades]);

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
                                        setDropdownShowAll(false); // switch to filter mode on typing
                                        setIsFacultyDropdownOpen(true);
                                    }}
                                    onClick={() => {
                                        setIsFacultyDropdownOpen(true);
                                        setDropdownShowAll(true); // show full list on click
                                    }}
                                    onFocus={() => {
                                        setIsFacultyDropdownOpen(true);
                                        setDropdownShowAll(true);
                                    }}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs rounded-full"
                                        onClick={() => {
                                            setFacultySearch("");
                                            setSelectedFaculty("");
                                            setSelectedSpecialtyName("");
                                            setSelectedCity("");
                                            setSelectedUniversity("");
                                            setIsFacultyDropdownOpen(true);
                                            setDropdownShowAll(true);
                                        }}
                                        aria-label="Изчисти"
                                        title="Изчисти"
                                    >
                                        <XCircle size={16} className="opacity-60" />
                                    </button>
                                    <ChevronDown className={`opacity-50 transition-transform duration-300 ${isFacultyDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                                </div>
                            </div>

                            {isFacultyDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10 cursor-default"
                                        onClick={() => {
                                            setIsFacultyDropdownOpen(false);
                                            setDropdownShowAll(false);
                                        }}
                                    ></div>
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
                                                        setDropdownShowAll(false);
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
                            aria-label="Избери специалност"
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
                {selectedSpecialtyName && rowsForSelectedSpecialty.length > 0 && (
                    <div className="bg-base-100 shadow-2xl p-8 border border-base-200 rounded-[3rem] animate-in fade-in slide-in-from-top-4 duration-500">
                        <GradeInputSection 
                            coefficients={coefficientsForInputs} 
                            faculty={selectedFaculty}
                            specialty={selectedSpecialtyName}
                            onGradesChange={handleGradesChange} 
                        />
                    </div>
                )}

                {/* --- РЕЗУЛТАТИ --- */}
                {(() => {
                    // Средно аритметично на max_ball за специалностите с попълнена стойност
                    const maxBallValues = rowsForSelectedSpecialty
                        .map(r => Number(r.max_ball))
                        .filter(v => !Number.isNaN(v) && v > 0);
                    const averageMaxBall = maxBallValues.length > 0
                        ? maxBallValues.reduce((a, b) => a + b, 0) / maxBallValues.length
                        : null;

                    const displayedResults = rowsForSelectedSpecialty.map(item => {
                        const { score, missingSlots } = calculateScore(item.coefficients, grades);
                        const formattedScore = Number.isFinite(score) ? score.toFixed(2) : "0.00";
                        const hasMaxBall = averageMaxBall !== null;
                        const isAboveAverage = hasMaxBall && score >= averageMaxBall;
                        const diff = hasMaxBall ? Math.abs(averageMaxBall - score).toFixed(2) : null;
                        const hasStarted = score > 0 || hasAnyValidGrade;
                        const hasMissing = missingSlots.length > 0;
                        return { item, score, formattedScore, diff, isAboveAverage, hasMaxBall, hasStarted, hasMissing, missingSlots };
                    });
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {displayedResults.map(({ item, formattedScore, isAboveAverage, hasMaxBall, hasMissing, hasStarted, diff, missingSlots }) => (
                                <div key={item.id} className="bg-base-100 p-10 rounded-[3rem] shadow-xl border border-base-200 group transition-all hover:shadow-2xl">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[11px] md:text-xs font-medium opacity-50 uppercase tracking-wide block mb-1">{item.university_name}</span>
                                                <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">{item.specialty}</h3>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-5xl font-black tracking-tighter ${hasMaxBall && isAboveAverage ? 'text-success' : 'text-primary'}`}>
                                                    {hasMissing ? "—" : formattedScore}
                                                </div>
                                                <div className="text-[10px] font-black opacity-30 uppercase">БАЛ</div>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-base-200 rounded-[2rem] text-[clamp(12px,1.1vw,13px)] font-semibold opacity-80 flex gap-4 border-l-4 border-primary">
                                            <Info size={20} className="shrink-0 text-primary mt-0.5" />
                                            <span className="min-w-0 break-words whitespace-pre-wrap"><strong>Метод:</strong> {item.formula_description}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-base-200 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            {hasMaxBall && (
                                                <span className="text-xs font-black opacity-40 italic font-mono uppercase">Макс. бал: {averageMaxBall.toFixed(2)}</span>
                                            )}
                                            {hasMissing && hasStarted && (
                                                <div className="mt-1 text-[11px] text-error font-black uppercase">
                                                    Липсват оценки за: {missingSlots.map(describeMissingTerm).join(", ")}
                                                </div>
                                            )}
                                            {hasMaxBall && !hasMissing && !isAboveAverage && hasStarted && (
                                                <div className="flex items-center gap-1.5 text-error mt-1 animate-pulse">
                                                    <TrendingDown size={14} strokeWidth={3} />
                                                    <span className="text-[11px] font-black uppercase">Под средното с {diff} т.</span>
                                                </div>
                                            )}
                                        </div>
                                        {!hasMissing && hasMaxBall && isAboveAverage && <div className="badge badge-success py-3 px-5 font-black italic text-white rounded-xl shadow-lg animate-bounce"><CheckCircle2 size={12} className="mr-1"/>НАД СРЕДНОТО</div>}
                                        {!hasMissing && hasMaxBall && !isAboveAverage && hasStarted && <div className="badge badge-error badge-outline py-3 px-5 font-black italic rounded-xl border-2">ПОД СРЕДНОТО</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default CalculatorPage;


