FROM node:6.11

WORKDIR /app
COPY ./ /app
RUN npm install -g bower
RUN npm install

WORKDIR /app/html
RUN bower --allow-root install

WORKDIR /app/html/userUploads
WORKDIR /app

RUN cp sample-config.js config.js

EXPOSE 3000