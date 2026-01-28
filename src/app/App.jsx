import { Route, Routes } from "react-router";

import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../routes/ProtectedRoute";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";

import NotFound from "../components/common/NotFound";
import Header from "../components/common/Header";
import Home from "../components/common/Home";
import Footer from "../components/common/Footer";

import CalculatorPage from "../components/Calculator/Calculator";
import UniversitiesPage from "../components/Universities/Universities";
import Profile from "../components/Auth/Profile";
import AdminRoute from "../routes/AdminRoute";
import AdminDashboard from "../components/admin/AdminDashboard";

import CareerAdvisor from "../components/CareerAdvisor/CareerAdvisor";
import TestCareer from "../components/CareerAdvisor/TestCareer";
import ScrollToTop from "../components/common/ScrollToTop";

function App() {
    return (
        <>
            <AuthProvider>
                <ScrollToTop />
                <Header />
                <Routes>
                    {/* Публични маршрути */}
                    <Route path="*" element={<NotFound />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/universities"
                        element={<UniversitiesPage />}
                    />
                    <Route
                        path="/career-advisor"
                        element={<CareerAdvisor />}
                    />
                    <Route
                        path="/test-career"
                        element={<TestCareer />}
                    />
                    
                    {/* Защитени маршрути (изискват вход) */}
                    <Route
                        path="/calculator"
                        element={
                            <ProtectedRoute>
                                <CalculatorPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Админ маршрути (изискват админ роля) */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />
                </Routes>
                <Footer />
            </AuthProvider>
        </>
    );
}

export default App;

