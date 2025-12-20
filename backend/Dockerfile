# backend/Dockerfile

# 1. Use Node.js 18 (Alpine is a lightweight version)
FROM node:18-alpine

# 2. Create app directory
WORKDIR /app

# 3. Copy package files first (better caching)
COPY package*.json ./

# 4. Install backend dependencies
RUN npm install

# 5. Copy the rest of your backend code
COPY . .

# 6. Expose the port your server runs on
EXPOSE 5000

# 7. Start the server
CMD ["npm", "start"]