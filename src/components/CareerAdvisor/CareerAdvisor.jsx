import { useState, useEffect, useMemo, useLayoutEffect, useRef } from "react";
import { m } from "motion/react";
import { calculateScores, calculateRiasecCode } from "@/lib/riasec-matcher";
import { getRiasecMatches } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import riasecData from "@/data/riasec_questions.json";
import {
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Target,
    Zap,
    Layout,
    Layers,
    ClipboardList,
    AlertCircle,
    Sparkles,
} from "lucide-react";

import RIASECResults from "./RIASECResults";

const S = {
    surface: {
        background: "var(--brand-surface)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--brand-card-border)",
        borderRadius: "1.25rem",
    },
};

const VERSIONS = [
    {
        id: "short",
        name: "Кратка",
        questions: 30,
        time: "3–5 мин",
        icon: Zap,
        accent: "#fbbf24",
        accentBg: "rgba(251,191,36,0.12)",
        accentBorder: "rgba(251,191,36,0.3)",
        desc: "Бърз преглед на твоите основни интереси.",
    },
    {
        id: "standard",
        name: "Стандартна",
        questions: 60,
        time: "8–12 мин",
        icon: Layout,
        accent: "var(--brand-cyan)",
        accentBg: "rgba(6,182,212,0.12)",
        accentBorder: "rgba(6,182,212,0.35)",
        desc: "Балансирана версия за прецизни резултати.",
        recommended: true,
    },
    {
        id: "extended",
        name: "Разширена",
        questions: 90,
        time: "15–20 мин",
        icon: Layers,
        accent: "var(--brand-violet)",
        accentBg: "rgba(139,92,246,0.12)",
        accentBorder: "rgba(139,92,246,0.35)",
        desc: "Дълбок анализ на професионалния ти потенциал.",
    },
];

