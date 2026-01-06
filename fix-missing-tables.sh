#!/bin/bash

# Fix for missing tables (system_settings and announcements)
# Run this on the server

cd /www/wwwroot/kuafcv

echo "🔧 Stopping backend container..."
docker-compose -f docker-compose.prod.yml stop backend

echo "📦 Rebuilding backend..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

echo "🚀 Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "⏳ Waiting for backend to start..."
sleep 5

echo "📋 Checking logs..."
docker-compose -f docker-compose.prod.yml logs --tail=50 backend

echo "✅ Done! Check if migration ran successfully."
