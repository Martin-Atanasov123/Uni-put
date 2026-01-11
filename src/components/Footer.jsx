

// const Footer = () => {
//     const currentYear = new Date().getFullYear();

//     return (
//         <footer className="bg-base-200 text-base-content mt-20 p-10">
//             {/* flex-col -> вертикално за телефон
//                sm:flex-row -> хоризонтално за всичко над 640px
//                sm:justify-between -> разпъва секциите в двата края
//             */}
//             <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10 sm:flex-row sm:items-start sm:text-left sm:justify-between">
                
//                 {/* Лого секция */}
//                 <aside className="flex flex-col items-center sm:items-start max-w-xs">
//                     <span className="text-6xl mb-3">🎓</span>
//                     <p className="font-black text-2xl tracking-tight text-primary">
//                         UniPut Bulgaria
//                     </p>
//                     <p className="text-sm opacity-70 mt-2">
//                         Иновации в кандидатстудентския прием от {currentYear}. Твоят път към университета започва тук.
//                     </p>
//                 </aside>

//                 {/* Секция Ресурси */}
//                 <nav className="flex flex-col gap-2">
//                     <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Ресурси</h6>
//                     <a className="link link-hover">Списък матури</a>
//                     <a className="link link-hover">Справочник 2024</a>
//                     <a className="link link-hover">МОН Новини</a>
//                 </nav>

//                 {/* Секция Проектът */}
//                 <nav className="flex flex-col gap-2">
//                     <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Проектът</h6>
//                     <a className="link link-hover">За нас</a>
//                     <a className="link link-hover">Лиценз (MIT)</a>
//                     <a className="link link-hover text-primary font-semibold">GitHub</a>
//                 </nav>

//                 {/* Секция Правна информация */}
//                 <nav className="flex flex-col gap-2">
//                     <h6 className="footer-title opacity-100 font-bold text-secondary mb-2">Правна информация</h6>
//                     <a className="link link-hover">Условия за ползване</a>
//                     <a className="link link-hover">Поверителност</a>
//                 </nav>
//             </div>

//             {/* Копирайт лента най-отдолу */}
//             <div className="mt-10 pt-6 border-t border-base-300 text-center text-xs opacity-50">
//                 © {currentYear} UniPut. Проект за Национална Олимпиада по ИТ.
//             </div>
//         </footer>
//     );
// };

// export default Footer;

import { 
    Github, 
    ExternalLink, 
    ShieldCheck, 
    Info, 
    BookOpen, 
    Globe,
    FileText,
    Heart
} from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-base-200 text-base-content mt-20 relative overflow-hidden">
            {/* Декоративен елемент за фон */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            
            <div className="max-w-7xl mx-auto p-10 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
                    
                    {/* Лого секция */}
                    <aside className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-2 group">
                            <span className="text-4xl group-hover:rotate-12 transition-transform duration-300">🎓</span>
                            <span className="text-2xl font-black tracking-tighter text-primary italic uppercase">UniPut</span>
                        </div>
                        <p className="text-sm font-medium opacity-60 leading-relaxed">
                            Иновативна платформа за кандидатстудентски прием. Твоят дигитален пътеводител към висшето образование в България.
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm hover:text-primary transition-colors">
                                <Github size={20} />
                            </a>
                            <a href="https://mon.bg" target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm hover:text-primary transition-colors">
                                <Globe size={20} />
                            </a>
                        </div>
                    </aside>

                    {/* Секция Ресурси (Външни линкове) */}
                    <nav className="flex flex-col gap-3">
                        <h6 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Официални Ресурси</h6>
                        <a href="https://www.mon.bg/obshto-obrazovanie/darzhavni-zrelostni-izpiti-dzi" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <BookOpen size={14} /> Инфорация за ДЗИ
                        </a>
                        <a href="https://www.mon.bg/novini/" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <ExternalLink size={14} /> Новини от МОН
                        </a>
                        <a href="https://web.mon.bg/bg/100561" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <FileText size={14} /> Държавни изпити
                        </a>
                    </nav>

                    {/* Секция Проектът */}
                    <nav className="flex flex-col gap-3">
                        <h6 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Проектът</h6>
                        <a className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 font-bold text-sm italic">
                            <Info size={14} /> За проекта
                        </a>
                        <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 font-bold text-sm">
                            <ShieldCheck size={14} /> MIT Лиценз
                        </a>
                        <span className="badge badge-primary badge-outline font-black text-[10px] mt-2 italic mx-auto md:mx-0">НОИТ 2025</span>
                    </nav>

                    {/* Секция Правна информация */}
                    <nav className="flex flex-col gap-3">
                        <h6 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Правна част</h6>
                        <a className="link link-hover opacity-70 hover:opacity-100 font-bold text-sm">Условия за ползване</a>
                        <a className="link link-hover opacity-70 hover:opacity-100 font-bold text-sm">Поверителност</a>
                        <div className="mt-4 p-4 bg-base-300/50 rounded-2xl border border-base-content/5">
                            <p className="text-[10px] font-bold opacity-50 leading-tight">Данните за баловете са базирани на справочниците за 2024г.</p>
                        </div>
                    </nav>
                </div>

                {/* Копирайт лента */}
                <div className="mt-16 pt-8 border-t border-base-content/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
                        © {currentYear} UniPut Bulgaria. Всички права запазени.
                    </p>
                    
                </div>
            </div>
        </footer>
    );
};

export default Footer;
