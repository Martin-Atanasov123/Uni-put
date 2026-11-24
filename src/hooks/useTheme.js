import { useCallback, useEffect, useState } from "react";

// Светла (по подразбиране) и тъмна тема. Сменя се само с бутона в хедъра;
// изборът се пази в localStorage. Първоначалната стойност се задава още в
// index.html, за да няма проблясване.
const KEY = "uniput_theme";

const current = () => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
};

export function useTheme() {
    const [theme, setTheme] = useState(current);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "dark" ? "#0F1B1A" : "#F6F8F5");
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((t) => {
            const next = t === "dark" ? "light" : "dark";
            try { localStorage.setItem(KEY, next); } catch { /* частен прозорец — изборът важи до затваряне */ }
            return next;
        });
    }, []);

    return { theme, toggle };
}
