import { useEffect, useMemo, useState } from "react";
import { FIELD_LABELS, SLOT_GROUPS } from "../../lib/coefficients_config";

const SETUP_STORAGE_KEY = "uniput_setup_grades";

const DZI_SLOTS = [
    "bulgarian_group",
    "math_group",
    "biology_group",
    "chemistry_group",
    "physics_group",
    "foreign_languages_group",
    "english_group",
    "history_group",
    "geography_group",
    "philosophy_group",
    "arts_group",
    "asian_languages_group",
    "other_languages_group"
];

const isValidGrade = (value) => {
    if (value === "" || value == null) return true;
    const n = Number(value);
    return !Number.isNaN(n) && n >= 2 && n <= 6;
};

const clampAndFormat = (value) => {
    if (value === "" || value == null) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    const c = Math.min(6, Math.max(2, n));
    return c.toFixed(2);
};

const CalculatorSetup = ({ onComplete }) => {
    const [values, setValues] = useState({});
    const [selectedMaturi, setSelectedMaturi] = useState(() =>
        FIELD_LABELS.dzi_bel ? ["dzi_bel"] : []
    );
    const [selectedDiplomaSubjects, setSelectedDiplomaSubjects] = useState([]);
    const [selectedExams, setSelectedExams] = useState([]);
    const [maturaError, setMaturaError] = useState("");

    const allDziKeys = useMemo(() => {
        const set = new Set();
        DZI_SLOTS.forEach((slotId) => {
            const keys = SLOT_GROUPS[slotId] || [];
            keys.forEach((key) => {
                if (key.startsWith("dzi") && FIELD_LABELS[key]) {
                    set.add(key);
                }
            });
        });
        return Array.from(set);
    }, []);

    const diplomaSubjectKeys = useMemo(
        () =>
            Object.entries(FIELD_LABELS)
                .filter(([key, label]) => label.startsWith("Диплома:") && !key.startsWith("diploma"))
                .map(([key]) => key),
        []
    );

    const examKeys = useMemo(
        () =>
            Object.keys(FIELD_LABELS).filter(
                (key) => key.startsWith("exam_")
            ),
        []
    );

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETUP_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                setValues(parsed);
            }
        } catch {
            return;
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(values));
        } catch {
            return;
        }
    }, [values]);

    useEffect(() => {
        if (!Object.keys(values).length) return;
        setSelectedMaturi((prev) =>
            prev.length
                ? prev
                : Object.keys(values)
                      .filter((key) => key.startsWith("dzi"))
                      .slice(0, 4)
        );
        setSelectedDiplomaSubjects((prev) =>
            prev.length
                ? prev
                : Object.keys(values).filter((key) =>
                      diplomaSubjectKeys.includes(key)
                  )
        );
        setSelectedExams((prev) =>
            prev.length
                ? prev
                : Object.keys(values).filter((key) => examKeys.includes(key))
        );
    }, [values, diplomaSubjectKeys, examKeys]);

    const handleChange = (key, value) => {
        setValues((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleBlur = (key) => {
        setValues((prev) => ({
            ...prev,
            [key]: clampAndFormat(prev[key])
        }));
    };

    const handleAddMatura = (key) => {
        if (!key) return;
        setSelectedMaturi((prev) => {
            if (prev.includes(key) || prev.length >= 4) return prev;
            return [...prev, key];
        });
    };

    const handleRemoveMatura = (key) => {
        setSelectedMaturi((prev) => prev.filter((k) => k !== key));
    };

    const handleAddDiplomaSubject = (key) => {
        if (!key) return;
        setSelectedDiplomaSubjects((prev) => {
            if (prev.includes(key)) return prev;
            return [...prev, key];
        });
    };

    const handleRemoveDiplomaSubject = (key) => {
        setSelectedDiplomaSubjects((prev) => prev.filter((k) => k !== key));
    };

    const handleAddExam = (key) => {
        if (!key) return;
        setSelectedExams((prev) => {
            if (prev.includes(key)) return prev;
            return [...prev, key];
        });
    };

    const handleRemoveExam = (key) => {
        setSelectedExams((prev) => prev.filter((k) => k !== key));
    };

    const handleContinue = () => {
        const belMaturi = selectedMaturi.filter((key) =>
            (FIELD_LABELS[key] || "").includes("БЕЛ")
        );
        const hasValidBel = belMaturi.some((key) => {
            const n = Number(values[key]);
            return !Number.isNaN(n) && n >= 2 && n <= 6;
        });

        if (!hasValidBel) {
            setMaturaError(
                "Моля въведете валидна оценка за поне една матура по БЕЛ (2.00 - 6.00)."
            );
            return;
        }

        setMaturaError("");

        if (onComplete) {
            onComplete(values);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-base-200 p-6 rounded-[2.5rem] shadow-inner space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        Въведи своите оценки
                    </h2>
                    <p className="text-sm opacity-70">
                        Попълни матурите, общия успех от диплома, отделните оценки и изпитите.
                        Можеш да ги редактираш по-късно.
                    </p>
                </div>

                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
                        Матури (задължително поне една по БЕЛ, максимум 4 общо)
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selectedMaturi.map((key) => {
                            const label = FIELD_LABELS[key];
                            const value = values[key] ?? "";
                            const invalid = !isValidGrade(value);
                            return (
                                <div
                                    key={key}
                                    className="p-4 rounded-2xl bg-base-200/60 border border-base-300/70 flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold">
                                            {label}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs rounded-full"
                                            onClick={() => handleRemoveMatura(key)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min="2"
                                        max="6"
                                        step="0.01"
                                        inputMode="decimal"
                                        className={`input input-sm input-bordered rounded-xl ${
                                            invalid ? "input-error" : ""
                                        }`}
                                        placeholder="0.00"
                                        value={value}
                                        onChange={(e) =>
                                            handleChange(key, e.target.value)
                                        }
                                        onBlur={() => handleBlur(key)}
                                    />
                                    {invalid && value !== "" && (
                                        <div className="text-[11px] text-error">
                                            Моля въведете валидна оценка (2.00 - 6.00)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            className="select select-sm select-bordered rounded-xl max-w-xs"
                            disabled={selectedMaturi.length >= 4}
                            defaultValue=""
                            onChange={(e) => {
                                handleAddMatura(e.target.value);
                                e.target.value = "";
                            }}
                        >
                            <option value="">
                                {selectedMaturi.length >= 4
                                    ? "Достигнат лимит от 4 матури"
                                    : "Добави матура"}
                            </option>
                            {allDziKeys
                                .filter((key) => !selectedMaturi.includes(key))
                                .map((key) => (
                                    <option key={key} value={key}>
                                        {FIELD_LABELS[key]}
                                    </option>
                                ))}
                        </select>
                        {maturaError && (
                            <div className="text-xs text-error">{maturaError}</div>
                        )}
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
                        Обща оценка от дипломата
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300/70 flex flex-col gap-2">
                            <div className="text-xs font-semibold">
                                Общ успех от диплома
                            </div>
                            <input
                                type="number"
                                min="2"
                                max="6"
                                step="0.01"
                                inputMode="decimal"
                                className={`input input-sm input-bordered rounded-xl ${
                                    !isValidGrade(values.diploma) ? "input-error" : ""
                                }`}
                                placeholder="0.00"
                                value={values.diploma ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setValues((prev) => ({
                                        ...prev,
                                        diploma: v,
                                        obsht_uspeh: v
                                    }));
                                }}
                                onBlur={() => {
                                    setValues((prev) => {
                                        const formatted = clampAndFormat(
                                            prev.diploma
                                        );
                                        return {
                                            ...prev,
                                            diploma: formatted,
                                            obsht_uspeh: formatted
                                        };
                                    });
                                }}
                            />
                            {!isValidGrade(values.diploma) &&
                                values.diploma !== "" && (
                                    <div className="text-[11px] text-error">
                                        Моля въведете валидна оценка (2.00 - 6.00)
                                    </div>
                                )}
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
                        Оценки от дипломата по предмети (незадължителни)
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selectedDiplomaSubjects.map((key) => {
                            const label = FIELD_LABELS[key];
                            const value = values[key] ?? "";
                            const invalid = !isValidGrade(value);
                            return (
                                <div
                                    key={key}
                                    className="p-4 rounded-2xl bg-base-200/60 border border-base-300/70 flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold">
                                            {label}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs rounded-full"
                                            onClick={() =>
                                                handleRemoveDiplomaSubject(key)
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min="2"
                                        max="6"
                                        step="0.01"
                                        inputMode="decimal"
                                        className={`input input-sm input-bordered rounded-xl ${
                                            invalid ? "input-error" : ""
                                        }`}
                                        placeholder="0.00"
                                        value={value}
                                        onChange={(e) =>
                                            handleChange(key, e.target.value)
                                        }
                                        onBlur={() => handleBlur(key)}
                                    />
                                    {invalid && value !== "" && (
                                        <div className="text-[11px] text-error">
                                            Моля въведете валидна оценка (2.00 - 6.00)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <select
                        className="select select-sm select-bordered rounded-xl max-w-xs"
                        defaultValue=""
                        onChange={(e) => {
                            handleAddDiplomaSubject(e.target.value);
                            e.target.value = "";
                        }}
                    >
                        <option value="">Добави предмет от диплома</option>
                        {diplomaSubjectKeys
                            .filter((key) => !selectedDiplomaSubjects.includes(key))
                            .map((key) => (
                                <option key={key} value={key}>
                                    {FIELD_LABELS[key]}
                                </option>
                            ))}
                    </select>
                </section>

                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
                        Кандидат-студентски изпити (незадължителни)
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selectedExams.map((key) => {
                            const label = FIELD_LABELS[key];
                            const value = values[key] ?? "";
                            const invalid = !isValidGrade(value);
                            return (
                                <div
                                    key={key}
                                    className="p-4 rounded-2xl bg-base-200/60 border border-base-300/70 flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold">
                                            {label}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs rounded-full"
                                            onClick={() => handleRemoveExam(key)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min="2"
                                        max="6"
                                        step="0.01"
                                        inputMode="decimal"
                                        className={`input input-sm input-bordered rounded-xl ${
                                            invalid ? "input-error" : ""
                                        }`}
                                        placeholder="0.00"
                                        value={value}
                                        onChange={(e) =>
                                            handleChange(key, e.target.value)
                                        }
                                        onBlur={() => handleBlur(key)}
                                    />
                                    {invalid && value !== "" && (
                                        <div className="text-[11px] text-error">
                                            Моля въведете валидна оценка (2.00 - 6.00)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <select
                        className="select select-sm select-bordered rounded-xl max-w-xs"
                        defaultValue=""
                        onChange={(e) => {
                            handleAddExam(e.target.value);
                            e.target.value = "";
                        }}
                    >
                        <option value="">Добави кандидат-студентски изпит</option>
                        {examKeys
                            .filter((key) => !selectedExams.includes(key))
                            .map((key) => (
                                <option key={key} value={key}>
                                    {FIELD_LABELS[key]}
                                </option>
                            ))}
                    </select>
                </section>

                <div className="flex justify-end pt-4 border-t border-base-content/5">
                    <button
                        type="button"
                        className="btn btn-primary rounded-2xl px-8"
                        onClick={handleContinue}
                    >
                        Продължи
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalculatorSetup;
