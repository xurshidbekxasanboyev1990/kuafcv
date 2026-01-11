#!/bin/bash
# Production server diagnostics va fix
# SSH orqali serverga ulanib ishlatish: bash fix_production.sh

set -e
cd /root/kuafcv

echo "=== Git pull ==="
git pull origin master

echo ""
echo "=== Docker containers status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Backend logs (last 50 lines) ==="
docker compose -f docker-compose.prod.yml logs --tail=50 backend

echo ""
echo "=== Check if backend is responding ==="
curl -s http://localhost:4000/api/health || echo "Backend not responding on port 4000"

echo ""
echo "=== Restart all services ==="
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Wait for services to start ==="
sleep 10

echo ""
echo "=== Check services again ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Test backend health ==="
curl -s http://localhost:4000/api/health || echo "Backend still not responding"

echo ""
echo "=== Create Super Admin user ==="
docker compose -f docker-compose.prod.yml exec -T postgres psql -U kuafcv -d kuafcv -c "
INSERT INTO users (id, email, password_hash, role, full_name, permissions, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'xurshidbekxasanboyev@kuafcv.uz',
  '\$2a\$12\$JCw7Hona.mH.3S7KL/gHX.iSvARfGmc7L/R2T7mg6465WA34FRg3K',
  'ADMIN',
  'Xurshidbek Xasanboyev',
  '{\"all\": true}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash, 
  role = 'ADMIN',
  permissions = EXCLUDED.permissions;
" 2>/dev/null || echo "User creation skipped or failed"

echo ""
echo "=== Verify user created ==="
docker compose -f docker-compose.prod.yml exec -T postgres psql -U kuafcv -d kuafcv -c "SELECT id, email, role FROM users WHERE email = 'xurshidbekxasanboyev@kuafcv.uz';"

echo ""
echo "=== Final test - login endpoint ==="
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"xurshidbekxasanboyev@kuafcv.uz","password":"otamonam9900"}' | head -c 200

echo ""
echo ""
echo "=== DONE ==="
echo "Test URL: https://sysmasters.uz/xk9m2v7p"
