// Компонент: Общежития
// Описание: Визуализира общежития по университет с филтър и „калкулатор" на първоначални разходи.
// Вход: данни от API (getAllDormitories); потребителски избор на университет.
// Изход: карти с данни, конвертирани цени (EUR), обобщение на първи месец.
import React, { useState, useEffect } from 'react';
import { getAllDormitories } from '@/lib/api';
import {
    Building2,
    MapPin,
    Bus,
    Bath,
    Hammer,
    Star,
    Calculator,
    School,
    Search,
    Clock,
    Route,
    CalendarDays,
    ExternalLink
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
                {/* Header */}
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

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="skeleton h-64 w-full rounded-2xl"></div>
                                <div className="skeleton h-4 w-28"></div>
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
    const BGN_TO_EUR = 1.95583;
    const toEur = (bgn) => Math.round(bgn / BGN_TO_EUR);

    const rent = dorm.monthly_rent_avg || 0;
    const deposit = dorm.deposit_amount || 0;
    const utility = 40;
    const hasFinancialData = rent > 0;

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-200 group">
            <div className="card-body p-6 flex flex-col gap-0">

                {/* ── 1. ЗАГЛАВИЕ ── */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="badge badge-ghost text-xs font-bold mb-1 opacity-60 flex items-center gap-1 w-fit">
                            <School size={10} /> {dorm.university_id}
                        </div>
                        <h2 className="card-title text-xl font-black group-hover:text-primary transition-colors truncate">
                            {dorm.block_number}
                        </h2>
                        <div className="flex items-center gap-1 text-sm opacity-60 mt-0.5">
                            <MapPin size={13} /> {dorm.city}
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-2">
                        <div className="flex gap-0.5 text-warning">
                            {[...Array(5)].map((_, i) => {
                                const full = Math.floor(dorm.condition_rating);
                                const half = (dorm.condition_rating - full) > 0;
                                if (i < full) {
                                    return <Star key={i} size={13} fill="currentColor" />;
                                }
                                if (i === full && half) {
                                    return (
                                        <span key={i} className="relative inline-block" style={{ width: 13, height: 13 }}>
                                            <Star size={13} fill="none" className="opacity-30" />
                                            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                                <Star size={13} fill="currentColor" />
                                            </span>
                                        </span>
                                    );
                                }
                                return <Star key={i} size={13} fill="none" className="opacity-30" />;
                            })}
                        </div>
                        <span className="text-xs font-bold opacity-40 mt-0.5">{dorm.condition_rating}/5</span>
                    </div>
                </div>

                {/* ── 2. ХАРАКТЕРИСТИКИ ── */}
                <div className="flex flex-wrap gap-2 mb-3">
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

                <div className="divider my-0"></div>

                {/* ── 3. РАЗСТОЯНИЕ И ПЪТУВАНЕ ── */}
                <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-base-200 rounded-xl p-3 flex flex-col items-center text-center">
                        <Route size={16} className="text-primary mb-1" />
                        <span className="font-black text-lg leading-none">
                            {dorm.distance_to_uni_km != null ? `${dorm.distance_to_uni_km} км` : '—'}
                        </span>
                        <span className="text-xs opacity-50 mt-0.5">до университета</span>
                    </div>
                    <div className="bg-base-200 rounded-xl p-3 flex flex-col items-center text-center">
                        <Clock size={16} className="text-secondary mb-1" />
                        <span className="font-black text-lg leading-none">
                            {dorm.commute_minutes != null ? `${dorm.commute_minutes} мин` : '—'}
                        </span>
                        <span className="text-xs opacity-50 mt-0.5">пътуване</span>
                    </div>
                </div>

                {/* ── 4. ТРАНСПОРТ ── */}
                <div className="mb-3">
                    <span className="text-xs font-bold uppercase opacity-40 flex items-center gap-1 mb-1.5">
                        <Bus size={12} /> Транспорт
                    </span>
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

                {/* ── 5. КАНДИДАТСТВАНЕ ── */}
                {dorm.application_period ? (
                    <div className="flex items-center gap-2 text-sm mb-3 bg-warning/10 border border-warning/20 rounded-xl px-3 py-2">
                        <CalendarDays size={14} className="text-warning shrink-0" />
                        <div>
                            <span className="text-xs font-bold uppercase opacity-50 block leading-none mb-0.5">Кандидатстване</span>
                            <span className="font-semibold text-sm">{dorm.application_period}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm mb-3 opacity-40 px-1">
                        <CalendarDays size={14} />
                        <span className="text-xs italic">Периодът за кандидатстване не е посочен</span>
                    </div>
                )}

                <div className="divider my-0"></div>

                {/* ── 6. КАЛКУЛАТОР ── */}
                <div className="bg-base-200/50 rounded-xl p-4 mt-2">
                    <h4 className="text-xs font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                        <Calculator size={14} /> Калкулатор "Оцеляване"
                    </h4>
                    {hasFinancialData ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between opacity-70">
                                <span>Наем / месец</span>
                                <span className="font-mono font-bold">{toEur(rent)} €</span>
                            </div>
                            {deposit > 0 && (
                                <div className="flex justify-between opacity-70">
                                    <span>Депозит (еднократно)</span>
                                    <span className="font-mono">{toEur(deposit)} €</span>
                                </div>
                            )}
                            <div className="flex justify-between opacity-70">
                                <span>Сметки (прибл.)</span>
                                <span className="font-mono">{toEur(utility)} €</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm opacity-40 italic text-center py-1">Цените не са посочени</p>
                    )}
                </div>

                {/* ── 7. GOOGLE MAPS БУТОН ── */}
                {dorm.google_maps_url && (
                    <a
                        href={dorm.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm mt-3 gap-2 w-full"
                    >
                        <MapPin size={14} />
                        Виж на картата
                        <ExternalLink size={12} className="opacity-60" />
                    </a>
                )}
            </div>
        </div>
    );
};

export default Dormitories;
