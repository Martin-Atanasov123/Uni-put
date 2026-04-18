// Модул: Защитен маршрут
// Описание: Огражда компоненти, които са достъпни само за автентикирани потребители
//   (напр. калкулатор, профил). Предотвратява грешни пренасочвания и мигане.
// Вход: { children } - JSX за рендериране при налична сесия
// Изход: children ако има активен потребител; пренасочване към /login ако няма
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Докато не знаем дали има сесия, избягваме мигане на екрана и грешни пренасочвания.
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Зареждане...
            </div>
        );

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;

