# Imagen base de Python
FROM python:3.11

# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo de dependencias
COPY requirements.txt .

# Instala dependencias
RUN pip install -r requirements.txt

# Copia el código del backend
COPY . .

# Expone el puerto del backend
EXPOSE 8000

# Ejecuta el servidor FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]