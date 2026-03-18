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