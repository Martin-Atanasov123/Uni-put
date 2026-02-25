// Главен компонент на приложението: дефинира рутера, глобалните провайдъри и общия layout.
// Навигацията включва публични, защитени (изискват вход) и админ маршрути (изискват роля).
import { Route, Routes } from "react-router";
import { Suspense, lazy } from "react";

import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../routes/ProtectedRoute";

import NotFound from "../components/common/NotFound";
import Header from "../components/common/Header";
import Home from "../components/common/Home";
import Footer from "../components/common/Footer";

import AdminRoute from "../routes/AdminRoute";
import ScrollToTop from "../components/common/ScrollToTop";

const Login = lazy(() => import("../components/Auth/Login"));
const Register = lazy(() => import("../components/Auth/Register"));
const ForgotPassword = lazy(() => import("../components/Auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("../components/Auth/UpdatePassword"));
const About = lazy(() => import("../components/common/About"));
const UniversitiesPage = lazy(() => import("../components/Universities/Universities"));
const CareerAdvisor = lazy(() => import("../components/CareerAdvisor/CareerAdvisor"));
const TestCareer = lazy(() => import("../components/CareerAdvisor/TestCareer"));
const Dormitories = lazy(() => import("../components/Dormitories/Dormitories"));
const FavoritesPage = lazy(() => import("../components/Favorites/Favorites"));
const CalculatorPage = lazy(() => import("../components/Calculator/Calculator"));
const Profile = lazy(() => import("../components/Auth/Profile"));
const AdminDashboard = lazy(() => import("../components/admin/AdminDashboard"));

// Основен входен компонент – включва AuthProvider, ScrollToTop, Header, Footer и рутера.
function App() {
    return (
        <>
            <AuthProvider>
                <ScrollToTop />
                <Header />
                <main id="main" role="main">
                    <Routes>
                        {/* Публични маршрути */}
                        <Route path="*" element={<NotFound />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Suspense fallback={null}><Login /></Suspense>} />
                        <Route path="/register" element={<Suspense fallback={null}><Register /></Suspense>} />
                        <Route path="/forgot-password" element={<Suspense fallback={null}><ForgotPassword /></Suspense>} />
                        <Route path="/update-password" element={<Suspense fallback={null}><UpdatePassword /></Suspense>} />
                        <Route path="/about" element={<Suspense fallback={null}><About /></Suspense>} />
                        <Route
                            path="/universities"
                            element={<Suspense fallback={null}><UniversitiesPage /></Suspense>}
                        />
                        <Route
                            path="/career-advisor"
                            element={<Suspense fallback={null}><CareerAdvisor /></Suspense>}
                        />
                        <Route
                            path="/test-career"
                            element={<Suspense fallback={null}><TestCareer /></Suspense>}
                        />
                        <Route
                            path="/dormitories"
                            element={<Suspense fallback={null}><Dormitories /></Suspense>}
                        />
                        <Route
                            path="/favorites"
                            element={
                                <ProtectedRoute>
                                    <Suspense fallback={null}><FavoritesPage /></Suspense>
                                </ProtectedRoute>
                            }
                        />
                        
                        {/* Защитени маршрути (изискват вход) */}
                        <Route
                            path="/calculator"
                            element={
                                <ProtectedRoute>
                                    <Suspense fallback={null}><CalculatorPage /></Suspense>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Suspense fallback={null}><Profile /></Suspense>
                                </ProtectedRoute>
                            }
                        />
                        
                        {/* Админ маршрути (изискват админ роля) */}
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <Suspense fallback={null}><AdminDashboard /></Suspense>
                                </AdminRoute>
                            }
                        />
                    </Routes>
                </main>
                <Footer />
            </AuthProvider>
        </>
    );
}

export default App;

