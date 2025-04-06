import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

# CORS: permitir acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # puedes restringir esto si prefieres
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data.sqlite")

@app.get("/buscar/")
def buscar_cliente(razon_social: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Buscar todos los clientes cuyo nombre contenga el término de búsqueda
        cursor.execute("SELECT RAZON_SOCIAL, DIRECCION FROM CLIENTE WHERE LOWER(RAZON_SOCIAL) LIKE LOWER(?)", 
                       ('%' + razon_social + '%',))
        results = cursor.fetchall()
        conn.close()

        # Si hay resultados, los devolvemos
        if results:
            return {"clientes": [{"razon_social": row[0], "direccion": row[1]} for row in results]}
        else:
            raise HTTPException(status_code=404, detail="Clientes no encontrados")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))