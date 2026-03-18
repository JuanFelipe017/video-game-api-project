    GameHub: Full Stack Video Game Library

Este proyecto es una plataforma integral para la gestión de una librería de videojuegos. Permite a los usuarios registrarse, explorar un catálogo de juegos y gestionar su propia lista de favoritos. La arquitectura está dividida en un backend de alto rendimiento, un frontend intuitivo y un diseño de base de datos relacional.

    Estructura del Proyecto

El repositorio está organizado de forma modular para facilitar el despliegue independiente:

    backend/: API construida con FastAPI. Gestiona la lógica de usuarios, juegos y favoritos.

    frontend/: Interfaz de usuario desarrollada con HTML5, CSS3 y JavaScript.

    database/: Scripts SQL para la creación del esquema y carga de datos iniciales.

    docs/: Documentación técnica del proyecto.

    screenshots/: Capturas de pantalla de la aplicación.

    Tecnologías Principales

    Backend: FastAPI (Python 3.9+).

    Frontend: Vanilla JavaScript, HTML y CSS.

    Base de Datos: SQL (PostgreSQL/MySQL recomendado).

    Despliegue: Preparado para Google Cloud Platform (Cloud Run).

    Guía de Instalación y Uso

1. Requisitos Previos

    Python 3.9 o superior.

    Un servidor de base de datos SQL activo.

    Git para la gestión de versiones.

2. Configuración de la Base de Datos

Antes de correr la API, debes preparar la estructura de datos:

    Localiza los archivos en la carpeta /database.

    Ejecuta schema.sql en tu gestor de base de datos para crear las tablas.

    Ejecuta seed.sql si deseas cargar datos de prueba iniciales.

    (Opcional) Revisa diagram.png para entender la relación entre las tablas de usuarios, juegos y favoritos.

3. Configuración del Backend

    Entra a la carpeta del servidor: cd backend.

    Crea un entorno virtual: python -m venv venv.

    Activa el entorno:

        Windows: .\venv\Scripts\activate

        Linux/Mac: source venv/bin/activate

    Instala las dependencias: pip install -r requirements.txt.

    Nota sobre variables de entorno: Si el proyecto requiere conexión a DB, crea un archivo .env en esta carpeta con tus credenciales.

    Inicia la API: uvicorn app.main:app --reload.

4. Ejecución del Frontend

Al ser una aplicación estática, no requiere instalación:

    Navega a la carpeta /frontend.

    Abre el archivo index.html en tu navegador favorito.

    Asegúrate de que la API (Backend) esté corriendo para que el login y el catálogo funcionen.

    Documentación de Endpoints

La API cuenta con documentación interactiva en tiempo real:

    Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

    Rutas principales:

        /api/users: Registro e inicio de sesión.

        /api/games: Consulta del catálogo de videojuegos.

        /api/favorites: Gestión de juegos marcados por el usuario.