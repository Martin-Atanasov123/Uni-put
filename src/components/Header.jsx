// import { Link, useNavigate } from "react-router-dom";
// import { useIsMobile } from "./hooks/useMobile";
// import { useAuth } from "../context/AuthContext"; 
// import { supabase } from "../../src/components/supabaseClient";
// import { User, LogOut, Settings, LayoutDashboard } from "lucide-react"; // Добавяме икони

// const Header = () => {
//     const isMobile = useIsMobile();
//     const { user } = useAuth(); 
//     const navigate = useNavigate();

//     const handleLogout = async () => {
//         await supabase.auth.signOut();
//         navigate("/login"); 
//     };

//     return (
//         <div className="navbar bg-base-100 shadow-md px-4 md:px-12 fixed w-full top-0 z-20">
//             {/* ЛЯВА ЧАСТ: Лого и Мобилно меню */}
//             <div className="navbar-start">
//                 {isMobile && (
//                     <div className="dropdown">
//                         <label tabIndex={0} className="btn btn-ghost btn-circle">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
//                         </label>
//                         <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
//                             <li><Link to="/universities">Университети</Link></li>
//                             <li><Link to="/calculator">Калкулатор</Link></li>
//                             <div className="divider my-1"></div>
//                             {!user ? (
//                                 <>
//                                     <li><Link to="/login">Вход</Link></li>
//                                     <li><Link to="/register">Регистрация</Link></li>
//                                 </>
//                             ) : (
//                                 <>
//                                     <li><Link to="/profile">Моят Профил</Link></li>
//                                     <li><button onClick={handleLogout} className="text-error">Изход</button></li>
//                                 </>
//                             )}
//                         </ul>
//                     </div>
//                 )}

//                 <Link to="/" className="btn btn-ghost text-xl gap-2 px-2">
//                     <span className="text-primary text-2xl font-black">UniPut🎓</span>
//                 </Link>
//             </div>

//             {/* ЦЕНТРАЛНА ЧАСТ: Десктоп линкове */}
//             <div className="navbar-center hidden lg:flex">
//                 <ul className="menu menu-horizontal px-1 font-medium gap-2">
//                     <li><Link to="/universities" className="hover:text-primary transition-colors">Университети</Link></li>
//                     <li><Link to="/calculator" className="hover:text-primary transition-colors">Калкулатор</Link></li>
//                 </ul>
//             </div>

//             {/* ДЯСНА ЧАСТ: Теми и Профил */}
//             <div className="navbar-end gap-4">
//                 {/* Theme Controller */}
//                 <label className="flex cursor-pointer gap-2 scale-90 md:scale-100">
//                     <input type="checkbox" value="light" className="toggle theme-controller" />
//                 </label>

