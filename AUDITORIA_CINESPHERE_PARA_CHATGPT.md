# Auditoría del proyecto CineSphere (FastAPI) — Resumen para ChatGPT

**Objetivo:** Con este resumen puedes entender el estado actual del proyecto y dejar la API 100% funcional (arranque, TMDB, base de datos, CRUD). No cambies nada que no sea estrictamente necesario para corregir errores o fallos de funcionamiento.

---

## 1. Qué es el proyecto

- **Nombre:** CineSphere API  
- **Stack:** FastAPI, SQLAlchemy (SQLite), httpx (cliente TMDB), python-dotenv, uvicorn  
- **Fases ya implementadas:**
  - **Fase 1:** CORS, middleware de logging, health check `GET /`, servidor en puerto 8000.
  - **Fase 2:** Integración con TMDB; endpoint `GET /pelicula/{criterio}` que busca en TMDB y devuelve el primer resultado en JSON limpio.
  - **Fase 3:** Persistencia SQLite (tabla `mis_favoritos`), CRUD en `/recursos` y helper `POST /recursos/from-tmdb/{tmdb_id}`.

---

## 2. Estructura de archivos relevante

```
CineSphere_Fase1/          ← raíz del proyecto (donde está .env y cinesphere.db)
├── app/
│   ├── main.py             ← FastAPI app, lifespan, rutas /, /config, /pelicula, include_router(recursos)
│   ├── core/
│   │   └── config.py       ← PROJECT_ROOT, load_dotenv(.env), TMDB_*, DATABASE_URL
│   ├── db/
│   │   ├── database.py     ← engine, SessionLocal, Base, get_db(), init_db() [import de models DENTRO de init_db]
│   │   └── models.py       ← MisFavoritos(Base), importa Base desde app.db.database
│   ├── schemas/
│   │   └── recursos.py     ← RecursoCreate, RecursoUpdate, RecursoResponse (Pydantic)
│   ├── routers/
│   │   └── recursos.py     ← prefix="/recursos", POST "", GET "", PATCH /{id}, DELETE /{id}, POST /from-tmdb/{tmdb_id}
│   └── services/
│       └── tmdb.py        ← get_movie_by_id(), search_movie_first(); usan TMDB_API_KEY, lanzan 502/503 cuando toca
├── main.py                 ← launcher: uvicorn.run("app.main:app", ...)
├── requirements.txt       ← fastapi, uvicorn[standard], httpx, python-dotenv, sqlalchemy
├── .env                    ← TMDB_API_KEY=..., TMDB_BASE_URL=..., TMDB_IMAGE_BASE=... (obligatorio TMDB_API_KEY)
├── .env.example
└── cinesphere.db          ← se crea al arrancar si no existe (SQLite en raíz)
```

- **Raíz del proyecto:** La carpeta que contiene la carpeta `app` (en Windows suele ser `CineSphere_Fase1`).  
- **config.py** define `PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent` y carga `.env` desde `PROJECT_ROOT / ".env"`. La base de datos usa `PROJECT_ROOT / "cinesphere.db"`.

---

## 3. Import circular (ya resuelto)

- **Problema que había:** `app/db/database.py` importaba `app.db.models` al cargar el módulo, y `models.py` importa `Base` de `database.py` → ImportError con "partially initialized module".
- **Solución actual:** En `database.py` **no** se importa `models` a nivel de módulo. Solo se hace un import perezoso **dentro** de `init_db()`: `from app.db import models` y luego `Base.metadata.create_all(bind=engine)`. Así `Base` ya está definido cuando se carga `models`. No reintentes importar `models` al inicio de `database.py`.

---

## 4. Variables de entorno

- Se cargan en `app/core/config.py` con `load_dotenv(dotenv_path=PROJECT_ROOT / ".env")`.
- **TMDB_API_KEY:** Obligatoria para `/pelicula/{criterio}` y para `POST /recursos/from-tmdb/{tmdb_id}`. Si falta, pelicula devuelve 500 y from-tmdb puede devolver 502.
- **TMDB_BASE_URL**, **TMDB_IMAGE_BASE:** Opcionales; por defecto las URLs estándar de TMDB.
- No hay clave TMDB hardcodeada; todo desde `.env`.

---

## 5. Endpoints que deben funcionar

