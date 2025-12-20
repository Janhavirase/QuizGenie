# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose Vite's port
EXPOSE 5173

# IMPORTANT: --host is needed to expose the app outside the container
CMD ["npm", "run", "dev", "--", "--host"]