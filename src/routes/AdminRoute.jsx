// Модул: Админ маршрут
// Описание: Осигурява достъп до административни секции само за потребители
//   с роля "admin", дефинирана в app_metadata (не може да се променя от клиента).
// Вход: { children } - JSX за рендериране при налична админ роля
// Изход: children ако потребителят е администратор; 404 иначе (не разкрива съществуването на маршрута)
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <span className="loading loading-infinity loading-lg text-primary"></span>
        </div>
    );

    // Проверка за админ роля чрез app_metadata (защитена от клиентска промяна).
    // При отказ → 404 вместо "/" за да не се разкрива съществуването на admin панела.
    const isAdmin = user?.app_metadata?.role === "admin";

    if (!user || !isAdmin) {
        return <Navigate to="/not-found" replace />;
    }

    return children;
};

export default AdminRoute;

