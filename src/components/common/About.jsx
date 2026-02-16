import { Mail, Github, Code2, Briefcase } from "lucide-react";

const About = () => {
    return (
        <main
            className="min-h-screen bg-base-100 pt-28 pb-16 px-4"
            aria-labelledby="about-title"
        >
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <h1
                        id="about-title"
                        className="text-3xl md:text-4xl font-black tracking-tight"
                    >
                        За нас
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base opacity-80 leading-relaxed">
                        УниПът е създаден, за да помогне на кандидат-студентите
                        в България да вземат информирани решения за своето
                        бъдеще. Комбинираме данни за университети, специалности,
                        балове и общежития в една интуитивна платформа.
                    </p>
                </header>

                <section
                    aria-label="Екип"
                    className="grid gap-8 md:gap-10 md:grid-cols-2"
                >
                    <article
                        className="bg-base-200/60 rounded-3xl border border-base-content/5 p-6 md:p-8 flex flex-col h-full"
                        aria-labelledby="martin-name"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJTaW1rYSBwb3RyZXRfIE1hcnRpbiBBdGFuYXNvdiI+PGRlZnM+PGxpbmVhcmdhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM0Mjg3ZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZjM5OTMiLz48L2xpbmVhcmdhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjE2IiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNDAiIHk9IjQ4IiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj5NQTwvdGV4dD48L3N2Zz4="
                                alt="Снимка: Мартин Атанасов"
                                width={80}
                                height={80}
                                loading="lazy"
                                className="rounded-2xl shadow-lg shadow-primary/30"
                            />
                            <div>
                                <h2
                                    id="martin-name"
                                    className="text-xl md:text-2xl font-black"
                                >
                                    Мартин Атанасов
                                </h2>
                                <p className="text-sm opacity-70">
                                    Съосновател и разработчик на УниПът
                                </p>
                            </div>
                        </div>

                        <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
                            Мартин е фокусиран върху изграждането на продукти,
                            които решават реални проблеми за ученици и
                            университети. В УниПът той отговаря за архитектурата
                            на приложението, интеграцията със Supabase и
                            UX/интерфейса на ключовите модули като калкулатора
                            за бал и панела за администратори.
                        </p>

                        <div className="space-y-4 mt-auto">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-70 mb-2">
                                    <Code2 size={16} />
                                    Технически умения
                                </h3>
                                <ul className="text-sm flex flex-wrap gap-2">
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

                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-70 mb-2">
                                    <Briefcase size={16} />
                                    Професионален опит
                                </h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Опит в разработката на уеб приложения с
                                    фокус върху образованието и
                                    данни-ориентирани платформи. Участвал в
                                    проекти, свързани с кандидатстудентски
                                    кампании, визуализация на данни и
                                    поддръжка на административни интерфейси.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <a
                                    href="mailto:martin@example.com"
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

                    <article
                        className="bg-base-200/60 rounded-3xl border border-base-content/5 p-6 md:p-8 flex flex-col h-full"
                        aria-labelledby="ivan-name"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJTaW1rYSBwb3RyZXRfIEl2ънIE1pbmtvdiI+PGRlZnM+PGxpbmVhcmdhZGllbnQgaWQ9ImgiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM2YmQzZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNhY2I0ZmYiLz48L2xpbmVhcmdhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjE2IiBmaWxsPSJ1cmwoI2gpIi8+PHRleHQgeD0iNDAiIHk9IjQ4IiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj5JTTwvdGV4dD48L3N2Zz4="
                                alt="Снимка: Ивън Минков"
                                width={80}
                                height={80}
                                loading="lazy"
                                className="rounded-2xl shadow-lg shadow-secondary/30"
                            />
                            <div>
                                <h2
                                    id="ivan-name"
                                    className="text-xl md:text-2xl font-black"
                                >
                                    Ивън Минков
                                </h2>
                                <p className="text-sm opacity-70">
                                    Съосновател и разработчик на УниПът
                                </p>
                            </div>
                        </div>

                        <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
                            Ивън е ориентиран към детайла разработчик с интерес
                            към визуализации, аналитични инструменти и
                            потребителско изживяване. В проекта УниПът той
                            допринася за изграждането на модулите за
                            общежитията, визуализацията на данни и оптимизацията
                            на интерфейса за различни устройства.
                        </p>

                        <div className="space-y-4 mt-auto">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-70 mb-2">
                                    <Code2 size={16} />
                                    Технически умения
                                </h3>
                                <ul className="text-sm flex flex-wrap gap-2">
                                    <li className="badge badge-secondary badge-outline">
                                        React
                                    </li>
                                    <li className="badge badge-secondary badge-outline">
                                        JavaScript
                                    </li>
                                    <li className="badge badge-secondary badge-outline">
                                        UI/UX дизайн
                                    </li>
                                    <li className="badge badge-secondary badge-outline">
                                        Работа с API
                                    </li>
                                    <li className="badge badge-secondary badge-outline">
                                        Тестване на интерфейси
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-70 mb-2">
                                    <Briefcase size={16} />
                                    Професионален опит
                                </h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Опит в изграждането на модерни уеб интерфейси
                                    с фокус върху достъпност и перформанс.
                                    Участвал в разработката на образователни
                                    проекти, интерактивни карти и панели за
                                    визуализация на информация.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <a
                                    href="mailto:ivan@example.com"
                                    className="btn btn-sm btn-outline rounded-full gap-2"
                                    aria-label="Имейл до Ивън Минков"
                                >
                                    <Mail size={16} />
                                    Имейл
                                </a>
                                <a
                                    href="#"
                                    className="btn btn-sm btn-ghost rounded-full gap-2"
                                    aria-label="GitHub профил на Ивън Минков"
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
