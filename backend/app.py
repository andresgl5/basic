from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Variables globales para el contador y el texto
counter = 0
stored_text = ""

# Modelo de datos para recibir el texto
class TextInput(BaseModel):
    text: str

# Endpoint para obtener el mensaje de bienvenida
@app.get("/")
def read_root():
    return {"message": "¡Hola, esto es FastAPI en Docker! 🚀"}

# Endpoint para obtener el contador
@app.get("/counter")
def get_counter():
    return {"counter": counter}

# Endpoint para incrementar el contador
@app.post("/increment")
def increment_counter():
    global counter
    counter += 1
    return {"counter": counter}

# Endpoint para recibir y almacenar texto
@app.post("/text")
def store_text(data: TextInput):
    global stored_text
    stored_text = data.text
    return {"storedText": stored_text}