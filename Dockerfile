FROM node:16-alpine

WORKDIR /app

COPY . .

RUN npm install 

CMD ["node","easybot.js"]