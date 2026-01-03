import { Router, Route, Routes } from "react-router";
// import { useState } from "react";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

import NotFound from "./components/404page";
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";

import Calculator from "./components/Calculator/Calculator";
import Profile from "./components/Auth/Profile";

function App() {
    // const [session, setSession] = useState(null);
    return (
        <>
            <AuthProvider>
                <Header />
                <Routes>
                    <Route path="*" element={<NotFound />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/Calculator"
                        element={
                            <ProtectedRoute>
                                <Calculator />
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


                    {/* <Route path="/profile" element={<Profile />} />  */}
                </Routes>
                <Footer />
            </AuthProvider>
        </>
    );
}

export default App;
