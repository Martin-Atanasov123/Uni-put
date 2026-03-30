// Кариерен съветник – RIASEC въпросник за определяне на професионални интереси.
// Поддържа три версии: Кратка (30), Стандартна (60) и Разширена (90) въпроса.
import { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { calculateScores, calculateRiasecCode } from '../../lib/riasec-matcher';
import { getRiasecMatches } from '../../lib/api';
import riasecData from '../../data/riasec_questions.json';
import { 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Target,
    Zap,
    Layout,
    Layers,
    ClipboardList,
    AlertCircle
} from 'lucide-react';

import RIASECResults from './RIASECResults';

const CareerAdvisor = () => {
    // --- State ---
    const [step, setStep] = useState('version'); // 'version', 'quiz', 'results'
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(() => {
        const saved = localStorage.getItem('riasec_answers');
        return saved ? JSON.parse(saved) : {};
    });
    const [results, setResults] = useState(null);
    const [quizVersion, setQuizVersion] = useState(null); // 'short', 'standard', 'extended'
    const [scaleLabels, setScaleLabels] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const questionCardRef = useRef(null);
    const preservedScrollYRef = useRef(null);
    const shouldScrollToQuestionRef = useRef(false);
    const [isQuestionVisible, setIsQuestionVisible] = useState(true);

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('riasec_answers', JSON.stringify(answers));
    }, [answers]);

    // --- Load Questions ---
    useEffect(() => {
        if (riasecData) {
            setQuestions(riasecData.questions);
            setScaleLabels(riasecData.scaleLabels);
        }
    }, []);

    // --- Filtered Questions based on Version ---
    const filteredQuestions = useMemo(() => {
        if (!questions.length || !quizVersion) return [];
        
        if (quizVersion === 'short') {
            // Кратка версия: 30 въпроса (първите 5 от всеки тип)
            const types = ['R', 'I', 'A', 'S', 'E', 'C'];
            const shortSet = [];
            types.forEach(type => {
                const typeQuestions = questions.filter(q => q.type === type).slice(0, 5);
                shortSet.push(...typeQuestions);
            });
            return shortSet;
        }
        
        if (quizVersion === 'standard') {
            // Стандартна версия: 60 въпроса (всички налични в момента)
            return questions.slice(0, 60);
        }

        if (quizVersion === 'extended') {
            // Разширена версия: 90 въпроса (засега използваме 60, докато се добавят още)
            return questions;
        }

        return questions;
    }, [questions, quizVersion]);

    useLayoutEffect(() => {
        if (step !== 'quiz') return;

        if (preservedScrollYRef.current !== null) {
            window.scrollTo({ top: preservedScrollYRef.current, behavior: 'auto' });
            preservedScrollYRef.current = null;
        }

        if (shouldScrollToQuestionRef.current && questionCardRef.current) {
            const rect = questionCardRef.current.getBoundingClientRect();
            const targetTop = window.scrollY + rect.top - 220;
            window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            shouldScrollToQuestionRef.current = false;
        }
    }, [currentQuestionIndex, step]);

    useEffect(() => {
        if (step !== 'quiz' || !questionCardRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsQuestionVisible(entry.isIntersecting);
            },
            { threshold: 0.45 }
        );

        observer.observe(questionCardRef.current);
        return () => observer.disconnect();
    }, [step, currentQuestionIndex]);

    // --- Handlers ---
    const handleVersionSelect = (version) => {
        setQuizVersion(version);
        setStep('quiz');
        setCurrentQuestionIndex(0);
        setAnswers({});
        localStorage.removeItem('riasec_answers');
        window.scrollTo(0, 0);
    };

    const handleAnswer = (value) => {
        if (isTransitioning) return; // Prevent rapid clicking

        const questionId = filteredQuestions[currentQuestionIndex].id;
        preservedScrollYRef.current = window.scrollY;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setShowWarning(false);

        if (currentQuestionIndex < filteredQuestions.length - 1) {
            setIsTransitioning(true);
            // 500ms delay as requested to prevent rapid skip
            setTimeout(() => {
                shouldScrollToQuestionRef.current = true;
                setCurrentQuestionIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 500);
        }
    };

    const handleNext = () => {
        const questionId = filteredQuestions[currentQuestionIndex].id;
        if (!answers[questionId]) {
            setShowWarning(true);
            return;
        }
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            preservedScrollYRef.current = window.scrollY;
            shouldScrollToQuestionRef.current = true;
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else {
            setStep('version');
            localStorage.removeItem('riasec_quiz_version');
            localStorage.removeItem('riasec_answers');
        }
    };

    const calculateFinalResults = async () => {
        setLoading(true);
        setStep('results');
        try {
            // Използваме само въпросите от текущата версия за изчислението
            const scores = calculateScores(answers, filteredQuestions);
            const riasecCode = calculateRiasecCode(scores);
            
            // Търсене на съвпадения в базата данни
            const { specialties, careers, error } = await getRiasecMatches(scores);

            setResults({
                scores,
                riasecCode,
                specialties,
                careers,
                error
            });
        } catch {
            // RIASEC calculation error
        } finally {
            setLoading(false);
        }
    };

    // --- Renderers ---

    // 1. Избор на версия
    const renderVersionSelection = () => (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black tracking-tight">Избери версия на теста</h2>
                <p className="opacity-60 max-w-lg mx-auto">
                    Колкото повече въпроси отговориш, толкова по-точен ще бъде твоят кариерен профил.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { 
                        id: 'short', 
                        name: 'Кратка', 
                        questions: 30, 
                        time: '3-5 мин', 
                        icon: Zap, 
                        color: 'text-warning',
                        desc: 'Бърз преглед на твоите основни интереси.'
                    },
                    { 
                        id: 'standard', 
                        name: 'Стандартна', 
                        questions: 60, 
                        time: '8-12 мин', 
                        icon: Layout, 
                        color: 'text-primary',
                        desc: 'Балансирана версия за прецизни резултати.',
                        recommended: true
                    },
                    { 
                        id: 'extended', 
                        name: 'Разширена', 
                        questions: 90, 
                        time: '15-20 мин', 
                        icon: Layers, 
                        color: 'text-accent',
                        desc: 'Дълбок анализ на твоя професионален потенциал.'
                    }
                ].map((v) => (
                    <button
                        key={v.id}
                        onClick={() => handleVersionSelect(v.id)}
                        className={`relative group p-8 rounded-[2rem] border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-left flex flex-col gap-6 ${v.recommended ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}`}
                    >
                        {v.recommended && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-content text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                Препоръчано
                            </span>
                        )}
                        <div className={`w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center ${v.color}`}>
                            <v.icon size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black">{v.name} версия</h3>
                            <p className="text-sm opacity-50 leading-relaxed">{v.desc}</p>
                        </div>
                        <div className="mt-auto pt-4 border-t border-base-content/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-black opacity-40 uppercase">Въпроси</span>
                                <span className="font-bold">{v.questions}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-xs font-black opacity-40 uppercase">Време</span>
                                <span className="font-bold">{v.time}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // 2. Въпросник
    const renderQuiz = () => {
        if (!filteredQuestions.length) return null;
        const currentQ = filteredQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;
        const currentAnswer = answers[currentQ.id];

        return (
            <div className="space-y-12 animate-in fade-in duration-500">
                {/* Progress Bar (Clearly visible) */}
                <div className="bg-base-100 p-1 rounded-2xl border border-base-content/5 shadow-sm sticky top-24 z-10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">
                            Въпрос {currentQuestionIndex + 1} от {filteredQuestions.length}
                        </span>
                        <span className="text-xs font-black text-primary">
                            {Math.round(progress)}% завършени {isQuestionVisible ? '• Активен' : '• Извън фокус'}
                        </span>
                    </div>
                    <div className="h-4 w-full bg-base-200 rounded-full overflow-hidden p-1 border border-base-content/5">
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--p),0.5)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div
                    ref={questionCardRef}
                    className="space-y-6 pt-14 pb-4 min-h-[180px] flex flex-col justify-center"
                    aria-current={isQuestionVisible ? 'true' : 'false'}
                    style={isQuestionVisible ? { outline: '1px solid rgba(59, 130, 246, 0.25)', outlineOffset: '10px', borderRadius: '16px' } : undefined}
                >
                    <div className="space-y-2 text-center">
                        {/* <div className="badge badge-outline border-base-content/10 font-black text-[10px] uppercase tracking-widest px-3 py-2">
                           {currentQ.category || "Интереси"}
                        </div> */}
                        <h2 className={`font-black leading-tight max-w-2xl mx-auto break-words ${
                            currentQ.text.length > 60 ? 'text-lg md:text-2xl' : 'text-xl md:text-3xl'
                        }`}>
                            {currentQ.text}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 max-w-xl mx-auto">
                        {[1, 2, 3, 4, 5].map((val) => (
                            <button
                                key={val}
                                disabled={isTransitioning}
                                onClick={() => handleAnswer(val)}
                                className={`
                                    flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-base
                                    ${currentAnswer === val 
                                        ? 'border-primary bg-primary/10 text-primary' 
                                        : 'border-base-200 bg-base-100 hover:border-primary/30'}
                                    ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${currentAnswer === val ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                                        {val}
                                    </span>
                                    {scaleLabels[val]}
                                </span>
                                {currentAnswer === val && <CheckCircle2 size={20} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Warning Message */}
                {showWarning && (
                    <div className="flex items-center gap-2 text-error font-bold justify-center animate-bounce">
                        <AlertCircle size={20} />
                        <span>Моля, отговорете на въпроса, преди да продължите!</span>
                    </div>
                )}

                {/* Footer Nav */}
                <div className="flex items-center justify-between pt-6 border-t border-base-content/5 sticky bottom-0 bg-base-100 pb-2 z-10">
                    <button 
                        onClick={handleBack}
                        className="btn btn-ghost gap-2 rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                        <ChevronLeft size={18} /> Назад
                    </button>
                    
                    {currentQuestionIndex === filteredQuestions.length - 1 ? (
                        <button 
                            disabled={!currentAnswer || loading}
                            onClick={calculateFinalResults}
                            className={`btn btn-primary px-10 rounded-2xl font-black shadow-xl shadow-primary/30 gap-2 ${!currentAnswer ? 'btn-disabled opacity-50' : ''}`}
                        >
                            Виж резултатите <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleNext}
                            className={`btn btn-ghost gap-2 rounded-xl font-black uppercase tracking-widest text-xs ${!currentAnswer ? 'opacity-50' : ''}`}
                        >
                            Напред <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // 3. Резултати
    const renderResults = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                        <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-3xl font-black tracking-tight">Генерираме твоя профил...</h3>
                        <p className="opacity-50 font-medium">Анализираме отговорите и търсим най-добрите съвпадения.</p>
                    </div>
                </div>
            );
        }

        if (!results) return null;

        return (
            <RIASECResults 
                results={results} 
                onRestart={() => {
                    setStep('version');
                    setResults(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    localStorage.removeItem('riasec_answers');
                }} 
            />
        );
    };

    return (
        <div className={`min-h-screen bg-base-200 selection:bg-primary/20 pb-20 transition-all duration-500 ${step === 'quiz' ? 'pt-20 md:pt-20' : 'pt-24'}`}>
            <div className="container mx-auto px-4 max-w-5xl flex flex-col items-center">
                {/* Header Section */}
                {step === 'version' && (
                    <div className="text-center space-y-4 mb-10 w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                            <Zap size={12} /> RIASEC Career Advisor
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                            Открий своето <span className="text-primary italic">призвание</span>
                        </h1>
                        <p className="text-lg opacity-60 max-w-2xl mx-auto font-medium">
                            Научно обоснован метод за определяне на твоите професионални интереси и намиране на перфектната кариера.
                        </p>
                    </div>
                )}

                {/* Main Content Card */}
                <div className={`
                    relative transition-all duration-500 w-full
                    ${step === 'results' ? 'p-0 bg-transparent shadow-none' : 'bg-base-100 rounded-[3rem] shadow-2xl overflow-hidden p-6 md:p-12'}
                    ${step === 'quiz' ? 'md:p-8' : ''}
                `}>
                    {/* Background decorations */}
                    {step !== 'results' && (
                        <>
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none blur-2xl"></div>
                        </>
                    )}

                    {step === 'version' && renderVersionSelection()}
                    {step === 'quiz' && renderQuiz()}
                    {step === 'results' && renderResults()}
                </div>

                {/* Additional Info (Only on start page) */}
                {step === 'version' && (
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 opacity-80">
                        <div className="flex gap-6 p-8 rounded-3xl bg-base-100/50 border border-base-content/5">
                            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center shrink-0">
                                <ClipboardList size={24} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black uppercase tracking-widest text-xs opacity-50">Как работи?</h4>
                                <p className="text-sm leading-relaxed">Алгоритъмът измерва 6 измерения на личността: Реалистичен, Изследователски, Артистичен, Социален, Предприемчив и Конвенционален.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 p-8 rounded-3xl bg-base-100/50 border border-base-content/5">
                            <div className="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black uppercase tracking-widest text-xs opacity-50">Съвет</h4>
                                <p className="text-sm leading-relaxed">Отговаряй честно според това как се чувстваш, а не според това как смяташ, че "трябва" да се отговори.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerAdvisor;
