FROM node:19-alpine

WORKDIR /app

COPY package.json /app

RUN npm i

COPY . /app

VOLUME [ "/app/config" ]

EXPOSE 3000

CMD ["node", "."]