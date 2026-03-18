# Configuración de la conexión a la base de datos PostgreSQL usando psycopg2 y variables de entorno.
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv() # Carga las variables de entorno desde el archivo .env.

# Función para obtener una conexión a la base de datos.
def get_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("PGHOST"),
            port=os.getenv("PGPORT"),
            user=os.getenv("PGUSER"),
            password=os.getenv("PGPASSWORD"),
            database=os.getenv("PGDATABASE")
        )
        return conn
    except psycopg2.OperationalError as e:
        raise Exception(f"Error conectando a la base de datos: {e}")