| Método y ruta | Descripción | Notas |
|----------------|-------------|--------|
| GET / | Health check | Fase 1. Devuelve status, message, server_time. |
| GET /config | Debug TMDB | Devuelve tmdb_key_loaded (bool), tmdb_base_url, image_base_url. No expone la API key. |
| GET /pelicula/{criterio} | Búsqueda TMDB | Fase 2. Usa search_movie_first(); 404 sin resultados, 502/503 si TMDB falla, 500 si falta API key. |
| POST /recursos | Crear recurso desde body | Body: RecursoCreate. Usuario por header X-User-Id (default "demo-user"). 409 si duplicado (mismo usuario + external_id + media_type). |
| GET /recursos | Listar recursos del usuario | Filtrado por X-User-Id. |
| PATCH /recursos/{recurso_id} | Actualizar notas y/o user_rating | Solo si el recurso es del usuario. 404 si no existe. |
| DELETE /recursos/{recurso_id} | Borrar recurso | Solo si es del usuario. 204 sin cuerpo. |
| POST /recursos/from-tmdb/{tmdb_id} | Guardar película desde TMDB | Obtiene detalle de TMDB (get_movie_by_id) y la inserta para el usuario. 409 si ya está en favoritos. |

---

## 6. Base de datos

- **Motor:** SQLite, archivo `cinesphere.db` en la raíz del proyecto.
- **Modelo:** `MisFavoritos` en `app/db/models.py`. Campos: id, id_usuario, external_id, media_type, fecha_creacion, notas_personales, title, rating, release_date, image, user_rating. Constraint UNIQUE (id_usuario, external_id, media_type).
- **Inicialización:** En el lifespan de `app/main.py` se llama a `init_db()` antes de crear el cliente httpx. Eso ejecuta el import de `models` y `Base.metadata.create_all(bind=engine)`.
- **Sesión:** Los endpoints de recursos usan `Depends(get_db)`; la sesión se cierra al terminar la petición.

---

## 7. Cómo ejecutar (Windows)

Desde la raíz del proyecto (donde está `app/` y `requirements.txt`):

```powershell
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternativa: `python main.py` (el `main.py` de la raíz solo lanza uvicorn con `app.main:app`).

---

## 8. Comprobaciones para “dejarlo funcional”

1. **Arranque:** `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` sin ImportError ni errores al cargar.
2. **GET /** → 200 y JSON con status/message/server_time.
3. **GET /config** → 200; si hay `.env` con TMDB_API_KEY, `tmdb_key_loaded` debe ser true.
4. **GET /pelicula/Inception** (o cualquier título) → 200 con JSON de película (id, title, media_type, rating, release_date, image) o 404 si no hay resultados. Si falta TMDB_API_KEY → 500.
5. **POST /recursos/from-tmdb/27205** con header **X-User-Id: alejandro** → 201 y recurso creado. Segunda vez misma película mismo usuario → 409.
6. **GET /recursos** con **X-User-Id: alejandro** → 200 y lista con al menos el recurso creado.
7. **PATCH /recursos/{id}** con body `{"notas_personales": "texto"}` y **X-User-Id: alejandro** → 200 y recurso actualizado.
8. **DELETE /recursos/{id}** con **X-User-Id: alejandro** → 204. Luego GET /recursos → el recurso ya no aparece.
9. **Persistencia:** Tras crear un recurso, reiniciar el servidor y hacer GET /recursos con el mismo X-User-Id; los datos deben seguir en la respuesta (están en `cinesphere.db`).

---

## 9. Posibles fallos y qué revisar

- **ImportError / circular:** Asegurarse de que en `database.py` no haya `from app.db import models` (ni `from app.db.models import ...`) al nivel superior del archivo; solo dentro de `init_db()`.
- **TMDB_API_KEY no cargada:** Comprobar que `.env` está en la raíz del proyecto (misma carpeta que `app/`) y que contiene `TMDB_API_KEY=tu_clave`. Revisar que `config.py` usa `PROJECT_ROOT` y `load_dotenv(dotenv_path=PROJECT_ROOT / ".env")`.
- **Base de datos no se crea o no persiste:** Verificar que el proceso se ejecuta con el directorio de trabajo en la raíz del proyecto (donde está `app/`), para que `PROJECT_ROOT` apunte al sitio correcto y `cinesphere.db` se cree/use ahí.
- **502 en from-tmdb:** Puede ser TMDB no disponible, ID inválido o API key incorrecta. Revisar `get_movie_by_id` en `services/tmdb.py` y que el cliente httpx se reciba en `request.app.state.http_client`.

---

## 10. Resumen para ChatGPT

- Proyecto FastAPI en 3 fases; Fase 3 añade SQLite y CRUD en `/recursos`.
- El import circular entre `database.py` y `models.py` está resuelto con import perezoso de `models` solo en `init_db()`.
- La configuración y la ruta de `.env` y de la DB dependen de `PROJECT_ROOT` en `app/core/config.py`.
- Objetivo: que el servidor arranque sin errores y que los endpoints anteriores respondan como se describe, incluyendo persistencia en SQLite y uso correcto de la API key de TMDB desde `.env`.

Usa este documento para diagnosticar y corregir solo lo necesario hasta dejar la API funcional, sin alterar la lógica de rutas ni las fases 1 y 2 salvo que sea imprescindible para corregir un fallo.
