# CineSphere - Fase 3 (Persistencia)

## Estructura del proyecto

```
CineSphere_Fase1/
├── app/
│   ├── main.py           # FastAPI app, rutas /, /config, /pelicula
│   ├── core/
│   │   └── config.py     # Variables de entorno y PROJECT_ROOT
│   ├── db/
│   │   ├── database.py   # SQLAlchemy engine, SessionLocal, get_db, init_db
│   │   └── models.py     # Modelo MisFavoritos
│   ├── schemas/
│   │   └── recursos.py   # RecursoCreate, RecursoUpdate, RecursoResponse
│   ├── routers/
│   │   └── recursos.py   # CRUD /recursos y POST /recursos/from-tmdb/{tmdb_id}
│   └── services/
│       └── tmdb.py       # get_movie_by_id, search_movie_first
├── main.py               # Launcher: python main.py
├── requirements.txt
├── .env                  # TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE
├── .env.example
├── cinesphere.db         # Creado al arrancar (SQLite)
└── PHASE3_README.md
```

## Cómo ejecutar en Windows

Desde la raíz del proyecto (`CineSphere_Fase1`):

```powershell
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternativa con `python main.py`:

```powershell
venv\Scripts\activate
python main.py
```

## Ubicación del .env y de la base de datos

- **.env**: en la raíz del proyecto (junto a `requirements.txt`). Debe contener al menos `TMDB_API_KEY=tu_clave`.
- **cinesphere.db**: se crea en la raíz del proyecto al arrancar el servidor (primera petición o al cargar la app).

## Pruebas de persistencia

1. Arrancar el servidor y añadir un recurso (por ejemplo `POST /recursos/from-tmdb/27205` con header `X-User-Id: alejandro`).
2. Hacer `GET /recursos` con el mismo header y comprobar que aparece.
3. **Detener el servidor** (Ctrl+C).
4. Volver a arrancar: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
5. Repetir `GET /recursos` con `X-User-Id: alejandro`. Los datos siguen ahí (persistencia).

## Ejemplos de peticiones (Postman/curl)

Sustituir `RECURSO_ID` por el `id` numérico devuelto al crear un recurso.

### 1) Añadir Inception desde TMDB (usuario alejandro)

```bash
curl -X POST "http://localhost:8000/recursos/from-tmdb/27205" -H "X-User-Id: alejandro"
```

### 2) Listar recursos del usuario

```bash
curl -X GET "http://localhost:8000/recursos" -H "X-User-Id: alejandro"
```

### 3) Actualizar notas personales (PATCH)

```bash
curl -X PATCH "http://localhost:8000/recursos/RECURSO_ID" ^
  -H "X-User-Id: alejandro" ^
  -H "Content-Type: application/json" ^
  -d "{\"notas_personales\": \"Quiero verla de nuevo\"}"
```

En PowerShell (una línea):

```powershell
curl -X PATCH "http://localhost:8000/recursos/RECURSO_ID" -H "X-User-Id: alejandro" -H "Content-Type: application/json" -d '{\"notas_personales\": \"Quiero verla de nuevo\"}'
```

### 4) Eliminar recurso

```bash
curl -X DELETE "http://localhost:8000/recursos/RECURSO_ID" -H "X-User-Id: alejandro"
```

### 5) Comprobar que se eliminó

```bash
curl -X GET "http://localhost:8000/recursos" -H "X-User-Id: alejandro"
```

La lista debe devolver menos elementos (o vacía si era el único).
