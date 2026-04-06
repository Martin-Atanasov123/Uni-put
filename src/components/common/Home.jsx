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
    BookOpen,
    Star,
    ChevronLeft,
    ChevronRight,
    Quote
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// --- КОМПОНЕНТ: РЕВЮТА (СЛАЙДЕР) ---
const REVIEWS = [
    { name: "Мария Георгиева", text: "Изключително полезен сайт! Помогна ми да се ориентирам в бала си за СУ.", rating: 5 },
    { name: "Иван Петров", text: "Калкулаторът е много точен. Вече съм студент благодарение на УниПът!", rating: 5 },
    { name: "Елена Димова", text: "Дизайнът е супер, много лесно се работи с търсачката.", rating: 4 },
    { name: "Стефан Колев", text: "Най-накрая платформа, която обединява всичко за кандидат-студентите.", rating: 5 },
    { name: "Анелия Иванова", text: "Тестът за кариерно ориентиране ми даде страхотни идеи за бъдещето.", rating: 5 },
    { name: "Георги Стоянов", text: "Секцията за общежития е много подробна. Спести ми часове ровене.", rating: 5 },
    { name: "Виктория Николова", text: "Много полезно приложение. Препоръчвам на всички дванадесетокласници.", rating: 4 },
    { name: "Мартин Димитров", text: "Бързо, лесно и надеждно. Информационната база е огромна.", rating: 5 },
    { name: "Симона Кръстева", text: "Благодарение на УниПът намерих специалност, за която дори не бях мислила.", rating: 5 },
    { name: "Петър Ангелов", text: "Страхотна инициатива! Платформата е на световно ниво.", rating: 5 },
];

const ReviewsSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const timeoutRef = useRef(null);
    
    // We duplicate the reviews for the infinite effect
    const extendedReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS];
    const startIndex = REVIEWS.length; // Start at the middle set

    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex]);

    const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            nextSlide();
        }, 4000);
        return () => resetTimeout();
    }, [currentIndex]);

    const nextSlide = () => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const prevSlide = () => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleTransitionEnd = () => {
        // If we reach the end of the middle set or the beginning of it, 
        // jump back to the middle without animation
        if (currentIndex >= REVIEWS.length * 2) {
            setIsTransitioning(false);
            setCurrentIndex(REVIEWS.length);
        } else if (currentIndex <= REVIEWS.length - 1) {
            setIsTransitioning(false);
            setCurrentIndex(REVIEWS.length * 2 - 1);
        }
    };

    // Calculate how many items to show based on screen width
    const getVisibleItems = () => {
        if (typeof window === "undefined") return 3;
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    };

    const [visibleItems, setVisibleItems] = useState(getVisibleItems());

    useEffect(() => {
        const handleResize = () => setVisibleItems(getVisibleItems());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const itemWidth = 100 / visibleItems;

    return (
        <section className="py-24 bg-base-200/30 overflow-hidden relative" id="reviews-section">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                            <Quote size={12} />
                            Отзиви
                        </div>
                        <h2 className="text-4xl font-black italic">Доволни клиенти и ревюта</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={prevSlide} className="btn btn-circle btn-outline btn-sm hover:bg-primary hover:border-primary border-base-content/20 transition-all shadow-sm">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextSlide} className="btn btn-circle btn-outline btn-sm hover:bg-primary hover:border-primary border-base-content/20 transition-all shadow-sm">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative w-full overflow-hidden">
                    <div
                        data-testid="reviews-slider"
                        className={`flex ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
                        style={{
                            transform: `translateX(-${currentIndex * itemWidth}%)`,
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {extendedReviews.map((review, i) => (
                            <div
                                key={i}
                                style={{ width: `${itemWidth}%` }}
                                className="shrink-0 px-3"
                            >
                            <div className="h-full bg-base-100 p-8 rounded-[2rem] border border-base-300 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="space-y-4">
                                    <div className="flex gap-1 text-warning group-hover:scale-105 transition-transform origin-left">
                                        {[...Array(5)].map((_, starI) => (
                                            <Star 
                                                key={starI} 
                                                size={16} 
                                                fill={starI < review.rating ? "currentColor" : "none"} 
                                                className={starI < review.rating ? "" : "text-base-300"}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                                        "{review.text}"
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-base-content">{review.name}</p>
                                        <p className="text-[10px] opacity-50 font-black uppercase tracking-widest">Потребител на УниПът</p>
                                    </div>
                                </div>
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary border border-primary/60 text-xs font-bold text-primary-content uppercase tracking-wider shadow-sm hover:scale-105 transition-transform cursor-default">
                        <Sparkles size={14} />
                        Изцяло обновена платформа 2026
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
                            { label: "Специалности", value: 400, suffix: "+", icon: BookOpen },
                            { label: "Потребители", value: 120,suffix: "+", icon: Users },
                            { label: "Точност", value: 99, suffix: "%", icon: Trophy },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 group cursor-default">
                                <div className="text-3xl font-black text-base-content group-hover:text-primary transition-colors flex items-center justify-center gap-1 tabular-nums">
                                    <span className="inline-block min-w-[5ch] text-center">
                                        <StatCounter end={stat.value} />
                                    </span>
                                    {stat.suffix}
                                </div>
                                <div className="text-xs uppercase font-bold text-base-content/70 flex items-center gap-1">
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
                                    <div className="text-xs font-black opacity-60">СТЪПКА {item.step}</div>
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
                                        Сравни бала си с миналогодишните приеми.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-bold text-sm mt-6">
                                Сметни  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
                                    {/* <div className="badge badge-warning text-xs font-bold mb-2">Изпробвай сега</div> */}
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
                                Потърси сега<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
                                    <p className="text-sm text-white/95">
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

            {/* --- ОТЗИВИ (СЛАЙДЕР) --- */}
            <ReviewsSlider />

        </div>
    );
}

