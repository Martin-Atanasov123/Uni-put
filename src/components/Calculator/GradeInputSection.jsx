import { useState, useEffect } from "react";
import { Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { FIELD_LABELS } from "../../lib/coefficients_config";

// Mandatory fields config
const MANDATORY_FIELDS = [
    { key: "dzi_bel", label: FIELD_LABELS["dzi_bel"] || "ДЗИ БЕЛ", step: 0.01 },
    { key: "diploma", label: FIELD_LABELS["diploma"] || "Среден успех от дипломата", step: 0.01 }
];

// Available subjects for dynamic addition
// Filtering common subjects from the large config to avoid clutter
const AVAILABLE_SUBJECT_KEYS = [
    "dzi_mat", "dzi_bio", "dzi_him", "dzi_fiz", 
    "dzi_ist", "dzi_geo", "dzi_fil", "dzi_angliiski",
    "dzi_informatika", "dzi_it"
];

const AVAILABLE_SUBJECTS = AVAILABLE_SUBJECT_KEYS.map(key => ({
    key,
    label: FIELD_LABELS[key] || key
})).filter(s => s.label);

const GradeInputSection = ({ onGradesChange }) => {
    // Initialize with mandatory fields
    const [dynamicFields, setDynamicFields] = useState([]);
    const [values, setValues] = useState({
        dzi_bel: "",
        diploma: ""
    });
    const [isAdding, setIsAdding] = useState(false);
    const [touched, setTouched] = useState({});

    // Notify parent whenever values change
    useEffect(() => {
        const isValid = validateAll();
        onGradesChange(values, isValid);
    }, [values]);

    const validateValue = (val, min = 2, max = 6) => {
        if (!val) return false;
        const num = parseFloat(val);
        return !isNaN(num) && num >= min && num <= max;
    };

    const validateAll = () => {
        // Check mandatory fields
        const mandatoryValid = MANDATORY_FIELDS.every(field => 
            validateValue(values[field.key])
        );
        // Check dynamic fields
        const dynamicValid = dynamicFields.every(field => 
            validateValue(values[field.key])
        );
        return mandatoryValid && dynamicValid;
    };

    const handleChange = (key, value) => {
        setValues(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
    };

    const addSubject = (subjectKey) => {
        if (dynamicFields.length >= 5) return;
        
        const subject = AVAILABLE_SUBJECTS.find(s => s.key === subjectKey);
        if (subject && !dynamicFields.find(f => f.key === subjectKey)) {
            setDynamicFields(prev => [...prev, { ...subject, id: subjectKey }]);
            setValues(prev => ({ ...prev, [subjectKey]: "" }));
        }
        setIsAdding(false);
    };

    const removeSubject = (key) => {
        setDynamicFields(prev => prev.filter(f => f.key !== key));
        setValues(prev => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    };

    const getAvailableOptions = () => {
        return AVAILABLE_SUBJECTS.filter(s => 
            !dynamicFields.find(f => f.key === s.key)
        );
    };

    return (
        <div className="w-full max-w-[600px] min-w-[320px] mx-auto space-y-6">
            <h3 className="text-xl font-black uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Твоите Оценки
            </h3>

            {/* Mandatory Fields */}
            <div className="space-y-4">
                {MANDATORY_FIELDS.map(field => {
                    const isError = touched[field.key] && !validateValue(values[field.key]);
                    return (
                        <div key={field.key} className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-bold text-base-content/70">
                                    {field.label}
                                    <span className="text-error ml-1">*</span>
                                </span>
                            </label>
                            <input
                                type="number"
                                step={field.step}
                                placeholder="0.00"
                                className={`input input-bordered w-full font-bold text-lg ${
                                    isError ? 'input-error' : 'input-primary'
                                }`}
                                value={values[field.key] || ""}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                            />
                            {isError && (
                                <label className="label">
                                    <span className="label-text-alt text-error flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Моля въведете валидна оценка (2.00 - 6.00)
                                    </span>
                                </label>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-4">
                {dynamicFields.map(field => {
                    const isError = touched[field.key] && !validateValue(values[field.key]);
                    return (
                        <div key={field.key} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold text-base-content/70">{field.label}</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={`input input-bordered w-full font-bold text-lg ${
                                        isError ? 'input-error' : 'input-primary'
                                    }`}
                                    value={values[field.key] || ""}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn btn-square btn-ghost text-error mt-9"
                                onClick={() => removeSubject(field.key)}
                                title="Премахни"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Button */}
            <div className="pt-2">
                {isAdding ? (
                    <div className="join w-full animate-in zoom-in duration-200">
                        <select 
                            className="select select-bordered join-item w-full"
                            onChange={(e) => {
                                if (e.target.value) addSubject(e.target.value);
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Избери предмет...</option>
                            {getAvailableOptions().map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                        </select>
                        <button 
                            className="btn join-item"
                            onClick={() => setIsAdding(false)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button 
                        className="btn btn-outline btn-primary w-full border-dashed border-2 hover:bg-primary/5 gap-2"
                        onClick={() => setIsAdding(true)}
                        disabled={dynamicFields.length >= 5}
                    >
                        <Plus className="w-5 h-5" />
                        {dynamicFields.length >= 5 ? 'Достигнат лимит (5)' : 'Добави Предмет'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default GradeInputSection;