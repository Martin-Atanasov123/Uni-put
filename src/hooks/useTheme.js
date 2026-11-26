import { useCallback, useEffect, useState } from "react";

const KEY = "uniput_theme";

const current = () => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
};

export function useTheme() {
    const [theme, setTheme] = useState(current);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "light" ? "#F6F8F5" : "#0F172A");
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((value) => {
            const next = value === "dark" ? "light" : "dark";
            try { localStorage.setItem(KEY, next); } catch { /* preference remains in memory */ }
            return next;
        });
    }, []);

    return { theme, toggle };
}
