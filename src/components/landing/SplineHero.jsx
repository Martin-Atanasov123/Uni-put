import { Suspense, lazy } from "react";

// Lazy-load the heavy Spline runtime — only loads when this component mounts
const Spline = lazy(() => import("@splinetool/react-spline"));

/**
 * Spline 3D scene used as the full-bleed hero background.
 * Renders behind all hero content (z-index 0).
 * Gradient masks fade it into the page on every edge.
 */
export default function SplineHero() {
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
            {/* The Spline canvas — fills the entire hero */}
            <Suspense fallback={null}>
                <Spline
                    scene="https://prod.spline.design/kg8OjUNE7hiPmPfZ/scene.splinecode"
                    style={{
                        width: "125%",
                        height: "100%",
                        pointerEvents: "none", // pure visual — don't block hero CTAs
                    }}
                />
            </Suspense>

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
