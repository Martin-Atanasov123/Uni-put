import { useEffect } from "react";

// Light theme премахната по UX решение — продуктът е изцяло dark mode.
// Hook-ът се запазва за backward compat (компоненти, които still го викат),
// но винаги връща "dark" и принудително форсира data-theme="dark" на mount.
export function useTheme() {
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", "dark");
        // Cleanup на стар theme preference от localStorage (ако е "light")
        try { localStorage.removeItem("uniput_theme"); } catch { /* noop */ }
    }, []);

    return { theme: "dark", toggle: () => { /* noop — theme toggle премахнат */ } };
}
