# KUAFCV Alternative Portlarda Deployment (Mavjud sayt toxtatilmaydi)

## Sozlangan Portlar
- **HTTP**: 8080 (80-port bo'sh qoladi mavjud sayt uchun)
- **HTTPS**: 8443 (443-port bo'sh qoladi mavjud sayt uchun)
- **Backend**: 4000 (ichki)
- **Frontend**: 3000 (ichki)
- **PostgreSQL**: 5433 (5432-port bo'sh qoladi mavjud DB uchun)
- **Redis**: 6379 (ichki)

## VPS da bajarilishi kerak bo'lgan buyruqlar

### 1. Repositoryni yangilash
```bash
cd /www/wwwroot/kuafcv
git pull origin master
```

### 2. SSL Sertifikatlarini yaratish (Self-signed)
Ishlab chiqish uchun self-signed sertifikat yaratamiz:

```bash
cd /www/wwwroot/kuafcv
mkdir -p nginx/ssl

# Self-signed sertifikat yaratish
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=sysmasters.uz"

# Fayllarni tekshirish
ls -la nginx/ssl/
```

**YOKI Certbot bilan (port 80 kerak bo'lmaydi - DNS validation):**

```bash
# Certbot DNS plugin o'rnatish (agar domen provayderingiz qo'llab-quvvatlasa)
# Cloudflare misoli:
# snap install certbot-dns-cloudflare

# Yoki manual DNS validation:
certbot certonly --manual --preferred-challenges dns -d sysmasters.uz -d www.sysmasters.uz

# Sertifikatlarni nusxalash
cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem nginx/ssl/key.pem
```

### 3. Docker rasmlarini qurish
```bash
cd /www/wwwroot/kuafcv

# Backend
docker-compose -f docker-compose.prod.yml build backend

# Frontend (agar komponentlar topilmasa, avval git pull)
docker-compose -f docker-compose.prod.yml build frontend
```

### 4. Konteynerlarni ishga tushirish
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Holatni tekshirish
```bash
# Konteynerlar holatini ko'rish
docker-compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost:8080/api/health
curl http://localhost:8080/health

# SSL (self-signed bo'lsa -k kerak)
curl -k https://localhost:8443/api/health
```

## Tashqaridan kirish

### HTTP (port 8080)
```
http://77.237.239.235:8080
http://sysmasters.uz:8080
```

### HTTPS (port 8443)
```
https://77.237.239.235:8443
https://sysmasters.uz:8443
```

## Firewall sozlamalari (kerak bo'lsa)
```bash
# UFW ishlatilsa
ufw allow 8080/tcp
ufw allow 8443/tcp

# aaPanel firewall
# aaPanel → Security → Firewall → Add Port:
# - 8080 (HTTP)
# - 8443 (HTTPS)
```

## Environment Fayllarini Tekshirish

### Backend (.env.production)
```bash
cat backend/.env.production
```
Kerakli qiymatlar:
- PORT=4000
- DATABASE_URL=postgres://...@postgres:5432/kuafcv
- REDIS_URL=redis:6379
- JWT_SECRET=...
- OPENAI_API_KEY=... (haqiqiy API key)

### Frontend (.env.production)
```bash
cat frontend/.env.production
```
Kerakli qiymatlar:
```
NEXT_PUBLIC_API_URL=http://sysmasters.uz:8080/api
NEXT_PUBLIC_WS_URL=ws://sysmasters.uz:8080/ws
```

**YOKI HTTPS ishlatilsa:**
```
NEXT_PUBLIC_API_URL=https://sysmasters.uz:8443/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz:8443/ws
```

## Frontend Komponentlar Muammosi Yechimi

Agar frontend build paytida komponentlar topilmasa:

```bash
cd /www/wwwroot/kuafcv

# Repositoryni qayta klonlash
cd /www/wwwroot
rm -rf kuafcv
git clone git@github.com:xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv

# Yoki faqat frontend papkasini tekshirish
ls -la frontend/src/components/
ls -la frontend/src/lib/

# Agar fayllar yo'q bo'lsa, lokal mashinadan nusxalash:
# Lokal mashinada:
# scp -r C:\Users\user\Desktop\kuafcv\frontend\src root@77.237.239.235:/www/wwwroot/kuafcv/frontend/
```

## Docker Compose Boshqaruvi

### Konteynerlarni to'xtatish
```bash
docker-compose -f docker-compose.prod.yml down
```

### Konteynerlarni qayta ishga tushirish
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Bitta konteyner logini ko'rish
```bash
docker logs -f kuafcv-frontend
docker logs -f kuafcv-backend
docker logs -f kuafcv-nginx
```

### Volume va rasmlarni tozalash (EHTIYOT!)
```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

## Muammolarni bartaraf etish

### 1. Frontend komponentlar topilmayapti
```bash
# Git tekshirish
cd /www/wwwroot/kuafcv
git status
git log --oneline -5

# Fayllarni tekshirish
find frontend/src -name "*.tsx" -type f
```

### 2. Backend ulanmayapti
```bash
# Backend loglarini ko'rish
docker logs kuafcv-backend

# Database ulanishini tekshirish
docker exec -it kuafcv-db psql -U postgres -d kuafcv -c "\dt"
```

### 3. SSL sertifikat xatosi
```bash
# Self-signed sertifikatni qayta yaratish
rm -rf nginx/ssl/*
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=sysmasters.uz"
```

### 4. Port allaqachon band
```bash
# Portlarni tekshirish
netstat -tlnp | grep -E "8080|8443"
lsof -i :8080
lsof -i :8443

# Portni bo'shatish
kill -9 $(lsof -t -i:8080)
```

## Monitoring

### Real-time loglar
```bash
# Barcha konteynerlar
docker-compose -f docker-compose.prod.yml logs -f

# Faqat frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Faqat backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Resource ishlatish
```bash
docker stats
```

## Backup

### Database backup
```bash
docker exec kuafcv-db pg_dump -U postgres kuafcv > backup_$(date +%Y%m%d).sql
```

### Uploads backup
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz -C backend-go uploads/
```

## Production yaxshilash (ixtiyoriy)

### HTTPS ni majburiy qilish
Agar SSL sertifikat to'g'ri o'rnatilgan bo'lsa, nginx.conf da HTTP → HTTPS redirect qo'shish:

```nginx
server {
    listen 80;
    server_name sysmasters.uz www.sysmasters.uz;
    return 301 https://$host:8443$request_uri;
}
```

### Real SSL sertifikat (Certbot DNS)
```bash
# DNS TXT record orqali validatsiya
certbot certonly --manual --preferred-challenges dns -d sysmasters.uz

# Keyin ko'rsatilgan TXT recordni DNS provayderingizda qo'shing
# Va sertifikatlarni nusxalang
```

## Xulosa

✅ **Mavjud sayt** - 80 va 443 portlarda ishlay beradi  
✅ **KUAFCV** - 8080 va 8443 portlarda ishlaydi  
✅ **Database** - 5433 portda (5432 mavjud DB uchun)  
✅ **Bir-biriga ta'sir qilmaydi**

Sayt manzillari:
- Mavjud sayt: http://sysmasters.uz (port 80)
- KUAFCV: http://sysmasters.uz:8080 yoki https://sysmasters.uz:8443