//                 {/* Профил Секция */}
//                 {!user ? (
//                     <div className="hidden md:flex gap-2">
//                         <Link to="/login" className="btn btn-ghost btn-sm">Вход</Link>
//                         <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
//                     </div>
//                 ) : (
//                     <div className="dropdown dropdown-end">
//                         <label tabIndex={0} className="btn btn-ghost btn-circle avatar online">
//                             <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
//                                 <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
//                                     <span className="text-lg uppercase">
//                                         {user.user_metadata?.username?.charAt(0) || "U"}
//                                     </span>
//                                 </div>
//                             </div>
//                         </label>
//                         <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-content/5">
//                             <li className="menu-title flex flex-row items-center gap-2 px-4 py-2">
//                                 <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Акаунт</span>
//                             </li>
//                             <li>
//                                 <Link to="/profile" className="flex justify-between">
//                                     Профил
//                                     <User className="w-4 h-4 opacity-70" />
//                                 </Link>
//                             </li>
//                             <li>
//                                 <Link to="/calculator">
//                                     Моите балове
//                                     <LayoutDashboard className="w-4 h-4 opacity-70" />
//                                 </Link>
//                             </li>
//                             <div className="divider my-1"></div>
//                             <li>
//                                 <button onClick={handleLogout} className="text-error flex justify-between">
//                                     Изход
//                                     <LogOut className="w-4 h-4" />
//                                 </button>
//                             </li>
//                         </ul>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Header;

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { supabase } from "../../src/components/supabaseClient";
import { 
    User, 
    LogOut, 
    LayoutDashboard, 
    Menu, 
    X, 
    GraduationCap, 
    Calculator, 
    Search,
    Moon,
    Sun
} from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
    const { user } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Сменя стила при скрол за модерен "floating" ефект
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        navigate("/login"); 
    };

    const navLinks = [
        { name: "Университети", path: "/universities", icon: <Search size={18} /> },
        { name: "Калкулатор", path: "/calculator", icon: <Calculator size={18} /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* --- ОСНОВЕН ХЕДЪР --- */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-8 py-4 ${scrolled ? 'top-2' : 'top-0'}`}>
                <div className={`max-w-7xl mx-auto backdrop-blur-md rounded-[2rem] border transition-all duration-500 shadow-2xl ${
                    scrolled 
                    ? 'bg-base-100/80 border-primary/20 py-2 px-6' 
                    : 'bg-base-100/40 border-transparent py-4 px-6'
                } flex items-center justify-between`}>
                    
                    {/* ЛОГО */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/30">
                                <GraduationCap className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent uppercase italic">
                                UniPut
                            </span>
                        </Link>

                        {/* DESKTOP MENU */}
                        <div className="hidden lg:flex items-center gap-1 bg-base-300/30 p-1 rounded-2xl border border-base-content/5">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.path} 
                                    to={link.path} 
                                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                        isActive(link.path) 
                                        ? 'bg-base-100 text-primary shadow-sm' 
                                        : 'hover:bg-base-100/50 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ДЯСНА ЧАСТ */}
                    <div className="flex items-center gap-3">
                        {/* Тема (Супер модерен суич) */}
                        <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm opacity-70 hover:opacity-100">
                            <input type="checkbox" className="theme-controller" value="light" />
                            <Sun className="swap-on w-5 h-5" />
                            <Moon className="swap-off w-5 h-5" />
                        </label>

                        {!user ? (
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/login" className="btn btn-ghost btn-sm font-bold uppercase tracking-tighter">Вход</Link>
                                <Link to="/register" className="btn btn-primary btn-sm px-6 rounded-xl font-black italic shadow-lg shadow-primary/20">Регистрация</Link>
                            </div>
                        ) : (
                            <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost btn-circle avatar border-2 border-primary/20 p-0.5">
                                    <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-black italic">
                                        {user.user_metadata?.username?.charAt(0) || "U"}
                                    </div>
                                </label>
                                <ul tabIndex={0} className="mt-4 p-3 shadow-2xl menu dropdown-content bg-base-100 rounded-[2rem] w-64 border border-primary/10 backdrop-blur-xl">
                                    <div className="px-4 py-3 mb-2 bg-primary/5 rounded-2xl">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Добре дошъл,</p>
                                        <p className="font-black text-primary truncate">{user.user_metadata?.username || user.email}</p>
                                    </div>
                                    <li><Link to="/profile" className="rounded-xl py-3 font-bold"><User size={18}/> Профил</Link></li>
                                    <li><Link to="/calculator" className="rounded-xl py-3 font-bold"><LayoutDashboard size={18}/> Моите балове</Link></li>
                                    <div className="divider opacity-50"></div>
                                    <li><button onClick={handleLogout} className="rounded-xl py-3 font-bold text-error hover:bg-error/10"><LogOut size={18}/> Изход</button></li>
                                </ul>
                            </div>
                        )}

                        {/* Моб. бутон - само икона */}
                        <button 
                            className="lg:hidden btn btn-ghost btn-circle"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- МОБИЛНО МЕНЮ (Full Screen Drawer) --- */}
            <div className={`fixed inset-0 z-[110] transition-all duration-500 ${isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-base-300/80 backdrop-blur-xl" onClick={() => setIsMenuOpen(false)}></div>
                
                {/* Drawer Content */}
                <div className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-base-100 shadow-2xl p-8 transition-transform duration-500 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center mb-12">
                        <span className="text-2xl font-black italic text-primary">UniPut🎓</span>
                        <button className="btn btn-ghost btn-circle bg-base-200" onClick={() => setIsMenuOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-4 p-5 rounded-[2rem] text-xl font-black transition-all ${
                                    isActive(link.path) 
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                                    : 'bg-base-200 hover:bg-base-300'
                                }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 border-t border-base-content/5">
                        {!user ? (
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-ghost h-14 rounded-2xl font-black">Вход</Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn btn-primary h-14 rounded-2xl font-black italic shadow-lg shadow-primary/30">Регистрация</Link>
                            </div>
                        ) : (
                            <button onClick={handleLogout} className="btn btn-error btn-outline w-full h-14 rounded-2xl font-black italic gap-2">
                                <LogOut size={20} /> Изход
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;
