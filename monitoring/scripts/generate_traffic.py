#!/usr/bin/env python3
"""
Script para generar tráfico de prueba hacia la GameHub API en GCP.
Úsalo mientras tienes Grafana abierto para ver las métricas moverse.

Uso:
    python generate_traffic.py
    python generate_traffic.py --requests 200
"""
import argparse
import random
import time
import urllib.request
import urllib.error

#BASE_URL = "https://gamehub-backend-556939640766.us-central1.run.app"
BASE_URL = "http://127.0.0.1:8000"  # o el puerto que uses

ENDPOINTS = [
    ("GET", "/"),
    ("GET", "/api/games/"),
    ("GET", "/api/games/?page=1&page_size=10"),
    ("GET", "/api/games/?search=mario"),
    ("GET", "/api/games/new-releases"),
    ("GET", "/api/games/1"),
    ("GET", "/api/games/9999"),   # 404 intencional para ver errores en métricas
]

def make_request(method: str, path: str) -> int:
    req = urllib.request.Request(f"{BASE_URL}{path}", method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        print(f"    Error de conexión: {e}")
        return 0

def run(total: int, delay: float):
    print(f"Generando {total} requests hacia {BASE_URL}\n")
    for i in range(1, total + 1):
        method, path = random.choice(ENDPOINTS)
        status = make_request(method, path)
        print(f"  [{i:>4}/{total}]  {method} {path}  →  {status}")
        time.sleep(delay)
    print("\n✓ Listo. Revisa Grafana en http://localhost:3000")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--requests", type=int,   default=100, help="Total de requests a enviar")
    parser.add_argument("--delay",    type=float, default=0.3, help="Segundos entre requests")
    args = parser.parse_args()
    run(args.requests, args.delay)
