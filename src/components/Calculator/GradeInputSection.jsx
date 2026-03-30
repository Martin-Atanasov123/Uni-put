// Модул: Входни оценки (секция)
// Описание: Генерира динамични полета за въвеждане на оценки по ключове/слотове
//   и управлява избор на алтернативи (например ДЗИ/Изпит/Диплома) за една и съща група.
// Вход: { coefficients, faculty, specialty, onGradesChange }
//   - coefficients: Record<string, number> картографира ключ → коефициент
//   - faculty/specialty: използват се за ключове в локалното и потребителско съхранение
//   - onGradesChange: callback за родителя с текущи стойности и активни алтернативи
// Изход: визуални полета, синхронизация към родителя, локален кеш и запис в user_metadata
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, CheckCircle2 } from "lucide-react";
import { FIELD_LABELS, SLOT_GROUPS } from "../../lib/coefficients_config";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

const STORAGE_PREFIX = "uniput_grades";

function getStorageKey(faculty, specialty) {
    return `${STORAGE_PREFIX}:${faculty || "all"}:${specialty || "all"}`;
}

function clampAndFormat(value) {
    if (value === "" || value == null) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toFixed(2);
}

function isValidGrade(value) {
    if (value === "" || value == null) return true;
    const n = Number(value);
    return !Number.isNaN(n) && n >= 2 && n <= 6;
}

function rankAltLabel(label) {
    const t = String(label || "");
    if (/^ДЗИ\s/.test(t)) return 0;
    if (/^ДЗИ[¹²]/.test(t)) return 1;
    if (t.startsWith("Изпит")) return 2;
    if (t.startsWith("Диплома:")) return 3;
    return 4;
}

function compareAlternatives(a, b) {
    const ra = rankAltLabel(a.label);
    const rb = rankAltLabel(b.label);
    if (ra !== rb) return ra - rb;
    return a.label.length - b.label.length;
}

/**
 * Генерира слотове (предмети) и техните алтернативи на база coefficients.
 * Причина: UI трябва да знае кои входни полета да покаже и кои ключове
 * принадлежат към един и същи предмет (OR логика).
 * Потенциални ефекти: Ако SLOT_GROUPS е променен, UI се пренарежда.
 */
function buildSlots(coefficients) {
    const keys = Object.keys(coefficients || {});
    const map = {};

    keys.forEach((key) => {
        const label = FIELD_LABELS[key] || key;

        let slotId = key;
        for (const [group, members] of Object.entries(SLOT_GROUPS)) {
            if (members.includes(key)) {
                slotId = group;
                break;
            }
        }

        if (!map[slotId]) {
            map[slotId] = {
                id: slotId,
                alternatives: []
            };
        }

        map[slotId].alternatives.push({
            key,
            label
        });
    });

    return Object.values(map).map((slot) => {
        const alternatives = [...slot.alternatives].sort(compareAlternatives);
        return {
            ...slot,
            label: alternatives[0]?.label || slot.alternatives[0]?.label || slot.id,
            alternatives
        };
    });
}

