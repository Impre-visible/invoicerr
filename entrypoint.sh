#!/bin/sh

cd /usr/share/nginx
npx prisma db push --skip-generate --accept-data-loss

cd /usr/share/nginx/backend
echo "Waiting for backend to start..."
node main.js &

while ! nc -z localhost 3000; do
    sleep 1
done

nginx -g "daemon off;" >/dev/null 2>&1