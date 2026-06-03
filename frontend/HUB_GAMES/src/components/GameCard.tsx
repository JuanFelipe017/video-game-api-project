import { useState } from 'react';
import type { Game } from '../types';
import { getUser } from '../lib/auth';
import { addFavorite, removeFavorite } from '../lib/api';

interface Props {
    game: Game;
    isFavorite?: boolean;
    onFavoriteChange?: (gameId: number, newState: boolean) => void;
    size?: 'normal' | 'large';
}

export default function GameCard({ game, isFavorite = false, onFavoriteChange, size = 'normal' }: Props) {
    const [fav, setFav] = useState(isFavorite);
    const [loading, setLoading] = useState(false);

    const toggleFav = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const user = getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }
        setLoading(true);
        try {
            if (fav) {
                await removeFavorite(user.id, game.id);
                setFav(false);
                onFavoriteChange?.(game.id, false);
            } else {
                await addFavorite(user.id, game.id);
                setFav(true);
                onFavoriteChange?.(game.id, true);
            }
        } catch (err: any) {
            // Mostrar el mensaje real del backend en consola
            const msg = err?.message ?? String(err);
            console.error('Error favorito:', msg);
            // Si es 401 la sesión expiró
            if (msg.includes('401') || msg.toLowerCase().includes('autenticaci')) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const genres = game.genres?.slice(0, 2) ?? [];
    const fallbackImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuBuXKIlGj8mBATlsXLvmlHJNcobJtPQdDjq2i7l6tFx63kkmlpeZoBeAjumkTdnPIK0kXfsrEVKl9oK57iLQXq35IXIixHiyj1uW_8QDRcJadpgxkLnB6v0DfVUKoIjvwa7_qmzycIcEymxQ4WlkgJQkQDNX26e3GJjDVtaYK0MRtws2ljdZiGTrTA3XWDXsk6T2a5OxHw5Bz4bolY3ZkjkZW1Jo4JsRiuQgVTmmu5-RSh7ZwiyVPUN1NbUKwS9DMep7_d49vTI-IM";

    if (size === 'large') {
        return (
            <div className="group relative aspect-[16/10] sm:col-span-2 overflow-hidden rounded-xl card-hover-scale bg-surface-container cursor-pointer">
                <a href={`/games/${game.id}`} className="block absolute inset-0">
                    <img
                        src={game.background_image ?? fallbackImg}
                        alt={game.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {genres.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                                {genres.map((g) => (
                                    <span
                                        key={g.id}
                                        className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-wide"
                                    >
                                        {g.name}
                                    </span>
                                ))}
                                {game.rating && (
                                    <span className="bg-primary-container/20 text-primary text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                        ★ {game.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        )}
                        <h3 className="text-3xl font-bold font-headline mb-2 text-on-surface">{game.name}</h3>
                        {game.description && (
                            <p className="text-on-surface-variant text-sm max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                                {game.description.replace(/<[^>]+>/g, '')}
                            </p>
                        )}
                        <div className="mt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                            <a
                                href={`/games/${game.id}`}
                                className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Ver detalles
                            </a>
                            <button
                                onClick={toggleFav}
                                disabled={loading}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                <span
                                    className={`material-symbols-outlined ${fav ? 'text-secondary' : ''}`}
                                    style={{ fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    favorite
                                </span>
                            </button>
                        </div>
                    </div>
                </a>
            </div>
        );
    }

    return (
        <div className="group relative aspect-[3/4] overflow-hidden rounded-xl card-hover-scale bg-surface-container cursor-pointer">
            <a href={`/games/${game.id}`} className="block absolute inset-0">
                <img
                    src={game.background_image ?? fallbackImg}
                    alt={game.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

                {/* Overlay hover */}
                <div className="absolute inset-0 bg-surface-container-lowest/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <h3 className="text-xl font-bold font-headline mb-1 text-on-surface">{game.name}</h3>
                    {genres[0] && (
                        <p className="text-secondary text-xs font-bold mb-4 uppercase tracking-widest">{genres[0].name}</p>
                    )}
                    {game.rating && (
                        <p className="text-on-surface-variant text-xs mb-3">★ {game.rating.toFixed(1)} · {game.ratings_count?.toLocaleString()} reseñas</p>
                    )}
                    <a
                        href={`/games/${game.id}`}
                        className="w-full bg-primary py-3 rounded-xl font-bold text-on-primary text-sm text-center block"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Ver detalles
                    </a>
                </div>

                {/* Fav icon siempre visible */}
                <button
                    onClick={toggleFav}
                    disabled={loading}
                    className="absolute top-4 right-4 p-2 rounded-full bg-surface-container-lowest/50 backdrop-blur-sm hover:bg-surface-container-lowest transition-colors disabled:opacity-50"
                >
                    <span
                        className={`material-symbols-outlined text-lg ${fav ? 'text-secondary' : 'text-on-surface-variant'}`}
                        style={{ fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0", fontSize: '20px' }}
                    >
                        favorite
                    </span>
                </button>
            </a>
        </div>
    );
}
