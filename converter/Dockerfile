FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
  libreoffice \
  libreoffice-impress \
  libreoffice-writer \
  fonts-dejavu \
  fonts-liberation \
  fonts-noto-core \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.mjs ./

EXPOSE 10000

CMD ["npm", "start"]
