/**
 * Помощни функции за работа с любими елементи.
 * Всички функции са чисти (без странични ефекти) и не говорят директно със Supabase.
 */

/**
 * Връща нов масив с добавен favoriteId, ако не съществува вече.
 * @param {string[]} favorites
 * @param {string} favoriteId
 * @returns {string[]}
 */
export const addFavoriteId = (favorites, favoriteId) => {
    if (favorites.includes(favoriteId)) return favorites;
    return [...favorites, favoriteId];
};

/**
 * Връща нов масив без подадения favoriteId.
 * @param {string[]} favorites
 * @param {string} favoriteId
 * @returns {string[]}
 */
export const removeFavoriteId = (favorites, favoriteId) => {
    return favorites.filter((id) => id !== favoriteId);
};

/**
 * Превключва даден favoriteId – ако го има, го маха, ако го няма, го добавя.
 * @param {string[]} favorites
 * @param {string} favoriteId
 * @returns {string[]}
 */
export const toggleFavoriteId = (favorites, favoriteId) => {
    if (favorites.includes(favoriteId)) {
        return favorites.filter((id) => id !== favoriteId);
    }
    return [...favorites, favoriteId];
};

