#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  Deploying School Cloud Print Station (aaPanel Ready)    "
echo "=========================================================="

if [ ! -f .env ]; then
  echo "[1/5] Membuat file .env dari .env.example..."
  cp .env.example .env
fi

echo "[2/5] Menginstal dependensi Node.js..."
npm install

echo "[3/5] Menyiapkan database SQLite & Prisma Client..."
npx prisma generate
npx prisma db push

echo "[4/5] Mem-build aplikasi Next.js untuk Production..."
npm run build

echo "[5/5] Selesai! Anda bisa menjalankan aplikasi di aaPanel dengan:"
echo "      - Node Project Manager: Startup File = server.js (Port 3000)"
echo "      - Atau via PM2: pm2 start ecosystem.config.js"
echo "=========================================================="
