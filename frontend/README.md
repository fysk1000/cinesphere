# CineSphere - Frontend (Fase 4)

Interfaz HTML + Tailwind + JavaScript que consume la API FastAPI local.

## Requisitos

- Backend corriendo en `http://127.0.0.1:8000` (uvicorn).

## Cómo ejecutar el frontend

### Opción 1: Live Server (recomendado)

1. En VS Code instala la extensión **Live Server**.
2. Clic derecho en `index.html` → **Open with Live Server**.
3. Se abrirá el navegador en una URL tipo `http://127.0.0.1:5500/frontend/` (o similar). Usa esa misma URL si te pide la carpeta.

Si Live Server abre la raíz del proyecto, navega a `frontend/index.html` o abre directamente el archivo y usa "Open with Live Server" desde ahí.

### Opción 2: Servidor HTTP de Python

Desde la **raíz del proyecto** (CineSphere_Fase1):

```bash
python -m http.server 8080
```

Luego en el navegador: **http://localhost:8080/frontend/**

### Opción 3: Abrir el archivo directamente

Abrir `index.html` en el navegador (doble clic o arrastrar al navegador) puede funcionar, pero algunas peticiones a `http://127.0.0.1:8000` pueden bloquearse por CORS si el origen es `file://`. Usar Live Server o `python -m http.server` evita eso.

## Resumen

- **Live Server** o **python -m http.server** son suficientes para desarrollo local.
- Asegúrate de tener el backend en marcha: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
