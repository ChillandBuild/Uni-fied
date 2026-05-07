FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Run Vite with --host so it's accessible from outside the container
CMD ["npm", "run", "dev"]
