

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-base-200 text-base-content mt-20 p-10">
            {/* flex-col -> вертикално за телефон
               sm:flex-row -> хоризонтално за всичко над 640px
               sm:justify-between -> разпъва секциите в двата края
            */}
            <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10 sm:flex-row sm:items-start sm:text-left sm:justify-between">
                
                {/* Лого секция */}
                <aside className="flex flex-col items-center sm:items-start max-w-xs">
                    <span className="text-6xl mb-3">🎓</span>
                    <p className="font-black text-2xl tracking-tight text-primary">
                        UniPut Bulgaria
                    </p>
                    <p className="text-sm opacity-70 mt-2">
                        Иновации в кандидатстудентския прием от {currentYear}. Твоят път към университета започва тук.
                    </p>
                </aside>

                {/* Секция Ресурси */}
                <nav className="flex flex-col gap-2">
                    <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Ресурси</h6>
                    <a className="link link-hover">Списък матури</a>
                    <a className="link link-hover">Справочник 2024</a>
                    <a className="link link-hover">МОН Новини</a>
                </nav>

                {/* Секция Проектът */}
                <nav className="flex flex-col gap-2">
                    <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Проектът</h6>
                    <a className="link link-hover">За нас</a>
                    <a className="link link-hover">Лиценз (MIT)</a>
                    <a className="link link-hover text-primary font-semibold">GitHub</a>
                </nav>

                {/* Секция Правна информация */}
                <nav className="flex flex-col gap-2">
                    <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Правна информация</h6>
                    <a className="link link-hover">Условия за ползване</a>
                    <a className="link link-hover">Поверителност</a>
                </nav>
            </div>

            {/* Копирайт лента най-отдолу */}
            <div className="mt-10 pt-6 border-t border-base-300 text-center text-xs opacity-50">
                © {currentYear} UniPut. Проект за Национална Олимпиада по ИТ.
            </div>
        </footer>
    );
};

export default Footer;
