FROM node:20

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install 

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto del backend
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "-r","dotenv/config", "./src/server.js"]
