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
import smtplib
import random
from email.mime.text import MIMEText
import re
import pyotp
import qrcode
import base64
from io import BytesIO
from pydantic import BaseModel
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import hashlib

SECRET_KEY = "clave-secreta-super-segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Clave simétrica (debes guardarla segura en un entorno real)
# IMPORTANTE!!!!!  --> Esta clave no debe ponerse en el código (Ahora está porque es para el desarrollo) Lo suyo sería que fuese en una variable de entorno, o con AWS Secrets Manager, o archivo externo fuera del proyecto, etc.
ENCRYPTION_KEY = hashlib.sha256(b"tu_clave_super_segura").digest()
BLOCK_SIZE = 16

def cifrar(texto: str) -> str:
    cipher = AES.new(ENCRYPTION_KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(texto.encode(), BLOCK_SIZE))
    iv = cipher.iv
    return base64.b64encode(iv + ct_bytes).decode("utf-8")

def descifrar(texto_cifrado: str) -> str:
    raw = base64.b64decode(texto_cifrado)
    iv = raw[:BLOCK_SIZE]
    ct = raw[BLOCK_SIZE:]
    cipher = AES.new(ENCRYPTION_KEY, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(ct), BLOCK_SIZE).decode("utf-8")


def validar_password(password):
    if len(password) < 12:
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    if not re.search(r"\d", password): 
        return False
    return True

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  

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

def encargado_o_admin_required(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] not in (2, 3):
        raise HTTPException(status_code=403, detail="Acceso reservado a encargados o administradores")


def admin_required(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != 3:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

app = FastAPI()

def generar_codigo():
    return str(random.randint(100000, 999999))

def enviar_codigo_por_email(email, codigo):
    print(f"[SIMULADO] Código de verificación para {email}: {codigo}")
   # msg = MIMEText(f"Tu código de verificación es: {codigo}")
   # msg["Subject"] = "Código de verificación"
   # msg["From"] = "tuapp@tudominio.com"
   # msg["To"] = email

   # with smtplib.SMTP("smtp.tudominio.com", 587) as server:
   #     server.starttls()
   #     server.login("tuapp@tudominio.com", "contraseña-segura")
   #     server.send_message(msg)


# CORS: permitir acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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

        cursor.execute("SELECT RAZON_SOCIAL, DIRECCION FROM CLIENTE WHERE LOWER(RAZON_SOCIAL) LIKE LOWER(?)", 
                       ('%' + razon_social + '%',))
        results = cursor.fetchall()
        conn_data.close()

        if results:
            return {"clientes": [{"razon_social": row[0], "direccion": row[1]} for row in results]}
        else:
            raise HTTPException(status_code=404, detail="Clientes no encontrados")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    codigo_2fa = data.get("codigo_2fa")

    if not all([email, password, codigo_2fa]):
        raise HTTPException(status_code=400, detail="Faltan credenciales")

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password, otp_secret FROM CREDENCIALES WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    hashed_pwd, otp_secret = row

    if not pwd_context.verify(password, hashed_pwd):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    totp = pyotp.TOTP(otp_secret)
    if not totp.verify(codigo_2fa):
        raise HTTPException(status_code=401, detail="Código 2FA inválido")

    conn_data = sqlite3.connect(DB_DATA_PATH)
    cursor_data = conn_data.cursor()
    cursor_data.execute("SELECT ROL FROM COMERCIALES WHERE EMAIL = ?", (email,))
    rol_row = cursor_data.fetchone()
    conn_data.close()

    if not rol_row:
        raise HTTPException(status_code=403, detail="No se encontró el rol del usuario")

    rol = rol_row[0]

    access_token = create_access_token(data={"sub": email, "rol": rol})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/usuarios", dependencies=[Depends(admin_required)])
def listar_usuarios():
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT EMAIL, ROL, DELEGACION, \"NIVEL SEGURIDAD\" FROM COMERCIALES")
    usuarios = cursor.fetchall()
    conn.close()
    return [
        {"email": row[0], "rol": row[1], "delegacion": row[2], "nivel_seguridad": row[3]}
        for row in usuarios
    ]

class UsuarioUpdate(BaseModel):
    rol: int
    delegacion: str
    nivel_seguridad: int

@app.put("/usuarios/{email}", dependencies=[Depends(admin_required)])
def actualizar_usuario(email: str, datos: UsuarioUpdate):
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE COMERCIALES
        SET ROL = ?, DELEGACION = ?, "NIVEL SEGURIDAD" = ?
        WHERE EMAIL = ?
    """, (datos.rol, datos.delegacion, datos.nivel_seguridad, email))
    conn.commit()
    conn.close()
    return {"mensaje": "Usuario actualizado correctamente"}


@app.post("/registro/inicio")
async def inicio_registro(request: Request):
    data = await request.json()
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")

    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM COMERCIALES WHERE EMAIL = ?", (email,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Email no autorizado")
    conn.close()

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM CREDENCIALES WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Este email ya está registrado")
    conn.close()

   
    codigo = generar_codigo()
    print(f"[DEBUG] Código para {email}: {codigo}")
    
    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS codigos_verificacion (
            email TEXT PRIMARY KEY,
            codigo TEXT NOT NULL,
            creado_en DATETIME NOT NULL
        )
    """)
    cursor.execute("REPLACE INTO codigos_verificacion (email, codigo, creado_en) VALUES (?, ?, datetime('now'))", (email, codigo))
    conn.commit()
    conn.close()

    return {"mensaje": "Código enviado al correo"}



