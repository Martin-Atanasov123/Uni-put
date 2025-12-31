import daisyui from "daisyui"

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        daisyui, // Ползваме импортираната променлива тук
    ],
    daisyui: {
        themes: ["light", "dark", "cupcake", "emerald", "retro"],
    },
}
