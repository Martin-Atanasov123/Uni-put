import { Link } from "react-router-dom";

import { useIsMobile } from "./hooks/useMobile"; // Използваме твоя хук

const Header = () => {
    const isMobile = useIsMobile();

    return (
        <div className="navbar bg-base-100 shadow-md px-4 md:px-12 p-fixed w-full fixed top-0 z-20">
            {/* ЛЯВА ЧАСТ: Лого и Мобилно меню */}

            <div className="navbar-start">
                {isMobile && (
                    <div className="dropdown">
                        <label className="btn btn-circle swap swap-rotate">
                            {/* this hidden checkbox controls the state */}
                            <input type="checkbox"  />

                            {/* hamburger icon */}
                            <svg
                                className="swap-off fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 512 512"
                            >
                                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                            </svg>

                            {/* close icon */}
                            <svg            
                                className="swap-on fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 512 512"
                            >
                                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                            </svg>
                        </label>


                        <ul
                            tabIndex={0}
                            role="button"
                            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52"
                        >
                            <li>
                                <Link to="/universities">Университети</Link>
                            </li>

                            <li>
                                <Link to="/calculator">Калкулатор</Link>
                            </li>

                            <div className="divider my-1"></div>

                            <li>
                                <Link to="/login">Вход</Link>
                            </li>

                            <li>
                                <Link to="/register">Регистрация</Link>
                            </li>
                        </ul>
                    </div>
                )}

                <Link to="/" className="btn btn-ghost text-xl gap-2 px-2">
                    <span className="text-primary text-2xl"> UniPut🎓</span>

                    <span className="font-bold tracking-tight hidden sm:block"></span>
                </Link>
            </div>

            {/* ЦЕНТРАЛНА ЧАСТ: Линкове (само за компютър) */}

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 font-medium">
                    <li>
                        <Link to="/universities">Университети</Link>
                    </li>

                    <li>
                        <Link to="/calculator">Калкулатор</Link>
                    </li>
                    <div className="divider divider-horizontal mx-2"></div>

                    <li>
                        <Link to="/login">Вход</Link>
                    </li>

                    <li>
                        <Link to="/register">Регистрация</Link>
                    </li>
                </ul>
            </div>

            {/* ДЯСНА ЧАСТ: Бутони и Теми */}

                
            <label className="flex cursor-pointer gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                </svg>
                <input
                    type="checkbox"
                    value="light"
                    className="toggle theme-controller"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </label>
        </div>
    );
};

export default Header;
