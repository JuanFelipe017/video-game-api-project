import { useState, useEffect } from 'react';
import { getUser } from '../lib/auth';
import { getFavorites, removeFavorite } from '../lib/api';
import type { FavoriteOut, Game } from '../types';

export default function FavoritesGrid() {
    const [favorites, setFavorites] = useState<FavoriteOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removing, setRemoving] = useState<Set<number>>(new Set());
    // getUser() debe llamarse dentro de useEffect para evitar errores de SSR
    const [user, setUserState] = useState<ReturnType<typeof getUser>>(null);

    useEffect(() => {
        const currentUser = getUser();
        setUserState(currentUser);
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }
        loadFavorites(currentUser.id);
    }, []);

    const loadFavorites = async (userId?: number) => {
        const uid = userId ?? user?.id;
        if (!uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getFavorites(uid);
            setFavorites(data);
        } catch (e: any) {
            setError(e.message ?? 'Error al cargar favoritos');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (gameId: number) => {
        if (!user?.id) return;
        setRemoving((prev) => new Set(prev).add(gameId));
        try {
            await removeFavorite(user!.id, gameId);
            setFavorites((prev) => prev.filter((f) => f.game_id !== gameId));
        } catch (e: any) {
            setError(e.message ?? 'Error al eliminar');
        } finally {
            setRemoving((prev) => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl bg-surface-container" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <span className="material-symbols-outlined text-4xl text-error mb-4 block">error</span>
                <p className="text-error mb-4">{error}</p>
                <button
                    onClick={loadFavorites}
                    className="text-primary hover:underline text-sm"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-32">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-container-high text-secondary mb-8">
                    <span className="material-symbols-outlined text-5xl">heart_broken</span>
                </div>
                <h2 className="text-3xl font-bold font-headline mb-4">Sin favoritos todavía</h2>
                <p className="text-on-surface-variant mb-10 max-w-sm mx-auto leading-relaxed">
                    Explora el catálogo y presiona el corazón en cualquier juego para agregarlo aquí.
                </p>
                <a
                    href="/"
                    className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all inline-block"
                >
                    Explorar juegos
                </a>
            </div>
        );
    }

    // Primer favorito va en la card grande
    const [first, ...rest] = favorites;

    const GameFavCard = ({ fav, large = false }: { fav: FavoriteOut; large?: boolean }) => {
        const game: Game | undefined = fav.game;
        if (!game) return null;
        const fallbackImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuBuXKIlGj8mBATlsXLvmlHJNcobJtPQdDjq2i7l6tFx63kkmlpeZoBeAjumkTdnPIK0kXfsrEVKl9oK57iLQXq35IXIixHiyj1uW_8QDRcJadpgxkLnB6v0DfVUKoIjvwa7_qmzycIcEymxQ4WlkgJQkQDNX26e3GJjDVtaYK0MRtws2ljdZiGTrTA3XWDXsk6T2a5OxHw5Bz4bolY3ZkjkZW1Jo4JsRiuQgVTmmu5-RSh7ZwiyVPUN1NbUKwS9DMep7_d49vTI-IM";
        const isRemoving = removing.has(fav.game_id);

        if (large) {
            return (
                <div className={`group relative overflow-hidden rounded-xl card-hover-scale bg-surface-container ${large ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[3/4]'}`}>
                    <a href={`/games/${game.id}`} className="block absolute inset-0">
                        <img
                            src={game.background_image ?? fallbackImg}
                            alt={game.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {game.genres?.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                    {game.genres.slice(0, 2).map((g) => (
                                        <span key={g.id} className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase">
                                            {g.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h3 className="text-3xl font-bold font-headline mb-2">{game.name}</h3>
                            <div className="mt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                <a
                                    href={`/games/${game.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-bold text-sm"
                                >
                                    Ver detalles
                                </a>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(fav.game_id); }}
                                    disabled={isRemoving}
                                    className="bg-white/10 hover:bg-error/30 backdrop-blur-md text-white p-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                                    title="Quitar de favoritos"
                                >
                                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
                                        {isRemoving ? 'hourglass_top' : 'favorite'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </a>
                </div>
            );
        }

        return (
            <div className="group relative aspect-[3/4] overflow-hidden rounded-xl card-hover-scale bg-surface-container">
                <a href={`/games/${game.id}`} className="block absolute inset-0">
                    <img
                        src={game.background_image ?? fallbackImg}
                        alt={game.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-surface-container-lowest/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <h3 className="text-xl font-bold font-headline mb-1">{game.name}</h3>
                        {game.genres?.[0] && (
                            <p className="text-secondary text-xs font-bold mb-4 uppercase tracking-widest">{game.genres[0].name}</p>
                        )}
                        <a
                            href={`/games/${game.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-primary py-3 rounded-xl font-bold text-on-primary text-sm text-center block mb-2"
                        >
                            Ver detalles
                        </a>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(fav.game_id); }}
                            disabled={isRemoving}
                            className="w-full bg-error/20 hover:bg-error/40 text-error py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            {isRemoving ? 'Eliminando...' : 'Quitar de favoritos'}
                        </button>
                    </div>

                    {/* Fav icon */}
                    <div className="absolute top-4 right-4">
                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
                            favorite
                        </span>
                    </div>
                </a>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {first && <GameFavCard fav={first} large />}
            {rest.map((fav) => (
                <GameFavCard key={fav.id} fav={fav} />
            ))}
        </div>
    );
}
