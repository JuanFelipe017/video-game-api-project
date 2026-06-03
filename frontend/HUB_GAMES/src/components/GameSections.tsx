import { useState, useEffect } from 'react';
import { getGames, getNewReleases } from '../lib/api';
import type { Game } from '../types';
import GameCard from './GameCard';

function SkeletonCard({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const aspect = size === 'large' ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[3/4]';
  return (
    <div className={`${aspect} rounded-xl bg-surface-container animate-pulse flex items-center justify-center`}>
      <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>gamepad</span>
    </div>
  );
}

function SkeletonGrid({ count, largeIndex = -1 }: { count: number; largeIndex?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} size={i === largeIndex ? 'large' : 'normal'} />
      ))}
    </div>
  );
}

interface Props {
  search?: string;
}

export default function GameSections({ search }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popular, setPopular] = useState<Game[]>([]);
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [searchResults, setSearchResults] = useState<Game[]>([]);

  useEffect(() => {
    async function load() {
      try {
        if (search) {
          const data = await getGames(1, 20, search);
          setSearchResults(data.results);
        } else {
          const [popData, newData] = await Promise.all([
            getGames(1, 12),
            getNewReleases(1, 8),
          ]);
          setPopular(popData.results);
          setNewReleases(newData.results);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Error al conectar con el backend');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  if (error) {
    return (
      <div className="mb-8 p-4 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-3">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>wifi_off</span>
        No se pudo conectar con el backend. Asegúrate de que FastAPI esté corriendo en localhost:8000
      </div>
    );
  }

  if (loading) {
    return search ? (
      <section className="mb-16">
        <div className="mb-8">
          <span className="text-secondary font-label uppercase tracking-widest text-sm font-bold mb-2 block">Resultados</span>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface text-glow">&quot;{search}&quot;</h1>
          <p className="text-on-surface-variant mt-2">buscando...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-surface-container animate-pulse flex items-center justify-center">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>gamepad</span>
            </div>
          ))}
        </div>
      </section>
    ) : (
      <>
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-secondary font-label uppercase tracking-widest text-xs font-bold mb-1 block">Recién llegados</span>
              <h2 className="text-2xl font-bold font-headline text-on-surface">Nuevos lanzamientos</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-surface-container animate-pulse flex items-center justify-center">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>gamepad</span>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-secondary font-label uppercase tracking-widest text-xs font-bold mb-1 block">Destacados</span>
              <h2 className="text-2xl font-bold font-headline text-on-surface">Más populares</h2>
            </div>
          </div>
          <SkeletonGrid count={5} largeIndex={0} />
        </section>
      </>
    );
  }

  if (search) {
    return (
      <section className="mb-16">
        <div className="mb-8">
          <span className="text-secondary font-label uppercase tracking-widest text-sm font-bold mb-2 block">Resultados</span>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface text-glow">&quot;{search}&quot;</h1>
          <p className="text-on-surface-variant mt-2">
            {searchResults.length} juego{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
          </p>
        </div>

        {searchResults.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 block">search_off</span>
            <p className="text-on-surface-variant">No se encontraron juegos para &quot;{search}&quot;</p>
            <a href="/" className="mt-6 inline-block text-primary hover:underline">← Volver al inicio</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const heroGame = popular[0];
  const restPopular = popular.slice(1);

  if (popular.length === 0 && newReleases.length === 0) {
    return (
      <div className="text-center py-32">
        <span className="material-symbols-outlined text-6xl text-outline mb-6 block">sports_esports</span>
        <h2 className="text-2xl font-bold font-headline mb-3">Sin juegos todavía</h2>
        <p className="text-on-surface-variant max-w-sm mx-auto">
          Importa juegos desde RAWG usando el endpoint <code className="text-primary">/api/games/import/{'{rawg_id}'}</code>
        </p>
      </div>
    );
  }

  return (
    <>
      {newReleases.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-secondary font-label uppercase tracking-widest text-xs font-bold mb-1 block">Recién llegados</span>
              <h2 className="text-2xl font-bold font-headline text-on-surface">Nuevos lanzamientos</h2>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors border border-outline-variant/15 text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg"
                >explore</span
                >
                Explorar más
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {newReleases.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-secondary font-label uppercase tracking-widest text-xs font-bold mb-1 block">Destacados</span>
              <h2 className="text-2xl font-bold font-headline text-on-surface">Más populares</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroGame && (
              <GameCard game={heroGame} size="large" />
            )}
            {restPopular.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}