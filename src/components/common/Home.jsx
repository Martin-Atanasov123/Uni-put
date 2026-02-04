import { Link } from "react-router-dom";
import { 
    Calculator, 
    Search, 
    BrainCircuit, 
    Building2, 
    ArrowRight, 
    CheckCircle2, 
    Users, 
    Trophy,
    Calendar,
    Clock,
    TrendingUp,
    Sparkles,
    GraduationCap,
    MapPin,
    BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";

// --- КОМПОНЕНТ: БРОЯЧ НА СТАТИСТИКИ ---
const StatCounter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count}</span>;
};

export default function Home() {
    return (
        <div className="min-h-screen bg-base-100 font-sans selection:bg-primary selection:text-white">
            
            {/* --- ГЛАВНА СЕКЦИЯ (HERO) --- */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Фонови елементи */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                
                <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/80 border border-base-300 text-xs font-bold text-primary uppercase tracking-wider shadow-sm hover:scale-105 transition-transform cursor-default">
                        <Sparkles size={14} />
                        Изцяло обновена платформа 2025
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black text-base-content leading-tight tracking-tight">
                        Твоят път към <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x bg-300%">
                            Университета
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-base-content/60 max-w-3xl mx-auto font-medium leading-relaxed">
                        Забрави за сложните таблици и неясните критерии. 
                        <br className="hidden md:block" />
                        Ние използваме <span className="text-base-content font-bold decoration-wavy  decoration-primary/30">реални данни</span>, за да ти покажем къде имаш шанс.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 pt-6">
                        <Link to="/calculator" className="btn btn-primary btn-lg h-16 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 hover:shadow-2xl transition-all text-lg font-black">
                            <Calculator className="mr-2" />
                            Сметни си бала
                        </Link>
                        <Link to="/universities" className="btn btn-outline btn-lg h-16 px-8 rounded-2xl border-2 hover:bg-base-content hover:text-base-100 hover:border-base-content transition-all text-lg font-bold">
                            <Search className="mr-2" />
                            Търси Специалност
                        </Link>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-base-200/50">
                        {[
                            { label: "Университета", value: 51, icon: Building2 },
                            { label: "Специалности", value: 400, icon: BookOpen },
                            { label: "Потребители", value: 12500, icon: Users },
                            { label: "Точност", value: 99, suffix: "%", icon: Trophy },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 group cursor-default">
                                <div className="text-3xl font-black text-base-content group-hover:text-primary transition-colors flex items-center gap-1">
                                    <StatCounter end={stat.value} />
                                    {stat.suffix}
                                </div>
                                <div className="text-xs uppercase font-bold text-base-content/40 flex items-center gap-1">
                                    <stat.icon size={12} />
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- ИНТЕРАКТИВЕН ПЪТ (TIMELINE) --- */}
            <section className="py-20 bg-base-200/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black">Как работи?</h2>
                        <p className="text-lg opacity-60">Твоят път от училище до студентската скамейка в 4 стъпки</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 -z-10 rounded-full"></div>

                        {[
                            { 
                                step: "1", 
                                title: "Въведи Оценки", 
                                desc: "Използвай нашия калкулатор за да въведеш оценките от дипломата и изпитите.", 
                                icon: Calculator,
                                color: "text-primary",
                                bg: "bg-primary/10"
                            },
                            { 
                                step: "2", 
                                title: "Виж Класиране", 
                                desc: "Алгоритъмът ни веднага ще ти покаже къде балът ти е достатъчен.", 
                                icon: TrendingUp,
                                color: "text-secondary",
                                bg: "bg-secondary/10"
                            },
                            { 
                                step: "3", 
                                title: "Избери Специалност", 
                                desc: "Разгледай детайли за учебните програми и реализацията.", 
                                icon: Search,
                                color: "text-accent",
                                bg: "bg-accent/10"
                            },
                            { 
                                step: "4", 
                                title: "Кандидатствай", 
                                desc: "Вече знаеш къде имаш реален шанс. Действай смело!", 
                                icon: CheckCircle2,
                                color: "text-success",
                                bg: "bg-success/10"
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative group">
                                <div className={`w-24 h-24 mx-auto ${item.bg} rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={40} className={item.color} />
                                </div>
                                <div className="text-center space-y-2 px-4">
                                    <div className="text-xs font-black opacity-30">СТЪПКА {item.step}</div>
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="text-sm opacity-60 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- РЕШЕТКА С ИНСТРУМЕНТИ --- */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-black">Инструменти</h2>
                    <Link to="/tools" className="btn btn-ghost btn-sm">Всички инструменти <ArrowRight size={16} /></Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[minmax(250px,auto)]">
                    
                    {/* Калкулатор */}
                    <Link to="/calculator" className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-base-100 to-base-200 border border-base-300 p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Calculator size={180} />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                                    <Calculator size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Бал Калкулатор</h3>
                                    <p className="text-sm opacity-60 line-clamp-2">
                                        Най-точният инструмент. Сравни бала си с миналогодишните приеми.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-bold text-sm mt-6">
                                Стартирай <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Кариерен Съветник */}
                    <Link to="/career-advisor" className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1">
                        <BrainCircuit className="absolute -bottom-4 -right-4 w-32 h-32 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <BrainCircuit size={28} />
                                </div>
                                <div>
                                    <div className="badge badge-warning text-xs font-bold mb-2">Изпробвай сега</div>
                                    <h3 className="text-2xl font-bold mb-1">Кариерен Съветник</h3>
                                    <p className="text-sm opacity-80 line-clamp-2">
                                        Не знаеш какво да учиш? Направи теста и разбери силните си страни.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-sm mt-6">
                                Направи Тест <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Търсачка за университети (NEW) */}
                    <Link to="/universities" className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-8 transition-all hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
                        <Search className="absolute -bottom-4 -right-4 w-32 h-32 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Search size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Търсачка</h3>
                                    <p className="text-sm opacity-80 line-clamp-2">
                                        Намери перфектния университет по специалност и град.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-sm mt-6">
                                Търси <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Общежития */}
                    <Link to="/dormitories" className="group relative overflow-hidden rounded-[2.5rem] bg-emerald-500 text-white p-8 transition-all hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1">
                        <Building2 className="absolute top-1/2 -translate-y-1/2 right-4 w-24 h-24 opacity-20 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Building2 size={28} />
                                </div>
                                <div>
                                    <div className="badge badge-success text-white border-none bg-emerald-600 text-xs font-bold mb-2">НОВО</div>
                                    <h3 className="text-2xl font-bold mb-1">Общежития</h3>
                                    <p className="text-sm opacity-80">
                                        Информация за цени ,условия и още.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-sm mt-6">
                                Разгледай <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            </section>


        </div>
    );
}

