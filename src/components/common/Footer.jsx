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
import { useLocation, Link } from "react-router-dom";

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();

    if (location.pathname.startsWith("/admin")) return null;

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
                            <span className="text-2xl font-black tracking-tighter text-primary italic uppercase">УниПът</span>
                        </div>
                        <p className="text-sm font-medium opacity-60 leading-relaxed">
                            Иновативна платформа за кандидатстудентски прием. Твоят дигитален пътеводител към висшето образование в България.
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            <a href="https://github.com/Martin-Atanasov123/Uni-put" target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm hover:text-primary transition-colors" aria-label="GitHub репозитория на УниПът">
                                <Github size={20} />
                            </a>
                            <a href="https://www.mon.bg/visshe-obrazovanie/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm hover:text-primary transition-colors" aria-label="Министерство на образованието и науката – Висше образование">
                                <Globe size={20} />
                            </a>
                        </div>
                    </aside>

                    {/* Секция Ресурси (Външни линкове) */}
                    <nav className="flex flex-col gap-3">
                        <h2 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Официални Ресурси</h2>
                        <a href="https://www.mon.bg/obshto-obrazovanie/darzhavni-zrelostni-izpiti-dzi" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <BookOpen size={14} /> Инфорация за ДЗИ
                        </a>
                        <a href="https://www.mon.bg/novini/" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <ExternalLink size={14} /> Новини от МОН
                        </a>
                        <a href="https://www.mon.bg/obshto-obrazovanie/darzhavni-zrelostni-izpiti-dzi/izpitni-materiali-za-dzi-po-godini/" target="_blank" rel="noreferrer" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 hover:text-primary font-bold text-sm">
                            <FileText size={14} /> Държавни изпити
                        </a>
                    </nav>

                    <nav className="flex flex-col gap-3">
                        <h2 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Проектът</h2>
                        <a href="/about" className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 font-bold text-sm italic">
                            <Info size={14} /> За нас
                        </a>
                        <span className="link link-hover flex items-center justify-center md:justify-start gap-2 opacity-70 hover:opacity-100 font-bold text-sm">
                            <ShieldCheck size={14} /> Лиценз GNU
                        </span>
                        <span className="badge badge-primary font-black text-[10px] mt-2 italic mx-auto md:mx-0 text-primary-content border-none">НОИТ 2026</span>
                    </nav>

                    {/* Секция Правна информация */}
                    <nav className="flex flex-col gap-3">
                        <h2 className="footer-title opacity-100 font-black text-secondary tracking-widest text-[10px] mb-2 uppercase">Правна част</h2>
                        <Link to="/terms" className="link link-hover opacity-70 hover:opacity-100 font-bold text-sm">Условия за ползване</Link>
                        <Link to="/privacy" className="link link-hover opacity-70 hover:opacity-100 font-bold text-sm">Поверителност</Link>
                        <div className="mt-4 p-4 bg-base-300/50 rounded-2xl border border-base-content/5">
                            <p className="text-[10px] font-bold opacity-50 leading-tight">Данните за баловете са базирани на справочниците за 2026г.</p>
                        </div>
                    </nav>
                </div>

                {/* Копирайт лента */}
                <div className="mt-16 pt-8 border-t border-base-content/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">
                        © {currentYear} УниПът Bulgaria. Всички права са запазени.   
                    </p>
                    
                </div>
            </div>
        </footer>
    );
};

export default Footer;

