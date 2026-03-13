"""
CRUD de recursos (MisFavoritos): listar, crear, actualizar, eliminar.
Todas las operaciones se filtran por id_usuario (header X-User-Id).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.database import get_db
from app.db.models import MisFavoritos
from app.schemas.recursos import RecursoCreate, RecursoUpdate, RecursoResponse
from app.services.tmdb import get_movie_by_id

router = APIRouter(prefix="/recursos", tags=["recursos"])

# Header X-User-Id; por defecto "demo-user"
USER_ID_HEADER = "x-user-id"


def get_user_id(x_user_id: Annotated[str | None, Header(alias=USER_ID_HEADER)] = None) -> str:
    return (x_user_id or "demo-user").strip() or "demo-user"


@router.post("", response_model=RecursoResponse, status_code=201)
def create_recurso(
    payload: RecursoCreate,
    request: Request,
    id_usuario: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Guarda un nuevo elemento (desde body) en la base de datos."""
    rec = MisFavoritos(
        id_usuario=id_usuario,
        external_id=payload.external_id,
        media_type=payload.media_type,
        title=payload.title,
        rating=payload.rating,
        release_date=payload.release_date,
        image=payload.image,
        notas_personales=payload.notas_personales,
    )
    try:
        db.add(rec)
        db.commit()
        db.refresh(rec)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ya existe un recurso con ese external_id y media_type para este usuario.",
        )
    return rec


@router.get("", response_model=list[RecursoResponse])
def list_recursos(
    id_usuario: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Lista todos los recursos guardados del usuario."""
    rows = db.query(MisFavoritos).filter(MisFavoritos.id_usuario == id_usuario).order_by(MisFavoritos.fecha_creacion.desc()).all()
    return rows


@router.patch("/{recurso_id}", response_model=RecursoResponse)
def update_recurso(
    recurso_id: int,
    payload: RecursoUpdate,
    id_usuario: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Actualiza notas_personales y/o user_rating del recurso (solo si es del usuario)."""
    rec = db.query(MisFavoritos).filter(MisFavoritos.id == recurso_id, MisFavoritos.id_usuario == id_usuario).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurso no encontrado.")
    if payload.notas_personales is not None:
        rec.notas_personales = payload.notas_personales
    if payload.user_rating is not None:
        rec.user_rating = payload.user_rating
    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/{recurso_id}", status_code=204)
def delete_recurso(
    recurso_id: int,
    id_usuario: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Elimina el recurso (solo si pertenece al usuario)."""
    rec = db.query(MisFavoritos).filter(MisFavoritos.id == recurso_id, MisFavoritos.id_usuario == id_usuario).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurso no encontrado.")
    db.delete(rec)
    db.commit()
    return None


@router.post("/from-tmdb/{tmdb_id}", response_model=RecursoResponse, status_code=201)
async def create_recurso_from_tmdb(
    tmdb_id: int,
    request: Request,
    id_usuario: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Obtiene la película por ID desde TMDB y la guarda en la DB para el usuario actual.
    """
    if tmdb_id <= 0:
        raise HTTPException(status_code=400, detail="tmdb_id debe ser un entero positivo.")
    client = request.app.state.http_client
    movie = await get_movie_by_id(client, tmdb_id)
    if not movie:
        raise HTTPException(
            status_code=502,
            detail="No se pudo obtener la película desde TMDB (no disponible o ID inválido).",
        )
    rec = MisFavoritos(
        id_usuario=id_usuario,
        external_id=movie["external_id"],
        media_type=movie["media_type"],
        title=movie["title"],
        rating=movie.get("rating"),
        release_date=movie.get("release_date") or "",
        image=movie.get("image"),
        notas_personales=movie.get("notas_personales"),
    )
    try:
        db.add(rec)
        db.commit()
        db.refresh(rec)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Esta película ya está en tu lista de favoritos.",
        )
    return rec
