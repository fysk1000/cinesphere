"""
Esquemas Pydantic para validación de recursos (MisFavoritos).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class RecursoCreate(BaseModel):
    """Payload para crear un recurso (POST /recursos). Compatible con el frontend CineSphere."""
    external_id: int = Field(..., gt=0, description="ID en TMDB (entero > 0)")
    title: str = Field(..., min_length=1, description="Título no vacío")
    media_type: str = Field(default="movie", description="Tipo de medio")
    rating: Optional[float] = None
    release_date: Optional[str] = None
    image: Optional[str] = None
    notas_personales: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El título no puede estar vacío")
        return v.strip()

    @field_validator("release_date", "image", "notas_personales")
    @classmethod
    def empty_str_to_none(cls, v: Optional[str]) -> Optional[str]:
        """Acepta cadenas vacías del frontend y las normaliza a None."""
        if v is not None and isinstance(v, str) and not v.strip():
            return None
        return v


class RecursoUpdate(BaseModel):
    """Payload para actualizar notas y/o valoración (PATCH /recursos/{id})."""
    notas_personales: Optional[str] = None
    user_rating: Optional[float] = None


class RecursoResponse(BaseModel):
    """Respuesta de un recurso guardado."""
    id: int
    id_usuario: str
    external_id: int
    media_type: str
    fecha_creacion: datetime
    notas_personales: Optional[str] = None
    title: str
    rating: Optional[float] = None
    release_date: Optional[str] = None
    image: Optional[str] = None
    user_rating: Optional[float] = None

    model_config = {"from_attributes": True}
