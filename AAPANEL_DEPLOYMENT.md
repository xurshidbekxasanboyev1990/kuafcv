# 🚀 aaPanel VPS Deployment Guide - sysmasters.uz

Ubuntu VPS + aaPanel bilan 0 dan deployment qo'llanmasi.

---

## 📋 Boshlash oldidan

### VPS Requirements:
- ✅ OS: Ubuntu 20.04/22.04 LTS
- ✅ RAM: Minimum 2GB (4GB tavsiya)
- ✅ CPU: 2 cores
- ✅ Disk: 20GB+
- ✅ Domain: sysmasters.uz (DNS A record → VPS IP)

---

## 🔧 Step 1: aaPanel O'rnatish (agar o'rnatilmagan bo'lsa)

### SSH orqali serverga kirish:

```bash
ssh root@your-vps-ip
```

### aaPanel o'rnatish:

```bash
# Ubuntu/Debian
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh && sudo bash install.sh aapanel
```

O'rnatishdan keyin aaPanel URL, username va parolni saqlang:

```
aaPanel URL: http://your-vps-ip:7800
Username: xxxxxxx
Password: xxxxxxx
```

---

## 🐳 Step 2: Docker O'rnatish

### aaPanel'da yoki SSH orqali:

```bash
# Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose o'rnatish
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Docker'ni ishga tushirish
sudo systemctl start docker
sudo systemctl enable docker

# Tekshirish
docker --version
docker-compose --version
```

---

## 📁 Step 3: Repository Clone Qilish

```bash
# Proyekt papkasini yaratish
sudo mkdir -p /opt/kuafcv
sudo chown -R $USER:$USER /opt/kuafcv
cd /opt

# Git o'rnatish (agar yo'q bo'lsa)
sudo apt update
sudo apt install git -y

# Repository clone
git clone https://github.com/xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv
```

---

## 🔑 Step 4: SSH Key Setup (GitHub uchun)

Agar private repository bo'lsa:

```bash
# SSH key yaratish
ssh-keygen -t ed25519 -C "xurshidbekxasanboyev1990@gmail.com" -f ~/.ssh/id_ed25519 -N ""

# Public key ko'rish
cat ~/.ssh/id_ed25519.pub

# Bu key'ni GitHub Settings → SSH keys ga qo'shing
# https://github.com/settings/ssh/new
```

---

## 🔐 Step 5: Secrets Generatsiya Qilish

### JWT Secret:

```bash
openssl rand -base64 64 | tr -d '\n' && echo
```

### Database Password:

```bash
openssl rand -base64 32 | tr -d '\n' && echo
```

### Redis Password:

```bash
openssl rand -base64 32 | tr -d '\n' && echo
```

**⚠️ Bu secretlarni xavfsiz joyda saqlang!**

---

## 📝 Step 6: Environment Files Sozlash

### Backend Environment:

```bash
nano /opt/kuafcv/backend/.env.production
```

Quyidagi qiymatlarni o'zgartiring:

```env
# Server Configuration
PORT=4000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz

# Database (Docker ichida)
DATABASE_URL=postgres://kuafcv_user:YOUR_DB_PASSWORD@postgres:5432/kuafcv?sslmode=require

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT Secret (yuqorida generatsiya qilgan)
JWT_SECRET=YOUR_64_CHAR_JWT_SECRET

# OpenAI API
OPENAI_API_KEY=sk-your-real-openai-key

# File Upload
MAX_FILE_SIZE=20971520

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Logging
LOG_FORMAT=json
LOG_LEVEL=info
```

Saqlash: `Ctrl+O`, `Enter`, Chiqish: `Ctrl+X`

### Frontend Environment:

```bash
nano /opt/kuafcv/frontend/.env.production
```

```env
NEXT_PUBLIC_API_URL=https://sysmasters.uz/api
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz/ws
NEXT_PUBLIC_APP_URL=https://sysmasters.uz
NODE_ENV=production
```

### Docker Compose Environment:

```bash
nano /opt/kuafcv/docker-compose.prod.yml
```

`postgres` servisida parolni o'zgartiring:

```yaml
postgres:
  environment:
    POSTGRES_DB: kuafcv
    POSTGRES_USER: kuafcv_user
    POSTGRES_PASSWORD: YOUR_DB_PASSWORD  # backend/.env.production bilan bir xil!
```

---

## 🔒 Step 7: SSL Certificate (Let's Encrypt)

### Certbot o'rnatish:

```bash
sudo apt update
sudo apt install certbot -y
```

### aaPanel'da Nginx to'xtatish (80 portni bo'shatish):

aaPanel → App Store → Nginx → Stop

Yoki SSH orqali:

```bash
sudo systemctl stop nginx
sudo systemctl stop aapanel
```

### SSL Sertifikat olish:

```bash
sudo certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email xurshidbekxasanboyev1990@gmail.com \
  --agree-tos \
  --non-interactive
```

### Sertifikatlarni proyektga nusxalash:

