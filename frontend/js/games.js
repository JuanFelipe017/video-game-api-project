// Maneja la página principal de juegos: carga, renderizado, búsqueda y favoritos.
let currentPage = 1;
const PAGE_SIZE  = 20;
let currentSearch = "";
let isLoading    = false;

// Refencias a elementos del DOM
const gamesContainer = document.getElementById("games-container");
const searchInput    = document.querySelector(".search-bar input");
const loadMoreBtn    = document.getElementById("load-more-btn");

// Renderizado de juegos

/* Renderiza las estrellas para un rating */
function renderStars(rating) {
    const full  = Math.floor(rating);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
}

/* Crea una card para un juego */
function createGameCard(game) {
    const card = document.createElement("div");
    card.className = "game-card";
    card.dataset.id = game.id;

    const genres    = game.genres?.map(g => g.name).join(", ") || "Sin género";
    const platforms = game.platforms?.map(p => p.name).join(", ") || "";
    const rating    = game.rating ? game.rating.toFixed(1) : "N/A";
    const stars     = game.rating ? renderStars(Math.round(game.rating)) : "";
    const img       = game.background_image || "https://via.placeholder.com/400x200?text=No+Image";

    card.innerHTML = `
        <img src="${img}" alt="${game.name}" loading="lazy">
        <div class="game-overlay">
            <h3>${game.name}</h3>
            <p class="game-rating">${stars} ${rating}</p>
            <p class="game-genres">${genres}</p>
            <div class="overlay-buttons">
                <button class="btn btn-yellow favorite-btn" data-game-id="${game.id}">
                    ⭐ Favorito
                </button>
                <button class="btn btn-green details-btn" data-game-id="${game.id}">
                    Detalles
                </button>
            </div>
        </div>
    `;

    // Botón favorito
    card.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleAddFavorite(game.id);
    });

    // Botón detalles → redirige a detalle del juego
    card.querySelector(".details-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `game-detail.html?id=${game.id}`;
    });

    return card;
}

/* Renderiza los juegos en el contenedor */
function renderGames(games, append = false) {
    if (!append) gamesContainer.innerHTML = "";

    if (!games.length && !append) {
        gamesContainer.innerHTML = `
            <p style="color:#aaa; grid-column:1/-1; text-align:center; padding:40px 0;">
                No se encontraron juegos.
            </p>`;
        return;
    }

    games.forEach(game => gamesContainer.appendChild(createGameCard(game)));
}

// Carga de juegos con paginación y búsqueda

/* Carga los juegos según la página actual y el término de búsqueda */
async function loadGames(append = false) {
    if (isLoading) return;
    isLoading = true;
    if (loadMoreBtn) loadMoreBtn.textContent = "Cargando...";

    try {
        const data = await fetchGames({
            page:     currentPage,
            pageSize: PAGE_SIZE,
            search:   currentSearch,
        });
        renderGames(data.results, append);

        // Ocultar "cargar más" si no hay más resultados
        if (loadMoreBtn) {
            loadMoreBtn.style.display =
                data.results.length < PAGE_SIZE ? "none" : "block";
            loadMoreBtn.textContent = "Cargar más";
        }
    } catch (err) {
        gamesContainer.innerHTML = `
            <p style="color:#e74c3c; grid-column:1/-1; text-align:center; padding:40px 0;">
                Error al cargar juegos: ${err.message}
            </p>`;
    } finally {
        isLoading = false;
    }
}

// Favoritos

/* Maneja la adición de un juego a favoritos */
async function handleAddFavorite(gameId) {
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

// Busqueda para cargar juegos según lo que el usuario escriba, con debounce para no saturar la API

/* Maneja la búsqueda de juegos */
let searchTimeout;
searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage   = 1;
        loadGames(false);
    }, 400); // espera 400ms para no hacer request en cada letra
});

// Cargar más juegos al hacer click en el botón

/* Maneja la carga de más juegos */
loadMoreBtn?.addEventListener("click", () => {
    currentPage++;
    loadGames(true); // append = true para agregar al grid
});

// Interceptar clic en Favoritos si no hay sesión

/* Muestra un toast indicando que se requiere login para agregar favoritos */
document.getElementById("nav-favorites")?.addEventListener("click", (e) => {
    if (!localStorage.getItem("user_id")) {
        e.preventDefault();
        requireLoginToast();
    }
});

// Cargar juegos al iniciar la página
loadGames();