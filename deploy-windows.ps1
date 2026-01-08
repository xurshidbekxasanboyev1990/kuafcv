# KUAFCV Portfolio System - Windows Deployment Script
# For local development and testing

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "KUAFCV Deployment Script (Windows)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker or Docker Compose not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop for Windows" -ForegroundColor Red
    exit 1
}

# Step 2: Pull latest code (optional)
Write-Host ""
Write-Host "Step 2: Update code..." -ForegroundColor Yellow
$update = Read-Host "Pull latest code from GitHub? (y/n)"
if ($update -eq 'y') {
    git pull origin master
    Write-Host "✓ Code updated" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping code update" -ForegroundColor Yellow
}

# Step 3: Environment files
Write-Host ""
Write-Host "Step 3: Checking environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".\backend\.env.production")) {
    Write-Host "⚠ Backend .env.production not found!" -ForegroundColor Yellow
    $createEnv = Read-Host "Create from example? (y/n)"
    if ($createEnv -eq 'y') {
        Copy-Item ".\backend\.env.example" ".\backend\.env.production" -ErrorAction SilentlyContinue
        Write-Host "✓ Created backend/.env.production - PLEASE EDIT IT!" -ForegroundColor Green
        notepad ".\backend\.env.production"
    }
}

if (-not (Test-Path ".\frontend\.env.production")) {
    Write-Host "⚠ Frontend .env.production not found!" -ForegroundColor Yellow
    # Create frontend .env.production
    @"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NODE_ENV=production
"@ | Out-File -FilePath ".\frontend\.env.production" -Encoding UTF8
    Write-Host "✓ Created frontend/.env.production" -ForegroundColor Green
}

Write-Host "✓ Environment files ready" -ForegroundColor Green

# Step 4: SSL Certificates (self-signed for local development)
Write-Host ""
Write-Host "Step 4: SSL Certificates..." -ForegroundColor Yellow

if (-not (Test-Path ".\nginx\ssl\cert.pem")) {
    Write-Host "⚠ SSL certificates not found" -ForegroundColor Yellow
    Write-Host "For local development, we'll use HTTP only" -ForegroundColor Yellow
    Write-Host "For production with HTTPS, get certificates from Let's Encrypt" -ForegroundColor Yellow
}

# Step 5: Stop existing containers
Write-Host ""
Write-Host "Step 5: Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✓ Old containers stopped" -ForegroundColor Green

# Step 6: Build frontend
Write-Host ""
Write-Host "Step 6: Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✓ Frontend built successfully" -ForegroundColor Green

# Step 7: Build and start Docker containers
Write-Host ""
Write-Host "Step 7: Starting Docker containers..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Containers started" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start containers" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

# Step 8: Wait for services
Write-Host ""
Write-Host "Step 8: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check services
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose ps

# Step 9: Success message
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE! 🎉" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost" -ForegroundColor White
Write-Host "  Backend:   http://localhost/api" -ForegroundColor White
Write-Host "  Database:  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop all:      docker-compose down" -ForegroundColor White
Write-Host "  Restart:       docker-compose restart" -ForegroundColor White
Write-Host ""

$showLogs = Read-Host "Show recent logs? (y/n)"
if ($showLogs -eq 'y') {
    docker-compose logs --tail=50
}

Write-Host ""
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
