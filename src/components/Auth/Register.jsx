import React, { useState } from "react";
// import { supabase } from "../supabaseClient"; // Пътят до твоя supabase клиент
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // const { data, error } = await supabase.auth.signUp({
        //     email,
        //     password,
        // });


        if (error) {
            setError(error.message);
        } else {
            // Успешна регистрация - пренасочваме към калкулатора или началната страница
            alert("Провери имейла си за потвърждение!");
            navigate("/");
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-base-200 px-4">
            <div className="card w-full max-w-sm shadow-2xl bg-base-100">
                <form onSubmit={handleSignUp} className="card-body">
                    <h2 className="text-2xl font-bold text-center mb-4">
                        Създай профил
                    </h2>

                    {error && (
                        <div className="alert alert-error text-sm py-2">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Имейл</span>
                        </label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="input input-bordered"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control mt-2">
                        <label className="label">
                            <span className="label-text">Парола</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Твоята парола"
                            className="input input-bordered"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control mt-6">
                        <button
                            className={`btn btn-primary ${
                                loading ? "loading" : ""
                            }`}
                            disabled={loading}
                        >
                            Регистрирай се
                        </button>
                    </div>

                    <p className="text-center mt-4 text-sm">
                        Вече имаш профил?{" "}
                        <Link to="/login" className="link link-primary">
                            Влез тук
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
