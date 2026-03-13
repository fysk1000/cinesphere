"""
CineSphere API: Fase 1 (health, CORS, logging), Fase 2 (TMDB búsqueda), Fase 3 (persistencia).
"""
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE
from app.db.database import init_db
from app.routers import recursos
from app.services.tmdb import get_movie_detail, search_movie_first, search_movies


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Cliente HTTP para TMDB y creación de tablas en arranque."""
    init_db()
    async with httpx.AsyncClient(timeout=10.0) as client:
        app.state.http_client = client
        yield


app = FastAPI(
    title="CineSphere API - Fase 3",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Logging middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    print(
        f"DEBUG: {request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"{process_time:.2f}ms"
    )
    return response


# --- Rutas ---
app.include_router(recursos.router)


@app.get("/")
async def root():
    """Health check (Fase 1)."""
    return {
        "status": "online",
        "message": "Servidor Arriba",
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/config")
async def config():
    """Debug: comprobar carga de TMDB (sin exponer la API key)."""
    return {
        "tmdb_key_loaded": bool(TMDB_API_KEY),
        "tmdb_base_url": TMDB_BASE_URL,
        "image_base_url": TMDB_IMAGE_BASE,
    }


@app.get("/pelicula/{criterio}")
async def pelicula(criterio: str, request: Request):
    """Búsqueda en TMDB por criterio; devuelve el primer resultado (Fase 2)."""
    if not TMDB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TMDB_API_KEY no configurada. Configure la variable en .env en la raíz del proyecto.",
        )
    client = request.app.state.http_client
    result = await search_movie_first(client, criterio)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró ninguna película para: {criterio}",
        )
    return result


@app.get("/peliculas/{criterio}")
async def peliculas(criterio: str, request: Request):
    """
    Búsqueda en TMDB por criterio; devuelve varios resultados (hasta un límite razonable).
    Endpoint añadido en Fase 4 para el frontend.
    """
    if not TMDB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TMDB_API_KEY no configurada. Configure la variable en .env en la raíz del proyecto.",
        )
    client = request.app.state.http_client
    movies = await search_movies(client, criterio, limit=8)
    if not movies:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron películas para: {criterio}",
        )
    return movies


@app.get("/pelicula-detalle/{tmdb_id}")
async def pelicula_detalle(tmdb_id: int, request: Request):
    """
    Devuelve el detalle de una película individual (incluye videos e imágenes).
    Pensado para usarse desde el frontend en un modal de detalle.
    """
    if tmdb_id <= 0:
        raise HTTPException(status_code=400, detail="tmdb_id debe ser un entero positivo.")

    if not TMDB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TMDB_API_KEY no configurada. Configure la variable en .env en la raíz del proyecto.",
        )

    client = request.app.state.http_client
    detail = await get_movie_detail(client, tmdb_id)
    if detail is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró la película con id {tmdb_id} en TMDB.",
        )
    return detail
