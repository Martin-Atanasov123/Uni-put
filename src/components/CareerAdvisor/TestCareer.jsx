import React, { useState, useEffect } from 'react';
import { getCareersByRiasec, getUniversitiesByRiasec, getAllRiasecCodes } from '../../lib/api';

/**
 * Тестова конзола за проверка на RIASEC API интеграцията.
 * Този компонент се използва само за разработка и дебъгване.
 */
const TestCareer = () => {
    const [codes, setCodes] = useState([]);
    const [selectedCode, setSelectedCode] = useState('');
    const [careers, setCareers] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rawQuery, setRawQuery] = useState('');

    useEffect(() => {
        loadCodes();
    }, []);

    // Зареждане на наличните RIASEC кодове от базата данни
    const loadCodes = async () => {
        const c = await getAllRiasecCodes();
        setCodes(c);
        if (c.length > 0) setSelectedCode(c[0]);
    };

    // Изпълнение на търсене по избран код
    const handleSearch = async () => {
        if (!selectedCode) return;
        setLoading(true);
        setRawQuery(`Извличане за код: ${selectedCode}...`);
        
        try {
            const [c, u] = await Promise.all([
                getCareersByRiasec(selectedCode),
                getUniversitiesByRiasec(selectedCode)
            ]);
            
            setCareers(c);
            setUniversities(u);
            setRawQuery(prev => `${prev}\nНамерени ${c.length} професии и ${u.length} университета.`);
        } catch (e) {
            setRawQuery(prev => `${prev}\nГрешка: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">RIASEC Тестова Конзола</h1>
            
            <div className="flex gap-4 items-end bg-base-200 p-6 rounded-xl">
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text font-bold">Избери RIASEC код</span>
                    </label>
                    <select 
                        className="select select-bordered"
                        value={selectedCode}
                        onChange={(e) => setSelectedCode(e.target.value)}
                    >
                        <option value="">Избери код...</option>
                        {codes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={loading || !selectedCode}
                >
                    {loading ? 'Зареждане...' : 'Търси'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Професии */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Професии ({careers.length})</h2>
                    <div className="bg-base-100 border rounded-xl h-96 overflow-y-auto p-4 shadow-inner">
                        <pre className="text-xs">{JSON.stringify(careers, null, 2)}</pre>
                    </div>
                </div>

                {/* Университети */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Университети ({universities.length})</h2>
                    <div className="bg-base-100 border rounded-xl h-96 overflow-y-auto p-4 shadow-inner">
                        <pre className="text-xs">{JSON.stringify(universities, null, 2)}</pre>
                    </div>
                </div>
            </div>

            {/* Лог за дебъгване */}
            <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" /> 
                <div className="collapse-title text-xl font-medium">
                    Лог за дебъгване / Суров изход
                </div>
                <div className="collapse-content"> 
                    <pre className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
                        {rawQuery}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default TestCareer;
