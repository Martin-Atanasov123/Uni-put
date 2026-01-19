import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
    Calculator, 
    GraduationCap, 
    CheckCircle2, 
    LayoutDashboard,
    Zap,
    History,
    ArrowDownUp,
    Info,
    AlertTriangle,
    XCircle,
    TrendingDown
} from "lucide-react";

const FIELD_LABELS = {
    dzi_mat: "ДЗИ Математика",
    dzi_inf: "ДЗИ Информатика",
    dzi_it: "ДЗИ ИТ",
    exam_mat: "Изпит Математика",
    mat: "Диплома: Математика",
    dzi_bio: "ДЗИ Биология",

    exam_bio: "Изпит Биология",
    bio: "Диплома: Биология",
    dzi_him: "ДЗИ Химия",
    exam_him: "Изпит Химия",
    himija: "Диплома: Химия",
    tournament: "Турнир/Олимпиада",
    dzi1_bio: "ДЗИ Биология (Профил)",
    dzi2_bio: "ДЗИ Биология (Обща)",
    fizika: "Диплома: Физика",
    geografija: "Диплома: География",
    him: "Диплома: Химия",
    bel: "Диплома: БЕЛ"
};

const SLOT_GROUPS = {
    exam_bio: ["exam_bio", "dzi_bio", "dzi1_bio", "dzi2_bio"],
    exam_mat: ["exam_mat", "dzi_mat", "dzi_inf", "dzi_it", "tournament"],
    exam_him: ["exam_him", "dzi_him"],
    informatika: ["informatika", "informacionni", "dzi_inf", "dzi_it", "prof_exam_inf"]
};

const CalculatorPage = () => {
    const [, setLoading] = useState(false);
    const [allData, setAllData] = useState([]); 
    const [faculties, setFaculties] = useState([]); 
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
    const [currentSpecialtyObj, setCurrentSpecialtyObj] = useState(null);
    const [grades, setGrades] = useState({}); 
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchFaculties = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('university_admissions').select('faculty');
            if (!error && data) setFaculties([...new Set(data.map(item => item.faculty).filter(Boolean))]);
            setLoading(false);
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (!selectedFaculty) return;
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('university_admissions').select('*').eq('faculty', selectedFaculty);
            if (!error && data) setAllData(data);
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
        let errorMsg = null;
        if (value && (num < 2 || num > 6)) errorMsg = "Невалидна оценка (2-6)";
        setErrors(prev => ({ ...prev, [key]: errorMsg }));
        setGrades(prev => ({ ...prev, [key]: value }));
    };

    const getBestGradeForSlot = (mainKey) => {
        const group = SLOT_GROUPS[mainKey] || [mainKey];
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

    const getOrderedSlots = (coefficients) => {
        if (!coefficients) return [];
        const examSlots = [], diplomaSlots = [], seenGroups = new Set();
        Object.keys(coefficients).forEach(key => {
            let groupId = key;
            let isDiploma = !key.startsWith('exam_') && !key.startsWith('dzi_') && key !== 'tournament';
            for (const [master, members] of Object.entries(SLOT_GROUPS)) {
                if (members.includes(key)) { groupId = master; isDiploma = false; break; }
            }
            if (!seenGroups.has(groupId)) {
                const slotData = { masterKey: groupId, originalKey: key };
                if (isDiploma) diplomaSlots.push(slotData);
                else examSlots.push(slotData);
                seenGroups.add(groupId);
            }
        });
        return [...examSlots, ...diplomaSlots];
    };

    const visibleSlots = getOrderedSlots(currentSpecialtyObj?.coefficients);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200 p-3 rounded-[2.5rem] shadow-inner">
                    <select className="select select-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold px-6" value={selectedFaculty} onChange={(e) => {setSelectedFaculty(e.target.value); setSelectedSpecialtyName("");}}>
                        <option value="">Избери факултет...</option>
                        {faculties.map((f, i) => <option key={i} value={f}>{f}</option>)}
                    </select>
                    <select className="select select-bordered bg-base-100 border-none rounded-2xl text-lg h-14 font-bold px-6" value={selectedSpecialtyName} onChange={(e) => setSelectedSpecialtyName(e.target.value)} disabled={!selectedFaculty}>
                        <option value="">Избери специалност...</option>
                        {[...new Set(allData.map(d => d.specialty))].map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* --- ВХОДНИ ПОЛЕТА --- */}
                {selectedSpecialtyName && currentSpecialtyObj && (
                    <div className="bg-base-100 shadow-2xl p-8 border border-base-200 rounded-[3rem] animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black flex items-center gap-3 italic">
                                <Zap className="text-yellow-500" fill="currentColor" size={28} /> Входни данни
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {visibleSlots.map(slot => {
                                const { key: activeKey, others } = getBestGradeForSlot(slot.masterKey);
                                const groupMembers = SLOT_GROUPS[slot.masterKey] || [slot.masterKey];
                                const isDiploma = !activeKey.startsWith('exam_') && !activeKey.startsWith('dzi_');
                                const hasError = !!errors[activeKey];

                                return (
                                    <div key={slot.masterKey} className={`group p-8 rounded-[2.5rem] border-2 transition-all shadow-sm relative ${hasError ? 'border-error bg-error/5' : isDiploma ? 'bg-base-300 border-transparent opacity-90' : 'bg-base-200 border-primary/10 hover:border-primary/40'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-col flex-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${hasError ? 'text-error' : 'opacity-40'}`}>
                                                    {isDiploma ? "Оценка Диплома" : "Изпит / ДЗИ"}
                                                </span>
                                                <select className="select select-ghost select-xs font-black text-primary p-0 h-auto min-h-0 focus:bg-transparent text-sm" value={activeKey} onChange={(e) => handleGradeChange(e.target.value, grades[e.target.value] || "")}>
                                                    {groupMembers.map(m => <option key={m} value={m}>{FIELD_LABELS[m] || m}</option>)}
                                                </select>
                                            </div>
                                            {hasError ? <XCircle className="text-error" size={18} /> : !isDiploma && <ArrowDownUp size={16} className="text-primary opacity-40" />}
                                        </div>
                                        <input type="number" step="0.01" placeholder="6.00" className={`bg-transparent text-5xl font-black w-full outline-none ${hasError ? 'text-error' : 'text-base-content'}`} value={grades[activeKey] || ""} onChange={(e) => handleGradeChange(activeKey, e.target.value)} />
                                        {hasError && <p className="text-[10px] text-error font-black mt-2 uppercase italic">{errors[activeKey]}</p>}
                                        {others.length > 0 && !hasError && (
                                            <div className="mt-6 pt-4 border-t border-base-300 flex items-center gap-2 text-[10px] font-bold opacity-60 italic">
                                                <History size={12} /> Други: {others.map(k => `${grades[k]}`).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- РЕЗУЛТАТИ (Подобрена логика) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {allData.filter(d => d.specialty === selectedSpecialtyName).map(item => {
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
