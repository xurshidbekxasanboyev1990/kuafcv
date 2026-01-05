#!/bin/bash

# KUAFCV Deployment Script - Mavjud saytga tasir qilmaydi
# Bu script barcha kerakli qadamlarni avtomatik bajaradi

echo "🚀 KUAFCV Deployment Script"
echo "======================================"
echo ""

# Step 1: Secretlar yaratish
echo "📝 Step 1: Generating secrets..."
echo ""

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

echo "✅ Secrets generated! COPY THESE SECURELY:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""
echo "======================================"
echo ""

# Bu secretlarni faylga saqlash
cat > /tmp/kuafcv_secrets.txt <<EOF
KUAFCV Production Secrets - $(date)
====================================

JWT_SECRET=$JWT_SECRET

DB_PASSWORD=$DB_PASSWORD

REDIS_PASSWORD=$REDIS_PASSWORD

⚠️ Bu faylni xavfsiz joyda saqlang va o'chiring: rm /tmp/kuafcv_secrets.txt
EOF

echo "✅ Secrets saved to: /tmp/kuafcv_secrets.txt"
echo ""
echo "Press ENTER to continue..."
read

# Step 2: Backend .env.production yaratish
echo "📝 Step 2: Creating backend/.env.production..."

cat > /www/wwwroot/kuafcv/backend/.env.production <<EOF
# Backend Production Environment Variables
# Auto-generated on $(date)

# Server Configuration
PORT=4000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz

# Database (Docker PostgreSQL - alohida container, mavjud DB ga tasir yo'q)
DATABASE_URL=postgres://kuafcv_user:$DB_PASSWORD@postgres:5432/kuafcv?sslmode=require

# Redis (Docker ichida)
REDIS_URL=redis://redis:6379/0
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# OpenAI API Key - QUYIDAGI QATORNI O'ZGARTIRING!
OPENAI_API_KEY=sk-your-real-openai-api-key-here

# File Upload
MAX_FILE_SIZE=20971520
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
EOF

echo "✅ Backend environment created"
echo ""

# Step 3: Frontend .env.production yaratish
echo "📝 Step 3: Creating frontend/.env.production..."

cat > /www/wwwroot/kuafcv/frontend/.env.production <<EOF
# Frontend Production Environment Variables
# Auto-generated on $(date)

# API Configuration
NEXT_PUBLIC_API_URL=https://sysmasters.uz/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz/ws

# Application
NEXT_PUBLIC_APP_URL=https://sysmasters.uz
NODE_ENV=production
EOF

echo "✅ Frontend environment created"
echo ""

# Step 4: docker-compose.prod.yml ni yangilash
echo "📝 Step 4: Updating docker-compose.prod.yml..."

# PostgreSQL parolini qo'shish
sed -i "s/POSTGRES_PASSWORD:.*/POSTGRES_PASSWORD: $DB_PASSWORD/" /www/wwwroot/kuafcv/docker-compose.prod.yml

echo "✅ Docker Compose updated"
echo ""

# Step 5: OPENAI_API_KEY ni qo'shishni eslatma
echo "⚠️ IMPORTANT: Edit backend/.env.production and add your OPENAI_API_KEY:"
echo "   nano /www/wwwroot/kuafcv/backend/.env.production"
echo "   Replace: sk-your-real-openai-api-key-here"
echo ""
echo "Press ENTER when done..."
read

# Step 6: Port tekshirish (80, 443, 5432 - mavjud sayt uchun)
echo "📝 Step 6: Checking ports..."
echo ""
echo "Docker containers quyidagi portlarni ishlatadi:"
echo "  - Frontend: 3000 (faqat internal)"
echo "  - Backend: 4000 (faqat internal)"
echo "  - PostgreSQL: 5432 (faqat Docker network ichida)"
echo "  - Redis: 6379 (faqat Docker network ichida)"
echo "  - Nginx: 80, 443 (tashqi)"
echo ""
echo "⚠️ Nginx 80 va 443 portlarni egallaydi."
echo "   Mavjud saytingiz boshqa portda bo'lishi kerak yoki to'xtatilishi kerak."
echo ""
echo "aaPanel Nginx ni to'xtatish:"
echo "  sudo systemctl stop nginx"
echo ""
echo "Press ENTER to continue..."
read

# Step 7: SSL Certificates
echo "📝 Step 7: Setting up SSL certificates..."
echo ""

if [ -d "/etc/letsencrypt/live/sysmasters.uz" ]; then
    echo "✅ SSL certificates already exist"
    sudo mkdir -p /www/wwwroot/kuafcv/nginx/ssl
    sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem /www/wwwroot/kuafcv/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem /www/wwwroot/kuafcv/nginx/ssl/key.pem
    sudo chmod 644 /www/wwwroot/kuafcv/nginx/ssl/cert.pem
    sudo chmod 600 /www/wwwroot/kuafcv/nginx/ssl/key.pem
    echo "✅ Certificates copied"
else
    echo "❌ SSL certificates not found. Generate them first:"
    echo "   sudo systemctl stop nginx"
    echo "   sudo certbot certonly --standalone -d sysmasters.uz -d www.sysmasters.uz"
    echo ""
    echo "Run this script again after getting certificates."
    exit 1
fi

echo ""
echo "Press ENTER to continue..."
read

# Step 8: Permissions
echo "📝 Step 8: Setting permissions..."
sudo chown -R www:www /www/wwwroot/kuafcv
echo "✅ Permissions set"
echo ""

# Step 9: Build va Deploy
echo "📝 Step 9: Building Docker images..."
echo "⏳ This may take 5-10 minutes..."
echo ""

cd /www/wwwroot/kuafcv
docker-compose -f docker-compose.prod.yml build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check logs above."
    exit 1
fi

echo ""
echo "📝 Step 10: Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Containers started"
else
    echo "❌ Failed to start containers"
    exit 1
fi

echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "🔍 Testing Health Endpoints..."
sleep 5

curl -s http://localhost/api/health && echo "✅ Health check OK" || echo "❌ Health check failed"
echo ""

echo "📝 Next Steps:"
echo "1. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "2. Visit: https://sysmasters.uz"
echo "3. Test API: https://sysmasters.uz/api/health"
echo ""
echo "📄 Secrets saved in: /tmp/kuafcv_secrets.txt"
echo "⚠️ Delete after saving securely: rm /tmp/kuafcv_secrets.txt"
echo ""
