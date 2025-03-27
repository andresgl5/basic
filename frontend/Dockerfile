# Usa una imagen base de Node.js
FROM node:lts

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de proyecto (package.json y package-lock.json)
COPY package.json package-lock.json /app/

# Instala las dependencias de Node.js
RUN npm install
RUN npm install @vitejs/plugin-react --save-dev

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto en el que Vite estará corriendo
EXPOSE 5173

# Comando para arrancar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev"]