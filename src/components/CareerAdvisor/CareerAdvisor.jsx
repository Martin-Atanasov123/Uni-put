import React, { useState, useEffect } from 'react';
import { calculateScores, calculateRiasecCode } from '../../lib/riasec-matcher';
import { getCareerRecommendations, getUniversityRecommendations } from '../../lib/api';
import RiasecRadar from './RiasecRadar';
import { 
    BookOpen, 
    Briefcase, 
    CheckCircle2, 
    GraduationCap, 
    ChevronRight, 
    ChevronLeft, 
    Loader2, 
    Target,
    MapPin,
    Building2
} from 'lucide-react';

const CareerAdvisor = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [answers, setAnswers] = useState({
        grade: "",
        interests: [],
        strengths: [],
        environment: "",
        style: ""
    });

    const totalSteps = 5;

    const handleAnswer = (field, value) => {
        setAnswers(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleSelection = (field, value) => {
        setAnswers(prev => {
            const current = prev[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const nextStep = () => {
        if (step < totalSteps) {
            setStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    const calculateResults = async () => {
        setLoading(true);
        try {
            const scores = calculateScores(answers);
            const riasecCode = calculateRiasecCode(scores);
            
            // Parallel fetch
            const [careers, universities] = await Promise.all([
                getCareerRecommendations(scores),
                getUniversityRecommendations(riasecCode)
            ]);

            setResults({
                scores,
                riasecCode,
                careers,
                universities
            });
        } catch (error) {
            console.error("Error calculating results:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step === 5 && !results) {
            calculateResults();
        }
    }, [step]);

    // --- RENDER HELPERS ---
    
    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="text-primary" />
                В кой клас си?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['8', '9', '10', '11', '12', 'Завършил'].map((grade) => (
                    <button
                        key={grade}
                        onClick={() => handleAnswer('grade', grade)}
                        className={`btn h-auto py-6 text-lg rounded-2xl ${answers.grade === grade ? 'btn-primary' : 'btn-outline border-base-300'}`}
                    >
                        {grade} клас
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-secondary" />
                Какво те влече?
            </h2>
            <p className="opacity-60">Избери всички, които ти допадат:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { id: 'Technology', label: 'Технологии', desc: 'Компютри, джаджи, софтуер', icon: '💻' },
                    { id: 'Art', label: 'Изкуство', desc: 'Рисуване, музика, дизайн', icon: '🎨' },
                    { id: 'Science', label: 'Наука', desc: 'Биология, физика, експерименти', icon: '🔬' },
                    { id: 'Social', label: 'Социални дейности', desc: 'Помощ на хора, преподаване', icon: '🤝' },
                    { id: 'Business', label: 'Бизнес', desc: 'Лидерство, продажби, управление', icon: '💼' },
                    { id: 'Nature', label: 'Природа', desc: 'Животни, растения, екология', icon: '🌿' }
                ].map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => toggleSelection('interests', item.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] ${answers.interests.includes(item.id) ? 'border-primary bg-primary/10' : 'border-base-200 bg-base-100'}`}
                    >
                        <div className="text-3xl">{item.icon}</div>
                        <div>
                            <div className="font-bold text-lg">{item.label}</div>
                            <div className="text-xs opacity-60">{item.desc}</div>
                        </div>
                        {answers.interests.includes(item.id) && <CheckCircle2 className="ml-auto text-primary" />}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="text-accent" />
                Твоите силни страни?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { id: 'Logic', label: 'Логика', desc: 'Аналитично мислене, структуриране' },
                    { id: 'Creativity', label: 'Креативност', desc: 'Създаване на нови неща, въображение' },
                    { id: 'Communication', label: 'Комуникация', desc: 'Общуване, презентиране, писане' },
                    { id: 'Math', label: 'Математика', desc: 'Числа, формули, статистика' },
                    { id: 'Organization', label: 'Организация', desc: 'Планиране, ред, детайли' },
                    { id: 'Problem-solving', label: 'Решаване на проблеми', desc: 'Намиране на решения в трудни ситуации' }
                ].map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => toggleSelection('strengths', item.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] ${answers.strengths.includes(item.id) ? 'border-accent bg-accent/10' : 'border-base-200 bg-base-100'}`}
                    >
                        <div className={`w-4 h-4 rounded-full border-2 ${answers.strengths.includes(item.id) ? 'bg-accent border-accent' : 'border-base-300'}`}></div>
                        <div>
                            <div className="font-bold">{item.label}</div>
                            <div className="text-xs opacity-60">{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Briefcase className="text-warning" />
                Работни предпочитания
            </h2>
            
            <div className="space-y-4">
                <h3 className="font-bold opacity-70">Къде предпочиташ да работиш?</h3>
                <div className="grid grid-cols-2 gap-3">
                    {['Офис', 'Лаборатория', 'На терен', 'Дистанционно'].map(opt => (
                        <button
                            key={opt}
                            onClick={() => handleAnswer('environment', opt)}
                            className={`btn h-auto py-4 rounded-xl ${answers.environment === opt ? 'btn-warning' : 'btn-ghost bg-base-200'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold opacity-70">Стил на работа</h3>
                <div className="grid grid-cols-2 gap-3">
                    {['Самостоятелно', 'В екип'].map(opt => (
                        <button
                            key={opt}
                            onClick={() => handleAnswer('style', opt)}
                            className={`btn h-auto py-4 rounded-xl ${answers.style === opt ? 'btn-warning' : 'btn-ghost bg-base-200'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep5 = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black">Анализираме отговорите ти...</h3>
                        <p className="opacity-50">Изчисляване на RIASEC профил и търсене на съвпадения</p>
                    </div>
                </div>
            );
        }

        if (!results) return null;

        return (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
                {/* Header Result */}
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-primary/10 rounded-full text-primary mb-4">
                        <Target size={48} />
                    </div>
                    <h2 className="text-4xl font-black">Твоят RIASEC код: <span className="text-primary">{results.riasecCode}</span></h2>
                    <p className="max-w-md mx-auto opacity-70">
                        Базирано на твоите интереси и силни страни, ти си най-силен в областите:
                        {results.riasecCode.split('').map(char => {
                            const map = { R: ' Реалистичен', I: ' Изследователски', A: ' Артистичен', S: ' Социален', E: ' Предприемачески', C: ' Конвенционален' };
                            return <span key={char} className="font-bold block text-lg">{map[char]} ({char})</span>
                        })}
                    </p>
                </div>

                {/* Radar Chart */}
                <div className="bg-base-100 p-6 rounded-3xl shadow-lg border border-base-200">
                    <h3 className="text-xl font-bold mb-4 text-center">Визуализация на профила</h3>
                    <RiasecRadar scores={results.scores} />
                </div>

                {/* Recommended Careers */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                        <Briefcase className="text-secondary" /> 
                        Препоръчани Професии
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.careers.length > 0 ? results.careers.map((career, idx) => (
                            <div key={idx} className="card bg-base-100 shadow-xl border-l-4 border-secondary hover:shadow-2xl transition-all">
                                <div className="card-body">
                                    <div className="flex justify-between items-start">
                                        <h4 className="card-title text-lg">{career.occupation_bg || career.occupation_en}</h4>
                                        <div className="badge badge-secondary font-bold">{career.matchScore}% съвпадение</div>
                                    </div>
                                    <p className="text-sm opacity-60 italic">{career.occupation_en}</p>
                                    <div className="flex gap-2 mt-2">
                                        <div className="badge badge-ghost badge-sm">{career.riasec_code}</div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-10 opacity-50">Няма намерени професии за този профил.</div>
                        )}
                    </div>
                </div>

                {/* Recommended Universities */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                        <Building2 className="text-accent" /> 
                        Препоръчани Университети
                    </h3>
                    <div className="space-y-4">
                        {results.universities.length > 0 ? results.universities.map((uni, idx) => (
                            <div key={idx} className="bg-base-100 p-6 rounded-2xl shadow-md border border-base-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-lg">{uni.specialty}</h4>
                                    <p className="opacity-70 flex items-center gap-1 text-sm mt-1">
                                        <Building2 size={14} /> {uni.university_name}
                                    </p>
                                    <p className="opacity-50 flex items-center gap-1 text-xs mt-1">
                                        <MapPin size={12} /> {uni.city}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 min-w-[100px]">
                                    <div className="badge badge-accent badge-lg text-white font-bold">{uni.matchScore}%</div>
                                    {uni.min_score && <div className="text-xs font-bold opacity-60">Мин. бал: {uni.min_score}</div>}
                                </div>
                            </div>
                        )) : (
                             <div className="text-center py-10 opacity-50">Няма намерени университети за този профил.</div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <button onClick={() => { setStep(1); setResults(null); }} className="btn btn-outline rounded-full px-8">
                        Направи теста отново
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-base-200 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Кариерен Съветник</h1>
                    <p className="text-lg opacity-60 max-w-2xl mx-auto">
                        Отговори на няколко въпроса и нашият AI алгоритъм ще намери най-подходящите професии и университети за теб.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12 overflow-x-auto pb-4">
                    <ul className="steps steps-horizontal w-full min-w-[500px]">
                        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Клас</li>
                        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Интереси</li>
                        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Умения</li>
                        <li className={`step ${step >= 4 ? 'step-primary' : ''}`}>Предпочитания</li>
                        <li className={`step ${step >= 5 ? 'step-primary' : ''}`}>Резултати</li>
                    </ul>
                </div>

                {/* Main Content Card */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-2xl p-6 md:p-12 relative overflow-hidden min-h-[400px]">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}

                    {/* Navigation Buttons */}
                    {step < 5 && (
                        <div className="flex justify-between mt-12 pt-6 border-t border-base-200">
                            <button 
                                onClick={prevStep} 
                                className={`btn btn-ghost gap-2 rounded-xl ${step === 1 ? 'invisible' : ''}`}
                            >
                                <ChevronLeft /> Назад
                            </button>
                            <button 
                                onClick={nextStep} 
                                className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30 gap-2"
                                disabled={
                                    (step === 1 && !answers.grade) ||
                                    (step === 2 && answers.interests.length === 0) ||
                                    (step === 3 && answers.strengths.length === 0) ||
                                    (step === 4 && (!answers.environment || !answers.style))
                                }
                            >
                                Напред <ChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareerAdvisor;
