import { Navigate } from "react-router-dom";
import { useAuth } from "/src/context/AuthContext";

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <span className="loading loading-infinity loading-lg text-primary"></span>
        </div>
    );
    
    // Проверка за админ роля
    const isAdmin = user?.user_metadata?.role === "admin";

    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
