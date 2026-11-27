import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { m, useReducedMotion, useScroll, useSpring } from "motion/react";

const EXPERIENCE_MAP = [
    { match: ["/universities", "/specialnosti", "/dormitories"], name: "discover", label: "Откриване" },
    { match: ["/calculator", "/dzi-strateg", "/priem-7-klas"], name: "decide", label: "Решение" },
    { match: ["/career-advisor", "/test-career"], name: "orient", label: "Ориентиране" },
    { match: ["/calendar", "/favorites", "/my-grades", "/profile"], name: "workspace", label: "Моето пространство" },
    { match: ["/about", "/privacy", "/terms"], name: "editorial", label: "УниПът" },
    { match: ["/login", "/register", "/forgot-password", "/update-password"], name: "auth", label: "Акаунт" },
];

function getExperience(pathname) {
    return EXPERIENCE_MAP.find(({ match }) => match.some((path) => pathname.startsWith(path)))
        || { name: "default", label: "УниПът" };
}

/**
 * Единен route-level визуален слой. Не скрива първото изрисуване и не променя
 * функционалните компоненти; добавя тема според задачата на страницата,
 * scroll progress и много лек section-transition ефект.
 */
export default function PremiumRouteFrame({ children }) {
    const { pathname } = useLocation();
    const reduced = useReducedMotion();
    const experience = useMemo(() => getExperience(pathname), [pathname]);
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 135, damping: 28, mass: 0.22 });

    return (
        <div className={`premium-route premium-route--${experience.name}`} data-experience={experience.name}>
            <m.div
                className="premium-route__progress"
                style={{ scaleX: reduced ? scrollYProgress : progress }}
                aria-hidden="true"
            />
            <div className="premium-route__atmosphere" aria-hidden="true">
                <span className="premium-route__orb premium-route__orb--a" />
                <span className="premium-route__orb premium-route__orb--b" />
                <span className="premium-route__mesh" />
                <span className="premium-route__signature">{experience.label}</span>
            </div>
            <m.div
                className="premium-route__content"
                initial={reduced ? false : { opacity: 0.72, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </m.div>
        </div>
    );
}
