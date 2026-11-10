@echo off
title School Cloud Print - Local Agent (Epson L6460)
cd /d %~dp0

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ========================================================
    echo   Menjalankan Mode Uji Coba Lokal via Python...
    echo ========================================================
    echo Node.js belum terpasang di PC ini.
    echo Mengalihkan otomatis ke server uji coba mandiri...
    echo.
    python ..\app_local.py
    pause
    exit /b
)

echo ========================================================
echo   Menjalankan Local Print Agent untuk Epson L6460 (Node.js)
echo ========================================================
node src/index.js
pause
