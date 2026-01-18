

import { Link } from "react-router-dom";
import { 
    Calculator, 
    Search, 
    BrainCircuit, 
    Building2, 
    ArrowRight, 
    CheckCircle2, 
    Users, 
    Trophy 
} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-base-100 font-sans selection:bg-primary selection:text-white">
            
            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Фонови елементи (Glow effects) */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 border border-base-300 text-sm font-semibold text-primary uppercase tracking-wider">
                        🚀 Изпробвай сега
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-base-content leading-tight">
                        Твоят път към <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                            Университета на мечтите
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-base-content/60 max-w-3xl mx-auto">
                        Забрави за сложните таблици. Ние използваме данни и алгоритми, за да ти покажем къде имаш реален шанс за прием.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <Link to="/calculator" className="btn btn-primary btn-lg rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                            Сметни си бала
                        </Link>
                        <Link to="/register" className="btn btn-ghost btn-lg rounded-2xl hover:bg-base-200">
                            Създай профил
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- BENTO GRID (Основна функционалност) --- */}
            <section className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(280px,auto)]">
                    
                    {/* Карта 1: Калкулатор (Голяма) */}
                    <Link to="/calculator" className="group relative col-span-1 md:col-span-2 row-span-2 overflow-hidden rounded-[2.5rem] bg-base-200 p-8 transition-all hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 border border-base-300">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calculator size={300} />
                        </div>
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                                    <Calculator size={32} />
                                </div>
                                <h3 className="text-4xl font-bold">Бал Калкулатор</h3>
                                <p className="text-lg opacity-70 max-w-sm">
                                    Най-точнитя инструмент в България. Въведи оценките си и виж мигновено класиране за всички специалности.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-bold group-hover:translate-x-2 transition-transform">
                                Стартирай <ArrowRight size={20} />
                            </div>
                        </div>
                    </Link>

                    {/* Карта 2: AI Съветник (Нова) */}
                    <div className="group relative col-span-1 md:col-span-2 lg:col-span-1 row-span-1 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white transition-all hover:shadow-xl hover:scale-[1.02]">
                        <BrainCircuit className="absolute -bottom-4 -right-4 w-32 h-32 opacity-20 rotate-12" />
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-2xl font-bold">AI Съветник</h3>
                            <p className="text-sm opacity-90">Не си сигурен какво да учиш? Попълни анкетата и нашият алгоритъм ще ти препоръча професия.</p>
                        </div>
                        <div className="absolute bottom-6 right-8">
                            <span className="badge badge-accent badge-outline text-white border-white/40">Очаквай скоро</span>
                        </div>
                    </div>

                    {/* Карта 3: Търсачка (Нова визия) */}
                    <Link to="/universities" className="group relative col-span-1 row-span-1 overflow-hidden rounded-[2.5rem] bg-base-100 border-2 border-dashed border-base-300 p-8 transition-all hover:border-secondary hover:bg-secondary/5">
                        <div className="flex flex-col h-full justify-between">
                            <div className="space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                    <Search size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-base-content">Уни Търсачка</h3>
                                <p className="text-sm opacity-60">Филтрирай по град, направление и рейтинг.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Карта 4: Общежития (Нова) */}
                    <div className="group relative col-span-1 md:col-span-2 lg:col-span-1 row-span-1 overflow-hidden rounded-[2.5rem] bg-emerald-500 text-white p-8 transition-all hover:shadow-xl hover:scale-[1.02]">
                        <Building2 className="absolute top-1/2 -translate-y-1/2 right-4 w-24 h-24 opacity-20" />
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <h3 className="text-2xl font-bold">Общежития</h3>
                            <p className="text-sm opacity-90">Виртуална разходка из базите. Виж условията преди да кандидатстваш.</p>
                            <button className="btn btn-sm btn-outline text-white border-white hover:bg-white hover:text-emerald-600 mt-2">
                                Очаквай скоро
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- STATS & INFO SECTION --- */}
            <section className="bg-base-200 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold">Защо да избереш УниПът?</h2>
                            <p className="text-lg opacity-70">
                                Ние не сме просто сайт с новини. Ние сме технологичен инструмент, който събира данни от МОН и университетите в реално време.
                            </p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="text-success w-6 h-6" />
                                    <span className="font-medium">Актуални формули </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="text-success w-6 h-6" />
                                    <span className="font-medium">Всички матури и оценки от дипломата са включени</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="text-success w-6 h-6" />
                                    <span className="font-medium">Напълно безплатно за ученици</span>
                                </li>
                            </ul>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-base-100 p-6 rounded-3xl shadow-sm">
                                <Users className="w-8 h-8 text-primary mb-2" />
                                <div className="text-3xl font-black">12k+</div>
                                <div className="text-xs opacity-50 uppercase font-bold">Потребители</div>
                            </div>
                            <div className="bg-base-100 p-6 rounded-3xl shadow-sm">
                                <Trophy className="w-8 h-8 text-warning mb-2" />
                                <div className="text-3xl font-black">98%</div>
                                <div className="text-xs opacity-50 uppercase font-bold">Точност</div>
                            </div>
                            <div className="bg-base-100 p-6 rounded-3xl shadow-sm col-span-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-black">50+</div>
                                        <div className="text-xs opacity-50 uppercase font-bold">Университета</div>
                                    </div>
                                    <div className="flex -space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-base-300 border-2 border-base-100"></div>
                                        <div className="w-10 h-10 rounded-full bg-base-300 border-2 border-base-100"></div>
                                        <div className="w-10 h-10 rounded-full bg-base-300 border-2 border-base-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
