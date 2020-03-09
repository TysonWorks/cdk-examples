FROM node:alpine

WORKDIR /app

COPY . .

RUN npm i npm@latest -g
RUN npm install --only=production

EXPOSE 8090

ENTRYPOINT ["/bin/sh", "start"]