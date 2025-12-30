import { Link } from "react-router-dom";

const Header = () => {
    return (
        <div className="navbar bg-base-100 shadow-md px-4 sm:px-8">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl gap-2">
                    <span className="text-primary text-2xl">🎓</span>
                    <span className="font-bold tracking-tight">UniPut</span>
                </Link>
            </div>
            <div className="flex-none gap-2">
                {/* <ul className="menu menu-horizontal px-1 hidden md:flex">
                    <li>
                        <a>Университети</a>
                    </li>
                    <li>
                        <a>Калкулатор</a>
                    </li>
                </ul> */}

                {/* Бутон за избор на тема - много иновативно! */}
                    {/* <select
                        className="select select-bordered select-sm"
                        data-choose-theme
                    >
                        <option value="light">☀️ Light</option>
                        <option value="dark">🌙 Dark</option>
                        <option value="cupcake">🧁 Cupcake</option>
                        <option value="emerald">🌲 Emerald</option>
                    </select> */}
                
                    
                <button className="btn btn-outline btn-sm md:btn-md">
                    <Link to="/register">Регистрация</Link>
                </button>
                <button className="btn btn-outline btn-sm md:btn-md ml-2">
                    <Link to="/login">Вход</Link>
                </button>
            </div>
        </div>
    );
};

export default Header;
