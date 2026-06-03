import { useState, useEffect } from 'react';
import { getGamesByGenre } from '../lib/api';
import type { Game } from '../types';
import GameCard from './GameCard';

interface Props {
  genre: string;
  currentGameId: number;
}

export default function RelatedGames({ genre, currentGameId }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGamesByGenre(genre, 1, 6)
      .then((data) => {
        setGames(data.results.filter((g) => g.id !== currentGameId).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre, currentGameId]);

  if (loading) {
    return (
      <section className="max-w-screen-xl mx-auto px-8 mt-20 pt-14" style={{ borderTop: '1px solid rgba(66,71,84,0.28)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-6 h-6 rounded-full bg-surface-container animate-pulse" />
          <div className="h-3 w-32 bg-surface-container animate-pulse rounded" />
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>
        <div className="h-12 w-96 bg-surface-container animate-pulse rounded mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-8 mt-20 pt-14" style={{ borderTop: '1px solid rgba(66,71,84,0.28)' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="pulse-dot" />
        <span style={{ fontFamily: '"DM Sans"', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.65rem', color: '#4ae176' }}>Descubre más</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,rgba(74,225,118,0.25),transparent)' }} />
      </div>
      <h2 className="hero-title text-on-surface mb-10" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
        También te puede gustar
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}