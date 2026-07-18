FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install @nestjs/mapped-types

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]