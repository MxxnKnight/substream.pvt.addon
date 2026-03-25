FROM node:18-alpine

WORKDIR /app

# Copy root package.json and install root dependencies
COPY package*.json ./
RUN npm install

# Copy frontend folder and install its dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy the rest of the application code
COPY . .

# Build frontend
RUN npm run build:frontend

EXPOSE 3000

CMD ["node", "src/server.js"]
