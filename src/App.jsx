import { Route, Routes } from "react-router";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Home from "./components/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import NotFound from "./components/404page";

function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />

                {/* <Route path="/profile" element={<Profile />} />  */}
            </Routes>
            <Footer />
        </>
    );
}

export default App;
