// Контекст за автентикация и управление на потребителската сесия.
// Цел: Предоставя глобално състояние (user, loading) за приложението,
// което компонентите използват, за да знаят дали има логнат потребител
// и кога е готово началното зареждане на сесията.
//
// Поведение:
// - При mount: извлича текущата сесия от Supabase и задава user/loading.
// - Слуша промени в сесията (login/logout) и актуализира състоянието.
// - Рендерира децата само след като loading е false, за да не мигат защитени маршрути.
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

/**
 * Провайдър за автентикация
 * @param {{ children: React.ReactNode }} props - Дъщерни компоненти, които ще получат контекста
 * @returns {JSX.Element}
 *
 * Edge случаи:
 * - Ако няма активна сесия, user остава null.
 * - При промяна на сесията (login/logout), състоянието се обновява и loading става false.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Провери текущата сесия при зареждане
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 2. Слушай за промени (Login/Logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

/**
 * Хук за достъп до контекста на автентикация
 * @returns {{ user: object|null, loading: boolean }}
 */
export const useAuth = () => useContext(AuthContext);
