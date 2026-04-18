// Модул: Контекст за автентикация и любими
// Описание: Управлява глобалното състояние на потребителя и „любими“ записи
//   в приложението. Осигурява синхронизация със Supabase сесии и метаданни.
// Вход: няма директни входни параметри; чете текущата сесия през Supabase.
// Изход: предоставя стойности и методи: { user, loading, favorites, isFavorite, toggleFavorite }.
// Поведение:
//   - При монтиране: извлича текущата сесия и метаданни (favorite_universities).
//   - Слуша събитията за промяна на сесията (login/logout) и актуализира state.
//   - Пази UI стабилен: рендерира деца само когато loading е false.
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const AuthContext = createContext({});

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
            }
        } catch {
            setFavorites(prev);
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
