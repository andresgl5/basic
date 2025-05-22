import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Path
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # Lo usamos solo para leer tokens

# Función para decodificar el token
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("rol")
        if email is None or rol is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"email": email, "rol": rol}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def only_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != 3:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

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
DB_DATA_PATH = os.path.join(BASE_DIR, "data.sqlite")
DB_CREDENTIALS_PATH = os.path.join(BASE_DIR, "credenciales.sqlite")

@app.get("/buscar/")
def buscar_cliente(razon_social: str):
    try:
        conn_data = sqlite3.connect(DB_DATA_PATH)
        cursor = conn_data.cursor()

        # Buscar todos los clientes cuyo nombre contenga el término de búsqueda
        cursor.execute("SELECT RAZON_SOCIAL, DIRECCION FROM CLIENTE WHERE LOWER(RAZON_SOCIAL) LIKE LOWER(?)", 
                       ('%' + razon_social + '%',))
        results = cursor.fetchall()
        conn_data.close()

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
        conn_credentials = sqlite3.connect(DB_CREDENTIALS_PATH)
        cursor = conn_credentials.cursor()

        cursor.execute("SELECT password, rol FROM CREDENCIALES WHERE email = ?", (email,))
        result = cursor.fetchone()
        conn_credentials.close()

        if not result:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        hashed_password, rol = result

        if not verify_password(password, hashed_password):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

        access_token = create_access_token(
            data={"sub": email, "rol": str(rol)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register")
async def register(request: Request, current_user: dict = Depends(only_admin)):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    rol = data.get("rol", "tecnico")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña son obligatorios")

    try:
        conn_data = sqlite3.connect(DB_DATA_PATH)
        cursor = conn_data.cursor()

        cursor.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
        if cursor.fetchone():
            conn_data.close()
            raise HTTPException(status_code=400, detail="El usuario ya existe")

        hashed_password = pwd_context.hash(password)

        cursor.execute("INSERT INTO usuarios (email, hash_password, rol) VALUES (?, ?, ?)", 
                       (email, hashed_password, rol))
        conn_data.commit()
        conn_data.close()

        return {"mensaje": "Usuario creado exitosamente"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usuarios")
def get_usuarios(current_user: dict = Depends(only_admin)):
    try:
        conn_data = sqlite3.connect(DB_DATA_PATH)
        cursor = conn_data.cursor()
        cursor.execute("SELECT id, email, rol FROM COMERCIALES")
        usuarios = cursor.fetchall()
        conn_data.close()

        usuarios_list = [
            {"id": row[0], "email": row[1], "rol": row[2]}
            for row in usuarios
        ]

        return {"usuarios": usuarios_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int = Path(..., description="ID del usuario a eliminar"), current_user: dict = Depends(only_admin)):
    try:
        conn_data = sqlite3.connect(DB_DATA_PATH)
        cursor = conn_data.cursor()
        cursor.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
        conn_data.commit()
        conn_data.close()

        return {"mensaje": "Usuario eliminado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/usuarios/{usuario_id}")
async def actualizar_usuario(usuario_id: int, request: Request, current_user: dict = Depends(only_admin)):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    rol = data.get("rol")

    if not email or not rol:
        raise HTTPException(status_code=400, detail="Email y rol son obligatorios")

    try:
        conn_data = sqlite3.connect(DB_DATA_PATH)
        cursor = conn_data.cursor()

        if password:
            hashed_password = pwd_context.hash(password)
            cursor.execute(
                "UPDATE usuarios SET email = ?, hash_password = ?, rol = ? WHERE id = ?",
                (email, hashed_password, rol, usuario_id)
            )
        else:
            cursor.execute(
                "UPDATE usuarios SET email = ?, rol = ? WHERE id = ?",
                (email, rol, usuario_id)
            )

        conn_data.commit()
        conn_data.close()

        return {"mensaje": "Usuario actualizado exitosamente"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
