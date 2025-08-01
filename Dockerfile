FROM node:22-bullseye AS backend-builder

WORKDIR /app

COPY backend/package.json ./package.json

RUN npm install

COPY backend/. .

RUN npx prisma generate
RUN npm run build

FROM node:22-bullseye AS frontend-builder

WORKDIR /app

COPY frontend/package.json ./package.json

RUN npm install

COPY frontend/. .

RUN npm run build

FROM ghcr.io/impre-visible/invoicerr-server-image:latest

ENV PLUGIN_DIR=/usr/share/nginx/plugins

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
