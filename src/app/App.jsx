import { Route, Routes } from "react-router";
import { Suspense, lazy } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

import { AuthProvider } from "@/hooks/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import GlobalErrorBoundary from "@/components/common/GlobalErrorBoundary";

import AdminRoute from "@/routes/AdminRoute";
import ScrollToTop from "@/components/common/ScrollToTop";

const Home            = lazy(() => import("@/components/common/Home"));
const NotFound        = lazy(() => import("@/components/common/NotFound"));
const Login           = lazy(() => import("@/components/Auth/Login"));
const Register        = lazy(() => import("@/components/Auth/Register"));
const ForgotPassword  = lazy(() => import("@/components/Auth/ForgotPassword"));
const UpdatePassword  = lazy(() => import("@/components/Auth/UpdatePassword"));
const About           = lazy(() => import("@/components/common/About"));
const UniversitiesPage= lazy(() => import("@/components/Universities/Universities"));
const CareerAdvisor   = lazy(() => import("@/components/CareerAdvisor/CareerAdvisor"));
const TestCareer      = lazy(() => import("@/components/CareerAdvisor/TestCareer"));
const Dormitories     = lazy(() => import("@/components/Dormitories/Dormitories"));
const FavoritesPage   = lazy(() => import("@/components/Favorites/Favorites"));
const CalculatorPage  = lazy(() => import("@/components/Calculator/Calculator"));
const Profile         = lazy(() => import("@/components/Auth/Profile"));
const AdminDashboard  = lazy(() => import("@/components/admin/AdminDashboard"));
const AdminReports    = lazy(() => import("@/components/admin/AdminReports"));
const TermsOfService  = lazy(() => import("@/components/common/TermsOfService"));
const PrivacyPolicy   = lazy(() => import("@/components/common/PrivacyPolicy"));

function PageLoader() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', background: 'var(--brand-bg)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%',
                          border: '3px solid var(--brand-border)',
                          borderTopColor: 'var(--brand-cyan)',
                          animation: 'spin 0.7s linear infinite' }} />
        </div>
    );
}

function App() {
    return (
        <GlobalErrorBoundary>
            <LazyMotion features={domAnimation}>
                <AuthProvider>
                    <ScrollToTop />
                    <Header />
                    <main id="main" role="main">
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                {/* Публични маршрути */}
                                <Route path="*" element={<NotFound />} />
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/update-password" element={<UpdatePassword />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/universities" element={<UniversitiesPage />} />
                                <Route path="/career-advisor" element={
                                    <GlobalErrorBoundary><CareerAdvisor /></GlobalErrorBoundary>
                                } />
                                <Route path="/test-career" element={
                                    <GlobalErrorBoundary><TestCareer /></GlobalErrorBoundary>
                                } />
                                <Route path="/dormitories" element={<Dormitories />} />
                                <Route path="/favorites" element={
                                    <ProtectedRoute><FavoritesPage /></ProtectedRoute>
                                } />
                                {/* Калкулаторът е публичен — CLAUDE.md: "Never put a login wall between a user and their first calculator result" */}
                                <Route path="/calculator" element={
                                    <GlobalErrorBoundary><CalculatorPage /></GlobalErrorBoundary>
                                } />
                                <Route path="/profile" element={
                                    <ProtectedRoute><Profile /></ProtectedRoute>
                                } />
                                {/* Админ маршрути (изискват админ роля) */}
                                <Route path="/admin" element={
                                    <AdminRoute>
                                        <GlobalErrorBoundary><AdminDashboard /></GlobalErrorBoundary>
                                    </AdminRoute>
                                } />
                                <Route path="/admin/reports" element={
                                    <AdminRoute>
                                        <GlobalErrorBoundary><AdminReports /></GlobalErrorBoundary>
                                    </AdminRoute>
                                } />
                            </Routes>
                        </Suspense>
                    </main>
                    <Footer />
                </AuthProvider>
            </LazyMotion>
        </GlobalErrorBoundary>
    );
}

export default App;
