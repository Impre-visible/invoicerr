#!/bin/sh

# Navigate to the backend directory where the compiled code and config are
cd /usr/share/nginx/backend/src

# Push database schema using the standard Prisma command
echo "Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss --schema=./prisma/schema.prisma

# Start the backend service
echo "Starting backend service..."
node main.js &

# Wait for backend to be ready
echo "Waiting for backend to start..."
while ! nc -z localhost 3000; do
    sleep 1
done

echo "Backend is ready, starting nginx..."
nginx -g "daemon off;" >/dev/null 2>&1