const GradeInputSection = ({ coefficients = {}, faculty, specialty, onGradesChange }) => {
    const { user } = useAuth();
    const [valuesByKey, setValuesByKey] = useState({});
    const [activeAltBySlot, setActiveAltBySlot] = useState({});
    const [saving, setSaving] = useState(false);

    const slots = useMemo(() => buildSlots(coefficients), [coefficients]);

    // Премахнато първоначално вливане от initialValues, за да се избегне цикъл от ререндери

    useEffect(() => {
        const key = getStorageKey(faculty, specialty);
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.valuesByKey) setValuesByKey(parsed.valuesByKey);
            if (parsed.activeAltBySlot) setActiveAltBySlot(parsed.activeAltBySlot);
        } catch {
            return;
        }
    }, [faculty, specialty]);

    useEffect(() => {
        const key = getStorageKey(faculty, specialty);
        const payload = { valuesByKey, activeAltBySlot };
        try {
            localStorage.setItem(key, JSON.stringify(payload));
        } catch {
            return;
        }
    }, [valuesByKey, activeAltBySlot, faculty, specialty]);

    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const lastSavedRef = useRef("");
    useEffect(() => {
        if (!userRef.current) return;
        const payload = { valuesByKey, activeAltBySlot };
        const payloadKey = `${faculty || "all"}:${specialty || "all"}:${JSON.stringify(payload)}`;
        if (lastSavedRef.current === payloadKey) return;
        lastSavedRef.current = payloadKey;

        const run = async () => {
            setSaving(true);
            try {
                const existing = userRef.current.user_metadata?.grade_inputs || {};
                await supabase.auth.updateUser({
                    data: {
                        grade_inputs: {
                            ...existing,
                            [getStorageKey(faculty, specialty)]: payload
                        }
                    }
                });
            } finally {
                setSaving(false);
            }
        };
        run();
    }, [valuesByKey, activeAltBySlot, faculty, specialty]);

    useEffect(() => {
        if (onGradesChange) {
            onGradesChange(valuesByKey, activeAltBySlot);
        }
    }, [valuesByKey, activeAltBySlot, onGradesChange]);

    const handleChangeGrade = (key, value) => {
        setValuesByKey((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleBlurGrade = (key) => {
        setValuesByKey((prev) => ({
            ...prev,
            [key]: clampAndFormat(prev[key])
        }));
    };

    /**
     * Смяна на активна алтернатива за даден слот – определя кое поле взима участие
     * в сметката. Записва избора локално и синхронизира чрез onGradesChange към родителя.
     */
    const handleChangeActiveAlt = (slotId, altKey) => {
        setActiveAltBySlot((prev) => ({
            ...prev,
            [slotId]: altKey
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Входни данни
                </h3>
                {saving && (
                    <span className="text-xs opacity-60">Записване...</span>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => {
                    const activeKey =
                        activeAltBySlot[slot.id] ||
                        slot.alternatives[0]?.key;

                    const activeAlt =
                        slot.alternatives.find((a) => a.key === activeKey) ||
                        slot.alternatives[0];

                    const value = valuesByKey[activeAlt.key] ?? "";
                    const invalid = !isValidGrade(value);

                    return (
                        <div
                            key={slot.id}
                            className="rounded-[2rem] bg-base-200/80 border border-base-300/60 p-5 flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-xs font-bold uppercase opacity-60">
                                        {activeAlt?.label || slot.label}
                                    </div>
                                    <div className="text-[11px] opacity-60">
                                        Активна алтернатива: {activeAlt?.label}
                                    </div>
                                </div>
                                <div className="dropdown dropdown-end">
                                    <label
                                        tabIndex={0}
                                        className="btn btn-xs btn-primary rounded-full gap-1"
                                    >
                                        <ArrowUpDown size={12} />
                                        Смени
                                    </label>
                                    <ul
                                        tabIndex={0}
                                        className="dropdown-content z-20 menu p-2 shadow bg-base-100 rounded-2xl w-56"
                                    >
                                        {slot.alternatives.map((alt) => (
                                            <li key={alt.key}>
                                                <button
                                                    type="button"
                                                    className={activeKey === alt.key ? "active font-bold" : ""}
                                                    onClick={() =>
                                                        handleChangeActiveAlt(slot.id, alt.key)
                                                    }
                                                >
                                                    {alt.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    className={`input input-bordered w-full rounded-2xl text-lg font-bold ${
                                        invalid ? "input-error" : ""
                                    }`}
                                    placeholder="0.00"
                                    value={value}
                                    onChange={(e) =>
                                        handleChangeGrade(activeAlt.key, e.target.value)
                                    }
                                    onBlur={() => handleBlurGrade(activeAlt.key)}
                                />
                                {invalid && (
                                    <div className="text-xs text-error">
                                        Моля въведете валидна оценка (2.00 - 6.00)
                                    </div>
                                )}
                                <div className="text-[11px] opacity-60 flex justify-between">
                                    <span>
                                        Най-добра оценка:{" "}
                                        {!Number.isNaN(parseFloat(value)) &&
                                        parseFloat(value) >= 2 &&
                                        parseFloat(value) <= 6
                                            ? Number(value).toFixed(2)
                                            : "липсва вход"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GradeInputSection;
