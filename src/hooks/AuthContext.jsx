// Модул: Контекст за автентикация и любими
// Описание: Управлява глобалното състояние на потребителя и „любими“ записи.
//   Любимите работят и БЕЗ акаунт (localStorage) — сърцето дава стойност веднага,
//   а при вход/регистрация локалните любими се сливат в акаунта (loss-aversion →
//   регистрация, вместо стена пред функцията). CLAUDE.md §5/§12: favorites са
//   „единственият най-важен retention механизъм" — не бива да са зад login wall.
// Изход: { user, loading, favorites, isFavorite, toggleFavorite }.
//   toggleFavorite връща { added, anonymous } — UI слоят решава дали да покаже
//   покана за акаунт (само при анонимно ДОБАВЯНЕ).
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const AuthContext = createContext({});

const ANON_FAVORITES_KEY = "uniput_anon_favorites";

// Bug fix: университи IDs в Supabase са UUID (string) / legacy bigint (number).
// Приемаме и двете (non-empty string или positive finite number).
const normalizeFavoriteIds = (arr) =>
    (arr || []).filter((id) =>
        (typeof id === "string" && id.length > 0) ||
        (typeof id === "number" && Number.isFinite(id) && id > 0)
    );

const readLocalFavorites = () => {
    try {
        return normalizeFavoriteIds(JSON.parse(localStorage.getItem(ANON_FAVORITES_KEY) || "[]"));
    } catch {
        return [];
    }
};

const writeLocalFavorites = (arr) => {
    try {
        localStorage.setItem(ANON_FAVORITES_KEY, JSON.stringify(arr));
    } catch {
        /* localStorage недостъпен / пълен — игнорираме */
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);

    // Прилага любимите за логнат потребител, като СЛИВА евентуалните анонимни
    // (localStorage) любими в акаунта. Идемпотентно: чисти local само при успех,
    // затова повторно извикване (INITIAL_SESSION + SIGNED_IN) не дублира.
    const applyUserFavorites = async (currentUser) => {
        const account = normalizeFavoriteIds(currentUser?.user_metadata?.favorite_universities);
        const local = readLocalFavorites();
        if (local.length === 0) {
            setFavorites(account);
            return;
        }
        const merged = [...new Set([...account, ...local])];
        setFavorites(merged); // оптимистично — показваме слятото веднага
        try {
            const { error } = await supabase.auth.updateUser({
                data: { favorite_universities: merged },
            });
            if (!error) writeLocalFavorites([]); // изчистваме local чак след успешен sync
        } catch {
            /* мрежова грешка — пазим local за нов опит при следващо зареждане */
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) applyUserFavorites(currentUser);
            else setFavorites(readLocalFavorites());
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) applyUserFavorites(nextUser);
            else setFavorites(readLocalFavorites());
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Записва в акаунта (само при логнат). При грешка връща предишното състояние.
    const updateAccountFavorites = async (nextFavorites) => {
        const prev = favorites;
        setFavorites(nextFavorites);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { favorite_universities: nextFavorites },
            });
            if (error) setFavorites(prev);
        } catch {
            setFavorites(prev);
        }
    };

    const isFavorite = (id) => favorites.includes(id);

    /**
     * Добавя/маха любима. Работи и без акаунт (localStorage).
     * @returns {{ added: boolean, anonymous: boolean }} — за да реши UI дали да
     *   покаже покана за акаунт (само при анонимно добавяне).
     */
    const toggleFavorite = async (id) => {
        const exists = favorites.includes(id);
        const next = exists ? favorites.filter((x) => x !== id) : [...favorites, id];
        if (user) {
            await updateAccountFavorites(next);
        } else {
            setFavorites(next);
            writeLocalFavorites(next);
        }
        return { added: !exists, anonymous: !user };
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
 * Хук за достъп до контекста на автентикация и любими.
 * @returns {{ user: object|null, loading: boolean, favorites: string[], isFavorite: (id: string) => boolean, toggleFavorite: (id: string) => Promise<{added:boolean,anonymous:boolean}> }}
 */
export const useAuth = () => useContext(AuthContext);
