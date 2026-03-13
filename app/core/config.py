"""
Configuración central: variables de entorno y rutas.
La raíz del proyecto es el directorio que contiene la carpeta 'app'.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Raíz del proyecto (carpeta que contiene 'app')
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_env_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=_env_path)

# TMDB
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip()
TMDB_BASE_URL = (os.getenv("TMDB_BASE_URL") or "https://api.themoviedb.org/3").strip().rstrip("/")
TMDB_IMAGE_BASE = (os.getenv("TMDB_IMAGE_BASE") or "https://image.tmdb.org/t/p/w500").strip().rstrip("/")

# Base de datos SQLite en la raíz del proyecto
DATABASE_PATH = PROJECT_ROOT / "cinesphere.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
