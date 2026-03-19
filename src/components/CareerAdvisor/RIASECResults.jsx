import React, { useState } from 'react';
import { 
    Target, 
    GraduationCap, 
    Briefcase, 
    ChevronRight, 
    RefreshCw, 
    Award,
    TrendingUp,
    MapPin,
    Building2,
    DollarSign,
    BookOpen
} from 'lucide-react';

const RIASECResults = ({ results, onRestart }) => {
    const [viewMode, setViewMode] = useState('all'); // all, specialties, careers
    const [showAllSpecialties, setShowAllSpecialties] = useState(false);
    const [showAllCareers, setShowAllCareers] = useState(false);
    
    const { scores, riasecCode, specialties, careers } = results;

    // Filtered data based on showAll state
    const visibleSpecialties = showAllSpecialties ? specialties : specialties.slice(0, 5);
    const visibleCareers = showAllCareers ? careers : careers.slice(0, 5);

    const riasecLabels = {
        R: { name: 'Реалистичен', desc: 'Предпочиташ практическа работа с инструменти и машини.' },
        I: { name: 'Изследователски', desc: 'Обичаш да решаваш сложни проблеми и да анализираш данни.' },
        A: { name: 'Артистичен', desc: 'Цениш творчеството, изкуството и оригиналността.' },
        S: { name: 'Социален', desc: 'Харесваш да помагаш на хората и да работиш в екип.' },
        E: { name: 'Предприемачески', desc: 'Имаш лидерски умения и обичаш да убеждаваш другите.' },
        C: { name: 'Конвенционален', desc: 'Предпочиташ структурата, детайлите и организацията.' }
    };

    return (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
            {/* 1. RIASEC Profile Section */}
            <div className="text-center space-y-6">
                <div className="inline-block p-4 bg-primary/10 rounded-full text-primary mb-2">
                    <Target size={48} />
                </div>
                <h2 className="text-4xl font-black italic">Твоят RIASEC Профил: <span className="text-primary">{riasecCode}</span></h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {riasecCode.split('').map((char, index) => (
                        <div key={index} className="bg-base-200/50 p-6 rounded-[2rem] border border-base-300 hover:shadow-lg transition-all">
                            <div className="text-2xl font-black text-primary mb-2">{char}</div>
                            <h4 className="font-bold text-lg mb-1">{riasecLabels[char].name}</h4>
                            <p className="text-xs opacity-60 leading-relaxed">{riasecLabels[char].desc}</p>
                        </div>
                    ))}
                </div>

                {/* Score Bars */}
                <div className="max-w-2xl mx-auto space-y-3 mt-10">
                    {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([type, score]) => (
                        <div key={type} className="flex items-center gap-4">
                            <span className="w-8 font-black text-sm">{type}</span>
                            <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>
                            <span className="w-12 text-xs font-bold opacity-50">{score}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. View Toggle */}
            <div className="flex justify-center">
                <div className="bg-base-200 p-1 rounded-2xl flex gap-1">
                    <button 
                        onClick={() => setViewMode('all')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'all' ? 'bg-base-100 text-primary shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                    >
                        Всички
                    </button>
                    <button 
                        onClick={() => setViewMode('specialties')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'specialties' ? 'bg-base-100 text-primary shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                    >
                        Специалности
                    </button>
                    <button 
                        onClick={() => setViewMode('careers')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'careers' ? 'bg-base-100 text-primary shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                    >
                        Професии
                    </button>
                </div>
            </div>

            {/* 3. Specialties Section */}
            {(viewMode === 'all' || viewMode === 'specialties') && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3 italic">
                        <GraduationCap className="text-primary" /> 
                        🎓 Топ специалности за теб
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {visibleSpecialties.length > 0 ? visibleSpecialties.map((spec, index) => (
                            <div key={spec.id} className="bg-base-100 p-6 rounded-[2rem] border border-base-200 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center font-black text-xl text-primary shrink-0">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-xl font-black mb-2">{spec.university_name} — {spec.specialty}</h4>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="badge badge-primary badge-sm font-bold uppercase py-3">{spec.category || 'Университет'}</span>
                                        <span className="badge badge-ghost badge-sm font-bold py-3">{spec.riasec_code}</span>
                                        <span className="text-xs font-bold opacity-50 flex items-center gap-1">
                                            <MapPin size={14} /> {spec.city}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center shrink-0">
                                    <div className="text-3xl font-black text-primary">{spec.compatibility}%</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">съвпадение</div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center bg-base-200/30 rounded-[2.5rem] border border-dashed border-base-300 opacity-50">
                                <p className="font-bold">Няма намерени специалности с над 60% съвпадение.</p>
                            </div>
                        )}
                    </div>
                    {specialties.length > 5 && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setShowAllSpecialties(prev => !prev)}
                                className="btn btn-ghost rounded-xl font-black gap-2"
                            >
                                {showAllSpecialties 
                                    ? 'Скрий останалите' 
                                    : `Покажи останалите ${specialties.length - 5}`}
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* 4. Careers Section */}
            {(viewMode === 'all' || viewMode === 'careers') && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3 italic">
                        <Briefcase className="text-secondary" /> 
                        💼 Топ професии за теб
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visibleCareers.length > 0 ? visibleCareers.map((career, index) => (
                            <div key={career.id} className="bg-base-100 p-8 rounded-[2.5rem] border border-base-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                                
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black">
                                            #{index + 1}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-secondary">{career.compatibility}%</div>
                                            <div className="text-[8px] font-black uppercase tracking-tighter opacity-40">съвпадение</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-xl font-black leading-tight mb-1">{career.name}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">{career.category}</p>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold opacity-70">
                                            <DollarSign size={14} className="text-success" />
                                            <span>{career.salary || 'По договаряне'} лв.</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold opacity-70">
                                            <BookOpen size={14} className="text-info" />
                                            <span>{career.required_education || 'Висше образование'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center relative z-10">
                                    <span className="badge badge-ghost font-bold text-[10px]">{career.riasec_code}</span>
                                    <button className="btn btn-circle btn-ghost btn-sm group-hover:bg-secondary group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 p-12 text-center bg-base-200/30 rounded-[2.5rem] border border-dashed border-base-300 opacity-50">
                                <p className="font-bold">Няма намерени професии за твоя профил.</p>
                            </div>
                        )}
                    </div>
                    {careers.length > 5 && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setShowAllCareers(prev => !prev)}
                                className="btn btn-ghost rounded-xl font-black gap-2"
                            >
                                {showAllCareers 
                                    ? 'Скрий останалите' 
                                    : `Покажи останалите ${careers.length - 5}`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 5. Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-base-200">
                <button 
                    onClick={onRestart}
                    className="btn btn-primary rounded-2xl px-12 font-black gap-2 shadow-xl shadow-primary/20"
                >
                    <RefreshCw size={18} /> Направи отново
                </button>
            </div>
        </div>
    );
};

export default RIASECResults;
