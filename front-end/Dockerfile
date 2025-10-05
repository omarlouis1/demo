# Dockerfile.frontend
FROM node:22.18.0-alpine

WORKDIR /app

# Copier package.json et vite.config.js pour utiliser le cache
COPY package*.json ./
COPY vite.config.js ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port utilisé par Vite
EXPOSE 5173

# Définir la variable d'environnement pour l'API backend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Démarrer le serveur Vite en mode dev accessible de l'extérieur
CMD ["npm", "run", "dev", "--", "--host=0.0.0.0"]
