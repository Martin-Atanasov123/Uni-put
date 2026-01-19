import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Докато проверяваме, не правим нищо (или показваме Spinner)
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

