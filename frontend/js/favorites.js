// Maneja la página de favoritos: carga, renderizado y eliminación de favoritos.
const favoritesContainer = document.getElementById("favorites-container");
const emptyMsg           = document.getElementById("empty-msg");

// Verificar sesión al cargar la página, si no hay redirige a login.html
requireAuth(); // redirige a login.html si no hay sesión

const userId   = localStorage.getItem("user_id");
const username = localStorage.getItem("username");

// Mostrar nombre del usuario en el título
const titleEl = document.getElementById("favorites-title");
if (titleEl && username) titleEl.textContent = `Favoritos de ${username}`;

// Renderizar cada favorito como una card con imagen, nombre, rating y botones de detalles y eliminar

/* Crea una card para un favorito */
function createFavoriteCard(fav) {
    const game  = fav.game;
    const card  = document.createElement("div");
    card.className = "game-card";
    card.dataset.favoriteId = fav.id;

    const img    = game.background_image || "https://via.placeholder.com/400x200?text=No+Image";
    const rating = game.rating ? game.rating.toFixed(1) : "N/A";

    card.innerHTML = `
        <img src="${img}" alt="${game.name}" loading="lazy">
        <div class="game-overlay">
            <h3>${game.name}</h3>
            <p class="game-rating">⭐ ${rating}</p>
            <p style="font-size:12px; color:#aaa; margin: 4px 0 8px;">
                ${game.released ? game.released : "Fecha desconocida"}
            </p>
            <div class="overlay-buttons">
                <button class="btn btn-green details-btn" data-game-id="${fav.game_id}">
                    Detalles
                </button>
                <button class="btn btn-yellow remove-btn" data-favorite-id="${fav.id}">
                    🗑 Quitar
                </button>
            </div>
        </div>
    `;

    card.querySelector(".details-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `games.html?id=${fav.game_id}`;
    });

    card.querySelector(".remove-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await handleRemoveFavorite(fav.id, card);
    });

    return card;
}

/* Renderiza los favoritos en el contenedor */
function renderFavorites(favorites) {
    favoritesContainer.innerHTML = "";

    if (!favorites || favorites.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    favorites.forEach(fav => favoritesContainer.appendChild(createFavoriteCard(fav)));
}

// Eliminar favorito y actualizar UI con animación

/* Maneja la eliminación de un favorito */
async function handleRemoveFavorite(favoriteId, cardEl) {
    try {
        await removeFavorite(favoriteId);
        // Animación de salida antes de quitar del DOM
        cardEl.style.transition = "opacity 0.3s";
        cardEl.style.opacity = "0";
        setTimeout(() => {
            cardEl.remove();
            // Si no quedan cards, mostrar mensaje vacío
            if (favoritesContainer.children.length === 0) {
                if (emptyMsg) emptyMsg.style.display = "block";
            }
        }, 300);
    } catch (err) {
        alert("Error al eliminar favorito: " + err.message);
    }
}

// Cargar favoritos al iniciar la página 

/* Carga los favoritos del usuario */
async function loadFavorites() {
    favoritesContainer.innerHTML = `
        <p class="loading-text" style="grid-column:1/-1;">Cargando favoritos...</p>
    `;

    try {
        const favorites = await fetchFavorites(userId);
        renderFavorites(favorites);
    } catch (err) {
        favoritesContainer.innerHTML = `
            <p style="color:#e74c3c; grid-column:1/-1; padding:20px 0;">
                ⚠️ Error al cargar favoritos: ${err.message}
            </p>`;
    }
}

// Iniciar carga de favoritos al cargar el script
loadFavorites();