@app.post("/registro/verificar")
async def verificar_codigo(request: Request):
    data = await request.json()
    email = data.get("email")
    codigo_ingresado = data.get("codigo")
    password = data.get("password")

    if not all([email, codigo_ingresado, password]):
        raise HTTPException(status_code=400, detail="Faltan datos")

    if not validar_password(password):
        raise HTTPException(status_code=400, detail="La contraseña no cumple los requisitos")

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT codigo FROM codigos_verificacion WHERE email = ?", (email,))
    row = cursor.fetchone()

    if not row or row[0] != codigo_ingresado:
        conn.close()
        raise HTTPException(status_code=403, detail="Código incorrecto")

    
    hashed = pwd_context.hash(password)

    # Generar secreto TOTP
    otp_secret = pyotp.random_base32()
    otp_uri = pyotp.totp.TOTP(otp_secret).provisioning_uri(name=email, issuer_name="MiAppSegura")

    # Generar QR y convertir a base64
    qr_img = qrcode.make(otp_uri)
    buffer = BytesIO()
    qr_img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS CREDENCIALES (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            rol INTEGER,
            otp_secret TEXT
        )
    """)
    cursor.execute("INSERT OR REPLACE INTO CREDENCIALES (email, password, rol, otp_secret) VALUES (?, ?, ?, ?)",
                   (email, hashed, 2, otp_secret))
    cursor.execute("DELETE FROM codigos_verificacion WHERE email = ?", (email,))
    conn.commit()
    conn.close()

    return {
        "mensaje": "Registro completado",
        "qr_base64": qr_base64
    }

@app.post("/recuperar/inicio")
async def inicio_recuperacion(request: Request):
    data = await request.json()
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM CREDENCIALES WHERE email = ?", (email,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Usuario no encontrado")
    conn.close()

    codigo = generar_codigo()

    print(f"[RECUPERACIÓN] Código para {email}: {codigo}")  

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS codigos_recuperacion (
            email TEXT PRIMARY KEY,
            codigo TEXT NOT NULL,
            creado_en DATETIME NOT NULL
        )
    """)
    cursor.execute("REPLACE INTO codigos_recuperacion (email, codigo, creado_en) VALUES (?, ?, datetime('now'))", (email, codigo))
    conn.commit()
    conn.close()

    return {"mensaje": "Código de recuperación enviado al correo"}

