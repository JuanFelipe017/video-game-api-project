// Lógica principal para index.html: carga de juegos populares, nuevos lanzamientos, manejo de sesión y búsqueda
const popularContainer  = document.getElementById("popular-games-container");
const releasesContainer = document.getElementById("new-releases-container");
const searchInput       = document.getElementById("search-input");
const navLogin          = document.getElementById("nav-login");

// Estado de la aplicación
// Si hay un usuario logueado, cambia "Login" por su nombre en el nav

/* Actualiza el nav para mostrar el nombre del usuario si hay sesión activa */
function updateNav() {
    const username = localStorage.getItem("username");
    if (username && navLogin) {
        navLogin.textContent = username;
        navLogin.href = "favorites.html";
    }
}

// Renderizado de juegos

/* Crea una card para un juego */
function createGameCard(game) {
    const card = document.createElement("div");
    card.className = "game-card";

    const img     = game.background_image || "https://via.placeholder.com/400x200?text=No+Image";
    const rating  = game.rating ? game.rating.toFixed(1) : "N/A";
    const genres  = game.genres?.map(g => g.name).join(", ") || "Sin género";

    card.innerHTML = `
        <img src="${img}" alt="${game.name}" loading="lazy">
        <div class="game-overlay">
            <h3>${game.name}</h3>
            <p class="game-rating">⭐ ${rating}</p>
            <p class="game-genres" style="font-size:12px; color:#aaa; margin:4px 0 8px;">${genres}</p>
            <div class="overlay-buttons">
                <button class="btn btn-yellow favorite-btn" data-game-id="${game.id}">Favorito</button>
                <button class="btn btn-green details-btn" data-game-id="${game.id}">Detalles</button>
            </div>
        </div>
    `;

    // Botón favorito
    card.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleFavorite(game.id);
    });

    // Botón detalles → lleva a games.html buscando ese juego
    card.querySelector(".details-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `games.html?id=${game.id}`;
    });

    return card;
}

// Renderiza una sección de juegos (populares o lanzamientos) con un mensaje si no hay resultados

/* Renderiza una sección de juegos en el contenedor dado */
function renderSection(container, games) {
    container.innerHTML = "";

    if (!games || games.length === 0) {
        container.innerHTML = `<p style="color:#aaa; grid-column:1/-1;">No se encontraron juegos.</p>`;
        return;
    }

    games.forEach(game => container.appendChild(createGameCard(game)));
}

/* Renderiza un mensaje de error en el contenedor dado */
function renderError(container, message) {
    container.innerHTML = `
        <p style="color:#e74c3c; grid-column:1/-1; padding:20px 0;">
            ⚠️ ${message}
        </p>`;
}

// Favoritos

/* Maneja la adición de un juego a favoritos */
async function handleFavorite(gameId) {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        requireLoginToast();
        return;
    }
    try {
        await addFavorite(Number(userId), gameId);
        toast.success("¡Favorito agregado!", "El juego se guardó en tu lista ⭐");
    } catch (err) {
        toast.error("Error", err.message);
    }
}

// Busqueda de juegos: al escribir en el input, espera 500ms y redirige a games.html con el query

/* Maneja la búsqueda de juegos desde el input */
let searchTimeout;
searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length > 1) {
            window.location.href = `games.html?search=${encodeURIComponent(query)}`;
        }
    }, 500);
});

// Carga de juegos populares y nuevos lanzamientos al iniciar la página

/* Carga de los juegos populares */
async function loadPopularGames() {
    try {
        const data = await fetchGames({ page: 1, pageSize: 6 });
        renderSection(popularContainer, data.results);
    } catch (err) {
        renderError(popularContainer, "No se pudieron cargar los juegos populares.");
        console.error(err);
    }
}

/* Carga de los nuevos lanzamientos */
async function loadNewReleases() {
    try {
        const data = await fetchNewReleases({ page: 1, pageSize: 6 });
        renderSection(releasesContainer, data.results);
    } catch (err) {
        renderError(releasesContainer, "No se pudieron cargar los lanzamientos.");
        console.error(err);
    }
}

// Interceptar clic en Favoritos si no hay sesión

/* Muestra un toast indicando que se requiere login para agregar favoritos */
document.getElementById("nav-favorites")?.addEventListener("click", (e) => {
    if (!localStorage.getItem("user_id")) {
        e.preventDefault();
        requireLoginToast();
    }
});

// Actualizar nav y cargar datos al iniciar la página
updateNav();
loadPopularGames();
loadNewReleases();