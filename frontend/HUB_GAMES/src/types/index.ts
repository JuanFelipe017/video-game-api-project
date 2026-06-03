export interface Genre {
    id: number;
    name: string;
}

export interface Platform {
    id: number;
    name: string;
}

export interface Game {
    id: number;
    rawg_id: number;
    name: string;
    released?: string;
    rating?: number;
    ratings_count?: number;
    metacritic?: number;
    background_image?: string;
    description?: string;
    slug?: string;
    esrb_rating?: string;
    genres: Genre[];
    platforms: Platform[];
}

export interface GamesResponse {
    page: number;
    page_size: number;
    results: Game[];
}

export interface User {
    id: number;
    username: string;
    email: string;
}

export interface FavoriteOut {
    id: number;
    user_id: number;
    game_id: number;
    game?: Game;
}
