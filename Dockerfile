FROM node:22.13-alpine
WORKDIR /
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD npm start
