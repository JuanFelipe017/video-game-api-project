// Manejo de toasts (notificaciones temporales) para mostrar mensajes al usuario.
// Uso:
//   showToast("Título", "Mensaje")                        → info
//   showToast("Éxito", "Guardado", "success")             → verde
//   showToast("Error", "Algo salió mal", "error")         → rojo
//   showToast("Aviso", "Msg", "warning", "Ir", callback)  → con botón de acción

/* Muestra un toast (notificación temporal) */
function showToast(title, message, type = "info", actionLabel = null, actionCallback = null) {
    // Crear contenedor si no existe
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const icons = {
        success: "✅",
        error:   "❌",
        warning: "⚠️",
        info:    "🔔",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "🔔"}</span>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-msg">${message}</div>` : ""}
        </div>
        ${actionLabel ? `<button class="toast-action">${actionLabel} →</button>` : ""}
    `;

    // Botón de acción opcional
    if (actionLabel && actionCallback) {
        toast.querySelector(".toast-action").addEventListener("click", () => {
            actionCallback();
            removeToast(toast);
        });
    }

    container.appendChild(toast);

    // Auto-cerrar después de 4 segundos
    const timer = setTimeout(() => removeToast(toast), 4000);

    // Cerrar al hacer clic en el toast
    toast.addEventListener("click", () => {
        clearTimeout(timer);
        removeToast(toast);
    });
}

/* Elimina un toast del DOM */
function removeToast(toast) {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
}

// Atajos para mostrar toasts de diferentes tipos de Toast
const toast = {
    success: (title, msg)                       => showToast(title, msg, "success"),
    error:   (title, msg)                       => showToast(title, msg, "error"),
    warning: (title, msg)                       => showToast(title, msg, "warning"),
    info:    (title, msg)                       => showToast(title, msg, "info"),
    action:  (title, msg, label, cb)            => showToast(title, msg, "warning", label, cb),
};

// Ejemplo de uso: mostrar un toast de error al intentar agregar favorito sin estar logueado
function requireLoginToast() {
    showToast(
        "Inicia sesión primero",
        "Necesitas una cuenta para guardar favoritos.",
        "warning",
        "Ir al login",
        () => window.location.href = "login.html"
    );
}