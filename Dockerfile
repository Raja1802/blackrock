# Docker build command: docker build -t blk-hacking-ind-${NAME_LASTNAME} .
# Selected OS: Alpine Linux, chosen for its minimal footprint, enhanced security (lower attack surface), and fast startup times in containerized environments.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/

EXPOSE 5477

CMD ["node", "dist/server.js"]
