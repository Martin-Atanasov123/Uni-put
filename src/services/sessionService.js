import { supabase } from "@/lib/supabase";

const clearClientState = () => {
    if (typeof window === "undefined") return;
    try {
        if (window.localStorage && typeof window.localStorage.clear === "function") {
            window.localStorage.clear();
        }
    } catch {
        return;
    }
    try {
        if (window.sessionStorage && typeof window.sessionStorage.clear === "function") {
            window.sessionStorage.clear();
        }
    } catch {
        return;
    }
};

const logout = async () => {
    await supabase.auth.signOut();
    clearClientState();
};

export const sessionService = {
    clearClientState,
    logout
};

