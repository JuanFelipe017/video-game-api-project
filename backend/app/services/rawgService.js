export const fetchGamesFromRawg = async () => {
   const response = await fetch(
     `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}`
   );
   return response.json();
};