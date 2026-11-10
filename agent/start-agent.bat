@echo off
title School Cloud Print - Local Print Agent (Epson L6460)
cd /d %~dp0

echo ========================================================
echo   School Cloud Print - Local Print Agent (Epson L6460)  
echo   SMAN 3 Buru - Ruang Tata Usaha (TU)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan unduh dan pasang Node.js dari https://nodejs.org
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo Menginstal dependensi Print Agent...
    call npm install
)

if not exist dist\index.js (
    echo Mengompilasi Print Agent...
    call npm run build
)

echo Menghubungkan Local Agent ke Server Cloud TU...
call npm start
pause
