import { useContext } from "react";
import { AuthContext } from "./AuthContext";

/**
 * Хук за лесен достъп до контекста на автентикация и любими.
 * @returns {import("../context/AuthContext").AuthContextType}
 */
export const useAuth = () => useContext(AuthContext);
