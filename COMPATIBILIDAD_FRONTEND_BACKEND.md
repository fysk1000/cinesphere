# Compatibilidad Frontend ↔ Backend (CineSphere)

## Resumen

El frontend (Phase 4) y el backend (Fases 1–3) son **compatibles**. Se aplicó un ajuste mínimo en el esquema `RecursoCreate` para normalizar cadenas vacías en campos opcionales (`release_date`, `image`, `notas_personales`) a `None`, sin cambiar el comportamiento de las fases anteriores.

---

## Endpoints que usa el frontend

| Acción en el frontend | Método y endpoint | Header / Body |
|------------------------|-------------------|----------------|
| **Búsqueda de película** | `GET /pelicula/{criterio}` | Sin header. Ejemplo: `GET /pelicula/Inception`. |
| **Guardar en favoritos** | `POST /recursos` | Header: `X-User-Id: alejandro`. Body JSON: `external_id`, `title`, `media_type`, `rating`, `release_date`, `image`, `notas_personales`. |
| **Listar favoritos** | `GET /recursos` | Header: `X-User-Id: alejandro`. |
| **Eliminar favorito** | `DELETE /recursos/{id}` | Header: `X-User-Id: alejandro`. `{id}` = id numérico del recurso (respuesta de GET /recursos). |

---

## Detalle por endpoint

1. **Búsqueda**  
   - **Endpoint:** `GET http://127.0.0.1:8000/pelicula/{criterio}`  
   - El frontend usa este endpoint al pulsar «Buscar».  
   - La respuesta (id, title, media_type, rating, release_date, image) se muestra en la tarjeta y se usa para «Guardar en favoritos».

2. **Guardar favoritos**  
   - **Endpoint:** `POST http://127.0.0.1:8000/recursos`  
   - Header: `X-User-Id: alejandro`.  
   - Body: el mismo que acepta el backend (`RecursoCreate`: external_id, title, media_type, rating, release_date, image, notas_personales).  
   - 201 = creado; 409 = ya existe para ese usuario.

3. **Listar favoritos**  
   - **Endpoint:** `GET http://127.0.0.1:8000/recursos`  
   - Header: `X-User-Id: alejandro`.  
   - Devuelve la lista de recursos del usuario; el frontend pinta las tarjetas y usa cada `id` para eliminar.

4. **Eliminar favorito**  
   - **Endpoint:** `DELETE http://127.0.0.1:8000/recursos/{id}`  
   - Header: `X-User-Id: alejandro`.  
   - `{id}` es el id del recurso (campo `id` de cada elemento de GET /recursos).  
   - Tras un 204, el frontend vuelve a llamar a GET /recursos para actualizar la lista.

---

## Cambio realizado en el backend

- **Archivo:** `app/schemas/recursos.py`  
- **Cambio:** en `RecursoCreate` se añadió un validador que convierte cadenas vacías en `None` para los campos opcionales `release_date`, `image` y `notas_personales`, de modo que el payload enviado por el frontend se acepte siempre que envíe `""` en esos campos.  
- **Fases 1, 2 y 3:** sin cambios; el resto de endpoints se mantiene igual.
