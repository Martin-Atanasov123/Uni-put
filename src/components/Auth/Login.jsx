import  { useState } from "react";
// import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // const { data, error } = await supabase.auth.signInWithPassword({
        //     email,
        //     password,
        // });

        if (error) {
            setError("Невалиден имейл или парола.");
        } else {
            // Успешен вход!
            navigate("/calculator"); // Пренасочваме директно към калкулатора
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-base-200 px-4">
            <div className="card w-full max-w-sm shadow-2xl bg-base-100">
                <form onSubmit={handleLogin} className="card-body">
                    <h2 className="text-2xl font-bold text-center mb-4">
                        Добре дошъл отново
                    </h2>

                    {error && (
                        <div className="alert alert-error text-sm py-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="stroke-current shrink-0 h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Имейл
                            </span>
                        </label>
                        <input
                            type="email"
                            placeholder="твоят имейл"
                            className="input input-bordered focus:input-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control mt-2">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Парола
                            </span>
                        </label>
                        <input
                            type="password"
                            placeholder="******"
                            className="input input-bordered focus:input-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label className="label">
                            <a
                                href="#"
                                className="label-text-alt link link-hover"
                            >
                                Забравена парола?
                            </a>
                        </label>
                    </div>

                    <div className="form-control  mt-6">
                        <button
                            className={`btn btn-primary ${
                                loading ? "loading" : ""
                            }`}
                            disabled={loading}
                        >
                            Влез в профила
                        </button>
                    </div>

                    <p className="text-center mt-4 text-sm">
                        Нямаш профил?{" "}
                        <Link
                            to="/signup"
                            className="link link-secondary font-bold"
                        >
                            Регистрирай се
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
