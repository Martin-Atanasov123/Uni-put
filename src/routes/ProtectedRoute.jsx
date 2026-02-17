// Пази маршрути, които имат смисъл само за логнати потребители
// (например калкулатора и профила). Предпоставка за коректна бизнес логика.
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

