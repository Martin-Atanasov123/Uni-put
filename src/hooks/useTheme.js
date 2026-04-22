import { useState, useEffect } from "react";

// "dark" → DaisyUI "dark" theme
// "light" → DaisyUI "nord" theme (light)
const DAISYUI_MAP = { dark: "dark", light: "nord" };

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem("uniput_theme");
            if (saved) return saved;
            return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        // Set DaisyUI-compatible theme on <html> so both DaisyUI
        // classes AND our custom CSS variables respond correctly
        document.documentElement.setAttribute("data-theme", DAISYUI_MAP[theme]);
        try {
            localStorage.setItem("uniput_theme", theme);
        } catch {}
    }, [theme]);

    const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));

    return { theme, toggle };
}
