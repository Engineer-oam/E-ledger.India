@echo off
setlocal

echo 🚀 E-Ledger Blockchain System Setup
echo ===================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo ✅ Docker found

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please update it with your actual values.
) else (
    echo ✅ .env file already exists
)

REM Build Docker images
echo 🏗️  Building Docker images...
docker-compose build

REM Start services
echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Run health checks
echo 🩺 Running health checks...
node healthcheck.js

echo.
echo 🎉 Setup complete!
echo.
echo Access your application:
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📊 Monitoring: http://localhost:3002 (Grafana)
echo 📈 Metrics: http://localhost:9090 (Prometheus)
echo.
echo To stop services: docker-compose down
echo To view logs: docker-compose logs -f

pause