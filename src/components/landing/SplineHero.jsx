import { Suspense, lazy, useState, useEffect } from "react";

// Lazy-load the heavy Spline runtime — only loads when this component mounts
const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Spline 3D scene used as the full-bleed hero background.
 * Renders behind all hero content (z-index 0).
 * Gradient masks fade it into the page on every edge.
 *
 * Performance optimizations:
 * - Only loads on desktop (width ≥ 1024px)
 * - Lazy-loaded component wrapped in Suspense
 * - Loading fallback shows subtle gradient instead of blank
 * - Fade-in animation after scene loads
 */
export default function SplineHero() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Don't load Spline on mobile — saves ~200KB bundle + render time
    if (isMobile) return null;

    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
            }}
        >
            {/* Loading fallback — subtle animated gradient while Spline initializes */}
            {!isLoaded && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.03))",
                        animation: "pulse-gradient 3s ease-in-out infinite",
                    }}
                />
            )}

            {/* The Spline canvas — fills the entire hero */}
            <Suspense fallback={null}>
                <div
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: "opacity 0.6s ease",
                    }}
                >
                    <Spline
                        scene="https://prod.spline.design/SUVrHf-954oP3SsO/scene.splinecode"
                        onLoad={() => setIsLoaded(true)}
                        style={{
                            width: "125%",
                            height: "100%",
                            pointerEvents: "none", // pure visual — don't block hero CTAs
                        }}
                    />
                </div>
            </Suspense>

            {/* Animation keyframes */}
            <style>{`
                @keyframes pulse-gradient {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
            `}</style>

            {/* ── Gradient masks — fade scene into the page ─────────────────────── */}

            {/* Bottom — strong fade into next section */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "55%",
                    background:
                        "linear-gradient(to bottom, transparent 0%, var(--brand-bg) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Left — protect text readability */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "55%",
                    background:
                        "linear-gradient(to right, var(--brand-bg) 10%, rgba(15,23,42,0.7) 50%, transparent 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Top — subtle fade from nav */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "20%",
                    background:
                        "linear-gradient(to bottom, var(--brand-bg) 0%, transparent 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Right edge */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: "18%",
                    background:
                        "linear-gradient(to left, var(--brand-bg) 0%, transparent 100%)",
                    pointerEvents: "none",
                }}
            />
        </div>
    );
}
