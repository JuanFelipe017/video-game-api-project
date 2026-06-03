import type { Game, GamesResponse, User, FavoriteOut } from '../types';

const BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Juegos ────────────────────────────────────────────────────────────────────

export async function getGames(
    page = 1,
    pageSize = 20,
    search?: string
): Promise<GamesResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    const res = await fetch(`${BASE}/api/games/?${params}`);
    if (!res.ok) throw new Error(`Error al obtener juegos: ${res.status}`);
    return res.json();
}

export async function getNewReleases(page = 1, pageSize = 20): Promise<GamesResponse> {
    const res = await fetch(`${BASE}/api/games/new-releases?page=${page}&page_size=${pageSize}`);
    if (!res.ok) throw new Error(`Error al obtener nuevos lanzamientos: ${res.status}`);
    return res.json();
}

export async function getGamesByGenre(
    genreName: string,
    page = 1,
    pageSize = 20
): Promise<GamesResponse> {
    const res = await fetch(`${BASE}/api/games/by-genre/${encodeURIComponent(genreName)}?page=${page}&page_size=${pageSize}`);
    if (!res.ok) throw new Error(`Error al obtener juegos por género: ${res.status}`);
    return res.json();
}

export async function getGame(id: number): Promise<Game> {
    const res = await fetch(`${BASE}/api/games/${id}`);
    if (!res.ok) throw new Error(`Juego no encontrado: ${res.status}`);
    return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(
    username: string,
    email: string,
    password: string
): Promise<User> {
    const res = await fetch(`${BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Error al registrarse');
    }
    return res.json();
}

export async function login(email: string, password: string): Promise<User> {
    const res = await fetch(`${BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Credenciales inválidas');
    }
    return res.json();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseErrorDetail(detail: unknown): string {
    if (!detail) return 'Error desconocido';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        // Errores de validación de Pydantic: [{msg, loc, type}, ...]
        return detail.map((e: any) => e.msg ?? JSON.stringify(e)).join(', ');
    }
    return JSON.stringify(detail);
}

async function throwIfError(res: Response, fallback: string): Promise<void> {
    if (!res.ok) {
        try {
            const body = await res.json();
            throw new Error(parseErrorDetail(body.detail) ?? fallback);
        } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error(`${fallback}: ${res.status}`);
        }
    }
}

// ── Favoritos ─────────────────────────────────────────────────────────────────
// Todos requieren header x-user-id

export async function getFavorites(userId: number): Promise<FavoriteOut[]> {
    const res = await fetch(`${BASE}/api/favorites/${userId}`, {
        headers: { 'x-user-id': String(userId) },
    });
    await throwIfError(res, 'Error al obtener favoritos');
    return res.json();
}

export async function addFavorite(userId: number, gameId: number): Promise<FavoriteOut> {
    const res = await fetch(`${BASE}/api/favorites/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId),
        },
        body: JSON.stringify({ user_id: userId, game_id: gameId }),
    });
    await throwIfError(res, 'Error al agregar favorito');
    return res.json();
}

export async function removeFavorite(userId: number, gameId: number): Promise<void> {
    const res = await fetch(`${BASE}/api/favorites/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId),
        },
        body: JSON.stringify({ user_id: userId, game_id: gameId }),
    });
    await throwIfError(res, 'Error al eliminar favorito');
}