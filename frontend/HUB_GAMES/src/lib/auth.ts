import type { User } from '../types';

const KEY = 'vg_user';

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function setUser(user: User): void {
    localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
    localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
    return getUser() !== null;
}
