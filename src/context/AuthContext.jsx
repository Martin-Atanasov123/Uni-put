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
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        // 1. Провери текущата сесия при зареждане
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setFavorites(
                (currentUser?.user_metadata?.favorite_universities || []).filter(
                    (id) => typeof id === "string" && id.length > 0
                )
            );
            setLoading(false);
        });

        // 2. Слушай за промени (Login/Logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            setFavorites(
                (nextUser?.user_metadata?.favorite_universities || []).filter(
                    (id) => typeof id === "string" && id.length > 0
                )
            );
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateFavorites = async (nextFavorites) => {
        if (!user) return;
        const prev = favorites;
        setFavorites(nextFavorites);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { favorite_universities: nextFavorites },
            });
            if (error) {
                setFavorites(prev);
                // eslint-disable-next-line no-console
                console.error("[favorites] updateUser failed", error);
            }
        } catch (e) {
            setFavorites(prev);
            // eslint-disable-next-line no-console
            console.error("[favorites] unexpected error", e);
        }
    };

    const isFavorite = (id) => favorites.includes(id);

    const toggleFavorite = async (id) => {
        if (!user) return;
        const exists = favorites.includes(id);
        const next = exists
            ? favorites.filter((x) => x !== id)
            : [...favorites, id];
        await updateFavorites(next);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, favorites, isFavorite, toggleFavorite }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

/**
 * Хук за достъп до контекста на автентикация и любими
 * @returns {{ user: object|null, loading: boolean, favorites: string[], isFavorite: (id: string) => boolean, toggleFavorite: (id: string) => Promise<void> }}
 */
export const useAuth = () => useContext(AuthContext);
