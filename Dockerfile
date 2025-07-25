FROM node:22-bullseye AS backend-builder

WORKDIR /app

COPY backend/ .

RUN rm -rf node_modules package-lock.json

RUN npm install

RUN npx prisma generate
RUN npm run build

FROM node:22-bullseye AS frontend-builder

WORKDIR /app

COPY frontend/ .

RUN rm -rf node_modules package-lock.json

RUN npm install

RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache nodejs npm

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    chromium-chromedriver \
    bash \
    dumb-init \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser


COPY --from=frontend-builder /app/dist /usr/share/nginx/html

COPY --from=backend-builder /app/dist /usr/share/nginx/backend
COPY --from=backend-builder /app/node_modules /usr/share/nginx/backend/node_modules
COPY --from=backend-builder /app/package*.json /usr/share/nginx/backend/

COPY --from=backend-builder /app/node_modules/.prisma /usr/share/nginx/.prisma
COPY --from=backend-builder /app/prisma /usr/share/nginx/prisma
COPY --from=backend-builder /app/package.json /usr/share/nginx/

COPY entrypoint.sh /usr/share/nginx/entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


CMD ["/bin/sh", "-c", "chmod +x /usr/share/nginx/entrypoint.sh && /usr/share/nginx/entrypoint.sh"]
