import React, { useState, useEffect } from 'react';
import { getAllDormitories } from '../../lib/api';
import { 
    Building2, 
    MapPin, 
    Banknote, 
    Bus, 
    Bath, 
    Hammer, 
    Star, 
    Calculator,
    School,
    Info,
    Search
} from 'lucide-react';

const Dormitories = () => {
    const [dormitories, setDormitories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUniversity, setSelectedUniversity] = useState('');
    const [universities, setUniversities] = useState([]);

    useEffect(() => {
        fetchDormitories();
    }, []);

    const fetchDormitories = async () => {
        setLoading(true);
        const data = await getAllDormitories();
        setDormitories(data);
        
        // Extract unique universities
        const uniqueUnis = [...new Set(data.map(d => d.university_id))].filter(Boolean).sort();
        setUniversities(uniqueUnis);
        
        setLoading(false);
    };

    const filteredDorms = selectedUniversity
        ? dormitories.filter(d => d.university_id === selectedUniversity)
        : dormitories;

    return (
        <div className="min-h-screen bg-base-200 px-4 md:px-8 pt-28 pb-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-4 border-b border-base-300">
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3">
                            <Building2 className="text-primary w-10 h-10" />
                            Общежития
                        </h1>
                        <p className="opacity-60 mt-2 text-lg">
                            Намери най-доброто място за студентския си живот
                        </p>
                    </div>

                    {/* Smart Filter */}
                    <div className="form-control w-full md:w-80">
                        <label className="label">
                            <span className="label-text font-bold flex items-center gap-2">
                                <School size={16} /> Избери Университет
                            </span>
                        </label>
                        <select 
                            className="select select-bordered select-primary w-full shadow-sm"
                            value={selectedUniversity}
                            onChange={(e) => setSelectedUniversity(e.target.value)}
                        >
                            <option value="">Всички университети</option>
                            {universities.map(uni => (
                                <option key={uni} value={uni}>{uni}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="skeleton h-64 w-full rounded-2xl"></div>
                                <div className="skeleton h-4 w-28"></div>
                                <div className="skeleton h-4 w-full"></div>
                                <div className="skeleton h-4 w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredDorms.length === 0 ? (
                    <div className="text-center py-20 bg-base-100 rounded-3xl shadow-sm border border-base-200">
                        <Search className="w-16 h-16 mx-auto opacity-20 mb-4" />
                        <h3 className="text-2xl font-bold opacity-60">Няма намерени общежития</h3>
                        <p className="opacity-40">Опитайте да изберете друг университет или проверете по-късно.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDorms.map((dorm) => (
                            <DormCard key={dorm.id} dorm={dorm} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DormCard = ({ dorm }) => {
    // Calculator logic
    const deposit = dorm.deposit_amount || 0;
    const rent = dorm.monthly_rent_avg || 0;
    const utility = 40; // Fixed estimated utility
    const totalFirstMonth = deposit + rent + utility;

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-200 group">
            <div className="card-body p-6">
                {/* Header & Title */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="badge badge-ghost text-xs font-bold mb-2 opacity-60 flex items-center gap-1">
                            <School size={10} /> {dorm.university_id}
                        </div>
                        <h2 className="card-title text-xl font-black group-hover:text-primary transition-colors">
                            Блок {dorm.block_number}
                        </h2>
                        <div className="flex items-center gap-1 text-sm opacity-60 mt-1">
                            <MapPin size={14} /> {dorm.city}
                        </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex flex-col items-end">
                        <div className="flex gap-0.5 text-warning">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={14} 
                                    fill={i < Math.round(dorm.condition_rating) ? "currentColor" : "none"} 
                                    className={i < Math.round(dorm.condition_rating) ? "" : "opacity-30"}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold opacity-40 mt-1">{dorm.condition_rating}/5</span>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 my-3">
                    {dorm.is_renovated && (
                        <div className="badge badge-success gap-1 text-white font-bold text-xs py-3">
                            <Hammer size={12} /> Реновиран
                        </div>
                    )}
                    {dorm.has_private_bathroom && (
                        <div className="badge badge-info gap-1 text-white font-bold text-xs py-3">
                            <Bath size={12} /> Собствена баня
                        </div>
                    )}
                </div>

                <div className="divider my-1"></div>

                {/* Transport */}
                <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase opacity-40 mb-2 flex items-center gap-1">
                        <Bus size={12} /> Транспорт
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {dorm.transport_lines && dorm.transport_lines.length > 0 ? (
                            dorm.transport_lines.map((line, idx) => (
                                <span key={idx} className="badge badge-outline badge-sm font-mono font-bold">
                                    {line}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs opacity-40 italic">Няма информация</span>
                        )}
                    </div>
                </div>

                {/* Survival Calculator Section */}
                <div className="bg-base-200/50 rounded-xl p-4 mt-auto">
                    <h4 className="text-xs font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                        <Calculator size={14} /> Калкулатор "Оцеляване"
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between opacity-70">
                            <span>Наем</span>
                            <span className="font-mono">{rent} лв.</span>
                        </div>
                        <div className="flex justify-between opacity-70">
                            <span>Депозит</span>
                            <span className="font-mono">{deposit} лв.</span>
                        </div>
                        <div className="flex justify-between opacity-70">
                            <span>Сметки (прибл.)</span>
                            <span className="font-mono">{utility} лв.</span>
                        </div>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between font-black text-primary text-lg">
                            <span>Първи месец:</span>
                            <span>{totalFirstMonth} лв.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dormitories;
