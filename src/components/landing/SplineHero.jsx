import { useState, useEffect } from "react";

/**
 * SplineHero — uses the lightweight <spline-viewer> web component.
 * The script is loaded once in index.html — no React package overhead.
 * Desktop only (≥ 1024px). Fades in after the scene loads.
 */
export default function SplineHero({ style }) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 1024 : false
    );
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (isMobile) return;
        // spline-viewer fires a 'load' event on the custom element
        const el = document.querySelector("spline-viewer");
        if (!el) return;
        const onLoad = () => setIsLoaded(true);
        el.addEventListener("load", onLoad);
        // Fallback — show after 4s even if event doesn't fire
        const fallback = setTimeout(() => setIsLoaded(true), 4000);
        return () => {
            el.removeEventListener("load", onLoad);
            clearTimeout(fallback);
        };
    }, [isMobile]);

    if (isMobile) return null;

    return (
        <div
            aria-hidden
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
            }}
        >
            {/* Ambient glow while loading */}
            {!isLoaded && (
                <div style={{
                    position: "absolute",
                    inset: "20%",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(6,182,212,0.10) 0%, rgba(139,92,246,0.05) 55%, transparent 75%)",
                    filter: "blur(32px)",
                    animation: "sh-pulse 2.5s ease-in-out infinite",
                    pointerEvents: "none",
                    zIndex: 0,
                }} />
            )}

            {/* spline-viewer web component */}
            <div style={{
                width: "100%",
                height: "100%",
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.8s ease",
                pointerEvents: "none",
            }}>
                {/* eslint-disable-next-line react/no-unknown-property */}
                <spline-viewer
                    url="https://prod.spline.design/3XKralooURbgSKlH/scene.splinecode"
                    style={{ width: "100%", height: "100%", display: "block" }}
                />
            </div>

            <style>{`
                @keyframes sh-pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50%       { opacity: 1;   transform: scale(1.06); }
                }
            `}</style>
        </div>
    );
}
