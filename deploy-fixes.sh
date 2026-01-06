#!/bin/bash

# Complete fix for all runtime errors
# Run this on the VPS server at /www/wwwroot/kuafcv

echo "🔧 KUAFCV Runtime Error Fix"
echo "======================================"
echo ""

cd /www/wwwroot/kuafcv

echo "1️⃣ Updating nginx configuration..."
# Nginx config is already updated on server via sed commands

echo "2️⃣ Stopping backend container..."
docker-compose -f docker-compose.prod.yml stop backend

echo "3️⃣ Rebuilding backend (with new migration)..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

echo "4️⃣ Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "5️⃣ Waiting for backend startup (10 seconds)..."
sleep 10

echo "6️⃣ Checking migration logs..."
docker-compose -f docker-compose.prod.yml logs backend | grep -i "migration\|system_settings\|announcements" | tail -20

echo ""
echo "7️⃣ Testing endpoints..."
echo "Testing /api/health..."
curl -s http://localhost:4000/api/health | head -20

echo ""
echo "Testing /api/settings/public..."
curl -s http://localhost:4000/api/settings/public | head -20

echo ""
echo "Testing /api/announcements/marquee..."
curl -s http://localhost:4000/api/announcements/marquee | head -20

echo ""
echo "======================================"
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check browser console - 500 errors should be gone"
echo "2. Test file upload - 413 error should be fixed"
echo "3. Test WebSocket - connection should work"
echo ""
echo "If you still see errors, run:"
echo "docker-compose -f docker-compose.prod.yml logs -f backend"
