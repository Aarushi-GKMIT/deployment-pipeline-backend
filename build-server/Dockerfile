FROM node:20-slim

RUN apt-get update && apt-get install -y git

WORKDIR /home/app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x script.js

CMD ["node", "script.js"]
