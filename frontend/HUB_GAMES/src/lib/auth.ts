import type { User } from '../types';

interface Session {
  user: User;
  token: string;
}

const KEY = 'vg_session';
const OLD_KEY = 'vg_user';

function isTokenExpired(token: string): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as Session;
      if (session.token && isTokenExpired(session.token)) {
        localStorage.removeItem(KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(KEY);
    }
  }
  const old = localStorage.getItem(OLD_KEY);
  if (old) {
    try {
      const user = JSON.parse(old) as User;
      const session: Session = { user, token: '' };
      localStorage.setItem(KEY, JSON.stringify(session));
      localStorage.removeItem(OLD_KEY);
      return session;
    } catch {
      localStorage.removeItem(OLD_KEY);
    }
  }
  return null;
}

export function getUser(): User | null {
  return readSession()?.user ?? null;
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}

export function setSession(user: User, token: string): void {
  localStorage.setItem(KEY, JSON.stringify({ user, token }));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(OLD_KEY);
}

export function setUser(user: User): void {
  setSession(user, '');
}

export function clearUser(): void {
  clearSession();
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
