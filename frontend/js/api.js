const API_BASE = "https://gamehub-backend-556939640766.us-central1.run.app/api";

/**
 * Función genérica para llamar a tu API.
 * @param {string} endpoint  - ej: "/games", "/games/1"
 * @param {string} method    - GET | POST | PUT | DELETE
 * @param {object} body      - datos para POST/PUT (opcional)
 * @returns {Promise<any>}
 */

/* Realiza una solicitud a la API */
async function apiRequest(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };

    // Agrega el user_id al header si hay sesión activa
    const userId = localStorage.getItem("user_id");
    if (userId) {
        options.headers["x-user-id"] = userId;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Error ${response.status}`);
    }

    // DELETE devuelve mensaje simple
    if (response.status === 204) return null;
    return response.json();
}

// Juegos 

/** Lista juegos con paginación y búsqueda opcional */
async function fetchGames({ page = 1, pageSize = 20, search = "" } = {}) {
    let url = `/games?page=${page}&page_size=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiRequest(url);
}

/** Nuevos lanzamientos */
async function fetchNewReleases({ page = 1, pageSize = 20 } = {}) {
    return apiRequest(`/games/new-releases?page=${page}&page_size=${pageSize}`);
}

/** Detalle de un juego por id interno */
async function fetchGameById(gameId) {
    return apiRequest(`/games/${gameId}`);
}

/** Importa un juego de RAWG a nuestra BD (POST) */
async function importGame(rawgId) {
    return apiRequest(`/games/import/${rawgId}`, "POST");
}

/** Actualiza un juego (PUT) */
async function updateGame(gameId, data) {
    return apiRequest(`/games/${gameId}`, "PUT", data);
}

/** Elimina un juego (DELETE) */
async function deleteGame(gameId) {
    return apiRequest(`/games/${gameId}`, "DELETE");
}

// Favoritos

/** Obtiene los juegos favoritos de un usuario */
async function fetchFavorites(userId) {
    return apiRequest(`/favorites/${userId}`);
}

/** Agrega un juego a los favoritos de un usuario */
async function addFavorite(userId, gameId) {
    return apiRequest("/favorites", "POST", { user_id: userId, game_id: gameId });
}

/** Elimina un juego de los favoritos de un usuario */
async function removeFavorite(favoriteId) {
    return apiRequest(`/favorites/${favoriteId}`, "DELETE");
}