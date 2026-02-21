// Страница „За нас“ – представяне на проекта и екипа с семантичен HTML и достъпност (WCAG).
// Съдържа две основни секции за създателите, технически умения, опит и контакти.
import { Mail, Github, Code2, Briefcase } from "lucide-react";

const About = () => {
    // Основен семантичен контейнер (main) с заглавие и две авторски секции.
    return (
        <main
            className="min-h-screen bg-base-100 pt-28 pb-16 px-4"
            aria-labelledby="about-title"
        >
            <div className="max-w-6xl mx-auto space-y-16">
                <header className="text-center space-y-4">
                    <h1
                        id="about-title"
                        className="text-3xl md:text-4xl font-black tracking-tight font-sans"
                    >
                        За нас
                    </h1>
                    <p className="max-w-3xl mx-auto text-sm md:text-base opacity-80 leading-relaxed font-serif">
                        УниПът е създаден, за да помогне на кандидат-студентите
                        в България да вземат информирани решения за своето
                        бъдеще. Комбинираме данни за университети, специалности,
                        балове и общежития в една интуитивна платформа и я
                        развиваме с внимание към детайла, достъпността и
                        високия перформанс.
                    </p>
                </header>

                <section
                    aria-label="Екип"
                    className="space-y-12 md:space-y-16"
                >
                    <article
                        className="grid md:grid-cols-2 gap-8 md:gap-12 items-center animate-in fade-in slide-in-from-left duration-700"
                        aria-labelledby="martin-name"
                    >

                        
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-2">
                                <h2
                                    id="martin-name"
                                    className="text-2xl md:text-3xl font-black font-serif"
                                >
                                    Мартин Атанасов
                                </h2>
                                <p className="text-sm opacity-70 font-sans">
                                    Съосновател, архитект на платформата и
                                    full‑stack разработчик
                                </p>
                            </div>

                            <p className="text-sm md:text-base opacity-85 leading-relaxed font-serif">
                                Мартин е фокусиран върху изграждането на
                                дигитални продукти, които решават реални
                                проблеми за ученици, родители и университети.
                                В УниПът той отговаря за архитектурата на
                                приложението, интеграцията със Supabase и
                                проектирането на основните модули – от
                                калкулатора за бал и логиката за RIASEC
                                препоръки, до администраторския панел и
                                инфраструктурата за данните. Вярва, че
                                прозрачността и точната информация могат да
                                променят начина, по който младите хора взимат
                                решения за образованието си. Работи с особено
                                внимание към перформанс, достъпност и
                                поддръжка на дългосрочни проекти.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <h3 className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wide opacity-70">
                                        <Code2 size={16} />
                                        Технически умения
                                    </h3>
                                    <ul className="text-xs md:text-sm flex flex-wrap gap-2 font-sans">
                                        <li className="badge badge-primary badge-outline">
                                            React
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            JavaScript / TypeScript
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            Tailwind CSS / DaisyUI
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            Supabase / SQL
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            GitHub / CI
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wide opacity-70">
                                        <Briefcase size={16} />
                                        Професионален фокус
                                    </h3>
                                    <p className="text-xs md:text-sm opacity-80 leading-relaxed font-sans">
                                        Архитектура на системи, синхронизация на
                                        данни между фронтенд и база,
                                        кандидатстудентски кампании, аналитика и
                                        инструменти за администратори.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <a
                                    href="mailto:matanasov573@gmail.com"
                                    className="btn btn-sm btn-outline rounded-full gap-2"
                                    aria-label="Имейл до Мартин Атанасов"
                                >
                                    <Mail size={16} />
                                    Имейл
                                </a>
                                <a
                                    href="https://github.com/Martin-Atanasov123" 
                                    className="btn btn-sm btn-ghost rounded-full gap-2"
                                    aria-label="GitHub профил на Мартин Атанасов"
                                >
                                    <Github size={16} />
                                    GitHub
                                </a>
                            </div>
                        </div>
                        <div className="flex justify-center md:justify-start">
                            <div className="relative group w-full max-w-[420px] aspect-square overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 border border-primary/10 shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-2xl">
                                <img
                                    src="/public/martin_snimka.jpg"
                                    alt="Снимка: Мартин Атанасов"
                                    width={400}
                                    height={400}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </article>

                    <article
                        className="grid md:grid-cols-2 gap-8 md:gap-12 items-center animate-in fade-in slide-in-from-left duration-700"
                        aria-labelledby="martin-name"
                    >

                        <div className="flex justify-center md:justify-start">
                            <div className="relative group w-full max-w-[420px] aspect-square overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 border border-primary/10 shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-2xl">
                                <img
                                    src="/public/ivun_snimka.jpg"
                                    alt="Снимка: Ивън Минков"
                                    width={400}
                                    height={400}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-2">
                                <h2
                                    id="martin-name"
                                    className="text-2xl md:text-3xl font-black font-serif"
                                >
                                    Ивън Минков
                                </h2>
                                <p className="text-sm opacity-70 font-sans">
                                    Съосновател, UI/UX и фронтенд разработчик
                                </p>
                            </div>

                            <p className="text-sm md:text-base opacity-85 leading-relaxed font-serif">
                            Ивън е ориентиран към детайла разработчик, който се грижи всяко взаимодействие в УниПът да е ясно, бързо и приятно за ползване. Той работи върху визуалната система на проекта, компонентите за търсене на университети и общежития, както и върху адаптивното поведение на интерфейса при различни устройства. Интересува се от достъпност, микроанимации , така че платформата да се зарежда бързо дори при по-слаба връзка. Обича да експериментира с типография и минималистичен дизайн, които да подчертават съдържанието, а не да го засенчват. В свободното си време тества нови UI библиотеки, експериментира с дизайн системи и участва в проекти, насочени към образование и ориентиране на ученици.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <h3 className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wide opacity-70">
                                        <Code2 size={16} />
                                        Технически умения
                                    </h3>
                                    <ul className="text-xs md:text-sm flex flex-wrap gap-2 font-sans">
                                        <li className="badge badge-primary badge-outline">
                                            C#
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            Supabase / SQL
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            Тестване на интерфейси
                                        </li>
                                        <li className="badge badge-primary badge-outline">
                                            Логистика 
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wide opacity-70">
                                        <Briefcase size={16} />
                                        Професионален фокус
                                    </h3>
                                    <p className="text-xs md:text-sm opacity-80 leading-relaxed font-sans">
                                        Дизайн на интерфейси, интерактивни компоненти, оптимизация на UX потоци, тестове на потребителски сценарии и визуализация на комплексна информация.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <a
                                    href="mailto:ivun.minkov05@gmail.com"
                                    className="btn btn-sm btn-outline rounded-full gap-2"
                                    aria-label="Имейл до Мартин Атанасов"
                                >
                                    <Mail size={16} />
                                    Имейл
                                </a>
                                <a
                                    href="#"
                                    className="btn btn-sm btn-ghost rounded-full gap-2"
                                    aria-label="GitHub профил на Мартин Атанасов"
                                >
                                    <Github size={16} />
                                    GitHub
                                </a>
                            </div>
                        </div>
                        
                    </article>

                    
                </section>
            </div>
        </main>
    );
};

export default About;
