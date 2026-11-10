# 🖨️ School Cloud Print Station (Epson EcoTank L6460)

Platform web terintegrasi dan agen pencetakan lokal untuk printer **Epson EcoTank L6460**, memungkinkan para guru mengunggah dokumen dari mana saja (rumah, kelas, smartphone) dengan login akun resmi **Belajar.id**, sistem antrean FIFO, batas kuota harian otomatis, fitur kunci dokumen rahasia (*Hold & Release*), serta pemantauan sensor kertas habis dan sisa tinta secara *real-time*.

---

## 🌟 Fitur Utama

1. **Akses Guru dari Mana Saja:** Login menggunakan Google SSO akun Belajar.id (`@guru.*.belajar.id`). Akun siswa (`@siswa.*`) diblokir otomatis.
2. **Whitelist Pegawai Sekolah:** Admin TU dapat mengunggah file Excel daftar guru yang berhak mencetak. Hanya email terdaftar yang dapat menggunakan sistem.
3. **Batas Kuota Harian:** Setiap guru memiliki kuota harian (default: 20 lembar/hari) yang otomatis di-reset setiap pukul 00:00 WIB.
4. **Kunci Dokumen Rahasia (*Hold & Release*):** Untuk berkas penting seperti soal ujian, guru dapat mencentang opsi "Kunci Dokumen". Berkas hanya akan keluar setelah guru berdiri di depan printer dan menekan tombol *"Rilis Sekarang"* dari HP-nya (otomatis melompat ke urutan terdepan / *priority jump*).
5. **Sensor Kertas Habis Real-Time:** Jika kertas di printer Epson habis, antrean otomatis dijeda dan muncul peringatan darurat merah di web guru dan TU.
6. **Pemantau Sisa Tinta & Maintenance Box:** Memantau persentase level 4 warna tinta (Hitam, Cyan, Magenta, Yellow) dan kapasitas kotak pembuangan (*waste box*).

---

## 📁 Struktur Direktori

```
school-cloud-print/
├── agent/                       # Local Print Agent (Dipasang di PC TU dekat printer)
│   ├── src/
│   │   ├── config.ts            # Konfigurasi IP printer & secret key
│   │   ├── oids.ts              # OID SNMP untuk sensor kertas & tinta
│   │   ├── snmp-monitor.ts      # Poller sensor UDP 161
│   │   ├── spooler.ts           # Spooler ke driver printer Epson L6460
│   │   └── index.ts             # Daemon client WebSocket
│   ├── package.json
│   └── start-agent.bat          # File sekali klik untuk menjalankan agent di Windows
├── prisma/
│   └── schema.prisma            # Skema database (Whitelist, Quota, Antrean, Telemetri)
├── src/
│   ├── app/                     # Halaman Web (Next.js App Router)
│   │   ├── page.tsx             # Portal Guru (Upload, Status Antrean, Sisa Kuota)
│   │   └── admin/page.tsx       # Dashboard TU (Whitelist Excel, Indikator Tinta)
│   ├── components/              # Komponen UI (UploadForm, QuotaCard, QueueList, dll)
│   ├── lib/                     # Logika Bisnis (Quota Ledger, Whitelist, PDF Calculator)
│   └── server/                  # WebSocket Hub (Socket.io)
├── docs/superpowers/
│   ├── specs/                   # Dokumen Desain Teknis (Design Doc)
│   └── plans/                   # Rencana Implementasi (Implementation Plan)
├── test_epson_lan.py            # Skrip Python untuk menguji koneksi lokal ke printer
└── README.md
```

---

## 🚀 Panduan Pemasangan & Menjalankan

### Langkah 1: Uji Koneksi Lokal ke Printer Epson L6460
Pastikan PC Anda terhubung ke Wi-Fi / kabel LAN yang sama dengan printer. Jalankan skrip uji:
```bash
python test_epson_lan.py
```
Masukkan alamat IP printer Anda (misal `192.168.1.150`). Skrip akan memeriksa apakah port cetak (9100) dan IPP (631) terbuka.

---

### Langkah 2: Menjalankan Web Portal Guru (Cloud / Server)
1. Salin `.env.example` menjadi `.env` dan sesuaikan nilainya:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="kunci-rahasia-anda"
   INITIAL_ADMIN_EMAIL="tu.sekolah@admin.smp.belajar.id"
   AGENT_SECRET_KEY="kunci-rahasia-agent-sekolah"
   ```
2. Pasang dependensi dan jalankan database:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```
3. Jalankan aplikasi web:
   ```bash
   npm run dev
   ```
   Web dapat dibuka di browser: `http://localhost:3000` (atau domain hosting Anda).

---

### Langkah 3: Menjalankan Local Print Agent di PC TU (Windows)
1. Buka folder `agent/` pada komputer ruang TU yang terhubung ke printer Epson L6460.
2. Buat file `.env` di dalam folder `agent/`:
   ```env
   CLOUD_SERVER_URL="https://web-print-sekolah-anda.com"
   AGENT_SECRET_KEY="kunci-rahasia-agent-sekolah"
   PRINTER_IP="192.168.1.150"
   WINDOWS_PRINTER_NAME="EPSON L6460 Series"
   ```
3. Pasang driver resmi **EPSON L6460 Series** di Windows Control Panel.
4. Jalankan agent dengan klik dua kali file **`agent/start-agent.bat`** (atau ketik `npm install && npm start` di folder `agent`).
5. Selesai! Agent akan otomatis tersambung ke web server, mulai memantau sensor kertas/tinta, dan mencetak berkas antrean guru.

---

## 🔒 Keamanan & Kebijakan Kuota

* **Pencegahan Over-Quota:** Sistem menerapkan *Two-Phase Quota Reservation*. Ketika guru mengunggah dokumen, kuota di-*hold* seketika untuk mencegah dua upload paralel melampaui kuota. Kuota resmi dipotong saat kertas berhasil keluar dari printer.
* **Reset Harian:** Kuota di-reset otomatis setiap pukul 00:00 WIB. Kuota hari ini tidak terakumulasi ke hari esok.
* **Kedaluwarsa Berkas Rahasia:** Dokumen terkunci yang tidak dirilis dalam 24 jam akan otomatis dibatalkan (*expired*) dan kuota guru dikembalikan.
