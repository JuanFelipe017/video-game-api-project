// Ingreso: al hacer click, verifica el email y password. Si son correctos, guarda los datos de sesión en localStorage. Si no, muestra un error.

/* Maneja el inicio de sesión */
async function handleLogin(email, password) {
    try {
        const result = await apiRequest("/users/login", "POST", { email, password });
        // Guardar datos de sesión en localStorage
        localStorage.setItem("user_id",  result.user.id);
        localStorage.setItem("username", result.user.username);
        localStorage.setItem("email",    result.user.email);
        return { ok: true };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Registro: al hacer click, crea una cuenta con el email, username y password. Si ya existe, muestra un error. Si se registra correctamente, loguea automáticamente.

/* Maneja el registro de un nuevo usuario */
async function handleRegister(username, email, password) {
    try {
        const result = await apiRequest("/users/register", "POST", { username, email, password });
        // Loguear automáticamente después de registrarse
        localStorage.setItem("user_id",  result.user.id);
        localStorage.setItem("username", result.user.username);
        localStorage.setItem("email",    result.user.email);
        return { ok: true };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Logout: al hacer click, borra los datos de sesión y redirige al index.

/* Maneja el cierre de sesión */
function handleLogout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "index.html";
}

// Utilidades de sesión 

/* Verifica si hay una sesión activa */
function isLoggedIn() {
    return !!localStorage.getItem("user_id");
}

/* Obtiene los datos del usuario actual */
function getCurrentUser() {
    return {
        id:       localStorage.getItem("user_id"),
        username: localStorage.getItem("username"),
        email:    localStorage.getItem("email"),
    };
}

// Redirige al login si no hay sesión activa

/* Requiere autenticación */
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}

// Perfil: Si hay sesión, muestra un dropdown con el nombre de usuario, email y un enlace a favoritos. 


async function buildProfileDropdown() {
    const userId = localStorage.getItem("user_id");
    const username = localStorage.getItem("username");
    if (!userId || !username) return;

    // Contar favoritos
    let favCount = 0;
    try {
        const favs = await fetchFavorites(userId);
        favCount = favs.length;
    } catch (e) {
        favCount = "—";
    }

    const navAuth = document.getElementById("nav-auth");
    if (!navAuth) return;

    navAuth.innerHTML = `
        <div class="profile-btn" id="profile-btn">
            <div class="profile-avatar">${username.charAt(0).toUpperCase()}</div>
            <span class="profile-username">${username}</span>
            <span class="profile-arrow">▾</span>
        </div>
        <div class="profile-dropdown" id="profile-dropdown">
            <div class="profile-dropdown-header">
                <div class="profile-avatar-lg">${username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="profile-name">${username}</div>
                    <div class="profile-email">${localStorage.getItem("email")}</div>
                </div>
            </div>
            <div class="profile-dropdown-divider"></div>
            <a href="favorites.html" class="profile-dropdown-item">
                ⭐ Favoritos
                <span class="fav-count">${favCount}</span>
            </a>
            <div class="profile-dropdown-divider"></div>
            <button class="profile-dropdown-item profile-logout" onclick="handleLogout()">
                🚪 Cerrar sesión
            </button>
        </div>
    `;

    // Toggle dropdown
    const btn = document.getElementById("profile-btn");
    const dropdown = document.getElementById("profile-dropdown");

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", () => {
        dropdown.classList.remove("open");
    });
}

// Llamar al cargar si hay sesión
if (isLoggedIn()) buildProfileDropdown();