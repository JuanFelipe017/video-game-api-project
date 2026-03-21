-- Índice de la base de datos para mejorar el rendimiento de las consultas más comunes, 
-- como buscar juegos por rating, fecha de lanzamiento o nombre, 
-- y para optimizar las consultas relacionadas con los favoritos y las relaciones entre juegos, géneros y plataformas.

CREATE INDEX idx_games_rating ON games(rating DESC);
CREATE INDEX idx_games_released ON games(released DESC);
CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_game_genres_game_id ON game_genres(game_id);
CREATE INDEX idx_game_platforms_game_id ON game_platforms(game_id);