import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Request

SECRET_KEY = "clave-secreta-super-segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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
    

@app.post("/login")
async def login(request: Request):
    credentials = await request.json()
    email = credentials.get("email")
    password = credentials.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Faltan campos")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT hash_password FROM usuarios WHERE EMAIL = ?", (email,))
        result = cursor.fetchone()
        conn.close()

        if not result:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        hashed_password = result[0]

        if not verify_password(password, hashed_password):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

        access_token = create_access_token(
            data={"sub": email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
