# CineSphere – Lista de verificación final (Fase 4)

## 1. Instrucciones de ejecución paso a paso (Windows)

### Backend (API FastAPI)

1. Abre una terminal (PowerShell o CMD) en la **raíz del proyecto** (`CineSphere_Fase1`).
2. Activa el entorno virtual:
   ```powershell
   venv\Scripts\activate
   ```
3. (Opcional) Instala dependencias si hace falta:
   ```powershell
   pip install -r requirements.txt
   ```
4. Arranca el servidor:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. Deja esta terminal abierta. Deberías ver algo como:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

### Frontend

1. Abre **otra** terminal en la raíz del proyecto (`CineSphere_Fase1`).
2. Sirve el frontend con uno de estos métodos:

   **Opción A – Live Server (recomendado)**  
   - En VS Code, instala la extensión **Live Server**.  
   - Clic derecho en `frontend/index.html` → **Open with Live Server**.  
   - Se abrirá el navegador automáticamente.

   **Opción B – Servidor HTTP de Python**  
   ```powershell
   python -m http.server 8080
   ```
   Luego abre en el navegador: **http://localhost:8080/frontend/**

3. No cierres esta terminal mientras pruebes el frontend.

---

## 2. URLs a abrir

| Qué | URL |
|-----|-----|
| **API (backend)** | http://127.0.0.1:8000 |
| **Documentación Swagger** | http://127.0.0.1:8000/docs |
| **Health check** | http://127.0.0.1:8000/ |
| **Frontend** | La que abra Live Server (ej. http://127.0.0.1:5500/frontend/) o http://localhost:8080/frontend/ |

Para las pruebas del checklist, trabaja siempre desde la **URL del frontend** en el navegador.

---

## 3. Lista de verificación (checklist)

Marca cada ítem cuando lo compruebes.

### Backend en marcha

- [ ] **Backend corriendo:** La terminal del backend no muestra errores y aparece `Uvicorn running on http://0.0.0.0:8000`.
- [ ] **Health check:** Abrir http://127.0.0.1:8000/ devuelve JSON con `"status": "online"` y `"message": "Servidor Arriba"`.

### Frontend

- [ ] **Frontend carga:** Al abrir la URL del frontend se ve la página "CineSphere" con título, subtítulo, campo de búsqueda, botón "Buscar" y sección "Mis favoritos".
- [ ] **Lista de favoritos carga:** En "Mis favoritos" aparece "Cargando favoritos..." y luego o la lista de favoritos o el mensaje "Aún no tienes favoritos...".

### Búsqueda

- [ ] **Búsqueda con texto:** Escribir una película (ej. "Inception") y pulsar "Buscar". No debe aparecer error de conexión.
- [ ] **Validación de vacío:** Dejar el campo vacío y pulsar "Buscar". Debe mostrarse un mensaje de error (ej. "Escribe el nombre de una película...").
- [ ] **Tarjeta de resultado:** Tras una búsqueda correcta aparece la sección "Resultado de búsqueda" con imagen (o "Sin imagen"), título, rating, fecha, tipo "movie" y el botón "Guardar en favoritos".

### Guardar favorito

- [ ] **Guardar favorito:** Con un resultado de búsqueda visible, (opcional) escribir algo en "Notas", pulsar "Guardar en favoritos". Debe aparecer un mensaje de éxito (ej. "Película guardada en favoritos").
- [ ] **Duplicado:** Volver a pulsar "Guardar en favoritos" para la misma película. Debe aparecer un mensaje de error tipo "ya está en tu lista" (409).

### Lista de favoritos

- [ ] **Favorito en la lista:** En "Mis favoritos" aparece una tarjeta con la película guardada: título, rating, imagen (si la hay), notas si las escribiste, y botón "Eliminar".
- [ ] **Actualizar lista:** Pulsar "Actualizar lista". La lista se actualiza sin errores.

### Eliminar favorito

- [ ] **Eliminar:** Pulsar "Eliminar" en una tarjeta de favorito. Debe mostrarse mensaje de éxito y la tarjeta debe desaparecer de la lista.
- [ ] **Lista vacía tras eliminar:** Si era el único favorito, debe mostrarse de nuevo "Aún no tienes favoritos...".

### Persistencia

- [ ] **Guardar al menos un favorito** (búsqueda → Guardar en favoritos).
- [ ] **Reiniciar el backend:** En la terminal del backend pulsar Ctrl+C y volver a ejecutar:
  ```powershell
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- [ ] **Recargar el frontend** (F5 o "Actualizar lista").
- [ ] **Persistencia correcta:** Los favoritos siguen apareciendo en la lista. Los datos se han conservado en `cinesphere.db` tras reiniciar el servidor.

---

## 4. Explicación breve para el profesor

### Qué hace el frontend

El frontend de la Fase 4 es una **interfaz de usuario en HTML, CSS (Tailwind) y JavaScript** que permite al usuario:

- Buscar películas por nombre (consumiendo la API de TMDB a través de nuestro backend).
- Ver el primer resultado en una tarjeta con imagen, título, valoración y fecha.
- Guardar esa película en “Mis favoritos” (almacenado en nuestra base de datos).
- Ver la lista de favoritos guardados.
- Eliminar favoritos de la lista.

Todo esto sin recargar la página de forma manual; las peticiones se hacen en segundo plano (fetch) y la página se actualiza según la respuesta del servidor.

### Cómo consume el backend

El frontend se ejecuta en el **navegador** (origen distinto al del backend, por ejemplo `http://localhost:8080` o `http://127.0.0.1:5500`), mientras que la API está en **http://127.0.0.1:8000**. Por tanto, cada acción del usuario (buscar, guardar, listar, eliminar) se traduce en una petición HTTP desde el navegador al backend:

- **GET /pelicula/{criterio}** → búsqueda.
- **POST /recursos** → guardar favorito (con header `X-User-Id` y body JSON).
- **GET /recursos** → listar favoritos (con header `X-User-Id`).
- **DELETE /recursos/{id}** → eliminar favorito (con header `X-User-Id`).

El frontend no tiene base de datos propia; toda la persistencia y la lógica de negocio están en el backend y en SQLite.

### Relación de CORS con esta fase

Las peticiones del frontend al backend son **cross-origin**: el origen (dominio/puerto del frontend) es distinto al del API (puerto 8000). Por defecto, el navegador bloquea estas peticiones por seguridad. Para que el frontend pueda consumir la API desde otro puerto, el **backend debe permitir el origen del frontend** mediante CORS (Cross-Origin Resource Sharing). En nuestro proyecto, el backend tiene CORS configurado con `allow_origins=["*"]`, es decir, permite peticiones desde cualquier origen. Así, la Fase 4 puede ejecutarse en un servidor local (Live Server o `python -m http.server`) y comunicarse sin error con la API en el puerto 8000.

### Cómo se refleja la persistencia en SQLite

La persistencia es responsabilidad del **backend**. Cuando el usuario guarda un favorito, el frontend envía un **POST /recursos**; el backend recibe el body, valida con Pydantic y guarda un nuevo registro en la tabla **mis_favoritos** de la base de datos **cinesphere.db** (SQLite) en la raíz del proyecto. Cuando el usuario pide la lista de favoritos, el backend hace un **GET /recursos**, lee de la misma tabla y devuelve JSON. Si se reinicia el servidor, el archivo **cinesphere.db** no se borra, así que al volver a arrancar el backend y recargar el frontend, **GET /recursos** sigue devolviendo los mismos datos. Eso demuestra que la persistencia está en SQLite y que el frontend solo muestra lo que el backend le devuelve.

---

## 5. Capturas recomendadas como evidencia

Se recomienda tomar estas capturas para documentar la Fase 4:

| # | Captura | Qué mostrar |
|---|---------|-------------|
| 1 | **Backend en ejecución** | Terminal con `uvicorn` corriendo y mensaje `Uvicorn running on http://0.0.0.0:8000`. |
| 2 | **Frontend cargado** | Página CineSphere completa: título, búsqueda, sección de favoritos (vacía o con mensaje inicial). |
| 3 | **Búsqueda y tarjeta** | Campo de búsqueda con un término (ej. "Inception"), resultado visible: tarjeta con imagen, título, rating, fecha y botón "Guardar en favoritos". |
| 4 | **Mensaje al guardar** | Mensaje de éxito tras pulsar "Guardar en favoritos" (ej. "Película guardada en favoritos"). |
| 5 | **Lista con favoritos** | Sección "Mis favoritos" con al menos una tarjeta (título, imagen, rating, notas si hay, botón "Eliminar"). |
| 6 | **Eliminar favorito** | Mensaje de éxito al eliminar y lista actualizada (o mensaje "Aún no tienes favoritos..."). |
| 7 | **Persistencia** | Después de reiniciar el backend: misma ventana del frontend con la lista de favoritos aún cargada (o captura del backend reiniciado + frontend mostrando los datos). |
| 8 | **(Opcional) Base de datos** | Contenido de la tabla `mis_favoritos` en SQLite (con un visor como DB Browser for SQLite o una consulta en terminal) para mostrar que los datos están guardados en `cinesphere.db`. |

Con estas capturas se demuestra el flujo completo: backend en marcha, frontend cargando, búsqueda, guardado, listado, eliminación y persistencia tras reinicio.
