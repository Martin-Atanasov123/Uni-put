import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Компонент, който автоматично превърта страницата до най-горната позиция
 * при промяна на маршрута (URL).
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
