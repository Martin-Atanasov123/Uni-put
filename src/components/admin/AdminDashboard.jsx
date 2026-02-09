import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Database, PlusCircle, CheckCircle, AlertCircle, LayoutDashboard } from "lucide-react";

const AdminDashboard = () => {
    const [status, setStatus] = useState({ type: null, msg: "" });
    const [formData, setFormData] = useState({
        specialty: "", university_name: "", city: "", 
        formula_description: "", min_ball_2024: "", faculty: "", coefficients: ""
    });

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', msg: "Записване в базата..." });

        try {
            // Конвертираме текстовия JSON в истински обект
            const parsedCoefficients = JSON.parse(formData.coefficients);
            
            const { error } = await supabase
                .from('universities')
                .insert([{ 
                    ...formData, 
                    min_ball_2024: parseFloat(formData.min_ball_2024),
                    coefficients: parsedCoefficients
                }]);

            if (error) throw error;
            
            setStatus({ type: 'success', msg: "Успех! Данните са вписани. 🚀" });
            setFormData({ specialty: "", university_name: "", city: "", formula_description: "", min_ball_2024: "", faculty: "", coefficients: "" });
        } catch (err) {
            setStatus({ type: 'error', msg: "Грешка: " + err.message });
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-12 px-6 bg-base-100">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center gap-6">
                    <div className="bg-primary p-5 rounded-[2.5rem] text-primary-content shadow-2xl rotate-3">
                        <LayoutDashboard size={40} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter italic">Admin <span className="text-primary">Hub</span></h1>
                        <div className="badge badge-outline font-black opacity-50 italic">System Management v1.0</div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-base-200 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white/5 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { id: 'city', label: 'Град на Университета', placeholder: 'София' },
                            { id: 'university_name', label: 'Университет', placeholder: 'Софийски университет' },
                            { id: 'faculty', label: 'Факултет', placeholder: 'ФМИ' },
                            { id: 'specialty', label: 'Специалност', placeholder: 'Софтуерно инженерство' },
                            { id: 'formula_description', label: 'Формула (Текст)', placeholder: '3*Изпит + Диплома' },
                            { id: 'min_ball_2024', label: 'Мин. Бал', placeholder: '24.00', type: 'number' }
                        ].map(field => (
                            <div key={field.id} className="form-control w-full">
                                <label className="label font-black text-[11px] uppercase tracking-widest opacity-40">{field.label}</label>
                                <input 
                                    required 
                                    step="0.01"
                                    type={field.type || 'text'}
                                    className="input bg-base-100 border-none rounded-2xl font-bold h-14 focus:ring-2 ring-primary/20 transition-all"
                                    placeholder={field.placeholder}
                                    value={formData[field.id]} 
                                    onChange={e => setFormData({...formData, [field.id]: e.target.value})} 
                                />
                            </div>
                        ))}
                    </div>

                    <div className="form-control w-full">
                        <label className="label font-black text-[11px] uppercase tracking-widest opacity-60 italic text-primary">Коефициенти (JSON - формат)</label>
                        <textarea 
                            required 
                            className="textarea bg-base-100 border-none rounded-3xl font-mono text-sm h-32 p-6 focus:ring-2 ring-primary/20"
                            placeholder='{"exam_mat": 3, "mat": 1, "exam_diploma": 2, "diploma": 1
                            }'
                            value={formData.coefficients} 
                            onChange={e => setFormData({...formData, coefficients: e.target.value})} 
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full h-20 rounded-[2.5rem] font-black italic text-xl shadow-2xl shadow-primary/30 group transition-all">
                        <PlusCircle className="group-hover:rotate-90 transition-transform" /> 
                        Вмъкни Нови Данни
                    </button>

                    {status.msg && (
                        <div className={`p-6 rounded-[2rem] flex items-center gap-4 font-black italic animate-in fade-in slide-in-from-bottom-2 ${status.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {status.type === 'success' ? <CheckCircle /> : <AlertCircle />}
                            {status.msg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;