const CareerAdvisor = () => {
    const [step, setStep] = useState("version");
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(() => {
        const saved = localStorage.getItem("riasec_answers");
        return saved ? JSON.parse(saved) : {};
    });
    const [results, setResults] = useState(null);
    const [quizVersion, setQuizVersion] = useState(null);
    const [scaleLabels, setScaleLabels] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const questionCardRef = useRef(null);
    const preservedScrollYRef = useRef(null);
    const shouldScrollToQuestionRef = useRef(false);

    useEffect(() => {
        localStorage.setItem("riasec_answers", JSON.stringify(answers));
    }, [answers]);

    useEffect(() => {
        if (riasecData) {
            setQuestions(riasecData.questions);
            setScaleLabels(riasecData.scaleLabels);
        }
    }, []);

    const filteredQuestions = useMemo(() => {
        if (!questions.length || !quizVersion) return [];
        if (quizVersion === "short") {
            const types = ["R", "I", "A", "S", "E", "C"];
            const set = [];
            types.forEach(t => set.push(...questions.filter(q => q.type === t).slice(0, 5)));
            return set;
        }
        if (quizVersion === "standard") return questions.slice(0, 60);
        return questions;
    }, [questions, quizVersion]);

    useLayoutEffect(() => {
        if (step !== "quiz") return;
        if (preservedScrollYRef.current !== null) {
            window.scrollTo({ top: preservedScrollYRef.current, behavior: "auto" });
            preservedScrollYRef.current = null;
        }
        if (shouldScrollToQuestionRef.current && questionCardRef.current) {
            const rect = questionCardRef.current.getBoundingClientRect();
            const targetTop = window.scrollY + rect.top - 220;
            window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
            shouldScrollToQuestionRef.current = false;
        }
    }, [currentQuestionIndex, step]);

    const handleVersionSelect = version => {
        setQuizVersion(version);
        setStep("quiz");
        setCurrentQuestionIndex(0);
        setAnswers({});
        localStorage.removeItem("riasec_answers");
        window.scrollTo(0, 0);
    };

    const handleAnswer = value => {
        if (isTransitioning) return;
        const questionId = filteredQuestions[currentQuestionIndex].id;
        preservedScrollYRef.current = window.scrollY;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setShowWarning(false);
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                shouldScrollToQuestionRef.current = true;
                setCurrentQuestionIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 500);
        }
    };

    const handleNext = () => {
        const questionId = filteredQuestions[currentQuestionIndex].id;
        if (!answers[questionId]) { setShowWarning(true); return; }
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            preservedScrollYRef.current = window.scrollY;
            shouldScrollToQuestionRef.current = true;
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
        else {
            setStep("version");
            localStorage.removeItem("riasec_quiz_version");
            localStorage.removeItem("riasec_answers");
        }
    };

    const calculateFinalResults = async () => {
        setLoading(true);
        setStep("results");
        try {
            const scores = calculateScores(answers, filteredQuestions);
            const riasecCode = calculateRiasecCode(scores);
            const { specialties, careers, error } = await getRiasecMatches(scores);
            setResults({ scores, riasecCode, specialties, careers, error });

            // Persist primary RIASEC type
            const primaryType = riasecCode?.[0];
            if (primaryType) {
                localStorage.setItem("riasec_result", primaryType);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await supabase.auth.updateUser({ data: { riasec_type: primaryType } });
                } catch { /* not logged in — that's fine */ }
            }
        } catch { /* empty */ } finally { setLoading(false); }
    };

    const renderVersionSelection = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-text)", textWrap: "balance" }}>
                    Избери версия на теста
                </h2>
                <p style={{ margin: 0, color: "var(--brand-muted)", maxWidth: "480px", marginLeft: "auto", marginRight: "auto", fontSize: "15px" }}>
                    Колкото повече въпроси отговориш, толкова по-точен ще бъде твоят кариерен профил.
                </p>
            </div>

            <m.div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
                {VERSIONS.map(v => {
                    const Icon = v.icon;
                    return (
                        <m.button
                            key={v.id}
                            variants={{
                                hidden: { opacity: 0, y: 16 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            type="button"
                            onClick={() => handleVersionSelect(v.id)}
                            style={{
                                position: "relative",
                                padding: "1.75rem",
                                background: v.recommended ? "rgba(6,182,212,0.06)" : "var(--brand-surface)",
                                backdropFilter: "blur(8px)",
                                border: `1px solid ${v.recommended ? "rgba(6,182,212,0.35)" : "var(--brand-card-border)"}`,
                                borderRadius: "1.25rem",
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.25rem",
                                fontFamily: "inherit",
                                color: "var(--brand-text)",
                                transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(6,182,212,0.12)"; e.currentTarget.style.borderColor = v.accentBorder; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = v.recommended ? "rgba(6,182,212,0.35)" : "var(--brand-card-border)"; }}
                        >
                            {v.recommended && (
                                <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))", color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", padding: "0.3rem 0.875rem", borderRadius: "999px", boxShadow: "0 8px 20px rgba(6,182,212,0.3)" }}>
                                    Препоръчано
                                </span>
                            )}
                            <div style={{ width: "3rem", height: "3rem", borderRadius: "0.875rem", background: v.accentBg, border: `1px solid ${v.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: v.accent }}>
                                <Icon size={26} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{v.name} версия</h3>
                                <p style={{ margin: 0, fontSize: "13px", color: "var(--brand-muted)", lineHeight: 1.5 }}>{v.desc}</p>
                            </div>
                            <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--brand-border)", display: "flex", justifyContent: "space-between" }}>
                                <div>
                                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>Въпроси</span>
                                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--brand-text)", fontFamily: "monospace" }}>{v.questions}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--brand-muted)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>Време</span>
                                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--brand-text)", fontFamily: "monospace" }}>{v.time}</span>
                                </div>
                            </div>
                        </m.button>
                    );
                })}
            </m.div>
        </div>
    );

    const renderQuiz = () => {
        if (!filteredQuestions.length) return null;
        const currentQ = filteredQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;
        const currentAnswer = answers[currentQ.id];

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                {/* Progress bar */}
                <div
                    style={{
                        position: "sticky",
                        top: "6rem",
                        zIndex: 10,
                        padding: "0.875rem 1rem",
                        background: "var(--brand-progress-bg)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: "1rem",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--brand-muted)" }}>
                            Въпрос {currentQuestionIndex + 1} от {filteredQuestions.length}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--brand-cyan)", textTransform: "uppercase",fontFamily: "monospace" }}>
                            {Math.round(progress)}% завършени
                        </span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "var(--brand-border)", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-violet))",
                                borderRadius: "999px",
                                transition: "width 0.5s ease",
                                boxShadow: "0 0 12px rgba(6,182,212,0.5)",
                            }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div ref={questionCardRef} style={{ display: "flex", flexDirection: "column", gap: "1.75rem", paddingTop: "2rem" }}>
                    <h2 style={{ fontSize: currentQ.text.length > 60 ? "1.5rem" : "1.875rem", fontWeight: 800, lineHeight: 1.25, textAlign: "center", maxWidth: "640px", margin: "0 auto", color: "var(--brand-text)", letterSpacing: "-0.01em", textWrap: "balance" }}>
                        {currentQ.text}
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxWidth: "520px", margin: "0 auto", width: "100%" }}>
                        {[1, 2, 3, 4, 5].map(val => {
                            const active = currentAnswer === val;
                            return (
                                <button
                                    key={val}
                                    type="button"
                                    disabled={isTransitioning}
                                    onClick={() => handleAnswer(val)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "0.875rem 1rem",
                                        background: active ? "rgba(6,182,212,0.12)" : "var(--brand-surface)",
                                        border: `1px solid ${active ? "rgba(6,182,212,0.5)" : "var(--brand-card-border)"}`,
                                        borderRadius: "0.875rem",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-text)",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: isTransitioning ? "not-allowed" : "pointer",
                                        opacity: isTransitioning ? 0.5 : 1,
                                        fontFamily: "inherit",
                                        transition: "background 0.2s, border-color 0.2s",
                                    }}
                                    onMouseEnter={e => { if (!active && !isTransitioning) e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "var(--brand-card-border)"; }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, background: active ? "var(--brand-cyan)" : "var(--brand-border)", color: active ? "#0F172A" : "var(--brand-muted)", fontFamily: "monospace" }}>
                                            {val}
                                        </span>
                                        {scaleLabels[val]}
                                    </span>
                                    {active && <CheckCircle2 size={18} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {showWarning && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#f87171", fontWeight: 600, fontSize: "13px" }}>
                        <AlertCircle size={18} />
                        <span>Моля, отговорете на въпроса, преди да продължите!</span>
                    </div>
                )}

                {/* Nav */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--brand-border)" }}>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.625rem", color: "var(--brand-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit" }}
                    >
                        <ChevronLeft size={14} /> Назад
                    </button>

                    {currentQuestionIndex === filteredQuestions.length - 1 ? (
                        <button
                            type="button"
                            disabled={!currentAnswer || loading}
                            onClick={calculateFinalResults}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.75rem 1.75rem",
                                background: !currentAnswer ? "rgba(148,163,184,0.1)" : "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                border: "none",
                                borderRadius: "0.75rem",
                                color: "#fff",
                                fontSize: "14px",
                                fontWeight: 800,
                                cursor: !currentAnswer ? "not-allowed" : "pointer",
                                opacity: !currentAnswer ? 0.5 : 1,
                                boxShadow: !currentAnswer ? "none" : "0 10px 30px rgba(6,182,212,0.3)",
                                fontFamily: "inherit",
                            }}
                        >
                            Виж резултатите <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1rem", background: "transparent", border: "1px solid var(--brand-border)", borderRadius: "0.625rem", color: currentAnswer ? "var(--brand-text)" : "var(--brand-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit", opacity: !currentAnswer ? 0.5 : 1 }}
                        >
                            Напред <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderResults = () => {
        if (loading) {
            return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: "1.5rem" }}>
                    <div style={{ position: "relative", width: "5rem", height: "5rem" }}>
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                border: "3px solid rgba(6,182,212,0.15)",
                                borderTopColor: "var(--brand-cyan)",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                        <Target size={28} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--brand-cyan)" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-text)", letterSpacing: "-0.01em", textWrap: "balance" }}>Генерираме твоя профил...</h3>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--brand-muted)", fontSize: "14px" }}>Анализираме отговорите и търсим най-добрите съвпадения.</p>
                    </div>
                </div>
            );
        }
        if (!results) return null;
        return (
            <RIASECResults
                results={results}
                onRestart={() => {
                    setStep("version");
                    setResults(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    localStorage.removeItem("riasec_answers");
                }}
            />
        );
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", paddingTop: step === "quiz" ? "5rem" : "6rem", paddingBottom: "5rem", position: "relative", overflow: "hidden" }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ambient glow */}
            <div aria-hidden style={{ position: "absolute", top: "-200px", right: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: "-200px", left: "-200px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 1.5rem", position: "relative" }}>
                {step === "version" && (
                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "999px", color: "var(--brand-cyan)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 auto" }}>
                            <Sparkles size={12} /> RIASEC
                        </div>
                        <h1 style={{ margin: 0, fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", textWrap: "balance" }}>
                            Открий своето{" "}
                            <span
                                style={{
                                    background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                призвание
                            </span>
                        </h1>
                        <p style={{ margin: 0, fontSize: "1.0625rem", color: "var(--brand-muted)", maxWidth: "620px", marginLeft: "auto", marginRight: "auto" }}>
                            Научно обоснован метод за определяне на твоите професионални интереси и намиране на перфектната кариера.
                        </p>
                    </div>
                )}

                <div style={step === "results" ? {} : { ...S.surface, padding: "2rem 1.5rem" }}>
                    {step === "version" && renderVersionSelection()}
                    {step === "quiz" && renderQuiz()}
                    {step === "results" && renderResults()}
                </div>

                {step === "version" && (
                    <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                        <div style={{ ...S.surface, padding: "1.5rem", display: "flex", gap: "1rem" }}>
                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <ClipboardList size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--brand-muted)" }}>Как работи?</h4>
                                <p style={{ margin: "0.4rem 0 0", fontSize: "13px", lineHeight: 1.55, color: "var(--brand-text)" }}>
                                    Алгоритъмът измерва 6 измерения на личността: Реалистичен, Изследователски, Артистичен, Социален, Предприемчив и Конвенционален.
                                </p>
                            </div>
                        </div>
                        <div style={{ ...S.surface, padding: "1.5rem", display: "flex", gap: "1rem" }}>
                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "var(--brand-cyan)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--brand-muted)" }}>Съвет</h4>
                                <p style={{ margin: "0.4rem 0 0", fontSize: "13px", lineHeight: 1.55, color: "var(--brand-text)" }}>
                                    Отговаряй честно според това как се чувстваш, а не според това как смяташ, че "трябва" да се отговори.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </m.div>
    );
};

export default CareerAdvisor;
