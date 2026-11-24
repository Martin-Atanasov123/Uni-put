import { useCallback, useEffect, useState } from "react";

// Светла и тъмна тема. Първоначалната стойност се задава още в index.html (без
// проблясване): изборът от localStorage, иначе системната настройка.
// Докато потребителят не е избрал изрично, темата следва системата.
const KEY = "uniput_theme";

const readStored = () => {
    try {
        const t = localStorage.getItem(KEY);
        return t === "light" || t === "dark" ? t : null;
    } catch {
        return null;
    }
};

const systemTheme = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const current = () => {
    if (typeof document === "undefined") return "light";
    const t = document.documentElement.getAttribute("data-theme");
    return t === "dark" || t === "light" ? t : readStored() || systemTheme();
};

export function useTheme() {
    const [theme, setTheme] = useState(current);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "dark" ? "#0F1B1A" : "#F6F8F5");
    }, [theme]);

    // Без изричен избор — следвай промените в системата.
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mq) return;
        const onChange = () => { if (!readStored()) setTheme(mq.matches ? "dark" : "light"); };
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);

    const toggle = useCallback(() => {
        setTheme((t) => {
            const next = t === "dark" ? "light" : "dark";
            try { localStorage.setItem(KEY, next); } catch { /* частен прозорец — изборът важи до затваряне */ }
            return next;
        });
    }, []);

    return { theme, toggle };
}
