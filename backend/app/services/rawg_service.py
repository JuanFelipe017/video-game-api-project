import requests
import os

API_KEY = os.getenv("RAWG_API_KEY")

def get_popular_games():
    url = f"https://api.rawg.io/api/games?key={API_KEY}"
    response = requests.get(url)
    data = response.json()

    return data["results"]