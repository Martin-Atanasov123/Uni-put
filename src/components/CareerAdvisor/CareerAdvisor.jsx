import { useState, useEffect, useMemo, useLayoutEffect, useRef } from "react";
import { m } from "motion/react";
import { calculateScores, calculateRiasecCode } from "@/lib/riasec-matcher";
import { getRiasecMatches } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import riasecData from "@/data/riasec_questions.json";
import Seo from "@/components/common/Seo";
import ErrorState from "@/components/common/ErrorState";
import JsonLd from "@/components/common/JsonLd";
import MobileFold from "@/components/common/MobileFold";
import VersionPicker from "./VersionPicker";

// Quiz schema — Google rich result за интерактивни тестове.
// Подчертава че е безплатен + достъпен на български → AI Overview eligibility.
const RIASEC_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "RIASEC кариерен тест",
    about: "Психометричен тест на Холанд за кариерно ориентиране",
    educationalLevel: "Secondary education",
    inLanguage: "bg-BG",
    isAccessibleForFree: true,
    numberOfQuestions: 30,
    timeRequired: "PT3M",
};
import {
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Target,
    AlertCircle,
} from "lucide-react";

import RIASECResults from "./RIASECResults";
import { CareerPathsArt, InterestsHex, IllustrationStyles } from "@/components/common/Illustrations";
import { RIASEC_TYPES } from "@/lib/riasecTypes";
import { RIASEC_SPECIALTIES } from "@/lib/siteStats";

const LAST_RESULTS_KEY = "riasec_last_results";

const S = {
    surface: {
        background: "var(--brand-surface)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--brand-card-border)",
        borderRadius: "1.25rem",
    },
};

const VERSIONS = [
    { id: "short", name: "Кратка", questions: 30, time: "3–5 мин", desc: "Бърз ориентир по основните интереси", cta: "Започни краткия тест" },
    { id: "standard", name: "Стандартна", questions: 60, time: "8–12 мин", desc: "По-стабилен профил — подходящ за повечето ученици", cta: "Започни стандартния тест", recommended: true },
    { id: "extended", name: "Разширена", questions: 90, time: "15–20 мин", desc: "Най-подробният профил, ако имаш повече време", cta: "Започни разширения тест" },
];

