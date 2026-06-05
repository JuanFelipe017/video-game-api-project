import { useState, useEffect } from 'react';
import type { Game, FavoriteOut } from '../types';
import { getUser } from '../lib/auth';
import { addFavorite, removeFavorite, getFavorites } from '../lib/api';
import { get as cacheGet, set as cacheSet } from '../lib/cache';

interface Props {
    game: Game;
    isFavorite?: boolean;
}

const FAV_CACHE_TTL_MS = 30_000;

export default function FavoriteButton({ game, isFavorite }: Props) {
    const [fav, setFav] = useState<boolean>(isFavorite ?? false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(isFavorite === undefined);

    useEffect(() => {
        if (isFavorite !== undefined) {
            setChecking(false);
            return;
        }
        const user = getUser();
        if (!user) { setChecking(false); return; }

        const cacheKey = `favorites:${user.id}`;
        const cached = cacheGet<FavoriteOut[]>(cacheKey);
        if (cached) {
            setFav(cached.some((f) => f.game_id === game.id));
            setChecking(false);
            return;
        }

        getFavorites(user.id)
            .then((favs) => {
                cacheSet(cacheKey, favs, FAV_CACHE_TTL_MS);
                setFav(favs.some((f) => f.game_id === game.id));
            })
            .catch(() => {})
            .finally(() => setChecking(false));
    }, [game.id, isFavorite]);

    const toggle = async () => {
        const user = getUser();
        if (!user) { window.location.href = '/login'; return; }
        setLoading(true);
        try {
            if (fav) {
                await removeFavorite(user.id, game.id);
                setFav(false);
            } else {
                await addFavorite(user.id, game.id);
                setFav(true);
            }
            const cacheKey = `favorites:${user.id}`;
            const current = cacheGet<FavoriteOut[]>(cacheKey) ?? [];
            const next = fav
                ? current.filter((f) => f.game_id !== game.id)
                : [...current.filter((f) => f.game_id !== game.id), { id: 0, user_id: user.id, game_id: game.id }];
            cacheSet(cacheKey, next, FAV_CACHE_TTL_MS);
        } catch (err: any) {
            if (err?.message?.includes('401')) window.location.href = '/login';
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggle}
            disabled={loading || checking}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 24px',
                borderRadius: '3px',
                border: fav ? '1px solid rgba(74,225,118,0.5)' : '1px solid rgba(66,71,84,0.5)',
                background: fav ? 'rgba(74,225,118,0.1)' : 'rgba(23,31,51,0.8)',
                backdropFilter: 'blur(12px)',
                cursor: loading || checking ? 'not-allowed' : 'pointer',
                opacity: loading || checking ? 0.6 : 1,
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: fav ? '#4ae176' : '#c2c6d6',
                whiteSpace: 'nowrap' as const,
            }}
        >
            <span
                className="material-symbols-outlined"
                style={{
                    fontSize: '18px',
                    fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0",
                    color: fav ? '#4ae176' : '#c2c6d6',
                }}
            >
                favorite
            </span>
            {loading ? 'Cargando...' : checking ? 'Cargando...' : fav ? 'En favoritos' : 'Añadir a favoritos'}
        </button>
    );
}
