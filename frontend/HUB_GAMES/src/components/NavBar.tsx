import { useState, useEffect } from 'react';
import { getUser, clearUser } from '../lib/auth';
import type { User } from '../types';

interface Props {
    currentPath?: string;
}

export default function NavBar({ currentPath = '/' }: Props) {
    const [user, setUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setUser(getUser());
    }, []);

    const handleLogout = () => {
        clearUser();
        setUser(null);
        window.location.href = '/login';
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            window.location.href = `/?search=${encodeURIComponent(search.trim())}`;
        }
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/?section=popular', label: 'Popular' },
        { href: '/?section=new', label: 'New' },
        { href: '/favorites', label: 'Favorites' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
    };

    return (
        <nav className="fixed top-0 w-full z-50 glass-panel shadow-2xl shadow-black/40">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
                {/* Logo */}
                <a href="/" className="text-2xl font-black text-on-surface italic tracking-tighter font-headline shrink-0">
                    HUB_GAMES
                </a>

                {/* Links desktop */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors duration-200 ${isActive(link.href)
                                ? 'text-primary font-bold border-b-2 border-primary pb-0.5'
                                : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Search + acciones */}
                <div className="flex items-center gap-4 ml-auto">
                    {/* Búsqueda */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden lg:flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2 border border-outline-variant/15 focus-within:border-primary/30 transition-colors"
                    >
                        <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>
                            search
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar juegos..."
                            className="bg-transparent outline-none text-sm w-44 text-on-surface-variant placeholder-outline focus:text-on-surface transition-colors"
                        />
                    </form>

                    {/* Usuario */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:block text-sm text-on-surface-variant">
                                {user.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-error-container/20"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                                <span className="hidden sm:inline">Salir</span>
                            </button>
                        </div>
                    ) : (
                        <a
                            href="/login"
                            className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                        >
                            Iniciar sesión
                        </a>
                    )}

                    {/* Hamburger mobile */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                        <span className="material-symbols-outlined">
                            {menuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Menú mobile */}
            {menuOpen && (
                <div className="md:hidden bg-surface-container-low border-t border-outline-variant/10 px-6 py-4 flex flex-col gap-4">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium py-2 ${isActive(link.href) ? 'text-primary' : 'text-on-surface-variant'
                                }`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2 mt-2">
                        <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar juegos..."
                            className="bg-transparent outline-none text-sm flex-1 text-on-surface-variant"
                        />
                    </form>
                </div>
            )}
        </nav>
    );
}