const CareerAdvisor = () => {
    // Връщане след регистрация (Gate Б в RIASECResults): ?view=results + пазен
    // резултат → показваме го директно. Иначе регистрацията „изтрива" 30-те
    // отговора и човекът трябва да прави теста отново — endowment наобратно.
    const [restoredResults] = useState(() => {
        try {
            if (new URLSearchParams(window.location.search).get("view") !== "results") return null;
            const saved = JSON.parse(localStorage.getItem(LAST_RESULTS_KEY) || "null");
            return saved?.riasecCode ? saved : null;
        } catch { return null; }
    });
    const [step, setStep] = useState(() => (restoredResults ? "results" : "version"));
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(() => {
        const saved = localStorage.getItem("riasec_answers");
        return saved ? JSON.parse(saved) : {};
    });
    const [results, setResults] = useState(restoredResults);
    const [resultsError, setResultsError] = useState(false);
    const [quizVersion, setQuizVersion] = useState(null);
    const [pickedVersion, setPickedVersion] = useState("standard");
    const [scaleLabels, setScaleLabels] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const questionCardRef = useRef(null);
    const preservedScrollYRef = useRef(null);
    // Държи последната дефиниция на calculateFinalResults, за да я викнем от
    // setTimeout (auto-advance) без stale closure върху state-а.
    const calculateFinalResultsRef = useRef(null);
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
        } else {
            // ── Auto-advance към резултатите след отговор на последен въпрос ──
            // 600ms забавяне дава време на потребителя да види че отговорът му
            // е регистриран (button highlight) преди преходът към "results".
            // useEffect долу е safety net в случай че setTimeout пропусне
            // (напр. ако компонентът re-mount-не междувременно).
            setIsTransitioning(true);
            setTimeout(() => {
                calculateFinalResultsRef.current?.();
            }, 600);
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

    // Sync на ref-а към актуалната версия на calculateFinalResults
    // (всеки render създава нова, защото closure-ите ѝ зависят от state).
    useEffect(() => {
        calculateFinalResultsRef.current = calculateFinalResults;
    });

    const calculateFinalResults = async (force = false) => {
        if (step === "results" && force !== true) return; // вече се изпълнява — избягвай дубликат
        setLoading(true);
        setResultsError(false);
        setStep("results");
        try {
            const scores = calculateScores(answers, filteredQuestions);
            const riasecCode = calculateRiasecCode(scores);
            const { specialties, careers, error } = await getRiasecMatches(scores);
            setResults({ scores, riasecCode, specialties, careers, error });
            if (error) setResultsError(true);
            if (!error) {
                try {
                    localStorage.setItem(LAST_RESULTS_KEY, JSON.stringify({ scores, riasecCode, specialties, careers }));
                } catch { /* пълен storage — връщането след регистрация просто няма да възстанови */ }
            }

            // Persist primary RIASEC type
            const primaryType = riasecCode?.[0];
            if (primaryType) {
                localStorage.setItem("riasec_result", primaryType);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await supabase.auth.updateUser({ data: { riasec_type: primaryType } });
                } catch { /* not logged in — that's fine */ }
            }
        } catch {
            setResultsError(true);
        } finally { setLoading(false); }
    };

    // Изборът на версия: текстът вляво, вариантите вдясно като радио-редове.
    // Без времева линия — трите версии са алтернативи, не етапи.
    const renderVersionSelection = () => {
        const chosen = VERSIONS.find(v => v.id === pickedVersion) || VERSIONS[1];
        return (
            <div className="ca-intro">
                <style>{INTRO_CSS}</style>
                <IllustrationStyles />
                <section className="ca-intro__text">
                    <p className="ca-eyebrow">Кариерно ориентиране · RIASEC</p>
                    <h1 className="ca-h1">Какво те интересува?</h1>
                    <p className="ca-lead">Отговаряш на въпроси за дейности, които ти харесват. Получаваш профил на интересите си по модела на Холанд и подходящи специалности.</p>
                    <MobileFold title="Какво получаваш и как да отговаряш" className="ca-facts-wrap">
                    <dl className="ca-facts">
                        <div><dt>Какво получаваш</dt><dd>Шест типа интереси, подредени по сила, и специалности към тях.</dd></div>
                        <div><dt>Какво не е</dt><dd>Присъда. Резултатът е отправна точка за проучване, не оценка на способностите ти.</dd></div>
                        <div><dt>Как да отговаряш</dt><dd>Според това, което ти харесва, не според това, което „трябва“.</dd></div>
                    </dl>
                    </MobileFold>
                </section>
                <form className="ca-pick" onSubmit={e => { e.preventDefault(); handleVersionSelect(chosen.id); }}>
                    <VersionPicker versions={VERSIONS} picked={pickedVersion} onPick={setPickedVersion} />
                    <button type="submit" className="ca-go">{chosen.cta} <ChevronRight size={18} strokeWidth={2} aria-hidden="true" /></button>
                    <p className="ca-fine">Без регистрация. Можеш да смениш версията по-късно.</p>
                    <CareerPathsArt className="ca-art" />
                </form>
                <MobileFold title="Шестте типа интереси" className="ca-types-wrap">
                <section className="ca-types" aria-labelledby="ca-types-h">
                    <div className="ca-types__art"><InterestsHex /></div>
                    <div>
                        <h2 id="ca-types-h" className="ca-types__h" data-fold-head>Шестте типа интереси</h2>
                        <p className="ca-types__lead">Тестът мери колко силно те привлича всеки от тях. Съседните типове в шестоъгълника си приличат, срещуположните са най-различни.</p>
                        <ul className="ca-types__list">
                            {RIASEC_TYPES.map(t => (
                                <li key={t.code}><span className="ca-types__code" aria-hidden="true">{t.code}</span><span><b>{t.name}</b>{t.text}</span></li>
                            ))}
                        </ul>
                    </div>
                </section>
                </MobileFold>
            </div>
        );
    };

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
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--brand-cyan)", textTransform: "uppercase",fontFamily: "var(--font-mono)" }}>
                            {Math.round(progress)}% завършени
                        </span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "var(--brand-border)", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${progress}%`,
                                background: "var(--brand-accent)",
                                borderRadius: "999px",
                                transition: "width 0.5s ease",
                                boxShadow: "0 0 12px rgba(23,86,217,0.5)",
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
                                        background: active ? "rgba(23,86,217,0.12)" : "var(--brand-surface)",
                                        border: `1px solid ${active ? "rgba(23,86,217,0.5)" : "var(--brand-card-border)"}`,
                                        borderRadius: "0.875rem",
                                        color: active ? "var(--brand-cyan)" : "var(--brand-text)",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: isTransitioning ? "not-allowed" : "pointer",
                                        opacity: isTransitioning ? 0.5 : 1,
                                        fontFamily: "inherit",
                                        transition: "background 0.2s, border-color 0.2s",
                                    }}
                                    onMouseEnter={e => { if (!active && !isTransitioning) e.currentTarget.style.borderColor = "rgba(23,86,217,0.3)"; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "var(--brand-card-border)"; }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, background: active ? "var(--brand-cyan)" : "var(--brand-border)", color: active ? "#0E1525" : "var(--brand-muted)", fontFamily: "var(--font-mono)" }}>
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--danger)", fontWeight: 600, fontSize: "13px" }}>
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
                        // Последен въпрос — auto-advance към резултатите.
                        // Subtle indicator вместо бутон, за да види потребителят
                        // какво се случва когато отговори.
                        <span
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                fontSize: "11px", fontWeight: 700, color: "var(--brand-muted)",
                                textTransform: "uppercase", letterSpacing: "0.12em",
                                opacity: currentAnswer ? 1 : 0.5,
                                transition: "opacity 0.2s",
                            }}
                        >
                            {currentAnswer ? "Анализираме резултатите..." : "Отговори за да видиш резултата"}
                        </span>
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
                                border: "3px solid rgba(23,86,217,0.15)",
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
        if (resultsError || !results) {
            return (
                <ErrorState
                    message="Не успяхме да подберем специалности за твоя профил. Отговорите ти са запазени — провери връзката и опитай пак."
                    onRetry={() => calculateFinalResults(true)}
                />
            );
        }
        return (
            <RIASECResults
                results={results}
                onRestart={() => {
                    setStep("version");
                    setResults(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    localStorage.removeItem("riasec_answers");
                    // Махаме ?view=results, иначе презареждане след рестарт
                    // би възстановило стария резултат вместо новия тест.
                    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
                }}
            />
        );
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", paddingTop: step === "quiz" ? "5rem" : "calc(var(--header-h) + clamp(24px, 5vw, 72px))", paddingBottom: "5rem", position: "relative", overflow: "hidden" }}
        >
            <Seo
                title="Безплатен RIASEC кариерен тест за специалност"
                description={`Безплатен RIASEC кариерен тест — 30 въпроса за 3 минути. Сравняваме профила ти с ${RIASEC_SPECIALTIES} специалности, за да откриеш най-подходящите. Без регистрация.`}
                path="/career-advisor"
                image="https://uniput.eu/og/career-advisor.png"
            />
            <JsonLd data={RIASEC_SCHEMA} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ambient glow */}

            <div style={{ maxWidth: step === "version" ? "1280px" : "960px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 64px)", position: "relative" }}>
                <div style={step === "quiz" ? { ...S.surface, padding: "2rem 1.5rem" } : {}}>
                    {step === "version" && renderVersionSelection()}
                    {step === "quiz" && renderQuiz()}
                    {step === "results" && renderResults()}
                </div>

            </div>
        </m.div>
    );
};

const INTRO_CSS = `
.ca-intro { display: grid; gap: 40px; align-items: start; color: var(--ink); }
@media (min-width: 1000px) { .ca-intro { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 80px; } }
.ca-eyebrow { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-muted); }
.ca-h1 { margin: 12px 0 16px; font-size: clamp(34px, 4.4vw, 54px); line-height: 1.08; letter-spacing: -0.03em; font-weight: 740; text-wrap: balance; }
.ca-lead { margin: 0 0 24px; max-width: 46ch; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.6; color: var(--ink-muted); }
.ca-facts { margin: 0; border-top: 1px solid var(--border); }
.ca-facts > div { display: grid; gap: 2px; padding: 14px 0; border-bottom: 1px solid var(--border); font-size: 15px; line-height: 1.5; }
@media (min-width: 560px) { .ca-facts > div { grid-template-columns: 150px minmax(0, 1fr); gap: 12px; } }
.ca-facts dt { font-weight: 700; }
.ca-facts dd { margin: 0; color: var(--ink-muted); }
.ca-pick fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
.ca-pick legend { padding: 0; margin-bottom: 14px; font-size: clamp(19px, 1.8vw, 22px); font-weight: 700; }
.ca-opt { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; grid-template-areas: "radio name meta" "radio desc meta"; column-gap: 14px; row-gap: 2px; align-items: center; min-height: 72px; padding: 16px 18px; margin-bottom: 10px; border: 1px solid var(--border-strong); border-radius: var(--radius-feature); background: var(--surface); cursor: pointer; transition: border-color 0.14s ease; }
.ca-opt:hover { border-color: var(--ink); }
.ca-opt:has(input:checked) { border: 2px solid var(--brand); padding: 15px 17px; }
.ca-opt:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.ca-opt input { grid-area: radio; width: 22px; height: 22px; margin: 0; accent-color: var(--brand); }
.ca-opt__name { grid-area: name; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 18px; font-weight: 720; }
.ca-opt__desc { grid-area: desc; font-size: 15px; line-height: 1.45; color: var(--ink-muted); }
.ca-opt__meta { grid-area: meta; text-align: right; font-size: 15px; font-weight: 700; line-height: 1.35; white-space: nowrap; }
.ca-opt__meta small { display: block; font-size: 14px; font-weight: 500; color: var(--ink-muted); }
.ca-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--signal); color: var(--on-signal); font-size: 13px; font-weight: 750; }
.ca-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ca-go { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; margin-top: 8px; padding: 0 28px; border: 0; border-radius: var(--radius-control); background: var(--brand); color: var(--on-brand); font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; transition: background-color 0.14s ease; }
.ca-go:hover { background: var(--brand-hover); }
@media (max-width: 767px) {
  .ca-intro { gap: 0; }
  .ca-intro__text { display: contents; }
  .ca-h1 { margin: 8px 0 10px; }
  .ca-lead { margin-bottom: 20px; }
  .ca-pick { order: 1; margin-bottom: 24px; }
  .ca-pick legend { margin-bottom: 10px; font-size: 17px; }
  .ca-facts-wrap { order: 2; }
  .ca-types-wrap { order: 3; }
  .ca-types { padding-top: 0; border-top: 0; }
  .ca-types__art { display: none; }
  .ca-opt { min-height: 60px; grid-template-areas: "radio name meta"; margin-bottom: 8px; }
  /* описанието остава за екранния четец; визуално — само при препоръчаната */
  .ca-opt__desc { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ca-opt--rec { grid-template-areas: "radio name meta" "radio desc meta"; }
  .ca-opt--rec .ca-opt__desc { position: static; width: auto; height: auto; overflow: visible; clip: auto; white-space: normal; font-size: 14px; }
  .ca-opt__name { font-size: 16px; }
  .ca-opt__meta { font-size: 14px; }
}
@media (max-width: 559px) { .ca-go { width: 100%; } .ca-opt { padding: 14px; } .ca-opt:has(input:checked) { padding: 13px; } }
.ca-fine { margin: 12px 0 0; font-size: 14px; color: var(--ink-muted); }
.ca-art { display: none; width: 100%; max-width: 460px; height: auto; margin: 40px 0 0 auto; }
@media (min-width: 1000px) { .ca-art { display: block; animation: ca-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; } }
@keyframes ca-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
/* Шестте типа: информативна лента под избора */
.ca-types { display: grid; gap: 24px; align-items: center; padding-top: 40px; border-top: 1px solid var(--border); }
@media (min-width: 1000px) { .ca-types-wrap { grid-column: 1 / -1; } .ca-types { grid-column: 1 / -1; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 64px; margin-top: 16px; } }
.ca-types__art { width: min(240px, 60%); justify-self: center; }
@media (min-width: 1000px) { .ca-types__art { width: 100%; max-width: 300px; } }
.ca-types__h { margin: 0; font-size: clamp(22px, 2.2vw, 28px); font-weight: 720; letter-spacing: -0.015em; }
.ca-types__lead { margin: 8px 0 0; max-width: 60ch; font-size: 16px; line-height: 1.55; color: var(--ink-muted); }
.ca-types__list { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 4px 32px; }
@media (min-width: 640px) { .ca-types__list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.ca-types__list li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 15px; line-height: 1.45; color: var(--ink-muted); }
.ca-types__list b { display: block; color: var(--ink); font-weight: 700; }
.ca-types__code { flex-shrink: 0; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--ink); font-size: 13px; font-weight: 800; color: var(--ink); }
@media (prefers-reduced-motion: reduce) { .ca-art { animation: none; } }
`;

export default CareerAdvisor;
