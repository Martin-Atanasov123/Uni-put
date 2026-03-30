// Модул: Контекст за автентикация и любими
// Описание: Управлява глобалното състояние на потребителя и „любими“ записи
//   в приложението. Осигурява синхронизация със Supabase сесии и метаданни.
// Вход: няма директни входни параметри; чете текущата сесия през Supabase.
// Изход: предоставя стойности и методи: { user, loading, favorites, isFavorite, toggleFavorite }.
// Поведение:
//   - При монтиране: извлича текущата сесия и метаданни (favorite_universities).
//   - Слуша събитията за промяна на сесията (login/logout) и актуализира state.
//   - Пази UI стабилен: рендерира деца само когато loading е false.
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext";

/**
 * Провайдър за автентикация и управление на потребителски предпочитания.
 * Капсулира логиката за сесии на Supabase и синхронизация на метаданни.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Дъщерни компоненти
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        // 1. Първоначална проверка на сесията
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            // Извличаме любимите от потребителските метаданни
            setFavorites(
                (currentUser?.user_metadata?.favorite_universities || []).filter(
                    (id) => typeof id === "string" && id.length > 0
                )
            );
            setLoading(false);
        });

        // 2. Абониране за събития (LOGIN, SIGN_OUT, TOKEN_REFRESHED и др.)
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

    /**
     * Вътрешна функция за синхронизация на любими със Supabase Auth метаданни.
     * @async
     * @param {string[]} nextFavorites - Новият списък с любими
     */
    const updateFavorites = async (nextFavorites) => {
        if (!user) return;
        const prev = favorites;
        setFavorites(nextFavorites); // Optimistic UI update
        try {
            const { error } = await supabase.auth.updateUser({
                data: { favorite_universities: nextFavorites },
            });
            if (error) {
                setFavorites(prev); // Rollback при грешка
                console.error("[favorites] updateUser failed", error);
            }
        } catch (e) {
            setFavorites(prev);
            console.error("[favorites] unexpected error", e);
        }
    };

    /**
     * Проверява дали даден запис е маркиран като любим.
     * @param {string} id - ID на записа
     * @returns {boolean}
     */
    const isFavorite = (id) => favorites.includes(id);

    /**
     * Превключва състоянието на "любим" за дадено ID.
     * Изисква автентикиран потребител.
     * @async
     * @param {string} id - ID на записа
     */
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
