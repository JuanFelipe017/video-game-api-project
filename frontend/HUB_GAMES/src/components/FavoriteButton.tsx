import { useState } from 'react';
import type { Game } from '../types';
import { getUser } from '../lib/auth';
import { addFavorite, removeFavorite } from '../lib/api';

interface Props {
    game: Game;
    isFavorite?: boolean;
}

export default function FavoriteButton({ game, isFavorite = false }: Props) {
    const [fav, setFav] = useState(isFavorite);
    const [loading, setLoading] = useState(false);

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
        } catch (err: any) {
            if (err?.message?.includes('401')) window.location.href = '/login';
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggle}
            disabled={loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 24px',
                borderRadius: '3px',
                border: fav ? '1px solid rgba(74,225,118,0.5)' : '1px solid rgba(66,71,84,0.5)',
                background: fav ? 'rgba(74,225,118,0.1)' : 'rgba(23,31,51,0.8)',
                backdropFilter: 'blur(12px)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
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
            {loading ? 'Cargando...' : fav ? 'En favoritos' : 'Añadir a favoritos'}
        </button>
    );
}