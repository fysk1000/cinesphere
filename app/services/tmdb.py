"""
Servicio de integración con la API de TMDB.
"""
from typing import Any, Optional

import httpx
from fastapi import HTTPException

from app.core.config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE


def _build_image_url(poster_path: Optional[str]) -> Optional[str]:
    if not poster_path:
        return None
    return f"{TMDB_IMAGE_BASE}{poster_path}"


async def get_movie_by_id(client: httpx.AsyncClient, tmdb_id: int) -> Optional[dict[str, Any]]:
    """
    Obtiene los detalles de una película por ID desde TMDB.
    Devuelve un diccionario listo para guardar en DB o None si no existe/error.
    """
    if not TMDB_API_KEY:
        return None
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    params = {"api_key": TMDB_API_KEY}
    try:
        response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException):
        return None
    if response.status_code != 200:
        return None
    data = response.json()
    if not data.get("id"):
        return None
    poster_path = data.get("poster_path")
    return {
        "external_id": data["id"],
        "title": data.get("title") or "",
        "media_type": "movie",
        "rating": data.get("vote_average"),
        "release_date": data.get("release_date") or "",
        "image": _build_image_url(poster_path),
        "notas_personales": None,
    }


async def search_movie_first(client: httpx.AsyncClient, criterio: str) -> Optional[dict[str, Any]]:
    """
    Busca una película por criterio y devuelve el primer resultado en formato limpio.
    Usado por GET /pelicula/{criterio}.
    - Devuelve dict si hay resultados.
    - Devuelve None si la respuesta es 200 pero no hay resultados (404).
    - Lanza HTTPException 503 si TMDB no responde; 502 si TMDB devuelve estado distinto de 200.
    """
    print(f"[CineSphere][backend] /pelicula criterio='{criterio}'")
    if not TMDB_API_KEY:
        return None  # El router devuelve 500
    url = f"{TMDB_BASE_URL}/search/movie"
    print(f"[CineSphere][backend] Llamando a TMDB (single) URL={url}")
    params = {"api_key": TMDB_API_KEY, "query": criterio}
    try:
        response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException):
        print("[CineSphere][backend] Error de conexión/timeout al llamar TMDB (single)")
        raise HTTPException(status_code=503, detail="TMDB no disponible o no responde.")
    print(f"[CineSphere][backend] TMDB status (single)={response.status_code}")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB devolvió un estado inesperado: {response.status_code}",
        )
    results = (response.json() or {}).get("results") or []
    print(f"[CineSphere][backend] TMDB resultados (single)={len(results)}")
    if not results:
        return None
    movie = results[0]
    poster_path = movie.get("poster_path")
    return {
        "id": movie.get("id"),
        "title": movie.get("title", ""),
        "media_type": "movie",
        "rating": movie.get("vote_average"),
        "release_date": movie.get("release_date") or "",
        "image": _build_image_url(poster_path),
    }


async def search_movies(
    client: httpx.AsyncClient,
    criterio: str,
    limit: int = 8,
) -> list[dict[str, Any]]:
    """
    Busca varias películas por criterio y devuelve una lista limpia.
    Usado por GET /peliculas/{criterio}.
    - Devuelve una lista (posiblemente vacía) si la respuesta es 200.
    - Lanza HTTPException 503 si TMDB no responde; 502 si TMDB devuelve estado distinto de 200.
    """
    print(f"[CineSphere][backend] /peliculas criterio='{criterio}', limit={limit}")
    if not TMDB_API_KEY:
        return []  # El router comprobará y devolverá 500
    url = f"{TMDB_BASE_URL}/search/movie"
    print(f"[CineSphere][backend] Llamando a TMDB (multi) URL={url}")
    params = {"api_key": TMDB_API_KEY, "query": criterio}
    try:
        response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException):
        print("[CineSphere][backend] Error de conexión/timeout al llamar TMDB (multi)")
        raise HTTPException(status_code=503, detail="TMDB no disponible o no responde.")
    print(f"[CineSphere][backend] TMDB status (multi)={response.status_code}")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB devolvió un estado inesperado: {response.status_code}",
        )
    results = (response.json() or {}).get("results") or []
    print(f"[CineSphere][backend] TMDB resultados (multi)={len(results)}")
    cleaned: list[dict[str, Any]] = []
    for movie in results[:limit]:
        poster_path = movie.get("poster_path")
        cleaned.append(
            {
                "id": movie.get("id"),
                "title": movie.get("title", "") or "",
                "media_type": "movie",
                "rating": movie.get("vote_average"),
                "release_date": movie.get("release_date") or "",
                "image": _build_image_url(poster_path),
            }
        )
    return cleaned


async def get_movie_detail(
    client: httpx.AsyncClient,
    tmdb_id: int,
) -> Optional[dict[str, Any]]:
    """
    Obtiene el detalle de una película (incluyendo videos e imágenes) desde TMDB.

    - Devuelve un diccionario limpio si existe.
    - Devuelve None si TMDB responde 404 (película no encontrada).
    - Lanza HTTPException 503 si TMDB no responde.
    - Lanza HTTPException 502 si TMDB devuelve un estado distinto de 200/404.
    """
    if not TMDB_API_KEY:
        return None

    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "append_to_response": "videos,images",
    }

    try:
        response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException):
        raise HTTPException(status_code=503, detail="TMDB no disponible o no responde.")

    if response.status_code == 404:
        # Película no encontrada en TMDB
        return None
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB devolvió un estado inesperado: {response.status_code}",
        )

    data = response.json() or {}
    if not data.get("id"):
        return None

    # Campos básicos
    movie_id = data.get("id")
    title = data.get("title") or ""
    overview = data.get("overview") or ""
    release_date = data.get("release_date") or ""
    runtime = data.get("runtime")  # minutos
    rating = data.get("vote_average")

    # Géneros como array de nombres
    genres_data = data.get("genres") or []
    genres = [g.get("name") for g in genres_data if g.get("name")]

    # Imágenes principales
    poster_image = _build_image_url(data.get("poster_path"))
    backdrop_image = _build_image_url(data.get("backdrop_path"))

    # Videos (buscar trailer de YouTube)
    trailer_url: Optional[str] = None
    videos = (data.get("videos") or {}).get("results") or []
    if videos:
        # priorizar trailers de YouTube
        trailer = next(
            (
                v
                for v in videos
                if v.get("site") == "YouTube" and v.get("type") == "Trailer"
            ),
            None,
        )
        if not trailer:
            # fallback: cualquier video de YouTube
            trailer = next(
                (v for v in videos if v.get("site") == "YouTube"),
                None,
            )
        if trailer and trailer.get("key"):
            trailer_url = f"https://www.youtube.com/embed/{trailer['key']}"

    # Imágenes adicionales (hasta 5 URLs)
    images_urls: list[str] = []
    images_section = data.get("images") or {}
    backdrops = images_section.get("backdrops") or []
    posters = images_section.get("posters") or []

    def add_image_from_list(items):
        for img in items:
            if len(images_urls) >= 5:
                break
            path = img.get("file_path")
            url = _build_image_url(path)
            if url:
                images_urls.append(url)

    add_image_from_list(backdrops)
    if len(images_urls) < 5:
        add_image_from_list(posters)

    return {
        "id": movie_id,
        "title": title,
        "overview": overview,
        "genres": genres,
        "release_date": release_date,
        "runtime": runtime,
        "rating": rating,
        "poster_image": poster_image,
        "backdrop_image": backdrop_image,
        "trailer_url": trailer_url,
        "images": images_urls,
    }
