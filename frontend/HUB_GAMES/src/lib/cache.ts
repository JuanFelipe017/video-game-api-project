/**
 * Cache helper — Hub Games
 * ─────────────────────────────────────────────────────────────────────────
 * Caché en dos niveles:
 *   1. In-memory (Map) → acceso síncrono O(1), válido mientras la pestaña vive.
 *   2. localStorage → persiste entre recargas y entre pestañas.
 *
 * Si localStorage no está disponible (modo privado, sin cuota, SSR…), se
 * degrada automáticamente a sólo memoria sin romper la app.
 *
 * TTL por defecto: 10 minutos (configurable por entrada).
 */

const STORAGE_PREFIX = 'hubgames:cache:';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface Entry<T> {
    value: T;
    expiresAt: number;
}

const memory = new Map<string, Entry<unknown>>();

function safeRead(key: string): Entry<unknown> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Entry<unknown>;
        if (
            !parsed ||
            typeof parsed !== 'object' ||
            typeof parsed.expiresAt !== 'number' ||
            !('value' in parsed)
        ) {
            window.localStorage.removeItem(STORAGE_PREFIX + key);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function safeWrite(key: string, entry: Entry<unknown>): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Cuota llena, modo privado, etc. → sólo memoria.
    }
}

function safeRemove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
        /* noop */
    }
}

export function get<T>(key: string): T | null {
    const now = Date.now();

    // 1) Memoria
    const fromMem = memory.get(key) as Entry<T> | undefined;
    if (fromMem) {
        if (fromMem.expiresAt > now) return fromMem.value;
        memory.delete(key);
    }

    // 2) localStorage
    const fromDisk = safeRead(key) as Entry<T> | null;
    if (!fromDisk) return null;
    if (fromDisk.expiresAt <= now) {
        safeRemove(key);
        return null;
    }

    // Re-hidrata memoria
    memory.set(key, fromDisk as Entry<unknown>);
    return fromDisk.value;
}

export function set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const entry: Entry<T> = { value, expiresAt: Date.now() + ttlMs };
    memory.set(key, entry as Entry<unknown>);
    safeWrite(key, entry as Entry<unknown>);
}

export function has(key: string): boolean {
    return get(key) !== null;
}

export function del(key: string): void {
    memory.delete(key);
    safeRemove(key);
}

export function clear(): void {
    memory.clear();
    if (typeof window === 'undefined') return;
    try {
        const keys = Object.keys(window.localStorage).filter((k) =>
            k.startsWith(STORAGE_PREFIX),
        );
        keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {
        /* noop */
    }
}

/** Borra todas las claves que coincidan con un prefijo lógico. */
export function clearByPrefix(prefix: string): void {
    // Memoria
    for (const k of Array.from(memory.keys())) {
        if (k.startsWith(prefix)) memory.delete(k);
    }
    // localStorage
    if (typeof window === 'undefined') return;
    try {
        const fullPrefix = STORAGE_PREFIX + prefix;
        const keys = Object.keys(window.localStorage).filter((k) =>
            k.startsWith(fullPrefix),
        );
        keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {
        /* noop */
    }
}
