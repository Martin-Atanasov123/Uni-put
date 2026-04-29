import { Route, Routes, useLocation } from "react-router";
import { Suspense, lazy } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";

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
const MyGradesPage    = lazy(() => import("@/components/MyGrades/MyGrades"));

function PageWrap({ children }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </m.div>
    );
}

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
    const location = useLocation();
    return (
        <GlobalErrorBoundary>
            <LazyMotion features={domAnimation}>
                <AuthProvider>
                    <ScrollToTop />
                    <Header />
                    <main id="main" role="main">
                        <Suspense fallback={<PageLoader />}>
                            <AnimatePresence mode="wait">
                                <Routes location={location} key={location.pathname}>
                                    {/* Публични маршрути */}
                                    <Route path="*" element={<PageWrap><NotFound /></PageWrap>} />
                                    <Route path="/" element={<PageWrap><Home /></PageWrap>} />
                                    <Route path="/login" element={<PageWrap><Login /></PageWrap>} />
                                    <Route path="/register" element={<PageWrap><Register /></PageWrap>} />
                                    <Route path="/forgot-password" element={<PageWrap><ForgotPassword /></PageWrap>} />
                                    <Route path="/update-password" element={<PageWrap><UpdatePassword /></PageWrap>} />
                                    <Route path="/about" element={<PageWrap><About /></PageWrap>} />
                                    <Route path="/terms" element={<PageWrap><TermsOfService /></PageWrap>} />
                                    <Route path="/privacy" element={<PageWrap><PrivacyPolicy /></PageWrap>} />
                                    <Route path="/universities" element={<PageWrap><UniversitiesPage /></PageWrap>} />
                                    <Route path="/career-advisor" element={
                                        <PageWrap><GlobalErrorBoundary><CareerAdvisor /></GlobalErrorBoundary></PageWrap>
                                    } />
                                    <Route path="/test-career" element={
                                        <PageWrap><GlobalErrorBoundary><TestCareer /></GlobalErrorBoundary></PageWrap>
                                    } />
                                    <Route path="/dormitories" element={<PageWrap><Dormitories /></PageWrap>} />
                                    <Route path="/favorites" element={
                                        <PageWrap><ProtectedRoute><FavoritesPage /></ProtectedRoute></PageWrap>
                                    } />
                                    {/* Калкулаторът е публичен — CLAUDE.md: "Never put a login wall between a user and their first calculator result" */}
                                    <Route path="/calculator" element={
                                        <PageWrap><GlobalErrorBoundary><CalculatorPage /></GlobalErrorBoundary></PageWrap>
                                    } />
                                    <Route path="/my-grades" element={
                                        <PageWrap><MyGradesPage /></PageWrap>
                                    } />
                                    <Route path="/profile" element={
                                        <PageWrap><ProtectedRoute><Profile /></ProtectedRoute></PageWrap>
                                    } />
                                    {/* Админ маршрути (изискват админ роля) */}
                                    <Route path="/admin" element={
                                        <PageWrap>
                                            <AdminRoute>
                                                <GlobalErrorBoundary><AdminDashboard /></GlobalErrorBoundary>
                                            </AdminRoute>
                                        </PageWrap>
                                    } />
                                    <Route path="/admin/reports" element={
                                        <PageWrap>
                                            <AdminRoute>
                                                <GlobalErrorBoundary><AdminReports /></GlobalErrorBoundary>
                                            </AdminRoute>
                                        </PageWrap>
                                    } />
                                </Routes>
                            </AnimatePresence>
                        </Suspense>
                    </main>
                    <Footer />
                </AuthProvider>
            </LazyMotion>
        </GlobalErrorBoundary>
    );
}

export default App;
