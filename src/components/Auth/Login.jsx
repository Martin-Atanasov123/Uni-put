import { useState } from 'react';
import { supabase } from '../supabaseClient'; // Увери се, че пътят е верен
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Успешен вход - пренасочваме към началната страница или таблото
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-content/5">
                <div className="card-body">
                    {/* Заглавие и Лого */}
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg">
                            <LogIn className="text-primary-content w-8 h-8" />
                        </div>
                        <h2 className="card-title text-2xl font-bold text-base-content">Добре дошъл отново!</h2>
                        <p className="text-sm text-base-content/60 text-center">
                            Влез в UniPut, за да управляваш своите балoве.
                        </p>
                    </div>

                    {/* Грешка, ако има такава */}
                    {error && (
                        <div className="alert alert-error shadow-sm mb-4 py-2 text-sm italic">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Имейл поле */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Имейл</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input 
                                    type="email" 
                                    placeholder="ivan@mail.com" 
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Парола поле */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Парола</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <label className="label">
                                <a href="#" className="label-text-alt link link-hover text-primary">Забравена парола?</a>
                            </label>
                        </div>

                        {/* Бутон за вход */}
                        <div className="form-control mt-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Влизане...
                                    </>
                                ) : (
                                    'Влез в профила'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer на картата */}
                    <div className="divider text-xs text-base-content/40 uppercase font-bold tracking-widest mt-8">Или</div>
                    
                    <p className="text-center text-sm text-base-content/60 mt-4">
                        Нямаш профил?{' '}
                        <Link to="/register" className="text-primary font-bold hover:underline">
                            Регистрирай се
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
