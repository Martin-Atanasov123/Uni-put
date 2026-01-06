import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Calculator as CalcIcon, GraduationCap, School, CheckCircle2, XCircle, Info } from "lucide-react";

const Calculator = () => {
    const [dbData, setDbData] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("");
    const [userGrades, setUserGrades] = useState({
        //тука се пишат всички оценки които се взимат : трябва да съвпадат с имената в базата

        dzi_mat: 0,
        mat:0,
        dzi_inf: 0,

        dzi_math: 0,
        dzi_bel: 0,
        dzi_it: 0,
        diploma_math: 0,
        diploma_it: 0,
        diploma_physics: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.from("university_admissions").select("*");
            if (data) {
                setDbData(data);
                const uniqueFaculties = [...new Set(data.map((item) => item.faculty))];
                setFaculties(uniqueFaculties);
            }
            if (error) console.error("Error fetching data:", error);
        };
        fetchData();
    }, []);

    const calculateBall = (coefficients) => {
        let total = 0;
        Object.keys(coefficients).forEach((key) => {
            const grade = parseFloat(userGrades[key]) || 0;
            total += grade * coefficients[key];
        });
        return total.toFixed(2);
    };

    const uniqueSpecialties = [...new Set(dbData
        .filter((item) => item.faculty === selectedFaculty)
        .map((item) => item.specialty))];

    const finalResults = dbData.filter(
        (item) => item.faculty === selectedFaculty && item.specialty === selectedSpecialty
    );

    return (
        <div className="max-w-4xl mx-auto p-4 pt-24 pb-12 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-block p-3 bg-primary/10 rounded-2xl mb-4">
                    <CalcIcon className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-black tracking-tight">Калкулатор за Прием</h1>
                <p className="text-base-content/60 mt-2 text-lg">Изчисли своя бал и виж шансовете си за успех</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ЛЯВА КОЛОНА: ОЦЕНКИ */}
                <div className="md:col-span-2 space-y-6">
                    <div className="card bg-base-100 shadow-xl border border-base-content/5">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4 flex gap-2">
                                <Info className="text-primary" /> 1. Въведи своите оценки
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(userGrades).map((key) => (
                                    <div key={key} className="form-control w-full">
                                        <label className="label">
                                            <span className="label-text font-bold uppercase text-xs opacity-70">
                                                {key.replace("_", " ")}
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="2"
                                            max="6"
                                            className="input input-bordered focus:input-primary transition-all font-mono"
                                            placeholder="2.00 - 6.00"
                                            onChange={(e) => setUserGrades({ ...userGrades, [key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* СЕЛЕКТИ */}
                    <div className="card bg-primary text-primary-content shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-2 flex gap-2">
                                <School /> 2. Избери дестинация
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <select
                                    className="select select-bordered w-full text-base-content"
                                    onChange={(e) => { setSelectedFaculty(e.target.value); setSelectedSpecialty(""); }}
                                    value={selectedFaculty}
                                >
                                    <option value="">Избери Факултет</option>
                                    {faculties.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>

                                <select
                                    className="select select-bordered w-full text-base-content"
                                    disabled={!selectedFaculty}
                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                    value={selectedSpecialty}
                                >
                                    <option value="">Избери Специалност</option>
                                    {uniqueSpecialties.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ДЯСНА КОЛОНА: РЕЗУЛТАТИ */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-bold mb-4 px-2">Резултати</h2>
                    <div className="space-y-4">
                        {finalResults.length > 0 ? (
                            finalResults.map((res) => {
                                const myBall = calculateBall(res.coefficients);
                                const isAccepted = myBall >= res.min_ball_2024;

                                return (
                                    <div key={res.id} className={`card w-full shadow-lg border-l-8 ${isAccepted ? 'border-success bg-success/5' : 'border-error bg-error/5'}`}>
                                        <div className="card-body p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="badge badge-outline text-xs uppercase font-bold">{res.city}</div>
                                                {isAccepted ? 
                                                    <CheckCircle2 className="text-success w-6 h-6" /> : 
                                                    <XCircle className="text-error w-6 h-6" />
                                                }
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">{res.university_name}</h3>
                                            
                                            <div className="divider my-2 opacity-10"></div>
                                            
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs opacity-60">Твоят бал</p>
                                                    <p className="text-3xl font-black text-primary">{myBall}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs opacity-60 italic">Мин. 2024</p>
                                                    <p className="font-bold">{res.min_ball_2024}</p>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-xs bg-base-100/50 p-2 rounded italic opacity-70 border border-base-content/5">
                                                {res.formula_description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="alert bg-base-200 border-none shadow-inner italic text-sm">
                                <GraduationCap className="w-5 h-5 opacity-50" />
                                <span>Избери специалност, за да изчислим класирането.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
