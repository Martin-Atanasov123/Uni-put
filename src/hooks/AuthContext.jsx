// Модул: Контекст за автентикация и любими
// Описание: Управлява глобалното състояние на потребителя и „любими“ записи.
//   Любимите работят и БЕЗ акаунт (localStorage) — сърцето дава стойност веднага,
//   а при вход/регистрация локалните любими се сливат в акаунта (loss-aversion →
//   регистрация, вместо стена пред функцията). CLAUDE.md §5/§12: favorites са
//   „единственият най-важен retention механизъм" — не бива да са зад login wall.
//
//   При вход/регистрация мигрираме и историята на калкулатора + RIASEC типа от
//   localStorage в акаунта (същият merge принцип като любимите) — без това
//   „Регистрирай се и резултатите ти ще те чакат" (Calculator.jsx/SignupPrompt)
//   е празно обещание: Profile.jsx досега четеше calculator_history САМО от
//   localStorage, дори за логнат потребител, значи нищо реално не се пазеше в
//   акаунта. Certainty principle — не обещавай синхронизация, която не правиш.
// Изход: { user, loading, favorites, isFavorite, toggleFavorite }.
//   toggleFavorite връща { added, anonymous } — UI слоят решава дали да покаже
//   покана за акаунт (само при анонимно ДОБАВЯНЕ).
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CALC_HISTORY_KEY, readLocalHistory, mergeCalculatorHistory } from "@/lib/calcHistory";

export const AuthContext = createContext({});

const ANON_FAVORITES_KEY = "uniput_anon_favorites";
const RIASEC_RESULT_KEY = "riasec_result";

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

    // Мигрира calculator_history + riasec_result от localStorage в акаунта.
    // Идемпотентно (merge по ключ, не append) — безопасно да се извиква при
    // всеки INITIAL_SESSION/SIGNED_IN, включително на всяко зареждане.
    const applyUserExtras = async (currentUser) => {
        const accountHistory = Array.isArray(currentUser?.user_metadata?.calculator_history)
            ? currentUser.user_metadata.calculator_history : [];
        const localHistory = readLocalHistory();
        const mergedHistory = mergeCalculatorHistory(accountHistory, localHistory);

        // riasec: не презаписваме вече запазен тип с по-стара локална гадка —
        // само попълваме, ако акаунтът още няма стойност.
        const accountRiasec = currentUser?.user_metadata?.riasec_type || null;
        const localRiasec = (() => { try { return localStorage.getItem(RIASEC_RESULT_KEY); } catch { return null; } })();
        const nextRiasec = accountRiasec || localRiasec || null;

        const historyChanged = JSON.stringify(mergedHistory) !== JSON.stringify(accountHistory);
        const riasecChanged = nextRiasec && nextRiasec !== accountRiasec;
        if (!historyChanged && !riasecChanged) return;

        try {
            const patch = {};
            if (historyChanged) patch.calculator_history = mergedHistory;
            if (riasecChanged) patch.riasec_type = nextRiasec;
            const { error } = await supabase.auth.updateUser({ data: patch });
            // Само след успешен sync огледаляваме мърджнатата история обратно в
            // localStorage — Calculator.jsx продължава да чете/пише оттам
            // директно, без промяна в него самия.
            if (!error && historyChanged) {
                try { localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(mergedHistory)); } catch { /* пълен storage */ }
            }
        } catch {
            /* мрежова грешка — локалните данни остават непокътнати за нов опит */
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) { applyUserFavorites(currentUser); applyUserExtras(currentUser); }
            else setFavorites(readLocalFavorites());
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) { applyUserFavorites(nextUser); applyUserExtras(nextUser); }
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
