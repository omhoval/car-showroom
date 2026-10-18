FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN NODE_ENV=test MONGO_URI=mongodb://localhost/test JWT_ACCESS_SECRET=build-check-secret-at-least-32-characters CLIENT_URL=http://localhost node -e "require('./src/app')"
EXPOSE 5000
CMD ["node", "server.js"]