```bash
sudo mkdir -p /opt/kuafcv/nginx/ssl
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem /opt/kuafcv/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem /opt/kuafcv/nginx/ssl/key.pem
sudo chmod 644 /opt/kuafcv/nginx/ssl/cert.pem
sudo chmod 600 /opt/kuafcv/nginx/ssl/key.pem
sudo chown -R $USER:$USER /opt/kuafcv/nginx/ssl
```

### aaPanel Nginx'ni ishga tushirmaslik (Docker Nginx ishlatamiz):

```bash
sudo systemctl disable nginx
```

---

## 🐳 Step 8: Docker Build & Deploy

### Images build qilish:

```bash
cd /opt/kuafcv
docker-compose -f docker-compose.prod.yml build
```

Bu 5-10 daqiqa olishi mumkin.

### Services ishga tushirish:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Status tekshirish:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Barcha servislar "Up" bo'lishi kerak.

---

## ✅ Step 9: Verification

### Health Check:

```bash
curl http://localhost/api/health
# Expected: {"status":"ok","time":...}

curl http://localhost/api/ready
# Expected: {"status":"ready","database":"ok","redis":"ok"...}
```

### Brauzerda ochish:

- **Frontend:** https://sysmasters.uz
- **API Health:** https://sysmasters.uz/api/health

### Logs ko'rish:

```bash
# Barcha servislar
docker-compose -f docker-compose.prod.yml logs -f

# Faqat backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Faqat nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🔥 Step 10: Firewall Sozlash

### UFW (Ubuntu Firewall):

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 7800/tcp  # aaPanel (ixtiyoriy)
sudo ufw enable
sudo ufw status
```

---

## 💾 Step 11: Database Backup Cron Job

### Backup script'ni executable qilish:

```bash
chmod +x /opt/kuafcv/scripts/backup_database.sh
```

### Test backup:

```bash
/opt/kuafcv/scripts/backup_database.sh
```

### Cron job qo'shish (har kuni 2:00 AM):

```bash
crontab -e
```

Quyidagi qatorni qo'shing:

```
0 2 * * * /opt/kuafcv/scripts/backup_database.sh
```

---

## 🔄 Step 12: SSL Auto-Renewal

### Certbot renewal cron job:

```bash
crontab -e
```

Quyidagi qatorni qo'shing:

```
0 3 * * * certbot renew --quiet --deploy-hook "docker-compose -f /opt/kuafcv/docker-compose.prod.yml restart nginx"
```

---

## 🎯 Step 13: aaPanel Configuration (Ixtiyoriy)

### aaPanel da reverse proxy sozlash (agar Docker Nginx ishlatmasangiz):

1. aaPanel → Website → Add site
2. Domain: sysmasters.uz
3. Reverse Proxy → http://localhost:80 (Docker Nginx)

**Yoki Docker Nginx ishlatamiz (tavsiya)**

### aaPanel Monitoring:

- CPU/RAM/Disk monitoring
- Process Manager
- File Manager
- Terminal

---

## 🚨 Troubleshooting

### Port conflicts:

```bash
# Qaysi port band ekanini tekshirish
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# aaPanel Nginx to'xtatish
sudo systemctl stop nginx
```

### Docker containers ishlamasa:

```bash
# Logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop and remove
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Database migration:

```bash
# Database'ga kirish
docker exec -it kuafcv-postgres psql -U kuafcv_user -d kuafcv

# SQL fayllarni import qilish
docker exec -i kuafcv-postgres psql -U kuafcv_user -d kuafcv < database/schema.sql
```

### SSL certificate yangilanmasa:

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Sertifikatlarni qayta nusxalash
sudo cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem /opt/kuafcv/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem /opt/kuafcv/nginx/ssl/key.pem

# Nginx restart
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 Post-Deployment Monitoring

### Resource usage:

```bash
# Docker stats
docker stats

# System resources
htop  # (sudo apt install htop)

# Disk usage
df -h
du -sh /opt/kuafcv/*
```

### aaPanel Monitoring:

- Dashboard → System info
- Monitor → Resource usage
- Logs → Access logs, Error logs

---

## 🔄 Updates & Redeployment

```bash
cd /opt/kuafcv

# Pull yangi kod
git pull origin master

# Rebuild va restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl https://sysmasters.uz/api/health
```

---

## 📋 Checklist

- [ ] VPS tayyor (Ubuntu, 2GB+ RAM)
- [ ] aaPanel o'rnatilgan
- [ ] Docker & Docker Compose o'rnatilgan
- [ ] Repository clone qilingan
- [ ] Secrets generatsiya qilingan
- [ ] .env.production fayllar sozlangan
- [ ] SSL sertifikatlar olingan
- [ ] Docker containers ishga tushirilgan
- [ ] Health check muvaffaqiyatli
- [ ] Firewall sozlangan
- [ ] Backup cron job qo'shilgan
- [ ] SSL auto-renewal sozlangan
- [ ] Website ishlamoqda ✅

---

## 🎉 Final URLs

- **Production:** https://sysmasters.uz
- **API Health:** https://sysmasters.uz/api/health
- **aaPanel:** http://your-vps-ip:7800

---

**Deployment muvaffaqiyatli bo'lsin! 🚀**

**Savollar bo'lsa, har bir qadamni qadam-baqadam bajaring.**
