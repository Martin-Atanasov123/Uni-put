import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "./hooks/useMobile";
import { useAuth } from "../context/AuthContext"; 
import { supabase } from "../supabaseClient"; 
import { User, LogOut, Settings, LayoutDashboard } from "lucide-react"; // Добавяме икони

const Header = () => {
    const isMobile = useIsMobile();
    const { user } = useAuth(); 
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login"); 
    };

    return (
        <div className="navbar bg-base-100 shadow-md px-4 md:px-12 fixed w-full top-0 z-20">
            {/* ЛЯВА ЧАСТ: Лого и Мобилно меню */}
            <div className="navbar-start">
                {isMobile && (
                    <div className="dropdown">
                        <label tabIndex={0} className="btn btn-ghost btn-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                        </label>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
                            <li><Link to="/universities">Университети</Link></li>
                            <li><Link to="/calculator">Калкулатор</Link></li>
                            <div className="divider my-1"></div>
                            {!user ? (
                                <>
                                    <li><Link to="/login">Вход</Link></li>
                                    <li><Link to="/register">Регистрация</Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link to="/profile">Моят Профил</Link></li>
                                    <li><button onClick={handleLogout} className="text-error">Изход</button></li>
                                </>
                            )}
                        </ul>
                    </div>
                )}

                <Link to="/" className="btn btn-ghost text-xl gap-2 px-2">
                    <span className="text-primary text-2xl font-black">UniPut🎓</span>
                </Link>
            </div>

            {/* ЦЕНТРАЛНА ЧАСТ: Десктоп линкове */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 font-medium gap-2">
                    <li><Link to="/universities" className="hover:text-primary transition-colors">Университети</Link></li>
                    <li><Link to="/calculator" className="hover:text-primary transition-colors">Калкулатор</Link></li>
                </ul>
            </div>

            {/* ДЯСНА ЧАСТ: Теми и Профил */}
            <div className="navbar-end gap-4">
                {/* Theme Controller */}
                <label className="flex cursor-pointer gap-2 scale-90 md:scale-100">
                    <input type="checkbox" value="light" className="toggle theme-controller" />
                </label>

                {/* Профил Секция */}
                {!user ? (
                    <div className="hidden md:flex gap-2">
                        <Link to="/login" className="btn btn-ghost btn-sm">Вход</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
                    </div>
                ) : (
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar online">
                            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
                                    <span className="text-lg uppercase">
                                        {user.user_metadata?.username?.charAt(0) || "U"}
                                    </span>
                                </div>
                            </div>
                        </label>
                        <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-content/5">
                            <li className="menu-title flex flex-row items-center gap-2 px-4 py-2">
                                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Акаунт</span>
                            </li>
                            <li>
                                <Link to="/profile" className="flex justify-between">
                                    Профил
                                    <User className="w-4 h-4 opacity-70" />
                                </Link>
                            </li>
                            <li>
                                <Link to="/calculator">
                                    Моите балове
                                    <LayoutDashboard className="w-4 h-4 opacity-70" />
                                </Link>
                            </li>
                            <div className="divider my-1"></div>
                            <li>
                                <button onClick={handleLogout} className="text-error flex justify-between">
                                    Изход
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
