import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Компонент, който автоматично превърта страницата до най-горната позиция
 * при промяна на маршрута (URL). При #котва превърта до нея.
 */
const ScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!hash) return;
        // Lazy страниците още ги няма в DOM при смяната на маршрута — търсим
        // котвата до ~2 s. setTimeout, не requestAnimationFrame: rAF спира в
        // скрит таб (напр. линк, отворен във фонов таб).
        const id = decodeURIComponent(hash.slice(1));
        let tries = 0;
        let timer;
        const seek = () => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView();
            else if (tries++ < 40) timer = setTimeout(seek, 50);
        };
        seek();
        return () => clearTimeout(timer);
    }, [pathname, hash]);

    return null;
};

export default ScrollToTop;
