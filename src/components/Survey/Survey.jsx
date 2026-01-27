import React, { useState } from "react";

const Survey = () => {
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    // Състояние за отговорите
    const [formData, setFormData] = useState({
        grade: "",
        profile: "",
    });

    const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const progress = (step / totalSteps) * 100;

    return (
        <div className="max-w-2xl mx-auto p-6 mt-10 bg-base-100 rounded-3xl shadow-2xl border border-base-200">
            {/* Заглавие */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Намери своята специалност
                </h1>
                <p className="text-base-content/60">
                    Открий кои специалности са най-подходящи за теб
                </p>
            </div>

            {/* Прогрес Бар */}
            <div className="mb-8">
                <div className="flex justify-between text-sm mb-2 font-bold">
                    <span>
                        Стъпка {step} от {totalSteps}
                    </span>
                    <span>{progress}%</span>
                </div>
                <progress
                    className="progress progress-primary w-full h-3"
                    value={progress}
                    max="100"
                ></progress>
            </div>

            {/* Съдържание на стъпките */}
            <div className="min-h-[300px]">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="badge badge-primary">1</span>{" "}
                            Основна информация
                        </h2>

                        <div className="form-control">
                            <label className="label font-semibold text-sm">
                                В кой клас си?
                            </label>
                            <select
                                className="select select-bordered w-full rounded-2xl"
                                value={formData.grade}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        grade: e.target.value,
                                    })
                                }
                            >
                                <option disabled value="">
                                    Избери клас
                                </option>
                                <option>10 клас</option>
                                <option>11 клас</option>
                                <option>12 клас</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label font-semibold text-sm">
                                Какъв профил имаш/искаш?
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    "Природо-математически",
                                    "Хуманитарен",
                                    "Професионална гимназия",
                                    "Все още не знам",
                                ].map((profile) => (
                                    <button
                                        key={profile}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                profile: profile,
                                            })
                                        }
                                        className={`btn btn-outline justify-start rounded-2xl h-auto py-4 ${formData.profile === profile ? "btn-active btn-primary" : ""}`}
                                    >
                                        {profile}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Тук ще добавиш step 2, 3, 4 и 5 по същия начин */}
            </div>

            {/* Навигация */}
            <div className="flex justify-between mt-10 pt-6 border-t border-base-200">
                <button
                    className="btn btn-ghost rounded-2xl px-8"
                    onClick={prevStep}
                    disabled={step === 1}
                >
                    Назад
                </button>
                <button
                    className="btn btn-primary rounded-2xl px-12 font-bold"
                    onClick={nextStep}
                    disabled={
                        !formData.grade || (!formData.profile && step === 1)
                    }
                >
                    {step === totalSteps ? "Завърши" : "Напред"}
                </button>
            </div>
        </div>
    );
};

export default Survey;
