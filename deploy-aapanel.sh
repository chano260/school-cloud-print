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

echo "[4/5] Membersihkan cache dan mem-build aplikasi Next.js untuk Production..."
rm -rf .next
npm run build

echo "[5/5] Memastikan proses server di-restart..."
if command -v pm2 &> /dev/null; then
  pm2 restart school-cloud-print 2>/dev/null || pm2 restart ecosystem.config.js 2>/dev/null || true
fi

echo "=========================================================="
echo "  SUKSES! Aplikasi telah selesai di-build dan di-deploy.  "
echo "  Buka aaPanel -> Website -> Node Project -> Restart.     "
echo "=========================================================="
