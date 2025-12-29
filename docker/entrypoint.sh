#!/bin/sh
set -e

echo "Syncing database schema..."
npx prisma db push

echo "Starting application..."
exec node server.js