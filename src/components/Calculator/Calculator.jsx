
// import { useState, useEffect } from "react";
// import { supabase } from "../supabaseClient";
// import { Calculator, ChevronRight, GraduationCap, School, AlertCircle, ArrowDownUp } from "lucide-react";

// // Използваме точните имена от твоя списък с променливи [cite: 2, 3, 5]
// const FIELD_LABELS = {
// // Твоите първоначални:
//     dzi_mat: "Матура по Математика",
//     dzi_inf: "Матура по Информатика",
//     dzi_it: "Матура по ИТ",
//     dzi_fizika: "Матура по Физика",
//     dzi_bel: "Матура по БЕЛ",
//     exam_mat: "Кандидатстудентски изпит по математика",
//     mat: "Диплома: Математика",
//     informatika: "Диплома: Информатика",
//     informacionni: "Диплома: ИТ",
    
//     // От списъка за Биология и Химия (добавяме детайлите!):
//     dzi_bio: "Матура по Биология (обща)",
//     dzi1_bio: "Матура по Биология – Профилирана (ДЗИ 1)",
//     dzi2_bio: "Матура по Биология – Общообразователна (ДЗИ 2)",
//     exam_bio: "Изпит по Биология",
//     bio: "Диплома: Биология",
//     himija: "Диплома: Химия",
//     dzi_him: "Матура по Химия",
//     exam_him: "Изпит по Химия", // От секцията "Нови променливи"

//     // Други важни от файла:
//     fizika: "Диплома: Физика",
//     geografija: "Диплома: География",
//     exam_geo: "Изпит по География",
//     dzi_geo: "Матура по География",
//     prof_exam_inf: "Държавен изпит за проф. квалификация",
//     tournament: "Оценка от турнир или олимпиада"
// };

// const CalculatorPage = () => {
//     // eslint-disable-next-line no-unused-vars
//     const [loading, setLoading] = useState(false);
//     const [allData, setAllData] = useState([]); 
//     const [faculties, setFaculties] = useState([]); 
//     const [selectedFaculty, setSelectedFaculty] = useState("");
//     const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
//     const [currentSpecialtyObj, setCurrentSpecialtyObj] = useState(null);

//     const [grades, setGrades] = useState({}); 
//     const [errors, setErrors] = useState({}); 
//     const [substitutions, setSubstitutions] = useState({}); 

//     useEffect(() => {
//         const fetchFaculties = async () => {
//             setLoading(true);
//             const { data, error } = await supabase.from('university_admissions').select('faculty');
//             if (!error) {
//                 const unique = [...new Set(data.map(item => item.faculty).filter(Boolean))];
//                 setFaculties(unique);
//             }
//             setLoading(false);
//         };
//         fetchFaculties();
//     }, []);

//     useEffect(() => {
//         if (!selectedFaculty) return;
//         const fetchData = async () => {
//             setLoading(true);
//             const { data, error } = await supabase.from('university_admissions').select('*').eq('faculty', selectedFaculty);
//             if (!error) setAllData(data);
//             setLoading(false);
//         };
//         fetchData();
//     }, [selectedFaculty]);

//     useEffect(() => {
//         const match = allData.find(item => item.specialty === selectedSpecialtyName);
//         setCurrentSpecialtyObj(match || null);
//     }, [selectedSpecialtyName, allData]);

//     const handleGradeChange = (key, value) => {
//         const num = parseFloat(value);
//         let error = (value && (num < 2 || num > 6)) ? "Оценка между 2 и 6" : null;
//         setErrors(prev => ({ ...prev, [key]: error }));
//         setGrades(prev => ({ ...prev, [key]: value }));
//     };

//     const calculateScore = (coefficients) => {
//         if (!coefficients) return 0;
//         let total = 0;
//         Object.entries(coefficients).forEach(([key, multiplier]) => {
//             total += (parseFloat(grades[key]) || 0) * multiplier;
//         });
//         return total.toFixed(2);
//     };

//     const neededFields = currentSpecialtyObj?.coefficients ? Object.keys(currentSpecialtyObj.coefficients) : [];

//     return (
//         <div className="min-h-screen bg-base-200 pt-24 pb-12 px-4">
//             <div className="max-w-7xl mx-auto space-y-8">
//                 {/* Header */}
//                 <div className="text-center space-y-2">
//                     <h1 className="text-4xl font-black text-primary flex justify-center gap-3">
//                         <Calculator className="w-10 h-10" />Калкулатор за Бал 
//                     </h1>
//                 </div>

