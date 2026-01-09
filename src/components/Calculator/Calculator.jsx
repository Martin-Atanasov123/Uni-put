
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Calculator, ChevronRight, GraduationCap, School, AlertCircle, ArrowDownUp } from "lucide-react";

// Използваме точните имена от твоя списък с променливи [cite: 2, 3, 5]
const FIELD_LABELS = {
    dzi_mat: "Матура по Математика",
    dzi_inf: "Матура по Информатика",
    dzi_it: "Матура по ИТ",
    dzi_fizika: "Матура по Физика",
    dzi_bel: "Матура по БЕЛ",
    exam_mat: "Кандидатстудентски изпит по математика",
    mat: "Диплома: Математика",
    informatika: "Диплома: Информатика",
    informacionni: "Диплома: ИТ",
    dzi_bio: "Матура по Биология",
    exam_bio: "Изпит по Биология",
    himija: "Диплома: Химия",
    dzi_him: "Матура по Химия",
    // dzi_mat_obiknovena: "Матура по Математика (Обикновена)",
};

const CalculatorPage = () => {
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false);
    const [allData, setAllData] = useState([]); 
    const [faculties, setFaculties] = useState([]); 
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [currentSpecialtyObj, setCurrentSpecialtyObj] = useState(null);

    const [grades, setGrades] = useState({}); 
    const [errors, setErrors] = useState({}); 
    const [substitutions, setSubstitutions] = useState({}); 

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
        let error = (value && (num < 2 || num > 6)) ? "Оценка между 2 и 6" : null;
        setErrors(prev => ({ ...prev, [key]: error }));
        setGrades(prev => ({ ...prev, [key]: value }));
    };

    const calculateScore = (coefficients) => {
        if (!coefficients) return 0;
        let total = 0;
        Object.entries(coefficients).forEach(([key, multiplier]) => {
            total += (parseFloat(grades[key]) || 0) * multiplier;
        });
        return total.toFixed(2);
    };

    const neededFields = currentSpecialtyObj?.coefficients ? Object.keys(currentSpecialtyObj.coefficients) : [];

    return (
        <div className="min-h-screen bg-base-200 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-primary flex justify-center gap-3">
                        <Calculator className="w-10 h-10" />Калкулатор за Бал 
                    </h1>
                </div>

                {/* Селектори */}
                <div className="card bg-base-100 shadow-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                        <label className="label font-bold">Избери Факултет</label>
                        <select className="select select-bordered select-primary" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                            <option value="">-- Факултет --</option>
                            {faculties.map((f, i) => <option key={i} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label font-bold">Избери Специалност</label>
                        <select className="select select-bordered" value={selectedSpecialtyName} onChange={(e) => setSelectedSpecialtyName(e.target.value)} disabled={!selectedFaculty}>
                            <option value="">-- Всички специалности --</option>
                            {[...new Set(allData.map(d => d.specialty))].map((s, i) => <option key={i} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Динамични полета за оценки */}
                {selectedSpecialtyName && (
                    <div className="card bg-base-100 shadow-xl p-6">
                        <h2 className="card-title mb-6"><GraduationCap className="text-secondary" /> Нужни оценки</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {neededFields.map(fieldKey => (
                                <div key={fieldKey} className="p-4 bg-base-200 rounded-xl relative">
                                    <label className="label-text block text-xs font-bold mb-2 uppercase opacity-70">
                                        {substitutions[fieldKey] ? `Заместване: ДЗИ за ${fieldKey}` : (FIELD_LABELS[fieldKey] || fieldKey)}
                                    </label>
                                    <input 
                                        type="number" step="0.01" className={`input input-bordered w-full ${errors[fieldKey] ? 'input-error' : ''}`}
                                        value={grades[fieldKey] || ""} onChange={(e) => handleGradeChange(fieldKey, e.target.value)}
                                    />
                                    {fieldKey.includes('exam') && (
                                        <button className="btn btn-circle btn-xs absolute top-2 right-2" onClick={() => setSubstitutions(p => ({...p, [fieldKey]: !p[fieldKey]}))}>
                                            <ArrowDownUp className="w-3 h-3" />
                                        </button>
                                    )}
                                    {errors[fieldKey] && <p className="text-error text-[10px] mt-1">{errors[fieldKey]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Резултати в Grid по 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedSpecialtyName ? allData.filter(d => d.specialty === selectedSpecialtyName) : allData).map(item => {
                        const score = calculateScore(item.coefficients);
                        return (
                            <div key={item.id} className="card bg-base-100 shadow-lg border-t-4 border-primary hover:scale-[1.02] transition-transform">
                                <div className="card-body">
                                    <span className="text-[10px] opacity-50 uppercase tracking-widest">{item.university_name}</span>
                                    <h2 className="card-title text-lg leading-tight">{item.specialty}</h2>
                                    <div className="divider my-1"></div>
                                    <p className="text-xs italic opacity-60 h-12 overflow-hidden">{item.formula_description}</p>
                                    <div className="flex justify-between items-center mt-4 bg-base-200 p-3 rounded-lg">
                                        <span className="text-xs font-bold">ТВОЯТ БАЛ:</span>
                                        <span className={`text-2xl font-black ${score >= item.min_ball_2024 ? 'text-success' : 'text-error'}`}>{score}</span>
                                    </div>
                                    <div className="text-[10px] mt-2 text-center opacity-50">Мин. бал 2024: {item.min_ball_2024}</div>
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
