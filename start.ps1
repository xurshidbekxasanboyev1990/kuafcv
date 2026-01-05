# KUAFCV Portfolio Tizimi - Start Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    KUAFCV Portfolio Tizimi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Docker tekshirish
Write-Host "`n[1/4] Docker konteynerlarni ishga tushirish..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "✅ PostgreSQL va Redis ishga tushdi" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Docker ishlamadi. PostgreSQL va Redis qo'lda ishga tushiring." -ForegroundColor Red
}

# Kutish
Write-Host "`n[2/4] Database tayyorlanishini kutish (5 sekund)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Backend
Write-Host "`n[3/4] Backend serverni ishga tushirish..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; go run ."

# Kutish
Start-Sleep -Seconds 3

# Frontend
Write-Host "`n[4/4] Frontend serverni ishga tushirish..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm install; npm run dev"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    Tayyor!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackend:  http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "`nDemo login:" -ForegroundColor Yellow
Write-Host "  Admin: admin@kuafcv.uz / admin123" -ForegroundColor White