@app.post("/recuperar/verificar")
async def verificar_recuperacion(request: Request):
    data = await request.json()
    email = data.get("email")
    codigo = data.get("codigo")
    nueva_password = data.get("nueva_password")

    if not all([email, codigo, nueva_password]):
        raise HTTPException(status_code=400, detail="Faltan datos")

    if not validar_password(nueva_password):
        raise HTTPException(status_code=400, detail="La nueva contraseña no cumple con los requisitos")

    conn = sqlite3.connect(DB_CREDENTIALS_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT codigo FROM codigos_recuperacion WHERE email = ?", (email,))
    row = cursor.fetchone()
    if not row or row[0] != codigo:
        conn.close()
        raise HTTPException(status_code=403, detail="Código incorrecto")

    cursor.execute("""
        SELECT PASSWORD, PASSWORD1, PASSWORD2, PASSWORD3, PASSWORD4, PASSWORD5
        FROM CREDENCIALES WHERE email = ?
    """, (email,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    hashed_nueva = pwd_context.hash(nueva_password)

    for previous in row:
        if pwd_context.verify(nueva_password, previous):
            conn.close()
            raise HTTPException(status_code=409, detail="No puedes reutilizar una contraseña anterior")

    # Rotar contraseñas
    cursor.execute("""
        UPDATE CREDENCIALES SET
            PASSWORD5 = PASSWORD4,
            PASSWORD4 = PASSWORD3,
            PASSWORD3 = PASSWORD2,
            PASSWORD2 = PASSWORD1,
            PASSWORD1 = PASSWORD,
            PASSWORD = ?
        WHERE email = ?
    """, (hashed_nueva, email))

    cursor.execute("DELETE FROM codigos_recuperacion WHERE email = ?", (email,))
    conn.commit()
    conn.close()

    return {"mensaje": "Contraseña actualizada correctamente"}

@app.get("/instalaciones")
async def get_instalaciones(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]

    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()

    cursor.execute('SELECT delegacion FROM COMERCIALES_DELEGACIONES WHERE email = ?', (email,))
    delegaciones = [row[0] for row in cursor.fetchall()]

    if not delegaciones:
        conn.close()
        raise HTTPException(status_code=404, detail="No se encontraron delegaciones asignadas.")

    cursor.execute('SELECT "NIVEL SEGURIDAD" FROM COMERCIALES WHERE EMAIL = ?', (email,))
    row = cursor.fetchone()
    if not row or row[0] is None:
        conn.close()
        raise HTTPException(status_code=500, detail="Nivel de seguridad no definido para el técnico.")

    nivel_tecnico = int(row[0])

    placeholders = ",".join(["?"] * len(delegaciones))
    cursor.execute(f"""
        SELECT PROYECTO, DETALLE_CONTRATO, DIRECCION, DELEGACION, LOCALIDAD, "NIVEL SEGURIDAD"
        FROM "Datos Instalaciones"
        WHERE DELEGACION IN ({placeholders})
        AND "NIVEL SEGURIDAD" <= ?
    """, (*delegaciones, nivel_tecnico))

    proyectos = cursor.fetchall()
    conn.close()

    resultado = [
        {
            "proyecto": p[0],
            "contrato": p[1],
            "direccion": p[2],
            "delegacion": p[3],
            "localidad": p[4],
            "nivel_seguridad": p[5]
        } for p in proyectos
    ]

    return {"proyectos": resultado}


@app.get("/tecnicos/{email}/delegaciones")
def get_delegaciones_tecnico(email: str, user: dict = Depends(admin_required)):
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT delegacion FROM COMERCIALES_DELEGACIONES WHERE email = ?", (email,))
    delegaciones = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"delegaciones": delegaciones}


@app.post("/tecnicos/{email}/delegaciones")
def asignar_delegaciones(email: str, payload: dict, user: dict = Depends(admin_required)):
    nuevas = payload.get("delegaciones", [])
    if not isinstance(nuevas, list):
        raise HTTPException(status_code=400, detail="El campo 'delegaciones' debe ser una lista.")
    
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    for delegacion in nuevas:
        cursor.execute(
            "INSERT OR IGNORE INTO COMERCIALES_DELEGACIONES (email, delegacion) VALUES (?, ?)",
            (email, delegacion)
        )
    conn.commit()
    conn.close()
    return {"msg": "Delegaciones asignadas"}


@app.delete("/tecnicos/{email}/delegaciones")
def eliminar_delegaciones(email: str, payload: dict, user: dict = Depends(admin_required)):
    eliminar = payload.get("delegaciones", [])
    if not isinstance(eliminar, list):
        raise HTTPException(status_code=400, detail="El campo 'delegaciones' debe ser una lista.")
    
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    for delegacion in eliminar:
        cursor.execute(
            "DELETE FROM COMERCIALES_DELEGACIONES WHERE email = ? AND delegacion = ?",
            (email, delegacion)
        )
    conn.commit()
    conn.close()
    return {"msg": "Delegaciones eliminadas"}


@app.get("/tecnicos")
def listar_tecnicos(current_user: dict = Depends(admin_required)):
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT EMAIL FROM COMERCIALES")
    tecnicos = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"tecnicos": tecnicos}

@app.get("/delegaciones", response_model=dict)
def listar_delegaciones(current_user: dict = Depends(admin_required)):
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT DELEGACION FROM DELEGACIONES")
    resultados = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"delegaciones": resultados}

@app.get("/mis-delegaciones")
def obtener_mis_delegaciones(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT delegacion FROM COMERCIALES_DELEGACIONES WHERE email = ?", (email,))
    delegaciones = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"delegaciones": delegaciones}

@app.get("/proyectos/{proyecto:path}/detalles")
def obtener_detalles_proyecto(proyecto: str = Path(...), user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_DATA_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT idp FROM PROYECTO WHERE proyecto = ?", (proyecto,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"detalles": []} 

    idp = row[0]

    cursor.execute("""
        SELECT e.Ide, t.Tipo, e.Estado, e.Marca, e.Modelo, e.Numero_serie, e.Mac, e.IP
        FROM EQUIPO e
        LEFT JOIN TIPO_EQUIPO t ON e.Idte = t.Idte
        WHERE e.Idp = ?
    """, (idp,))
    equipos = cursor.fetchall()

    detalles = []
    for eq in equipos:
        ide, tipo, estado, marca, modelo, numero_serie, mac, ip = eq

        cursor.execute("SELECT Usuario, Contrasena, PIN FROM CLAVES WHERE Ide = ?", (ide,))
        claves = cursor.fetchone()
        claves_dict = {}
        if claves:
            claves_dict = {
                "usuario": descifrar(claves[0]),
                "contrasena": descifrar(claves[1]),
                "pin": descifrar(claves[2])
            }

        detalles.append({
            "ide": ide,
            "tipo": tipo,
            "estado": estado,
            "marca": marca,
            "modelo": modelo,
            "numero_serie": numero_serie,
            "mac": mac,
            "ip": ip,
            "claves": claves_dict
        })

    conn.close()
    return {"detalles": detalles}
