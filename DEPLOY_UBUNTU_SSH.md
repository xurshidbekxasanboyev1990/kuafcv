# 🚀 KUAFCV - Ubuntu Server Deployment Guide
## SSH: root@77.237.239.235

---

## 📋 Step-by-Step Deployment

### 1️⃣ Connect to Server

```bash
ssh root@77.237.239.235
```

### 2️⃣ Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git
apt install git -y

# Install Certbot (for SSL)
apt install certbot -y

# Verify installations
docker --version
docker-compose --version
git --version
```

### 3️⃣ Clone Repository

```bash
# Create directory
mkdir -p /opt
cd /opt

# Clone repository
git clone https://github.com/xurshidbekxasanboyev1990/kuafcv.git
cd kuafcv
```

### 4️⃣ Configure Environment Variables

#### Backend Environment:
```bash
nano backend/.env.production
```

Paste this (change passwords!):
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=kuafcv_user
DB_PASSWORD=KuafcvSecure2026!@#
DB_NAME=kuafcv_db
DB_SSLMODE=disable

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_2026
JWT_EXPIRY=24h

# Server
PORT=4000
GO_ENV=production

# CORS
CORS_ORIGINS=https://sysmasters.uz,https://www.sysmasters.uz

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
```

#### Frontend Environment:
```bash
nano frontend/.env.production
```

Paste this:
```env
NEXT_PUBLIC_API_URL=https://sysmasters.uz
NEXT_PUBLIC_WS_URL=wss://sysmasters.uz
NODE_ENV=production
```

### 5️⃣ Get SSL Certificates

#### Option A: Let's Encrypt (Recommended for Production)

```bash
# Stop any running web servers
systemctl stop nginx 2>/dev/null || true
docker-compose down 2>/dev/null || true

# Get certificate
certbot certonly --standalone \
  -d sysmasters.uz \
  -d www.sysmasters.uz \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Copy to nginx directory
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/sysmasters.uz/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/sysmasters.uz/privkey.pem nginx/ssl/
chmod 644 nginx/ssl/*.pem
```

#### Option B: Self-Signed (For Testing)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=sysmasters.uz"
```

### 6️⃣ Deploy with Docker

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Or manually:

```bash
# Stop old containers
docker-compose down

# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7️⃣ Verify Deployment

```bash
# Check containers
docker-compose ps

# Check backend health
curl http://localhost:4000/api/health

# Check frontend
curl http://localhost:3000

# Check all services
docker-compose logs --tail=50
```

### 8️⃣ Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Check status
ufw status
```

---

## 🔧 Alternative: Manual Docker Commands

```bash
# Pull latest code
cd /opt/kuafcv
git pull origin master

# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f nginx
```

---

## 📊 Service Management

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart backend
docker-compose restart frontend
```

### Stop/Start
```bash
# Stop all
docker-compose down

# Start all
docker-compose up -d
```

---

## 🗄️ Database Management

### Access Database
```bash
docker-compose exec postgres psql -U kuafcv_user -d kuafcv_db
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U kuafcv_user kuafcv_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U kuafcv_user kuafcv_db < backup_20260108.sql
```

---

## 🔄 SSL Certificate Auto-Renewal

```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 3am)
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/sysmasters.uz/*.pem /opt/kuafcv/nginx/ssl/ && docker-compose -f /opt/kuafcv/docker-compose.yml restart nginx
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker-compose logs [service-name]
docker-compose restart [service-name]
```

### Port already in use
```bash
# Find process using port
lsof -i :80
lsof -i :443

# Kill process
kill -9 [PID]
```

### Database issues
```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Connect to database
docker-compose exec postgres psql -U kuafcv_user -d kuafcv_db
```

### SSL issues
```bash
# Check certificate
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# Renew certificate
certbot renew
```

---

## 📈 Monitoring

### System Resources
```bash
# Container stats
docker stats

# Disk usage
df -h
docker system df
```

### Clean Up
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove all unused data
docker system prune -a
```

---

## ✅ Quick Commands Reference

```bash
# SSH to server
ssh root@77.237.239.235

# Navigate to project
cd /opt/kuafcv

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down && docker-compose up --build -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Backup database
docker-compose exec postgres pg_dump -U kuafcv_user kuafcv_db > backup.sql
```

---

## 🎯 Post-Deployment Checklist

- [ ] SSH access working
- [ ] Docker installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Services running (docker-compose ps)
- [ ] Frontend accessible (https://sysmasters.uz)
- [ ] Backend API working (https://sysmasters.uz/api/health)
- [ ] Database connected
- [ ] Firewall configured
- [ ] SSL auto-renewal configured

---

**Server**: 77.237.239.235  
**Domain**: sysmasters.uz  
**Location**: /opt/kuafcv  
**Services**: Frontend (3000), Backend (4000), Database (5432), Nginx (80/443)
