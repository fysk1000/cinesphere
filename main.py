"""
Punto de entrada desde la raíz del proyecto.
Ejecuta la aplicación CineSphere (app.main) con uvicorn.
"""
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
