import { useEffect, useRef, useState, useCallback } from 'react';
import { getGames } from '../lib/api';
import * as cache from '../lib/cache';
import type { Game, GamesResponse } from '../types';
import GameCard from './GameCard';

const PAGE_SIZE = 20;
const CACHE_PREFIX = 'games:page:';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface Props {
    initialQuery?: string;
}

function cacheKey(page: number, query: string): string {
    return `${CACHE_PREFIX}${page}:q:${query.trim().toLowerCase()}`;
}

function SkeletonCard() {
    return (
        <div className="aspect-[3/4] rounded-xl bg-surface-container animate-pulse flex items-center justify-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 32 }}>
                gamepad
            </span>
        </div>
    );
}

export default function ExploreGrid({ initialQuery = '' }: Props) {
    const [games, setGames] = useState<Game[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState(initialQuery);
    const [searchInput, setSearchInput] = useState(initialQuery);
    const [totalLoaded, setTotalLoaded] = useState(0);
    const [retryKey, setRetryKey] = useState(0);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const requestIdRef = useRef(0);

    // Carga una página concreta; usa caché si está disponible y vigente.
    const loadPage = useCallback(
        async (pageNum: number, searchTerm: string): Promise<Game[]> => {
            const key = cacheKey(pageNum, searchTerm);
            const cached = cache.get<GamesResponse>(key);
            if (cached) return cached.results;

            const data = await getGames(pageNum, PAGE_SIZE, searchTerm.trim() || undefined);
            cache.set(key, data, CACHE_TTL_MS);
            return data.results;
        },
        [],
    );

    // Carga la primera página (o reemplaza la lista al cambiar query).
    useEffect(() => {
        const reqId = ++requestIdRef.current;
        let cancelled = false;

        async function bootstrap() {
            setIsInitialLoading(true);
            setError(null);
            setGames([]);
            setPage(1);
            setHasMore(true);
            setTotalLoaded(0);

            try {
                const results = await loadPage(1, query);
                if (cancelled || reqId !== requestIdRef.current) return;
                setGames(results);
                setHasMore(results.length >= PAGE_SIZE);
                setTotalLoaded(results.length);
            } catch (e: any) {
                if (cancelled || reqId !== requestIdRef.current) return;
                setError(e?.message ?? 'Error al conectar con el backend');
            } finally {
                if (!cancelled) setIsInitialLoading(false);
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, [query, retryKey, loadPage]);

    // Carga la siguiente página (infinite scroll).
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || isInitialLoading) return;

        setIsLoadingMore(true);
        setError(null);
        const nextPage = page + 1;
        try {
            const results = await loadPage(nextPage, query);
            if (requestIdRef.current !== nextPage && results.length === 0) return;
            setGames((prev) => {
                // Deduplicar por id (defensa extra)
                const seen = new Set(prev.map((g) => g.id));
                const fresh = results.filter((g) => !seen.has(g.id));
                return [...prev, ...fresh];
            });
            setPage(nextPage);
            setHasMore(results.length >= PAGE_SIZE);
            setTotalLoaded((prev) => prev + results.length);
        } catch (e: any) {
            setError(e?.message ?? 'Error al cargar más juegos');
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isInitialLoading, isLoadingMore, loadPage, page, query]);

    // IntersectionObserver sobre el sentinel para disparar loadMore.
    useEffect(() => {
        if (!hasMore) return;
        const node = sentinelRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '400px 0px' }, // empieza a cargar 400px antes de llegar al sentinel
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [loadMore, hasMore, games.length]);

    // Debounce de la búsqueda: 300ms tras dejar de teclear.
    useEffect(() => {
        const handle = setTimeout(() => {
            const normalized = searchInput.trim();
            if (normalized === query) return;

            // Sincroniza la URL sin recargar la página.
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (normalized) url.searchParams.set('q', normalized);
                else url.searchParams.delete('q');
                window.history.replaceState({}, '', url.toString());
            }
            setQuery(normalized);
        }, 300);
        return () => clearTimeout(handle);
    }, [searchInput, query]);

    const handleRetry = () => {
        setError(null);
        if (games.length === 0) {
            setRetryKey((k) => k + 1);
        } else {
            loadMore();
        }
    };

    return (
        <div>
            {/* Barra de búsqueda local */}
            <div className="mb-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2.5 border border-outline-variant/15 focus-within:border-primary/30 transition-colors flex-1 max-w-xl">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>
                        search
                    </span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Buscar juegos por nombre..."
                        className="bg-transparent outline-none text-sm flex-1 text-on-surface placeholder-outline"
                        aria-label="Buscar juegos"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => setSearchInput('')}
                            className="text-on-surface-variant hover:text-on-surface transition-colors"
                            aria-label="Limpiar búsqueda"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                close
                            </span>
                        </button>
                    )}
                </div>
                <div className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-label">
                    {totalLoaded > 0 && (
                        <span>
                            {totalLoaded} {totalLoaded === 1 ? 'juego' : 'juegos'}
                            {query && <> · "{query}"</>}
                        </span>
                    )}
                </div>
            </div>

            {/* Error banner (mantiene lo cargado) */}
            {error && games.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        wifi_off
                    </span>
                    <span className="flex-1">{error}</span>
                    <button
                        onClick={handleRetry}
                        className="text-error hover:underline text-xs font-bold uppercase tracking-widest"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Loading inicial: 8 skeletons */}
            {isInitialLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* Error fatal: nada cargado */}
            {!isInitialLoading && error && games.length === 0 && (
                <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-error-container/30 text-error mb-6">
                        <span className="material-symbols-outlined text-4xl">cloud_off</span>
                    </div>
                    <h2 className="text-2xl font-bold font-headline mb-3">Sin conexión</h2>
                    <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
                        No se pudo conectar con el backend. Verifica que FastAPI esté corriendo
                        en <code className="text-primary">localhost:8000</code>.
                    </p>
                    <button
                        onClick={handleRetry}
                        className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-bold shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Vacío (búsqueda sin resultados) */}
            {!isInitialLoading && !error && games.length === 0 && (
                <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-container-high text-secondary mb-6">
                        <span className="material-symbols-outlined text-4xl">search_off</span>
                    </div>
                    <h2 className="text-2xl font-bold font-headline mb-3">
                        Sin resultados
                    </h2>
                    <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
                        {query
                            ? `No se encontraron juegos para "${query}". Prueba con otro término.`
                            : 'Aún no hay juegos en el catálogo.'}
                    </p>
                    {query && (
                        <button
                            onClick={() => setSearchInput('')}
                            className="bg-surface-container-high hover:bg-surface-bright text-on-surface px-6 py-2.5 rounded-xl text-sm font-bold transition-colors border border-outline-variant/15"
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            )}

            {/* Grid de juegos */}
            {!isInitialLoading && games.length > 0 && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {games.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}

                        {/* Skeletons de "cargar más" */}
                        {isLoadingMore &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonCard key={`more-${i}`} />
                            ))}
                    </div>

                    {/* Sentinel + estado de fin / carga */}
                    <div
                        ref={sentinelRef}
                        className="mt-10 flex flex-col items-center justify-center text-on-surface-variant/60"
                    >
                        {isLoadingMore && (
                            <div className="flex items-center gap-3">
                                <span
                                    className="material-symbols-outlined animate-spin"
                                    style={{ fontSize: 24 }}
                                >
                                    progress_activity
                                </span>
                                <span className="text-sm uppercase tracking-widest font-label">
                                    Cargando más…
                                </span>
                            </div>
                        )}

                        {!hasMore && !isLoadingMore && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                <p className="text-xs uppercase tracking-[0.2em] font-label font-bold text-on-surface-variant/80">
                                    Has llegado al final
                                </p>
                                <p className="text-xs text-on-surface-variant/50">
                                    {totalLoaded} {totalLoaded === 1 ? 'juego explorado' : 'juegos explorados'}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