//                 {/* Селектори */}
//                 <div className="card bg-base-100 shadow-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="form-control">
//                         <label className="label font-bold">Избери Факултет</label>
//                         <select className="select select-bordered select-primary" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
//                             <option value="">-- Факултет --</option>
//                             {faculties.map((f, i) => <option key={i} value={f}>{f}</option>)}
//                         </select>
//                     </div>
//                     <div className="form-control">
//                         <label className="label font-bold">Избери Специалност</label>
//                         <select className="select select-bordered" value={selectedSpecialtyName} onChange={(e) => setSelectedSpecialtyName(e.target.value)} disabled={!selectedFaculty}>
//                             <option value="">-- Всички специалности --</option>
//                             {[...new Set(allData.map(d => d.specialty))].map((s, i) => <option key={i} value={s}>{s}</option>)}
//                         </select>
//                     </div>
//                 </div>

//                 {/* Динамични полета за оценки */}
//                 {selectedSpecialtyName && (
//                     <div className="card bg-base-100 shadow-xl p-6">
//                         <h2 className="card-title mb-6"><GraduationCap className="text-secondary" /> Нужни оценки</h2>
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             {neededFields.map(fieldKey => (
//                                 <div key={fieldKey} className="p-4 bg-base-200 rounded-xl relative">
//                                     <label className="label-text block text-xs font-bold mb-2 uppercase opacity-70">
//                                         {substitutions[fieldKey] ? `Заместване: ДЗИ за ${fieldKey}` : (FIELD_LABELS[fieldKey] || fieldKey)}
//                                     </label>
//                                     <input 
//                                         type="number" step="0.01" className={`input input-bordered w-full ${errors[fieldKey] ? 'input-error' : ''}`}
//                                         value={grades[fieldKey] || ""} onChange={(e) => handleGradeChange(fieldKey, e.target.value)}
//                                     />
//                                     {fieldKey.includes('exam') && (
//                                         <button className="btn btn-circle btn-xs absolute top-2 right-2" onClick={() => setSubstitutions(p => ({...p, [fieldKey]: !p[fieldKey]}))}>
//                                             <ArrowDownUp className="w-3 h-3" />
//                                         </button>
//                                     )}
//                                     {errors[fieldKey] && <p className="text-error text-[10px] mt-1">{errors[fieldKey]}</p>}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Резултати в Grid по 3 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {(selectedSpecialtyName ? allData.filter(d => d.specialty === selectedSpecialtyName) : allData).map(item => {
//                         const score = calculateScore(item.coefficients);
//                         return (
//                             <div key={item.id} className="card bg-base-100 shadow-lg border-t-4 border-primary hover:scale-[1.02] transition-transform">
//                                 <div className="card-body">
//                                     <span className="text-[10px] opacity-50 uppercase tracking-widest">{item.university_name}</span>
//                                     <h2 className="card-title text-lg leading-tight">{item.specialty}</h2>
//                                     <div className="divider my-1"></div>
//                                     <p className="text-xs italic opacity-60 h-12 overflow-hidden">{item.formula_description}</p>
//                                     <div className="flex justify-between items-center mt-4 bg-base-200 p-3 rounded-lg">
//                                         <span className="text-xs font-bold">ТВОЯТ БАЛ:</span>
//                                         <span className={`text-2xl font-black ${score >= item.min_ball_2024 ? 'text-success' : 'text-error'}`}>{score}</span>
//                                     </div>
//                                     <div className="text-[10px] mt-2 text-center opacity-50">Мин. бал 2024: {item.min_ball_2024}</div>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CalculatorPage;



import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { 
    Calculator, 
    GraduationCap, 
    AlertCircle, 
    ArrowDownUp, 
    Info, 
    CheckCircle2,
    LayoutDashboard
} from "lucide-react";

// Пълен списък с етикети, коригирани на "ДЗИ"
const FIELD_LABELS = {
    dzi_mat: "ДЗИ Математика",
    dzi_inf: "ДЗИ Информатика",
    dzi_it: "ДЗИ ИТ",
    dzi_fizika: "ДЗИ Физика",
    dzi_bel: "ДЗИ БЕЛ",
    exam_mat: "Изпит Математика",
    mat: "Диплома: Математика",
    informatika: "Диплома: Информатика",
    informacionni: "Диплома: ИТ",
    dzi_bio: "ДЗИ Биология",
    dzi1_bio: "ДЗИ Биология (Профил)",
    dzi2_bio: "ДЗИ Биология (Обща)",
    exam_bio: "Изпит Биология",
    bio: "Диплома: Биология",
    himija: "Диплома: Химия",
    dzi_him: "ДЗИ Химия",
    exam_him: "Изпит Химия",
    fizika: "Диплома: Физика",
    geografija: "Диплома: География",
    exam_geo: "Изпит География",
    dzi_geo: "ДЗИ География",
    prof_exam_inf: "Проф. квалификация",
    tournament: "Турнир/Олимпиада"
};

// Карта за интелигентно заместване (Edge Case: Изпит или ДЗИ)
const SUBSTITUTION_MAP = {
    'exam_mat': ['dzi_mat', 'dzi_inf', 'dzi_it', 'tournament'],
    'exam_bio': ['dzi_bio', 'dzi1_bio', 'dzi2_bio'],
    'exam_him': ['dzi_him'],
    'exam_geo': ['dzi_geo'],
    'mat': ['dzi_mat'],
    'informatika': ['dzi_inf', 'dzi_it', 'prof_exam_inf']
};

const CalculatorPage = () => {
    const [loading, setLoading] = useState(false);
    const [allData, setAllData] = useState([]); 
    const [faculties, setFaculties] = useState([]); 
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [currentSpecialtyObj, setCurrentSpecialtyObj] = useState(null);
    const [grades, setGrades] = useState({}); 
    const [errors, setErrors] = useState({}); 
    const [activeSubstitutions, setActiveSubstitutions] = useState({}); 

    useEffect(() => {
        const fetchFaculties = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('university_admissions').select('faculty');
            if (!error) {
                const unique = [...new Set(data.map(item => item.faculty).filter(Boolean))];
                setFaculties(unique);
            }
            setLoading(false);
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (!selectedFaculty) return;
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('university_admissions').select('*').eq('faculty', selectedFaculty);
            if (!error) setAllData(data);
            setLoading(false);
        };
        fetchData();
    }, [selectedFaculty]);

    useEffect(() => {
        const match = allData.find(item => item.specialty === selectedSpecialtyName);
        setCurrentSpecialtyObj(match || null);
    }, [selectedSpecialtyName, allData]);

    const handleGradeChange = (key, value) => {
        const num = parseFloat(value);
        let errorMsg = (value && (num < 2 || num > 6)) ? "Невалидна оценка" : null;
        setErrors(prev => ({ ...prev, [key]: errorMsg }));
        setGrades(prev => ({ ...prev, [key]: value }));
    };

    const toggleSubstitution = (originalKey, substituteKey) => {
        setActiveSubstitutions(prev => ({ ...prev, [originalKey]: substituteKey }));
    };

    // Функция за филтриране и ГРУПИРАНЕ на алтернативни полета (Edge Case Logic)
    const getVisibleFields = (coefficients) => {
        if (!coefficients) return [];
        const keys = Object.keys(coefficients);
        const visible = [];
        const processed = new Set();

        keys.forEach(key => {
            if (processed.has(key)) return;
            const alternatives = SUBSTITUTION_MAP[key] || [];
            const foundAlternative = alternatives.find(alt => keys.includes(alt));

            if (foundAlternative) {
                visible.push({ mainKey: key, options: [key, foundAlternative], isAlternative: true });
                processed.add(key);
                processed.add(foundAlternative);
            } else {
                visible.push({ mainKey: key, options: [key], isAlternative: false });
                processed.add(key);
            }
        });
        return visible;
    };

    const calculateScore = (coefficients) => {
        if (!coefficients) return 0;
        let total = 0;
        Object.entries(coefficients).forEach(([key, multiplier]) => {
            const effectiveKey = activeSubstitutions[key] || key;
            const grade = parseFloat(grades[effectiveKey]) || 0;
            total += grade * multiplier;
        });
        return total.toFixed(2);
    };

    const visibleFields = getVisibleFields(currentSpecialtyObj?.coefficients);

    return (
        <div className="min-h-screen bg-base-100 pt-24 pb-12 px-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary animate-bounce">
                        <Calculator size={40} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase italic">Калкулатор v2.1</h1>
                    {loading && <span className="loading loading-dots loading-md text-primary"></span>}
                </div>

                {/* --- СЕЛЕКТОРИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200 p-4 rounded-3xl shadow-inner">
                    <select className="select select-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold" value={selectedFaculty} onChange={(e) => {setSelectedFaculty(e.target.value); setSelectedSpecialtyName("");}}>
                        <option value="">Избери факултет...</option>
                        {faculties.map((f, i) => <option key={i} value={f}>{f}</option>)}
                    </select>
                    <select className="select select-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold" value={selectedSpecialtyName} onChange={(e) => setSelectedSpecialtyName(e.target.value)} disabled={!selectedFaculty}>
                        <option value="">Избери специалност...</option>
                        {[...new Set(allData.map(d => d.specialty))].map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* --- УМНИ ВХОДНИ ДАННИ --- */}
                {selectedSpecialtyName && (
                    <div className="bg-base-100 shadow-2xl p-8 border border-base-200 rounded-[2.5rem]">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black flex items-center gap-3 italic underline decoration-primary">
                                <GraduationCap size={32} className="text-primary" /> Входни данни
                            </h2>
                            <div className="badge badge-primary badge-outline py-4 px-6 font-black italic">Умни полета</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {visibleFields.map(group => {
                                const activeKey = activeSubstitutions[group.mainKey] || group.mainKey;
                                const hasError = !!errors[activeKey];
                                
                                return (
                                    <div key={group.mainKey} className={`group p-8 bg-base-200 rounded-[2.5rem] border-2 transition-all ${hasError ? 'border-error bg-error/5' : 'border-transparent hover:border-primary/40 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                                                {FIELD_LABELS[activeKey] || activeKey}
                                            </span>
                                            
                                            {group.options.length > 1 && (
                                                <div className="dropdown dropdown-end">
                                                    <button tabIndex={0} className="btn btn-primary btn-sm rounded-xl gap-2 shadow-xl border-none hover:scale-105 transition-transform">
                                                        <ArrowDownUp size={14} /> <span className="text-[10px] font-black">СМЕНИ</span>
                                                    </button>
                                                    <ul tabIndex={0} className="dropdown-content z-[30] menu p-3 shadow-2xl bg-base-100 rounded-2xl w-64 mt-2 border-2 border-primary/20">
                                                        {group.options.map(opt => (
                                                            <li key={opt} onClick={() => toggleSubstitution(group.mainKey, opt)}>
                                                                <a className={`text-xs ${activeKey === opt ? 'font-black text-primary bg-primary/10' : ''}`}>
                                                                    {FIELD_LABELS[opt]}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="6.00"
                                                className={`bg-transparent text-5xl font-black w-full outline-none ${hasError ? 'text-error animate-pulse' : 'text-base-content'}`}
                                                value={grades[activeKey] || ""} 
                                                onChange={(e) => handleGradeChange(activeKey, e.target.value)}
                                            />
                                            {hasError && <div className="absolute -bottom-6 left-0 text-[10px] text-error font-black uppercase flex items-center gap-1">
                                                <AlertCircle size={10} /> {errors[activeKey]}
                                            </div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- РЕЗУЛТАТИ С РЕАЛНИ ФОРМУЛИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(selectedSpecialtyName ? allData.filter(d => d.specialty === selectedSpecialtyName) : allData).map(item => {
                        const score = calculateScore(item.coefficients);
                        const isPassing = score >= item.min_ball_2024;

                        return (
                            <div key={item.id} className="bg-base-100 p-10 rounded-[3rem] shadow-xl border border-base-200 flex flex-col justify-between hover:shadow-2xl transition-all relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full blur-3xl opacity-10 transition-all group-hover:opacity-30 ${isPassing ? 'bg-success' : 'bg-primary'}`}></div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 opacity-40">
                                            <LayoutDashboard size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.university_name}</span>
                                        </div>
                                        <h3 className="text-2xl font-black leading-tight">{item.specialty}</h3>
                                    </div>
                                    
                                    <div className="p-5 bg-base-200 rounded-[2rem] text-[13px] font-bold leading-relaxed opacity-80 flex gap-4 border-l-4 border-primary">
                                        <Info size={20} className="shrink-0 text-primary mt-0.5" />
                                        <span><strong>Метод:</strong> {item.formula_description}</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-base-200 pt-6">
                                    <div>
                                        <div className={`text-5xl font-black tracking-tighter ${isPassing ? 'text-success' : 'text-primary'}`}>{score}</div>
                                        <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">Твоят Бал</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black opacity-50 italic">Мин. бал 2024: {item.min_ball_2024}</div>
                                        {isPassing && <div className="badge badge-success mt-2 font-black italic gap-1 py-3 text-white"><CheckCircle2 size={12}/> Класиран!</div>}
                                    </div>
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
