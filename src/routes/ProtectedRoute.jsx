// Модул: Защитен маршрут
// Описание: Огражда компоненти, които са достъпни само за автентикирани потребители
//   (напр. калкулатор, профил). Предотвратява грешни пренасочвания и мигане.
// Вход: { children } - JSX за рендериране при налична сесия
// Изход: children ако има активен потребител; пренасочване към /login ако няма
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Докато не знаем дали има сесия, избягваме мигане на екрана и грешни пренасочвания.
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Зареждане...
            </div>
        );

    if (!user) {
        console.log("Access Denied - Redirecting to Login");
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

