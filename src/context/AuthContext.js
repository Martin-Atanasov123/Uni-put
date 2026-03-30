import { createContext } from "react";

/**
 * @typedef {Object} AuthContextType
 * @property {Object|null} user - Текущият логнат потребител от Supabase Auth
 * @property {boolean} loading - Флаг, указващ дали сесията се зарежда в момента
 * @property {string[]} favorites - Масив от ID-та на любими университети/специалности
 * @property {function(string): boolean} isFavorite - Проверява дали дадено ID е в любими
 * @property {function(string): Promise<void>} toggleFavorite - Добавя/премахва ID от любими
 */

/**
 * Контекст за автентикация и потребителски предпочитания.
 */
export const AuthContext = createContext({});
